# Sprite Editor (序列帧编辑器)

一个轻量级、完全基于浏览器的序列帧（Sprite Sheet）浏览、切割、预览与处理工具。

## 🌟 功能特性 (Features)

- **图片无缝导入**: 支持拖拽上传或点击选择图片，支持 `PNG`、`JPG`、`WEBP`、`GIF` 等主流格式。
- **序列帧参数配置与解析**: 自由设置帧宽 (W)、帧高 (H)、总帧数、起始偏移量 (Offset X/Y) 以及帧率 (FPS) 参数。
- **自动检测与网格辅助**: 包含自动检测序列帧排布功能，支持在源图片上显示辅助网格。
- **视图控制**: 灵活的缩放控制（Zoom），支持像素级平滑放大（Pixelated Rendering），适应屏幕与重置视图。
- **动画实时预览与播放**: 独立的播放控制面板，支持实时播放、逐帧查看（下一帧），并提供帧列表（Frame Strip）展示所有被切割出的基础帧。
- **选区与工具箱**: 
  - ✋ 平移工具 (Pan / V)
  - ⬚ 矩形框选区 (Select / S)
  - ✂️ 套索选区 (Lasso / L)
- **多维度导出功能**: 
  - 导出任意自定义选区 (Export Selection)
  - 导出当前单帧 (Export Frame)
  - 导出所有已切分好的帧 (Export All)
- **画布尺寸调整**: 提供便捷的画布与图片大小修改功能，支持一键更新或重置为原始尺寸。

## 🚀 快速开始 (Getting Started)

本项目纯前端实现，没有任何构建依赖，开箱即用。

1. **直接运行**:
   通过现代浏览器（Chrome/Edge/Firefox 等）直接打开项目根目录下的 `sprite-editor.html` 文件即可立即使用。
   
   推荐使用本地服务器运行以避免产生跨域（CORS）限制：

   ```bash
   # 若您安装了 Python 3
   python3 -m http.server 8000
   
   # 若您安装了 Node.js
   npx http-server
   ```
   然后在浏览器中访问相应地址，并点击 `sprite-editor.html`。

## 🛠️ 技术栈 (Technologies)

- **核心结构**: HTML5 + 原生 JavaScript (Vanilla JS)
- **图像渲染**: HTML5 Canvas API (专门配置了 `image-rendering: pixelated;` 以完美支持像素画)
- **页面样式**: 纯 CSS 实现的现代化深色主题界面 (Dark Mode)，极简与高效。

## 📂 项目文件 (File Structure)

- `sprite-editor.html`: 包含完整的 UI 界面、样式和执行逻辑的一体化核心文件。
- `package.json`: NPM 项目信息声明文件。

## 📜 许可证 (License)

本项目遵循 **MIT License**。
作者: [mffonirlee-nano]
