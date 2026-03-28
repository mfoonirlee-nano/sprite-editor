# Sprite Editor

一个基于 React 19 + Vite + TypeScript 的序列帧编辑器，用于导入、预览、切割、编辑和导出 sprite sheet。

## Features

- 点击、拖拽或粘贴导入图片
- 平移、矩形选区、套索选区
- 选区移动并提交回画布
- 单帧预览与动画播放
- 网格与帧参数配置
- 背景取色与快速去除背景
- 无拉伸 canvas resize（透明补边 / 按锚点裁切）
- 破坏性编辑撤销（Undo）
- 导出当前帧或当前选区

## Shortcuts

- `V`：Pan Tool
- `S`：Rect Select
- `L`：Lasso Select
- `Cmd/Ctrl+Z`：Undo

## Getting Started

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Preview build

```bash
npm run preview
```

## Tech Stack

- React 19
- React DOM 19
- TypeScript
- Vite
- Arco Design
- Tailwind CSS
- HTML5 Canvas

## Project Structure

```text
src/
├── App.tsx
├── main.tsx
├── modes/
│   └── SpriteMode/
│       ├── SpriteSidebar.tsx
│       ├── SpriteViewport.tsx
│       └── useSpriteSheet.ts
└── styles/
```

## Notes

- 当前主入口是 `index.html` + `src/main.tsx`
- `sprite-editor.html` 如果仍存在，只应视为历史文件或参考文件，不是当前主工作流
- 当前没有单独的自动化测试脚本，主要依赖 `npm run build` 与手工 smoke test 验证功能

## License

MIT
