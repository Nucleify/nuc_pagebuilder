import type { ApiRoute } from 'nuc_api'
import { when } from 'nuc_api'

import { handlePreferences } from './pagebuilder_handlers'

/** GET|PUT /page-builder/preferences */
export const routePreferences = when(
  { path: [undefined, 'preferences'] },
  handlePreferences
)

export const pagebuilderPreferencesRoutes: ApiRoute[] = [routePreferences]
