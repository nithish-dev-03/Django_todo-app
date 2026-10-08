import { useState } from 'react'
import { Avatar, Button, Dropdown, Grid, Layout, Menu, Space, Switch, Tag, Tooltip, Typography, theme as antdTheme } from 'antd'
import {
  AppstoreOutlined,
  CodeOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  PlusOutlined,
  SunOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ACCENT } from '@/theme'

const { Header, Sider, Content } = Layout

export interface AppLayoutProps {
  dark: boolean
  onToggleTheme: () => void
  onCreate: () => void
  children: React.ReactNode
}

const NAV = [
  { key: '/', icon: <DashboardOutlined />, label: <Link to="/">Overview</Link> },
  { key: '/todos', icon: <UnorderedListOutlined />, label: <Link to="/todos">Tasks</Link> },
  { key: '/tags', icon: <AppstoreOutlined />, label: <Link to="/tags">Labels</Link> },
]

export default function AppLayout({ dark, onToggleTheme, onCreate, children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const screens = Grid.useBreakpoint()
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = antdTheme.useToken()

  const isMobile = !screens.lg
  const siderCollapsed = collapsed || isMobile

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Sider
        className="app-sider"
        width={216}
        collapsedWidth={isMobile ? 0 : 72}
        collapsible
        collapsed={siderCollapsed}
        trigger={null}
      >
        <div className="app-logo">
          <span className="app-logo__mark">
            <CodeOutlined />
          </span>
          {!siderCollapsed ? (
            <span className="app-logo__text">
              Taskflow
              <small>todo console</small>
            </span>
          ) : null}
        </div>
        <Menu
          theme={dark ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[location.pathname]}
          items={NAV}
          style={{ borderInlineEnd: 'none', background: 'transparent' }}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout style={{ background: 'transparent' }}>
        <Header className="app-header">
          <Button
            type="text"
            icon={siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label="Toggle navigation"
          />

          <Space size={8} className="mono">
            <Tag color={ACCENT} style={{ marginInlineEnd: 0 }}>
              django
            </Tag>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              + react / antd
            </Typography.Text>
          </Space>

          <div style={{ flex: 1 }} />

          <Space size={14}>
            <Tooltip title={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
              <Space size={6}>
                <MoonOutlined style={{ color: dark ? ACCENT : token.colorTextTertiary }} />
                <Switch size="small" checked={dark} onChange={onToggleTheme} />
                <SunOutlined style={{ color: dark ? token.colorTextTertiary : '#faad14' }} />
              </Space>
            </Tooltip>

            <Dropdown
              menu={{
                items: [
                  { key: 'api', label: 'API base', disabled: true },
                  { key: 'api-url', label: <span className="mono">{import.meta.env.VITE_API_BASE_URL ?? '/api'}</span> },
                  { type: 'divider' },
                  { key: 'docs', label: 'See README for the endpoint contract', disabled: true },
                ],
              }}
            >
              <Avatar size={30} style={{ background: ACCENT, cursor: 'pointer' }}>
                TF
              </Avatar>
            </Dropdown>

            <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
              {siderCollapsed ? '' : 'New task'}
            </Button>
          </Space>
        </Header>

        <Content className="app-content">{children}</Content>
      </Layout>
    </Layout>
  )
}

