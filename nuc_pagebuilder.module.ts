import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineNuxtModule } from '@nuxt/kit'

function csvToList(value?: string): string[] {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function slugRoutes(slugs: string[], locales: string[]): string[] {
  return slugs.flatMap((slug) => locales.map((locale) => `/${locale}/${slug}`))
}

async function fileRoutes(filePath?: string): Promise<string[]> {
  if (!filePath) {
    return []
  }

  try {
    const content = await readFile(resolve(filePath), 'utf-8')
    const parsed = JSON.parse(content)

    if (Array.isArray(parsed)) {
      return parsed.map(String)
    }

    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.routes)) {
      return parsed.routes.map(String)
    }
  } catch {
    return []
  }

  return []
}

async function fetchRoutes(baseUrl?: string): Promise<string[]> {
  if (!baseUrl) {
    return []
  }

  try {
    const response = await fetch(`${baseUrl}/api/page-builder/prerender-routes`)
    const parsed = await response.json()

    if (parsed && Array.isArray(parsed.routes)) {
      return parsed.routes.map(String)
    }
  } catch {
    return []
  }

  return []
}

export default defineNuxtModule({
  meta: {
    name: 'nuc-pagebuilder',
    configKey: 'nucPagebuilder',
  },
  setup(_options, nuxt) {
    nuxt.hook('nitro:config', async (nitroConfig) => {
      const locales = csvToList(process.env.PAGE_BUILDER_PRERENDER_LOCALES)
        .length
        ? csvToList(process.env.PAGE_BUILDER_PRERENDER_LOCALES)
        : ['en', 'pl']
      const envSlugs = csvToList(process.env.PAGE_BUILDER_PRERENDER_SLUGS)
      const fromSlugs = slugRoutes(envSlugs, locales)
      const fromFile = await fileRoutes(
        process.env.PAGE_BUILDER_PRERENDER_ROUTES_FILE
      )
      const fromApi =
        process.env.PAGE_BUILDER_PRERENDER_FETCH === 'true'
          ? await fetchRoutes(process.env.API_URL || process.env.APP_URL)
          : []

      const existing = nitroConfig.prerender?.routes ?? []
      const merged = [...existing, ...fromSlugs, ...fromFile, ...fromApi]
      const uniqueRoutes = Array.from(new Set(merged))

      nitroConfig.prerender = nitroConfig.prerender || {}
      nitroConfig.prerender.routes = uniqueRoutes
    })
  },
})
