# dsh-message-pointer

> DSH (DeepSeek Harness) Web 客户端插件：在聊天界面左侧添加一条消息指针导轨，每条用户消息对应一个短横条标记，点击可快速跳转到对应消息位置，鼠标悬停显示消息预览气泡。
>
> A DSH Web client plugin that adds a vertical message pointer rail to the left of the chat area. Each user message gets a clickable dash marker that scrolls to that message; hover shows a preview bubble.

## 功能 Features

- 📍 **消息指针导轨**：聊天区域左侧垂直排列的短横条，每个用户消息对应一个
- 🎯 **点击跳转**：点击横条平滑滚动到对应的用户消息
- 🔵 **当前位置高亮**：当前视口所在消息的横条自动高亮为蓝色
- 💬 **悬停预览气泡**：鼠标悬停横条弹出消息预览气泡（毛玻璃背景、箭头指向、圆角）
- 📐 **实时位置跟随**：侧栏开合、窗口缩放、滚动时导轨位置逐帧跟随
- 🌓 **深浅模式自适应**：所有颜色使用 DSH 主题 token，自动适配深色/浅色主题

## 安装 Install

### 通过 dshmarket（推荐）

在 DSH 市场中搜索 `dsh-message-pointer` 并安装。

### 手动安装（本地 profile）

```bash
cd ~/.dsh/profiles/web
npm install dsh-message-pointer
# 或从 GitHub 直接安装：
# npm install github:kongdx/dsh-message-pointer
```

安装后编辑 `~/.dsh/profiles/web/package.json` 的 `dsh.profile.bundles` 数组，加入：

```json
"dsh-message-pointer"
```

重启 DSH Web 即可生效。

### 开发模式（本地 link）

```bash
git clone https://github.com/kongdx/dsh-message-pointer
cd dsh-message-pointer
cd ~/.dsh/profiles/web
npm link /path/to/dsh-message-pointer
```

在 `dsh.profile.bundles` 加入 `"dsh-message-pointer"`，重启 DSH。

## 文件结构 Layout

```
lib/
  index.js            # Host 端入口（client-only 插件，host 为空实现）
  client.js           # Client 端入口，挂载 shell.overlay 槽位，渲染指针导轨
  types/
    index.d.ts        # Host 类型
    client/index.d.ts # Client 类型
cordis.patch.yml      # Cordis profile patch，把插件插入 bundle 树
package.json          # 包元信息，含 dsh.bundle / dsh.client 字段
```

## 实现说明 Implementation

- 挂载槽位：`shell.overlay`（frame-wide 浮层，`list` 槽位，不替换任何内置 UI）
- 滚动容器：`[data-conversation-scroll]`（DSH 对话区域公开约定的稳定属性）
- 用户消息行：`[data-chat-flow-kind="user"]`
- 定位：`requestAnimationFrame` 循环每帧读取 `getBoundingClientRect()`，签名变化时重算位置
- 事件：`MutationObserver` 监听消息列表变化，scroll 事件（capture 阶段）更新气泡位置

## License

MIT
