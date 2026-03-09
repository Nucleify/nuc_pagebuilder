import { ATOMIC_ATOM_TAGS } from './atomic_tags'

export const ATOMIC_DEFAULT_PROPS: Record<string, Record<string, unknown>> = {
  'ad-button': { label: 'form-get-in-touch', severity: 'primary' },
  'ad-heading': { tag: 2, text: 'home-header' },
  'ad-paragraph': { text: 'home-description' },
  'ad-label': { label: 'field-label' },
  'ad-tag': { value: 'Tag' },
  'ad-badge': { value: '3' },
  'ad-image': { src: '/img/logo.svg', alt: 'Image' },
  'ad-icon': { icon: 'mdi:star', size: '24px' },
  'ad-divider': {},
  'ad-avatar': { label: 'N', size: 'large' },
  'ad-progress-bar': { value: 75, showValue: true },
  'ad-rating': { stars: 5 },
  'ad-knob': { min: 0, max: 100 },
  'ad-skeleton': { width: '100%', height: '1rem' },
  'ad-slider': { min: 0, max: 100 },
  'ad-anchor': { href: '#contact', label: 'contact-heading' },
  'ad-tile': { header: 'home-feature-save-title', icon: 'mdi:clock-fast' },
  'ad-card': { title: 'about-card-title' },
  'ad-dock': {
    model: [
      { label: 'dock-home', icon: 'prime:home' },
      { label: 'dock-admin', icon: 'prime:crown' },
      { label: 'dock-entities', icon: 'prime:box' },
      { label: 'dock-files', icon: 'prime:file' },
      { label: 'dock-settings', icon: 'prime:cog' },
    ],
  },
  'ad-select': {
    options: [
      { label: 'Nucleify', value: 'nucleify' },
      { label: 'Page Builder', value: 'pagebuilder' },
      { label: 'Auth', value: 'auth' },
      { label: 'Files', value: 'files' },
    ],
    optionLabel: 'label',
    optionValue: 'value',
    placeholder: 'Select module...',
  },
  'ad-multi-select': {
    options: [
      { label: 'Nucleify', value: 'nucleify' },
      { label: 'Page Builder', value: 'pagebuilder' },
      { label: 'Auth', value: 'auth' },
      { label: 'Files', value: 'files' },
    ],
    optionLabel: 'label',
    optionValue: 'value',
    placeholder: 'Select modules...',
  },
  'ad-panel': { header: 'features-support-inbox-title' },
  'ad-accordion': {
    panels: [
      {
        index: 0,
        content: 'home-feature-save-title',
        answer: 'home-feature-save-desc',
      },
      {
        index: 1,
        content: 'home-feature-fast-title',
        answer: 'home-feature-fast-desc',
      },
      {
        index: 2,
        content: 'home-feature-secure-title',
        answer: 'home-feature-secure-desc',
      },
    ],
  },
  'ad-chart': {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Revenue',
          data: [12, 19, 8, 15, 22, 30],
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: '#10b981',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  },
  'ad-data-table': {
    value: [
      { id: 1, name: 'Nucleify', status: 'Active', category: 'Platform' },
      { id: 2, name: 'Page Builder', status: 'Active', category: 'Module' },
      { id: 3, name: 'Auth', status: 'Active', category: 'Module' },
    ],
    paginator: false,
    rows: 10,
  },
}

export const ATOMIC_SLOTS: Record<string, string[]> = {
  'ad-card': ['header', 'title', 'content'],
  'ad-dialog': ['header', 'default', 'footer'],
  'ad-panel': ['default'],
}

export const LEAF_TAGS = new Set<string>([
  ...ATOMIC_ATOM_TAGS,
  'ad-chart',
  'ad-color-picker',
  'ad-data-table',
  'ad-date-picker',
  'ad-file-upload',
  'ad-meter-group',
  'ad-multi-select',
  'ad-password',
  'ad-pick-list',
  'ad-select',
  'ad-terminal',
  'ad-toast',
  'ad-tree',
  'ad-auto-complete',
  'ad-swiper',
])
