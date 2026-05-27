# 项目路线图

本项目群围绕 Bilibili 收藏夹整理拆成三个边界清晰的组件。当前仓库只发布执行器，其余两个组件后续独立建设。

## 组件总览

| 组件 | 形态 | 职责 | 写操作 |
| --- | --- | --- | --- |
| Plan Generator | Codex Skill / 本地工作流 | 读取收藏夹和视频元数据，生成可审查任务包 | 不写 Bilibili |
| Executor | Tampermonkey userscript | 导入任务包并执行 move/copy、备份、恢复、报告导出 | 写 Bilibili 收藏关系 |
| Knowledge Collector | 独立采集器 / 本地知识库管线 | 采集视频元数据、字幕、摘要、标签，写入本地知识库 | 不写 Bilibili |

核心原则：**生成、执行、知识采集分离**。任务包是 Plan Generator 和 Executor 之间的唯一契约；Knowledge Collector 不参与执行器写操作。

## 当前状态

Executor 已完成首个开源版本：

- 单文件 userscript：`bilibili_favorites_executor.user.js`。
- 中文默认 UI，支持英文切换。
- 导入任务包后执行 `move` / `copy`。
- 支持缺失目标夹创建、暂停、恢复、备份、执行报告。
- 清理失效视频和删除收藏夹作为独立页面维护工具存在。
- README、英文 README、任务包契约、安全模型、维护工具文档已就绪。
- GitHub 仓库已公开发布。

## 下一个组件：Plan Generator Skill

建议做成 Codex Skill，名称可暂定为 `bilibili-favorites-planner`。

目标：

- 从登录态浏览器或导出的收藏夹清单读取用户自建收藏夹。
- 获取视频基础元数据：`bvid`、`aid`、标题、UP、分区、收藏夹来源、可用标签、简介、失效状态。
- 根据用户偏好的分类体系调用 AI 生成迁移计划。
- 输出可人工审查的任务包 JSON，严格匹配 [任务包契约](task-package-schema.md)。
- 只生成计划，不执行任何 Bilibili 写操作。

首版非目标：

- 不创建收藏夹。
- 不移动或复制视频。
- 不删除收藏夹。
- 不清理失效视频。
- 不写知识库正文。

## 第三个组件：Knowledge Collector

建议作为独立项目或独立 skill，不放进执行器仓库。

目标：

- 采集视频元数据、字幕、简介、标签、UP 信息和可选摘要。
- 形成本地知识库条目，支持后续检索、问答和复盘。
- 保留来源 URL、采集时间、视频状态和更新检测信息。

首版非目标：

- 不改变用户收藏夹。
- 不读取任务包执行状态作为唯一真源。
- 不把 Cookie、SESSDATA、csrf 或账号凭据写入知识库。

## 推荐开发顺序

1. 固化 Plan Generator 的输入数据结构。
2. 写 `bilibili-favorites-planner` skill 的 `SKILL.md` 和示例输入/输出。
3. 先支持从人工导出的收藏夹清单生成任务包，再考虑浏览器自动读取。
4. 增加任务包 schema 校验和 dry-run 审查报告。
5. 用当前 Executor 导入示例任务包验证预检显示。
6. 单独启动 Knowledge Collector，定义知识条目 schema。

## 集成边界

- Plan Generator 输出 JSON 文件。
- Executor 只读取 JSON 文件，不调用 AI。
- Knowledge Collector 输出 Markdown/JSON/SQLite 等本地知识库，不调用 Executor。
- 三者都不得要求用户手动输入 Cookie、SESSDATA、csrf 或账号密码。
