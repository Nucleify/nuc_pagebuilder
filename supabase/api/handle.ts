import { readBody } from 'h3'

import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type {
  ApiContext,
  ApiHandlerResult,
  Json,
} from '../../../../nuxt/server/api/_types'
import {
  formatRowResponseTimestamps,
  formatRowsResponseTimestamps,
} from '../../../../nuxt/server/api/format_timestamptz_response'
import {
  gatewayUserFromJwt,
  resolveGatewayListScope,
} from '../../../../nuxt/server/api/gateway_auth'

const PRERENDER_LOCALES = ['en', 'pl']

function slugify(raw: string): string {
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

async function generateUniqueSlug(
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

function defaultLayout(): Json {
  return {
    id: randomUUID(),
    type: 'page',
    settings: { maxWidth: '100%' },
    children: [],
  }
}

function layoutChecksum(layout: unknown): string {
  return createHash('sha256').update(JSON.stringify(layout)).digest('hex')
}

function isMissingColumnError(error: unknown): boolean {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : ''
  return (
    message.includes('column') &&
    (message.includes('does not exist') || message.includes('schema cache'))
  )
}

function isUserIdTypeMismatchError(error: unknown): boolean {
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

type AuthOk = { userId: string; adminAll: boolean }

async function resolveAuth(
  ctx: ApiContext
): Promise<AuthOk | { error: string; status: number }> {
  const userRes = await gatewayUserFromJwt(ctx.supabase, ctx.event)
  if ('error' in userRes) return userRes
  const scope = await resolveGatewayListScope(ctx.supabase, ctx.event)
  if ('error' in scope) return scope
  return { userId: userRes.user.id, adminAll: scope.mode === 'all' }
}

function fmtVer(row: unknown): unknown {
  return formatRowResponseTimestamps(row)
}

function fmtPage(row: unknown): unknown {
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

async function loadVersionsForPage(
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

async function loadPublishedVersion(
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

async function fetchOwnedPageRow(
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

async function createNextVersion(
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
    const fallbackInsert = {
      page_id: pageId,
      version: nextVersion,
      layout_json: layout,
    }
    const retried = await supabase
      .from('page_builder_versions')
      .insert(fallbackInsert)
      .select('*')
      .single()
    data = retried.data
    error = retried.error
  }
  if (error || !data)
    return { error: error?.message ?? 'Failed to save version', status: 400 }
  return { row: data as Record<string, unknown> }
}

export async function handlePagebuilderApi(
  ctx: ApiContext
): Promise<ApiHandlerResult> {
  const { segments, method, supabase, ok } = ctx
  if (segments[0] !== 'page-builder') return { handled: false }

  /** Public: render layout by slug (nested slug = `/render/a/b/c`). */
  if (segments[1] === 'render' && method === 'GET') {
    const slug = segments.slice(2).join('/')
    if (!slug)
      return { handled: true, status: 404, body: { error: 'Page not found.' } }

    const { data: page, error: pe } = await supabase
      .from('page_builder_pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (pe || !page)
      return { handled: true, status: 404, body: { error: 'Page not found.' } }

    const pageRow = page as Record<string, unknown>
    let layoutJson: unknown = null
    let versionNum = 0

    const pvId = pageRow.published_version_id as number | null
    if (pvId != null) {
      const { data: ver } = await supabase
        .from('page_builder_versions')
        .select('*')
        .eq('id', pvId)
        .maybeSingle()
      if (ver) {
        layoutJson = (ver as Record<string, unknown>).layout_json
        versionNum = Number((ver as Record<string, unknown>).version ?? 0)
      }
    }

    if (!layoutJson) {
      const { data: fallback } = await supabase
        .from('page_builder_versions')
        .select('*')
        .eq('page_id', pageRow.id)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (fallback) {
        layoutJson = (fallback as Record<string, unknown>).layout_json
        versionNum = Number((fallback as Record<string, unknown>).version ?? 0)
      }
    }

    if (!layoutJson)
      return {
        handled: true,
        status: 404,
        body: { error: 'Published version not found.' },
      }

    return {
      handled: true,
      body: {
        page: formatRowResponseTimestamps(pageRow),
        layout_json: layoutJson,
        version: versionNum,
      },
    }
  }

  /** Public: Nitro prerender route list. */
  if (segments[1] === 'prerender-routes' && method === 'GET') {
    const { data: pages, error } = await supabase
      .from('page_builder_pages')
      .select('slug')
      .eq('status', 'published')
    if (error)
      return { handled: true, status: 500, body: { error: error.message } }
    const routes = (pages ?? []).flatMap((p: { slug?: string }) =>
      PRERENDER_LOCALES.map((locale) => `/${locale}/${String(p.slug ?? '')}`)
    )
    return { handled: true, body: { routes } }
  }

  /** Authenticated: user preferences. */
  if (segments[1] === 'preferences') {
    const auth = await resolveAuth(ctx)
    if ('error' in auth)
      return {
        handled: true,
        status: auth.status,
        body: { error: auth.error },
      }

    if (method === 'GET') {
      const { data: existing } = await supabase
        .from('page_builder_user_preferences')
        .select('preferences')
        .eq('user_id', auth.userId)
        .maybeSingle()
      const prefs =
        (existing?.preferences as Record<string, unknown> | null) ?? null
      if (!prefs) {
        await supabase.from('page_builder_user_preferences').insert({
          user_id: auth.userId,
          preferences: { autosave: true },
        })
        return { handled: true, body: { autosave: true } }
      }
      return { handled: true, body: prefs }
    }

    if (method === 'PUT') {
      const raw = (await readBody(ctx.event)) as Json | null
      const body = { ...(raw ?? {}) } as Record<string, unknown>
      const preferences =
        (body.preferences as Record<string, unknown> | undefined) ?? {}
      const { data, error } = await supabase
        .from('page_builder_user_preferences')
        .upsert(
          {
            user_id: auth.userId,
            preferences,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select('preferences')
        .single()
      if (error)
        return { handled: true, status: 400, body: { error: error.message } }
      return {
        handled: true,
        body: (data?.preferences as Record<string, unknown>) ?? preferences,
      }
    }

    return { handled: true, status: 405, body: { error: 'Method not allowed' } }
  }

  if (segments[1] !== 'pages')
    return { handled: true, status: 404, body: { error: 'Not found' } }

  const auth = await resolveAuth(ctx)
  if ('error' in auth)
    return {
      handled: true,
      status: auth.status,
      body: { error: auth.error },
    }

  /** GET /page-builder/pages */
  if (segments.length === 2 && method === 'GET') {
    let q = supabase
      .from('page_builder_pages')
      .select('*')
      .order('id', { ascending: false })
    if (!auth.adminAll) q = q.eq('user_id', auth.userId)
    let { data, error } = await q
    if (
      error &&
      !auth.adminAll &&
      (isMissingColumnError(error) || isUserIdTypeMismatchError(error))
    ) {
      const retried = await supabase
        .from('page_builder_pages')
        .select('*')
        .order('id', { ascending: false })
      data = retried.data
      error = retried.error
    }
    if (error)
      return { handled: true, status: 500, body: { error: error.message } }
    const rows = formatRowsResponseTimestamps(data ?? [])
    const enriched = await Promise.all(
      rows.map(async (row) => {
        const r = row as Record<string, unknown>
        const pv = await loadPublishedVersion(
          supabase,
          r.published_version_id as number | null
        )
        return pv ? { ...r, published_version: pv } : r
      })
    )
    return { handled: true, body: ok(enriched) }
  }

  /** POST /page-builder/pages */
  if (segments.length === 2 && method === 'POST') {
    const raw = (await readBody(ctx.event)) as Json | null
    const body = { ...(raw ?? {}) } as Record<string, unknown>
    const title =
      typeof body.title === 'string' && body.title.trim()
        ? body.title.trim()
        : 'Untitled'
    const slugSource =
      typeof body.slug === 'string' && body.slug.trim()
        ? body.slug.trim()
        : title
    const slug = await generateUniqueSlug(supabase, slugSource)
    const meta_json =
      body.meta_json !== undefined ? (body.meta_json as Json) : null

    const richInsert = {
      user_id: auth.userId,
      title,
      slug,
      status: 'draft',
      meta_json,
    }
    let { data: page, error: insertErr } = await supabase
      .from('page_builder_pages')
      .insert(richInsert)
      .select('*')
      .single()

    if (
      insertErr &&
      (isMissingColumnError(insertErr) || isUserIdTypeMismatchError(insertErr))
    ) {
      const fallbackInsert = { title, slug }
      const retried = await supabase
        .from('page_builder_pages')
        .insert(fallbackInsert)
        .select('*')
        .single()
      page = retried.data
      insertErr = retried.error
    }

    if (insertErr || !page)
      return {
        handled: true,
        status: 400,
        body: { error: insertErr?.message ?? 'Failed to create page' },
      }

    const pageRow = page as Record<string, unknown>
    const layout = defaultLayout()
    const versionRes = await createNextVersion(
      supabase,
      Number(pageRow.id),
      auth.userId,
      layout
    )
    if ('error' in versionRes)
      return {
        handled: true,
        status: versionRes.status,
        body: { error: versionRes.error },
      }

    const versions = [formatRowResponseTimestamps(versionRes.row)]
    const basePage = formatRowResponseTimestamps(pageRow) as Record<
      string,
      unknown
    >
    const payload = fmtPage({
      ...basePage,
      published_version: null,
      versions,
    })

    return {
      handled: true,
      status: 201,
      body: {
        page: payload,
        message: 'Page created successfully.',
      },
    }
  }

  const pageIdSeg = segments[2]
  const pageId = pageIdSeg !== undefined ? Number(pageIdSeg) : NaN
  if (!Number.isFinite(pageId))
    return { handled: true, status: 404, body: { error: 'Not found' } }

  /** GET /page-builder/pages/:id */
  if (segments.length === 3 && method === 'GET') {
    const owned = await fetchOwnedPageRow(ctx, auth, pageId)
    if ('error' in owned)
      return {
        handled: true,
        status: owned.status,
        body: { error: owned.error },
      }
    const versions = await loadVersionsForPage(supabase, pageId)
    const pv = await loadPublishedVersion(
      supabase,
      owned.row.published_version_id as number | null
    )
    const payload = fmtPage({
      ...owned.row,
      versions,
      published_version: pv,
    })
    return { handled: true, body: ok(payload) }
  }

  /** PUT /page-builder/pages/:id */
  if (segments.length === 3 && method === 'PUT') {
    const owned = await fetchOwnedPageRow(ctx, auth, pageId)
    if ('error' in owned)
      return {
        handled: true,
        status: owned.status,
        body: { error: owned.error },
      }

    const raw = (await readBody(ctx.event)) as Json | null
    const body = { ...(raw ?? {}) } as Record<string, unknown>
    const title = typeof body.title === 'string' ? body.title : owned.row.title
    let nextSlug = String(owned.row.slug ?? '')
    if (typeof body.slug === 'string' && body.slug.trim()) {
      const candidate = body.slug.trim()
      nextSlug =
        candidate === owned.row.slug
          ? String(owned.row.slug)
          : await generateUniqueSlug(supabase, candidate, pageId)
    }
    const status =
      typeof body.status === 'string' ? body.status : owned.row.status
    const meta_json =
      body.meta_json !== undefined ? body.meta_json : owned.row.meta_json

    const { data: updated, error } = await supabase
      .from('page_builder_pages')
      .update({
        title,
        slug: nextSlug,
        status,
        meta_json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pageId)
      .select('*')
      .single()

    if (error || !updated)
      return { handled: true, status: 400, body: { error: error?.message } }

    const pv = await loadPublishedVersion(
      supabase,
      (updated as Record<string, unknown>).published_version_id as number | null
    )
    return {
      handled: true,
      body: {
        page: fmtPage({
          ...(updated as Record<string, unknown>),
          published_version: pv,
        }),
        message: 'Page updated successfully.',
      },
    }
  }

  /** DELETE /page-builder/pages/:id */
  if (segments.length === 3 && method === 'DELETE') {
    const owned = await fetchOwnedPageRow(ctx, auth, pageId)
    if ('error' in owned)
      return {
        handled: true,
        status: owned.status,
        body: { error: owned.error },
      }

    const title = String((owned.row.title as string) ?? '')
    const { error } = await supabase
      .from('page_builder_pages')
      .delete()
      .eq('id', pageId)
    if (error)
      return { handled: true, status: 500, body: { error: error.message } }

    return {
      handled: true,
      body: {
        deleted: true,
        message: `Successfully deleted page: ${title}`,
      },
    }
  }

  /** POST /page-builder/pages/:id/draft */
  if (segments.length === 4 && segments[3] === 'draft' && method === 'POST') {
    const owned = await fetchOwnedPageRow(ctx, auth, pageId)
    if ('error' in owned)
      return {
        handled: true,
        status: owned.status,
        body: { error: owned.error },
      }

    const raw = (await readBody(ctx.event)) as Json | null
    const layout_json = raw?.layout_json ?? raw
    if (layout_json == null || typeof layout_json !== 'object')
      return {
        handled: true,
        status: 422,
        body: { error: 'layout_json is required' },
      }

    const versionRes = await createNextVersion(
      supabase,
      pageId,
      auth.userId,
      layout_json as Json
    )
    if ('error' in versionRes)
      return {
        handled: true,
        status: versionRes.status,
        body: { error: versionRes.error },
      }

    await supabase
      .from('page_builder_pages')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', pageId)

    return {
      handled: true,
      body: {
        version: fmtVer(versionRes.row),
        message: 'Draft saved successfully.',
      },
    }
  }

  /** POST /page-builder/pages/:id/publish */
  if (segments.length === 4 && segments[3] === 'publish' && method === 'POST') {
    const owned = await fetchOwnedPageRow(ctx, auth, pageId)
    if ('error' in owned)
      return {
        handled: true,
        status: owned.status,
        body: { error: owned.error },
      }

    const raw = (await readBody(ctx.event).catch(() => null)) as Json | null
    const versionIdBody =
      raw && typeof raw === 'object' && 'version_id' in raw
        ? (raw as Record<string, unknown>).version_id
        : undefined

    let targetVersionRow: Record<string, unknown> | null = null

    if (
      versionIdBody !== undefined &&
      versionIdBody !== null &&
      Number.isFinite(Number(versionIdBody))
    ) {
      const vid = Number(versionIdBody)
      const { data: row } = await supabase
        .from('page_builder_versions')
        .select('*')
        .eq('page_id', pageId)
        .eq('id', vid)
        .maybeSingle()
      targetVersionRow = row as Record<string, unknown> | null
    } else {
      const { data: row } = await supabase
        .from('page_builder_versions')
        .select('*')
        .eq('page_id', pageId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
      targetVersionRow = row as Record<string, unknown> | null
    }

    if (!targetVersionRow)
      return {
        handled: true,
        status: 404,
        body: { error: 'Version not found' },
      }

    const vid = Number(targetVersionRow.id)

    await supabase
      .from('page_builder_versions')
      .update({ is_published: false })
      .eq('page_id', pageId)

    await supabase
      .from('page_builder_versions')
      .update({ is_published: true, updated_at: new Date().toISOString() })
      .eq('id', vid)

    const { data: pageUpdated, error: puErr } = await supabase
      .from('page_builder_pages')
      .update({
        status: 'published',
        published_version_id: vid,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pageId)
      .select('*')
      .single()

    if (puErr || !pageUpdated)
      return {
        handled: true,
        status: 400,
        body: { error: puErr?.message ?? 'Publish failed' },
      }

    const pv = await loadPublishedVersion(supabase, vid)
    return {
      handled: true,
      body: {
        page: fmtPage({
          ...(pageUpdated as Record<string, unknown>),
          published_version: pv,
        }),
        message: 'Page published successfully.',
      },
    }
  }

  /** GET /page-builder/pages/:id/versions */
  if (segments.length === 4 && segments[3] === 'versions' && method === 'GET') {
    const owned = await fetchOwnedPageRow(ctx, auth, pageId)
    if ('error' in owned)
      return {
        handled: true,
        status: owned.status,
        body: { error: owned.error },
      }
    const versions = await loadVersionsForPage(supabase, pageId)
    return { handled: true, body: ok(versions) }
  }

  /** POST /page-builder/pages/:id/versions/:versionNum/restore */
  if (
    segments.length === 6 &&
    segments[3] === 'versions' &&
    segments[5] === 'restore' &&
    method === 'POST'
  ) {
    const owned = await fetchOwnedPageRow(ctx, auth, pageId)
    if ('error' in owned)
      return {
        handled: true,
        status: owned.status,
        body: { error: owned.error },
      }

    const versionNum = Number(segments[4])
    if (!Number.isFinite(versionNum))
      return { handled: true, status: 400, body: { error: 'Invalid version' } }

    const { data: source } = await supabase
      .from('page_builder_versions')
      .select('*')
      .eq('page_id', pageId)
      .eq('version', versionNum)
      .maybeSingle()

    if (!source)
      return {
        handled: true,
        status: 404,
        body: { error: 'Version not found' },
      }

    const layout = (source as Record<string, unknown>).layout_json as Json
    const versionRes = await createNextVersion(
      supabase,
      pageId,
      auth.userId,
      layout
    )
    if ('error' in versionRes)
      return {
        handled: true,
        status: versionRes.status,
        body: { error: versionRes.error },
      }

    await supabase
      .from('page_builder_pages')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', pageId)

    return {
      handled: true,
      body: {
        version: fmtVer(versionRes.row),
        message: 'Version restored into a new draft.',
      },
    }
  }

  return { handled: true, status: 405, body: { error: 'Method not allowed' } }
}
