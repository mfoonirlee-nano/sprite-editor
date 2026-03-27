import React, { useEffect, useRef, useState } from 'react'
import { Button, InputNumber, Switch, Tooltip } from '@arco-design/web-react'
import { IconPlayArrow, IconPause, IconDownload, IconDragDotVertical, IconUpload, IconDragArrow, IconFullscreen, IconPenFill, IconRefresh } from '@arco-design/web-react/icon'
import type { ResizeAnchor, SpriteSheetController } from './useSpriteSheet'

interface SpriteSidebarProps {
  spriteSheet: SpriteSheetController
}

const clampPositive = (value: number | null | undefined, fallback: number) => Math.max(1, Number(value) || fallback)
const clampTolerance = (value: number | null | undefined) => Math.min(255, Math.max(0, Number(value) || 0))
const defaultResizeAnchor: ResizeAnchor = { x: 'center', y: 'middle' }
const resizeAnchorRows: ResizeAnchor['y'][] = ['top', 'middle', 'bottom']
const resizeAnchorCols: ResizeAnchor['x'][] = ['left', 'center', 'right']

const traceSelectionPath = (ctx: CanvasRenderingContext2D, sel: NonNullable<SpriteSheetController['s']['sel']>) => {
  ctx.beginPath()
  if (sel.points?.length) {
    sel.points.forEach((point, index) => {
      const x = point.x - sel.x
      const y = point.y - sel.y
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.closePath()
    return
  }
  ctx.rect(0, 0, sel.w, sel.h)
}

export default function SpriteSidebar({ spriteSheet }: SpriteSidebarProps) {
  const {
    s,
    setS,
    loadImage,
    previewRef,
    getDrawableSource,
    setBackgroundPickMode,
    autoRemoveBackground,
    applyBackgroundRemoval,
    resetEdits,
    resizeCanvas,
  } = spriteSheet
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [resizeWidth, setResizeWidth] = useState(1)
  const [resizeHeight, setResizeHeight] = useState(1)
  const [resizeAnchor, setResizeAnchor] = useState<ResizeAnchor>(defaultResizeAnchor)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    loadImage(url)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    loadImage(url)
  }

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            const url = URL.createObjectURL(file)
            loadImage(url)
          }
          break
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [loadImage])

  useEffect(() => {
    const source = getDrawableSource()
    if (!source) return
    const width = 'naturalWidth' in source ? source.naturalWidth : source.width
    const height = 'naturalHeight' in source ? source.naturalHeight : source.height
    setResizeWidth(width)
    setResizeHeight(height)
  }, [s.img, s.editCanvas])

  const hasExportableSelection = !!s.sel && Math.round(s.sel.w) > 0 && Math.round(s.sel.h) > 0
  const hasBgSample = !!s.bgSampleColor
  const resizeDisabled = !s.img || s.movingSel

  const exportSelection = () => {
    const source = getDrawableSource()
    if (!source || !s.sel || !hasExportableSelection) return
    const ec = document.createElement('canvas')
    ec.width = Math.round(s.sel.w)
    ec.height = Math.round(s.sel.h)
    const ec2 = ec.getContext('2d')
    if (!ec2) return

    if (s.sel.points?.length) {
      ec2.save()
      traceSelectionPath(ec2, s.sel)
      ec2.clip()
      ec2.drawImage(source, -s.sel.x, -s.sel.y)
      ec2.restore()
    } else {
      ec2.drawImage(source, s.sel.x, s.sel.y, s.sel.w, s.sel.h, 0, 0, s.sel.w, s.sel.h)
    }

    const a = document.createElement('a')
    a.href = ec.toDataURL('image/png')
    a.download = 'selection.png'
    a.click()
  }

  const exportFrame = () => {
    const source = getDrawableSource()
    if (!source) return
    const ec = document.createElement('canvas')
    ec.width = s.fw
    ec.height = s.fh
    const ec2 = ec.getContext('2d')
    if (!ec2) return
    const sourceWidth = 'naturalWidth' in source ? source.naturalWidth : source.width
    const c = Math.max(1, Math.floor((sourceWidth - s.ox) / s.fw))
    const col = s.currentFrame % c
    const row = Math.floor(s.currentFrame / c)
    ec2.drawImage(source, s.ox + col * s.fw, s.oy + row * s.fh, s.fw, s.fh, 0, 0, s.fw, s.fh)
    const a = document.createElement('a')
    a.href = ec.toDataURL('image/png')
    a.download = `frame_${s.currentFrame}.png`
    a.click()
  }

  return (
    <div className="flex flex-col gap-4 overflow-y-auto h-full pr-2 text-[13px] custom-scroll">
      <div className="flex bg-[#101014] p-1 rounded-lg border border-[#292933] shadow-inner w-full">
        <Tooltip content="Pan Tool (V)">
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs transition-all duration-200 ${
              s.tool === 'pan' ? 'bg-[#292933] text-white shadow-sm' : 'text-[#8b8b99] hover:text-[#ececf1] hover:bg-[#1f1f26]'
            }`}
            onClick={() => setS(prev => ({ ...prev, tool: 'pan', selType: 'rect' }))}
          >
            <IconDragArrow /> Pan
          </button>
        </Tooltip>
        <Tooltip content="Rect Select (S)">
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs transition-all duration-200 ${
              s.tool === 'select' ? 'bg-[#292933] text-white shadow-sm' : 'text-[#8b8b99] hover:text-[#ececf1] hover:bg-[#1f1f26]'
            }`}
            onClick={() => setS(prev => ({ ...prev, tool: 'select', selType: 'rect' }))}
          >
            <IconFullscreen /> Rect
          </button>
        </Tooltip>
        <Tooltip content="Lasso Select (L)">
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs transition-all duration-200 ${
              s.tool === 'lasso' ? 'bg-[#292933] text-white shadow-sm' : 'text-[#8b8b99] hover:text-[#ececf1] hover:bg-[#1f1f26]'
            }`}
            onClick={() => setS(prev => ({ ...prev, tool: 'lasso', selType: 'lasso' }))}
          >
            <IconPenFill /> Lasso
          </button>
        </Tooltip>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border border-dashed border-[#3e3e4d] hover:border-[#7c6af7] hover:bg-[#7c6af7]/5 bg-[#16161a] rounded-xl p-6 text-center cursor-pointer transition-all duration-200 group"
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        <div className="w-10 h-10 rounded-full bg-[#1f1f26] group-hover:bg-[#7c6af7] flex items-center justify-center mx-auto mb-3 transition-colors">
          <IconUpload className="text-[#8b8b99] group-hover:text-white text-lg" />
        </div>
        <div className="text-[#ececf1] font-medium mb-1">Click or drag image here</div>
        <div className="text-[#8b8b99] text-xs">Supports PNG, JPG, WEBP, and Paste</div>
      </div>

      {s.img && (
        <>
          <div className="bg-[#16161a] p-4 rounded-xl border border-[#292933] shadow-sm">
            <div className="text-[11px] font-bold text-[#8b8b99] tracking-wider uppercase mb-3 flex items-center gap-1">
              <span className="text-xs font-mono">BG</span> Background Removal
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-[11px] text-[#8b8b99] shrink-0">Sample</div>
              <div className="w-8 h-8 rounded border border-[#292933]" style={{ backgroundColor: s.bgSampleColor ? `rgb(${s.bgSampleColor.r}, ${s.bgSampleColor.g}, ${s.bgSampleColor.b})` : 'transparent' }} />
              <div className="text-[11px] text-[#8b8b99] font-mono">
                {s.bgSampleColor ? `${s.bgSampleColor.r}, ${s.bgSampleColor.g}, ${s.bgSampleColor.b}` : 'No sample'}
              </div>
            </div>
            <div className="mb-3">
              <div className="text-[11px] text-[#8b8b99] mb-1.5 pl-1">Tolerance</div>
              <InputNumber size="small" value={s.bgRemovalTolerance} min={0} max={255} onChange={(v) => setS(prev => ({ ...prev, bgRemovalTolerance: clampTolerance(v) }))} className="bg-[#101014] border-[#292933] hover:border-[#7c6af7] w-full" />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Button size="small" type="primary" icon={<span className="text-xs font-mono">BG</span>} onClick={autoRemoveBackground}>Auto Remove</Button>
              <Button size="small" icon={<span className="text-xs font-mono">BG</span>} type={s.bgPickMode ? 'primary' : 'secondary'} onClick={() => setBackgroundPickMode(!s.bgPickMode)}>
                {s.bgPickMode ? 'Picking...' : 'Pick Color'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="small" disabled={!hasBgSample} onClick={() => applyBackgroundRemoval()}>Apply Sample</Button>
              <Button size="small" icon={<IconRefresh />} onClick={resetEdits}>Reset Image</Button>
            </div>
            {s.bgPickMode && (
              <div className="text-[11px] text-[#8b8b99] mt-2">Click image in viewport to sample background color.</div>
            )}
          </div>

          <div className="bg-[#16161a] p-4 rounded-xl border border-[#292933] shadow-sm">
            <div className="text-[11px] font-bold text-[#8b8b99] tracking-wider uppercase mb-3 flex items-center gap-1">
              <IconDragDotVertical /> Canvas Size
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-[11px] text-[#8b8b99] mb-1.5 pl-1">Width</div>
                <InputNumber size="small" value={resizeWidth} min={1} onChange={(v) => setResizeWidth(clampPositive(v, resizeWidth || 1))} className="bg-[#101014] border-[#292933] hover:border-[#7c6af7]" />
              </div>
              <div>
                <div className="text-[11px] text-[#8b8b99] mb-1.5 pl-1">Height</div>
                <InputNumber size="small" value={resizeHeight} min={1} onChange={(v) => setResizeHeight(clampPositive(v, resizeHeight || 1))} className="bg-[#101014] border-[#292933] hover:border-[#7c6af7]" />
              </div>
            </div>
            <div className="mb-3">
              <div className="text-[11px] text-[#8b8b99] mb-2 pl-1">Anchor</div>
              <div className="grid grid-cols-3 gap-1.5">
                {resizeAnchorRows.flatMap((row) => resizeAnchorCols.map((col) => {
                  const active = resizeAnchor.x === col && resizeAnchor.y === row
                  return (
                    <button
                      key={`${row}-${col}`}
                      type="button"
                      className={`h-8 rounded-md border text-[11px] font-medium transition-all ${active ? 'border-[#7c6af7] bg-[#7c6af7]/20 text-white' : 'border-[#292933] bg-[#101014] text-[#8b8b99] hover:border-[#7c6af7] hover:text-[#ececf1]'}`}
                      onClick={() => setResizeAnchor({ x: col, y: row })}
                    >
                      {row === 'middle' ? 'M' : row[0].toUpperCase()}{col[0].toUpperCase()}
                    </button>
                  )
                }))}
              </div>
            </div>
            <Button size="small" type="primary" disabled={resizeDisabled} onClick={() => resizeCanvas(resizeWidth, resizeHeight, resizeAnchor)} className="w-full">
              Apply Canvas Resize
            </Button>
            {s.movingSel && (
              <div className="text-[11px] text-[#8b8b99] mt-2">Finish moving the selection before resizing the canvas.</div>
            )}
          </div>

          <div className="bg-[#16161a] p-4 rounded-xl border border-[#292933] shadow-sm">
            <div className="text-[11px] font-bold text-[#8b8b99] tracking-wider uppercase mb-3 flex items-center gap-1">
              <IconDragDotVertical /> Frame Settings
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-[11px] text-[#8b8b99] mb-1.5 pl-1">Width</div>
                <InputNumber size="small" value={s.fw} onChange={(v) => { setS(prev => ({ ...prev, fw: clampPositive(v, 64) })) }} className="bg-[#101014] border-[#292933] hover:border-[#7c6af7]" />
              </div>
              <div>
                <div className="text-[11px] text-[#8b8b99] mb-1.5 pl-1">Height</div>
                <InputNumber size="small" value={s.fh} onChange={(v) => { setS(prev => ({ ...prev, fh: clampPositive(v, 64) })) }} className="bg-[#101014] border-[#292933] hover:border-[#7c6af7]" />
              </div>
              <div>
                <div className="text-[11px] text-[#8b8b99] mb-1.5 pl-1">Frames</div>
                <InputNumber size="small" value={s.fcount} onChange={(v) => { setS(prev => ({ ...prev, fcount: clampPositive(v, 1), currentFrame: Math.min(prev.currentFrame, clampPositive(v, 1) - 1) })) }} className="bg-[#101014] border-[#292933] hover:border-[#7c6af7]" />
              </div>
              <div>
                <div className="text-[11px] text-[#8b8b99] mb-1.5 pl-1">FPS</div>
                <InputNumber size="small" value={s.fps} onChange={(v) => setS(prev => ({ ...prev, fps: clampPositive(v, 10) }))} className="bg-[#101014] border-[#292933] hover:border-[#7c6af7]" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#292933]/50">
              <span className="text-xs text-[#ececf1] pl-1">Show Grid</span>
              <Switch size="small" checked={s.showGrid} onChange={(v) => { setS(prev => ({ ...prev, showGrid: v })) }} />
            </div>
          </div>

          <div className="bg-[#16161a] p-4 rounded-xl border border-[#292933] shadow-sm">
            <div className="text-[11px] font-bold text-[#8b8b99] tracking-wider uppercase mb-3 flex items-center gap-1">
              <IconDragDotVertical /> Preview & Animation
            </div>

            <div className="flex justify-center p-3 preview-canvas-bg border border-[#292933] rounded-lg min-h-[120px] mb-3 relative group">
              <canvas ref={previewRef} style={{ imageRendering: 'pixelated', maxWidth: '100%', maxHeight: '100%' }} />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  shape="circle"
                  size="small"
                  type={s.isPlaying ? 'secondary' : 'primary'}
                  icon={s.isPlaying ? <IconPause /> : <IconPlayArrow />}
                  onClick={() => setS(prev => ({ ...prev, isPlaying: !prev.isPlaying, timer: 0 }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto custom-scroll pr-1">
              {Array.from({ length: s.fcount }).map((_, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 border-2 rounded-md overflow-hidden cursor-pointer relative bg-[#101014] transition-all hover:scale-105 ${i === s.currentFrame ? 'border-[#7c6af7] shadow-[0_0_10px_rgba(124,106,247,0.3)]' : 'border-[#292933] hover:border-[#56cfb2]'}`}
                  onClick={() => setS(prev => ({ ...prev, currentFrame: i }))}
                >
                  <canvas
                    width={s.fw}
                    height={s.fh}
                    ref={(el) => {
                      const source = getDrawableSource()
                      if (!el || !source) return
                      const fc2 = el.getContext('2d')
                      if (!fc2) return
                      const sourceWidth = 'naturalWidth' in source ? source.naturalWidth : source.width
                      const c = Math.max(1, Math.floor((sourceWidth - s.ox) / s.fw))
                      const col = i % c
                      const row = Math.floor(i / c)
                      fc2.clearRect(0, 0, s.fw, s.fh)
                      fc2.imageSmoothingEnabled = false
                      fc2.drawImage(source, s.ox + col * s.fw, s.oy + row * s.fh, s.fw, s.fh, 0, 0, s.fw, s.fh)
                    }}
                    className="w-full h-full"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 text-[9px] font-mono bg-black/80 backdrop-blur-sm text-center text-[#ececf1] leading-tight py-0.5">
                    {i}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#16161a] p-4 rounded-xl border border-[#292933] shadow-sm mb-4">
            <div className="text-[11px] font-bold text-[#8b8b99] tracking-wider uppercase mb-3 flex items-center gap-1">
              <IconDragDotVertical /> Export
            </div>
            <div className="flex gap-2">
              <Button size="small" icon={<IconDownload />} onClick={exportSelection} disabled={!hasExportableSelection} className="flex-1 bg-[#1f1f26] border-[#292933] text-[#ececf1] hover:bg-[#292933]">Selection</Button>
              <Button size="small" icon={<IconDownload />} onClick={exportFrame} className="flex-1 bg-[#1f1f26] border-[#292933] text-[#ececf1] hover:bg-[#292933]">Current Frame</Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
