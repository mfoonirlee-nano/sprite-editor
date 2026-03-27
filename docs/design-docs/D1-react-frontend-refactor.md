# React 19 + TailwindCSS + Arco Design 重构设计文档

> **Created**: 2026-03-20
> **Last updated**: 2026-03-27
> **Status**: Implemented (historical design basis)
> **Impact scope**: 前端（UI、状态管理、构建工具链）

---

## 问题陈述

项目最初是单文件、纯 HTML + 内联 CSS/JS 的画布应用。该结构在可维护性、模块边界、样式一致性和工程化验证上存在明显限制，因此需要迁移到标准前端工程。

## 设计目标

- 引入 React 19 + TypeScript 进行组件化组织
- 使用 Vite 提供现代开发与构建链路
- 使用 TailwindCSS 与 Arco Design 改善 UI 一致性
- 保留像素级 canvas 编辑体验与暗色主题
- 为后续交互能力扩展提供更清晰的模块边界

## 最终实现概览

当前仓库中的实际实现已经基本落实该设计方向：
- 构建工具：Vite
- 语言：TypeScript
- UI 框架：React 19
- 设计系统：Arco Design
- 样式：Tailwind CSS + 全局样式
- 核心结构：`App.tsx` + `useSpriteSheet.ts` + `SpriteViewport.tsx` + `SpriteSidebar.tsx`

## 实际实现与原设计的差异

原设计文档中曾用更抽象的组件命名描述未来结构，例如 `Toolbar`、`CanvasWorkspace`、`PreviewPanel` 等；最终落地时，代码采用了更贴近当前业务的 SpriteMode 模块化组织，而不是完全照搬这些命名。

因此，本设计文档应视为**历史设计依据**，而不是当前状态说明书。当前状态请以：
- `ARCHITECTURE.md`
- `docs/STATE.md`
- `docs/product-specs/knowledge-base.md`

为准。

## 验收结论

以下原始目标已被认为达成：
1. ✅ 完成 Vite + React 19 + TS 工程化初始化
2. ✅ 整合 Tailwind 与 Arco，形成统一暗色 UI 基线
3. ✅ 将核心编辑能力迁移到组件与 hook 结构中
4. ✅ 保持像素渲染清晰度与核心交互能力
5. ✅ 形成可继续扩展的现代前端工程基础

## 历史说明

本文件保留用于记录该架构迁移的设计出发点。它不是当前实现的逐行映射文档，当前实现应以代码和现状文档为准。
