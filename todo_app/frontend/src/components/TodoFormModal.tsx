import { useEffect } from 'react'
import { DatePicker, Form, Input, Modal, Select, Space, Tag, Typography } from 'antd'
import { priorityMeta, statusMeta } from '@/theme'
import dayjs from 'dayjs'
import type { Priority, Tag as TagModel, Todo, TodoPayload, TodoStatus } from '@/types'

export type TodoFormValues = TodoPayload

export interface TodoFormModalProps {
  open: boolean
  /** null => create mode, a todo => edit mode. */
  todo: Todo | null
  allTags: TagModel[]
  saving: boolean
  onCancel: () => void
  onSubmit: (values: TodoFormValues) => void
}

export default function TodoFormModal({ open, todo, allTags, saving, onCancel, onSubmit }: TodoFormModalProps) {
  const [form] = Form.useForm<TodoFormValues>()
  const isEdit = Boolean(todo)

  // Seed the fields once the dialog is actually mounted. Doing this before
  // open would touch a detached form instance and trip antd's warning.
  const seedForm = () => {
    form.setFieldsValue({
      title: todo?.title ?? '',
      description: todo?.description ?? '',
      priority: todo?.priority ?? 'medium',
      status: todo?.status ?? 'todo',
      due_date: todo?.due_date ?? null,
      tag_ids: todo?.tags.map((tag) => tag.id) ?? [],
    })
  }

  const handleOk = async () => {
    const values = await form.validateFields()
    onSubmit({
      title: values.title.trim(),
      description: (values.description ?? '').trim(),
      priority: values.priority ?? 'medium',
      status: values.status ?? 'todo',
      due_date: values.due_date ?? null,
      tag_ids: values.tag_ids ?? [],
    })
  }

  // Cmd/Ctrl + Enter submits from anywhere inside the modal.
  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') void handleOk()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  return (
    <Modal
      title={isEdit ? 'Edit task' : 'New task'}
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      confirmLoading={saving}
      okText={isEdit ? 'Save changes' : 'Create task'}
      width={580}
      afterOpenChange={(visible) => {
        if (visible) {
          seedForm()
          form.getFieldInstance('title')?.focus?.()
        }
      }}
    >
      <Form<TodoFormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{ priority: 'medium', status: 'todo', tag_ids: [] }}
        style={{ marginTop: 12 }}
      >
        <Form.Item
          name="title"
          label="Title"
          rules={[
            { required: true, message: 'Give the task a title' },
            { max: 140, message: 'Keep it under 140 characters' },
            {
              validator: (_, value: string) =>
                value && !value.trim() ? Promise.reject(new Error('Title cannot be blank')) : Promise.resolve(),
            },
          ]}
        >
          <Input placeholder="Wire up the reorder endpoint" maxLength={140} showCount autoFocus />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea
            placeholder="Extra context, acceptance criteria, links…"
            autoSize={{ minRows: 3, maxRows: 7 }}
            maxLength={2000}
          />
        </Form.Item>

        <Space size={12} wrap style={{ display: 'flex' }}>
          <Form.Item name="priority" label="Priority" style={{ marginBottom: 12 }}>
            <Select<Priority>
              style={{ width: 156 }}
              options={Object.entries(priorityMeta).map(([value, meta]) => ({
                value: value as Priority,
                label: (
                  <Space size={6}>
                    <span
                      style={{ width: 8, height: 8, borderRadius: 4, background: meta.color, display: 'inline-block' }}
                    />
                    {meta.label}
                  </Space>
                ),
              }))}
            />
          </Form.Item>

          <Form.Item name="status" label="Status" style={{ marginBottom: 12 }}>
            <Select<TodoStatus>
              style={{ width: 156 }}
              options={Object.entries(statusMeta).map(([value, meta]) => ({
                value: value as TodoStatus,
                label: meta.label,
              }))}
            />
          </Form.Item>

          {/* antd DatePicker speaks dayjs, the API contract wants an ISO date string. */}
          <Form.Item
            name="due_date"
            label="Due date"
            style={{ marginBottom: 12 }}
            getValueProps={(value) => ({ value: value ? dayjs(value) : null })}
            normalize={(value) => (value ? dayjs(value).format('YYYY-MM-DD') : null)}
          >
            <DatePicker style={{ width: 176 }} placeholder="No due date" />
          </Form.Item>
        </Space>

        <Form.Item name="tag_ids" label="Tags">
          <Select
            mode="multiple"
            allowClear
            placeholder="Attach tags"
            optionFilterProp="searchText"
            // Open upwards so the list never covers the dialog footer buttons.
            placement="topLeft"
            options={allTags.map((tag) => ({
              value: tag.id,
              searchText: tag.name,
              label: (
                <Tag color={tag.color} style={{ marginInlineEnd: 0 }}>
                  {tag.name}
                </Tag>
              ),
            }))}
          />
        </Form.Item>

        <Typography.Text type="secondary" className="toolbar-note">
          Tip: ⌘/Ctrl + Enter saves from anywhere in this dialog.
        </Typography.Text>
      </Form>
    </Modal>
  )
}