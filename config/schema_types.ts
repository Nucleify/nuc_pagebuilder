export type PropFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'select'
  | 'color'
  | 'json'

export interface PropFieldSchema {
  key: string
  label: string
  type: PropFieldType
  default?: unknown
  placeholder?: string
  options?: string[]
}
