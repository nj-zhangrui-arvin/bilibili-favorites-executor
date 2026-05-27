#!/usr/bin/env python3
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "bilibili_favorites_executor.user.js"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_userscript_contract():
    script = read(SCRIPT)
    assert "// @version      0.6.0" in script
    assert 'const SCRIPT_VERSION = "0.6.0"' in script
    assert 'const LANG_KEY = "biliOrganizerExecutor.lang"' in script
    assert "function toggleLanguage()" in script
    assert 'resourceClean: "https://api.bilibili.com/x/v3/fav/resource/clean"' in script
    assert 'folderDel: "https://api.bilibili.com/x/v3/fav/folder/del"' in script


def test_cleanup_independent_from_task_package():
    script = read(SCRIPT)
    cleanup_start = script.index("async function cleanupInvalidVideos()")
    cleanup_end = script.index("async function deleteLegacyFolder", cleanup_start)
    delete_start = script.index("async function deleteSelectedFolders()")
    delete_end = script.index("function targetFolderIdByName", delete_start)
    cleanup_block = script[cleanup_start:cleanup_end]
    delete_block = script[delete_start:delete_end]
    assert "state.package" not in cleanup_block
    assert "state.package" not in delete_block
    assert "readCreatedFoldersWithRetry()" in cleanup_block
    assert "readCreatedFoldersWithRetry()" in delete_block


def test_example_package_only_contains_migration_tasks():
    payload = json.loads((ROOT / "examples" / "tampermonkey-tasks.example.json").read_text(encoding="utf-8"))
    assert payload["schema_version"] == 1
    assert isinstance(payload["tasks"], list)
    assert {task["action"] for task in payload["tasks"]} <= {"move", "copy"}
    disallowed = {"invalid_videos", "legacy_folder_cleanup", "cleanup", "knowledge_base"}
    assert not (set(payload) & disallowed)


def test_docs_disclaimers_and_language_entrypoints():
    readme = read(ROOT / "README.md")
    readme_en = read(ROOT / "README.en.md")
    assert "[English](README.en.md)" in readme
    assert "bilibili_favorites_executor.user.js" in readme
    assert "bilibili_favorites_executor.min.user.js" not in readme
    assert "[中文](README.md)" in readme_en
    assert "非官方" in readme
    assert "不会上传 Cookie、SESSDATA、csrf" in readme
    assert "任务包只服务“视频收藏分类迁移”" in readme


if __name__ == "__main__":
    tests = [
        test_userscript_contract,
        test_cleanup_independent_from_task_package,
        test_example_package_only_contains_migration_tasks,
        test_docs_disclaimers_and_language_entrypoints,
    ]
    for test in tests:
        test()
    print(f"OK: {len(tests)} static contract tests passed")
