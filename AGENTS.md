# 项目规则

## 输出语言（最高优先级）

无论用哪个 skill（含 mattpocock 这类英文指令技能）、无论读到的文档是什么语言，回复用户、任务记录（issue-tracker）与生成的文档一律用简体中文，除非用户明确要求英文；内部推理可用英文，对外输出必须译成中文。代码的变量名、命令、文件名保持原样，文档标题与正文用中文但保留英文字段标识；个别地方英文更准确时可保留英文。目的是让用户看懂。

## 项目内放什么

- 规则：本文件。状态：`.scratch/`（issue / spec / map，一个功能一个目录）、`CONTEXT.md`、`docs/adr/`。
- **不放技能副本**：工程技能由 `mattpocock-skills-dsh` 插件在 host 层注册，任何目录、任何预设的会话都直接可见。不要在项目里复制 `SKILL.md`，也不要改插件包里的正文（升级会被覆盖）；要定制就把差异写进本文件。

## 怎么用技能

- **模型自动取用**：`grilling`、`tdd`、`code-review`、`diagnosing-bugs`、`domain-modeling`、`codebase-design`、`prototype`、`research`、`resolving-merge-conflicts`、`wizard`、`writing-for-agents`；描述任务即可。
- **你手动调用**：输入框打 `/` 选，例如 `/ask-matt`、`/grill-me`、`/grill-with-docs`、`/to-spec`、`/to-tickets`、`/triage`、`/implement`、`/wayfinder`、`/improve-codebase-architecture`、`/handoff`、`/teach`、`/to-questionnaire`、`/wait-what`、`/setup-matt-pocock-skills`。

## Agent skills

- **Issue tracker**：issue 与 spec 以本地 markdown 存放于 `.scratch/`，一个功能一个目录。详见 `docs/agents/issue-tracker.md`。
- **Triage labels**：五个分诊角色用默认标签字符串，记录在 issue 文件的 `Status:` 行。详见 `docs/agents/triage-labels.md`。
- **Domain docs**：single-context —— 仓库根一份 `CONTEXT.md` 加 `docs/adr/`。详见 `docs/agents/domain.md`。

> 本模板已对齐 `mattpocock-skills-dsh` 0.1.8（25 个技能的插件版）。若日后接口变了，跑一次 `/setup-matt-pocock-skills`，它会就地校正本节与 `docs/agents/*.md`。

## 本项目

- 这是一枚 **DSH 插件**（host 插件 + 客户端设置页），不是业务应用；开工前先读 `HANDOFF.md`，实现细节看 `README.md`。
- 生效规则：改 `index.js` / `client.js` / `package.json` 要 `plugin_manager` 先 `remove_bundle` 再 `install_bundle`；改 `notify.ps1` / `settings.json` 下一次弹窗即生效；客户端改动要刷新页面。
- 调试先看 `notify-debug.log` 与 `notify-click.log`，不要靠猜。
- 界面文字用中文，与设置页现有风格一致。
