import type { PropFieldSchema } from 'nucleify'

export const NATIVE_WIDGET_STYLE_SCHEMA: PropFieldSchema[] = [
  {
    key: 'padding',
    label: 'Padding',
    type: 'string',
    placeholder: 'e.g. 16px, 10px 20px',
  },
  {
    key: 'margin',
    label: 'Margin',
    type: 'string',
    placeholder: 'e.g. 0 auto, 16px 0',
  },
  {
    key: 'background',
    label: 'Background',
    type: 'color',
    placeholder: '#000000',
  },
  { key: 'color', label: 'Text color', type: 'color', placeholder: '#ffffff' },
]

export const CONTAINER_PROPS_SCHEMA: PropFieldSchema[] = [
  { key: 'gap', label: 'Gap', type: 'string', placeholder: 'e.g. 16px, 1rem' },
  {
    key: 'alignItems',
    label: 'Align items',
    type: 'select',
    options: ['', 'flex-start', 'center', 'flex-end', 'stretch', 'baseline'],
  },
  {
    key: 'justifyContent',
    label: 'Justify content',
    type: 'select',
    options: [
      '',
      'flex-start',
      'center',
      'flex-end',
      'space-between',
      'space-around',
      'space-evenly',
    ],
  },
  {
    key: 'flexWrap',
    label: 'Wrap',
    type: 'select',
    options: ['', 'nowrap', 'wrap', 'wrap-reverse'],
  },
  {
    key: 'maxWidth',
    label: 'Max width',
    type: 'string',
    placeholder: 'e.g. 1140px, 100%',
  },
  {
    key: 'minHeight',
    label: 'Min height',
    type: 'string',
    placeholder: 'e.g. 200px',
  },
]
