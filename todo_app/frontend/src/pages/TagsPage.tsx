import { Button, Card, Col, Row, Space, Spin, Table, Tag, Tooltip, Typography } from 'antd'
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState } from 'react'
import TagManager from '@/components/TagManager'
import { useAppStore } from '@/context/AppStore'
import { TAG_PALETTE } from '@/theme'
import type { Tag as TagModel } from '@/types'

export default function TagsPage() {
  const { tags, tagsLoading, refreshTags, createTag, deleteTag, openCreate } = useAppStore()
  const [pendingId, setPendingId] = useState<number | null>(null)

  return (
    <div className="page--scroll">
      <div className="page-head" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="section-title">
            Labels
            <span className="section-title__hint">/ taxonomy for your tasks</span>
          </h2>
          <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
            Tags are many-to-many. Use them to group work and to filter the board on{' '}
            <code className="mono">/todos</code>.
          </Typography.Paragraph>
        </div>
        <div style={{ flex: 1 }} />
<Space wrap>
      <Button icon={<ReloadOutlined />} onClick={() => void refreshTags()}>
        Reload
      </Button>
      <TagManager tags={tags} loading={tagsLoading} create={createTag} remove={deleteTag} refresh={refreshTags} />
    </Space>
      </div>

      {/* Existing tags stay visible here; only "New tag" lives in the toolbar. */}
      {tags.length ? (
        <div className="tag-chip-row">
          <span className="toolbar-note" style={{ alignSelf: 'center' }}>
            In use
          </span>
          {tags.map((tag) => (
            <Tag key={tag.id} color={tag.color}>
              {tag.name}
              {typeof tag.todo_count === 'number' ? <span className="mono"> {tag.todo_count}</span> : null}
            </Tag>
          ))}
        </div>
      ) : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card variant="borderless" className="stat-card" title={<span className="section-title">All tags</span>}>
            <Spin spinning={tagsLoading}>
              <Table<TagModel>
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={tags}
                locale={{
                  emptyText: (
                    <Typography.Text type="secondary">
                      No tags yet — use “New tag” to create your first label.
                    </Typography.Text>
                  ),
                }}
                columns={[
                  {
                    title: 'Tag',
                    dataIndex: 'name',
                    render: (name: string, tag) => (
                      <Space>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            background: tag.color,
                            boxShadow: `0 0 10px ${tag.color}`,
                          }}
                        />
                        <Typography.Text strong>{name}</Typography.Text>
                      </Space>
                    ),
                  },
                  {
                    title: 'Tasks',
                    dataIndex: 'todo_count',
                    align: 'right',
                    width: 90,
                    render: (count?: number) => <span className="mono">{count ?? '—'}</span>,
                  },
                  {
                    title: 'Color',
                    dataIndex: 'color',
                    width: 100,
                    render: (color: string) => <Tag color={color}>{color}</Tag>,
                  },
                  {
                    title: '',
                    key: 'actions',
                    align: 'right',
                    width: 60,
                    render: (_, tag) => (
                      <Tooltip title="Delete tag">
                        <Button
                          type="text"
                          size="small"
                          danger
                          loading={pendingId === tag.id}
                          icon={<DeleteOutlined />}
                          onClick={async () => {
                            setPendingId(tag.id)
                            await deleteTag(tag)
                            setPendingId(null)
                          }}
                        />
                      </Tooltip>
                    ),
                  },
                ]}
              />
            </Spin>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            variant="borderless"
            className="stat-card"
            title={<span className="section-title">Suggested palette</span>}
          >
            <Space size={[8, 8]} wrap>
              {TAG_PALETTE.map((color) => (
                <Tooltip title={color} key={color}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: color,
                      boxShadow: `0 0 14px ${color}55`,
                    }}
                  />
                </Tooltip>
              ))}
            </Space>
            <Typography.Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>
              Pick any of these when creating a tag so the board stays visually consistent.
            </Typography.Paragraph>
          </Card>

          <Card
            variant="borderless"
            className="stat-card"
            style={{ marginTop: 16 }}
            title={<span className="section-title">Tag a task</span>}
          >
            <Typography.Paragraph type="secondary">
              Tags are attached from the task editor or inline while editing a row.
            </Typography.Paragraph>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Open task editor
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  )
}