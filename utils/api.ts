import { apiRequest } from '../../nuc_api/utils/api_request'
import type {
  PageBuilderLayoutInterface,
  PageBuilderPageInterface,
} from '../types/interfaces'

export function extractPageBuilderData<T>(response: unknown): T | null {
  let current: unknown = response
  for (let depth = 0; depth < 4; depth++) {
    if (!current || typeof current !== 'object') break
    if ('page' in current) {
      current = (current as { page: unknown }).page
      continue
    }
    if ('data' in current) {
      current = (current as { data: unknown }).data
      continue
    }
    break
  }
  return (current as T) ?? null
}

export async function fetchPageBuilderPreferences(
  baseUrl: string
): Promise<Record<string, unknown> | null> {
  try {
    const prefs = await apiRequest<Record<string, unknown>>(
      `${baseUrl}/preferences`
    )
    return prefs && typeof prefs === 'object' ? prefs : null
  } catch {
    return null
  }
}

export async function savePageBuilderPreferences(
  baseUrl: string,
  autosave: boolean
): Promise<void> {
  try {
    await apiRequest(`${baseUrl}/preferences`, 'PUT', {
      preferences: { autosave },
    })
  } catch {
    // Silent fail
  }
}

export async function fetchPageBuilderPages(
  baseUrl: string
): Promise<PageBuilderPageInterface[]> {
  const response = await apiRequest<{ data: PageBuilderPageInterface[] }>(
    `${baseUrl}/pages`
  )
  return extractPageBuilderData<PageBuilderPageInterface[]>(response) ?? []
}

export async function loadPageBuilderPage(
  baseUrl: string,
  id: number
): Promise<PageBuilderPageInterface | null> {
  const response = await apiRequest<{ data: PageBuilderPageInterface }>(
    `${baseUrl}/pages/${id}`
  )
  return extractPageBuilderData<PageBuilderPageInterface>(response)
}

export async function createPageBuilderPage(
  baseUrl: string,
  data: { title: string; slug: string }
): Promise<PageBuilderPageInterface | null> {
  const response = await apiRequest<{ page: PageBuilderPageInterface }>(
    `${baseUrl}/pages`,
    'POST',
    data
  )
  return extractPageBuilderData<PageBuilderPageInterface>(response)
}

export async function savePageBuilderDraft(
  baseUrl: string,
  pageId: number,
  layout: PageBuilderLayoutInterface
): Promise<void> {
  await apiRequest(`${baseUrl}/pages/${pageId}/draft`, 'POST', {
    layout_json: layout,
  })
}

export async function publishPageBuilderPage(
  baseUrl: string,
  pageId: number,
  data: {
    title: string
    slug: string
    meta_json: Record<string, unknown>
  }
): Promise<void> {
  await apiRequest(`${baseUrl}/pages/${pageId}/publish`, 'POST')
  await apiRequest(`${baseUrl}/pages/${pageId}`, 'PUT', {
    title: data.title,
    slug: data.slug,
    status: 'published',
    meta_json: data.meta_json,
  })
}

export async function deletePageBuilderPage(
  baseUrl: string,
  pageId: number
): Promise<void> {
  await apiRequest(`${baseUrl}/pages/${pageId}`, 'DELETE')
}
