import React from 'react'
import { Layout, Typography, Button, Space, Divider } from '@arco-design/web-react'
import { IconGithub, IconInfoCircle } from '@arco-design/web-react/icon'
import SpriteViewport from './modes/SpriteMode/SpriteViewport'
import SpriteSidebar from './modes/SpriteMode/SpriteSidebar'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

export default function App() {
  return (
    <Layout className="h-screen bg-[#0f0f13] text-[#e8e8f0] overflow-hidden">
      <Header className="h-14 border-b border-[#2e2e40] bg-[#1a1a22] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#7c6af7] to-[#56cfb2] flex items-center justify-center shadow-lg shadow-[#7c6af7]/20">
            <span className="text-white font-black text-lg leading-none" style={{ fontFamily: 'monospace' }}>S</span>
          </div>
          <div>
            <Title style={{ color: '#e8e8f0', margin: 0, fontSize: '16px', fontWeight: 600, lineHeight: 1.2 }}>
              Sprite Editor
            </Title>
            <Text style={{ color: '#8888a8', fontSize: '12px' }}>
              Sequence Frame Tool
            </Text>
          </div>
        </div>
        
        <Space size="medium">
          <Button type="text" icon={<IconInfoCircle />} style={{ color: '#8888a8' }}>
            Shortcuts
          </Button>
          <Divider type="vertical" style={{ borderColor: '#2e2e40' }} />
          <Button type="secondary" size="small" icon={<IconGithub />} shape="round">
            Star on GitHub
          </Button>
        </Space>
      </Header>
      
      <Layout className="flex-1 overflow-hidden relative">
        <Sider 
          width={340} 
          className="border-r border-[#2e2e40] bg-[#12121a] flex flex-col shrink-0"
        >
          <SpriteSidebar />
        </Sider>
        
        <Content className="bg-[#0f0f13] relative overflow-hidden flex flex-col">
          <SpriteViewport />
        </Content>
      </Layout>
    </Layout>
  )
}
