# 分诊标签（Triage Labels）

这些 skill 使用五个规范化的分诊角色来表述。本文件把这些角色映射到本仓库实际使用的标签字符串。

| mattpocock/skills 中的标签 | 本仓库中的标签    | 含义                               |
| -------------------------- | ----------------- | ---------------------------------- |
| `needs-triage`             | `needs-triage`    | 维护者需要评估该 issue             |
| `needs-info`               | `needs-info`      | 等待报告者补充信息                 |
| `ready-for-agent`          | `ready-for-agent` | 已完整定义，可交给 AFK agent 处理  |
| `ready-for-human`          | `ready-for-human` | 需要人工实现                       |
| `wontfix`                  | `wontfix`         | 不会处理                           |

当某个 skill 提到某个角色（例如「应用 AFK-ready 分诊标签」），请使用本表中对应的标签字符串。

在本仓库的跟踪器上，这些标签字符串写作 `.scratch/` 下每个 issue 文件顶部附近的 `Status:` 行。

如需自定义，请修改右列，使其匹配你实际使用的词汇。
