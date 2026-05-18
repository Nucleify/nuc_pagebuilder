import {
  type ApiRoute,
  apiHandled,
  match,
  requireGatewayScope,
  requireGatewayUser,
  whenWith,
} from 'nuc_api'
import type { ApiContext, ApiHandlerResult, Json } from 'nuc_server'
import {
  formatRowResponseTimestamps,
  formatRowsResponseTimestamps,
} from 'nuc_server'

import { createHash, randomBytes, randomUUID } from 'node:crypto'

export const PRERENDER_LOCALES = ['en', 'pl'] as const

export type AuthOk = { userId: string; adminAll: boolean }

export type PagebuilderRoute = ApiRoute

export type PagebuilderAuthRoute = (
  ctx: ApiContext,
  auth: AuthOk
) => Promise<ApiHandlerResult | null>

export const whenPb = (
  spec: Parameters<typeof match>[1],
  run: PagebuilderAuthRoute
): PagebuilderAuthRoute => whenWith<AuthOk>(spec, run)

export const pbFail = (status: number, error: string): ApiHandlerResult =>
  apiHandled(status, { error })

export function slugify(raw: string): string {
  return raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function randomSlug(): string {
  return randomBytes(4).toString('hex')
}

async function slugTaken(
  supabase: ApiContext['supabase'],
  slug: string,
  ignorePageId?: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from('page_builder_pages')
    .select('id')
    .eq('slug', slug)
    .limit(1)
  if (error) return true
  const row = data?.[0] as { id?: number } | undefined
  if (!row?.id) return false
  if (ignorePageId !== undefined && Number(row.id) === ignorePageId)
    return false
  return true
}

export async function generateUniqueSlug(
  supabase: ApiContext['supabase'],
  raw: string,
  ignorePageId?: number
): Promise<string> {
  let base = slugify(raw)
  if (!base) base = randomSlug()
  let slug = base
  let index = 2
  while (await slugTaken(supabase, slug, ignorePageId)) {
    slug = `${base}-${index}`
    index++
  }
  return slug
}

export function defaultLayout(): Json {
  return {
    id: randomUUID(),
    type: 'page',
    settings: { maxWidth: '100%' },
    children: [],
  }
}

export function layoutChecksum(layout: unknown): string {
  return createHash('sha256').update(JSON.stringify(layout)).digest('hex')
}

export function isMissingColumnError(error: unknown): boolean {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : ''
  return (
    message.includes('column') &&
    (message.includes('does not exist') || message.includes('schema cache'))
  )
}

export function isUserIdTypeMismatchError(error: unknown): boolean {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : ''
  return (
    message.includes('invalid input syntax for type bigint') ||
    message.includes('operator does not exist: bigint = uuid') ||
    message.includes('operator does not exist: uuid = bigint')
  )
}

export async function resolveAuth(
  ctx: ApiContext
): Promise<AuthOk | ApiHandlerResult> {
  const user = await requireGatewayUser(ctx)
  if ('handled' in user) return user
  const scope = await requireGatewayScope(ctx)
  if ('handled' in scope) return scope
  return { userId: user.user.id, adminAll: scope.mode === 'all' }
}

export function fmtVer(row: unknown): unknown {
  return formatRowResponseTimestamps(row)
}

export function fmtPage(row: unknown): unknown {
  const formatted = formatRowResponseTimestamps(row) as Record<string, unknown>
  if (
    formatted.published_version &&
    typeof formatted.published_version === 'object'
  )
    formatted.published_version = fmtVer(formatted.published_version)
  if (Array.isArray(formatted.versions))
    formatted.versions = formatted.versions.map(fmtVer)
  return formatted
}

export async function loadVersionsForPage(
  supabase: ApiContext['supabase'],
  pageId: number
): Promise<unknown[]> {
  const { data, error } = await supabase
    .from('page_builder_versions')
    .select('*')
    .eq('page_id', pageId)
    .order('version', { ascending: false })
  if (error || !data) return []
  return formatRowsResponseTimestamps(data)
}

export async function loadPublishedVersion(
  supabase: ApiContext['supabase'],
  publishedVersionId: number | null
): Promise<unknown | null> {
  if (publishedVersionId == null) return null
  const { data, error } = await supabase
    .from('page_builder_versions')
    .select('*')
    .eq('id', publishedVersionId)
    .maybeSingle()
  if (error || !data) return null
  return formatRowResponseTimestamps(data)
}

export async function fetchOwnedPageRow(
  ctx: ApiContext,
  auth: AuthOk,
  pageId: number
): Promise<
  { row: Record<string, unknown> } | { error: string; status: number }
> {
  let q = ctx.supabase.from('page_builder_pages').select('*').eq('id', pageId)
  if (!auth.adminAll) q = q.eq('user_id', auth.userId)
  let { data, error } = await q.maybeSingle()
  if (
    error &&
    !auth.adminAll &&
    (isMissingColumnError(error) || isUserIdTypeMismatchError(error))
  ) {
    const retried = await ctx.supabase
      .from('page_builder_pages')
      .select('*')
      .eq('id', pageId)
      .maybeSingle()
    data = retried.data
    error = retried.error
  }
  if (error || !data)
    return { error: error?.message ?? 'Page not found.', status: 404 }
  return { row: data as Record<string, unknown> }
}

export async function createNextVersion(
  supabase: ApiContext['supabase'],
  pageId: number,
  userId: string,
  layout: Json
): Promise<
  { row: Record<string, unknown> } | { error: string; status: number }
> {
  const { data: maxRows } = await supabase
    .from('page_builder_versions')
    .select('version')
    .eq('page_id', pageId)
    .order('version', { ascending: false })
    .limit(1)
  const max = maxRows?.[0] as { version?: number } | undefined
  const nextVersion = Number(max?.version ?? 0) + 1
  const richInsert = {
    page_id: pageId,
    version: nextVersion,
    layout_json: layout,
    checksum: layoutChecksum(layout),
    is_published: false,
    created_by: userId,
  }
  let { data, error } = await supabase
    .from('page_builder_versions')
    .insert(richInsert)
    .select('*')
    .single()
  if (
    error &&
    (isMissingColumnError(error) || isUserIdTypeMismatchError(error))
  ) {
    const retried = await supabase
      .from('page_builder_versions')
      .insert({
        page_id: pageId,
        version: nextVersion,
        layout_json: layout,
      })
      .select('*')
      .single()
    data = retried.data
    error = retried.error
  }
  if (error || !data)
    return { error: error?.message ?? 'Failed to save version', status: 400 }
  return { row: data as Record<string, unknown> }
}

export function parsePageId(segments: string[]): number | null {
  const raw = segments[2]
  if (raw === undefined) return null
  const id = Number(raw)
  return Number.isFinite(id) ? id : null
}

/** Returns page id when path is `/page-builder/pages/:id/...` and spec matches. */
export function pagesMatch(
  ctx: ApiContext,
  spec: {
    method: string | readonly string[]
    len: number
    action?: string
    tail?: string
  }
): number | null {
  if (ctx.segments[1] !== 'pages') return null
  const pageId = parsePageId(ctx.segments)
  if (pageId === null || ctx.segments.length !== spec.len) return null
  if (spec.action !== undefined && ctx.segments[3] !== spec.action) return null
  if (spec.tail !== undefined && ctx.segments[5] !== spec.tail) return null
  return match(ctx, { method: spec.method }) ? pageId : null
}

export async function loadPublishedPageLayout(
  supabase: ApiContext['supabase'],
  pageRow: Record<string, unknown>
): Promise<{ layoutJson: unknown; versionNum: number } | null> {
  const pageId = pageRow.id
  const pvId = pageRow.published_version_id as number | null

  if (pvId != null) {
    const { data: ver } = await supabase
      .from('page_builder_versions')
      .select('*')
      .eq('id', pvId)
      .maybeSingle()
    if (ver) {
      const row = ver as Record<string, unknown>
      return {
        layoutJson: row.layout_json,
        versionNum: Number(row.version ?? 0),
      }
    }
  }

  const { data: fallback } = await supabase
    .from('page_builder_versions')
    .select('*')
    .eq('page_id', pageId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!fallback) return null
  const row = fallback as Record<string, unknown>
  return {
    layoutJson: row.layout_json,
    versionNum: Number(row.version ?? 0),
  }
}
