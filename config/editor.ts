export const AD_TYPE_OPTIONS = [
  'main',
  'activity',
  'article',
  'contact',
  'file',
  'money',
  'question',
  'technology',
  'user',
] as const

export const WIDGET_ICONS: Record<string, string> = {
  'native-container': '📦',
  'native-row': '↔️',
  'native-column': '↕️',
  'native-section': '📑',
  'native-heading': '🔤',
  'native-text': '📝',
  'native-button': '🔘',
  'native-image': '🖼️',
  'native-video': '🎬',
  'native-divider': '➖',
  'native-spacer': '↕️',
  'native-html': '🧩',
  'native-list': '📋',
  'native-quote': '💬',
  'native-code': '💻',
}

export const GROUP_ICONS: Record<string, string> = {
  Native: '📦',
  Atom: '⚛',
  Molecule: '⌬',
  Organism: '🦠',
  Templates: '🧩',
  Sections: '📁',
}

export const GROUP_ORDER = [
  'Native',
  'Atom',
  'Molecule',
  'Organism',
  'Templates',
  'Sections',
  'Other',
]

export const WIDGET_DISPLAY_NAMES: Record<string, string> = {
  container: '📦 Container',
  row: '↔️ Row',
  column: '↕️ Column',
  section: '📑 Section',
  heading: '📝 Heading',
  text: '📄 Text',
  button: '🔘 Button',
  image: '🖼️ Image',
  video: '🎬 Video',
  divider: '➖ Divider',
  spacer: '↕️ Spacer',
  html: '🧩 HTML',
  list: '📋 List',
  quote: '💬 Blockquote',
  code: '🖥️ Code Block',
}
