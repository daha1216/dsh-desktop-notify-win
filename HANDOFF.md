# dsh-desktop-notify-win 定制版 · BUILD 17 / 18 / 19 交接文档

> 生成时间：2026-11-11 02:5x；12:5x 更新 BUILD 18（第 8.1 节：dsh footer 按拍板 B 接入倒计时 / 暂停两态）；13:2x 更新 BUILD 19（第 8.2 节：整体缩放 `scale`，三套版式通用）。对应代码状态：`index.js` BUILD=19 / 421 行 / 14562 字节、`client.js` 1352 行 / 52524 字节、`notify.ps1` 1441 行 / 64593 字节 / 纯 ASCII、`settings.json` 485 字节。宿主进程当前仍报 build 18，重启后才加载 19。
> 上一份文档（`D:\dsh work\dsh-desktop-notify-win-交接文档.md`，34756 字节，2026-11-11 00:37）只覆盖条状 / 卡片两套版式，本次不复用它；本文档覆盖全部三套版式（bar / card / dsh）。

---

## 0. 先看这里（TL;DR）

1. **三套版式已全部打通**：`bar`（条状）、`card`（卡片）、`dsh`（DSH 原生）。BUILD 17 时宿主已实际弹过 dsh 版式的通知（日志有证）；BUILD 18 只改了 footer 语义；BUILD 19 新增整体缩放（`scale`，50%–150%），三套版式通用，重启宿主即生效。
2. **唯一真源**：`D:\dsh work\dsh-desktop-notify-win`。DSH profile 里的插件目录（`C:\Users\daha\.dsh\profiles\desktop\node_modules\dsh-desktop-notify-win`）是指向它的 SymbolicLink（目录链接），`package.json` 里依赖写的是 `link:`，所以改这里就是改运行中的插件。
3. **当前实时配置**（`settings.json`，截至 2026-11-11 13:2x）已是 **dsh** 版式：底色纯白、强调色 #7c8ff0、宽 530、圆角 18、透明度 0.8、整体缩放 100%（`scale`: 1）、无投影、无进度条、`status` 留空、`eyebrow` 留空。也就是说重启宿主加载 BUILD 19 后，下一张 dsh 卡是 100% 大小、倒计时 footer。觉得太大就把「整体缩放」调到 70%–85%；想改回其它版式：设置页点对应预设（条状 / 卡片 / DSH 原生），或改 `settings.json` 的 `layout` 后刷新。
4. **本次补的交付物**：四张图（`notify-layout-dsh.png`、`notify-layout-dsh-status.png`、`notify-dsh-compare.png`、`notify-scale-compare.png`）、更新后的 `README.md`、把本文档放进插件目录当 `HANDOFF.md`（README 里原本就指向它，但文件一直不存在）。
5. **dsh footer 的语义已拍板为方案 B 并落地（BUILD 18）**：`status` 留空时不再自动补状态文案，底部显示「N 秒后收起 · 悬停可保留」，鼠标悬停变「已暂停 · 移开继续」；填了 `status` 就显示自定义文案。改完需重启宿主才生效；BUILD 19 代码的响应头 `x-dsh-notify-build` 应为 19。详见第 8.1 节。
6. **整体缩放已落地（BUILD 19，2026-11-11 13:1x）**：新增配置字段 `scale`（0.5–1.5，默认 1）。`notify.ps1` 在 `ReadStyle()` 开头把屏幕 DPI 缩放系数乘以 `DSH_NOTIFY_SCALE`，之后所有几何、字号、间距、圆角、投影都按同一个 `s` 绘制，所以三套版式都是整张卡片等比缩放；设置页「颜色与大小 → 整体缩放」是 5% 步进的滑杆。实测 70% 时 dsh 卡 780×396 物理像素（原 1112×561），130% 为 1446×730。详见 2.4 / 8.2 节。

---

## 1. 这是什么、装在哪

`dsh-desktop-notify-win` 是 DeepSeek Harness 的 Windows 桌面通知插件：本轮完成、agent 出错、需要你回答、需要授权（含权限提升）时，在**鼠标所在显示器**的角落弹一张自绘卡片；点卡片切到 DSH 所在虚拟桌面并聚焦。宿主侧只有一小段 JS，弹窗是每次 spawn 一个短命 `powershell.exe` 跑 `notify.ps1`，用分层窗口（Layered Window）+ `UpdateLayeredWindow` 逐像素自绘，不抢焦点。

| 项 | 值 |
|---|---|
| 工作副本 / 唯一真源 | `D:\dsh work\dsh-desktop-notify-win` |
| profile 安装形态 | 目录 SymbolicLink（LinkType=SymbolicLink）指向上面这个目录；`package.json` 依赖为 `link:` |
| 插件在宿主里的 id | `desktop-notify`（cordis.patch.yml 里 insert 的 id） |
| 设置页路由 | `/dsh-desktop-notify/api/config`（GET 读 / POST 存 / POST {action:'test'} 测试） |
| 宿主地址 | `http://127.0.0.1:2940`（旧端口 24194 已废弃，连接被拒） |
| 构建版本标记 | 响应头 `x-dsh-notify-build`；代码为 `19`，重启宿主后该头应报 19（当前进程仍是 18） |
| 整体缩放 | `scale` 字段，0.5–1.5（50%–150%），默认 1；三套版式通用（BUILD 19） |
| 运行日志 | 插件目录下 `notify-debug.log`（UTC，宿主侧）、`notify-click.log`（本地 +08，渲染进程侧） |

---

## 2. 三套版式的定位与总览

| | 条状 `bar` | 卡片 `card` | DSH 原生 `dsh` |
|---|---|---|---|
| 定位 | 轻量一行提示（默认） | 图标 + 多层文字的通用卡片（移植 CPAMC 启动卡） | 逐像素复刻 DSH Web 自带的白底大卡 |
| 结构 | 左侧色条 + 标题 + 正文 | 56×56 图标板 + 小标题 + 大标题 + 多行正文 + 状态行 | 51×51 圆角图标板（鲸鱼）+ 应用名 + 大标题 + 正文 + 红点状态行 + 「点击切回 ›」 + 右上 × |
| 栅格 | 单列 | 12 栏（图标占 2 栏，文字占 3–12 栏） | 固定几何常量（不跟栅格，跟参考卡） |
| 高度 | 随正文行数 | 随正文行数 | 随正文行数（公式见 2.3） |
| 左侧色条 | 可调宽度 | 强制隐藏 | 强制隐藏 |
| 底部进度条 | 可调 | 强制隐藏 | 强制隐藏 |
| 状态行 | 状态文字 | 状态文字 + 相位扩散环 | 红点 + 状态文字（每帧重绘） |
| 关闭按钮 | 无（点任意处切回） | 无 | 右上 × 独立热区（只关卡片，不切回） |
| 图标开关 | 生效（小圆点） | 生效 | **不生效**（鲸鱼图标板始终画） |
| 字号来源 | titleSize / bodySize 直接取 | 同左（另有派生） | 按固定倍率从 titleSize / bodySize 派生，见 2.3 |

设置页的版式选择在 `client.js:1044-1067`（三个按钮：条状 / 卡片 / DSH 原生）。

> **BUILD 19 起**，渲染侧的总缩放系数 `s` = 屏幕 DPI 缩放 × 用户 `scale`（0.5–1.5）。下面各节里的逻辑常量、字号、间距都乘这个 `s`，因此「整体缩放」是整张卡等比缩放；而 `width` 只改卡片宽度与正文换行，不改变字号与图标大小。

### 2.1 条状 `bar`

- 布局在 `notify.ps1:773-799`：内容左边界 = 色条宽 + 水平内边距，正文最多 3 行，标题 1 行；卡高 = 正文底 + 垂直内边距（+ 进度条高度），下限 `68 * scale`。
- 色条是左侧渐变竖条（`BuildStatic:873`），宽度 0 即不画。

### 2.2 卡片 `card`

- 布局在 `notify.ps1:738-772`：12 栏网格，`colW = (cardW - padX*2 - 11*gutter) / 12`（gutter = 12），文字从第 3 栏开始（`cardTextX = padX + colW*2 + gutter*2`）；标题最多 2 行、正文最多 3 行，超出省略；行间距 `gEyebrow=3`、`gDesc=9`、`gStatus=17`（都乘 scale）；卡高下限 `96 * scale`。
- 绘制在 `notify.ps1:965-1041 DrawCardContent`：56×56 图标板、小标题（默认从标题里按 `" · "` 切成两段，前半当小标题）、大标题、正文、状态行；当 status 非空时状态点外围画一个相位 2000ms 的扩散环（`Render:1247` 里画，最多 3.4 倍半径）。
- 标题切分规则在 `notify.ps1:652-664`：环境变量 `DSH_NOTIFY_EYEBROW` 非空则直接当小标题；否则按 `" \u00b7 "`（U+00B7 两侧空格）把标题切成两段，前段当小标题；都拿不到就写 `"DSH"`。所以宿主发的 `DSH · 本轮完成` 在卡片版式里会显示成小标题 `DSH` + 标题 `本轮完成`。

### 2.3 DSH 原生 `dsh`（本次重点）

**参考物**：`D:\dsh work\dsh-error-card.html`（单文件 HTML 复刻，从 DSH Web 的真实错误卡量出来的几何），以及 `dsh-error-card-preview.png` / `dsh-error-card-compare.png`。

**复刻原则**：

- **不写死任何颜色**。底色 `DSH_NOTIFY_BG` 与文字色 `DSH_NOTIFY_TEXT` 是唯一输入，其余颜色按「往文字色混合多少」或「往白色混合多少」派生（见下），所以浅色底 / 深色底都能自洽；浅色底再额外补一点蓝调（`Cool()`），因为参考卡实测不是纯灰而是偏蓝的冷灰。
- **几何用常量**，不复用条状 / 卡片的栅格，这样任何宽度下都跟参考卡一致（宽度只影响正文换行与右侧留白）。
- **阴影更弱**：7 层堆叠、每层 alpha 上限 5（其他版式 10 层、上限 66），描边用两层差分环拼出「上左 2px、下右 1px」的原生观感。

**几何常量（逻辑像素，DPR = 1 时的值；渲染时全部乘 `s` = 屏幕 DPI 缩放 × 用户 scale）**，见 `notify.ps1:708-736`：

| 名称 | 值 | 说明 |
|---|---|---|
| tile | 51 | 图标板边长，圆角 = 51 × 0.196 ≈ 10 |
| tileX / tileTop | 29 / 32 | 图标板左上角 |
| textX | 101 | 文字左边界（= tile 右缘 + 21） |
| rightPad | 25 | 正文右侧留白 |
| appTop | 29 | 应用名文字顶 |
| titleTop | appTop + appH + 5.5 | 大标题顶 |
| bodyTop | titleTop + titleH + 14 | 正文顶 |
| bodyLineH | `round(bodyPx * 1.69)` | 正文行距 |
| footerTop | 有正文：bodyTop + bodyH + 14.5；无正文：titleTop + titleH + 20 | footer 顶 |
| footerH | 32 | footer 高 |
| cardH | footerTop + 32 + 14.5，下限 97 | 卡高 |
| 红点 | 7 × 7.6，圆心 y = footerTop + 15.5 | 颜色 = 强调色 |
| 链接 | 右对齐，画在 `card.Right - 25 - 300` 起、宽 300、高 32 | 文案「点击切回 ›」 |
| 关闭 × | 画在 `cx = card.Right - 39`、`cy = card.Y + 41`，半臂 5、笔宽 2、圆头 | 命中热区见下 |

**字号派生**（`notify.ps1:623-630`，输入是已乘 scale 的 titlePx = titleSize×s、bodyPx = bodySize×s；clamp 的上下限也都乘 s）：

| 用途 | 公式 | 默认设置下（titleSize 15 / bodySize 13，200% 屏） | 参考卡实测 |
|---|---|---|---|
| 应用名 | `clamp(12..26, titlePx * 1.15)` | 34.5 物理像素 ≈ 17.25 逻辑 | 17px |
| 大标题 | `clamp(18..40, titlePx * 1.60)` | 48 ≈ 24 | 24px |
| 正文 | `clamp(11..34, bodyPx * 1.385)` | 36 ≈ 18 | 18px |
| 状态行 | `clamp(10..26, bodyPx * 1.15)` | 29.9 ≈ 14.95 | 15px |
| 链接 | `clamp(10..28, bodyPx * 1.27)` | 33 ≈ 16.5 | 16.5px |

**配色派生**（`notify.ps1:671-701`；`Blend(a, b, t)` = a 往 b 混 t；`light = 底色亮度 > 140`）：

| 元素 | 浅色底公式 | 深色底公式 | 浅色底再补的冷色（R,G,B 增量） |
|---|---|---|---|
| 描边 | Blend(bg, fg, 0.10) | Blend(bg, white, 0.14) | (-2, 0, 2) |
| 图标板 | Blend(bg, fg, 0.055) | Blend(bg, white, 0.09) | (0, 2, 4) |
| 鲸鱼 | Blend(fg, bg, 0.36) | 0.42 | — |
| 应用名 | 0.30 | 0.34 | (1, 7, 16) |
| 正文 | 0.33 | 0.38 | (0, 4, 9) |
| 状态行 | 0.38 | 0.42 | (0, 2, 9) |
| 链接 | 0.22 | 0.30 | (0, 6, 18) |
| 关闭 × | 0.55 | 0.45 | (0, 4, 9) |

**字体**：应用名强制 `Segoe UI Semibold`（`PickFamily` 找不到则回退），其余用 `DSH_NOTIFY_FONT`（默认 Microsoft YaHei UI）。这就是为什么参考卡里「DeepSeek Harness」是西文 Semibold 而中文标题是雅黑。

**footer 三态**（`notify.ps1:1104-1124 DrawDshFooterLabel`，每帧重绘、带 alpha）：

1. `DSH_NOTIFY_STATUS` 非空 → 显示它；
2. 否则鼠标悬停暂停中 → 「已暂停 · 移开继续」；
3. 否则 → 「N 秒后收起 · 悬停可保留」（N = 剩余秒数向上取整）。

**三种状态的触发条件**：BUILD 17 时 `index.js` 总把 `STATUS_TEXT` 填进 `DSH_NOTIFY_STATUS`，所以第 2、3 态在真实弹窗里看不到；BUILD 18 起 dsh 版式下 `status` 留空就不再补文案（`index.js:214`），倒计时和悬停暂停两态自然出现。详见第 8.1 / 9.1 节。

**窗口与交互**：

- 位图尺寸 = 卡尺寸 + 两侧各 `shadowPad`（dsh 下 = ceil(13 × s)，阴影强度 ≤ 0.01 时为 0），所以 200% 屏、卡 531 逻辑宽时，位图 1062 + 52 = 1114 物理像素宽。
- 关闭热区 `dshCloseRect = (card.Right - 54s, card.Y + 26s, 30s, 30s)`（`notify.ps1:805`），命中则只 `Close()`，不切桌面；点在别处才 `DshActions.FocusDsh(Handle)` 再关闭（`notify.ps1:564-579`）。
- 没有左侧色条、没有顶部高光（glaze），投影与描边见上面。

**实测尺寸**（`scale` 100%）：dsh 预设（宽 531、正文 3 行）在 200% 屏上渲染为卡 `1062 × 509` 物理像素 = 531 × 254.5 逻辑像素，参考卡 531 × 255 —— 差 0.5 逻辑像素。

**视觉对照**：

- `notify-dsh-compare.png`（2208×566）：左 = 原生 DSH 错误卡，右 = 插件 dsh 版式渲染。几何、字号、留白、鲸鱼轮廓基本重合，差异只有 footer 文案（原生「15 秒后收起 · 查看日志 ›」vs 插件「20 秒后收起 · 点击切回 ›」）。
- `notify-layout-dsh.png`（1114×561）：插件 dsh 版式单张预览，footer 为倒计时态。
- `notify-layout-dsh-status.png`（1114×561）：同一张卡，footer 为状态文案态（填了 `status` 时的样子）。

面板字段在两个版式下的语义不同（`client.js:1068-1092`）：

| 字段 | card 下 | dsh 下 |
|---|---|---|
| `status` | 底部状态行小字，留空按通知类型自动选 | 红点后面那行小字：留空显示倒计时 / 悬停暂停，填了显示自定义文案（BUILD 18 起） |
| `eyebrow` | 标题上方的大写小标题 | 图标右侧的应用名（留空 = DeepSeek Harness） |

### 2.4 整体缩放 `scale`（BUILD 19 新增）

用户反馈「弹窗还是太大，调宽度没用」：`width` 只改卡片宽度，dsh 版式的字号、图标、间距、行高是按参考卡锁死的，所以只缩宽度看起来变化不大。BUILD 19 增加 `scale` 字段，把整张卡连同字号一起等比缩放。

- 配置：`settings.json` 的 `scale`（0.5–1.5，默认 1），设置页「颜色与大小 → 整体缩放」滑杆（5% 步进，显示百分比）。
- 渲染入口在 `notify.ps1:585-586`：

  ```powershell
  double userScale = Math.Max(0.5, Math.Min(1.5, EnvDouble("DSH_NOTIFY_SCALE", 1.0)));
  scale = ScreenScale() * userScale;
  ```

  之后所有几何、字号、间距、圆角、投影、阴影留白都用 `s = (float)scale`，三套版式一致。
- 宿主链路：`index.js:41` 默认值 `scale: 1`、`index.js:114` `clamp(source.scale, 0.5, 1.5, base.scale)`、`index.js:216` 环境变量 `DSH_NOTIFY_SCALE`。
- 实测（200% 屏、dsh 版式、width 530）：100% → 位图 1112×561（卡 1062×509）、70% → 780×396、130% → 1446×730；bar 版式 width 400、80% → 652×181。三档并排见 `notify-scale-compare.png`。
- 预览：按 `scale` 同比缩放，但放大超过 100% 时只画到原始尺寸，避免在预览框里被裁切（见 9.2 第 9 条）。
- 注意：最终卡宽 = `width × scale`，两项都可调；但只想改文字大小而不改卡宽，目前做不到（整体缩放会一起改）。

---

## 3. 代码地图

### 3.1 `index.js`（14562 字节 / 421 行，宿主插件）

| 行 | 内容 |
|---|---|
| 1-13 | import、`SCRIPT`/`SETTINGS_FILE`/`LOG`/`CLICK_LOG`/`ROUTE`、**`BUILD = 19`** |
| 15-42 | `DEFAULTS`（26 个字段，末尾新增 `scale: 1`） |
| 44-56 | `log()`：JSON 行追加写 notify-debug.log，超过 256KB 先截断 |
| 58-84 | 校验助手：`clamp` / `color` / `bool` / `font`（只允许字母数字空格逗号连字符）/ `line`（压空白、超长截断加 …） |
| 86-115 | `sanitize()`：字段范围见第 4 节；**111 行 layout 只认 `card`/`dsh`，其余一律落 `bar`**；**114 行把 `scale` clamp 到 0.5–1.5** |
| 118-134 | `loadSettings()`（config 与 settings.json 合并后再 sanitize）/ `saveSettings()` |
| 136-166 | `sessionTitleOf()`：从 `sessions`/`sessionTitle` 服务取标题，压空白，超 60 字截 59 + … |
| 168-175 | `STATUS_TEXT`：idle/error/question/approval/test/startup 六种默认状态文案 |
| 177-224 | `showCard()`：拼 `detail`（有会话标题时前置「会话：…」一行），spawn `powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File notify.ps1`，stdio 忽略，环境变量传全部设置；**214 行** `DSH_NOTIFY_STATUS` 在 dsh 版式下允许为空（footer 转倒计时），其余版式回落到 `STATUS_TEXT[key]`；**216 行** 新增 `DSH_NOTIFY_SCALE` |
| 226-264 | `ensureApprovalWatcher()`：挂在 `globalThis[Symbol.for('dsh-desktop-notify.approval-watcher')]` 上，监听 `approval/asked`，1500ms 去重；放全局是为了插件重装窗口期也能接住提权通知 |
| 266-421 | `apply()`：配置合并、`pickPreviewAgent()`、`show()`（同 key 1.5 秒去重）、事件绑定、HTTP 路由 |
| 366-417 | `ctx.webServer.register({kind:'exact', path:ROUTE})`：GET 返回设置；POST 里 `action:'test'` 走预览（不落盘），否则 sanitize + 写文件 + 立即生效 |

### 3.2 `client.js`（52524 字节 / 1352 行，设置页 UI）

| 行 | 内容 |
|---|---|
| 59-285 | 8 套预设：`classic` 经典深色、`light` 系统浅色、`mono` 极简灰、`contrast` 高对比、`frost` 霜白圆角、`neon` 午夜霓虹、`cpamc` 卡片版式、`dsh` DSH 原生 |
| 287 | `WHALE_PATH`：鲸鱼 SVG path（viewBox 0 0 50 50） |
| 416-487 | `PresetCard`：预设卡片 |
| 490-920 | `ToastPreview`：高保真预览；bar/card 在 490-721，**dsh 预览 DOM 在 723-839**（51×51 图标板 + 39×39 鲸鱼 + 应用名 + 标题 + 正文 + 红点 footer + 右上 ×）；513-514 行读取 `scale` 并把总缩放限制在 100% 以内防裁切 |
| 1028 | 分区「快速样式」 |
| 1044-1093 | 分区「布局」：版式三选一（1044-1067）+ card/dsh 扩展字段（1068-1092，status / eyebrow，标签随版式变） |
| 1094-1112 | 分区「实时预览」+ 底部信息行（1101-1110，含「缩放 N%」） |
| 1115 / 1167 / 1239 / 1281 | 分区「颜色与大小 / 形状与排版 / 质感 / 弹出与停留」；**1144-1153 是新增的「整体缩放」滑杆**（min 0.5 / max 1.5 / step 0.05） |
| 1343-1348 | 注册设置分区：`settings.section`，id `desktop-notify`，order 30，label「桌面通知」 |

`dsh` 预设（`client.js:257-285`）：accent #b96060、background #fdfdfe、text #262b35、width 531、radius 15、padX 28、padY 31、accentWidth 0、shadow 0.15、shine 0、progress false、layout dsh、durationMs 20000。

### 3.3 `notify.ps1`（64593 字节 / 1441 行，纯 ASCII，无第三方模块）

`param([switch]$Quiet, [switch]$Diagnose, [string]$Snapshot = '')`；标题/正文/时长/日志路径全部从环境变量读（`DSH_NOTIFY_TITLE`、`DSH_NOTIFY_BODY`、`DSH_NOTIFY_MS`、`DSH_NOTIFY_LOG`）。

| 行 | 内容 |
|---|---|
| 1-9 | param 与环境变量入口 |
| 11-... | `Add-Type` 内联 C#：Win32 P/Invoke（分层窗口、虚拟桌面 COM、DPI）、`DshDpi`、`DshActions`、`DshToast` |
| 24-305 | `DshActions`：找 DSH 窗口、虚拟桌面切换、`KeepTop`（每秒重设 z-order 置顶）、日志 |
| 307-313 | `DshDpi.SetProcessDPIAware` |
| 315-1419 | `class DshToast : Form` |
| 545-581 | 构造函数：读样式 → 算布局 → 算位置；40ms UI 定时器 + 1000ms 置顶定时器；悬停暂停 / 移开续计；点击处理 |
| 583-702 | `ReadStyle()`：**585-586 行合成 `scale`（用户缩放 × DPI）**；读环境变量、clamp、派生字号与颜色（dsh 分支 607-701） |
| 704-806 | `ComputeLayout()`：dsh 708-736 / card 738-772 / bar 773-799；801-805 位图与热区 |
| 808-824 | `ComputePosition()`：按光标所在屏 WorkingArea + corner 定位，再减去 shadowPad |
| 826-961 | `BuildStatic()`：投影（dsh 7 层 / 其余 10 层）、圆角卡面、色条、dsh 双层差分描边、高光，末尾分派 |
| 965-1041 | `DrawCardContent()` |
| 1043-1102 | `DrawDshContent()`（1043-1102）+ `DrawDshFooterLabel()`（1104-1124） |
| 1126-1146 | `DrawWhale()`：四段多边形按 `WhaleCounts{223,85,37,85}` 填充，viewBox 50×50 等比缩放 |
| 1236 | `WhaleCounts` |
| 1247-1289 | `Render(alpha)`：静态帧 + 透明度矩阵；进度条；card 状态扩散环；1284 每帧补画 dsh footer |
| 1290-1339 | `PushLayered()`：CreateDIBSection + CopyMemory + UpdateLayeredWindow(ULW_ALPHA) |
| 1341-1373 | `ElapsedMs()`（扣除暂停段）、`OnTick`（超时关闭；淡入 170ms / 淡出 240ms；250ms 步进才重绘） |
| 1375-1398 | 窗口样式：`ShowWithoutActivation`、WS_EX_LAYERED / NOACTIVATE / TOOLWINDOW、OnShown 启动时钟与首帧、按需播提示音 |
| 1405-1418 | `SaveStatic()`：dsh 下额外补画 footer 再存 PNG |
| 1422-1441 | 入口：`-Diagnose` 打印窗口清单；`-Snapshot <png>` 出图；否则 Application.Run |

### 3.4 其余文件

- `package.json`（1377 字节）：name `dsh-desktop-notify-win`、version 0.4.0、type module、license MIT、author xiaotie3088、os win32、engines node>=20、exports `.` / `./client` / `./locale/*.json` / `./icon`、files 含 index.js client.js notify.ps1 cordis.patch.yml locale icon.svg README LICENSE、`scripts.check = "node --check index.js && node --check client.js"`、`dsh.bundle.patch = ./cordis.patch.yml`、`dsh.client = { platform: 'web', immediately: true, inject: ['@deepseek-ai/dsh-client-ui-settings'] }`。
- `cordis.patch.yml`（205 字节）：insert id `desktop-notify`，config `{onTurnEnd:true, onQuestion:true, onApproval:true, onError:true, onStartup:false}`。
- `locale/zh.json` / `en.json`：只有 `meta.title` 与 `meta.description` 两条，和版式无关。
- `icon.svg`、`LICENSE`：上游原样。

---

## 4. 配置字段全表

默认值来自 `index.js:15-42`，范围来自 `sanitize()`（86-115），渲染侧再各自 clamp 一次；环境变量名字由 `showCard()` 177-224 拼出。

| 字段 | 默认 | 范围 / 取值 | 生效版式 | 说明 |
|---|---|---|---|---|
| `accent` | #1f6beb | `#rrggbb` | 全部 | 强调色：色条、小圆点、dsh 红点 |
| `background` | #202020 | `#rrggbb` | 全部 | 卡底色；dsh 下还决定整套派生色 |
| `text` | #ffffff | `#rrggbb` | 全部 | 标题 / 正文基色；dsh 下标题直接用原色 |
| `width` | 400 | 240-720 | 全部 | 卡宽（逻辑像素）；最终卡宽 ≈ `width × scale` |
| `scale` | 1 | 0.5-1.5 | 全部 | 整体缩放（BUILD 19）：连同字号、图标、间距、圆角、投影一起等比缩放；100% 为原始大小 |
| `durationMs` | 20000 | 3000-120000 | 全部 | 停留时长 |
| `sound` | true | bool | 全部 | 弹窗时播系统 Asterisk |
| `corner` | br | `br`/`bl`/`tr`/`tl` | 全部 | 相对光标所在屏的角 |
| `marginX` / `marginY` | 16 / 16 | 0-400 | 全部 | 离屏幕边缘距离 |
| `opacity` | 0.97 | 0.5-1 | 全部 | 整窗透明度 |
| `radius` | 12 | 0-28 | bar / card | 圆角；dsh 按参考卡比例，不走这个值 |
| `padX` | 20 | 12-40 | bar / card | 水平内边距 |
| `padY` | 16 | 10-32 | bar / card | 垂直内边距 |
| `accentWidth` | 4 | 0-14 | bar | 色条宽度；card / dsh 强制 0 |
| `titleSize` | 15 | 11-22 | 全部 | 条状/卡片直接用；dsh 用来派生（×1.15 应用名、×1.60 大标题） |
| `bodySize` | 13 | 10-20 | 全部 | 条状/卡片直接用；dsh 用来派生（×1.385 正文、×1.15 状态行、×1.27 链接） |
| `progress` | true | bool | bar | 底部进度条；card / dsh 强制关 |
| `icon` | true | bool | bar / card | 小圆点 / 图标板；**dsh 忽略** |
| `fade` | true | bool | 全部 | 淡入 170ms / 淡出 240ms |
| `shadow` | 0.45 | 0-1 | 全部 | 投影强度；dsh 下只决定层数与透明度 |
| `shine` | 0.05 | 0-0.3 | bar / card | 顶部高光；dsh 无高光 |
| `font` | Microsoft YaHei UI | 字母数字空格逗号连字符，≤64 | bar / card 全部、dsh 除应用名 | dsh 应用名固定 Segoe UI Semibold |
| `layout` | bar | `bar`/`card`/`dsh` | — | 非法值一律落 bar |
| `status` | '' | ≤40 字 | card / dsh | 状态行 / footer 文案；dsh 留空时显示倒计时与暂停提示，超长截 39 + … |
| `eyebrow` | '' | ≤16 字 | card / dsh | card 下是小标题，dsh 下是应用名 |

---

## 5. 运行时机制（排查问题时最常看）

- **定位**：按光标所在显示器的 WorkingArea + corner 算卡片左上角，再减去 `shadowPad` 得到窗口位置；日志行 `popup screen=... work=... cursor=... corner=... card=... size=...`。
- **DPI 与整体缩放**：入口处 `SetProcessDPIAware()`；`ScreenScale() = GetDeviceCaps(LOGPIXELSX) / 96`，200% 屏得 2；`ReadStyle():585-586` 再乘用户 `scale`（0.5–1.5）得到总系数 `s`，所有几何常量、字号、间距、圆角、投影都乘它。
- **绘制**：每次重绘都从 `staticBmp`（预渲染的卡面）拷贝 + 透明度矩阵叠加，再画动态元素（进度条 / 扩散环 / dsh footer），最后 `UpdateLayeredWindow` 送显；窗口是 `WS_EX_NOACTIVATE`，不抢焦点。
- **计时**：40ms 定时器；淡入淡出按 alpha 变化或每 250ms 步进才重绘（所以 footer 的倒计时是 4Hz 级别更新，视觉上够用）。鼠标进入暂停、离开累加 `pausedAccum`，`ElapsedMs()` 扣除暂停段。
- **置顶**：每秒 `KeepTop` 一次，保证不被别的置顶窗口压住（日志里 1Hz 的 KeepTop 是正常的）。
- **点击**：dsh 版式先判右上 × 热区（命中只关窗）；其余位置 → `FocusDsh`：找 DSH 窗口 → 若在不同虚拟桌面先切桌面 → 最小化才还原 → SetForegroundWindow → 关窗。
- **提示音**：`DSH_NOTIFY_SOUND != '0'` 时 OnShown 播一次 `SystemSounds.Asterisk`。
- **去重**：宿主侧同 key 1.5 秒内只弹一次（`show()` 298-308）；审批 watcher 另有 1500ms 去重。

---

## 6. 事件 → 通知映射

| 事件 | 条件 | 标题 / 正文 | key |
|---|---|---|---|
| `agent/status` | `status === 'idle'` 且 `config.onTurnEnd` 且是 root agent | DSH · 本轮完成 / 会话已空闲，切回去看看。 | idle |
| `agent/error` | `config.onError` 且是 root agent | DSH · 出错了 / 有一个 agent 步骤失败。 | error |
| `user-questions/request` | `config.onQuestion`；prepend 监听并 `next()` 透传 | DSH · 需要你回答 / 有个问题在等你。 | question |
| `approval/asked`（全局 watcher） | `config.onApproval` | DSH · 需要你确认 / 等待你授权，点击查看 | approval |
| 设置页「测试通知」 | 无 | DSH · 测试通知 / 这是当前设置的效果预览。 | test |
| `onStartup` | 默认关 | DSH · 通知已就绪 / 插件已加载，点击可以切回会话。 | startup |

正文会自动前置一行「会话：<会话标题>」（`index.js:178`）。

---

## 7. 构建与验证手册

```powershell
cd "D:\dsh work\dsh-desktop-notify-win"
npm run check          # node --check index.js && node --check client.js
```

PowerShell 侧（`notify.ps1` 是纯 ASCII，但优先用 AST 解析 + 实际出图双重验证）：

```powershell
$errors = $null
[System.Management.Automation.Language.Parser]::ParseFile('D:\dsh work\dsh-desktop-notify-win\notify.ps1', [ref]$null, [ref]$errors) | Out-Null
"parse errors = " + $errors.Count
```

出快照图（不弹窗，直接把静态帧写成 PNG；dsh 下会自动补画 footer。整体缩放用 `DSH_NOTIFY_SCALE`（0.5–1.5），例如 `0.7` 出 70% 的图）：

```powershell
$env:DSH_NOTIFY_TITLE='未能完成操作'
$env:DSH_NOTIFY_BODY="启动器未能开始操作：" + [char]10 + "PowerShell 7 路径失效，请查看工具目录中的 settings.json。"
$env:DSH_NOTIFY_LAYOUT='dsh'
$env:DSH_NOTIFY_BG='#fdfdfe'; $env:DSH_NOTIFY_TEXT='#262b35'
$env:DSH_NOTIFY_WIDTH='531'; $env:DSH_NOTIFY_RADIUS='15'
$env:DSH_NOTIFY_SCALE='1'          # 0.5–1.5，整体缩放
$env:DSH_NOTIFY_TITLE_SIZE='15'; $env:DSH_NOTIFY_BODY_SIZE='13'
$env:DSH_NOTIFY_SHADOW='0.15'; $env:DSH_NOTIFY_SHINE='0'
$env:DSH_NOTIFY_PROGRESS='0'; $env:DSH_NOTIFY_ACCENT_W='0'
$env:DSH_NOTIFY_FONT='Microsoft YaHei UI'; $env:DSH_NOTIFY_EYEBROW='DeepSeek Harness'
$env:DSH_NOTIFY_STATUS=''          # 留空才会出倒计时态
& powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File .\notify.ps1 -Snapshot 'D:\dsh work\notify-layout-dsh.png'
```

宿主是否已加载新构建（不用重启即可判断）：

```powershell
(Invoke-WebRequest 'http://127.0.0.1:2940/dsh-desktop-notify/api/config' -UseBasicParsing).Headers['x-dsh-notify-build']
```

日志怎么看：

- `notify-debug.log`（UTC）：`apply version=5 build=19 route=...` 出现即插件已加载；`test-preview` 会打印完整配置；`settings-saved` 打印落盘内容；`spawn-error` / `exit` 打印弹窗进程结果。
- `notify-click.log`（本地 +08）：每次弹窗的 `popup ... card=... size=...`、`layout card=WxH bitmap=WxH scale=... bodyLines=...`、`click handler` / `close-click`、以及每秒 `KeepTop`。

---

## 8. 构建变化记录（BUILD 17 → 18 → 19）

### 8.0 BUILD 17 相对 BUILD 16 的变化

1. **新增第三套版式 `dsh`**：`index.js` sanitize 接受 `dsh`；`notify.ps1` 增加 596-598 的版式判定、607-701 的 dsh 样式分支、708-736 的 dsh 布局、881-900 的双层差分描边、917-918 的分派、1043-1124 的 dsh 绘制与 footer、805 的关闭热区、572 的热区命中、1284 的每帧 footer、1405-1418 的静态帧补画。
2. **设置页三选一**：`client.js:1044-1067` 增加 dsh 按钮；`status` / `eyebrow` 两个字段在 dsh 下换成「状态行文案」「应用名」语义（1068-1092）；预览 DOM 增加 dsh 分支（723-839）。
3. **新增第 8 套预设「DSH 原生」**：`client.js:257-285`。
4. **`node --check` 与 AST 解析均通过；dsh 版式已在真实宿主跑通**（`notify-debug.log` 18:40 两次 `test-preview layout "dsh"` + `shown` + `exit code 0`）。
5. **文档**：`README.md` 由「7 套预设 / 两套版式」更新为「8 套 / 三套」并补 dsh 段；补 `HANDOFF.md`（= 本文档）。

### 8.1 BUILD 18 相对 BUILD 17 的变化（2026-11-11 12:5x）

1. **dsh footer 按拍板 B 接线**：`index.js:214` 把状态环境变量改成

   ```js
   DSH_NOTIFY_STATUS: settings.status || (settings.layout === 'dsh' ? '' : STATUS_TEXT[key] || STATUS_TEXT.idle),
   ```

   dsh 版式下 `status` 留空 → 传空串 → `notify.ps1:1108-1115` 的三态生效（倒计时 / 悬停暂停）；`status` 填了就照旧显示自定义文案。bar / card 行为不变。
2. **`BUILD` 17 → 18**：宿主响应头 `x-dsh-notify-build` 变成 18，用来确认是否已加载新代码；改完必须重启宿主（或重载插件）才生效。
3. **验证**：用打桩 `spawn` 的注入测试驱动 `apply()`，六种场景的环境变量全对——dsh 空 → `''`、dsh 自定义 → 原样、card 空 → 「点击卡片切回会话」、bar 空（question 事件）→ 「正在等待你的回答」、设置页测试按钮 dsh 空 → `''`、测试按钮 dsh 自定义 → 「悬停可看日志」；响应头 `x-dsh-notify-build` 报 18。`npm run check` 与 AST 解析均通过。
4. **文档**：本文档 2.3 / 3.1 / 4 / 7 / 8.1 / 9.1 / 10 节与 `README.md` 同步更新。

### 8.2 BUILD 19 相对 BUILD 18 的变化（2026-11-11 13:1x）

背景：用户反馈「弹窗还是太大，调宽度没用」。实测确认 `width` 在 dsh 下确实生效（400 → 852 物理像素、530 → 1112、600 → 1252），但 dsh 的字号、图标、间距、行高按参考卡锁死，只缩宽度看起来变化不大，所以新增整体缩放。

1. **新增配置字段 `scale`**（0.5–1.5，默认 1）：`index.js` 的 `DEFAULTS`（15-42，`scale: 1` 在 41 行）与 `sanitize()`（86-115，114 行 clamp）各一处；`showCard()` 216 行新增环境变量 `DSH_NOTIFY_SCALE`。
2. **渲染侧统一缩放**：`notify.ps1:585-586` 把 `ScreenScale()` 乘以 `DSH_NOTIFY_SCALE` 后再赋给 `scale`，后续所有几何、字号、间距、圆角、投影都走同一个 `s`，所以三套版式（bar / card / dsh）一起等比缩放，不存在只缩卡片不缩文字的问题。
3. **设置页滑杆**：`client.js:1144-1153` 在「颜色与大小」的「卡片宽度」后新增「整体缩放」，min 0.5 / max 1.5 / step 0.05，显示为百分比；预览按 `scale` 同比缩放，放大超过 100% 时只画到原始尺寸，避免溢出裁切（513-514 行）；预览底部信息行同步显示「缩放 N%」（1101-1110）。
4. **实测尺寸**（200% 屏、dsh 版式、width 530）：100% → 位图 1112×561（卡 1062×509）、70% → 780×396、130% → 1446×730；bar 版式 width 400、80% → 652×181。三档并排见 `notify-scale-compare.png`。
5. **注入测试**：默认 `scale=1`、config 0.75、POST 2 → 1.5、POST 0.2 → 0.5、POST 缺字段沿用旧值，环境变量与 GET config 全部正确；`npm run check` 与 AST 解析通过。
6. **文档**：`README.md` 增加 `scale` 字段说明与 BUILD 19 记录；本文档新增 2.4 / 8.2 节并同步全篇行号。

---

## 9. 已知偏差与待决策

### 9.1 dsh footer 的语义（已拍板：方案 B，BUILD 18 已实现）

- 决定（2026-11-11 12:5x）：**B —— 恢复倒计时**。dsh 版式下 `status` 留空时 `DSH_NOTIFY_STATUS` 传空串，footer 走「N 秒后收起 · 悬停可保留」与「已暂停 · 移开继续」两态；`status` 填了就显示自定义文案。
- 理由：设置面板（`client.js:1068`）和预览（`client.js:561`）本来就是「留空显示倒计时」的语义，B 让真实弹窗与面板、预览三者一致；同时保留自定义文案作为可选覆盖。
- 实现：`index.js:214` 一行三元判断（见 8.1）；`notify.ps1` 与 `client.js` 无需改动。
- 被否的方案：A（保持现状、只改面板文案）真实卡永远不是原生倒计时；C（照原生硬编码「查看日志 ›」）要给 dsh 补日志动作，超出本次范围。
- 遗留取舍：dsh 版式下默认不再显示事件类型（本轮完成 / 需要你回答），要显示就在设置里填 `status`；更细的控制可以以后按方案 3 拆出独立的 `footer` 字段。

### 9.2 其他偏差（都能用，只是要知道）

1. **dsh 版式下 `icon` 开关无效**：`DrawDshContent` 无条件画图标板 + 鲸鱼，不读 `iconOn`。面板上那个开关切了没反应。
2. **dsh 版式下 `accentWidth`、`progress`、`radius`、`shine` 被覆盖**：`notify.ps1:642-643` 强制 `progressOn=false`、`accentW=0`；dsh 不画高光；圆角按参考卡比例，不走 `radius` 设置。面板目前没有对这些字段做禁用/隐藏，属于「调了不生效」的观感问题，建议后续在 `client.js` 里按版式隐藏或置灰。
3. **dsh 链接文案硬编码**：`notify.ps1:698` 固定「点击切回 ›」，`eyebrow` 只改应用名，不能改链接。
4. **dsh 下日志 `bodyLines=0`**：构造函数日志用 `bodyLineH`（bar/card 变量）当分母，dsh 用的是 `dshBodyLineH`，所以这条日志对 dsh 没意义；排查行数请直接看正文渲染或改日志字段。
5. **预览与真实渲染的关闭 × 位置略有差异**：预览是 `right:25 / top:33 / 15×15` 的盒子，真实渲染中心在「距右 39、距顶 41」、臂长 5、笔宽 2；视觉近似而非像素级一致（预览本来就声明「按比例缩放，真实卡片以弹窗为准」）。
6. **`HANDOFF.md` 之前不存在**：README 一直链向它。本次已把本文档放进插件目录补上。
7. **双屏跟随未实机验证**：代码与单屏日志（`screen=\\.\DISPLAY1 work=3840×2064`）都正常，真·双屏仍需实机试一次。
8. **`sanitize()` 不回落 `base.layout`**（`index.js:111`：`next.layout = source.layout === 'card' || source.layout === 'dsh' ? source.layout : 'bar'`）：payload 里没带 `layout` 就掉回 bar，而不是沿用上一次的版式。真实设置页每次 POST 都发完整 settings，所以当前不触发；以后若加「局部更新」类调用，要先补回落逻辑。测试时踩过一次（传 `settings:{}` 导致版式变 bar），非线上问题，未改。
9. **`scale` 与 `width` 是两套控制，不能只缩文字**：`scale` 等比缩放整张卡（字号、图标、间距一起变），`width` 只改卡宽与正文换行。想「卡宽不变、字更大」目前做不到；如果以后需要，得把字号从 `scale` 里拆出来单独乘（预估要动 `ReadStyle()` 里每个字号派生处）。另外预览在 `scale > 1` 时只画到 100% 尺寸，所见不等于最终大小，属刻意防裁切，不是 bug。

---

## 10. 下一步建议（按价值排序）

1. ~~拍板 9.1 并改代码~~ —— 已完成：方案 B 随 BUILD 18 落地（见 8.1）；整体缩放随 BUILD 19 落地（见 8.2）。两者都要重启宿主才生效。
2. **重启宿主确认 BUILD 19**：`(Invoke-WebRequest ...).Headers['x-dsh-notify-build']` 应报 19；然后弹一张真实通知，把「整体缩放」从 100% 调到 70%–85% 找一个舒服的大小。
3. 面板按版式隐藏 / 置灰无效字段（icon、accentWidth、progress、radius、shine 在 dsh 下）。
4. 双屏实机跑一次，确认「跟随鼠标显示器 + 虚拟桌面切换」在混合 DPI 下的表现（含不同显示器各自的 `scale`）。
5. 若打算发布：`package.json` 里 `files` 补 `HANDOFF.md`，README 的安装段和 GitHub 仓库同步。
6. 可选：给 `-Snapshot` 增加 `-SnapshotScale`（强制 1x/2x 出图），调样式时比对更方便；现在只能靠 `DSH_NOTIFY_SCALE` 改图的逻辑尺寸。

---

## 11. 文件与路径速查

| 路径 | 说明 |
|---|---|
| `D:\dsh work\dsh-desktop-notify-win\` | 插件唯一真源 |
| `index.js` / `client.js` / `notify.ps1` | 三个核心文件（宿主 / 设置页 / 渲染） |
| `settings.json` | 实时配置（dsh 版式，485 字节，含 `scale`） |
| `notify-debug.log` / `notify-click.log` | 两份运行日志（不入库） |
| `HANDOFF.md` | 本文档副本 |
| `D:\dsh work\dsh-error-card.html` | dsh 版式的几何/配色基准（HTML 复刻） |
| `D:\dsh work\dsh-error-card-preview.png` / `dsh-error-card-compare.png` | 基准卡的渲染与对照图 |
| `D:\dsh work\notify-dsh-compare.png` | 原生卡 vs 插件 dsh 版式并排图（2208×566） |
| `D:\dsh work\notify-scale-compare.png` | 整体缩放 70% / 100% / 130% 并排图（3442×830） |
| `D:\dsh work\notify-layout-dsh.png` | dsh 版式预览（倒计时态，1114×561） |
| `D:\dsh work\notify-layout-dsh-status.png` | dsh 版式预览（状态文案态，1114×561） |
| `D:\dsh work\notify-layout-bar.png` / `notify-layout-card.png` / `notify-card-build16.png` | 更早的版式截图 |
| `D:\dsh work\dsh-desktop-notify-win-交接文档.md` | BUILD 16 的旧交接文档（只覆盖 bar/card，保留备查） |

---

## 12. 加一个字段的清单（改这插件最容易漏的地方）

1. `index.js`：`DEFAULTS` 加默认值 → `sanitize()` 加范围 → `showCard()` 加一行环境变量 `DSH_NOTIFY_XXX`（`scale` 就是这样加的，可照抄：41 / 114 / 216 行）。
2. `notify.ps1`：`ReadStyle()` 里用 `EnvInt`/`EnvDouble`/`EnvFlag`/`Env` 读出来并 clamp → 需要的话在 `ComputeLayout()` 用上 → 在绘制函数里用上。
3. `client.js`：表单控件加到对应分区（`patch({xxx})`）→ 预览 DOM 里用上 → 想进预设就把值写进预设项（预设是「完整快照」，漏一项会继承旧值）。
4. `index.js` 的 `BUILD` 加 1，否则宿主分不清是否已重载；宿主响应头就是它。
5. `npm run check` + AST 解析 + `-Snapshot` 出图看一眼；改动大就跑一次真实通知（设置页「测试通知」）。
6. `README.md` 的「本地改造记录」和本文档同步补一行；如果新字段影响预览或缩放，还要改 `client.js` 的预览与滑杆。
