# TODO

## 已完成
- [x] 选区工具右上角展示选区宽高和中心坐标
- [x] 画布边缘展示坐标轴，并以左下角为原点
- [x] 增加拾取帧工具：点击非透明像素后自动拾取其连通区域的紧凑包围盒；点击透明区域不生效
- [x] 修复废弃类型 `MutableRefObject` 的引用，统一改为 `RefObject`
- [x] review 技术负债文档，重新评估后更新
- [x] 遍历 `src/` 的所有文件，移除关键 magic number，提炼到 `src/constants/spriteSheetConstants.ts` 中，并使用大驼峰命名
- [x] colorPick 工具支持独立颜色容差设置，避免选择区域过大或者过小
- [x] 整合 colorPick 与背景去除工具，统一容差参数，合并为 Color / Background 面板
- [x] 支持像素区域边缘锐化（去毛刺），支持选区限定范围，支持 undo
- [x] Frame settings 默认高度跟随图片高度，帧数根据图片宽度和帧宽自动推算
- [x] 增加图片缩放的功能，支持等比例缩放

## 待处理
