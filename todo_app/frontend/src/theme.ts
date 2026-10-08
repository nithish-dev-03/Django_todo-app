import { theme as antdTheme, type ThemeConfig } from 'antd'

export const ACCENT = '#4f8cff'

export const priorityMeta = {
  urgent: { label: 'Urgent', color: '#ff4d4f' },
  high: { label: 'High', color: '#ff9f45' },
  medium: { label: 'Medium', color: '#4f8cff' },
  low: { label: 'Low', color: '#48c9a9' },
} as const

export const statusMeta = {
  todo: { label: 'To do', color: 'default' },
  in_progress: { label: 'In progress', color: 'processing' },
  done: { label: 'Done', color: 'success' },
} as const

export const TAG_PALETTE = [
  '#4f8cff',
  '#48c9a9',
  '#ff9f45',
  '#ff4d4f',
  '#b37feb',
  '#13c2c2',
  '#eb2f96',
  '#8c8c8c',
]

const shared: ThemeConfig['token'] = {
  colorPrimary: ACCENT,
  borderRadius: 8,
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontSize: 14,
  wireframe: false,
}

export const darkTheme: ThemeConfig = {
  // The dark algorithm is what actually flips antd's derived tokens (Alert,
  // Button, Tag, Empty…). Colours alone are not enough.
  algorithm: antdTheme.darkAlgorithm,
  token: {
    ...shared,
    colorBgLayout: '#0d1117',
    colorBgContainer: '#151b23',
    colorBgElevated: '#1b222c',
    colorText: '#e6edf3',
    colorTextSecondary: '#9aa5b1',
    colorBorder: '#232b36',
    colorBorderSecondary: '#1d242e',
  },
  components: {
    Layout: {
      headerBg: 'rgba(13, 17, 23, 0.72)',
      siderBg: '#0d1117',
      bodyBg: '#0d1117',
      headerHeight: 60,
      headerPadding: '0 20px',
    },
    Menu: {
      darkItemBg: '#0d1117',
      darkSubMenuItemBg: '#0a0e14',
      darkItemSelectedBg: 'rgba(79, 140, 255, 0.16)',
      darkItemSelectedColor: ACCENT,
      darkItemHoverBg: 'rgba(255,255,255,0.05)',
    },
    Card: {
      colorBgContainer: '#151b23',
      headerBg: 'transparent',
    },
    Table: {
      headerBg: '#11161d',
      headerColor: '#8b949e',
      rowHoverBg: '#1a212b',
      borderColor: '#232b36',
      colorBgContainer: 'transparent',
    },
    Tag: {
      defaultBg: 'rgba(255,255,255,0.06)',
      defaultColor: '#c9d1d9',
    },
    Modal: {
      contentBg: '#151b23',
      headerBg: '#151b23',
    },
    Drawer: {
      colorBgElevated: '#151b23',
    },
    Input: {
      colorBgContainer: '#0f141b',
    },
    Select: {
      colorBgContainer: '#0f141b',
      optionSelectedBg: 'rgba(79, 140, 255, 0.18)',
    },
  },
}

export const lightTheme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    ...shared,
    colorBgLayout: '#f4f6fa',
    colorTextSecondary: '#5b6673',
  },
  components: {
    Layout: {
      headerBg: 'rgba(255, 255, 255, 0.8)',
      siderBg: '#ffffff',
      bodyBg: '#f4f6fa',
      headerHeight: 60,
      headerPadding: '0 20px',
    },
    Menu: {
      itemSelectedBg: 'rgba(79, 140, 255, 0.12)',
      itemSelectedColor: ACCENT,
    },
    Card: {
      colorBgContainer: '#ffffff',
    },
  },
}