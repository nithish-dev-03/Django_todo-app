import { useEffect, useState } from 'react'
import { App as AntApp, ConfigProvider } from 'antd'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '@/components/AppLayout'
import TodoFormModal from '@/components/TodoFormModal'
import OverviewPage from '@/pages/OverviewPage'
import TagsPage from '@/pages/TagsPage'
import TodosPage from '@/pages/TodosPage'
import { AppStoreProvider, useAppStore } from '@/context/AppStore'
import { darkTheme, lightTheme } from '@/theme'

interface WorkspaceProps {
  dark: boolean
  onToggleTheme: () => void
}

function Workspace({ dark, onToggleTheme }: WorkspaceProps) {
  const store = useAppStore()

  return (
    <>
      <AppLayout dark={dark} onToggleTheme={onToggleTheme} onCreate={store.openCreate}>
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/todos" element={<TodosPage />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>

      <TodoFormModal
        open={store.formOpen}
        todo={store.formTodo}
        allTags={store.tags}
        saving={store.formSaving}
        onCancel={store.closeForm}
        onSubmit={(values) => void store.submitForm(values)}
      />
    </>
  )
}

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('taskflow-theme') !== 'light')

  useEffect(() => {
    const theme = dark ? 'dark' : 'light'
    localStorage.setItem('taskflow-theme', theme)
    document.documentElement.dataset.theme = theme
    document.body.dataset.theme = theme
  }, [dark])

  return (
    <ConfigProvider theme={dark ? darkTheme : lightTheme}>
      <AntApp>
        <AppStoreProvider>
          <BrowserRouter>
            <Workspace dark={dark} onToggleTheme={() => setDark((prev) => !prev)} />
          </BrowserRouter>
        </AppStoreProvider>
      </AntApp>
    </ConfigProvider>
  )
}