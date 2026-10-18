# 任务跟踪器：本地 Markdown

本仓库的 issue 与 spec 以 markdown 文件形式存放在 `.scratch/` 目录下。

## 约定

- 一个功能一个目录：`.scratch/<feature-slug>/`
- spec 文件为 `.scratch/<feature-slug>/spec.md`
- 实现类 issue 一个 ticket 一个文件，位于 `.scratch/<feature-slug>/issues/<NN>-<slug>.md`，从 `01` 开始编号，禁止把多个 ticket 合并成单个文件
- 分诊状态记录为每个 issue 文件顶部附近的 `Status:` 行（角色字符串见 `triage-labels.md`）
- 评论与对话历史追加到文件底部，置于 `## Comments` 标题之下

## 当某个 skill 要求「发布到 issue tracker」

在 `.scratch/<feature-slug>/` 下新建文件（目录不存在则创建）。

## 当某个 skill 要求「获取相关 ticket」

读取对应路径的文件。通常用户会直接给出路径或 issue 编号。

## Wayfinding 操作

供 `/wayfinder` 使用。**map** 是一个文件，每个 ticket 对应一个 **child** 文件。

- **Map**：`.scratch/<effort>/map.md`（承载 Notes / Decisions-so-far / Fog 正文）。
- **Child ticket**：`.scratch/<effort>/issues/NN-<slug>.md`，从 `01` 开始编号，正文写问题。`Type:` 行记录 ticket 类型（`research`/`prototype`/`grilling`/`task`）；`Status:` 行记录 `claimed`/`resolved`。
- **Blocking**：顶部附近的 `Blocked by: NN, NN` 行。当它列出的每个文件都已 `resolved` 时，该 ticket 才解除阻塞。
- **Frontier**：扫描 `.scratch/<effort>/issues/`，找出处于开放、未阻塞、未被认领状态的 ticket；编号最小者优先。
- **Claim**：开始任何工作前先设置 `Status: claimed` 并保存。
- **Resolve**：在 `## Answer` 标题下追加答案，设置 `Status: resolved`，然后把上下文指针（要点 + 链接）追加到 `map.md` 的 Decisions-so-far 中。
