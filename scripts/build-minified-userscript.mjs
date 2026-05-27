#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "bilibili_favorites_executor.user.js");
const outputPath = path.join(root, "bilibili_favorites_executor.min.user.js");

const source = fs.readFileSync(sourcePath, "utf8");
const headerMatch = source.match(/^(\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==)\s*/);
if (!headerMatch) {
  throw new Error("Userscript metadata block not found");
}

const header = headerMatch[1];
const body = source.slice(headerMatch[0].length);

const word = /[A-Za-z0-9_$]/;

function isWordChar(char) {
  return word.test(char || "");
}

function needsSpace(prev, current) {
  if (!prev || !current) return false;
  if (isWordChar(prev) && isWordChar(current)) return true;
  if ((prev === "+" && current === "+") || (prev === "-" && current === "-")) return true;
  return false;
}

function regexCanStart(prevSignificant, previousWord) {
  if (!prevSignificant) return true;
  if ("([{=,:;!&|?+-*~^<>%".includes(prevSignificant)) return true;
  return /^(return|throw|case|delete|void|typeof|instanceof|in|new|yield|await)$/.test(previousWord || "");
}

function minifyJavaScript(input) {
  let out = "";
  let state = "normal";
  let quote = "";
  let escaped = false;
  let pendingSpace = false;
  let prevSignificant = "";
  let currentWord = "";
  let previousWord = "";
  let regexClass = false;

  const append = (char) => {
    if (state === "normal") {
      if (pendingSpace && needsSpace(prevSignificant, char)) out += " ";
      pendingSpace = false;
    }
    out += char;
    if (state === "normal" && !/\s/.test(char)) {
      prevSignificant = char;
      if (isWordChar(char)) {
        currentWord += char;
      } else if (currentWord) {
        previousWord = currentWord;
        currentWord = "";
      }
    }
  };

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (state === "line-comment") {
      if (char === "\n" || char === "\r") {
        state = "normal";
        pendingSpace = true;
      }
      continue;
    }

    if (state === "block-comment") {
      if (char === "*" && next === "/") {
        index += 1;
        state = "normal";
        pendingSpace = true;
      }
      continue;
    }

    if (state === "string" || state === "template") {
      append(char);
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        state = "normal";
      }
      continue;
    }

    if (state === "regex") {
      append(char);
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "[") {
        regexClass = true;
      } else if (char === "]") {
        regexClass = false;
      } else if (char === "/" && !regexClass) {
        state = "normal";
        prevSignificant = "/";
        pendingSpace = false;
        while (/[A-Za-z]/.test(input[index + 1] || "")) {
          index += 1;
          append(input[index]);
        }
      }
      continue;
    }

    if (/\s/.test(char)) {
      pendingSpace = true;
      if (currentWord) {
        previousWord = currentWord;
        currentWord = "";
      }
      continue;
    }

    if (char === "/" && next === "/") {
      if (currentWord) {
        previousWord = currentWord;
        currentWord = "";
      }
      state = "line-comment";
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      if (currentWord) {
        previousWord = currentWord;
        currentWord = "";
      }
      state = "block-comment";
      index += 1;
      continue;
    }

    if (char === "'" || char === "\"") {
      state = "string";
      quote = char;
      escaped = false;
      append(char);
      continue;
    }

    if (char === "`") {
      state = "template";
      quote = char;
      escaped = false;
      append(char);
      continue;
    }

    if (char === "/" && regexCanStart(prevSignificant, currentWord || previousWord)) {
      state = "regex";
      regexClass = false;
      escaped = false;
      append(char);
      continue;
    }

    append(char);
  }

  return out.trim();
}

function minifyWithTerser() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bili-executor-"));
  const bodyPath = path.join(tempDir, "body.js");
  const outputPath = path.join(tempDir, "body.min.js");
  fs.writeFileSync(bodyPath, body);
  execFileSync("npx", [
    "--yes",
    "terser",
    bodyPath,
    "-c",
    "-m",
    "--toplevel",
    "-o",
    outputPath,
  ], { stdio: "ignore" });
  return fs.readFileSync(outputPath, "utf8").trim();
}

let bodyMinified = "";
let minifier = "local";
try {
  bodyMinified = minifyWithTerser();
  minifier = "terser";
} catch {
  bodyMinified = minifyJavaScript(body);
}

const minified = `${header}\n${bodyMinified}\n`;
fs.writeFileSync(outputPath, minified);

const sourceBytes = Buffer.byteLength(source);
const outputBytes = Buffer.byteLength(minified);
const percent = ((1 - outputBytes / sourceBytes) * 100).toFixed(1);
console.log(`Wrote ${path.relative(root, outputPath)} via ${minifier} (${sourceBytes} -> ${outputBytes} bytes, -${percent}%)`);
