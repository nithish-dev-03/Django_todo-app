import { useState } from 'react'
import { Button, ColorPicker, Form, Input, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { TAG_PALETTE } from '@/theme'
import type { TagsController } from '@/hooks/useTags'

interface FormValues {
  name: string
  color: string
}

/** "New tag" action plus its creation dialog. Tag listing lives on the Labels page. */
export default function TagManager({ tags, create }: TagsController) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<FormValues>()

  const submit = async () => {
    const values = await form.validateFields()
    setSaving(true)
    const tag = await create(values.name.trim(), values.color)
    setSaving(false)
    if (tag) {
      form.resetFields()
      setOpen(false)
    }
  }

  return (
    <>
      <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => setOpen(true)}>
        New tag
      </Button>

      <Modal
        title="Create tag"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => void submit()}
        confirmLoading={saving}
        okText="Create"
        // Seed only once mounted: touching a detached form instance warns.
        afterOpenChange={(visible) => {
          if (!visible) return
          form.setFieldsValue({ name: '', color: TAG_PALETTE[tags.length % TAG_PALETTE.length] })
        }}
      >
        <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 12 }}>
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: 'Tag name is required' },
              { max: 24, message: 'Keep it under 24 characters' },
            ]}
          >
            <Input placeholder="backend" autoFocus onPressEnter={() => void submit()} />
          </Form.Item>
          <Form.Item name="color" label="Color">
            <ColorPicker
              showText
              presets={[{ label: 'Palette', colors: TAG_PALETTE }]}
              onChange={(color) => form.setFieldValue('color', color.toHexString())}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}