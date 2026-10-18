# 领域文档（Domain Docs）

规定工程类 skill 在探索代码库时应如何消费本仓库的领域文档。

## 开始探索前，先读这些

- 仓库根目录的 **`CONTEXT.md`**；或
- 仓库根目录的 **`CONTEXT-MAP.md`**（若存在）：它指向每个上下文各自的 `CONTEXT.md`。请读取与当前主题相关的每一个。
- **`docs/adr/`**：读取与你即将改动的区域相关的 ADR。在 multi-context 仓库中，还要检查 `src/<context>/docs/adr/` 里该上下文范围内的决策。

如果这些文件不存在，**静默继续**。不要指出它们缺失，也不要主动建议创建。`domain-modeling` skill（经由 `grill-with-docs` 和 `improve-codebase-architecture` 调用）会在术语或决策真正被确定时按需懒创建它们。

## 文件结构

本仓库为 **single-context**：

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

如果根目录出现 `CONTEXT-MAP.md`，说明仓库已变为 multi-context：

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          <- 系统级决策
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  <- 上下文专属决策
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## 使用词汇表中的词汇

当你的输出命名某个领域概念时（无论是 issue 标题、重构提案、假设，还是测试名称），请使用 `CONTEXT.md` 中定义的术语。不要漂移到词汇表明确避免的同义词。

如果你需要的概念尚未进入词汇表，这是一个信号：要么你在发明项目并不使用的语言（重新考虑），要么确实存在缺口（记下来交给 `domain-modeling`）。

## 标记 ADR 冲突

如果你的输出与既有 ADR 相矛盾，请显式指出，而不是静默覆盖：

> _与 ADR-0007（event-sourced orders）冲突，但值得重新讨论，因为……_
