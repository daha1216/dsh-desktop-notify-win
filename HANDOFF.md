# 交接：dsh-desktop-notify

给 DeepSeek Harness 用的桌面通知插件：会话空闲、需要授权、需要回答、agent 报错时，在**当前虚拟桌面**上、**鼠标所在显示器**的角落弹一张自绘卡片；点击卡片切回 DSH 所在虚拟桌面并聚焦。

## 当前状态

- 版本 `0.4.0`，包名 `dsh-desktop-notify-win`，已装进 `desktop` profile（`link:D:/AI/dsh-desktop-notify`）。
- 目录名仍叫 `dsh-desktop-notify`；npm 上同名包已被他人占用，所以包名加了 `-win`，GitHub 仓库也用 `dsh-desktop-notify-win`。
- 宿主是 host 插件，前端是设置页（`settings.section`，id `desktop-notify`，order 30）。
- 设置页有「快速样式」预设与实时预览，字段文案按“会改动什么”重写过。
- 默认外观：鼠标所在显示器右下、400×112、深色 `#202020`、蓝竖条 `#1f6beb`、20 秒、有提示音、不透明度 0.97。
- 设置页已能读写配置，「测试通知」按钮可用。
- `onStartup` 已关闭，重载不再弹「已就绪」。
- 卡片正文第一行带会话标题；授权/提权请求也会弹通知（监听会话审计事件 `approval/asked`）。
- 提问通知用 `{ prepend: true }` 抢在 Web 应答者之前弹，显式验证过。

## 文件职责

| 文件 | 作用 |
|---|---|
| `index.js` | host 插件：监听 `agent/status`、`agent/error`、`user-questions/request`；审批由 root 常驻监听 `session/event`（`approval/asked`）；读写 `settings.json`；注册本机路由 `GET/POST /dsh-desktop-notify/api/config`；spawn `notify.ps1` |
| `notify.ps1` | WinForms 自绘卡片（`Add-Type` 编译 C#）；按鼠标位置选屏；处理点击：直跳虚拟桌面、聚焦、清 topmost；写 `notify-click.log` |
| `client.js` | 设置页 UI（React，走 `__ModuleLoader__`）：快速样式、实时预览、字段表单 |
| `settings.json` | 外观/时长/声音/位置，设置页写入 |
| `cordis.patch.yml` | bundle 行 + 事件开关（`onStartup` 是 `false`） |
| `notify-debug.log` | `apply` / `shown` / `exit` / `approval-asked` / `title-miss` / 错误 |
| `notify-click.log` | 弹窗落点（`popup screen=…`）与点击诊断 |

## 关键事实（都是踩出来的，别凭直觉推翻）

1. **不能直接发 Windows toast**：独立进程调 `ToastNotificationManager` 报 `0x80073D54`（进程没有包标识）。所以用自绘窗口。
2. **卡片出现在「创建时所在的虚拟桌面」**：每次通知新起一个进程，窗口就落在你正在看的桌面上——不需要人在 DSH 桌面。
3. **DSH 以管理员权限运行**（`SetWindowPos` 跨进程报错误码 5 可证）：普通进程改不了它的 Z 序和 topmost；只有宿主拉起的同权限子进程能改。弹窗每次显示时会 `ClearTopmost` 一次。
4. **不要对非最小化窗口调 `SW_RESTORE`**：会取消最大化。只有 `IsIconic` 时才恢复。
5. **桌面切换**：优先 `IVirtualDesktopManagerInternal.SwitchDesktop`（未公开 COM，IID `53F5CA0B-158F-4124-900C-057158060B27`，vtable 里 SwitchDesktop 在索引 9；本机 25H2 build 26200 实测可用）。失败则 `MoveWindowToDesktop` 把 DSH 搬到当前桌面。日志里看 `com-switch ok` / `com-failed` / `moved-window-to-current`。
6. **授权通知必须听 `session/event` 的 `approval/asked`**：`approval/request` 是瀑布，人类应答者会先认领（而且通常是终结者），排在后面的监听器收不到，所以直接在瀑布里弹通知会漏掉提权。每条会话在派发前一定会先 append `approval/asked`，这个审计事件最可靠。会话策略是 `never` 时不弹。
    - 这个监听**挂在 `ctx.root`**，监听器随 Host 进程存活，不随插件 fiber 卸载。原因：`remove_bundle` 之后插件已经不在，`install_bundle` 的提权是在空窗期发出的；普通 fiber 监听收不到，必须用常驻监听。重装时 `ensureApprovalWatcher` 只刷新 config，不重复注册。
    - 副作用：插件被彻底卸载后，这个监听会活到下次 Host 重启；这是为了让“更新这个通知器时”的提权不漏。
7. **提权（danger-full-access）走同一个 `approval/asked`**：本机用 `pwsh` + `sandbox_permissions` 实测，日志出现 `approval-asked tool=pwsh` → `shown key=approval`。注意：2026-10-18 那次提权把 DSH GUI 卡死过一次，用户只能重启；重启会顺带清掉旧路由，遇到 GUI 卡死先重启再继续。
8. **路由要用 `ctx.effect` 包起来**：`webServer.register` 返回 disposer，旧代码直接调用、把 disposer 丢了，fiber 卸载后路由还留着，下次挂载报 `duplicate exact route`。现在写成 `ctx.effect(() => ctx.webServer.register(...))`。历史遗留的 `/dsh-desktop-notify/config` 僵尸路由要等 Host 重启才会清掉，所以路由已迁到 `/dsh-desktop-notify/api/config`。
9. **会话标题**：`ctx.get('sessions').get(agent.id)` 拿 `Session`，`ctx.get('sessionTitle').get(session)?.title` 拿标题。服务一律用 `ctx.get(...)` 取；直接写 `ctx.agents` 会抛 `cannot get property "agents" without inject`。测试通知会挑“最新的、已有标题的根会话”做预览。
10. **生效规则**：
    - 改 `index.js` / `client.js` / `package.json` → `plugin_manager` 先 `remove_bundle` 再 `install_bundle`（同一个 target）；
    - 改 `notify.ps1` / `settings.json` → 下一次弹窗即生效，不用重装；
    - 客户端改动 → 刷新页面。
11. **调试顺序**：先看 `notify-debug.log` 有没有 `shown` 或 `approval-asked`，再看 `notify-click.log` 的 `popup screen=` 与点击分支，最后才怀疑 Windows 设置（专注助手会吞声音/卡片）。
12. **提问通知要 `prepend`**：`user-questions/request` 也是瀑布，Web 提问应答者是终结者，正常注册顺序会轮不到插件。用 `ctx.on('user-questions/request', handler, { prepend: true })` 先弹通知再 `next()`。
13. **测试通知不写盘**：POST `{ action: 'test', settings }` 时用 body 里的 settings 走 `sanitize` 后直接预览（`show(..., preview)`），只写 `notify-debug.log` 的 `test-preview`，不动 `settings.json`；真正持久化只在 `action: 'save'`。
14. **保存按钮不要用 `--dsw-alias-brand-primary` 做填充底色**：本主题里这个 token 是白色，白底白字会变成一个空白按钮（实际踩过）。主按钮固定用 `#1f6beb` 底 + 白字；保存按钮和「测试通知」一起放在页头，底部不要再放操作栏。

## 发布（GitHub / npm）

- 仓库目标：`https://github.com/xiaotie3088/dsh-desktop-notify-win`（公开）
- npm 包名：`dsh-desktop-notify-win`（`dsh-desktop-notify` 已被他人占用，别改回去）

GitHub（先在网页新建**空仓库**，不要勾选 README / LICENSE / .gitignore）：

```powershell
cd D:\AI\dsh-desktop-notify
git branch -M main
git remote add origin https://github.com/xiaotie3088/dsh-desktop-notify-win.git
git push -u origin main
```

npm：

```powershell
cd D:\AI\dsh-desktop-notify
npm login
npm publish --access public
```

发布后，DSH「添加插件」里直接填 `dsh-desktop-notify-win` 即可按包名安装；只推 GitHub 的话就填仓库地址。

> 本次会话的沙箱网络访问不了 GitHub（TLS/证书被挡），`git push` 与 `npm login` 需要在普通 PowerShell 窗口里执行。

## 待办（按优先级）

1. 真·多显示器环境实测「跟随鼠标所在屏」和点击切桌面（当前机器只有一块屏）。
2. 卡片观感：圆角、阴影、更接近系统 toast。
3. 可选：卡片上加重开/关闭按钮、历史记录。

## 验证记录（2026-10-18）

- `apply` build 14，无 `route-register-error`，且没有 `shown startup`（onStartup 已关）。
- 测试通知：`shown key=test sessionTitle=…`；`popup screen=\.\DISPLAY1 … corner=br pos=…` 与屏幕工作区右下角一致。
- 提权：`approval-asked tool=pwsh` 与 `approval-asked tool=plugin_manager` 都触发 `shown key=approval` → 卡片进程 `exit code=0`。
- 重装空窗：一次 `remove_bundle` + `install_bundle` 产生两次提权；build 13 后两次都出现 `approval-asked` + `shown`（第二张是在插件已卸载时由 root 常驻监听弹出的）。
- 提问：`shown key=question sessionTitle="继续 DSH 通知插件开发"`，用户确认看到卡片。
- 设置页 v0.4.0：`node --check` 通过；页面逻辑未在浏览器里截图验证，改完刷新页面即可看到「快速样式 / 实时预览」。
- 保存按钮：截图确认过 `--dsw-alias-brand-primary` 是白色，导致旧主按钮白底白字；已改固定蓝底白字并移到页头。
- 测试预览：POST 未保存的 `{width:520, corner:'tl', marginX:24, marginY:24, …}`，日志出现 `test-preview`，弹窗 `corner=tl pos={X=24,Y=24} size=520×112`，而 `settings.json` 保持原值。
- 改名迁移：旧 bundle `dsh-desktop-notify` 已 remove，新 bundle `dsh-desktop-notify-win` 已安装；profile 依赖与 bundles 列表均已切换，`apply build 14` 正常。
- 多显示器只有单屏，选屏路径按代码与日志核对，尚未双屏实机验证。

## 新会话开场白（直接粘贴）

```
继续 D:\AI\dsh-desktop-notify 这个 DSH 通知插件。先读 HANDOFF.md、README.md 和 AGENTS.md。
当前待办：1) 多显示器实测；2) 卡片观感；3) 可选按钮/历史记录。
改完按 HANDOFF 里的生效规则重新挂载并验证，验证结果贴日志。
```
