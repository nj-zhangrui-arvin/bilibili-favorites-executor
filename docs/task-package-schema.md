# 任务包契约

任务包是 Plan Generator 和 Executor 之间的唯一集成契约。它只描述“视频收藏分类迁移”，不包含失效视频清理、收藏夹删除或知识库采集。

## 顶层字段

```json
{
  "schema_version": 1,
  "plan_name": "demo-plan",
  "target_folders": [],
  "tasks": [],
  "stats": {}
}
```

- `schema_version`：当前固定为 `1`。
- `plan_name`：任务包名称，显示在预检摘要中。
- `target_folders`：目标收藏夹清单。缺少 `folder_id` 时，执行器可创建缺失目标夹。
- `tasks`：迁移任务数组。
- `stats`：可选统计信息，仅用于展示，不作为执行真源。

## target_folders

```json
{
  "folder_name": "编程/开发",
  "folder_id": "1234567890"
}
```

- `folder_name` 必填。
- `folder_id` 可为空。为空时执行器会把它视为缺失目标夹。

## tasks

```json
{
  "operation_id": "op-00001",
  "action": "move",
  "bvid": "BV1example01",
  "aid": "100000001",
  "title": "示例视频标题",
  "source_folder": "默认收藏夹",
  "source_folder_id": "1111111111",
  "target_folder": "编程/开发",
  "status": "pending"
}
```

- `operation_id`：任务唯一 ID。
- `action`：只允许 `move` 或 `copy`。
- `bvid`：视频 BV 号。
- `aid`：Bilibili 写接口使用的视频 aid。建议生成器提前填好。
- `title`：用于 UI 预览和人工确认。
- `source_folder` / `source_folder_id`：来源收藏夹。`move` 必须有来源夹 ID。
- `target_folder`：目标收藏夹名称，必须能在 `target_folders` 中找到。
- `status`：导入时通常为 `pending`。

## 状态字段

执行器运行后会在本地状态中更新任务：

- `running`：正在处理。
- `added_to_target`：move 已添加目标夹，但还没移出来源夹；下次会恢复移除来源。
- `success`：完成。
- `failed`：非风控失败，可人工重试。
- `blocked`：触发风控或登录/csrf 问题，需人工处理。

这些运行态字段属于执行器状态导出，不要求生成器提前提供。

## 不属于任务包的内容

- 失效视频清理。
- 删除收藏夹。
- AI prompt。
- 字幕、摘要、知识库正文。
- Cookie、SESSDATA、csrf 或任何账号凭据。
