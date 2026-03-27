# Sprite Editor

一个基于 React + Vite + TypeScript 的序列帧编辑器，用于导入、预览、切割和导出 sprite sheet。

## Features

- 拖拽、点击或粘贴导入图片
- 平移、矩形选区、套索选区
- 选区移动与导出
- 单帧预览与动画播放
- 网格与帧参数配置
- 背景快速去除
- 无拉伸 canvas resize（透明补边 / 按锚点裁切）
- 导出当前帧或选区

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
└── styles/
```

## Notes

- 当前主入口是 `index.html` + `src/main.tsx`
- `sprite-editor.html` 如果仍存在，只应视为历史文件或参考文件，不是当前主工作流

## License

MIT
