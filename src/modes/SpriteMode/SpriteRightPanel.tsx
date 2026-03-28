import { Button, InputNumber, Switch, Tooltip } from '@arco-design/web-react'
import { IconPlayArrow, IconPause, IconDownload, IconDragDotVertical, IconLeft, IconRight } from '@arco-design/web-react/icon'
import { traceSelectionPath } from './selectionUtils'
import type { SpriteSheetController } from './useSpriteSheet'

interface SpriteRightPanelProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  spriteSheet: SpriteSheetController
}

const clampPositive = (value: number | null | undefined, fallback: number) => Math.max(1, Number(value) || fallback)

const getSourceWidth = (source: HTMLImageElement | HTMLCanvasElement) => 'naturalWidth' in source ? source.naturalWidth : source.width
const getSourceHeight = (source: HTMLImageElement | HTMLCanvasElement) => 'naturalHeight' in source ? source.naturalHeight : source.height

const downloadCanvas = (canvas: HTMLCanvasElement, filename: string) => {
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = filename
  a.click()
}

export default function SpriteRightPanel({ collapsed, onToggleCollapsed, spriteSheet }: SpriteRightPanelProps) {
  const {
    s,
    setS,
    previewRef,
    getDrawableSource,
  } = spriteSheet

  const hasExportableSelection = !!s.sel && Math.round(s.sel.w) > 0 && Math.round(s.sel.h) > 0

  const exportSelection = () => {
    const source = getDrawableSource()
    if (!source || !s.sel || !hasExportableSelection) return
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(s.sel.w)
    canvas.height = Math.round(s.sel.h)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (s.sel.points?.length) {
      ctx.save()
      traceSelectionPath(ctx, s.sel, -s.sel.x, -s.sel.y)
      ctx.clip()
      ctx.drawImage(source, -s.sel.x, -s.sel.y)
      ctx.restore()
    } else {
      ctx.drawImage(source, s.sel.x, s.sel.y, s.sel.w, s.sel.h, 0, 0, s.sel.w, s.sel.h)
    }

    downloadCanvas(canvas, 'selection.png')
  }

  const exportFrame = () => {
    const source = getDrawableSource()
    if (!source) return
    const canvas = document.createElement('canvas')
    canvas.width = s.fw
    canvas.height = s.fh
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const sourceWidth = getSourceWidth(source)
    const columns = Math.max(1, Math.floor((sourceWidth - s.ox) / s.fw))
    const col = s.currentFrame % columns
    const row = Math.floor(s.currentFrame / columns)
    ctx.drawImage(source, s.ox + col * s.fw, s.oy + row * s.fh, s.fw, s.fh, 0, 0, s.fw, s.fh)
    downloadCanvas(canvas, `frame_${s.currentFrame}.png`)
  }

  const exportFullImage = () => {
    const source = getDrawableSource()
    if (!source) return
    const canvas = document.createElement('canvas')
    canvas.width = getSourceWidth(source)
    canvas.height = getSourceHeight(source)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(source, 0, 0)
    downloadCanvas(canvas, 'sprite_sheet.png')
  }

  return (
    <div className={`${collapsed ? 'w-14' : 'w-[356px]'} flex h-full shrink-0 overflow-hidden border-l border-[var(--sidebar-divider)] bg-[var(--sidebar)] transition-[width] duration-200 ease-out`}>
      <div className="flex w-14 flex-col items-center justify-between border-r border-[var(--sidebar-divider)] bg-[var(--sidebar)] py-4">
        <div className="flex flex-col items-center gap-3">
          <div className="sidebar-chip flex h-8 w-8 items-center justify-center rounded-2xl text-[10px] font-medium">
            FX
          </div>
          <Tooltip content={collapsed ? 'Expand right panel' : 'Collapse right panel'} position="left">
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="sidebar-interactive flex h-9 w-9 items-center justify-center rounded-2xl border border-[var(--sidebar-divider)] bg-[var(--sidebar-elevated)] text-[var(--text)] duration-200 hover:border-[var(--sidebar-selected-border)] hover:bg-[var(--sidebar-muted)]"
              aria-label={collapsed ? 'Expand right panel' : 'Collapse right panel'}
            >
              {collapsed ? <IconLeft /> : <IconRight />}
            </button>
          </Tooltip>
        </div>

        <div className="flex flex-col items-center gap-3 text-[var(--muted)]">
          <div className="h-8 w-px bg-[var(--sidebar-divider)]" />
          <div className="text-[10px] tracking-[0.14em] text-[var(--muted)] select-none" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
            Panel
          </div>
          <div className="h-8 w-px bg-[var(--sidebar-divider)]" />
        </div>
      </div>

      {!collapsed && (
        <div className="custom-scroll h-full flex-1 overflow-y-auto p-4 text-[13px]">
          {s.img ? (
            <div className="flex flex-col gap-4">
              <div className="sidebar-section p-4">
                <div className="sidebar-title mb-3 flex items-center gap-2">
                  <IconDragDotVertical className="text-[var(--muted)]" />
                  Frame settings
                </div>
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="sidebar-caption mb-1.5 pl-1">Width</div>
                    <InputNumber size="small" value={s.fw} onChange={(v) => { setS(prev => ({ ...prev, fw: clampPositive(v, 64) })) }} className="border-[var(--sidebar-divider)] bg-[var(--input-bg)] hover:border-[var(--sidebar-selected-border)]" />
                  </div>
                  <div>
                    <div className="sidebar-caption mb-1.5 pl-1">Height</div>
                    <InputNumber size="small" value={s.fh} onChange={(v) => { setS(prev => ({ ...prev, fh: clampPositive(v, 64) })) }} className="border-[var(--sidebar-divider)] bg-[var(--input-bg)] hover:border-[var(--sidebar-selected-border)]" />
                  </div>
                  <div>
                    <div className="sidebar-caption mb-1.5 pl-1">Frames</div>
                    <InputNumber size="small" value={s.fcount} onChange={(v) => { setS(prev => ({ ...prev, fcount: clampPositive(v, 1), currentFrame: Math.min(prev.currentFrame, clampPositive(v, 1) - 1) })) }} className="border-[var(--sidebar-divider)] bg-[var(--input-bg)] hover:border-[var(--sidebar-selected-border)]" />
                  </div>
                  <div>
                    <div className="sidebar-caption mb-1.5 pl-1">FPS</div>
                    <InputNumber size="small" value={s.fps} onChange={(v) => setS(prev => ({ ...prev, fps: clampPositive(v, 10) }))} className="border-[var(--sidebar-divider)] bg-[var(--input-bg)] hover:border-[var(--sidebar-selected-border)]" />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--sidebar-divider)] pt-2">
                  <span className="pl-1 text-xs text-[var(--text)]">Show Grid</span>
                  <Switch size="small" checked={s.showGrid} onChange={(v) => { setS(prev => ({ ...prev, showGrid: v })) }} />
                </div>
              </div>

              <div className="sidebar-section p-4">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <div className="sidebar-title flex items-center gap-2">
                      <IconDragDotVertical className="text-[var(--muted)]" />
                      Preview
                    </div>
                    <div className="sidebar-caption mt-1">Current frame playback and frame strip.</div>
                  </div>
                </div>

                <div className="preview-canvas-bg relative mb-4 flex min-h-[168px] justify-center rounded-[18px] border border-[var(--sidebar-divider)] p-4 group">
                  <canvas ref={previewRef} style={{ imageRendering: 'pixelated', maxWidth: '100%', maxHeight: '100%' }} />
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      shape="circle"
                      size="small"
                      type={s.isPlaying ? 'secondary' : 'primary'}
                      icon={s.isPlaying ? <IconPause /> : <IconPlayArrow />}
                      onClick={() => setS(prev => ({ ...prev, isPlaying: !prev.isPlaying, timer: 0 }))}
                    />
                  </div>
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <div className="sidebar-caption">Frames</div>
                  <div className="sidebar-caption font-mono">{s.currentFrame + 1} / {s.fcount}</div>
                </div>
                <div className="custom-scroll max-h-[140px] overflow-y-auto pr-1">
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: s.fcount }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`sidebar-interactive relative h-10 w-10 overflow-hidden rounded-xl border bg-[var(--input-bg)] ${i === s.currentFrame ? 'border-[var(--sidebar-selected-border)] bg-[var(--sidebar-selected)]' : 'border-[var(--sidebar-divider)] hover:border-[var(--sidebar-selected-border)] hover:bg-[var(--sidebar-hover)]'}`}
                      onClick={() => setS(prev => ({ ...prev, currentFrame: i }))}
                    >
                      <canvas
                        width={s.fw}
                        height={s.fh}
                        ref={(el) => {
                          const source = getDrawableSource()
                          if (!el || !source) return
                          const ctx = el.getContext('2d')
                          if (!ctx) return
                          const sourceWidth = getSourceWidth(source)
                          const columns = Math.max(1, Math.floor((sourceWidth - s.ox) / s.fw))
                          const col = i % columns
                          const row = Math.floor(i / columns)
                          ctx.clearRect(0, 0, s.fw, s.fh)
                          ctx.imageSmoothingEnabled = false
                          ctx.drawImage(source, s.ox + col * s.fw, s.oy + row * s.fh, s.fw, s.fh, 0, 0, s.fw, s.fh)
                        }}
                        className="w-full h-full"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/55 py-0.5 text-center text-[9px] leading-tight text-[var(--text)]">
                        {i + 1}
                      </div>
                    </button>
                  ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--sidebar-divider)] px-1 pt-1">
                <div className="sidebar-caption mb-3 px-3">Export</div>
                <div className="grid grid-cols-2 gap-2 rounded-[18px] border border-[var(--sidebar-divider)] bg-[var(--sidebar-elevated)] p-3">
                  <Button size="small" icon={<IconDownload />} onClick={exportSelection} disabled={!hasExportableSelection} className="border-[var(--sidebar-divider)] bg-[var(--input-bg)] text-[var(--text)] hover:bg-[var(--sidebar-hover)]">Selection</Button>
                  <Button size="small" icon={<IconDownload />} onClick={exportFrame} className="border-[var(--sidebar-divider)] bg-[var(--input-bg)] text-[var(--text)] hover:bg-[var(--sidebar-hover)]">Current</Button>
                  <Button size="small" icon={<IconDownload />} onClick={exportFullImage} className="col-span-2 border-[var(--sidebar-divider)] bg-[var(--input-bg)] text-[var(--text)] hover:bg-[var(--sidebar-hover)]">Full sheet</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-4">
              <div className="rounded-[20px] border border-dashed border-[var(--sidebar-divider)] bg-[var(--sidebar-elevated)] px-6 py-8 text-center text-sm text-[var(--muted)]">
                Import an image to configure frames, preview animation, and export results.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
