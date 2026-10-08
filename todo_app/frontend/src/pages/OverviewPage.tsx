import { Alert, Button, Card, Col, Empty, Row, Skeleton, Space, Tag, Typography } from 'antd'
import { ArrowRightOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import StatCards from '@/components/StatCards'
import { useStats } from '@/hooks/useStats'
import { fetchTodos } from '@/api'
import { useEffect, useState } from 'react'
import { priorityMeta } from '@/theme'
import { formatDueDate, isOverdue } from '@/lib/format'
import { useAppStore } from '@/context/AppStore'
import type { Todo } from '@/types'

export default function OverviewPage() {
  const { refreshKey, openCreate, bumpRefresh } = useAppStore()
  const { stats, loading, refresh } = useStats(refreshKey)
  const [recent, setRecent] = useState<Todo[]>([])
  const [recentLoading, setRecentLoading] = useState(true)

  useEffect(() => {
    let active = true
    setRecentLoading(true)
    fetchTodos({ ordering: '-created_at' })
      .then((rows) => {
        if (active) setRecent(rows.slice(0, 6))
      })
      .catch(() => {
        if (active) setRecent([])
      })
      .finally(() => {
        if (active) setRecentLoading(false)
      })
    return () => {
      active = false
    }
  }, [refreshKey])

  const overdue = (stats?.overdue ?? 0) > 0

  return (
    <div className="page--scroll">
      <div className="page-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">
            Mission control
            <span className="section-title__hint">/ overview of your workload</span>
          </h2>
          <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
            Live counters straight from <code className="mono">GET /api/todos/stats/</code>.
          </Typography.Paragraph>
        </div>
        <div style={{ flex: 1 }} />
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { void refresh(); bumpRefresh() }}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New task
          </Button>
        </Space>
      </div>

      {overdue ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          title={`${stats?.overdue} task${stats?.overdue === 1 ? '' : 's'} past due`}
          action={
            <Link to="/todos?overdue=1">
              <Button size="small">Review</Button>
            </Link>
          }
        />
      ) : null}

      <StatCards stats={stats} loading={loading} />

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            variant="borderless"
            className="stat-card"
            title={<span className="section-title">Recently added</span>}
            extra={<Link to="/todos">All tasks <ArrowRightOutlined /></Link>}
          >
            {recentLoading && !recent.length ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : recent.length ? (
              <div className="recent-list">
                {recent.map((todo) => {
                  const due = formatDueDate(todo)
                  return (
                    <div className="recent-list__row" key={todo.id}>
                      <span
                        className="recent-list__dot"
                        style={{
                          background: priorityMeta[todo.priority].color,
                          boxShadow: `0 0 8px ${priorityMeta[todo.priority].color}`,
                        }}
                      />
                      <div className="recent-list__body">
                        <span className={todo.status === 'done' ? 'todo-row--done' : undefined}>
                          {todo.title}
                        </span>
                        <Space size={6} wrap>
                          {todo.tags.map((tag) => (
                            <Tag key={tag.id} color={tag.color} style={{ marginInlineEnd: 0 }}>
                              {tag.name}
                            </Tag>
                          ))}
                          {todo.due_date ? (
                            <span
                              className="mono toolbar-note"
                              style={{ color: isOverdue(todo) ? '#ff4d4f' : undefined }}
                            >
                              {due.label}
                            </span>
                          ) : null}
                        </Space>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<Typography.Text type="secondary">Nothing created yet</Typography.Text>}
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Create a task
                </Button>
              </Empty>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            variant="borderless"
            className="stat-card"
            title={<span className="section-title">Quick actions</span>}
          >
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Button block size="large" icon={<PlusOutlined />} onClick={openCreate}>
                  New task
                </Button>
              </Col>
              <Col span={12}>
                <Link to="/todos">
                  <Button block size="large" icon={<ArrowRightOutlined />}>
                    Open board
                  </Button>
                </Link>
              </Col>
              <Col span={12}>
                <Link to="/tags">
                  <Button block size="large">
                    Manage labels
                  </Button>
                </Link>
              </Col>
              <Col span={12}>
                <Link to="/todos">
                  <Button block size="large" danger>
                    Overdue only
                  </Button>
                </Link>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}