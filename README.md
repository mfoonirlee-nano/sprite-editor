# Sprite Editor

一个基于 React 19 + Vite + TypeScript 的序列帧编辑器，用于导入、预览、切割、编辑和导出 sprite sheet。

## Features

- 点击、拖拽或粘贴导入图片
- 平移、矩形选区、套索选区
- 左侧工具栏内置 Undo 快捷操作
- 选区移动并提交回画布
- 单帧预览与动画播放
- 网格与帧参数配置（右侧面板）
- 背景取色与快速去除背景
- 无拉伸 canvas resize（透明补边 / 按锚点裁切）
- 破坏性编辑撤销（Undo）
- 导出当前帧、当前选区或整张图片
- 右侧面板支持收起/展开，方便给画布腾出更多空间

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

### Type check

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

### Test

```bash
npm run test
```

### Production build

```bash
npm run build
```

### Full check

```bash
npm run check
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
├── hooks/
│   └── useSpriteSheet.ts
├── types/
│   ├── selectionTypes.ts
│   └── spriteSheetTypes.ts
├── utils/
│   ├── selectionUtils.ts
│   ├── spriteSheetCanvasUtils.ts
│   └── spriteSheetImport.ts
├── modes/
│   └── SpriteMode/
│       ├── SpriteSidebar.tsx
│       ├── SpriteRightPanel.tsx
│       ├── SpriteViewport.tsx
│       ├── importUtils.test.ts
│       └── selectionUtils.test.ts
└── styles/
```

## Notes

- 当前主入口是 `index.html` + `src/main.tsx`
- `sprite-editor.html` 如果仍存在，只应视为历史文件或参考文件，不是当前主工作流
- 当前已提供最小自动化验证链路：`npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`
- 左侧面板当前负责顶部工具栏（Pan / Rect / Lasso / Undo）、导入、背景去除和画布尺寸；右侧面板负责帧设置、预览动画和导出
- 右侧面板支持收起/展开；收起只影响布局，不改变当前编辑状态
- 导出区支持 `Selection`、`Current Frame` 和 `Full Image`
- 纯逻辑回归测试当前优先覆盖 SpriteMode 的选择几何与图片导入逻辑，复杂交互仍需手工 smoke test

## License

MIT
