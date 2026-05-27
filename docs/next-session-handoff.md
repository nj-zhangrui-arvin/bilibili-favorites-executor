# 下个会话交接

更新时间：2026-05-27

## 当前结论

Executor 任务已完成并开源。下一阶段准备做剩下两个组件：

1. **Plan Generator Skill**：生成任务包。
2. **Knowledge Collector**：视频内容读取入知识库。

当前仓库位置：

```text
/Users/zhangrui/project/bilibili-favorites-executor
```

GitHub：

```text
https://github.com/nj-zhangrui-arvin/bilibili-favorites-executor
```

## 已完成内容

- 创建独立开源仓库 `bilibili-favorites-executor`。
- 发布单文件 Tampermonkey userscript：`bilibili_favorites_executor.user.js`。
- 移除压缩版产物，避免安装和复制来源混乱。
- README 中文优先，提供英文 README。
- 添加效果图和项目封面。
- 添加合规与平台边界说明。
- 文档覆盖：
  - `docs/task-package-schema.md`
  - `docs/safety-model.md`
  - `docs/cleanup-tools.md`
  - `docs/project-roadmap.md`
- 静态契约测试：`tests/test_static_contract.py`。

## 验证命令

```bash
node --check bilibili_favorites_executor.user.js
python3 tests/test_static_contract.py
```

最近一次验证已通过。

## 执行器边界

Executor 只做：

- 导入任务包。
- 创建缺失目标夹。
- 执行 `move` / `copy`。
- 暂停、恢复、熔断、备份。
- 导出执行报告。
- 提供独立页面维护工具：清理失效视频、删除收藏夹。

Executor 不做：

- AI 分类。
- 任务包生成。
- 视频字幕/摘要/知识库采集。
- 任何第三方账号操作。
- Cookie、SESSDATA、csrf 或账号密码收集。

## 任务包生成器建议

形态：Codex Skill。

建议名称：

```text
bilibili-favorites-planner
```

第一版目标：

- 读取收藏夹和视频元数据。
- 整理已有收藏夹分类。
- 调用 AI 生成分类建议。
- 输出可审查任务包。
- 任务包严格符合 `docs/task-package-schema.md`。
- 只读，不写 Bilibili。

建议首批文件：

```text
SKILL.md
examples/input-inventory.example.json
examples/task-package.example.json
schemas/task-package.schema.json
scripts/validate-task-package.mjs
```

关键护栏：

- 生成器只能输出计划包。
- 写操作只能交给 Executor。
- cleanup 永远不进入任务包。
- 不把字幕、摘要、知识库正文塞进任务包。

## 知识采集器建议

形态：独立项目或独立 skill。

建议名称：

```text
bilibili-video-knowledge-collector
```

第一版目标：

- 采集视频元数据、字幕、简介、标签、UP 信息。
- 输出本地知识条目。
- 支持按 `bvid` 增量更新。
- 保留来源 URL、采集时间和视频状态。

建议首批文件：

```text
README.md
docs/knowledge-entry-schema.md
examples/video-entry.example.json
scripts/collect-video-metadata.mjs
scripts/export-markdown.mjs
```

关键护栏：

- 不写 Bilibili 收藏夹。
- 不依赖 Executor 执行状态作为唯一真源。
- 不保存账号凭据。

## 下个会话推荐第一步

从 Plan Generator Skill 开始：

1. 新建 skill 目录。
2. 写 `SKILL.md`，明确只读和不执行写操作。
3. 定义输入 inventory schema。
4. 定义输出 task package schema 校验。
5. 用当前 `examples/tampermonkey-tasks.example.json` 做兼容样例。

如果需要继续维护 Executor，先跑验证命令，再改 userscript。
