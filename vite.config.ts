import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { env } from 'node:process'

function bundleModuleReport(): Plugin {
  return {
    name: 'ace-jamb-bundle-module-report',
    apply: 'build',
    generateBundle(_options, output) {
      if (env.ANALYZE_BUNDLE !== '1') return

      console.log('\\n[Bundle module report] Top rendered modules per output chunk:')
      for (const item of Object.values(output)) {
        if (item.type !== 'chunk') continue
        const modules = Object.entries(item.modules)
          .map(([id, details]) => ({ id: id.replaceAll('\\\\', '/'), bytes: details.renderedLength }))
          .sort((a, b) => b.bytes - a.bytes)
        const total = modules.reduce((sum, module) => sum + module.bytes, 0)
        console.log(`\\n[chunk] ${item.fileName} | entry=${item.isEntry} | rendered module bytes=${total}`)
        for (const module of modules.slice(0, 20)) {
          console.log(`  ${String(module.bytes).padStart(8)}  ${module.id}`)
        }
      }
      console.log('[Bundle module report] End\\n')
    },
  }
}

export default defineConfig({
  plugins: [react(), bundleModuleReport()],
})
