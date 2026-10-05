import { readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'

const root = join(import.meta.dirname, '..')

// 各submoduleディレクトリ = 1つの翻訳対象。index.md があるものだけ対象。
const targets = readdirSync(root, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
  .map((e) => e.name)
  .filter((name) => existsSync(join(root, name, 'index.md')))

export default defineConfig({
  title: 'tdocsjp',
  description: '各種ドキュメントの非公式日本語訳',
  lang: 'ja',
  base: '/', // tdocsjp.github.io/website で公開するなら '/website/'
  lastUpdated: true,
  ignoreDeadLinks: true,
  themeConfig: {
    nav: targets.map((name) => ({ text: name, link: `/${name}/` })),
    sidebar: targets.length === 0 ? [] : generateSidebar(
      targets.map((name) => ({
        documentRootPath: '/',
        scanStartPath: name,
        resolvePath: `/${name}/`,
        useTitleFromFileHeading: true,
        useTitleFromFrontmatter: true,
        useFolderTitleFromIndexFile: true,
        collapsed: true,
      })),
    ),
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/tdocsjp/website' }],
    footer: { message: '非公式翻訳。原文の著作権は各権利者に帰属します。' },
  },
})
