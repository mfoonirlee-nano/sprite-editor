import React from 'react'
import { Layout, Typography, Button, Space } from '@arco-design/web-react'
import { IconInfoCircle } from '@arco-design/web-react/icon'
import SpriteViewport from './modes/SpriteMode/SpriteViewport'
import SpriteSidebar from './modes/SpriteMode/SpriteSidebar'
import SpriteRightPanel from './modes/SpriteMode/SpriteRightPanel'
import { useSpriteSheet } from './hooks/useSpriteSheet'

const { Header, Sider, Content } = Layout
const { Title } = Typography

export default function App() {
  const spriteSheet = useSpriteSheet()
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = React.useState(false)

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target) {
        const tagName = target.tagName
        if (target.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
          return
        }
      }

      const key = e.key.toLowerCase()
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && key === 'z') {
        if (spriteSheet.canUndo && !spriteSheet.s.movingSel) {
          e.preventDefault()
          spriteSheet.undo()
        }
        return
      }

      if (key === 'v' || key === 's' || key === 'l') {
        spriteSheet.setS((prev) => ({
          ...prev,
          tool: key === 'v' ? 'pan' : key === 's' ? 'select' : 'lasso',
          selType: key === 'l' ? 'lasso' : 'rect',
        }))
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [spriteSheet])

  return (
    <Layout className="h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <Header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--sidebar-divider)] bg-[var(--shell)] px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-2xl border border-[var(--sidebar-divider)] bg-[var(--sidebar-elevated)]">
            <span className="text-[12px] font-semibold leading-none text-[var(--muted)]" style={{ fontFamily: 'monospace' }}>S</span>
          </div>
          <Title style={{ color: 'var(--text)', margin: 0, fontSize: '14px', fontWeight: 600, lineHeight: 1.2 }}>
            Sprite Editor
          </Title>
        </div>

        <Space size="small">
          <Button type="text" icon={<IconInfoCircle />} style={{ color: 'var(--muted)' }} className="rounded-full border border-transparent px-2.5 hover:border-[var(--sidebar-divider)] hover:bg-[var(--sidebar-elevated)] hover:text-[var(--text)]">
            Shortcuts
          </Button>
        </Space>
      </Header>

      <Layout className="relative flex-1 overflow-hidden">
        <Sider
          width={340}
          className="flex shrink-0 flex-col border-r border-[var(--sidebar-divider)] bg-[var(--sidebar)]"
        >
          <SpriteSidebar spriteSheet={spriteSheet} />
        </Sider>

        <Content className="relative flex overflow-hidden bg-[var(--bg)]">
          <div className="flex min-w-0 flex-1">
            <SpriteViewport spriteSheet={spriteSheet} />
          </div>
          <SpriteRightPanel
            spriteSheet={spriteSheet}
            collapsed={isRightPanelCollapsed}
            onToggleCollapsed={() => setIsRightPanelCollapsed((prev) => !prev)}
          />
        </Content>
      </Layout>
    </Layout>
  )
}
