import {
  handleCreatePage,
  handleDeletePage,
  handleGetPage,
  handleListPages,
  handleListVersions,
  handlePublishPage,
  handleRestoreVersion,
  handleSaveDraft,
  handleUpdatePage,
} from './pagebuilder_handlers'
import { type PagebuilderAuthRoute, whenPb } from './pagebuilder_helpers'

/** GET /page-builder/pages */
export const routeListPages = whenPb(
  { method: 'GET', len: 2, path: ['page-builder', 'pages'] },
  handleListPages
)

/** POST /page-builder/pages */
export const routeCreatePage = whenPb(
  { method: 'POST', len: 2, path: ['page-builder', 'pages'] },
  handleCreatePage
)

/** GET /page-builder/pages/:id */
export const routeGetPage = whenPb({ method: 'GET', len: 3 }, handleGetPage)

/** PUT /page-builder/pages/:id */
export const routeUpdatePage = whenPb(
  { method: 'PUT', len: 3 },
  handleUpdatePage
)

/** DELETE /page-builder/pages/:id */
export const routeDeletePage = whenPb(
  { method: 'DELETE', len: 3 },
  handleDeletePage
)

/** POST /page-builder/pages/:id/draft */
export const routeSaveDraft = whenPb(
  { method: 'POST', len: 4 },
  handleSaveDraft
)

/** POST /page-builder/pages/:id/publish */
export const routePublishPage = whenPb(
  { method: 'POST', len: 4 },
  handlePublishPage
)

/** GET /page-builder/pages/:id/versions */
export const routeListVersions = whenPb(
  { method: 'GET', len: 4 },
  handleListVersions
)

/** POST /page-builder/pages/:id/versions/:version/restore */
export const routeRestoreVersion = whenPb(
  { method: 'POST', len: 6 },
  handleRestoreVersion
)

export const pagebuilderPagesRoutes: PagebuilderAuthRoute[] = [
  routeListPages,
  routeCreatePage,
  routeGetPage,
  routeUpdatePage,
  routeDeletePage,
  routeSaveDraft,
  routePublishPage,
  routeListVersions,
  routeRestoreVersion,
]
