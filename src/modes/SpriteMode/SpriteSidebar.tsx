import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, InputNumber, Tooltip } from '@arco-design/web-react'
import { IconDragArrow, IconDragDotVertical, IconFullscreen, IconNav, IconPenFill, IconRefresh, IconSelectAll, IconThunderbolt, IconUndo, IconUpload } from '@arco-design/web-react/icon'
import { DefaultResizeAnchor, MaxColorChannelValue, MinimumPositiveValue, ResizeAnchorColumns, ResizeAnchorRows } from '../../constants/spriteSheetConstants'
import type { SpriteSheetController } from '../../hooks/useSpriteSheet'
import type { ResizeAnchor } from '../../types/spriteSheetTypes'
import { loadImageFile } from '../../utils/spriteSheetImport'

interface SpriteSidebarProps {
  spriteSheet: SpriteSheetController
}

const clampPositive = (value: number | null | undefined, fallback: number) => Math.max(MinimumPositiveValue, Number(value) || fallback)
const clampTolerance = (value: number | null | undefined) => Math.min(MaxColorChannelValue, Math.max(0, Number(value) || 0))

export default function SpriteSidebar({ spriteSheet }: SpriteSidebarProps) {
  const {
    s,
    setS,
    canUndo,
    loadImage,
    setBackgroundPickMode,
    autoRemoveBackground,
    applyBackgroundRemoval,
    applySharpening,
    deleteSelection,
    undo,
    resetEdits,
    resizeCanvas,
  } = spriteSheet
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [resizeWidth, setResizeWidth] = useState(1)
  const [resizeHeight, setResizeHeight] = useState(1)
  const [resizeAnchor, setResizeAnchor] = useState<ResizeAnchor>(DefaultResizeAnchor)

  const importFile = useCallback((file: File | null | undefined) => loadImageFile(file, loadImage), [loadImage])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    importFile(e.target.files?.[0])
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    importFile(e.dataTransfer.files[0])
  }

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          importFile(item.getAsFile())
          break
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [importFile])

  useEffect(() => {
    const source = s.editCanvas ?? s.img
    if (!source) return
    const width = 'naturalWidth' in source ? source.naturalWidth : source.width
    const height = 'naturalHeight' in source ? source.naturalHeight : source.height
    setResizeWidth(width)
    setResizeHeight(height)
  }, [s.editCanvas, s.img])

  const [sharpenStrength, setSharpenStrength] = useState(1)
  const hasBgSample = !!s.bgSampleColor
  const undoDisabled = !canUndo || s.movingSel
  const resizeDisabled = !s.img || s.movingSel

  return (
    <div className="flex flex-col gap-4 overflow-y-auto h-full p-4 pr-3 text-[13px] custom-scroll">
      <div className="flex w-full rounded-2xl border border-[var(--sidebar-divider)] bg-[var(--input-bg)] p-1 gap-0.5">
        {(
          [
            { tool: 'pan',       label: 'Pan',   icon: <IconDragArrow />, tooltip: 'Pan Tool (Q)',      onClick: () => setS(prev => ({ ...prev, tool: 'pan',       selType: 'rect'  })) },
            { tool: 'select',    label: 'Rect',  icon: <IconFullscreen />, tooltip: 'Rect Select (W)',  onClick: () => setS(prev => ({ ...prev, tool: 'select',    selType: 'rect'  })) },
            { tool: 'lasso',     label: 'Lasso', icon: <IconPenFill />,   tooltip: 'Lasso Select (E)', onClick: () => setS(prev => ({ ...prev, tool: 'lasso',     selType: 'lasso' })) },
            { tool: 'framePick', label: 'Pick',  icon: <IconSelectAll />, tooltip: 'Frame Pick (R)',    onClick: () => setS(prev => ({ ...prev, tool: 'framePick', selType: 'rect'  })) },
            { tool: 'colorPick', label: 'Color', icon: <IconNav />,       tooltip: 'Color Select (T)', onClick: () => setS(prev => ({ ...prev, tool: 'colorPick', selType: 'lasso' })) },
          ] as const
        ).map(({ tool, label, icon, tooltip, onClick }) => {
          const active = s.tool === tool
          return (
            <Tooltip key={tool} content={tooltip}>
              <button
                className={`sidebar-interactive relative flex-1 flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-medium leading-none duration-200 ${
                  active
                    ? 'bg-[var(--sidebar-selected)] text-[var(--accent)]'
                    : 'text-[var(--muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text)]'
                }`}
                onClick={onClick}
              >
                <span className="text-sm leading-none">{icon}</span>
                {label}
                {active && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full bg-[var(--accent)] opacity-70" />}
              </button>
            </Tooltip>
          )
        })}
        <div className="mx-0.5 my-1 w-px shrink-0 bg-[var(--sidebar-divider)]" />
        <Tooltip content="Undo (Cmd/Ctrl+Z)">
          <button
            type="button"
            aria-label="Undo"
            onClick={(e) => {
              if (undoDisabled) { e.preventDefault(); return }
              undo()
            }}
            className={`sidebar-interactive flex w-9 shrink-0 self-stretch items-center justify-center rounded-xl text-sm leading-none ${undoDisabled ? 'text-[var(--muted)] opacity-30 cursor-not-allowed' : 'text-[var(--muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text)]'}`}
          >
            <IconUndo />
          </button>
        </Tooltip>
      </div>

      {s.tool === 'colorPick' && s.img && (
        <div className="sidebar-section p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="sidebar-title flex items-center gap-2">
              <span className="sidebar-chip rounded-full px-2 py-0.5 text-[10px] font-medium">BG</span>
              Color / Background
            </div>
          </div>

          <div className="mb-3 flex items-center gap-3">
            <div className="sidebar-caption shrink-0">Sample</div>
            <div className="h-8 w-8 shrink-0 rounded-xl border border-[var(--sidebar-divider)]" style={{ backgroundColor: s.bgSampleColor ? `rgb(${s.bgSampleColor.r}, ${s.bgSampleColor.g}, ${s.bgSampleColor.b})` : 'transparent' }} />
            <div className="sidebar-caption font-mono truncate">
              {s.bgSampleColor ? `${s.bgSampleColor.r}, ${s.bgSampleColor.g}, ${s.bgSampleColor.b}` : 'No sample'}
            </div>
          </div>

          <div className="mb-3">
            <div className="sidebar-caption mb-1.5 pl-1">Tolerance</div>
            <InputNumber size="small" value={s.colorPickTolerance} min={0} max={255} onChange={(v) => setS(prev => ({ ...prev, colorPickTolerance: clampTolerance(v) }))} className="w-full border-[var(--sidebar-divider)] bg-[var(--input-bg)] hover:border-[var(--sidebar-selected-border)]" />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button size="small" type="primary" icon={<span className="text-xs font-mono">BG</span>} onClick={autoRemoveBackground}>Auto remove</Button>
            <Button size="small" type={s.bgPickMode ? 'primary' : 'secondary'} icon={<span className="text-xs font-mono">BG</span>} onClick={() => setBackgroundPickMode(!s.bgPickMode)}>
              {s.bgPickMode ? 'Picking…' : 'Pick color'}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button size="small" disabled={!hasBgSample} onClick={() => applyBackgroundRemoval()}>Apply sample</Button>
            <Button size="small" icon={<IconRefresh />} onClick={resetEdits}>Reset image</Button>
          </div>
          {s.sel && (
            <Button size="small" type="primary" status="danger" className="w-full" onClick={deleteSelection}>Remove selected</Button>
          )}
          {s.bgPickMode && (
            <div className="sidebar-caption mt-2">Click the image in the viewport to sample a background color.</div>
          )}
          {!s.bgPickMode && !s.sel && (
            <div className="sidebar-caption mt-2">Click an opaque pixel to select its connected region.</div>
          )}
        </div>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="sidebar-interactive group cursor-pointer rounded-[20px] border border-dashed border-[var(--sidebar-divider)] bg-[var(--sidebar-elevated)] px-5 py-6 text-center duration-200 hover:border-[var(--sidebar-selected-border)] hover:bg-[var(--sidebar-muted)]"
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--sidebar-divider)] bg-[var(--sidebar-muted)] transition-colors group-hover:border-[var(--sidebar-selected-border)] group-hover:bg-[var(--sidebar-selected)]">
          <IconUpload className="text-lg text-[var(--muted)] group-hover:text-[var(--text)]" />
        </div>
        <div className="mb-1 text-sm font-medium text-[var(--text)]">Import image</div>
        <div className="text-xs text-[var(--muted)]">Click, drag, or paste PNG, JPG, and WEBP files</div>
      </div>

      {s.img && (
        <>
          <div className="sidebar-section p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="sidebar-title flex items-center gap-2">
                <span className="sidebar-chip rounded-full px-2 py-0.5 text-[10px] font-medium">FX</span>
                Clean edges
              </div>
            </div>
            <div className="mb-3">
              <div className="sidebar-caption mb-1.5 pl-1">Passes (1–5)</div>
              <InputNumber size="small" value={sharpenStrength} min={1} max={5} onChange={(v) => setSharpenStrength(Math.min(5, Math.max(1, Number(v) || 1)))} className="w-full border-[var(--sidebar-divider)] bg-[var(--input-bg)] hover:border-[var(--sidebar-selected-border)]" />
            </div>
            <Button size="small" type="primary" icon={<IconThunderbolt />} onClick={() => applySharpening(sharpenStrength)} className="w-full">Remove jaggies</Button>
            <div className="sidebar-caption mt-2">{s.sel ? 'Applies to current selection.' : 'No selection — applies to full canvas.'}</div>
          </div>

          <div className="sidebar-section p-4">
            <div className="sidebar-title mb-3 flex items-center gap-2">
              <IconDragDotVertical className="text-[var(--muted)]" />
              Canvas size
            </div>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <div className="sidebar-caption mb-1.5 pl-1">Width</div>
                <InputNumber size="small" value={resizeWidth} min={1} onChange={(v) => setResizeWidth(clampPositive(v, resizeWidth || 1))} className="border-[var(--sidebar-divider)] bg-[var(--input-bg)] hover:border-[var(--sidebar-selected-border)]" />
              </div>
              <div>
                <div className="sidebar-caption mb-1.5 pl-1">Height</div>
                <InputNumber size="small" value={resizeHeight} min={1} onChange={(v) => setResizeHeight(clampPositive(v, resizeHeight || 1))} className="border-[var(--sidebar-divider)] bg-[var(--input-bg)] hover:border-[var(--sidebar-selected-border)]" />
              </div>
            </div>
            <div className="mb-3">
              <div className="sidebar-caption mb-2 pl-1">Anchor</div>
              <div className="grid grid-cols-3 gap-1.5">
                {ResizeAnchorRows.flatMap((row) => ResizeAnchorColumns.map((col) => {
                  const active = resizeAnchor.x === col && resizeAnchor.y === row
                  return (
                    <button
                      key={`${row}-${col}`}
                      type="button"
                      className={`sidebar-interactive h-8 rounded-xl border text-[11px] font-medium ${active ? 'border-[var(--sidebar-selected-border)] bg-[var(--sidebar-selected)] text-[var(--text)]' : 'border-[var(--sidebar-divider)] bg-[var(--input-bg)] text-[var(--muted)] hover:border-[var(--sidebar-selected-border)] hover:text-[var(--text)]'}`}
                      onClick={() => setResizeAnchor({ x: col, y: row })}
                    >
                      {row === 'middle' ? 'M' : row[0].toUpperCase()}{col[0].toUpperCase()}
                    </button>
                  )
                }))}
              </div>
            </div>
            <Button size="small" type="primary" disabled={resizeDisabled} onClick={() => resizeCanvas(resizeWidth, resizeHeight, resizeAnchor)} className="w-full">
              Resize canvas
            </Button>
            {s.movingSel && (
              <div className="sidebar-caption mt-2">Finish moving the selection before resizing the canvas.</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
