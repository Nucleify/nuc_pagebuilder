import type { ApiContext, ApiHandlerResult, Json } from 'nuc_api'
import {
  apiBody,
  apiError,
  apiHandled,
  apiMethodNotAllowed,
  apiOk,
  fromSupabaseError,
  nowIso,
  readJsonBody,
  trimStr,
} from 'nuc_api'
import {
  formatRowResponseTimestamps,
  formatRowsResponseTimestamps,
} from 'nuc_server'

import {
  type AuthOk,
  createNextVersion,
  defaultLayout,
  fetchOwnedPageRow,
  fmtPage,
  fmtVer,
  generateUniqueSlug,
  isMissingColumnError,
  isUserIdTypeMismatchError,
  loadPublishedPageLayout,
  loadPublishedVersion,
  loadVersionsForPage,
  type PagebuilderAuthRoute,
  PRERENDER_LOCALES,
  pagesMatch,
  pbFail,
  resolveAuth,
} from './pagebuilder_helpers'

export async function handleRenderPage(
  ctx: ApiContext
): Promise<ApiHandlerResult | null> {
  const slug = ctx.segments.slice(2).join('/')
  if (!slug) return apiError(404, 'Page not found.')

  const { data: page, error } = await ctx.supabase
    .from('page_builder_pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (error || !page) return apiError(404, 'Page not found.')

  const layout = await loadPublishedPageLayout(
    ctx.supabase,
    page as Record<string, unknown>
  )
  if (!layout) return apiHandled(404, { error: 'Published version not found.' })

  return {
    handled: true,
    body: {
      page: formatRowResponseTimestamps(page),
      layout_json: layout.layoutJson,
      version: layout.versionNum,
    },
  }
}

export async function handlePrerenderRoutes(
  ctx: ApiContext
): Promise<ApiHandlerResult | null> {
  const { data: pages, error } = await ctx.supabase
    .from('page_builder_pages')
    .select('slug')
    .eq('status', 'published')
  if (error) return fromSupabaseError(error)

  const routes = (pages ?? []).flatMap((p: { slug?: string }) =>
    PRERENDER_LOCALES.map((locale) => `/${locale}/${String(p.slug ?? '')}`)
  )
  return apiBody({ routes })
}

export async function handlePreferences(
  ctx: ApiContext
): Promise<ApiHandlerResult | null> {
  const auth = await resolveAuth(ctx)
  if ('handled' in auth) return auth
  if (ctx.method === 'GET') {
    const { data: existing } = await ctx.supabase
      .from('page_builder_user_preferences')
      .select('preferences')
      .eq('user_id', auth.userId)
      .maybeSingle()
    const prefs =
      (existing?.preferences as Record<string, unknown> | null) ?? null
    if (!prefs) {
      await ctx.supabase.from('page_builder_user_preferences').insert({
        user_id: auth.userId,
        preferences: { autosave: true },
      })
      return apiBody({ autosave: true })
    }
    return apiBody(prefs)
  }
  if (ctx.method === 'PUT') {
    const body = await readJsonBody(ctx)
    const preferences =
      (body.preferences as Record<string, unknown> | undefined) ?? {}
    const { data, error } = await ctx.supabase
      .from('page_builder_user_preferences')
      .upsert(
        { user_id: auth.userId, preferences, updated_at: nowIso() },
        { onConflict: 'user_id' }
      )
      .select('preferences')
      .single()
    if (error) return fromSupabaseError(error, 400)
    return {
      handled: true,
      body: (data?.preferences as Record<string, unknown>) ?? preferences,
    }
  }
  return apiMethodNotAllowed()
}

async function owned(
  ctx: Parameters<PagebuilderAuthRoute>[0],
  auth: AuthOk,
  pageId: number
) {
  const r = await fetchOwnedPageRow(ctx, auth, pageId)
  return 'error' in r ? apiError(r.status, r.error) : r
}

async function withVersions(
  ctx: Parameters<PagebuilderAuthRoute>[0],
  row: Record<string, unknown>,
  pageId: number
) {
  const versions = await loadVersionsForPage(ctx.supabase, pageId)
  const pv = await loadPublishedVersion(
    ctx.supabase,
    row.published_version_id as number | null
  )
  return fmtPage({ ...row, versions, published_version: pv })
}

async function insertPage(
  ctx: Parameters<PagebuilderAuthRoute>[0],
  auth: AuthOk,
  body: Json
) {
  const title = trimStr(body.title, 'Untitled')
  const slug = await generateUniqueSlug(ctx.supabase, trimStr(body.slug, title))
  const meta_json =
    body.meta_json !== undefined ? (body.meta_json as Json) : null
  let { data: page, error } = await ctx.supabase
    .from('page_builder_pages')
    .insert({ user_id: auth.userId, title, slug, status: 'draft', meta_json })
    .select('*')
    .single()
  if (
    error &&
    (isMissingColumnError(error) || isUserIdTypeMismatchError(error))
  ) {
    const retried = await ctx.supabase
      .from('page_builder_pages')
      .insert({ title, slug })
      .select('*')
      .single()
    page = retried.data
    error = retried.error
  }
  return { page, error }
}

export const handleListPages: PagebuilderAuthRoute = async (ctx, auth) => {
  let q = ctx.supabase
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
    const retried = await ctx.supabase
      .from('page_builder_pages')
      .select('*')
      .order('id', { ascending: false })
    data = retried.data
    error = retried.error
  }
  if (error) return fromSupabaseError(error)
  const rows = formatRowsResponseTimestamps(data ?? [])
  return apiOk(
    ctx,
    await Promise.all(
      rows.map(async (row) => {
        const r = row as Record<string, unknown>
        const pv = await loadPublishedVersion(
          ctx.supabase,
          r.published_version_id as number | null
        )
        return pv ? { ...r, published_version: pv } : r
      })
    )
  )
}

export const handleCreatePage: PagebuilderAuthRoute = async (ctx, auth) => {
  const { page, error } = await insertPage(ctx, auth, await readJsonBody(ctx))
  if (error || !page)
    return pbFail(400, error?.message ?? 'Failed to create page')
  const pageRow = page as Record<string, unknown>
  const versionRes = await createNextVersion(
    ctx.supabase,
    Number(pageRow.id),
    auth.userId,
    defaultLayout()
  )
  if ('error' in versionRes) return pbFail(versionRes.status, versionRes.error)
  return {
    handled: true,
    status: 201,
    body: {
      page: fmtPage({
        ...(formatRowResponseTimestamps(pageRow) as Record<string, unknown>),
        published_version: null,
        versions: [formatRowResponseTimestamps(versionRes.row)],
      }),
      message: 'Page created successfully.',
    },
  }
}

export const handleGetPage: PagebuilderAuthRoute = async (ctx, auth) => {
  const pageId = pagesMatch(ctx, { method: 'GET', len: 3 })
  if (pageId === null) return null
  const o = await owned(ctx, auth, pageId)
  if ('handled' in o) return o
  return apiOk(ctx, await withVersions(ctx, o.row, pageId))
}

export const handleUpdatePage: PagebuilderAuthRoute = async (ctx, auth) => {
  const pageId = pagesMatch(ctx, { method: 'PUT', len: 3 })
  if (pageId === null) return null
  const o = await owned(ctx, auth, pageId)
  if ('handled' in o) return o
  const body = await readJsonBody(ctx)
  let nextSlug = String(o.row.slug ?? '')
  if (typeof body.slug === 'string' && body.slug.trim()) {
    const candidate = body.slug.trim()
    nextSlug =
      candidate === o.row.slug
        ? String(o.row.slug)
        : await generateUniqueSlug(ctx.supabase, candidate, pageId)
  }
  const { data: updated, error } = await ctx.supabase
    .from('page_builder_pages')
    .update({
      title: typeof body.title === 'string' ? body.title : o.row.title,
      slug: nextSlug,
      status: typeof body.status === 'string' ? body.status : o.row.status,
      meta_json:
        body.meta_json !== undefined ? body.meta_json : o.row.meta_json,
      updated_at: nowIso(),
    })
    .eq('id', pageId)
    .select('*')
    .single()
  if (error) return fromSupabaseError(error, 400)
  if (!updated) return apiError(400, 'Update failed')
  const row = updated as Record<string, unknown>
  const pv = await loadPublishedVersion(
    ctx.supabase,
    row.published_version_id as number | null
  )
  return {
    handled: true,
    body: {
      page: fmtPage({ ...row, published_version: pv }),
      message: 'Page updated successfully.',
    },
  }
}

export const handleDeletePage: PagebuilderAuthRoute = async (ctx, auth) => {
  const pageId = pagesMatch(ctx, { method: 'DELETE', len: 3 })
  if (pageId === null) return null
  const o = await owned(ctx, auth, pageId)
  if ('handled' in o) return o
  const { error } = await ctx.supabase
    .from('page_builder_pages')
    .delete()
    .eq('id', pageId)
  if (error) return fromSupabaseError(error)
  return {
    handled: true,
    body: {
      deleted: true,
      message: `Successfully deleted page: ${String(o.row.title ?? '')}`,
    },
  }
}

export const handleSaveDraft: PagebuilderAuthRoute = async (ctx, auth) => {
  const pageId = pagesMatch(ctx, { method: 'POST', len: 4, action: 'draft' })
  if (pageId === null) return null
  const o = await owned(ctx, auth, pageId)
  if ('handled' in o) return o
  const raw = await readJsonBody(ctx)
  const layout = raw.layout_json ?? raw
  if (layout == null || typeof layout !== 'object')
    return pbFail(422, 'layout_json is required')
  const versionRes = await createNextVersion(
    ctx.supabase,
    pageId,
    auth.userId,
    layout as Json
  )
  if ('error' in versionRes) return pbFail(versionRes.status, versionRes.error)
  await ctx.supabase
    .from('page_builder_pages')
    .update({ updated_at: nowIso() })
    .eq('id', pageId)
  return {
    handled: true,
    body: {
      version: fmtVer(versionRes.row),
      message: 'Draft saved successfully.',
    },
  }
}

export const handlePublishPage: PagebuilderAuthRoute = async (ctx, auth) => {
  const pageId = pagesMatch(ctx, { method: 'POST', len: 4, action: 'publish' })
  if (pageId === null) return null
  const o = await owned(ctx, auth, pageId)
  if ('handled' in o) return o
  let raw: Json = {}
  try {
    raw = await readJsonBody(ctx)
  } catch {
    /* optional */
  }
  const vidRaw =
    raw && typeof raw === 'object' && 'version_id' in raw
      ? (raw as Record<string, unknown>).version_id
      : undefined
  let ver: Record<string, unknown> | null = null
  if (vidRaw != null && Number.isFinite(Number(vidRaw))) {
    const { data } = await ctx.supabase
      .from('page_builder_versions')
      .select('*')
      .eq('page_id', pageId)
      .eq('id', Number(vidRaw))
      .maybeSingle()
    ver = data as Record<string, unknown> | null
  } else {
    const { data } = await ctx.supabase
      .from('page_builder_versions')
      .select('*')
      .eq('page_id', pageId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
    ver = data as Record<string, unknown> | null
  }
  if (!ver) return pbFail(404, 'Version not found')
  const vid = Number(ver.id)
  await ctx.supabase
    .from('page_builder_versions')
    .update({ is_published: false })
    .eq('page_id', pageId)
  await ctx.supabase
    .from('page_builder_versions')
    .update({ is_published: true, updated_at: nowIso() })
    .eq('id', vid)
  const { data: pageUpdated, error: puErr } = await ctx.supabase
    .from('page_builder_pages')
    .update({
      status: 'published',
      published_version_id: vid,
      updated_at: nowIso(),
    })
    .eq('id', pageId)
    .select('*')
    .single()
  if (puErr || !pageUpdated)
    return pbFail(400, puErr?.message ?? 'Publish failed')
  const pv = await loadPublishedVersion(ctx.supabase, vid)
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

export const handleListVersions: PagebuilderAuthRoute = async (ctx, auth) => {
  const pageId = pagesMatch(ctx, { method: 'GET', len: 4, action: 'versions' })
  if (pageId === null) return null
  const o = await owned(ctx, auth, pageId)
  if ('handled' in o) return o
  return apiOk(ctx, await loadVersionsForPage(ctx.supabase, pageId))
}

export const handleRestoreVersion: PagebuilderAuthRoute = async (ctx, auth) => {
  const pageId = pagesMatch(ctx, {
    method: 'POST',
    len: 6,
    action: 'versions',
    tail: 'restore',
  })
  if (pageId === null) return null
  const versionNum = Number(ctx.segments[4])
  if (!Number.isFinite(versionNum)) return apiError(400, 'Invalid version')
  const o = await owned(ctx, auth, pageId)
  if ('handled' in o) return o
  const { data: source } = await ctx.supabase
    .from('page_builder_versions')
    .select('*')
    .eq('page_id', pageId)
    .eq('version', versionNum)
    .maybeSingle()
  if (!source) return pbFail(404, 'Version not found')
  const versionRes = await createNextVersion(
    ctx.supabase,
    pageId,
    auth.userId,
    (source as Record<string, unknown>).layout_json as Json
  )
  if ('error' in versionRes) return pbFail(versionRes.status, versionRes.error)
  await ctx.supabase
    .from('page_builder_pages')
    .update({ updated_at: nowIso() })
    .eq('id', pageId)
  return {
    handled: true,
    body: {
      version: fmtVer(versionRes.row),
      message: 'Version restored into a new draft.',
    },
  }
}
