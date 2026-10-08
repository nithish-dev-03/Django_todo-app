import { Card, Col, Progress, Row, Skeleton, Statistic, Tag, Tooltip } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FieldTimeOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { priorityMeta } from '@/theme'
import type { Stats } from '@/types'

const PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low'] as const

interface StatCardsProps {
  stats: Stats | null
  loading: boolean
}

export default function StatCards({ stats, loading }: StatCardsProps) {
  if (loading && !stats) {
    return (
      <Row gutter={[16, 16]}>
        {[0, 1, 2, 3].map((key) => (
          <Col xs={12} md={6} key={key}>
            <Card className="stat-card">
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          </Col>
        ))}
      </Row>
    )
  }

  const data = stats!
  const open = data.total - data.done

  const cards = [
    {
      key: 'total',
      title: 'Total tasks',
      value: data.total,
      icon: <UnorderedListOutlined />,
      color: '#4f8cff',
      hint: `${open} still open`,
    },
    {
      key: 'progress',
      title: 'In progress',
      value: data.in_progress,
      icon: <ClockCircleOutlined />,
      color: '#13c2c2',
      hint: `${data.todo} queued`,
    },
    {
      key: 'done',
      title: 'Completed',
      value: data.done,
      icon: <CheckCircleOutlined />,
      color: '#48c9a9',
      hint: `${Math.round(data.completion_rate)}% of total`,
    },
    {
      key: 'overdue',
      title: 'Overdue',
      value: data.overdue,
      icon: <ExclamationCircleOutlined />,
      color: '#ff4d4f',
      hint: data.due_today ? `${data.due_today} due today` : 'nothing due today',
    },
  ]

  const byPriority = PRIORITY_ORDER.map((key) => ({
    key,
    value: data.by_priority?.[key] ?? 0,
    color: priorityMeta[key].color,
  }))

  const priorityTotal = byPriority.reduce((sum, item) => sum + item.value, 0)

  return (
    <>
      <Row gutter={[16, 16]}>
        {cards.map((card) => (
          <Col xs={12} md={6} key={card.key}>
            <Card className="stat-card" variant="borderless">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <Statistic
                  title={
                    <span className="toolbar-note" style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      {card.title}
                    </span>
                  }
                  value={card.value}
                />
                <div
                  className="stat-card__icon"
                  style={{ background: `${card.color}1f`, color: card.color }}
                >
                  {card.icon}
                </div>
              </div>
              <div className="stat-card__hint">{card.hint}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={10}>
          <Card
            className="stat-card"
            variant="borderless"
            title={<span className="section-title">Completion</span>}
            extra={
              <Tooltip title="Done ÷ total across every status filter">
                <FieldTimeOutlined style={{ color: 'var(--app-muted)' }} />
              </Tooltip>
            }
          >
            <Progress
              type="dashboard"
              percent={Math.round(data.completion_rate)}
              strokeColor={{ from: '#4f8cff', to: '#48c9a9' }}
              size={140}
              format={(percent) => (
                <span style={{ fontSize: 26, fontWeight: 700 }}>
                  {percent}
                  <span style={{ fontSize: 13, color: 'var(--app-muted)' }}>%</span>
                </span>
              )}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              <Tag color="success">Done {data.done}</Tag>
              <Tag color="processing">Doing {data.in_progress}</Tag>
              <Tag>Queued {data.todo}</Tag>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            className="stat-card"
            variant="borderless"
            title={<span className="section-title">Priority spread</span>}
            extra={<span className="section-title__hint mono">{priorityTotal} tasks</span>}
          >
            <div className="priority-bar" style={{ marginBottom: 16 }}>
              {byPriority.map((item) => (
                <div
                  key={item.key}
                  className="priority-bar__seg"
                  title={`${item.key}: ${item.value}`}
                  style={{
                    width: priorityTotal ? `${(item.value / priorityTotal) * 100}%` : '0%',
                    background: item.color,
                  }}
                />
              ))}
            </div>
            <Row gutter={[16, 16]}>
              {byPriority.map((item) => (
                <Col xs={12} md={6} key={item.key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        background: item.color,
                        boxShadow: `0 0 10px ${item.color}`,
                      }}
                    />
                    <span className="mono" style={{ fontSize: 18, fontWeight: 650 }}>
                      {item.value}
                    </span>
                    <span className="toolbar-note">{item.key}</span>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </>
  )
}