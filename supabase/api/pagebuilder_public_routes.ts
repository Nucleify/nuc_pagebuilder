import type { ApiRoute } from 'nuc_api'
import { when } from 'nuc_api'

import { handlePrerenderRoutes, handleRenderPage } from './pagebuilder_handlers'

/** GET /page-builder/render/:slug… */
export const routeRenderPage = when(
  { method: 'GET', path: [undefined, 'render'] },
  handleRenderPage
)

/** GET /page-builder/prerender-routes */
export const routePrerenderRoutes = when(
  { method: 'GET', path: [undefined, 'prerender-routes'] },
  handlePrerenderRoutes
)

export const pagebuilderPublicRoutes: ApiRoute[] = [
  routeRenderPage,
  routePrerenderRoutes,
]
