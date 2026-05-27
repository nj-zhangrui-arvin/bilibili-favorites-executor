# Bilibili Favorites Executor

[中文](README.md)

Bilibili Favorites Executor is a standalone Tampermonkey/userscript executor. It runs on your logged-in Bilibili favorites page and executes a reviewed task package with conservative pacing, local state backup, pause/recovery, and report export.

This repository only ships the **Executor**. It does not classify videos with AI and does not archive video content into a knowledge base.

## Component Boundary

- **Plan Generator**: reads favorite folders and video metadata, then produces a reviewed task package. Not included here.
- **Executor**: imports the task package and performs move/copy operations in the Bilibili page context. This repository.
- **Knowledge Collector**: archives metadata, subtitles, and summaries into a local knowledge base. A separate future project.

The task package is only for video favorite migration. Cleanup tools are independent page utilities and do not require a task package.

## Install

1. Install Tampermonkey.
2. Use the compressed install file: `bilibili_favorites_executor.min.user.js`.
3. Install the compressed script into Tampermonkey.
4. Use `bilibili_favorites_executor.user.js` for human review and debugging.
5. Open your Bilibili favorites page: `https://space.bilibili.com/.../favlist`.
6. The executor panel appears in the bottom-right corner.

## Files

- `bilibili_favorites_executor.min.user.js`: compressed install build for Tampermonkey.
- `bilibili_favorites_executor.user.js`: readable source for review and debugging.
- `scripts/build-minified-userscript.mjs`: builds the compressed install file from the readable source. It prefers temporary `terser` and falls back to a local conservative minifier.

## Quick Start

1. Prepare and review a task package. See [Task Package Schema](docs/task-package-schema.md).
2. Click `Choose File` in the panel and import the JSON package.
3. If target folders are missing, click `Create folders`.
4. Click `Backup` before running.
5. Run a small batch with `Run`, or confirm `Run all`.
6. Use `Pause` to stop after the current request.
7. Export a report or backup state after completion.

## Language

The UI defaults to Chinese. Use the `EN` button in the panel header to switch to English. The preference is stored in browser `localStorage`. The first open-source version translates the main UI, buttons, key prompts, and error prompts; existing logs are not rewritten.

## Safety

- Runs in the Bilibili page context and uses your current browser login.
- `move` is two-phase: add to target first, then remove from source.
- Uses random delays and rest intervals.
- Stops on `403`, `412`, login/csrf problems, or failed write API responses.
- Keeps local state in `localStorage` and supports JSON backup export.

See [Safety Model](docs/safety-model.md).

## Cleanup Tools

- `Clean invalid`: calls Bilibili clean per selected self-created folder.
- `Delete folders`: reads self-created folders, shows video counts, and deletes manually selected folders.

These tools are independent from the task package. See [Cleanup Tools](docs/cleanup-tools.md).

## Disclaimer

This is an unofficial local browser tool and is not affiliated with Bilibili. It does not upload Cookie, SESSDATA, csrf tokens, favorite lists, or task packages to third-party servers. Bulk operations may still trigger Bilibili risk controls. Back up before running, and use at your own risk.

## Development Check

```bash
node --check bilibili_favorites_executor.user.js
node --check bilibili_favorites_executor.min.user.js
node scripts/build-minified-userscript.mjs
python3 tests/test_static_contract.py
```

## License

MIT
