import type { PageBuilderWidgetDefinitionInterface } from 'nucleify'

export const NATIVE_WIDGETS: PageBuilderWidgetDefinitionInterface[] = [
  {
    key: 'native-container',
    label: 'Container',
    source: 'native',
    type: 'container',
    defaultProps: {},
    acceptsChildren: true,
  },
  {
    key: 'native-row',
    label: 'Row',
    source: 'native',
    type: 'row',
    defaultProps: { gap: '16px', columns: 3 },
    acceptsChildren: true,
  },
  {
    key: 'native-column',
    label: 'Column',
    source: 'native',
    type: 'column',
    defaultProps: { gap: '16px' },
    acceptsChildren: true,
  },
  {
    key: 'native-section',
    label: 'Section',
    source: 'native',
    type: 'section',
    defaultProps: {},
    acceptsChildren: true,
  },
  {
    key: 'native-heading',
    label: 'Heading',
    source: 'native',
    type: 'heading',
    defaultProps: {
      text: 'New heading',
      level: 'h2',
    },
  },
  {
    key: 'native-text',
    label: 'Text',
    source: 'native',
    type: 'text',
    defaultProps: {
      text: 'Write your content here.',
    },
  },
  {
    key: 'native-button',
    label: 'Button',
    source: 'native',
    type: 'button',
    defaultProps: {
      text: 'Click me',
      href: '#',
    },
  },
  {
    key: 'native-image',
    label: 'Image',
    source: 'native',
    type: 'image',
    defaultProps: {
      src: '/img/logo.svg',
      alt: 'Image',
      width: '',
    },
  },
  {
    key: 'native-video',
    label: 'Video Embed',
    source: 'native',
    type: 'video',
    defaultProps: {
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      width: '100%',
      height: '400',
    },
  },
  {
    key: 'native-divider',
    label: 'Divider',
    source: 'native',
    type: 'divider',
    defaultProps: {},
  },
  {
    key: 'native-spacer',
    label: 'Spacer',
    source: 'native',
    type: 'spacer',
    defaultProps: {
      height: '40px',
    },
  },
  {
    key: 'native-html',
    label: 'Raw HTML',
    source: 'native',
    type: 'html',
    defaultProps: {
      html: '<div style="padding:16px;border:1px dashed #333;border-radius:8px;">Custom HTML block</div>',
    },
  },
  {
    key: 'native-list',
    label: 'List',
    source: 'native',
    type: 'list',
    defaultProps: {
      items: 'Item one\nItem two\nItem three',
      ordered: false,
    },
  },
  {
    key: 'native-quote',
    label: 'Blockquote',
    source: 'native',
    type: 'quote',
    defaultProps: {
      text: 'To be or not to be, that is the question.',
      cite: 'Shakespeare',
    },
  },
  {
    key: 'native-code',
    label: 'Code Block',
    source: 'native',
    type: 'code',
    defaultProps: {
      code: 'console.log("Hello world")',
      language: 'javascript',
    },
  },
]
