# dsh-nav-pointer

> DSH (DeepSeek Harness) Web 客户端插件：在聊天界面左侧添加一条消息指针导轨，每条用户消息对应一个短横条标记，点击可快速跳转到对应消息位置，鼠标悬停显示消息预览气泡。
>
> A DSH Web client plugin that adds a vertical message pointer rail to the left of the chat area. Each user message gets a clickable dash marker that scrolls to that message; hover shows a preview bubble.

## 功能 Features

- 📍 **消息指针导轨**：聊天区域左侧垂直排列的短横条，每个用户消息对应一个
- 🎯 **点击跳转**：点击横条平滑滚动到对应的用户消息
- 🔵 **当前位置高亮**：当前视口所在消息的横条自动高亮为蓝色
- 💬 **悬停预览气泡**：鼠标悬停横条弹出消息预览气泡（毛玻璃背景、箭头指向、圆角）
- 🖱️ **拖拽快速滚动（Scrub）**：按住横条上下拖动，像滚动条一样快速浏览对话；轻点（不拖动）仍精确跳转到对应消息
- ⌨️ **键盘快捷键**：
  - `Alt+↑ / Alt+↓` 在用户消息间上下跳转
  - `Alt+Shift+↑ / Alt+Shift+↓` 跳到第一条/最后一条消息
- ⚙️ **设置面板**：设置 → 消息指针 页面可调滚动时长、导轨/气泡/键盘开关、标记压缩，改动即时生效并持久化
- 📐 **实时位置跟随**：侧栏开合、窗口缩放、滚动时导轨位置逐帧跟随
- 🌓 **深浅模式自适应**：所有颜色使用 DSH 主题 token，自动适配深色/浅色主题

## 截图 Screenshots

<div align="center">
  <img src="./screenshots/screenshot-20260824-172246.png" alt="使用 DSH 发布 v0.2.0 到插件商店的总结" width="640" />

  <img src="./screenshots/screenshot-20260824-172301.png" alt="发布后重新安装并测试新版本" width="640" />
</div>

## 安装 Install

### 通过 dshmarket（推荐）

在市场里搜索 `dsh-nav-pointer` 一键安装。与其他插件一致，多数情况刷新页面即生效。

### 命令行安装（官方插件管理）

```bash
dsh plugin --profile web add dsh-nav-pointer
```

该命令会安装到 `~/.dsh/profiles/web`，并因为本包声明了
`dsh.bundle.patch`，自动把 `dsh-nav-pointer` 追加进
`dsh.profile.bundles`。重启 `dsh web` 生效。

> 若 pnpm ≥11 报 `minimumReleaseAge`（安全等待期），是**新发布的包**触发的策略，可一次性放行：
>
> ```bash
> dsh plugin --profile web add dsh-nav-pointer --config.minimumReleaseAge=0
> ```

### 开发模式（本地 link）

```bash
git clone https://github.com/kongdexu/dsh-nav-pointer
cd ~/.dsh/profiles/web
dsh plugin --profile web add link:/path/to/dsh-nav-pointer
```

用 `--config.minimumReleaseAge=0` 同理。

## 文件结构 Layout

```
src/
  core.ts             # 纯逻辑：CSS/常量/几何压缩/高亮推导/预览裁剪/行收集（无 React，可单测）
  config.ts           # 共享配置类型与默认值（host schema 与 client scope 共用）
  client.ts           # Client 端入口，挂载 shell.overlay + settings.section 槽位
  index.ts            # Host 端入口，注册 schemastery 设置命名空间（installSettingsSection）
  types/…             # 声明文件，构建时拷入 lib/types
lib/                  # esbuild 构建产物（client.js / index.js / types），发布与加载用
build.mjs             # esbuild 构建（client→iife+模块加载包装，host→esm，设置包 external）
tsconfig.json         # tsc 类型检查
vitest.config.ts      # vitest（jsdom 行为测试）
test/
  *.test.ts           # vitest 行为测试
  smoke.mjs           # 构建产物加载契约（无浏览器）
cordis.patch.yml      # Cordis profile patch，把插件插入 bundle 树
package.json          # 包元信息，含 dsh.bundle / dsh.client / peerDependencies 字段
```

## 实现说明 Implementation

- 挂载槽位：`shell.overlay`（frame-wide 浮层，`list` 槽位，不替换任何内置 UI）
- 滚动容器：`[data-conversation-scroll]`（DSH 对话区域公开约定的稳定属性）
- 用户消息行：`[data-chat-flow-kind="user"]`
- 定位：`requestAnimationFrame` 循环每帧读取 `getBoundingClientRect()`，签名变化时重算位置
- 事件：`MutationObserver` 监听消息列表变化，scroll 事件（capture 阶段）更新气泡位置

## 配置 Config

所有偏好都在 **设置 → 消息指针** 页面实时调整并持久化：

| 配置项 | 默认 | 说明 |
| --- | --- | --- |
| 滚动时长 | 260ms | 点击 / 键盘跳转动画时长（固定时长，范围和 60–2000ms） |
| 显示指针导轨 | 开 | 关闭后不渲染消息指针导轨 |
| 悬停预览气泡 | 开 | 鼠标悬停标记时的消息预览 |
| 键盘跳转 | 开 | `Alt+↑/↓` 在用户消息间跳转 |

滚轮滚动、手指触摸、拖拽导轨都会立即打断进行中的跳转动画。当用户消息很多、自然高度超出可用视口时，标记之间的间距会自动压缩到刚好铺满视口（这是固定行为，不可关闭）。

> 兼容旧用法：仍可通过 `window.__DSH_NAV_POINTER_SCROLL_MS__` 覆盖滚动时长
> （优先级高于设置面板，需在插件加载前设置），但推荐改用设置面板。

## 验证 Verify

一键跑完整校验（类型检查 → 构建 → 行为测试 → 加载契约）：

```bash
npm run check
```

- `npm run typecheck`：`tsc --noEmit` 类型检查 `src/`
- `npm run build`：esbuild 产出 `lib/`（client → iife + `window.__ModuleLoader__` 包装，host → esm）
- `npm test`：vitest + jsdom，覆盖导轨压缩几何、高亮推导、预览裁剪、行收集与样式注入
- `npm run test:smoke`：无浏览器加载构建产物 `lib/client.js`，用 mock 的
  `window.__ModuleLoader__` + React + `document` + `settingsScope` 断言插件导出
  `{ name, inject: ["slots", "settingsScope"], apply }`、`apply()` 正确注册
  `shell.overlay` 与 `settings.section` 槽位，且注入的 CSS 符合当前规格

## 故障排查 Troubleshooting

- **安装时 `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`**：本包（或 profile 里其他新发布包）在 pnpm 24h 安全等待期内，用上文一次性放行参数重试一次即可。
- **重启后看不到导轨**：确认 `dsh.profile.bundles` 里含 `dsh-nav-pointer`，且当前会话存在用户消息（无用户消息时不渲染）；清空聊天后重新发送一条再看。
- **气泡竖排/每字一行**：不会发生——气泡是 `position: fixed` 且 `width:240px`，不受导轨 36px 窄列影响。

更多实现细节见 [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)，变更记录见 [`CHANGELOG.md`](CHANGELOG.md)。

## License

MIT
