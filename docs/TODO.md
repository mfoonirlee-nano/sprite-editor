# TODO

## 已完成
- [x] 选区工具右上角展示选区宽高和中心坐标
- [x] 画布边缘展示坐标轴，并以左下角为原点
- [x] 增加拾取帧工具：点击非透明像素后自动拾取其连通区域的紧凑包围盒；点击透明区域不生效
- [x] 修复废弃类型 `MutableRefObject` 的引用，统一改为 `RefObject`

## 待处理
- [x] review 技术负债文档，重新评估后更新
- [x] 遍历 `src/` 的所有文件，移除关键 magic number，提炼到 `src/constants/spriteSheetConstants.ts` 中，并使用大驼峰命名
