// ==UserScript==
// @name         Bilibili Favorites Organizer Executor
// @namespace    https://github.com/zhangrui/bilibili-favorites-executor
// @version      0.6.0
// @description  Execute reviewed Bilibili favorites move/copy plans through in-page fetch with conservative pacing.
// @match        https://space.bilibili.com/*/favlist*
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  const SCRIPT_VERSION = "0.6.0";
  const HEADER_BLOCKED_FLASH_MS = 6000;
  const MAX_MANUAL_BATCH_SIZE = 100;
  const FORCE_EXPORT_EVERY = 100;
  const LOG_RENDER_LIMIT = 200;
  const STORE_KEY = "biliOrganizerExecutor.v1";
  const SNAPSHOT_KEY = "biliOrganizerSnapshot.v1";
  const LANG_KEY = "biliOrganizerExecutor.lang";
  const PANEL_ID = "bili-organizer-executor-panel";
  const I18N = {
    "zh-CN": {
      appTitle: "Bilibili 收藏夹执行器 v{version}",
      languageSwitch: "EN",
      notBackedUp: "未备份",
      collapsedOpen: "展开",
      collapsedClose: "折叠",
      collapsePanel: "折叠面板",
      more: "更多",
      lessMore: "收起更多",
      pause: "暂停",
      pausing: "暂停中...",
      createMissingTargets: "创建缺失目标夹",
      execute: "执行",
      executeToCompletion: "执行到完成",
      backupProgress: "备份进度",
      unblock: "解除 blocked 标记",
      audit: "只读审计(慎用)",
      cleanupInvalid: "清理失效视频",
      deleteFolders: "删除收藏夹",
      exportReport: "导出执行报告",
      copySummary: "复制当前摘要",
      allLogs: "全部日志",
      importantLogs: "只看异常",
      clearDisplayedLogs: "清空显示日志",
      lastSaved: "上次保存",
      lastBackup: "上次备份",
      progressLegend: "进度条：绿色成功，黄色中间态，红色失败/blocked，灰色待执行",
      preflightPassed: "✓ 预检通过",
      nextNone: "下一条：无待执行任务",
      nextTask: "下一条",
      taskFlow: "当前任务流程",
      flowDoneAll: "全部完成",
      flowBlocked: "已挂起",
      flowAddCurrent: "1 添加目标夹 当前",
      flowAddDone: "1 添加目标夹 ✓",
      flowRemoveCurrent: "2 移出来源夹 当前",
      flowRemove: "2 移出来源夹",
      flowComplete2: "2 完成",
      flowComplete3: "3 完成",
      success: "成功",
      remaining: "剩余",
      failed: "失败",
      intermediate: "中间态",
      notRun: "未运行",
      allRemainingWrites: "全部剩余写请求",
      allEta: "全部预计",
      around: "约",
      runToCompletion: "执行到完成",
      remainingTasks: "剩余任务",
      remainingWrites: "剩余写请求",
      eta: "预计",
      thisRun: "本轮",
      thisRunRemaining: "本轮剩余",
      thisRunEta: "本轮预计",
      all: "全部",
      statusRunning: "执行中",
      statusBlocked: "已挂起",
      statusRecoverable: "中间态待恢复",
      statusNoPackage: "未导入",
      statusCompleted: "已完成",
      statusPaused: "已暂停",
      statusPreflightFailed: "预检未通过",
      statusReady: "就绪",
      headerBlocked: "已挂起：{detail}",
      batchTitle: "单次最多 {max} 条",
      auditConfirm: "只读审计会批量读取 B 站收藏夹列表，可能触发 412 风控。当前任务包 aid/目标夹完整时不需要执行。确认继续？",
      toCompletionConfirm: "执行到完成会持续写入剩余任务，每 {every} 条只提示备份，不会自动暂停。当前 pending {pending} 条。确认继续？",
      batchConfirm: "本次将连续执行 {size} 条。数量较大，建议确认已有最新状态备份；遇到风控仍会立即停止。确认继续？",
      invalidDialogTitle: "清理失效视频",
      invalidDialogMessage: "默认全选自建收藏夹；不会分页扫描视频，只逐个调用 B 站 clean 接口清理失效内容。触发 412/403 会立即停止。",
      invalidConfirm: "开始清理",
      deleteDialogTitle: "删除收藏夹",
      deleteDialogMessage: "列出页面读取到的收藏夹和视频数量。默认全不选，必须手动勾选。删除会连同夹内收藏关系一起移除，触发 412/403 会立即停止。",
      deleteConfirm: "删除选中收藏夹",
      deletePhrase: "删除收藏夹",
      cancel: "取消",
      confirm: "确认",
      selectedCount: "已选 {selected} / 可选 {selectable}",
      searchFolder: "搜索收藏夹",
      selectedOnly: "只看已选",
      selectVisible: "全选可见",
      deselectVisible: "可见全不选",
      invertVisible: "反选可见",
      phrasePlaceholder: "输入：{phrase}",
      phraseMismatch: "确认短语不匹配，需要输入：{phrase}",
      invalidNoFolders: "页面列表未就绪，未读取到可清理的自建收藏夹",
      deleteNoFolders: "页面列表未就绪，未读取到可删除收藏夹候选",
      clearedDisplayedLogs: "已清空当前显示日志，状态 JSON 仍保留最近日志",
    },
    en: {
      appTitle: "Bilibili Favorites Executor v{version}",
      languageSwitch: "中文",
      notBackedUp: "Not backed up",
      collapsedOpen: "Expand",
      collapsedClose: "Collapse",
      collapsePanel: "Collapse",
      more: "More",
      lessMore: "Less",
      pause: "Pause",
      pausing: "Pausing...",
      createMissingTargets: "Create folders",
      execute: "Run",
      executeToCompletion: "Run all",
      backupProgress: "Backup",
      unblock: "Reset blocked",
      audit: "Read-only audit",
      cleanupInvalid: "Clean invalid",
      deleteFolders: "Delete folders",
      exportReport: "Export report",
      copySummary: "Copy summary",
      allLogs: "All logs",
      importantLogs: "Issues only",
      clearDisplayedLogs: "Clear visible logs",
      lastSaved: "Last saved",
      lastBackup: "Last backup",
      progressLegend: "Progress: green success, yellow partial, red failed/blocked, gray pending",
      preflightPassed: "✓ Preflight passed",
      nextNone: "Next: no pending task",
      nextTask: "Next",
      taskFlow: "Current task flow",
      flowDoneAll: "All done",
      flowBlocked: "Blocked",
      flowAddCurrent: "1 Add to target current",
      flowAddDone: "1 Add to target ✓",
      flowRemoveCurrent: "2 Remove source current",
      flowRemove: "2 Remove source",
      flowComplete2: "2 Done",
      flowComplete3: "3 Done",
      success: "Success",
      remaining: "Remaining",
      failed: "Failed",
      intermediate: "Partial",
      notRun: "Not running",
      allRemainingWrites: "All remaining write requests",
      allEta: "All ETA",
      around: "around",
      runToCompletion: "Run all",
      remainingTasks: "remaining tasks",
      remainingWrites: "remaining writes",
      eta: "ETA",
      thisRun: "This run",
      thisRunRemaining: "this run remaining",
      thisRunEta: "this run ETA",
      all: "All",
      statusRunning: "Running",
      statusBlocked: "Blocked",
      statusRecoverable: "Partial recovery",
      statusNoPackage: "No package",
      statusCompleted: "Completed",
      statusPaused: "Paused",
      statusPreflightFailed: "Preflight failed",
      statusReady: "Ready",
      headerBlocked: "Blocked: {detail}",
      batchTitle: "Max {max} tasks per run",
      auditConfirm: "Read-only audit will read Bilibili favorite folders in bulk and may trigger 412 risk control. It is unnecessary when aid and target folders are complete. Continue?",
      toCompletionConfirm: "Run all will keep writing remaining tasks. Every {every} tasks it only suggests backup and will not auto-pause. Current pending: {pending}. Continue?",
      batchConfirm: "This will run {size} tasks continuously. Make sure you have a recent backup; risk control still stops immediately. Continue?",
      invalidDialogTitle: "Clean Invalid Videos",
      invalidDialogMessage: "Self-created folders are selected by default. This does not scan pages; it calls Bilibili clean per folder. 412/403 stops immediately.",
      invalidConfirm: "Start cleanup",
      deleteDialogTitle: "Delete Folders",
      deleteDialogMessage: "Lists page-read folders and video counts. Nothing is selected by default; choose manually. Deleting removes folder favorite relations too. 412/403 stops immediately.",
      deleteConfirm: "Delete selected folders",
      deletePhrase: "DELETE FOLDERS",
      cancel: "Cancel",
      confirm: "Confirm",
      selectedCount: "Selected {selected} / selectable {selectable}",
      searchFolder: "Search folders",
      selectedOnly: "Selected only",
      selectVisible: "Select visible",
      deselectVisible: "Deselect visible",
      invertVisible: "Invert visible",
      phrasePlaceholder: "Type: {phrase}",
      phraseMismatch: "Confirmation phrase mismatch. Type: {phrase}",
      invalidNoFolders: "Folder list is not ready; no cleanable self-created folders found",
      deleteNoFolders: "Folder list is not ready; no deletable folder candidates found",
      clearedDisplayedLogs: "Visible logs cleared. Recent logs remain in the state JSON.",
    },
  };
  const API = {
    resourceList: "https://api.bilibili.com/x/v3/fav/resource/list",
    addOrDel: "https://api.bilibili.com/x/v3/fav/resource/deal",
    resourceClean: "https://api.bilibili.com/x/v3/fav/resource/clean",
    folderCreatedListAll: "https://api.bilibili.com/x/v3/fav/folder/created/list-all",
    folderAdd: "https://api.bilibili.com/x/v3/fav/folder/add",
    folderDel: "https://api.bilibili.com/x/v3/fav/folder/del",
  };
  const STOP_HTTP_STATUS = new Set([403, 412]);
  const STOP_API_CODE = new Set([-101]);
  const TARGET_CREATE_PRIVACY = 1;
  const STEP_DELAY_MS = { min: 3000, max: 8000, mean: 5500, sd: 1500 };
  const REST_DELAY_MS = { min: 30000, max: 60000, mean: 45000, sd: 9000 };
  const LONG_REST_DELAY_MS = { min: 180000, max: 300000, mean: 240000, sd: 45000 };
  const CLEANUP_DELAY_MS = { min: 3000, max: 7000, mean: 5000, sd: 1000 };
  const CLEANUP_REST_MS = { min: 20000, max: 45000, mean: 32000, sd: 6000 };
  const DELETE_DELAY_MS = { min: 5000, max: 10000, mean: 7500, sd: 1200 };
  const DELETE_REST_MS = { min: 30000, max: 60000, mean: 45000, sd: 7000 };
  const BREAK_AFTER = { min: 10, max: 10 };
  const RESERVED_FOLDER_NAMES = new Set([
    "默认收藏夹",
  ]);

  const state = loadState();
  state.lang = state.lang || localStorage.getItem(LANG_KEY) || "zh-CN";
  localStorage.setItem(LANG_KEY, state.lang);
  state.log_filter = state.log_filter || "all";
  state.panel_collapsed = Boolean(state.panel_collapsed);
  state.advanced_visible = Boolean(state.advanced_visible);
  let running = false;
  let paused = false;
  const runProgress = {
    active: false,
    mode: "",
    target: 0,
    done: 0,
    startedSuccess: 0,
    startedPending: 0,
    toCompletion: false,
  };

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function currentLang() {
    return state.lang === "en" ? "en" : "zh-CN";
  }

  function t(key, vars = {}) {
    const template = I18N[currentLang()]?.[key] || I18N["zh-CN"][key] || key;
    return String(template).replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
  }

  function setLanguage(lang) {
    state.lang = lang === "en" ? "en" : "zh-CN";
    localStorage.setItem(LANG_KEY, state.lang);
    saveState();
    refreshPanel();
  }

  function toggleLanguage() {
    setLanguage(currentLang() === "en" ? "zh-CN" : "en");
  }

  function saveState(next = state) {
    next.script_version = SCRIPT_VERSION;
    next.lang = currentLang();
    next.log_filter = next.log_filter || "all";
    next.last_saved_at = nowLocal();
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
    const node = document.querySelector(`#${PANEL_ID} [data-role="last-saved"]`);
    if (node) node.textContent = next.last_saved_at || "-";
    const backupNode = document.querySelector(`#${PANEL_ID} [data-role="last-exported"]`);
    if (backupNode) backupNode.textContent = next.last_exported_at || t("notBackedUp");
  }

  function saveSnapshot(snapshot) {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  }

  function csrfToken() {
    const match = document.cookie.match(/(?:^|;\s*)bili_jct=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomNormalMs({ min, max, mean, sd }) {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return Math.round(Math.max(min, Math.min(max, mean + z * sd)));
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function nowLocal() {
    const date = new Date();
    const pad = (value, size = 2) => String(value).padStart(size, "0");
    return [
      date.getFullYear(),
      "-",
      pad(date.getMonth() + 1),
      "-",
      pad(date.getDate()),
      " ",
      pad(date.getHours()),
      ":",
      pad(date.getMinutes()),
      ":",
      pad(date.getSeconds()),
      ".",
      pad(date.getMilliseconds(), 3),
    ].join("");
  }

  async function sleepWithCountdown(ms, label) {
    const endAt = Date.now() + ms;
    while (Date.now() < endAt) {
      const remaining = Math.max(0, endAt - Date.now());
      setStatus(`${label}: 剩余 ${Math.ceil(remaining / 1000)} 秒`);
      await sleep(Math.min(1000, remaining));
    }
    setStatus(`${label}: 完成`);
  }

  function setStatus(message) {
    const node = document.querySelector(`#${PANEL_ID} [data-role="status"]`);
    if (node) node.textContent = message;
  }

  function isImportantLog(row) {
    return /失败|错误|blocked|熔断|412|403|csrf|验证码|登录|HTTP_|API_-101|WRITE_API_|挂起|failed|Error/i.test(row?.message || "");
  }

  function visibleLogs() {
    const rows = state.log || [];
    const filtered = rows.filter((row) => {
      if (state.log_view_cleared_at && row.ts <= state.log_view_cleared_at) return false;
      return state.log_filter === "important" ? isImportantLog(row) : true;
    });
    return filtered.slice(-LOG_RENDER_LIMIT);
  }

  function renderLog() {
    const node = document.querySelector(`#${PANEL_ID} [data-role="log"]`);
    if (!node) return;
    const rows = visibleLogs();
    node.textContent = rows.map((row) => `${row.ts} ${row.message}`).join("\n");
    node.scrollTop = node.scrollHeight;
    document.querySelectorAll(`#${PANEL_ID} [data-log-filter]`).forEach((button) => {
      const active = button.dataset.logFilter === (state.log_filter || "all");
      button.style.background = active ? "#2f6fed" : "";
      button.style.color = active ? "#fff" : "";
    });
  }

  function log(message) {
    state.log = state.log || [];
    state.log.push({ ts: nowLocal(), message });
    state.log = state.log.slice(-300);
    saveState();
    renderLog();
    setStatus(message);
  }

  function playAlertTone() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 880;
      gain.gain.value = 0.08;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        context.close();
      }, 450);
    } catch {
      // Browser audio may be blocked until user interaction; the visual alert is still shown.
    }
  }

  function showBlockedAlert(detail) {
    state.last_blocked_detail = detail;
    state.last_blocked_at = nowLocal();
    state.blocked_flash_until = Date.now() + HEADER_BLOCKED_FLASH_MS;
    const alert = document.querySelector(`#${PANEL_ID} [data-role="blocked-alert"]`);
    if (alert) {
      alert.textContent = t("headerBlocked", { detail });
      alert.style.display = "block";
    }
    renderHeaderBlockedAlert();
    playAlertTone();
    setTimeout(renderHeaderBlockedAlert, HEADER_BLOCKED_FLASH_MS + 100);
  }

  function hideBlockedAlert() {
    const alert = document.querySelector(`#${PANEL_ID} [data-role="blocked-alert"]`);
    if (alert) alert.style.display = "none";
    delete state.last_blocked_detail;
    delete state.last_blocked_at;
    delete state.blocked_flash_until;
    renderHeaderBlockedAlert();
  }

  function taskStats() {
    const tasks = state.package?.tasks || [];
    const counts = tasks.reduce((acc, task) => {
      acc[task.status || "pending"] = (acc[task.status || "pending"] || 0) + 1;
      return acc;
    }, {});
    return { total: tasks.length, counts };
  }

  function tasks() {
    return state.package?.tasks || [];
  }

  function executableStatuses() {
    return new Set(["pending", "failed", "added_to_target"]);
  }

  function nextExecutableTask() {
    return tasks().find((task) => executableStatuses().has(task.status || "pending")) || null;
  }

  function firstBlockingPreflight() {
    const result = preflight();
    return result.checks.find((check) => !check.ok && check.blocking) || null;
  }

  function globalStatus() {
    const stats = taskStats();
    if (running) return { label: t("statusRunning"), color: "#9fd3ff", background: "#12314a" };
    if (stats.counts.blocked) return { label: t("statusBlocked"), color: "#ffb3b3", background: "#4a1515" };
    if (stats.counts.added_to_target) return { label: t("statusRecoverable"), color: "#ffd479", background: "#4a3715" };
    if (!state.package) return { label: t("statusNoPackage"), color: "#ddd", background: "#333" };
    if (!nextExecutableTask()) return { label: t("statusCompleted"), color: "#bff5bf", background: "#173b1f" };
    if (paused) return { label: t("statusPaused"), color: "#ffd479", background: "#3b3217" };
    if (firstBlockingPreflight()) return { label: t("statusPreflightFailed"), color: "#ffb3b3", background: "#4a1515" };
    return { label: t("statusReady"), color: "#bff5bf", background: "#173b1f" };
  }

  function renderStatusBadge() {
    const node = document.querySelector(`#${PANEL_ID} [data-role="status-badge"]`);
    if (!node) return;
    const status = globalStatus();
    node.textContent = status.label;
    node.style.color = status.color;
    node.style.background = status.background;
  }

  function renderHeaderBlockedAlert() {
    const node = document.querySelector(`#${PANEL_ID} [data-role="header-blocked-alert"]`);
    if (!node) return;
    const stats = taskStats();
    const hasBlocked = Boolean(stats.counts.blocked || state.last_blocked_detail);
    if (!hasBlocked) {
      node.style.display = "none";
      node.textContent = "";
      node.style.boxShadow = "none";
      return;
    }
    const detail = state.last_blocked_detail || "存在 blocked 任务";
    node.style.display = "block";
    node.textContent = t("headerBlocked", { detail });
    const flashing = Date.now() < Number(state.blocked_flash_until || 0);
    node.style.boxShadow = flashing ? "0 0 0 2px rgba(255,92,92,.75), 0 0 16px rgba(255,92,92,.55)" : "none";
  }

  function renderProgressBar() {
    const bar = document.querySelector(`#${PANEL_ID} [data-role="progress-bar"]`);
    const legend = document.querySelector(`#${PANEL_ID} [data-role="progress-legend"]`);
    if (!bar || !legend) return;
    const stats = taskStats();
    const total = stats.total || 0;
    const success = stats.counts.success || 0;
    const added = stats.counts.added_to_target || 0;
    const failed = (stats.counts.failed || 0) + (stats.counts.blocked || 0);
    const pending = Math.max(0, total - success - added - failed);
    const segments = [
      ["success", success, "#29c76f"],
      ["added_to_target", added, "#f4c542"],
      ["failed_blocked", failed, "#ff5c5c"],
      ["pending", pending, "#555"],
    ];
    bar.innerHTML = "";
    for (const [name, count, color] of segments) {
      const segment = document.createElement("div");
      segment.dataset.segment = name;
      segment.style.cssText = `width:${total ? (count / total) * 100 : 0}%;background:${color};height:100%;min-width:0`;
      segment.title = `${name}: ${count}`;
      bar.appendChild(segment);
    }
    legend.textContent = t("progressLegend");
  }

  function preflight() {
    const packagePayload = state.package;
    const taskList = tasks();
    const targetFolders = packagePayload?.target_folders || [];
    const missingTargets = targetFolders.filter((folder) => !folder.folder_id).map((folder) => folder.folder_name);
    const missingAid = taskList.filter((task) => !aidFor(task)).map((task) => task.bvid);
    const added = taskList.filter((task) => task.status === "added_to_target");
    const blocked = taskList.filter((task) => task.status === "blocked");
    const checks = [
      { key: "package", label: "任务包", ok: Boolean(packagePayload), blocking: true, detail: packagePayload?.plan_name || "未导入" },
      { key: "targets", label: "目标夹 ID", ok: Boolean(packagePayload) && missingTargets.length === 0, blocking: true, detail: missingTargets.length ? `缺 ${missingTargets.length} 个` : "完整" },
      { key: "aid", label: "任务 aid", ok: Boolean(packagePayload) && missingAid.length === 0, blocking: true, detail: missingAid.length ? `缺 ${missingAid.length} 个` : "完整" },
      { key: "csrf", label: "csrf", ok: Boolean(csrfToken()), blocking: true, detail: csrfToken() ? "存在" : "缺少 bili_jct" },
      { key: "added", label: "中间态", ok: added.length === 0, blocking: false, detail: added.length ? `${added.length} 条待移除来源` : "无" },
      { key: "blocked", label: "blocked", ok: blocked.length === 0, blocking: true, detail: blocked.length ? `${blocked.length} 条需恢复` : "无" },
    ];
    return { checks, added, blocked, missingTargets, missingAid, nextTask: nextExecutableTask() };
  }

  function renderPreflight() {
    const node = document.querySelector(`#${PANEL_ID} [data-role="preflight"]`);
    if (!node) return;
    const result = preflight();
    node.innerHTML = "";
    const hasBlockingFailure = result.checks.some((check) => !check.ok && check.blocking);
    const hasWarning = result.checks.some((check) => !check.ok && !check.blocking);
    if (!state.advanced_visible && !hasBlockingFailure && !hasWarning) {
      const row = document.createElement("div");
      row.textContent = t("preflightPassed");
      row.style.color = "#bff5bf";
      node.appendChild(row);
      return;
    }
    for (const check of result.checks) {
      const row = document.createElement("div");
      row.textContent = `${check.ok ? "✓" : check.blocking ? "✗" : "!"} ${check.label}: ${check.detail}`;
      row.style.color = check.ok ? "#bff5bf" : check.blocking ? "#ffb3b3" : "#ffd479";
      node.appendChild(row);
    }
  }

  function renderNextTask() {
    const node = document.querySelector(`#${PANEL_ID} [data-role="next-task"]`);
    if (!node) return;
    const task = nextExecutableTask();
    if (!task) {
      node.textContent = t("nextNone");
      return;
    }
    const mode = task.status === "added_to_target" ? "恢复 remove source" : task.action;
    const index = tasks().findIndex((row) => row === task);
    const title = task.title || "";
    node.textContent = `${t("nextTask")}：#${index + 1}/${tasks().length} ${task.operation_id} | ${mode} | ${task.source_folder || "-"} -> ${task.target_folder || "-"} | ${title.length > 64 ? `${title.slice(0, 64)}...` : title}`;
  }

  function flowStep(label, stateName) {
    const node = document.createElement("span");
    const styles = {
      done: "background:#153d22;color:#bff5bf;border-color:#2ca765",
      current: "background:#4a3715;color:#ffd479;border-color:#d79d23",
      pending: "background:#2a2a2a;color:#aaa;border-color:#4a4a4a",
      blocked: "background:#4a1515;color:#ffb3b3;border-color:#cc4444",
    };
    node.textContent = label;
    node.style.cssText = [
      "display:inline-flex",
      "align-items:center",
      "min-height:24px",
      "padding:3px 8px",
      "border:1px solid",
      "border-radius:999px",
      "font-weight:700",
      "white-space:nowrap",
      styles[stateName] || styles.pending,
    ].join(";");
    return node;
  }

  function flowArrow() {
    const node = document.createElement("span");
    node.textContent = "->";
    node.style.cssText = "color:#777;font-weight:700";
    return node;
  }

  function renderTaskFlow() {
    const node = document.querySelector(`#${PANEL_ID} [data-role="task-flow"]`);
    if (!node) return;
    const task = nextExecutableTask();
    node.innerHTML = "";
    const title = document.createElement("div");
    title.textContent = t("taskFlow");
    title.style.cssText = "margin-bottom:5px;color:#ddd;font-weight:800";
    const steps = document.createElement("div");
    steps.style.cssText = "display:flex;align-items:center;gap:6px;flex-wrap:wrap";
    if (!task) {
      steps.append(flowStep(t("flowDoneAll"), "done"));
      node.append(title, steps);
      return;
    }
    if (task.status === "blocked") {
      steps.append(flowStep(t("flowBlocked"), "blocked"));
      node.append(title, steps);
      return;
    }
    if (task.action === "copy") {
      steps.append(flowStep(t("flowAddCurrent"), "current"), flowArrow(), flowStep(t("flowComplete2"), "pending"));
      node.append(title, steps);
      return;
    }
    if (task.action === "move" && task.status === "added_to_target") {
      steps.append(flowStep(t("flowAddDone"), "done"), flowArrow(), flowStep(t("flowRemoveCurrent"), "current"), flowArrow(), flowStep(t("flowComplete3"), "pending"));
      node.append(title, steps);
      return;
    }
    steps.append(flowStep(t("flowAddCurrent"), "current"), flowArrow(), flowStep(t("flowRemove"), "pending"), flowArrow(), flowStep(t("flowComplete3"), "pending"));
    node.append(title, steps);
  }

  function setElementDisabled(element, disabled) {
    element.disabled = disabled;
    element.style.opacity = disabled ? "0.55" : "1";
  }

  function setExecutionControlsEnabled(enabled) {
    document.querySelectorAll(`#${PANEL_ID} [data-exec-control="true"]`).forEach((button) => {
      setElementDisabled(button, !enabled || running);
    });
    document.querySelectorAll(`#${PANEL_ID} [data-run-lock="true"]`).forEach((control) => {
      setElementDisabled(control, running);
    });
    const pauseButton = document.querySelector(`#${PANEL_ID} [data-role="pause-button"]`);
    if (pauseButton) {
      pauseButton.textContent = running && paused ? t("pausing") : t("pause");
      setElementDisabled(pauseButton, !running || paused);
    }
  }

  function refreshPanel() {
    const stats = taskStats();
    const summary = document.querySelector(`#${PANEL_ID} [data-role="summary"]`);
    if (summary) {
      summary.textContent = [
        `${t("success")} ${stats.counts.success || 0}/${stats.total}`,
        `${t("remaining")} ${stats.counts.pending || 0}`,
        `${t("failed")} ${stats.counts.failed || 0}`,
        `blocked ${stats.counts.blocked || 0}`,
        `${t("intermediate")} ${stats.counts.added_to_target || 0}`,
      ].join(" · ");
    }
    renderStatusBadge();
    renderHeaderBlockedAlert();
    renderProgressBar();
    renderPreflight();
    renderNextTask();
    renderTaskFlow();
    renderRunProgress();
    renderLog();
    renderCollapsedState();
    renderAdvancedState();
    renderConditionalControls();
    renderI18nLabels();
    setExecutionControlsEnabled(!firstBlockingPreflight());
  }

  function renderRunProgress() {
    const node = document.querySelector(`#${PANEL_ID} [data-role="run-progress"]`);
    if (!node) return;
    const allTasks = remainingExecutableTasks();
    const allEta = estimateTasksTime(allTasks);
    const pause = pauseCounters();
    if (!runProgress.active) {
      node.textContent = `${t("thisRun")}：${t("notRun")} · ${t("allRemainingWrites")} ${allEta.writeOps} · ${t("allEta")} ${allEta.range}，${t("around")} ${allEta.finishWindow}`;
      node.title = pause;
      setStatus(pause);
      return;
    }
    const target = Math.max(0, Number(runProgress.target) || 0);
    const remaining = Math.max(0, target - runProgress.done);
    if (runProgress.toCompletion) {
      node.textContent = `${t("runToCompletion")}：${runProgress.done}/${target} · ${t("remainingTasks")} ${allTasks.length} · ${t("remainingWrites")} ${allEta.writeOps} · ${t("eta")} ${allEta.range}，${t("around")} ${allEta.finishWindow}`;
      node.title = pause;
      setStatus(pause);
      return;
    }
    const runTasks = allTasks.slice(0, remaining);
    const runEta = estimateTasksTime(runTasks);
    node.textContent = [
      `${t("thisRun")}：${runProgress.mode} ${runProgress.done}/${target} · ${t("thisRunRemaining")} ${remaining} · ${t("thisRunEta")} ${runEta.range}，${t("around")} ${runEta.finishWindow}`,
      `${t("all")}：${t("remainingTasks")} ${allTasks.length} · ${t("remainingWrites")} ${allEta.writeOps} · ${t("allEta")} ${allEta.range}，${t("around")} ${allEta.finishWindow}`,
    ].join(" | ");
    node.title = pause;
    setStatus(pause);
  }

  function remainingExecutableTasks() {
    return tasks().filter((task) => executableStatuses().has(task.status || "pending"));
  }

  function estimateRemainingTime() {
    return estimateTasksTime(remainingExecutableTasks());
  }

  function estimateTasksTime(taskList) {
    if (!taskList.length) return { range: "0 分钟", finishWindow: "已完成", writeOps: 0 };
    const writeOps = taskList.reduce((sum, task) => sum + (task.action === "move" && task.status !== "added_to_target" ? 2 : 1), 0);
    const taskCount = taskList.length;
    const stepMin = writeOps * 3 + taskCount * 3;
    const stepMax = writeOps * 8 + taskCount * 8;
    const restCount = Math.floor(taskCount / 10);
    const longRestCount = Math.floor(taskCount / 50);
    const minSeconds = stepMin + restCount * 30 + longRestCount * 180;
    const maxSeconds = stepMax + restCount * 60 + longRestCount * 300;
    return {
      range: `${formatDuration(minSeconds)}-${formatDuration(maxSeconds)}`,
      finishWindow: `${formatClock(Date.now() + minSeconds * 1000)}-${formatClock(Date.now() + maxSeconds * 1000)}`,
      writeOps,
    };
  }

  function pauseCounters() {
    const nextShort = Math.max(0, (state.next_rest_after || BREAK_AFTER.max) - (state.completed_since_rest || 0));
    const nextLong = Math.max(0, 50 - (state.completed_since_long_rest || 0));
    const nextExport = Math.max(0, FORCE_EXPORT_EVERY - (state.completed_since_export || 0));
    const backupHint = nextExport === 0 ? "已到备份点：建议本轮结束后点击备份进度" : `备份提醒还差 ${nextExport} 条`;
    return `下次短休还差 ${nextShort} 条；长休还差 ${nextLong} 条；${backupHint}`;
  }

  function formatDuration(seconds) {
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) return `${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;
    return restMinutes ? `${hours}小时${restMinutes}分钟` : `${hours}小时`;
  }

  function formatClock(timestamp) {
    const date = new Date(timestamp);
    const pad = (value) => String(value).padStart(2, "0");
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function buildStatusSummary() {
    const stats = taskStats();
    const eta = estimateRemainingTime();
    const status = globalStatus();
    const next = nextExecutableTask();
    const preflightRows = preflight().checks.map((check) => `${check.ok ? "OK" : "NG"} ${check.label}: ${check.detail}`);
    return [
      `Bilibili 收藏夹执行器 v${SCRIPT_VERSION}`,
      `状态: ${status.label}`,
      `任务包: ${state.package?.plan_name || "未导入"}`,
      `总数: ${stats.total}`,
      `success: ${stats.counts.success || 0}`,
      `pending: ${stats.counts.pending || 0}`,
      `failed: ${stats.counts.failed || 0}`,
      `blocked: ${stats.counts.blocked || 0}`,
      `added_to_target: ${stats.counts.added_to_target || 0}`,
      `页面自建收藏夹: ${extractCreatedFoldersFromPage().filter((folder) => folder.folder_id).length}`,
      `可删除收藏夹候选: ${folderDeletionTargets().length}`,
      `全部剩余写请求: ${eta.writeOps}`,
      `全部预计完成: ${eta.range}，约 ${eta.finishWindow}`,
      `上次保存: ${state.last_saved_at || "-"}`,
      `节奏提示: ${pauseCounters()}`,
      `下一条: ${next ? `${next.operation_id} | ${next.action} | ${next.bvid} | ${next.source_folder || "-"} -> ${next.target_folder || "-"} | ${next.title || ""}` : "无"}`,
      "",
      "预检:",
      ...preflightRows,
    ].join("\n");
  }

  function buildMarkdownReport() {
    const logs = (state.log || []).slice(-60).map((row) => `- ${row.ts} ${row.message}`);
    return [
      `# Bilibili 收藏夹执行报告`,
      "",
      "```text",
      buildStatusSummary(),
      "```",
      "",
      "## 最近日志",
      ...(logs.length ? logs : ["- 无"]),
      "",
    ].join("\n");
  }

  async function copyStatusSummary() {
    const text = buildStatusSummary();
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    log("已复制当前摘要");
  }

  function exportReport() {
    const stats = taskStats();
    const blob = new Blob([buildMarkdownReport()], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = nowLocal().replace(/\D/g, "").slice(0, 14);
    a.download = `bili-report-v${SCRIPT_VERSION}-success-${stats.counts.success || 0}-${stamp}.md`;
    a.click();
    URL.revokeObjectURL(url);
    log("已导出执行报告");
  }

  function renderCollapsedState() {
    const body = document.querySelector(`#${PANEL_ID} [data-role="panel-body"]`);
    const toggle = document.querySelector(`#${PANEL_ID} [data-role="collapse-toggle"]`);
    if (body) body.style.display = state.panel_collapsed ? "none" : "block";
    if (toggle) toggle.textContent = state.panel_collapsed ? t("collapsedOpen") : t("collapsedClose");
  }

  function renderAdvancedState() {
    const advanced = document.querySelector(`#${PANEL_ID} [data-role="advanced-panel"]`);
    const toggle = document.querySelector(`#${PANEL_ID} [data-role="advanced-toggle"]`);
    if (advanced) advanced.style.display = state.advanced_visible ? "block" : "none";
    if (toggle) toggle.textContent = state.advanced_visible ? t("lessMore") : t("more");
  }

  function renderConditionalControls() {
    const stats = taskStats();
    document.querySelectorAll(`#${PANEL_ID} [data-show-when]`).forEach((node) => {
      const mode = node.dataset.showWhen;
      const visible = (mode === "blocked" && Boolean(stats.counts.blocked)) || (mode === "added" && Boolean(stats.counts.added_to_target));
      node.style.display = visible ? "" : "none";
    });
  }

  function renderI18nLabels() {
    const title = document.querySelector(`#${PANEL_ID} [data-role="panel-title"]`);
    if (title) title.textContent = t("appTitle", { version: SCRIPT_VERSION });
    const lang = document.querySelector(`#${PANEL_ID} [data-role="language-toggle"]`);
    if (lang) lang.textContent = t("languageSwitch");
    const batch = document.querySelector(`#${PANEL_ID} [data-role="batch-size"]`);
    if (batch) batch.title = t("batchTitle", { max: MAX_MANUAL_BATCH_SIZE });
    const lastSaved = document.querySelector(`#${PANEL_ID} [data-role="last-saved-row"]`);
    if (lastSaved) {
      lastSaved.innerHTML = [
        `${t("lastSaved")}：<span data-role="last-saved">${state.last_saved_at || "-"}</span>`,
        ` · ${t("lastBackup")}：<span data-role="last-exported">${state.last_exported_at || t("notBackedUp")}</span>`,
      ].join("");
    }
    document.querySelectorAll(`#${PANEL_ID} [data-i18n]`).forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
  }

  async function apiGet(url, params) {
    const nextUrl = new URL(url);
    for (const [key, value] of Object.entries(params)) {
      nextUrl.searchParams.set(key, String(value));
    }
    const response = await fetch(nextUrl.toString(), {
      credentials: "include",
      headers: { accept: "application/json, text/plain, */*" },
    });
    if (STOP_HTTP_STATUS.has(response.status)) throw new Error(`HTTP_${response.status}`);
    const payload = await response.json();
    if (STOP_API_CODE.has(payload.code)) throw new Error(`API_${payload.code}_${payload.message || ""}`);
    return payload;
  }

  async function apiPost(url, body) {
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: new URLSearchParams(body).toString(),
    });
    if (STOP_HTTP_STATUS.has(response.status)) throw new Error(`HTTP_${response.status}`);
    const payload = await response.json();
    if (STOP_API_CODE.has(payload.code)) throw new Error(`API_${payload.code}_${payload.message || ""}`);
    return payload;
  }

  async function fetchFolderPage(mediaId, page, pageSize) {
    return apiGet(API.resourceList, {
      media_id: mediaId,
      pn: page,
      ps: pageSize,
      keyword: "",
      order: "mtime",
      type: 0,
      tid: 0,
      platform: "web",
    });
  }

  async function fetchFolderSnapshot(folder) {
    const bvids = new Set();
    const aids = new Map();
    const pageSize = 20;
    let total = null;
    let emptyPages = 0;
    for (let page = 1; page <= 100; page += 1) {
      const payload = await fetchFolderPage(folder.folder_id, page, pageSize);
      if (payload.code !== 0) throw new Error(`resource/list ${folder.folder_name}: ${payload.code} ${payload.message || ""}`);
      const data = payload.data || {};
      total = data.info?.media_count ?? total;
      const medias = data.medias || [];
      emptyPages = medias.length ? 0 : emptyPages + 1;
      for (const media of medias) {
        if (media.bvid) bvids.add(media.bvid);
        if (media.bvid && media.id) aids.set(media.bvid, media.id);
      }
      const knownTotalReached = total !== null && page * pageSize >= total;
      if (knownTotalReached || emptyPages >= 3) break;
      await sleep(randInt(250, 750));
    }
    return {
      folder_id: folder.folder_id,
      folder_name: folder.folder_name,
      total,
      bvids: [...bvids],
      aids: Object.fromEntries(aids),
    };
  }

  function aidFromBvid(bvid) {
    const table = "FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf";
    const xorCode = 23442827791579n;
    const maskCode = 2251799813685247n;
    const base = 58n;
    if (!/^BV[a-zA-Z0-9]{10}$/.test(bvid || "")) return "";
    const bvidArr = Array.from(bvid);
    [bvidArr[3], bvidArr[9]] = [bvidArr[9], bvidArr[3]];
    [bvidArr[4], bvidArr[7]] = [bvidArr[7], bvidArr[4]];
    const payload = bvidArr.slice(3);
    let value = 0n;
    for (const char of payload) {
      const idx = table.indexOf(char);
      if (idx < 0) return "";
      value = value * base + BigInt(idx);
    }
    return String((value & maskCode) ^ xorCode);
  }

  function fillMissingAidsByBvidDecode(snapshot) {
    const tasks = state.package?.tasks || [];
    const uniqueBvids = [...new Set(tasks.map((task) => task.bvid).filter(Boolean))];
    const missing = uniqueBvids.filter((bvid) => !snapshot.aid_by_bvid?.[bvid]);
    if (!missing.length) return [];
    let filled = 0;
    for (const bvid of missing) {
      const aid = aidFromBvid(bvid);
      if (aid) {
        snapshot.aid_by_bvid[bvid] = aid;
        filled += 1;
      }
    }
    log(`本地 BV 解码补 aid: ${filled}/${missing.length}`);
    return uniqueBvids.filter((bvid) => !snapshot.aid_by_bvid?.[bvid]);
  }

  async function auditReadOnly() {
    if (!state.package) throw new Error("请先导入任务包 JSON");
    const folders = state.package.source_folders || [];
    const targetFolders = state.package.target_folders || [];
    const byId = new Map();
    for (const folder of [...folders, ...targetFolders]) {
      if (folder.folder_id) byId.set(String(folder.folder_id), folder);
    }
    if (state.package.missing_target_folders?.length) {
      throw new Error(`缺失目标夹: ${state.package.missing_target_folders.join(", ")}`);
    }
    const snapshot = { captured_at: nowLocal(), folders: {} };
    for (const folder of byId.values()) {
      log(`只读审计: ${folder.folder_name}`);
      snapshot.folders[folder.folder_id] = await fetchFolderSnapshot(folder);
    }
    const aidByBvid = {};
    for (const folder of Object.values(snapshot.folders)) {
      Object.assign(aidByBvid, folder.aids || {});
    }
    snapshot.aid_by_bvid = aidByBvid;
    const stillMissingAid = fillMissingAidsByBvidDecode(snapshot);
    const missingAid = stillMissingAid.length
      ? stillMissingAid
      : (state.package.tasks || []).filter((task) => !snapshot.aid_by_bvid[task.bvid]).map((task) => task.bvid);
    snapshot.missing_aid_bvids = [...new Set(missingAid)];
    saveSnapshot(snapshot);
    state.snapshot = { captured_at: snapshot.captured_at, missing_aid_bvids: snapshot.missing_aid_bvids };
    saveState();
    log(`只读审计完成: folders=${Object.keys(snapshot.folders).length}, missing_aid=${snapshot.missing_aid_bvids.length}`);
    refreshPanel();
    return snapshot;
  }

  function auditReadOnlyWithConfirm() {
    const ok = window.confirm(t("auditConfirm"));
    if (!ok) {
      log("已取消只读审计");
      return Promise.resolve();
    }
    return auditReadOnly();
  }

  function normalizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function parseFolderIdFromNode(node) {
    const link = node.matches?.("a") ? node : node.querySelector?.("a[href*='favlist']");
    const href = link?.href || link?.getAttribute?.("href") || "";
    if (href) {
      try {
        const url = new URL(href, location.href);
        const fid = url.searchParams.get("fid") || url.searchParams.get("media_id");
        if (/^\d+$/.test(fid || "")) return fid;
      } catch {
        // Ignore invalid hrefs and continue with DOM attributes.
      }
    }
    const candidates = [node.dataset?.id, node.dataset?.fid, node.dataset?.mediaId, node.id]
      .map((value) => String(value || "").match(/\d+/)?.[0] || "")
      .filter(Boolean);
    return candidates.find((value) => /^\d+$/.test(value)) || "";
  }

  function currentUrlFolderId() {
    try {
      const fid = new URL(location.href).searchParams.get("fid");
      return /^\d+$/.test(fid || "") ? fid : "";
    } catch {
      return "";
    }
  }

  function currentSpaceMid() {
    const match = location.pathname.match(/\/(\d+)\/favlist/);
    return match?.[1] || "";
  }

  function isCurrentFolderNode(node) {
    const className = String(node.className || "");
    return /\b(active|selected|current|is-active)\b/i.test(className) || Boolean(node.getAttribute?.("aria-current"));
  }

  function parseFolderCountFromNode(node) {
    const countNode = node.querySelector?.(".vui_sidebar-item-right,[class*='right'],[class*='count']");
    const countText = normalizeText(countNode?.textContent || "");
    const direct = countText.match(/\d+/)?.[0];
    if (direct) return Number.parseInt(direct, 10);
    const text = normalizeText(node.textContent || "");
    const trailing = text.match(/(\d+)\s*$/)?.[1];
    return trailing ? Number.parseInt(trailing, 10) : null;
  }

  function folderRowForNode(node) {
    const closestSelectors = [
      ".fav-sidebar-item",
      ".vui_sidebar-item",
      "[class*='fav-sidebar-item']",
      "[class*='sidebar-item']",
      "[class*='SidebarItem']",
    ];
    for (const selector of closestSelectors) {
      const closest = node.closest?.(selector);
      if (closest) return closest;
    }
    let current = node;
    for (let depth = 0; current && depth < 4; depth += 1, current = current.parentElement) {
      const text = normalizeText(current.textContent || "");
      if (text && text.length <= 100 && /\d+\s*$/.test(text)) return current;
    }
    return node;
  }

  function parseFolderNameFromNode(node) {
    const link = node.matches?.("a") ? node : node.querySelector?.("a");
    const explicit = normalizeText(node.getAttribute?.("title") || link?.getAttribute?.("title") || "");
    if (explicit) return explicit;
    const countNode = node.querySelector?.(".vui_sidebar-item-right,[class*='right'],[class*='count']");
    const countText = normalizeText(countNode?.textContent || "");
    let text = normalizeText(node.textContent || "");
    if (countText) text = normalizeText(text.replace(countText, ""));
    text = normalizeText(text.replace(/\d+\s*$/, ""));
    return text;
  }

  function mergeFolderCandidate(existing, candidate) {
    if (!existing) return candidate;
    if (!existing.folder_id && candidate.folder_id) return { ...existing, ...candidate };
    if (existing.folder_id && !candidate.folder_id) return existing;
    if (existing.count === null && candidate.count !== null) return { ...existing, count: candidate.count };
    return existing;
  }

  function normalizeCreatedFolderApiRow(row) {
    const folderId = String(row?.id || row?.fid || row?.media_id || row?.folder_id || "");
    const folderName = normalizeText(row?.title || row?.name || row?.folder_name || "");
    const rawCount = row?.media_count ?? row?.count ?? row?.cnt ?? row?.mediaCount;
    const count = Number.isFinite(Number(rawCount)) ? Number(rawCount) : null;
    if (!/^\d+$/.test(folderId) || !folderName) return null;
    return {
      folder_id: folderId,
      folder_name: folderName,
      count,
      selectable: true,
    };
  }

  async function fetchCreatedFoldersFromApi() {
    const upMid = currentSpaceMid();
    if (!upMid) return [];
    const payload = await apiGet(API.folderCreatedListAll, { up_mid: upMid, type: 0 });
    if (payload.code !== 0) throw new Error(`API_${payload.code}_${payload.message || "created folder list failed"}`);
    const list = Array.isArray(payload.data?.list) ? payload.data.list : Array.isArray(payload.data) ? payload.data : [];
    const folders = list.map(normalizeCreatedFolderApiRow).filter(Boolean);
    const byId = new Map();
    for (const folder of folders) byId.set(folder.folder_id, mergeFolderCandidate(byId.get(folder.folder_id), folder));
    return Array.from(byId.values());
  }

  function textBoundaryTop(labels) {
    const nodes = Array.from(document.querySelectorAll("div,span,p,section"));
    const matches = nodes
      .filter((node) => {
        const text = normalizeText(node.textContent || "");
        return labels.some((label) => text === label || text.startsWith(label));
      })
      .map((node) => node.getBoundingClientRect?.().top)
      .filter((top) => Number.isFinite(top));
    return matches.length ? Math.min(...matches) : null;
  }

  function extractCreatedFoldersFromPage() {
    const createdTop = textBoundaryTop(["我创建的收藏夹"]);
    const followedTop = textBoundaryTop(["我追的合集/收藏夹", "其他收藏"]);
    const selectors = [
      ".fav-sidebar-item",
      ".vui_sidebar-item",
      ".fav-sortable-list [class*='item']",
      "[class*='fav-sidebar-item']",
      "a[href*='favlist?fid=']",
    ];
    const nodes = Array.from(new Set(selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)))));
    const candidates = [];
    const byStableKey = new Map();
    for (const node of nodes) {
      const row = folderRowForNode(node);
      const rectTop = row.getBoundingClientRect?.().top;
      if (Number.isFinite(createdTop) && Number.isFinite(rectTop) && rectTop < createdTop) continue;
      if (Number.isFinite(followedTop) && Number.isFinite(rectTop) && rectTop > followedTop) continue;
      const name = parseFolderNameFromNode(row);
      if (!name || name === "新建收藏夹" || name.includes("我创建的收藏夹") || name.includes("我追的合集") || name.includes("其他收藏")) continue;
      if (name.length > 80) continue;
      const folderId = parseFolderIdFromNode(row) || parseFolderIdFromNode(node) || (isCurrentFolderNode(row) || isCurrentFolderNode(node) ? currentUrlFolderId() : "");
      const count = parseFolderCountFromNode(row);
      candidates.push({
        folder_id: folderId,
        folder_name: name,
        count,
        selectable: Boolean(folderId),
      });
    }
    const namesWithId = new Set(candidates.filter((folder) => folder.folder_id).map((folder) => folder.folder_name));
    for (const candidate of candidates) {
      if (!candidate.folder_id && namesWithId.has(candidate.folder_name)) continue;
      const key = candidate.folder_id ? `id:${candidate.folder_id}` : `name:${candidate.folder_name}:${candidate.count === null ? "unknown" : candidate.count}`;
      byStableKey.set(key, mergeFolderCandidate(byStableKey.get(key), candidate));
    }
    return Array.from(byStableKey.values()).map((folder) => ({
      ...folder,
      selectable: Boolean(folder.folder_id),
    }));
  }

  async function readCreatedFoldersWithRetry() {
    try {
      const apiFolders = await fetchCreatedFoldersFromApi();
      if (apiFolders.length) return apiFolders;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      if (shouldTripBreaker(detail)) throw error;
      log(`自建收藏夹接口读取失败，改用页面兜底: ${detail}`);
    }
    const delays = [0, 300, 800, 1500];
    for (const delay of delays) {
      if (delay) await sleep(delay);
      const folders = extractCreatedFoldersFromPage();
      if (folders.length) return folders;
    }
    return [];
  }

  function protectedFolderNames() {
    return new Set([...RESERVED_FOLDER_NAMES]);
  }

  function folderDeletionTargets() {
    return folderDeletionTargetsFromFolders(extractCreatedFoldersFromPage());
  }

  function folderDeletionTargetsFromFolders(folders) {
    const protectedNames = protectedFolderNames();
    return folders
      .filter((folder) => !protectedNames.has(folder.folder_name))
      .map((folder) => ({
        ...folder,
        disabled: !folder.folder_id,
        checked: false,
        note: !folder.folder_id ? "缺少收藏夹 ID，不能删除" : folder.count === 0 ? "空收藏夹，可勾选删除" : folder.count === null ? "数量未知，可手动勾选删除" : `含 ${folder.count} 个视频，可手动勾选删除`,
      }));
  }

  function openFolderSelectionDialog({ title, message, items, confirmLabel = "确认", phrase }) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.style.cssText = [
        "position:fixed",
        "inset:0",
        "z-index:1000000",
        "background:rgba(0,0,0,.45)",
        "display:flex",
        "align-items:center",
        "justify-content:center",
      ].join(";");
      const panel = document.createElement("div");
      panel.style.cssText = [
        "width:min(620px,92vw)",
        "max-height:78vh",
        "overflow:auto",
        "background:#151515",
        "color:#f5f5f5",
        "border:1px solid #555",
        "border-radius:8px",
        "box-shadow:0 10px 36px rgba(0,0,0,.45)",
        "padding:14px",
        "font:13px/1.45 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
      ].join(";");
      const header = document.createElement("div");
      header.textContent = title;
      header.style.cssText = "font-size:16px;font-weight:800;margin-bottom:8px";
      const desc = document.createElement("div");
      desc.textContent = message;
      desc.style.cssText = "color:#ddd;margin-bottom:10px;white-space:normal";
      const selectableCount = items.filter((item) => !item.disabled).length;
      const selectedSummary = document.createElement("div");
      selectedSummary.style.cssText = "color:#9fd0ff;margin-bottom:8px;font-weight:700";
      const toolbar = document.createElement("div");
      toolbar.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px";
      const makePickerButton = (label, handler) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.addEventListener("click", handler);
        return button;
      };
      const filterBox = document.createElement("div");
      filterBox.style.cssText = "display:flex;gap:8px;align-items:center;margin-bottom:8px";
      const searchInput = document.createElement("input");
      searchInput.type = "search";
      searchInput.placeholder = t("searchFolder");
      searchInput.style.cssText = "flex:1;min-width:180px;box-sizing:border-box;padding:6px;color:#111";
      const selectedOnlyLabel = document.createElement("label");
      selectedOnlyLabel.style.cssText = "display:flex;gap:5px;align-items:center;color:#ddd;white-space:nowrap";
      const selectedOnly = document.createElement("input");
      selectedOnly.type = "checkbox";
      selectedOnlyLabel.append(selectedOnly, document.createTextNode(t("selectedOnly")));
      filterBox.append(searchInput, selectedOnlyLabel);
      const list = document.createElement("div");
      list.style.cssText = "max-height:360px;overflow:auto;border:1px solid #333;border-radius:6px;padding:6px;background:#101010";
      const updateSelectedSummary = () => {
        const selectedCount = list.querySelectorAll("input[type='checkbox']:checked:not(:disabled)").length;
        selectedSummary.textContent = t("selectedCount", { selected: selectedCount, selectable: selectableCount });
      };
      for (const item of items) {
        const label = document.createElement("label");
        label.style.cssText = "display:flex;gap:8px;align-items:flex-start;padding:5px 2px;color:#eee";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(item.checked !== false && !item.disabled);
        checkbox.disabled = Boolean(item.disabled);
        checkbox.dataset.folderId = item.folder_id || "";
        checkbox.addEventListener("change", () => {
          updateSelectedSummary();
          applyFolderFilter();
        });
        const text = document.createElement("span");
        text.textContent = `${item.folder_name}${item.count === null || item.count === undefined ? "" : ` (${item.count})`}${item.note ? ` - ${item.note}` : ""}`;
        if (item.disabled) text.style.color = "#888";
        label.dataset.searchText = normalizeText(text.textContent).toLowerCase();
        label.append(checkbox, text);
        list.appendChild(label);
      }
      const applyFolderFilter = () => {
        const keyword = normalizeText(searchInput.value).toLowerCase();
        list.querySelectorAll("label").forEach((label) => {
          const checkbox = label.querySelector("input[type='checkbox']");
          const matchesKeyword = !keyword || (label.dataset.searchText || "").includes(keyword);
          const matchesSelected = !selectedOnly.checked || checkbox.checked;
          label.style.display = matchesKeyword && matchesSelected ? "flex" : "none";
        });
      };
      const selectableInputs = () => Array.from(list.querySelectorAll("label"))
        .filter((label) => label.style.display !== "none")
        .map((label) => label.querySelector("input[type='checkbox']"))
        .filter((input) => input && !input.disabled);
      toolbar.append(
        makePickerButton(t("selectVisible"), () => {
          selectableInputs().forEach((input) => { input.checked = true; });
          updateSelectedSummary();
          applyFolderFilter();
        }),
        makePickerButton(t("deselectVisible"), () => {
          selectableInputs().forEach((input) => { input.checked = false; });
          updateSelectedSummary();
          applyFolderFilter();
        }),
        makePickerButton(t("invertVisible"), () => {
          selectableInputs().forEach((input) => { input.checked = !input.checked; });
          updateSelectedSummary();
          applyFolderFilter();
        }),
      );
      searchInput.addEventListener("input", applyFolderFilter);
      selectedOnly.addEventListener("change", applyFolderFilter);
      updateSelectedSummary();
      applyFolderFilter();
      const phraseInput = document.createElement("input");
      if (phrase) {
        phraseInput.placeholder = t("phrasePlaceholder", { phrase });
        phraseInput.style.cssText = "display:block;width:100%;box-sizing:border-box;margin:10px 0 0 0;padding:6px;color:#111";
      }
      const actions = document.createElement("div");
      actions.style.cssText = "display:flex;justify-content:flex-end;gap:8px;margin-top:12px";
      const cancel = document.createElement("button");
      cancel.textContent = t("cancel");
      cancel.dataset.i18n = "cancel";
      const confirm = document.createElement("button");
      confirm.textContent = confirmLabel;
      confirm.style.cssText = "font-weight:800";
      const close = (value) => {
        overlay.remove();
        resolve(value);
      };
      cancel.addEventListener("click", () => close([]));
      confirm.addEventListener("click", () => {
        if (phrase && phraseInput.value !== phrase) {
          setStatus(t("phraseMismatch", { phrase }));
          return;
        }
        const selectedIds = new Set(Array.from(list.querySelectorAll("input[type='checkbox']:checked")).map((input) => input.dataset.folderId));
        close(items.filter((item) => selectedIds.has(item.folder_id)));
      });
      actions.append(cancel, confirm);
      panel.append(header, desc, selectedSummary, filterBox, toolbar, list);
      if (phrase) panel.appendChild(phraseInput);
      panel.appendChild(actions);
      overlay.appendChild(panel);
      document.documentElement.appendChild(overlay);
    });
  }

  async function cleanInvalidFolder(folder) {
    const csrf = csrfToken();
    if (!csrf) throw new Error("缺少 bili_jct csrf cookie");
    const payload = await apiPost(API.resourceClean, {
      media_id: folder.folder_id,
      csrf,
    });
    if (payload.code !== 0) throw new Error(`WRITE_API_${payload.code}_${payload.message || "resource clean failed"}`);
    return payload;
  }

  async function cleanupInvalidVideos() {
    if (running) return;
    let folders = [];
    try {
      folders = await readCreatedFoldersWithRetry();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      showBlockedAlert(detail);
      log(`读取自建收藏夹失败，已停止: ${detail}`);
      return;
    }
    const targets = folders.map((folder) => ({
      ...folder,
      checked: Boolean(folder.folder_id),
      disabled: !folder.folder_id,
      note: folder.folder_id ? "将调用 clean，只清理该夹失效内容" : "缺少收藏夹 ID，不能清理",
    }));
    if (!targets.length) {
      log(t("invalidNoFolders"));
      return;
    }
    const selected = await openFolderSelectionDialog({
      title: t("invalidDialogTitle"),
      message: t("invalidDialogMessage"),
      items: targets,
      confirmLabel: t("invalidConfirm"),
    });
    if (!selected.length) {
      log("已取消失效视频清理");
      return;
    }
    running = true;
    paused = false;
    hideBlockedAlert();
    state.invalid_cleanup = state.invalid_cleanup || { cleaned_folders: [] };
    saveState();
    refreshPanel();
    try {
      for (let index = 0; index < selected.length; index += 1) {
        if (paused) break;
        const folder = selected[index];
        log(`清理失效视频: ${folder.folder_name}`);
        try {
          await cleanInvalidFolder(folder);
          state.invalid_cleanup.cleaned_folders.push({ ...folder, cleaned_at: nowLocal() });
          log(`失效视频清理完成: ${folder.folder_name}`);
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          log(`失效视频清理失败 ${folder.folder_name}: ${detail}`);
          if (shouldTripBreaker(detail)) {
            paused = true;
            showBlockedAlert(detail);
            log("失效视频清理触发熔断，已挂起。");
            break;
          }
          throw error;
        }
        saveState();
        refreshPanel();
        const hasMore = index < selected.length - 1;
        if (hasMore && (index + 1) % 10 === 0) {
          await sleepWithCountdown(randomNormalMs(CLEANUP_REST_MS), "cleanup 批间休息");
        } else if (hasMore) {
          await sleepWithCountdown(randomNormalMs(CLEANUP_DELAY_MS), "cleanup 间隔");
        }
      }
    } finally {
      running = false;
      saveState();
      refreshPanel();
    }
  }

  async function deleteLegacyFolder(folder) {
    const csrf = csrfToken();
    if (!csrf) throw new Error("缺少 bili_jct csrf cookie");
    const payload = await apiPost(API.folderDel, {
      media_ids: folder.folder_id,
      csrf,
    });
    if (payload.code !== 0) throw new Error(`WRITE_API_${payload.code}_${payload.message || "folder delete failed"}`);
    return payload;
  }

  async function deleteSelectedFolders() {
    if (running) return;
    let folders = [];
    try {
      folders = await readCreatedFoldersWithRetry();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      showBlockedAlert(detail);
      log(`读取自建收藏夹失败，已停止: ${detail}`);
      return;
    }
    const targets = folderDeletionTargetsFromFolders(folders);
    if (!targets.length) {
      log(t("deleteNoFolders"));
      return;
    }
    const selected = await openFolderSelectionDialog({
      title: t("deleteDialogTitle"),
      message: t("deleteDialogMessage"),
      items: targets,
      confirmLabel: t("deleteConfirm"),
      phrase: t("deletePhrase"),
    });
    if (!selected.length) {
      log("已取消收藏夹删除");
      return;
    }
    running = true;
    paused = false;
    hideBlockedAlert();
    state.legacy_cleanup = state.legacy_cleanup || { deleted_folders: [] };
    let deletedCount = 0;
    saveState();
    refreshPanel();
    try {
      for (let index = 0; index < selected.length; index += 1) {
        if (paused) break;
        const folder = selected[index];
        log(`删除收藏夹: ${folder.folder_name}`);
        try {
          await deleteLegacyFolder(folder);
          state.legacy_cleanup.deleted_folders.push({ ...folder, deleted_at: nowLocal() });
          deletedCount += 1;
          log(`收藏夹已删除: ${folder.folder_name}`);
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          log(`删除收藏夹失败 ${folder.folder_name}: ${detail}`);
          if (shouldTripBreaker(detail)) {
            paused = true;
            showBlockedAlert(detail);
            log("收藏夹删除触发熔断，已挂起。");
            break;
          }
          throw error;
        }
        saveState();
        refreshPanel();
        const hasMore = index < selected.length - 1;
        if (hasMore && (index + 1) % 5 === 0) {
          await sleepWithCountdown(randomNormalMs(DELETE_REST_MS), "删除收藏夹批间休息");
        } else if (hasMore) {
          await sleepWithCountdown(randomNormalMs(DELETE_DELAY_MS), "删除收藏夹间隔");
        }
      }
    } finally {
      running = false;
      saveState();
      refreshPanel();
      if (deletedCount > 0 && !paused) {
        log(`已删除 ${deletedCount} 个收藏夹，2 秒后刷新页面`);
        setTimeout(() => location.reload(), 2000);
      }
    }
  }

  function targetFolderIdByName(name) {
    const target = (state.package?.target_folders || []).find((folder) => folder.folder_name === name);
    return target?.folder_id || "";
  }

  function updateMissingTargetStats() {
    if (!state.package) return;
    const missing = state.package.missing_target_folders || [];
    state.package.stats = state.package.stats || {};
    state.package.stats.missing_target_folder_count = missing.length;
  }

  function recordTargetFolder(name, folderId) {
    if (!state.package) return;
    const id = String(folderId || "");
    const targets = state.package.target_folders || [];
    let target = targets.find((folder) => folder.folder_name === name);
    if (!target) {
      target = { folder_name: name };
      targets.push(target);
      state.package.target_folders = targets;
    }
    target.folder_id = id;
    target.exists_in_account_snapshot = true;
    target.created_by_executor = true;
    target.created_at = nowLocal();
    target.privacy = TARGET_CREATE_PRIVACY;
    state.package.missing_target_folders = (state.package.missing_target_folders || []).filter((folderName) => folderName !== name);
    updateMissingTargetStats();
    state.created_target_folders = state.created_target_folders || [];
    if (!state.created_target_folders.some((folder) => folder.folder_name === name)) {
      state.created_target_folders.push({ folder_name: name, folder_id: id, created_at: nowLocal(), privacy: TARGET_CREATE_PRIVACY });
    }
  }

  function extractCreatedFolderId(payload) {
    const data = payload?.data || {};
    return data.id || data.media_id || data.fid || data.folder_id || "";
  }

  async function createTargetFolder(name) {
    const csrf = csrfToken();
    if (!csrf) throw new Error("缺少 bili_jct csrf cookie");
    const payload = await apiPost(API.folderAdd, {
      title: name,
      intro: "",
      privacy: TARGET_CREATE_PRIVACY,
      csrf,
    });
    if (payload.code !== 0) throw new Error(`WRITE_API_${payload.code}_${payload.message || "folder add failed"}`);
    const folderId = extractCreatedFolderId(payload);
    if (!folderId) throw new Error(`WRITE_API_NO_FOLDER_ID_${name}`);
    return { folder_id: String(folderId), payload };
  }

  async function createMissingTargetFolders() {
    if (running) return;
    if (!state.package) throw new Error("请先导入任务包 JSON");
    const missing = [...(state.package.missing_target_folders || [])];
    if (!missing.length) {
      log("没有缺失目标夹需要创建");
      return;
    }
    running = true;
    paused = false;
    hideBlockedAlert();
    state.created_target_folders = state.created_target_folders || [];
    state.target_creation_started_at = state.target_creation_started_at || nowLocal();
    state.target_created_since_rest = state.target_created_since_rest || 0;
    state.target_next_rest_after = state.target_next_rest_after || nextBreakAfter();
    saveState();
    refreshPanel();
    try {
      for (let index = 0; index < missing.length; index += 1) {
        const name = missing[index];
        if (paused) break;
        log(`创建目标夹: ${name} (privacy=${TARGET_CREATE_PRIVACY})`);
        try {
          const created = await createTargetFolder(name);
          recordTargetFolder(name, created.folder_id);
          state.target_created_since_rest = (state.target_created_since_rest || 0) + 1;
          log(`目标夹已创建: ${name} -> ${created.folder_id}`);
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          log(`创建目标夹失败 ${name}: ${detail}`);
          if (shouldTripBreaker(detail)) {
            paused = true;
            showBlockedAlert(detail);
            log("目标夹创建触发熔断，已挂起。请人工处理验证/登录后点击恢复。");
            break;
          }
          throw error;
        }
        saveState();
        refreshPanel();
        const hasMoreTargets = index < missing.length - 1;
        if (hasMoreTargets && (state.target_created_since_rest || 0) >= (state.target_next_rest_after || BREAK_AFTER.max)) {
          const ms = randomNormalMs(REST_DELAY_MS);
          log(`创建目标夹批间休眠 ${Math.round(ms / 1000)} 秒`);
          await sleepWithCountdown(ms, "创建目标夹批间休眠");
          state.target_created_since_rest = 0;
          state.target_next_rest_after = nextBreakAfter();
          saveState();
        } else if (hasMoreTargets) {
          await sleepWithCountdown(randomNormalMs(STEP_DELAY_MS), "创建目标夹间隔");
        }
      }
      if (!(state.package.missing_target_folders || []).length) {
        state.target_creation_finished_at = nowLocal();
        log("缺失目标夹已全部创建。建议先备份进度，再重新只读审计。");
      }
    } finally {
      running = false;
      saveState();
      refreshPanel();
    }
  }

  function aidFor(task) {
    if (task.aid) return String(task.aid);
    const snapshot = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || "{}");
    return snapshot.aid_by_bvid?.[task.bvid] || "";
  }

  function loadSnapshot() {
    try {
      return JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function updateLocalSnapshot(task, phase) {
    const snapshot = loadSnapshot();
    if (!snapshot.folders) return;
    const targetFolderId = targetFolderIdByName(task.target_folder);
    if (targetFolderId && snapshot.folders[targetFolderId]) {
      const bvids = new Set(snapshot.folders[targetFolderId].bvids || []);
      bvids.add(task.bvid);
      snapshot.folders[targetFolderId].bvids = [...bvids];
    }
    if (phase === "removed_from_source" && task.source_folder_id && snapshot.folders[task.source_folder_id]) {
      const bvids = new Set(snapshot.folders[task.source_folder_id].bvids || []);
      bvids.delete(task.bvid);
      snapshot.folders[task.source_folder_id].bvids = [...bvids];
    }
    snapshot.updated_at = nowLocal();
    saveSnapshot(snapshot);
  }

  async function addToFolder(task) {
    const aid = aidFor(task);
    const targetFolderId = targetFolderIdByName(task.target_folder);
    if (!aid) throw new Error(`缺少 aid: ${task.bvid}`);
    if (!targetFolderId) throw new Error(`缺少目标夹 id: ${task.target_folder}`);
    const csrf = csrfToken();
    if (!csrf) throw new Error("缺少 bili_jct csrf cookie");
    const payload = await apiPost(API.addOrDel, {
      rid: aid,
      type: 2,
      add_media_ids: targetFolderId,
      del_media_ids: "",
      csrf,
    });
    if (payload.code !== 0) throw new Error(`WRITE_API_${payload.code}_${payload.message || "add failed"}`);
    return payload;
  }

  async function removeFromFolder(task) {
    const aid = aidFor(task);
    if (!aid) throw new Error(`缺少 aid: ${task.bvid}`);
    if (!task.source_folder_id) throw new Error(`缺少来源夹 id: ${task.source_folder}`);
    const csrf = csrfToken();
    if (!csrf) throw new Error("缺少 bili_jct csrf cookie");
    const payload = await apiPost(API.addOrDel, {
      rid: aid,
      type: 2,
      add_media_ids: "",
      del_media_ids: task.source_folder_id,
      csrf,
    });
    if (payload.code !== 0) throw new Error(`WRITE_API_${payload.code}_${payload.message || "remove failed"}`);
    return payload;
  }

  function shouldTripBreaker(detail) {
    return /HTTP_403|HTTP_412|API_-101|WRITE_API_|csrf|captcha|验证码|登录/.test(detail);
  }

  function nextBreakAfter() {
    return randInt(BREAK_AFTER.min, BREAK_AFTER.max);
  }

  function pendingTasks(limit = Number.POSITIVE_INFINITY) {
    return tasks().filter((task) => executableStatuses().has(task.status || "pending")).slice(0, limit);
  }

  function normalizeRecoverableTaskStatuses() {
    for (const task of tasks()) {
      if (task.status === "running") {
        task.status = "failed";
        task.last_error = task.last_error || "上次页面中断于 running，已转为 failed 以便人工重跑";
      }
    }
  }

  async function executeOneTask(task) {
    const resumeRemoveOnly = task.action === "move" && task.status === "added_to_target";
    task.started_at = task.started_at || nowLocal();
    task.attempts = (task.attempts || 0) + 1;
    if (!resumeRemoveOnly) task.status = "running";
    saveState();
    refreshPanel();
    log(`执行 ${task.operation_id}: ${resumeRemoveOnly ? "resume-remove" : task.action} ${task.bvid} -> ${task.target_folder}`);
    if (!resumeRemoveOnly) {
      await addToFolder(task);
      task.status = task.action === "copy" ? "success" : "added_to_target";
      task.added_at = nowLocal();
      updateLocalSnapshot(task, "added_to_target");
      saveState();
      refreshPanel();
    }
    if (task.action === "move") {
      await sleepWithCountdown(randomNormalMs(STEP_DELAY_MS), "写操作间隔");
      await removeFromFolder(task);
      task.status = "success";
      task.removed_at = nowLocal();
      updateLocalSnapshot(task, "removed_from_source");
    }
    task.finished_at = nowLocal();
    task.last_error = "";
    saveState();
    refreshPanel();
    log(`成功 ${task.operation_id}`);
  }

  async function maybeRestAfterSuccess(hasMoreTasks) {
    if (!hasMoreTasks) return;
    if ((state.completed_since_long_rest || 0) >= 50) {
      const ms = randomNormalMs(LONG_REST_DELAY_MS);
      log(`长休眠 ${Math.round(ms / 1000)} 秒`);
      await sleepWithCountdown(ms, "长休眠");
      state.completed_since_long_rest = 0;
      saveState();
      return;
    }
    if ((state.completed_since_rest || 0) >= (state.next_rest_after || BREAK_AFTER.max)) {
      const ms = randomNormalMs(REST_DELAY_MS);
      log(`批间休眠 ${Math.round(ms / 1000)} 秒`);
      await sleepWithCountdown(ms, "批间休眠");
      state.completed_since_rest = 0;
      state.next_rest_after = nextBreakAfter();
      saveState();
      return;
    }
    await sleepWithCountdown(randomNormalMs(STEP_DELAY_MS), "写操作间隔");
  }

  async function executeTasks(limit, options = {}) {
    if (running) return;
    if (!state.package) throw new Error("请先导入任务包 JSON");
    normalizeRecoverableTaskStatuses();
    const blocker = firstBlockingPreflight();
    if (blocker) throw new Error(`预检未通过: ${blocker.label} ${blocker.detail}`);
    running = true;
    paused = false;
    hideBlockedAlert();
    state.completed_since_rest = state.completed_since_rest || 0;
    state.completed_since_long_rest = state.completed_since_long_rest || 0;
    state.completed_since_export = state.completed_since_export || 0;
    state.next_rest_after = state.next_rest_after || nextBreakAfter();
    let completedThisRun = 0;
    const statsAtStart = taskStats();
    runProgress.active = true;
    const plannedTarget = options.toCompletion ? pendingTasks(Number.POSITIVE_INFINITY).length : pendingTasks(limit).length;
    runProgress.mode = options.toCompletion ? t("runToCompletion") : `${t("execute")} ${limit}`;
    runProgress.target = plannedTarget;
    runProgress.done = 0;
    runProgress.startedSuccess = statsAtStart.counts.success || 0;
    runProgress.startedPending = statsAtStart.counts.pending || 0;
    runProgress.toCompletion = Boolean(options.toCompletion);
    refreshPanel();
    try {
      while (completedThisRun < limit) {
        if (paused) break;
        const task = nextExecutableTask();
        if (!task) break;
        try {
          await executeOneTask(task);
          state.completed_since_rest = (state.completed_since_rest || 0) + 1;
          state.completed_since_long_rest = (state.completed_since_long_rest || 0) + 1;
          state.completed_since_export = (state.completed_since_export || 0) + 1;
          completedThisRun += 1;
          runProgress.done = completedThisRun;
          refreshPanel();
          if (options.toCompletion && (state.completed_since_export || 0) >= FORCE_EXPORT_EVERY) {
            log(`已到备份点：建议点击备份进度；执行到完成会继续运行`);
          }
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          const tripped = shouldTripBreaker(detail);
          const keepAddedToTarget = task.action === "move" && task.status === "added_to_target" && task.added_at && !task.removed_at;
          task.status = keepAddedToTarget ? "added_to_target" : tripped ? "blocked" : "failed";
          task.last_error = detail;
          task.failed_at = nowLocal();
          log(`失败 ${task.operation_id}: ${detail}`);
          saveState();
          if (tripped) {
            paused = true;
            showBlockedAlert(detail);
            log(keepAddedToTarget ? "触发熔断，任务保留 added_to_target；下次执行只会移除来源夹。" : "触发熔断，已挂起。请人工处理验证/登录后解除 blocked 标记。");
            break;
          }
        }
        saveState();
        refreshPanel();
        await maybeRestAfterSuccess(Boolean(nextExecutableTask()) && completedThisRun < limit && !paused);
      }
    } finally {
      running = false;
      runProgress.active = false;
      runProgress.toCompletion = false;
      refreshPanel();
    }
  }

  function exportState() {
    const stats = taskStats();
    state.last_exported_at = nowLocal();
    state.completed_since_export = 0;
    saveState();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = nowLocal().replace(/\D/g, "").slice(0, 14);
    a.download = `bili-state-v${SCRIPT_VERSION}-success-${stats.counts.success || 0}-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    log("已备份进度");
  }

  function replaceState(nextState) {
    for (const key of Object.keys(state)) {
      delete state[key];
    }
    Object.assign(state, nextState);
    state.log_filter = state.log_filter || "all";
    state.panel_collapsed = Boolean(state.panel_collapsed);
    state.advanced_visible = Boolean(state.advanced_visible);
    normalizeRecoverableTaskStatuses();
    saveState();
  }

  function importPackage(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const payload = JSON.parse(String(reader.result || "{}"));
      if (payload.package?.tasks) {
        replaceState(payload);
        log(`导入状态: ${payload.package.tasks.length} tasks`);
        refreshPanel();
        return;
      }
      if (payload.schema_version !== 1 || !Array.isArray(payload.tasks)) {
        throw new Error("无效任务包");
      }
      state.package = payload;
      state.script_version = SCRIPT_VERSION;
      state.imported_at = nowLocal();
      state.completed_since_rest = 0;
      state.completed_since_long_rest = 0;
      state.completed_since_export = 0;
      state.next_rest_after = nextBreakAfter();
      state.log = [];
      saveState();
      log(`导入任务包: ${payload.stats.total_tasks} tasks`);
      refreshPanel();
    };
    reader.readAsText(file);
  }

  function resetBlockedTasks() {
    let count = 0;
    for (const task of tasks()) {
      if (task.status === "blocked") {
        task.status = "failed";
        task.recovered_from_blocked_at = nowLocal();
        count += 1;
      }
    }
    paused = false;
    hideBlockedAlert();
    saveState();
    refreshPanel();
    log(`已解除 blocked 标记: ${count} 条转为 failed，可重试`);
  }

  function safePause() {
    if (!running || paused) {
      refreshPanel();
      return;
    }
    paused = true;
    state.safe_pause_requested_at = nowLocal();
    saveState();
    refreshPanel();
    log("已请求暂停：当前任务结束后停止。要继续请点击执行。");
  }

  function executeToCompletionWithConfirm() {
    const stats = taskStats();
    const pending = stats.counts.pending || 0;
    const ok = window.confirm(t("toCompletionConfirm", { every: FORCE_EXPORT_EVERY, pending }));
    if (!ok) {
      log("已取消执行到完成");
      return Promise.resolve();
    }
    return executeTasks(Number.POSITIVE_INFINITY, { toCompletion: true });
  }

  function setLogFilter(filter) {
    state.log_filter = filter;
    saveState();
    renderLog();
  }

  function clearDisplayedLog() {
    state.log_view_cleared_at = nowLocal();
    saveState();
    renderLog();
    setStatus(t("clearedDisplayedLogs"));
  }

  function togglePanelCollapsed() {
    state.panel_collapsed = !state.panel_collapsed;
    saveState();
    refreshPanel();
  }

  function toggleAdvancedPanel() {
    state.advanced_visible = !state.advanced_visible;
    saveState();
    refreshPanel();
  }

  function makeButton(label, handler, options = {}) {
    const button = document.createElement("button");
    button.textContent = options.i18n ? t(options.i18n) : label;
    button.style.margin = "2px";
    if (options.execControl) button.dataset.execControl = "true";
    if (options.runLock) button.dataset.runLock = "true";
    if (options.i18n) button.dataset.i18n = options.i18n;
    button.addEventListener("click", async () => {
      try {
        await handler();
      } catch (error) {
        log(`错误: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
    return button;
  }

  function makeBatchInput() {
    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.max = String(MAX_MANUAL_BATCH_SIZE);
    input.step = "1";
    input.value = "1";
    input.title = t("batchTitle", { max: MAX_MANUAL_BATCH_SIZE });
    input.style.cssText = "width:56px;margin:2px;color:#111";
    input.dataset.role = "batch-size";
    input.dataset.runLock = "true";
    return input;
  }

  function manualBatchSize() {
    const input = document.querySelector(`#${PANEL_ID} [data-role="batch-size"]`);
    const raw = Number.parseInt(input?.value || "5", 10);
    if (!Number.isFinite(raw) || raw < 1) return 1;
    return Math.min(raw, MAX_MANUAL_BATCH_SIZE);
  }

  function executeManualBatch() {
    const size = manualBatchSize();
    if (size > 50) {
      const ok = window.confirm(t("batchConfirm", { size }));
      if (!ok) {
        log("已取消批量执行");
        return Promise.resolve();
      }
    }
    return executeTasks(size);
  }

  function installPanel() {
    if (document.getElementById(PANEL_ID)) return;
    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.style.cssText = [
      "position:fixed",
      "right:16px",
      "bottom:16px",
      "z-index:999999",
      "width:460px",
      "max-height:680px",
      "overflow:hidden",
      "background:#111",
      "color:#f5f5f5",
      "font:12px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
      "border:1px solid #555",
      "border-radius:8px",
      "box-shadow:0 8px 28px rgba(0,0,0,.35)",
      "padding:10px",
    ].join(";");
    const header = document.createElement("div");
    header.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:8px";
    const title = document.createElement("div");
    title.textContent = t("appTitle", { version: SCRIPT_VERSION });
    title.dataset.role = "panel-title";
    title.style.cssText = "font-weight:700;flex:1;font-size:14px";
    const statusBadge = document.createElement("span");
    statusBadge.dataset.role = "status-badge";
    statusBadge.style.cssText = "padding:2px 8px;border-radius:999px;font-weight:700;white-space:nowrap";
    const langToggle = makeButton(t("languageSwitch"), toggleLanguage);
    langToggle.dataset.role = "language-toggle";
    langToggle.style.cssText += ";padding:5px 8px;border-radius:7px;background:#1f2937;color:#fff;border:1px solid #666";
    const collapse = makeButton(t("collapsePanel"), togglePanelCollapsed);
    collapse.dataset.role = "collapse-toggle";
    collapse.style.cssText += ";padding:6px 12px;border-radius:7px;background:#245bff;color:#fff;font-weight:800;border:1px solid #78a0ff";
    header.append(title, statusBadge, langToggle, collapse);
    const headerBlockedAlert = document.createElement("div");
    headerBlockedAlert.dataset.role = "header-blocked-alert";
    headerBlockedAlert.style.cssText = [
      "display:none",
      "margin:0 0 8px 0",
      "padding:6px 8px",
      "background:#8b0000",
      "color:#fff",
      "border-radius:6px",
      "font-weight:700",
      "white-space:normal",
      "transition:box-shadow .2s ease",
    ].join(";");
    const body = document.createElement("div");
    body.dataset.role = "panel-body";
    body.style.cssText = "max-height:600px;overflow:auto;padding-right:2px";
    const file = document.createElement("input");
    file.type = "file";
    file.accept = "application/json,.json";
    file.dataset.runLock = "true";
    file.addEventListener("change", () => file.files?.[0] && importPackage(file.files[0]));
    const summary = document.createElement("div");
    summary.dataset.role = "summary";
    summary.style.cssText = "margin:6px 0;color:#d5f5d5";
    const lastSaved = document.createElement("div");
    lastSaved.dataset.role = "last-saved-row";
    lastSaved.innerHTML = [
      `${t("lastSaved")}：<span data-role="last-saved">${state.last_saved_at || "-"}</span>`,
      ` · ${t("lastBackup")}：<span data-role="last-exported">${state.last_exported_at || t("notBackedUp")}</span>`,
    ].join("");
    lastSaved.style.cssText = "margin:4px 0;color:#9fd3ff";
    const progressShell = document.createElement("div");
    progressShell.style.cssText = "margin:8px 0";
    const progressBar = document.createElement("div");
    progressBar.dataset.role = "progress-bar";
    progressBar.style.cssText = "display:flex;height:10px;overflow:hidden;border-radius:999px;background:#333;border:1px solid #444";
    const progressLegend = document.createElement("div");
    progressLegend.dataset.role = "progress-legend";
    progressLegend.style.cssText = "margin-top:4px;color:#bbb";
    progressShell.append(progressBar, progressLegend);
    const preflightBox = document.createElement("div");
    preflightBox.dataset.role = "preflight";
    preflightBox.style.cssText = "margin:6px 0;padding:6px;background:#1b1b1b;border:1px solid #333;border-radius:6px";
    const nextTaskBox = document.createElement("div");
    nextTaskBox.dataset.role = "next-task";
    nextTaskBox.style.cssText = "margin:6px 0;color:#ffd479;white-space:normal";
    const taskFlowBox = document.createElement("div");
    taskFlowBox.dataset.role = "task-flow";
    taskFlowBox.style.cssText = "margin:8px 0;padding:8px;background:#171717;border:1px solid #333;border-radius:7px";
    const runProgressBox = document.createElement("div");
    runProgressBox.dataset.role = "run-progress";
    runProgressBox.style.cssText = "margin:6px 0;color:#9fd3ff;white-space:normal;font-weight:600";
    const status = document.createElement("div");
    status.dataset.role = "status";
    status.style.cssText = "margin:6px 0;color:#ffd479";
    const controls = document.createElement("div");
    controls.style.cssText = "margin:6px 0;display:flex;align-items:center;gap:4px;flex-wrap:wrap";
    const batchInput = makeBatchInput();
    const advancedPanel = document.createElement("div");
    advancedPanel.dataset.role = "advanced-panel";
    advancedPanel.style.cssText = "margin:8px 0;padding:8px;background:#181818;border:1px solid #333;border-radius:6px;max-height:320px;overflow:auto";
    const advancedControls = document.createElement("div");
    advancedControls.style.cssText = "margin-bottom:6px";
    const blockedAlert = document.createElement("div");
    blockedAlert.dataset.role = "blocked-alert";
    blockedAlert.style.cssText = [
      "display:none",
      "margin:6px 0",
      "padding:8px",
      "background:#8b0000",
      "color:#fff",
      "border-radius:6px",
      "font-weight:700",
    ].join(";");
    const unblockButton = makeButton("", resetBlockedTasks, { runLock: true, i18n: "unblock" });
    unblockButton.dataset.showWhen = "blocked";
    const pauseButton = makeButton("", safePause, { i18n: "pause" });
    pauseButton.dataset.role = "pause-button";
    const advancedToggle = makeButton("", toggleAdvancedPanel, { i18n: "more" });
    advancedToggle.dataset.role = "advanced-toggle";
    advancedToggle.style.cssText += ";margin-left:auto;padding:6px 12px;border-radius:7px;background:#2b2b2b;color:#fff;font-weight:800;border:1px solid #666";
    controls.append(
      batchInput,
      makeButton("", createMissingTargetFolders, { runLock: true, i18n: "createMissingTargets" }),
      makeButton("", executeManualBatch, { execControl: true, i18n: "execute" }),
      makeButton("", executeToCompletionWithConfirm, { execControl: true, i18n: "executeToCompletion" }),
      pauseButton,
      unblockButton,
      makeButton("", exportState, { i18n: "backupProgress" }),
      advancedToggle,
    );
    advancedControls.append(
      makeButton("", auditReadOnlyWithConfirm, { runLock: true, i18n: "audit" }),
      makeButton("", cleanupInvalidVideos, { runLock: true, i18n: "cleanupInvalid" }),
      makeButton("", deleteSelectedFolders, { runLock: true, i18n: "deleteFolders" }),
      makeButton("", exportReport, { i18n: "exportReport" }),
      makeButton("", copyStatusSummary, { i18n: "copySummary" }),
    );
    const logControls = document.createElement("div");
    logControls.style.cssText = "margin:6px 0";
    const allLogs = makeButton("", () => setLogFilter("all"), { i18n: "allLogs" });
    allLogs.dataset.logFilter = "all";
    const importantLogs = makeButton("", () => setLogFilter("important"), { i18n: "importantLogs" });
    importantLogs.dataset.logFilter = "important";
    logControls.append(allLogs, importantLogs, makeButton("", clearDisplayedLog, { i18n: "clearDisplayedLogs" }));
    const logBox = document.createElement("pre");
    logBox.dataset.role = "log";
    logBox.style.cssText = "height:180px;max-height:180px;overflow:auto;background:#222;color:#ddd;padding:8px;white-space:pre-wrap";
    advancedPanel.append(advancedControls, logControls, logBox);
    body.append(file, summary, lastSaved, progressShell, preflightBox, nextTaskBox, taskFlowBox, runProgressBox, controls, blockedAlert, status, advancedPanel);
    panel.append(header, headerBlockedAlert, body);
    document.documentElement.appendChild(panel);
    refreshPanel();
    renderLog();
  }

  if (window.__BILI_ORGANIZER_ENABLE_TEST_HOOKS__) {
    window.__biliOrganizerTest = {
      state,
      aidFromBvid,
      taskStats,
      preflight,
      pendingTasks,
      normalizeRecoverableTaskStatuses,
      resetBlockedTasks,
      nextExecutableTask,
      globalStatus,
      buildStatusSummary,
      buildMarkdownReport,
      visibleLogs,
    };
  }

  installPanel();
})();
