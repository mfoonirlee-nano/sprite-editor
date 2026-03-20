# React 19 + TailwindCSS + Arco Design 重构执行计划

> **Created**: 2026-03-20
> **Last updated**: 2026-03-20
> **Status**: 📋 Proposal
> **Priority**: 🔴 High
> **Goal**: 将项目重构为标准前端工程，组件化并保留核心像素画编辑体验
> **Related PR**: TBD

---

## 背景

现有项目为单文件 HTML 应用，难以扩展与维护。目标是采用 React 19 + TailwindCSS + Arco Design，通过组件化与现代构建链路提升可维护性与一致性，同时确保功能等价与性能可靠。

## AS-IS 分析

### 当前行为
- 单文件入口运行于浏览器，无构建步骤
- 内联脚本与样式承担全部渲染/交互逻辑
- 具备像素画编辑、工具栏、图层与预览、导入导出等功能

### 关键文件
- `sprite-editor.html`：唯一入口与全部逻辑所在
- `ARCHITECTURE.md` / `AGENTS.md`：架构与流程约束
- `docs/templates/design-doc.md` / `docs/templates/exec-plan.md`：文档模板

### 已知未知
- 具体交互细节的迁移边界（如撤销/重做实现）
- 资源体量上限与性能阈值（需实测）
- 主题风格细节与 Arco 组件的适配范围

## 提案

采用 Vite + React 19 + TypeScript 初始化工程；整合 TailwindCSS 与 Arco Design；将现有功能拆分为组件，并将画布渲染与交互迁移到 React Hooks 与组件内，保持像素渲染与暗色主题。

### Phase 1: 工程化引导与依赖配置
- 使用 Vite 初始化 React 19 + TS 项目结构（`src/`, `public/`）
- 安装并配置 TailwindCSS（`tailwind.config.js`，`postcss.config.js`，`content` 精确匹配）
- 安装 Arco Design，启用按需引入与主题配置
- 设置基础 ESLint/Prettier（仅用于开发质量，避免强耦合）
- 保留 `image-rendering: pixelated` 的全局样式基线

### Phase 2: 应用骨架与全局布局
- 创建 `App.tsx` 与基础路由/布局（如不需要路由则仅布局）
- 引入 Arco 布局组件与 Tailwind 基线类
- 建立全局样式层与 CSS 变量，统一暗色主题

### Phase 3: 组件化核心功能
- `Toolbar`：工具按钮与模式切换（Arco Button/Dropdown + Tailwind）
- `CanvasWorkspace`：画布渲染与事件（封装绘制、缩放/平移、像素对齐）
- `LayersPanel`：图层管理与预览
- `PreviewPanel`：缩略图与导出预览
- `ImportExport`：文件导入与下载

### Phase 4: 状态与交互迁移
- 将内联状态迁移到 React Hooks（必要时 `useReducer`）
- 键盘交互、撤销/重做、工具模式的统一管理
- 处理边界情况（大画布、高频操作）

### Phase 5: 验证与文档更新
- 用真实资源进行性能/交互验证
- 更新 `ARCHITECTURE.md`、`docs/DECISIONS.md`、`docs/QUALITY_SCORE.md`、`docs/STATE.md`
- 登记发现的技术债于 `docs/exec-plans/tech-debt.md`

---

## 验证指标
- 构建产物体积与加载速度（开发/生产）
- 大画布与高频操作下的交互流畅度
- 像素渲染清晰度与主题一致性
- 组件分层与职责清晰度（代码审查）

---

## 实施偏差日志
| 日期       | 阶段  | 计划 vs 实际         | 原因 | 影响 |
| ---------- | ----- | -------------------- | ---- | ---- |
| —          | —     | —                    | —    | —    |

## 进度日志
| 日期       | 进度                   | 备注 |
| ---------- | ---------------------- | ---- |
| 2026-03-20 | 创建执行计划文档       | —    |

## 决策日志
| 日期       | 决策                           | 理由                   | 备选 |
| ---------- | ------------------------------ | ---------------------- | ---- |
| 2026-03-20 | 选用 Vite + React 19 + TS      | 轻量快速、主流生态     | CRA/Next |
| 2026-03-20 | 选用 Tailwind + Arco Design    | 统一设计与高效样式     | 仅手写 CSS |
