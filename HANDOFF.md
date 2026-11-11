# dsh-desktop-notify-win 定制版 · BUILD 21 交接文档

最后更新：2026-11-11
代码位置：D:\dsh work\dsh-desktop-notify-win
发布仓库：https://github.com/daha1216/dsh-desktop-notify-win
上游：https://github.com/xiaotie3088/dsh-desktop-notify-win

本文描述 BUILD 21（版本 0.5.2，含通知文案摘要与常驻宿主关闭定时器修复）的代码、配置、运行时和验证方法。它是给下一个接手的人看的：先读第 0 节判断现状，需要动手时直接看第 3、4、5、8、12 节。三版式的几何细节在第 2 节，仍沿用 BUILD 17-19 的实测数据，但已经按 BUILD 21 的代码修正了几处旧结论。

---

## 0. TL;DR

这个插件给 DeepSeek Harness 提供 Windows 桌面通知：本轮完成、需要回答、需要授权、执行出错、插件启动这五类事件发生时，在屏幕角落弹一张自绘卡片。点卡片会切回 DSH 所在的虚拟桌面并聚焦，不抢当前窗口焦点。

BUILD 20 的核心变化：

- host 端从单文件拆成 index.js + lib/ 八个模块，通知编排、文案摘要、配置、历史、日志、路径、渲染宿主各自独立。
- notify.ps1 新增 -Serve 常驻宿主模式：第一张卡片出现时启动一个 powershell.exe，之后所有卡片复用；连续失败才回退到每次一个短命进程。
- 设置页重写为六段式：通知什么 / 什么时候不打扰 / 样式 / 最近通知 / 数据与维护 / 实时预览。
- 新增五类事件开关、免打扰时段、前台 / 全屏 / 专注助手抑制、最多同屏、显示器选择、点击行为、历史 50 条与抑制原因、预览与重播、导入导出、恢复默认。
- 配置和历史搬到数据目录（默认 %USERPROFILE%\.dsh\desktop-notify），首次运行会从插件目录的旧 settings.json 迁移。
- 八套预设、三种版式保留；dsh 白卡仍按参考图逐像素复刻，但颜色、圆角、高光、缩放已经统一走通用卡片路径。
- 修复了旧版若干行为不一致：事件关闭也写历史、maxVisible 实际是淘汰最早而不是排队、所有事件到点自动收起、状态行/应用名的长度上限与服务端对齐。
- BUILD 21 把通知正文接到真实任务上：turnEnd 取最后一轮 assistant 文本的第一句（最多 120 字），question 取请求里的 header + question；approval/error 不变。

当前状态：

- 代码与静态测试在 BUILD 21 工作副本里完成；发布和安装状态请看 8.7 的清单，以远端 commit 和 profile 里的 package.json 为准。
- 工作副本本身不是 git 仓库；发布依靠复制进 fork 的克隆再提交。
- 没有构建步骤。index.js / client.js / lib/*.js 直接是 ESM 源码，notify.ps1 直接由 powershell.exe 执行。

最容易踩的五个坑：

1. 改工作副本不会影响正在运行的插件。desktop profile 是从 GitHub 仓库安装的副本，必须推送并更新插件，或者临时从本地目录安装。
2. 数据目录不是插件目录。旧版的 settings.json 在插件目录，BUILD 20 读取的是 %USERPROFILE%\.dsh\desktop-notify\settings.json。
3. dsh 版式的底部倒计时在真实通知里通常看不见。service 在 dsh 下总会填 status，只有直接调用 notify.ps1 或预览里状态为空时才显示倒计时。详见 9.1。
4. dsh 卡片的状态点颜色来自 accent，默认开启语义色，所以会随事件变色，不是固定红点。预设里的 #b96060 只在关闭语义色后才直接生效。
5. 预览用表单当前值，真实通知用已保存的值。这是两个不同的数据源。

---

## 1. 安装形态与路径

| 用途 | 路径 |
|---|---|
| 工作副本（唯一开发源） | D:\dsh work\dsh-desktop-notify-win |
| desktop profile 的插件安装目录 | C:\Users\daha\.dsh\profiles\desktop\node_modules\dsh-desktop-notify-win |
| desktop profile 的 package.json | C:\Users\daha\.dsh\profiles\desktop\package.json |
| 数据目录（默认） | C:\Users\daha\.dsh\desktop-notify |
| 数据目录覆盖变量 | DSH_NOTIFY_DATA_DIR |
| DSH 根目录变量 | DSH_HOME，默认 %USERPROFILE%\.dsh |
| 设计参考（单文件 HTML 复刻） | D:\dsh work\dsh-error-card.html |
| 当前 fork | https://github.com/daha1216/dsh-desktop-notify-win |
| 上游 | https://github.com/xiaotie3088/dsh-desktop-notify-win |
| DSH CLI | D:\deepseek harness\resources\runtime\cli\bin\dsh.cmd |

工作副本里还有构建时产生的临时文件（settings.json、notify.log、notify-click.log、client.js.bak-truncated-20261111 等），它们不属于发布内容。发布文件清单以 package.json 的 files 字段为准：index.js、client.js、notify.ps1、cordis.patch.yml、locale/*.json、icon.svg、README.md、LICENSE、lib/*.js。HANDOFF.md 不在 npm 包里，但应该保持在 GitHub 仓库里。

安装方式有三种，README 里有用户视角的说明：

- DSH 设置 → 插件 → 添加插件，填 https://github.com/daha1216/dsh-desktop-notify-win
- dsh plugin --profile desktop add https://github.com/daha1216/dsh-desktop-notify-win
- 本地目录：添加插件时填工作副本的绝对路径，适合调试未发布的改动

注意：desktop profile 当前是从 GitHub tarball 安装的普通目录，不是指向工作副本的 Junction，依赖写法也不是 link:。所以“改工作副本 → 刷新 DSH”不会生效。BUILD 17-19 的旧文档里说它是 Junction，那是当时的临时状态，已经过时。

---

## 2. 三种版式

### 2.1 总览

| | 横条 bar | 卡片 card | DSH 白卡 dsh |
|---|---|---|---|
| 定位 | 最轻量，一行标题 + 正文 | 信息量更大的图标卡 | 复刻 DSH Web 自己的白底大卡 |
| 默认宽度 | 400 | 528 | 531 |
| 高度 | 内容自适应，下限 68×scale | 内容自适应，下限 96×scale | 公式计算，下限 97×scale |
| 图标 | 可选圆点，颜色 accent | 56×scale 图标板 + 三层菱形 | 固定鲸鱼图标板 51×scale |
| 小标题 eyebrow | 不使用 | 标题上方 tracked 小字 | 左上角应用名 |
| 正文 | 最多 3 行 | 最多 3 行 | 最多 3 行，行高 1.69 倍 |
| 状态行 status | 不绘制 | 有 status 时绘制圆点 + 文案 | 底部固定 footer，始终有状态文案或倒计时 |
| 色条 accentWidth | 生效 | 不绘制 | 强制为 0 |
| 进度条 progress | 生效 | 强制关闭 | 强制关闭 |
| 关闭按钮 | 无 | 无 | 右上角 ×，独立热区 |
| 圆角 radius | 生效 | 生效 | 生效 |
| 顶部高光 shine | 生效 | 生效 | 生效，预设里为 0 |
| padX / padY | 生效 | 生效 | 忽略 |

一个容易混淆的点：dsh 版式里的 padX / padY 仍然会被 ReadStyle 读入并乘 scale，但 ComputeLayout 的 dsh 分支完全用固定几何，不使用这两个值。设置页会把它们禁用并注明“在 DSH 白卡里不生效”。

### 2.2 横条 bar

在 notify.ps1 的 ComputeLayout 的 else 分支（约 889-915 行）：

    contentLeft = round(accentW + padX)
    contentWidth = round(cardW - accentW - 2*padX - iconSpace)
    iconSpace = iconOn ? iconD + 8*scale : 0
    bodyTop = padY + titleH + gap
    cardH = bodyTop + bodyH + padY + (progressOn ? progressH + 4*scale : 0)

- 标题只画一行，超长省略号；正文最多 3 行，超长省略号。
- 色条从卡片左边缘开始，宽 accentWidth，纵向渐变；只有 accentWidth > 0.5 且不是 card 时绘制。
- 图标是直径 7×scale 的圆点，不是图标板。
- bar 不绘制 status 字段；service 在非 dsh 下默认把 status 设为 settings.status 或空，所以通常也不会有状态行。
- 关闭方式只有超时、点击、右键；没有关闭按钮。

### 2.3 卡片 card

ComputeLayout 的 card 分支（约 854-888 行）：

    colW = (cardW - 2*padX - 11*gutter) / 12
    cardTextX = padX + 2*colW + 2*gutter
    cardTextW = cardW - padX - cardTextX
    gEyebrow = 3*scale
    gDesc = 9*scale
    gStatus = 17*scale
    total = padY + eyebrowH + gEyebrow + titleH2
    if body: total += gDesc + descH
    if statusOn: total += gStatus + statusLineH2
    total += padY
    cardH = max(total, padY*2 + iconBox, 96*scale)

- 12 栏网格，左侧图标板占 2 栏，文字从第 3 栏开始。
- 标题最多显示 2 行（测量区域 titleLineH*2），实际换行交给 GDI+；正文最多 3 行。
- 图标板 56×scale，圆角 0.23 倍，底色 Blend(bg, accent, 0.10)，里面画三层菱形加中心点，都是 accent 派生色。
- 状态行圆点直径是状态行高的 0.44 倍，颜色 dotColor = accent；旧文档说状态点有 2000ms 扩散环，BUILD 20 仍保留在 Render 里，但只在 card 且 statusOn 时绘制。
- card 强制关闭 progress，不绘制 accentWidth。
- card 没有关闭按钮。

### 2.4 DSH 白卡 dsh

dsh 分支（notify.ps1 约 824-853 行）使用固定逻辑像素再乘 scale：

| 元素 | 公式/位置 |
|---|---|
| 图标板 | 51×scale，左上角 (29×scale, 32×scale)，圆角 51×0.196 |
| 文字左边界 | 101×scale |
| 右侧留白 | 25×scale |
| 可用文字宽 | max(40, cardW - 101*scale - 25*scale) |
| 应用名 top | 29×scale，字体 Segoe UI Semibold，字号 clamp(12..26, titlePx*1.15) |
| 标题 top | appTop + appH + 5.5×scale，字号 clamp(18..40, titlePx*1.60)，粗体 |
| 正文 top | titleTop + titleH + 14×scale，字号 clamp(11..34, bodyPx*1.385)，行高 round(bodyPx*1.69) |
| footer top | 有正文：bodyTop + bodyH + 14.5×scale；无正文：titleTop + titleH + 20×scale |
| footer 高 | 32×scale |
| 卡片高 | footerTop + 32×scale + 14.5×scale，下限 97×scale |
| footer 圆点 | x=文字左边界，y=footerTop+15.5×scale，7×7.6×scale |
| 链接文案 | “点击切回 ›”，右对齐，区域从 card.Right-25-300 起，宽 300×scale，高 footerH |
| 关闭 × | 中心 (card.Right-39×scale, card.Y+41×scale)，半臂 5×scale，笔宽 2×scale，圆头 |
| 关闭热区 | (card.Right-54×scale, card.Y+26×scale, 30×scale, 30×scale) |

字号派生（ReadStyle 712-719 行）：app = clamp(12s..26s, titlePx*1.15)，title = clamp(18s..40s, titlePx*1.60)，body = clamp(11s..34s, bodyPx*1.385)，meta = clamp(10s..26s, bodyPx*1.15)，link = clamp(10s..28s, bodyPx*1.27)。默认 titleSize=15、bodySize=13 时，200% DPI 的逻辑尺寸接近参考图。

配色派生（ReadStyle 775-817 行）。light 定义为背景亮度 > 140。所有颜色优先由 bg 和 fg 混合：

- 描边：light 用 Blend(bg, fg, 0.10)，dark 用 Blend(bg, white, 0.14)
- 图标板：light 0.055，dark 0.09
- 鲸鱼：light 0.36，dark 0.42
- 应用名：light 0.30，dark 0.34
- 正文：light 0.33，dark 0.38
- footer 状态字：light 0.38，dark 0.42
- 链接：light 0.22，dark 0.30
- 关闭 ×：light 0.55，dark 0.45

浅色底还会做一次冷色补正，把灰调拉出一点蓝：

- 图标板 (+0,+2,+4)，描边 (-2,0,+2)
- 应用名 (+1,+7,+16)，正文 (+0,+4,+9)
- footer 状态字 (+0,+2,+9)，链接 (+0,+6,+18)，关闭 × (+0,+4,+9)

应用名强制用 Segoe UI Semibold；应用名文案取 settings.eyebrow，空则默认 DeepSeek Harness。footer 圆点颜色是 dotColor = accent；BUILD 20 默认开启 semanticColor，所以 turnEnd 是 #7c8ff0、question 是 #d99a2b、approval 是 #d97b2b、error 是 #d9534f、startup 是 #3ba55d。预设 dsh 的 accent #b96060 会被语义色覆盖，只有关闭 semanticColor 才看得到参考图里的红点。

footer 文案有三态（DrawDshFooterLabel 1234-1254 行）：

1. status 非空 → status
2. status 为空且鼠标悬停 → “已暂停 · 移开继续”
3. status 为空且未悬停 → “N 秒后收起 · 悬停可保留”

BUILD 20 的 service 在 dsh 下把 status 设为 settings.status || 事件默认状态（如“等待你的确认”），因此真实通知通常永远走第 1 态，第 2、3 态只在直接调用 notify.ps1 或预览没有 status 时出现。这与 BUILD 18 设计的“状态行留空就看倒计时”不同，是本轮最值得重新决策的行为，详见 9.1。

dsh 的底色、文字色、圆角、高光、阴影都走通用卡片路径，不是写死的：

- 卡面按 radius 圆角填充 bg；shine > 0.001 时从上到下做白色高光渐变。
- 投影层数 dsh=7、其他=10；dsh 的 shadowPad = shadow > 0.01 ? ceil(13×scale) : 0。
- dsh 使用双层差分描边：上左 2px、下右 1px，模拟原生卡的内阴影方向；其他版式是 1px 描边加顶部白色 glaze。
- 关闭热区、链接、footer、鲸鱼是 dsh 专属绘制。

复刻精度：dsh 预设（width 531、radius 15、bg #fdfdfe、text #262b35）在 200% DPI 下渲染出的卡片约 1062×509 物理像素，即 531×254.5 逻辑像素，与参考目标 531×255 的差在 1px 内。参考图和并排对比图的生成脚本曾放在 D:\dsh work\_dshport，属于临时验证材料，不随插件发布。

### 2.5 整体缩放 scale

- ReadStyle 先取 userScale = clamp(DSH_NOTIFY_SCALE, 0.5, 1.5)，再取 targetScreen 的 DPI 比例，scale = DPI比例 × userScale。
- 所有以 scale 为后缀的几何、字号、间距、圆角、投影都会乘 s；radius/pad/margin 在 schema 里存逻辑值，渲染时再乘。
- width 也是逻辑值，最终 cardW = round(width × scale)。
- 预览在 scale > 1 时只按 100% 绘制，避免被容器裁切；真实通知按实际 scale。
- width 和 scale 是两套独立的控制：width 改卡片宽，scale 等比放大所有东西。无法只缩字而不缩卡片，这是当前架构的已知限制。
- 实测：100% 屏幕、scale=1、dsh 531 宽时位图约 1112×561，卡片 1062×509；scale=0.7 时约 780×396；scale=1.3 时约 1446×730。bar 在 80% 时约 652×181。

---

## 3. 代码地图

### 3.1 index.js（332 行）

host 插件入口，inject 为 webServer + connection。

| 区域 | 行 | 作用 |
|---|---|---|
| 导入与常量 | 1-24 | schema/paths/config/history/log/renderer-host/service/summary；API_PREFIX、MAX_BODY、WATCHER_KEY |
| sendJson / rejectionOf / readBody | 26-56 | JSON 响应、connection.requestRejection 鉴权、64KB 请求体上限 |
| sessionTitleOf / withTitle / assistantSummaryOf | 58-89 | 会话标题、通知 agent 上下文、取本轮最后一轮 assistant 摘要 |
| isRootAgent / errorMessage | 91-109 | 根 agent 判断、错误文案（截 160 字） |
| ensureApprovalWatcher | 111-141 | root.on('session/event') 监听 approval/asked，工具名兼容 data.toolName 与 toolName，1500ms 去重；全局单例，插件重载不断监听 |
| apply 初始化 | 143-186 | resolvePaths → createLogger → SettingsStore.load → HistoryStore → getRendererHost → NotificationService |
| pickPreviewAgent | 151-171 | 给测试/重播找一个可用的 agent 上下文 |
| 事件接线 | 188-230 | agent/status（idle + root）触发 turnEnd 250ms 去抖并传摘要；agent/error；user-questions/request（prepend）先弹 question（带实际问题）再 next；watcher.dispatch 弹 approval |
| HTTP 路由 | 232-310 | 见 5.4 |
| startup timer / cleanup / apply 日志 | 312-331 | onStartup 时 800ms 后弹 startup；dispose 时清 timer、解除 dispatch、dispose service、resetRendererHost |

注意两点：

- 审批 watcher 用 globalThis[Symbol.for('dsh-desktop-notify.approval-watcher')] 存单例。插件热重载时旧监听不会被重复注册，dispatch 在 apply 里重新赋值，cleanup 时置 null。
- user-questions/request 是 waterfall，插件 prepend 后调用 service.notify('question')，然后必须 next()，不能吞掉问题。

### 3.2 lib/ 模块

| 文件 | 行数 | 职责 |
|---|---|---|
| lib/schema.js | 300 | VERSION/BUILD、43 个 DEFAULTS、LIMITS、FONTS、EVENTS、SEMANTIC_ACCENTS、8 个 PRESETS、sanitize、isQuietHours、eventEnabled、accentForEvent |
| lib/summary.js | 85 | assistantSummary（最后一轮 assistant 文本）、questionSummary、cleanInline、clip、firstSentence |
| lib/service.js | 229 | NotificationService：compose、抑制、合并、payload 组装、历史、预览、重播、turnEnd 去抖 |
| lib/renderer-host.js | 296 | 常驻 notify.ps1 -Serve 宿主管理、StringDecoder 行解析、请求超时、重启上限、一次性回退 |
| lib/config.js | 68 | SettingsStore：data → package 迁移 → defaults，sanitize 后原子写 |
| lib/history.js | 76 | 最近 50 条，原子写，load/add/update/get/list/clear |
| lib/log.js | 25 | JSON 行日志，256KB 截断，serializeError |
| lib/paths.js | 35 | DSH_HOME / DSH_NOTIFY_DATA_DIR → dataDir、settings、history、log、clickLog、packageSettings |

### 3.3 client.js（1655 行）

| 区域 | 行 | 作用 |
|---|---|---|
| 预设 fallback | 59-285 | 8 套预设的前端副本，供 /meta 失败时兜底 |
| WHALE_PATH | 287 | 鲸鱼 SVG path，viewBox 0 0 50 50 |
| 基础控件 | 340-488 | Field、ColorField、Slider、Switch、PresetCard |
| ToastPreview | 490-922 | 实时预览，dsh DOM 在 722-839 行；footer 在 status 为空时显示倒计时演示文案 |
| API 与常量 | 924-1006 | API='/dsh-desktop-notify/api'、EVENT_LABELS、SUPPRESS_LABELS、LAYOUT_LABELS、FALLBACK、getJson/postJson、WCAG 对比度、formatSeconds |
| Row / SubHead / Segmented / Chip / SummaryLine | 1008-1100 | 设置页排版控件；Row 用 useId + aria-labelledby |
| SettingsPage | 1102-1644 | 见下方分段 |
| 注册 | 1646-1655 | settings.section，id desktop-notify，order 30，label 桌面通知 |

SettingsPage 的分段锚点：

- 1102-1132：state、加载 /config 后并行 /meta、busy/status/saved
- 1136-1146：dirty（JSON 比较）、beforeunload 拦截
- 1156-1168：defaults/limits/presets/events/fonts/version/build 兜底
- 1173-1235：patch、save、loadHistory、test、replay、clearHistory
- 1237-1280：applyPreset、exportSettings、applyImport、resetDefaults
- 1282-1296：对比度、ignored 字段、layoutOptions
- 1298-1324：header（版本、BUILD、dataDir、未保存、测试、保存）与 status
- 1328-1338：通知什么（5 个 Switch）
- 1340-1391：什么时候不打扰（免打扰、前台、全屏、专注助手、最多同屏、显示器、点击行为）
- 1393-1535：样式（版式、预设、停留时长、提示音、缩放、外观细节）
- 1459-1535：尺寸与位置、文字、效果、无障碍；含弹出位置 corner 与水平/垂直边距 marginX/marginY
- 1537-1581：最近通知（最多显示 30 条）
- 1583-1606：数据与维护（dataDir、loadedFrom、导出、导入、恢复默认）
- 1608-1627：实时预览（ToastPreview + 5 行摘要 + 用当前值测试）
- 1610-1644：两栏布局，左栏五段，右栏 sticky 预览

注意：状态行文案 maxLength=40、应用名 maxLength=16，与 schema 的截断上限一致；颜色对比度用 WCAG 公式，低于 4.5:1 时提示并可一键改为深色或白色文字。

### 3.4 notify.ps1（1878 行，纯 ASCII）

| 区域 | 行 | 作用 |
|---|---|---|
| param 与初始化 | 1-24 | -Quiet / -Diagnose / -Snapshot / -Serve；环境变量 title/body/timeout/logPath；Add-Type |
| DshActions | 26-329 | FindDshWindow、FocusDsh、KeepTop、DumpWindows、NotificationState（SHQueryUserNotificationState）、IsDshForeground |
| DshDpi | 331-378 | EnablePerMonitorV2（SetProcessDpiAwarenessContext -4 → SetProcessDpiAwareness 2 → SetProcessDPIAware）、ScaleFor(Screen)（GetDpiForMonitor） |
| DshToast | 380-1550 | 单张卡片的窗口、样式、布局、绘制、动画、点击、快照 |
| ReadStyle | 666-818 | 读取全部 DSH_NOTIFY_*，做 clamp、DPI 缩放、dsh 字号/配色派生 |
| ComputeLayout | 820-922 | 三种版式的几何；dshCloseRect |
| ComputePosition / ApplyStackOffset | 924-948 | 工作区角落定位、多卡纵向堆叠偏移 |
| BuildStatic | 956-1072 | 投影、卡面、圆角、高光、描边、色条，然后分派到三种内容绘制 |
| DrawCardContent | 1095-1171 | 图标板、eyebrow、标题、正文、状态行 |
| DrawDshContent | 1173-1232 | 鲸鱼、应用名、标题、正文、footer 圆点、链接、关闭 × |
| DrawDshFooterLabel | 1234-1254 | 三态 footer |
| DrawWhale / WhalePts / WhaleCounts | 1256-1376 | 手绘鲸鱼 |
| Render / PushLayered | 1377-1476 | 每帧合成透明度、进度条、状态环、dsh footer，UpdateLayeredWindow |
| OnTick | 1478-1503 | 40ms 定时器，250ms 步进重绘，淡入 170ms / 淡出 240ms，超时关闭 |
| ShowWithoutActivation / CreateParams / OnShown | 1505-1534 | 不抢焦点、分层窗口、首帧、提示音 |
| SaveStatic | 1536-1550 | 静态快照 PNG |
| DshCardSpec | 1552-1590 | 35 字段的宿主协议数据类 |
| DshHost | 1593-1815 | 常驻宿主：stdin 线程、HostForm、ProcessLine、抑制判断、maxVisible、Relayout、Shutdown |
| ApplyStyleEnv | 1817-1849 | 把 DshCardSpec 写成 DSH_NOTIFY_* 环境变量 |
| 入口 | 1853-1878 | -Serve / -Diagnose / -Snapshot / 普通弹窗 |

DshToast 内部几个关键字段：scale、cardW/cardH/bitmapW/bitmapH/shadowPad、opacity/shadowStrength/shine、progressOn/iconOn/fadeOn、layout/statusText/cardEyebrow/cardTitle/cardMode/statusOn/dshMode、dshAppText/dshLinkText、dshCloseRect。

### 3.5 其他文件

- cordis.patch.yml：向宿主插入 id=desktop-notify 的 bundle patch，config 里只放五个事件开关的初始值。
- locale/zh.json、locale/en.json：目前只有 settings.section 的标题和描述，与版式无关。
- icon.svg：设置页图标。
- package.json：ESM、win32、node>=20、files 清单、dsh.bundle.patch、dsh.client 注入 @deepseek-ai/dsh-client-ui-settings、check 脚本检查 9 个 JS 文件。

---

## 4. 配置：43 个字段

配置的唯一权威是 lib/schema.js 的 DEFAULTS + sanitize。任何入口（HTTP save、测试、导入、宿主 config、旧文件迁移）都必须经过 sanitize。

### 4.1 事件与行为（14）

| 字段 | 默认 | 范围/取值 | 说明 |
|---|---|---|---|
| onTurnEnd | true | bool | 本轮完成 |
| onQuestion | true | bool | 需要回答 |
| onApproval | true | bool | 需要授权 |
| onError | true | bool | 执行出错 |
| onStartup | false | bool | 插件启动 |
| quietEnabled | false | bool | 免打扰开关 |
| quietStart | "22:00" | HH:MM | 免打扰开始；跨午夜时按跨午夜处理 |
| quietEnd | "08:00" | HH:MM | 免打扰结束；与 start 相同视为关闭 |
| suppressForeground | true | bool | DSH 在前台时不弹 |
| suppressFullscreen | true | bool | 全屏 / 系统勿扰时不弹 |
| respectFocusAssist | true | bool | 专注助手时不弹 |
| maxVisible | 3 | 1-5 | 同屏上限；超出关闭最早一张 |
| monitor | "cursor" | cursor/primary | 跟随鼠标所在屏或固定主屏 |
| clickAction | "focus" | focus/none | 点击切回 DSH，或只关卡片 |

### 4.2 外观（29）

| 字段 | 默认 | 范围 | 说明 |
|---|---|---|---|
| layout | "dsh" | bar/card/dsh | 版式 |
| accent | "#7c8ff0" | #rrggbb | 主色；语义色开启时会被事件色覆盖 |
| background | "#ffffff" | #rrggbb | 卡片底色 |
| text | "#111418" | #rrggbb | 主文字色 |
| width | 620 | 240-720 | 逻辑宽度，最终乘 scale |
| scale | 1 | 0.5-1.5 | 整体缩放 |
| radius | 18 | 0-28 | 圆角 |
| padX | 40 | 12-40 | 水平内边距；dsh 忽略 |
| padY | 20 | 10-32 | 垂直内边距；dsh 忽略 |
| accentWidth | 0 | 0-14 | 左侧色条；card/dsh 忽略 |
| corner | "br" | tl/tr/bl/br | 弹出角落 |
| marginX | 16 | 0-400 | 距屏幕水平边 |
| marginY | 16 | 0-400 | 距屏幕垂直边 |
| titleSize | 15 | 11-22，0.5 步 | 标题字号；dsh 会派生 |
| bodySize | 15 | 10-20，0.5 步 | 正文字号；dsh 会派生 |
| font | "Microsoft YaHei UI" | 5 个预设值 | 字体；只接受字母数字空格逗号连字符，≤64 字符 |
| status | "" | ≤40 字 | 状态行文案；dsh 为空时用事件默认状态 |
| eyebrow | "" | ≤16 字 | 小标题 / 应用名 |
| durationMs | 20000 | 3000-120000，1 秒步 | 停留时长 |
| sound | false | bool | 系统提示音 |
| progress | false | bool | 进度条；仅 bar 生效 |
| icon | true | bool | bar 的圆点 / card 的图标板；dsh 固定鲸鱼 |
| fade | true | bool | 淡入淡出；reduceMotion 会关闭 |
| shadow | 0 | 0-1 | 投影强度 |
| shine | 0.02 | 0-0.3 | 顶部高光 |
| opacity | 1 | 0.5-1，0.01 步 | 整卡不透明度 |
| reduceMotion | false | bool | 减少动效，关闭 fade |
| highContrast | false | bool | 高对比；也会读取系统高对比 |
| semanticColor | true | bool | 事件语义色；关闭后统一用 accent |

### 4.3 数值限制汇总

| 字段 | min | max | 步长 |
|---|---|---|---|
| width | 240 | 720 | 10（保存取整） |
| durationMs | 3000 | 120000 | 1000 |
| marginX / marginY | 0 | 400 | 1 |
| opacity | 0.5 | 1 | 0.01 |
| radius | 0 | 28 | 1 |
| padX | 12 | 40 | 1 |
| padY | 10 | 32 | 1 |
| accentWidth | 0 | 14 | 1 |
| titleSize | 11 | 22 | 0.5 |
| bodySize | 10 | 20 | 0.5 |
| shadow | 0 | 1 | 0.01 |
| shine | 0 | 0.3 | 0.01 |
| scale | 0.5 | 1.5 | 0.05 输入、0.01 保存取整 |
| maxVisible | 1 | 5 | 1 |

### 4.4 语义色与预设

SEMANTIC_ACCENTS：

| 事件 | 颜色 |
|---|---|
| turnEnd | #7c8ff0 |
| question | #d99a2b |
| approval | #d97b2b |
| error | #d9534f |
| startup | #3ba55d |
| test / replay | #7c8ff0 |

八套预设：classic 经典深色、light 系统浅色、mono 极简灰、contrast 高对比、frost 霜白圆角、neon 午夜霓虹、cpamc 卡片版式、dsh DSH 白卡。预设只是 values 的部分覆盖，应用时与当前配置合并，再走 sanitize。dsh 预设的关键值是 accent #b96060、background #fdfdfe、text #262b35、width 531、radius 15、padX 28、padY 31、accentWidth 0、titleSize 15、bodySize 13、shadow 0.15、shine 0、progress false、icon true、fade true、layout dsh、durationMs 20000。

### 4.5 sanitize 的语义

- 以 base 为底，base 默认 DEFAULTS；只处理已知键，未知键丢弃。
- 颜色必须是 #rrggbb，否则回落 base。
- 数值 clamp 后按字段取整：width/margin/radius/pad/accentWidth/maxVisible 整数；durationMs 按秒；titleSize/bodySize 按 0.5；opacity/shadow/shine/scale 按 0.01。
- bool 字段在 undefined/null 时保留 base，否则 Boolean()。
- layout 只认 bar/card/dsh，非法值回落 base.layout（旧版曾错误地强制回落 dsh，已修）。
- monitor 只认 primary，其余 cursor；clickAction 只认 none，其余 focus。
- quietStart/quietEnd 必须是 HH:MM，否则回落 base。
- font 只允许 [A-Za-z0-9 ,-]，长度 ≤64。
- status 超过 40 字、eyebrow 超过 16 字时截断并加省略号。
- isQuietHours 支持跨午夜；起止相同视为不启用。
- eventEnabled 对未知事件返回 true，保证 test/replay 等内部事件不被开关挡住；挡事件开关的逻辑在 service 里只对五类真实事件生效。

---

## 5. 运行时

### 5.1 插件加载

apply 的顺序：

1. resolvePaths(env) 得到 dataDir 和各文件路径。
2. createLogger(paths.log) 建日志。
3. new SettingsStore({paths, log}).load(ctx.config)：data 目录 settings.json 优先；没有则读插件目录 settings.json 迁移；都没有用 DEFAULTS。
4. new HistoryStore(paths.history)。
5. getRendererHost({log, clickLog: paths.clickLog})：进程内单例。
6. new NotificationService(...)，传入 settings、history、host、log、previewAgent。
7. 注册事件、HTTP 路由、startup timer、cleanup。

宿主 config 里的五个事件开关作为 legacy seed 传入。合并顺序是 DEFAULTS → legacy → data 文件，data 文件覆盖 legacy，所以用户在设置页关掉的事件不会被宿主默认配置重启回 true。

迁移只发生一次：data 目录没有 settings.json 且插件目录有旧文件时，sanitize 后原子写入 data 目录，loadedFrom='migrated'，旧文件保留。之后保存都写 data 目录，loadedFrom='data'。插件目录的旧 settings.json 不会随包发布（files 不含它），所以新装用户直接使用 DEFAULTS。

### 5.2 通知流程

service.notify(event, options) 的顺序（lib/service.js:84）：

1. compose：根据版式生成 title/body/status/eyebrow。
2. 建 entryBase：event、title、body、status、agentId、sessionTitle、shown=false。
3. 非 force 且事件开关关闭 → 写历史，suppressed='disabled'，返回。
4. 非 force 且 isQuietHours → 写历史，suppressed='quiet'，返回。
5. 非 force 且同 key 1500ms 内重复 → 写历史，suppressed='coalesced'，返回。key = event:agentId（没有 agentId 时用 event 本身）。
6. 生成 id = 'n' + base36(now) + '-' + counter。
7. 组装 payload：cmd=show、全部外观字段、monitor、clickAction、maxVisible、highContrast、reduceMotion、suppress*；force 时三个 suppress* 全设为 false。
8. 先写一条 shown=true 的历史，再 host.show(payload)。
9. 宿主返回 shown=true → 记 notified 日志；返回 skipped → 历史改为 shown=false、suppressed=reason；异常 → suppressed='error'。
10. 返回 entry。

因此历史的写入时机是“尝试显示之后”，即使最终被宿主抑制也有记录。UI 里显示“未显示 · 原因”就是读 suppressed 字段。

turnEnd 有额外的 250ms 去抖（scheduleTurnEnd）：同一 agent 在 250ms 内多次 idle 只弹一次。这是为了避免 agent/status 抖动导致连弹。

### 5.3 常驻渲染宿主

renderer-host.js 在第一次 show 时 spawn：

    powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File notify.ps1 -Serve

stdio 全部 pipe，环境变量继承 process.env，再叠加 DSH_NOTIFY_LOG=clickLog（如果配置了）。宿主读完 Load 事件后输出 ready。

协议是 stdin/stdout 的 JSON 行：

宿主 → 插件：

    {"evt":"ready","pid":12345}
    {"evt":"shown","id":"n..."}
    {"evt":"skipped","id":"n...","reason":"foreground"}
    {"evt":"dismissed","id":"n...","by":"timeout"}
    {"evt":"error","message":"..."}
    {"evt":"bye"}

插件 → 宿主：

    {"cmd":"show","id":"n...","title":"...","body":"...","status":"...","eyebrow":"...","layout":"dsh", ...}
    {"cmd":"clear"}
    {"cmd":"ping"}
    {"cmd":"quit"}

时序细节：

- READY_TIMEOUT 15s，SHOW_TIMEOUT 12s；ready 超时会 kill 进程。
- 每个带 id 的 show 挂一个 pending，收到 shown/skipped/error 时 resolve。
- stdout 用 StringDecoder 解码，避免中文 JSON 跨 chunk 被截成非法 UTF-8；按行 parse。
- 宿主退出时 failPending，下一次 show 重新 ensure；restarts 超过 2 次后 available=false，后续直接走一次性回退。
- dispose 时发 quit 并 end stdin，800ms 后 kill。

宿主内部：

- stdin 线程逐行 ReadLine 入 ConcurrentQueue，EOF 入 __EOF__；HostForm 是 1×1 屏外、Opacity=0 的常驻窗口，40ms 定时器每 tick 最多处理 20 行。
- show 先过 SuppressionReason：suppressFullscreen 且 NotificationState 为 2/3/4/7 → fullscreen；respectFocusAssist 且 state 为 6 → quiet；suppressForeground 且 IsDshForeground → foreground。命中发 skipped，不建卡片。
- maxVisible clamp 1-5；cards.Count >= maxVisible 时关闭 cards 末尾最老的一张，CloseReason='replaced'，没有等待队列。
- 卡片显示后发 shown；FormClosed 时从 cards 移除、Relayout、发 dismissed，by 默认 'closed'。
- 多卡纵向堆叠：Relayout 按 cards 顺序 ApplyStackOffset，offset += WindowHeight + 2。
- quit 时 CloseAll("shutdown")、发 bye、Application.Exit。

CloseReason 取值：dsh 右上 × 是 close，普通点击是 click，右键是 dismiss，超时是 timeout，被替换是 replaced，clear 是 clear，shutdown 是 shutdown。dsh 点击处理先判关闭热区，命中只关窗；否则 clickAction != 'none' 时 FocusDsh 再 Close。FocusDsh 会切虚拟桌面并聚焦，尽量不改变窗口大小。

### 5.4 HTTP API

路由前缀 /dsh-desktop-notify/api，所有请求先走 connection.requestRejection（401/403 时返回 unauthorized）。请求体上限 64KB，超限返回 413。响应头带 x-dsh-notify-build。

| 方法 | 路径 | 作用 |
|---|---|---|
| GET | /meta | version、build、defaults、limits、presets、events、fonts、semanticAccents |
| GET | /config 或 / | version、build、settings、history、loadedFrom、dataDir |
| GET | /history | history 数组 |
| POST | /config action=save | sanitize + 原子写 + service.updateSettings；返回落盘后的 settings |
| POST | /config action=test | sanitize(body.settings, 当前 settings) 后 service.preview；不落盘 |
| POST | /config action=replay | 按 id 查历史并强制重播；找不到返回 404 |
| POST | /config action=clear | 清空历史文件 |

错误：未知 action 400；未知路由 404；body-too-large 413；其他异常 500 并记 route-error 日志。

### 5.5 预览与重播

- preview(settings) 用 previewAgent 的上下文，force=true，临时 settings，不写配置；事件类型是 test。force 会跳过事件开关、免打扰、合并，并把宿主抑制全关。
- replay(id) 从历史里找 entry，原事件如果是 test 就按 test 重播，否则按 replay；文案沿用历史里的 title/body/status，force=true。所以重播不受当前事件开关和抑制影响。
- 预览页的 ToastPreview 是前端独立实现，不是真的调用 notify.ps1；它按表单当前值渲染，用于快速调样式。预览与真实渲染的差异见 9.2。

### 5.6 历史与日志

history.json：{entries:[...]} 或数组，最多 50 条，新的在头部，原子写（.tmp-pid → rename）。字段：id、at、event、title、body、status、agentId、sessionTitle、shown、suppressed。UI 只显示最近 30 条，可以清空（两段确认）和重播。

notify.log：JSON 行，字段 t + evt + 其他。常见 evt：apply、settings-saved、settings-migrated、settings-migrate-error、notified、notify-skipped、notify-error、history-error、route-error、approval-dispatch、renderer-* 等。文件超过 256KB 时截断。

notify-click.log：notify.ps1 自己写的点击/弹出日志，由 DSH_NOTIFY_LOG 指定；常驻宿主用 clickLog 路径启动，一次性回退同时传 LOG 和 CLICK_LOG。

### 5.7 资源与生命周期

- 空闲时只有 DSH 进程里的 JS，无轮询、无网络。
- 第一张卡片出现时启动一个常驻 powershell.exe；之后复用。宿主自己有一个 40ms 的 WinForms 定时器（只在宿主进程里），卡片全部关闭后仍常驻，直到插件 dispose 或 DSH 退出。
- 连续启动失败 3 次（restarts 超 2）后放弃常驻，只走一次性弹窗；一次性弹窗是 spawn powershell -File notify.ps1，stdio ignore、unref。
- 插件 dispose / DSH 退出 → renderer-host dispose 发 quit；PowerShell 在 stdin EOF 时也会自行退出，避免孤儿进程。
- 多个 DSH 进程各自维护一个 renderer-host 单例，互不影响。

---

## 6. 事件映射

| 事件 | 触发 | 文字（dsh 版式） | 文字（bar/card 版式） | 语义色 |
|---|---|---|---|---|
| turnEnd | 根 agent 进入 idle，250ms 去抖 | 标题=会话标题或“本轮完成”；正文=会话已空闲，切回去看看。；状态=本轮完成 · 切回继续 | 标题=DSH · 本轮完成；正文=「会话标题」会话已空闲，切回去看看。 | #7c8ff0 |
| question | user-questions/request waterfall，prepend | 标题=会话标题或“需要回答”；正文=Agent 在等你的回答。；状态=等待你的回答 | 标题=DSH · 需要回答；正文=「会话标题」Agent 在等你的回答。 | #d99a2b |
| approval | session/event 的 approval/asked；工具名可用时正文替换为“工具「X」在等授权。” | 标题=会话标题或“需要确认”；状态=等待你的确认 | 标题=DSH · 需要确认 | #d97b2b |
| error | 根 agent 的 agent/error | 标题=会话标题或“执行出错”；正文=错误消息或“有一个 agent 步骤失败了。”；状态=执行出错 | 标题=DSH · 执行出错 | #d9534f |
| startup | 插件 apply 后 800ms（onStartup=true） | 标题=会话标题或“已就绪”；状态=已就绪 | 标题=DSH · 已就绪 | #3ba55d |
| test | 设置页测试按钮 | 标题=测试通知；状态=测试通知 | 标题=DSH · 测试通知 | #7c8ff0 |
| replay | 历史重播 | 标题=历史重播；状态=历史重播 | 标题=DSH · 历史重播 | #7c8ff0 |

补充：

- dsh 版的 title 优先用会话标题，会话标题会被 cleanTitle 处理（去 Markdown 标记、空白归一、最多 60 字）。没有会话标题时用事件 label。
- dsh 版的 eyebrow 优先用 settings.eyebrow，空则 DeepSeek Harness。
- dsh 版的 status 优先用 settings.status，空则事件默认 status。所以真实卡片不会显示倒计时。
- 非 dsh 版的 status 只用 settings.status，默认空；card 有 status 时才画状态行，bar 永远不画。
- message 参数（例如工具授权文案）优先于默认 body；error 会传 errorMessage。
- 事件开关关闭、免打扰、合并、宿主抑制都只影响“弹不弹”，历史仍然记，shown=false 加原因。

---

## 7. 构建与验证

没有编译步骤。发布前至少跑完下面四组。

### 7.1 语法检查

    cd "D:\dsh work\dsh-desktop-notify-win"
    npm run check

这会 node --check index.js、client.js 和 lib 下 7 个模块，共 9 个文件。0 退出码即通过。

PowerShell 脚本用 Windows PowerShell 5.1 的 Parser 验证：

    $errors = $null
    [System.Management.Automation.Language.Parser]::ParseFile(
      "D:\dsh work\dsh-desktop-notify-win\notify.ps1",
      [ref]$null, [ref]$errors) | Out-Null
    if ($errors.Count -gt 0) { $errors } else { "ok" }

历史上还检查过 notify.ps1 非 ASCII 字节为 0，因为 Windows PowerShell 5.1 对无 BOM 的 UTF-8 中文注释可能按 ANSI 解读，导致解析错误。修改脚本时保持纯 ASCII，中文用 \u 转义或外层字符串。

### 7.2 模块与路由测试

临时测试脚本在 D:\dsh work\_bn20（发布前可删除，下面是用途）：

- verify-modules.mjs：22 项，覆盖 schema sanitize、quiet 时段、presets、history 原子写、config 迁移和 save 后 loadedFrom、log 截断、paths。
- verify-index.mjs：13 项，假 webServer/connection 走 HTTP 路由，覆盖鉴权、meta/config/history、save/test/replay/clear、404、413、approval watcher。
- verify-renderer.mjs：4 项，覆盖常驻宿主 ready/shown、available=false 时一次性回退、非 win32 拒绝、中文跨 chunk 解码。
- render-client.mjs：用假 React 和假 ModuleLoader 渲染设置页，六组（bar/card/dsh × advanced false/true），检查六段标题、控件数量、预览文案、历史抑制文案。

运行方式：

    node "D:\dsh work\_bn20\verify-modules.mjs"
    node "D:\dsh work\_bn20\verify-index.mjs"
    node "D:\dsh work\_bn20\verify-renderer.mjs"
    node "D:\dsh work\_bn20\render-client.mjs"

2026-11-11 的基线：22/22、13/13、4/4；设置页六组全部六段齐全，basic 15 inputs / 31 buttons，advanced 41 inputs / 35 buttons（加 corner/margin 后）。

### 7.3 静态快照

不弹窗，直接把一帧写成 PNG：

    $env:DSH_NOTIFY_LAYOUT = "dsh"
    $env:DSH_NOTIFY_WIDTH = "531"
    $env:DSH_NOTIFY_BG = "#fdfdfe"
    $env:DSH_NOTIFY_TEXT = "#262b35"
    $env:DSH_NOTIFY_TITLE = "整理本周计划"
    $env:DSH_NOTIFY_BODY = "会话已空闲，切回去看看。"
    $env:DSH_NOTIFY_STATUS = ""
    powershell -NoProfile -File .\notify.ps1 -Snapshot .\snap.png

-Snapshot 只创建 DshToast 并 SaveStatic，不启动宿主。适合调几何和颜色；三条版式都可以这样看。status 留空时 dsh footer 才会画倒计时；填了 status 就画那行字。注意环境变量要在同一个 powershell 进程里设置，或者用 Start-Process 的环境块。

### 7.4 宿主协议冒烟

用 Node 启动工作副本的 notify.ps1 -Serve，发送一行 show，读取 ready→shown，再发 quit，检查 dismissed/bye。测试脚本 test-host.mjs 曾验证过这条路径（exit 0，约 3 秒）。0.5.1 另加了 test-host-timer.mjs：让卡片 3 秒超时消失，再等 2.5 秒发 ping，必须收到 pong；旧版会在关闭后约 1 秒触发 KeepTop 访问已释放窗体，测试会挂住或退出异常。重写时关键点是：spawn 时 stdio 全 pipe，stderr 也读走避免阻塞；show 的 id 自己生成；收到 shown 后发 quit；退出码应为 0。

### 7.5 真机 UI 验证清单

部署到 desktop profile 后，逐项确认：

1. 设置页出现“桌面通知”，标题显示 v0.5.2 · BUILD 21 和 dataDir。
2. 六个分段都在；展开外观细节能看到 corner、marginX、marginY、色条宽度。
3. 切换三种版式，右侧预览跟着变；dsh 预览有鲸鱼、DeepSeek Harness、状态行。
4. 点测试通知，真实卡片出现；点保存后改一个颜色，再测试，颜色变化。
5. 保存一次，重启 DSH，设置仍在；数据目录出现 settings.json。
6. 触发一次真实 turnEnd（或 startup），历史里出现记录。
7. 把 DSH 切到前台再测试，若 suppressForeground=true，历史显示“未显示 · DSH 在前台”。
8. 把 maxVisible 设为 1，连续测试两条，第一张应被替换。
9. 点击真实卡片，确认能切回 DSH；再点 dsh 右上 ×，确认只关卡片不切桌面。
10. 检查 notify.log 和 notify-click.log 没有持续报错，宿主没有每次弹窗都新建进程。

---

## 8. 变更记录

### 8.1 BUILD 17

三种版式（bar/card/dsh）打通。dsh 版式按 D:\dsh work\dsh-error-card.html 的参考图复刻：白底、圆角 15、51px 图标板、手绘鲸鱼、Segoe UI Semibold 应用名、四层文字、红点状态行、右上 ×。新增 -Snapshot 快照模式。旧 HANDOFF 里 2.x 的几何数据主要来自这一轮。

### 8.2 BUILD 18

dsh footer 的“方案 B”：status 非空显示 status，否则显示倒计时或悬停暂停文案。当时的目标是让状态行可选、空闲时看倒计时。BUILD 20 的 service 为了给 dsh 卡片一个稳定的状态文案，重新在 dsh 下填了事件默认 status，所以方案 B 在真实通知里被覆盖。这是需要重新决策的设计点，不是 bug，详见 9.1。

### 8.3 BUILD 19

整体缩放 scale（0.5-1.5），DPI 改为 Per-Monitor V2，预览防裁切，dsh 几何乘 scale。实测 70%/100%/130% 的尺寸与预期一致。设置页仍为旧版单列分区，index/client 仍是单文件。

### 8.4 BUILD 20（0.5.1）

架构：

- index.js 从 421 行缩到 317 行，通知编排搬进 lib/service.js。
- 新增 lib/schema.js、config.js、history.js、log.js、paths.js、renderer-host.js。
- notify.ps1 新增 -Serve 常驻宿主（DshHost + HostForm + stdin JSON 行协议），一次性弹窗保留为回退。
- 配置和历史迁移到 DSH_HOME/desktop-notify。

行为：

- 五类事件开关；startup 默认关。
- 免打扰时段（支持跨午夜）、DSH 前台、全屏/勿扰、专注助手四层抑制。
- 1500ms 同 key 合并；maxVisible 1-5；点击行为 focus/none。
- 历史 50 条，记录抑制原因，支持重播。
- 预览、测试、保存、导入导出、恢复默认（两段确认）。
- WCAG 对比度提示与一键改字色。
- 高对比、减少动效；高对比会强制不透明、无阴影/高光、无动画、无进度条。

渲染：

- dsh 卡片的 radius 和 shine 现在真正生效（旧文档说被固定值覆盖，已不成立）。
- dsh 的 progress 和 accentWidth 强制关闭；padX/padY/icon 被忽略；状态点颜色由 accent 决定（默认语义色）。
- dsh 投影 7 层、spread×0.8；其他 10 层。
- dsh 双层差分描边；通用卡片顶部高光；圆角、透明度、缩放统一。

设置页：

- 六段式布局，右侧 sticky 实时预览。
- 高级区补了“弹出位置”和水平/垂直边距；色条宽度滑块；状态行 40 字、应用名 16 字上限与服务端一致。
- 事件关闭仍写历史、maxVisible 淘汰最早、所有事件到点收起、历史 50/显示 30、抑制原因补 failed/spawn-failed/unsupported-platform 等文案，均已按真实行为修正。

文档与打包：

- README 重写为 BUILD 20。
- package.json version 0.5.1，homepage/repository/bugs 指向 fork，files 加 lib/*.js，check 覆盖 9 个文件。
- 本 HANDOFF 重写；2.x 的几何/配色/缩放保留并修正。

0.5.1 修复：

- 现象：真实 dsh 测试通知自动关闭后，宿主弹出 .NET 未处理异常“无法访问已释放的对象。对象名：DshToast”。
- 根因：DshToast 的 1000ms KeepTop 定时器在窗体 Close 后没有停止，下一次 Tick 调用 DshActions.KeepTop(Handle) 时访问已释放的 Form。BUILD 19 的短命进程掩盖了它，常驻宿主暴露。
- 修法：OnFormClosed 里停止 uiTimer 和 keepTimer；keepTimer 回调先判断 IsDisposed / IsHandleCreated，并吞掉 ObjectDisposedException。
- 回归：_bn20/test-host-timer.mjs，show 3 秒 → dismissed(timeout) → 等 2.5 秒 → ping → pong → quit，exit 0（6272ms）。旧实现在关闭后约 1 秒弹异常，收不到 pong。

### 8.5 BUILD 21（当前，0.5.2）

问题：通知正文与具体任务无关。turnEnd 永远是固定文案“会话已空闲，切回去看看。”，question 永远是“Agent 在等你的回答。”，只能看出是哪个会话、哪类事件。

实现：

- 新增 `lib/summary.js`。`assistantSummary(session, max=120)` 从 `session.seq-1` 向前最多 600 个事件，先找最后一个 `turn/end` 的 turn，再找同一 turn 的最后一条 `assistant/message` 的 `text` 块；`cleanInline` 去 Markdown、代码块、链接和 HTML 标签，`firstSentence` 取第一句（不足 8 字则保留整段），`clip` 截到 120 字加省略号。
- `questionSummary(request, max=140)` 取 `request.questions[0]`，把 `header` 和 `question` 用“：”拼起来，做同样的清洗和截断。
- `index.js` 新增 `assistantSummaryOf(ctx, agent)`：用 `ctx.get('sessions').get(id)` 取 Session；`agent/status` 为 idle 且是根 agent 时，把摘要传给 `service.scheduleTurnEnd(agent, message)`；`user-questions/request` 把 `questionSummary(request)` 传给 `service.notify('question', { message })`。
- `lib/service.js` 的 `scheduleTurnEnd` 接受 `message`，250ms 后调用 `notify('turnEnd', { agent, message })`；`compose` 原来就只在 message 非空时替换正文，所以不需要改文案表。
- `package.json` 的 check 增加 `lib/summary.js`；`lib/schema.js` 升到 0.5.2 / BUILD 21。

验证：

- `D:\dsh work\_bn21\test-summary.mjs`：fake session 验证只取本轮、跳过 tool-call、去 Markdown、截断、question 拼接；用真实会话日志 session-54dd088f 的最后一个 turn/end（turn 11）跑出“匹配不上。准确地说，目前只做到……”（该轮实际结论），exit 0。
- `npm run check` exit 0。
- 部署后看历史记录：真实 turnEnd 的 body 应该是本轮摘要，question 的 body 应该是实际问题。

已知边界：

- 摘要只取最后一条有文本的 assistant 消息；如果该轮以工具调用结束且没有文本，会回退到更早的文本。
- 超过 120 字的文本会被截断，Markdown 结构丢失；只用于通知，不替代会话记录。

### 8.6 client.js 截断事故（重要教训）

2026-11-11 白天，client.js 曾被写坏：文件在“同时最多显示”那一行截断，尾部 272 行丢失。原因是之前用 read 工具的分页显示结果重建大文件；read 在 2000 字符处截断了 WHALE_PATH 的长字符串，还在字符串里嵌入了字面的 “.... (line truncated to 2000 chars)”。

恢复方法：

1. DSH 会把会话事件写在 C:\Users\daha\.dsh\sessions\--D-dsh~0020work--\<session-id>\session.v4.jsonl.zstd。
2. 这个文件是多个 zstd 帧顺序拼接，Node 的 zlib.zstdDecompressSync 只解第一帧，会只得到几百字节的 session 头。
3. 必须按魔数 28 B5 2F FD 切帧，逐帧解压，拼成完整 JSONL。
4. 在事件 seq 3344（type tool/ptc-dispatch-start）的 data.arguments.content 里找到完整的 client.js：67003 B、1637 行。
5. 与损坏文件逐行 hash 比对，只有两处差异：预设名（恢复版“DSH 原生”，损坏版已改“DSH 白卡”）和 WHALE_PATH（恢复版 3419 字符完整，损坏版 2034 字符且嵌入了截断标记）。
6. 把预设名改回“DSH 白卡”后写回，备份损坏文件为 client.js.bak-truncated-20261111。

教训：不要用 read 的分页显示结果重建大文件。需要恢复时，从会话日志里取 write 调用的完整参数，或者用备份；写回后必须跑 node --check 和渲染测试。

### 8.7 发布与部署清单

当前工作副本不是 git 仓库；发布方式是 fork 上游后覆盖上传。推荐流程：

1. 在 fork daha1216/dsh-desktop-notify-win 的克隆目录里，保留上游的 .gitignore、AGENTS.md、docs/agents 等治理文件。
2. 用工作副本覆盖源码与文档：index.js、client.js、notify.ps1、package.json、README.md、HANDOFF.md、cordis.patch.yml、icon.svg、LICENSE、locale/*.json、lib/*.js。
3. 不要带 settings.json、notify.log、notify-click.log、client.js.bak-*、node_modules。
4. git add -A，commit 说明写 BUILD 21：通知文案摘要、常驻宿主、设置页重写、五类事件、历史与抑制。
5. git push origin main。
6. 用 gh api 检查 pushed_at 和远端文件哈希；确认远端 package.json version=0.5.2、BUILD=21。
7. 在 DSH 里更新插件，或执行 dsh plugin --profile desktop add https://github.com/daha1216/dsh-desktop-notify-win。更新后刷新页面。
8. 确认 profile 的 node_modules/dsh-desktop-notify-win/package.json 是 0.5.2，notify.ps1 是修复后的 BUILD 21 版本；检查日志里 apply 的 version/build/layout/dataDir。
9. 按 7.5 做真机验证。
10. 回滚方案：把 fork 的 main 指回上一个 commit，重新安装；数据目录保留，配置不会丢。

注意：README 和 package.json 里的仓库地址已经指向 daha1216；如果将来转交给别人，要同步改 homepage/repository/bugs 和 README 的安装地址。

---

## 9. 已知偏差、限制与待决策

### 9.1 dsh 底部倒计时在真实通知里不显示

- 现象：真实 dsh 卡片底部永远是事件状态文案（如“本轮完成 · 切回继续”），看不到“20 秒后收起 · 悬停可保留”，也看不到“已暂停 · 移开继续”。
- 原因：service.compose 在 dsh 下返回 status = settings.status || meta.status，永远非空；ReadStyle 的 statusOn 为 true，DrawDshFooterLabel 走第一态。
- 影响：BUILD 18 设计的方案 B 在真实通知中失效；README 已如实说明。
- 可选修法：
  A. 保持现状，把 status 当作 dsh 的固定状态文案，倒计时只在预览/快照出现。
  B. compose 在 settings.status 为空且事件有默认状态时不填 status，让倒计时出现；代价是 dsh 卡片底部不再显示事件状态。
  C. 把状态行和倒计时拆成两个区域：footer 左侧状态、右侧倒计时；需要改 DrawDshFooterLabel 和布局高度。
- 建议：先和用户确认想要哪种，再动 service.compose 或渲染层；不要默默改，因为这是产品语义。

### 9.2 预览与真实渲染的差异

- ToastPreview 是前端 DOM/CSS 模拟，不是 WinForms 渲染。字号、行高、抗锯齿、阴影、圆角会有细微差异。
- 预览在 status 为空时会显示倒计时演示文案；真实 dsh 通知通常 status 非空，所以两者 footer 可能不同。
- 预览在 scale > 1 时只按 100% 画，防止容器裁切；真实通知按实际 DPI×scale。
- 预览的“测试通知”按钮会走真实宿主（POST /config action=test），它和保存后的真实通知使用同一套渲染，但使用表单当前值；保存后才影响后续真实事件。

### 9.3 dsh 版式忽略的字段

- padX、padY：固定几何，不生效。
- icon：固定画鲸鱼，不生效。
- progress、accentWidth：强制关闭。
- status 的颜色/字号不是独立配置，由 bodySize 派生。
- 链接文案“点击切回 ›”是硬编码，不能通过设置改。
- 关闭热区固定在右上角，不能改位置。

### 9.4 颜色与语义色

- dsh 预设的 accent #b96060 在 semanticColor=true 时只影响非事件色场景（例如测试？不，test 也有语义色 #7c8ff0），实际上几乎总被事件色覆盖。参考图的红点只有在关闭 semanticColor 后才会出现。
- card 的状态点、bar 的圆点、dsh 的 footer 点都用 accent；如果用户想要固定品牌色，应关闭 semanticColor。
- README 里“红点”的说法已不准确，应该写成“彩色状态点”。本轮文档已按代码修正，README 可在下次更新时同步。

### 9.5 同屏数量与替换

- maxVisible 是直接关闭最早一张，没有等待队列；被替换的卡片不会重新出现。
- 被替换只发生在宿主层，service 已经把历史写成 shown=true，之后不会回写 suppressed='replaced'。所以历史里看不到“被新通知替换”。SUPPRESS_TEXT 里的 replaced 目前是死代码，可以删，也可以等实现队列时再用。

### 9.6 全屏 / 勿扰判断

- 依赖 SHQueryUserNotificationState 的返回值：2/3/4/7 当作 fullscreen，6 当作 quiet。Windows 的不同版本对“专注助手”和“全屏”的映射不完全一致。
- 无边框全屏游戏/视频可能不返回全屏状态，插件挡不住；这是系统限制。
- 高对比模式会覆盖用户颜色，强制不透明、无阴影、无高光、无动画、无进度条。

### 9.7 配置迁移

- 迁移是单向的：插件目录旧 settings.json → 数据目录，之后不再同步。
- 如果用户删掉数据目录，下次加载会再次从插件目录迁移（如果旧文件还在）；但 npm 包不含 settings.json，新装用户没有旧文件可迁。
- 导入只接受 DEFAULTS 已知键，未知字段丢弃；导入后需要点保存才落盘。
- 导出格式是 {schemaVersion:2, settings}，不含历史。

### 9.8 多显示器与虚拟桌面

- monitor=cursor 用 Screen.FromPoint(Cursor.Position) 决定目标屏；primary 用 Screen.PrimaryScreen。
- 虚拟桌面切换用未公开 COM（ImmersiveShell / VirtualDesktopManager），Windows 大版本更新后可能失效；失败时 FocusDsh 仍会尝试聚焦当前桌面的窗口。
- 多显示器只按代码和单屏日志验证过，真·双屏还需要实机测试。测试时重点看：目标屏工作区、DPI 缩放、corner 定位、shadowPad 是否越界。

### 9.9 其他小偏差

- notify.ps1 的 bodyLines 日志在 dsh 下可能为 0，这是旧版遗留的日志字段问题，不影响渲染。
- bar 版式的 ComputeLayout 用 iconSpace = iconD + 8×scale 计算正文宽度，而 BuildStatic 画标题时用 iconD + 9×scale 起笔，两者差 1×scale。影响很小（标题可用宽度比实际少 1×scale），但属于代码内不一致，改的时候把两处统一即可。
- dsh 关闭 × 的视觉位置和热区是按参考图估的，若参考图更新需要重新量。
- client.js 的 fallback 预设与 lib/schema.js 的 PRESETS 是两份数据；/meta 正常时用后者，/meta 失败时才用前者。改预设时要同时改两处。
- package.json 的 files 不含 HANDOFF.md；GitHub README 链接的 HANDOFF 在仓库里，但 npm 包里没有。
- 工作副本的 settings.json 是 0 字节的运行时残留，不要提交。

---

## 10. 下一步

按优先级：

1. BUILD 21 部署后按 7.5 复验设置页、三版式和保存；0.5.1 的三版式 / 保存 / 历史 / 重播 / 前台抑制已在 2026-11-12 验证过，这次重点看通知正文是否为本轮摘要。
2. 决定 dsh footer 的产品语义（9.1）。这是唯一一个“看起来像 bug、实际是设计选择”的点，建议先问用户要状态文案还是要倒计时，再改。
3. 如果用户要“被替换”也进历史，有两个方案：在宿主 dismissed 回调里通知 service 回写；或者记录 shown 后允许后续 update。当前 renderer-host 只把 dismissed 当事件日志，没有回传 service。
4. 多显示器实机测试（9.8）。
5. 把 _bn21 的 summary 测试整理进 tests/ 并加 npm script；它只依赖 Node 和一个真实会话日志样本，不依赖假 React。旧的 _bn20 临时脚本已清理。
6. README 的“红点”措辞已同步成“彩色状态点”；如果改了 9.1，FAQ 也要改。

---

## 11. 路径速查

    D:\dsh work\dsh-desktop-notify-win\index.js              host 入口
    D:\dsh work\dsh-desktop-notify-win\client.js             设置页
    D:\dsh work\dsh-desktop-notify-win\notify.ps1            渲染器 / 宿主
    D:\dsh work\dsh-desktop-notify-win\lib\schema.js         默认值 / 限制 / 预设
    D:\dsh work\dsh-desktop-notify-win\lib\service.js        通知编排
    D:\dsh work\dsh-desktop-notify-win\lib\renderer-host.js  宿主管理
    D:\dsh work\dsh-desktop-notify-win\lib\config.js         设置存储 / 迁移
    D:\dsh work\dsh-desktop-notify-win\lib\history.js        历史
    D:\dsh work\dsh-desktop-notify-win\lib\log.js            日志
    D:\dsh work\dsh-desktop-notify-win\lib\paths.js          路径
    D:\dsh work\dsh-desktop-notify-win\README.md              用户文档
    D:\dsh work\dsh-desktop-notify-win\HANDOFF.md             本文
    D:\dsh work\dsh-desktop-notify-win\package.json           元数据 / files / check
    D:\dsh work\_bn20\                                    临时测试脚本（发布前清理）
    D:\dsh work\dsh-error-card.html                         dsh 版式参考
    C:\Users\daha\.dsh\desktop-notify\settings.json       实际配置
    C:\Users\daha\.dsh\desktop-notify\history.json        实际历史
    C:\Users\daha\.dsh\desktop-notify\notify.log          插件日志
    C:\Users\daha\.dsh\desktop-notify\notify-click.log    渲染 / 点击日志

---

## 12. 新增一个配置字段的清单

按这个顺序改，漏一步就会出现“设置页能改、真实通知不生效”或相反的问题。

1. lib/schema.js
   - DEFAULTS 加默认值。
   - 如果是数值，LIMITS 加 [min,max,step]，并在 sanitize 的取整区加处理。
   - 如果是枚举/字符串/颜色/布尔，在 sanitize 里加校验和回落。
   - 如果是事件开关，EVENTS 加项，同时检查 index 的事件接线、service 的 EVENT_TEXT。
2. lib/service.js
   - notify 的 payload 加字段（如果渲染层需要）。
   - 如果是行为开关，加抑制/合并/事件判断。
3. lib/renderer-host.js
   - 持久宿主路径：show 的 payload 会原样 JSON 序列化，DshHost 的 ProcessLine 按 DshCardSpec 解析，所以还要改 notify.ps1 的 DshCardSpec 和 ApplyStyleEnv。
   - 一次性回退路径：showOneShot 的 env 映射加 DSH_NOTIFY_*；否则回退时字段丢失。
4. notify.ps1
   - DshCardSpec 加属性（默认值）。
   - ApplyStyleEnv 加环境变量。
   - ReadStyle 读取并 clamp；如果是几何/字号，乘 scale。
   - ComputeLayout / BuildStatic / Draw* 使用新值。
   - 如果是 DSH_NOTIFY_* 环境变量，确认 -Snapshot 和普通弹窗路径也能读到。
5. client.js
   - SettingsPage 的 state patch、控件、ignored 判断、摘要。
   - ToastPreview 使用新值（否则预览不跟着变）。
   - fallback PRESETS 如果涉及预设，和 lib/schema.js 同步。
6. lib/schema.js 的 PRESETS（如果这是预设字段）。
7. 版本与构建号：lib/schema.js 的 BUILD 加 1，package.json version 同步。
8. 测试：npm run check、PowerShell Parser、四个临时脚本、-Snapshot 出一张图。
9. 文档：README 的设置页说明、HANDOFF 第 4 节字段表、第 5 节运行时、第 9 节偏差。

一个字段从 UI 到像素的完整链路：

    client 表单 → POST /config save/test → index sanitize → SettingsStore.save / service.preview
    → service payload → renderer-host show
    → 持久宿主：JSON 行 → DshCardSpec → ApplyStyleEnv → DshToast.ReadStyle
    → 一次性回退：DSH_NOTIFY_* 环境变量 → DshToast.ReadStyle
    → ComputeLayout → BuildStatic → Render → UpdateLayeredWindow

---

## 13. 结语

BUILD 20 的重点不是再加一套外观，而是把“通知该不该弹、弹什么、弹完记什么”从单一文件里拆出来，让渲染器只负责画。现在 host 侧的决策（schema/service/config/history）和渲染侧的决策（notify.ps1）边界清楚，设置页只是这两层的视图。

接手时最值得先确认的三件事：desktop profile 里跑的到底是哪个版本、数据目录有没有按预期迁移、dsh footer 想要状态文案还是倒计时。前两件能靠日志和文件核对，第三件需要用户拍板。
