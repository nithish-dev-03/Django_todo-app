import { Button, Space, Tag, Typography } from 'antd'
import { TagOutlined } from '@ant-design/icons'
import type { TagsController } from '@/hooks/useTags'

interface TagFilterBarProps extends TagsController {
  selected: number[]
  onToggle: (tagId: number) => void
  onClear: () => void
}

export default function TagFilterBar({ tags, selected, onToggle, onClear }: TagFilterBarProps) {
  if (!tags.length) {
    return (
      <Typography.Text type="secondary" className="toolbar-note">
        <TagOutlined /> No tags yet — create one to group and filter tasks.
      </Typography.Text>
    )
  }

  return (
    <div className="tag-chip-row">
      <span className="toolbar-note" style={{ alignSelf: 'center' }}>
        Tags
      </span>
      <Space size={6} wrap>
        {tags.map((tag) => {
          const active = selected.includes(tag.id)
          return (
            <Tag
              key={tag.id}
              className={`tag-chip${active ? ' tag-chip--active' : ''}`}
              color={tag.color}
              style={{
                opacity: active ? 1 : 0.65,
                borderColor: active ? tag.color : undefined,
              }}
              onClick={() => onToggle(tag.id)}
            >
              {tag.name}
              {typeof tag.todo_count === 'number' ? <span className="mono"> {tag.todo_count}</span> : null}
            </Tag>
          )
        })}
        {selected.length > 0 ? (
          <Button type="link" size="small" onClick={onClear}>
            clear
          </Button>
        ) : null}
      </Space>
    </div>
  )
}