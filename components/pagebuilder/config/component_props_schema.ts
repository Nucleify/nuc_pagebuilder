import type { PropFieldSchema } from 'nucleify'

export const COMPONENT_PROPS_SCHEMA: Record<string, PropFieldSchema[]> = {
  'ad-button': [
    {
      key: 'severity',
      label: 'Severity',
      type: 'select',
      options: [
        'primary',
        'secondary',
        'success',
        'info',
        'warn',
        'danger',
        'help',
        'contrast',
      ],
    },
    {
      key: 'variant',
      label: 'Variant',
      type: 'select',
      options: ['', 'outlined', 'text', 'link'],
    },
  ],
  'ad-image': [
    {
      key: 'fetchpriority',
      label: 'Fetch priority',
      type: 'select',
      options: ['', 'high', 'low'],
    },
  ],
  'ad-badge': [
    {
      key: 'severity',
      label: 'Severity',
      type: 'select',
      options: [
        '',
        'secondary',
        'success',
        'info',
        'warn',
        'danger',
        'contrast',
      ],
    },
    {
      key: 'size',
      label: 'Size',
      type: 'select',
      options: ['', 'small', 'large', 'xlarge'],
    },
  ],
  'ad-tag': [
    {
      key: 'severity',
      label: 'Severity',
      type: 'select',
      options: [
        '',
        'secondary',
        'success',
        'info',
        'warn',
        'danger',
        'contrast',
      ],
    },
  ],
  'ad-avatar': [
    {
      key: 'size',
      label: 'Size',
      type: 'select',
      options: ['', 'normal', 'large', 'xlarge'],
    },
    {
      key: 'shape',
      label: 'Shape',
      type: 'select',
      options: ['', 'square', 'circle'],
    },
  ],
  'ad-divider': [
    {
      key: 'align',
      label: 'Align',
      type: 'select',
      options: ['', 'left', 'center', 'right', 'top', 'bottom'],
    },
    {
      key: 'layout',
      label: 'Layout',
      type: 'select',
      options: ['', 'horizontal', 'vertical'],
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: ['', 'solid', 'dashed', 'dotted'],
    },
  ],
  'ad-skeleton': [
    {
      key: 'shape',
      label: 'Shape',
      type: 'select',
      options: ['', 'rectangle', 'circle'],
    },
  ],
  'ad-logo': [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: ['', 'symbol', 'paths', 'svg'],
    },
  ],
  'ad-anchor': [
    {
      key: 'target',
      label: 'Target',
      type: 'select',
      options: ['', '_self', '_blank', '_parent', '_top'],
    },
    {
      key: 'rel',
      label: 'Rel',
      type: 'select',
      options: ['', 'noopener', 'noreferrer', 'nofollow'],
    },
  ],
  'ad-chart': [
    {
      key: 'type',
      label: 'Chart type',
      type: 'select',
      options: ['', 'bar', 'line', 'pie', 'doughnut', 'radar', 'polarArea'],
    },
  ],
  'ad-mega-menu': [
    {
      key: 'orientation',
      label: 'Orientation',
      type: 'select',
      options: ['', 'horizontal', 'vertical'],
    },
  ],
  'ad-dock': [
    {
      key: 'position',
      label: 'Position',
      type: 'select',
      options: ['', 'top', 'bottom', 'left', 'right'],
    },
  ],
  'ad-speed-dial': [
    {
      key: 'direction',
      label: 'Direction',
      type: 'select',
      options: ['', 'up', 'down', 'left', 'right'],
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: ['', 'linear', 'circle', 'semi-circle', 'quarter-circle'],
    },
  ],
}
