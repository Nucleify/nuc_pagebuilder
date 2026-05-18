import {
  apiError,
  apiMethodNotAllowed,
  apiNotHandled,
  dispatchRoutes,
  dispatchWith,
} from 'nuc_api'
import type { ApiContext, ApiHandlerResult } from 'nuc_server'

import { resolveAuth } from './pagebuilder_helpers'
import { pagebuilderPagesRoutes } from './pagebuilder_pages_routes'
import { pagebuilderPreferencesRoutes } from './pagebuilder_preferences_routes'
import { pagebuilderPublicRoutes } from './pagebuilder_public_routes'

export async function handlePagebuilderApi(
  ctx: ApiContext
): Promise<ApiHandlerResult> {
  if (ctx.segments[0] !== 'page-builder') return apiNotHandled()

  const publicResult = await dispatchRoutes(pagebuilderPublicRoutes, ctx)
  if (publicResult) return publicResult

  const prefsResult = await dispatchRoutes(pagebuilderPreferencesRoutes, ctx)
  if (prefsResult) return prefsResult

  if (ctx.segments[1] !== 'pages') return apiError(404, 'Not found')

  const auth = await resolveAuth(ctx)
  if ('handled' in auth) return auth

  const pagesResult = await dispatchWith(pagebuilderPagesRoutes, ctx, auth)
  return pagesResult ?? apiMethodNotAllowed()
}
