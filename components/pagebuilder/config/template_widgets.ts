import type { PageBuilderWidgetDefinitionInterface } from 'nucleify'

export const TEMPLATE_WIDGETS: PageBuilderWidgetDefinitionInterface[] = [
  {
    key: 'templates-grid-background',
    label: 'Template: Grid Background',
    source: 'templates',
    type: 'component',
    componentTag: 'nuc-grid-background',
    defaultProps: {},
    acceptsChildren: true,
  },
  {
    key: 'templates-shiny-badge',
    label: 'Template: Shiny Badge',
    source: 'templates',
    type: 'component',
    componentTag: 'nuc-shiny-badge',
    defaultProps: {
      label: 'home-badge',
      icon: 'mdi:rocket-launch',
    },
    acceptsChildren: true,
  },
  {
    key: 'templates-trust-badges',
    label: 'Template: Trust Badges',
    source: 'templates',
    type: 'component',
    componentTag: 'nuc-trust-badges',
    defaultProps: {
      items: [
        { icon: 'mdi:shield-check', label: 'results-trust-guarantee' },
        {
          icon: 'mdi:credit-card-off-outline',
          label: 'results-trust-payment',
        },
        { icon: 'mdi:infinity', label: 'results-trust-revisions' },
      ],
    },
    acceptsChildren: true,
  },
]

export const SECTION_WIDGETS: PageBuilderWidgetDefinitionInterface[] = [
  {
    key: 'sections-navbar',
    label: 'Section: Navbar',
    source: 'sections',
    type: 'component',
    componentTag: 'nuc-section-navbar',
    defaultProps: {},
    acceptsChildren: true,
  },
  {
    key: 'sections-footer',
    label: 'Section: Footer',
    source: 'sections',
    type: 'component',
    componentTag: 'nuc-section-footer',
    defaultProps: {},
    acceptsChildren: true,
  },
  {
    key: 'sections-faq',
    label: 'Section: FAQ',
    source: 'sections',
    type: 'component',
    componentTag: 'nuc-section-faq',
    defaultProps: {},
    acceptsChildren: true,
  },
  {
    key: 'sections-contact',
    label: 'Section: Contact',
    source: 'sections',
    type: 'component',
    componentTag: 'nuc-section-contact',
    defaultProps: {},
    acceptsChildren: true,
  },
  {
    key: 'sections-email-us',
    label: 'Section: Email Us',
    source: 'sections',
    type: 'component',
    componentTag: 'nuc-section-email-us',
    defaultProps: {},
    acceptsChildren: true,
  },
]
