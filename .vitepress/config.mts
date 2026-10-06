import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "vitepress";
import { generateSidebar } from "vitepress-sidebar";

const root = join(import.meta.dirname, "..");

// 各submoduleディレクトリ = 1つの翻訳対象。
// 最も浅い index.md をランディングにする (rust は rust/stable/index.md)。
const targets = readdirSync(root, { withFileTypes: true })
  .filter(
    (e) =>
      e.isDirectory() && !e.name.startsWith(".") && e.name !== "node_modules",
  )
  .map((e) => {
    const landing = readdirSync(join(root, e.name), { recursive: true })
      .map((p) => String(p).replaceAll("\\", "/"))
      .filter((p) => p === "index.md" || p.endsWith("/index.md"))
      .sort((a, b) => a.split("/").length - b.split("/").length)[0];
    return { name: e.name, landing };
  })
  .filter((t) => t.landing !== undefined);

const names = new Set(targets.map((t) => t.name));

// 原文URL。AI翻訳の注意書きからここへリンクする。
// ページ個別に frontmatter source: で上書き可。
const sourceBases: Record<string, string> = {
  rust: "https://doc.rust-lang.org/stable/",
  go: "https://go.dev/doc/",
  nodejs: "https://nodejs.org/api/",
};

// 原文サイトのルート。未翻訳ページへのリンクはここへ逃がす。
const origins: Record<string, string> = {
  rust: "https://doc.rust-lang.org",
  go: "https://go.dev",
  nodejs: "https://nodejs.org",
};

// href (原文サイト基準の絶対パス) に対応する翻訳済みページがあるか。
const translated = (dir: string, href: string) => {
  const base = join(
    root,
    dir,
    href
      .split(/[#?]/)[0]
      .replace(/\.html$/, "")
      .replace(/\/$/, ""),
  );
  return existsSync(`${base}.md`) || existsSync(join(base, "index.md"));
};

export default defineConfig({
  title: "tdocsjp",
  description: "各種ドキュメントの非公式日本語訳",
  lang: "ja",
  base: "/website/", // https://tdocsjp.github.io/website/ で公開
  lastUpdated: true,
  ignoreDeadLinks: true,
  srcExclude: ["**/README.md"],
  themeConfig: {
    nav: targets.map((t) => ({
      text: t.name,
      link: `/${t.name}/${t.landing?.replace(/index\.md$/, "")}`,
    })),
    sidebar:
      targets.length === 0
        ? []
        : generateSidebar(
            targets.map((t) => ({
              documentRootPath: "/",
              scanStartPath: t.name,
              resolvePath: `/${t.name}/`,
              useTitleFromFileHeading: true,
              useTitleFromFrontmatter: true,
              useFolderTitleFromIndexFile: true,
              collapsed: true,
              excludePattern: ["README.md"],
            })),
          ),
    search: { provider: "local" },
    socialLinks: [
      { icon: "github", link: "https://github.com/tdocsjp/website" },
    ],
    footer: { message: "非公式翻訳。原文の著作権は各権利者に帰属します。" },
  },
  markdown: {
    // 翻訳文に `Vec<Span>` のような生の山括弧が混ざるため、生HTMLは無効化して
    // エスケープさせる (Vue のテンプレート解析エラーを防ぐ)。
    html: false,
    config(md) {
      // 翻訳リポジトリ内のリンクは原文サイト基準の絶対パス (/doc/api/path)。
      // 翻訳済みならマウント先 (/nodejs/doc/api/path)、未翻訳なら原文サイトへ。
      md.core.ruler.push("tdocsjp-mount-prefix", (state) => {
        const dir = String(state.env?.relativePath ?? "").split("/")[0];
        if (!names.has(dir)) return;
        for (const token of state.tokens) {
          for (const child of token.children ?? []) {
            if (child.type !== "link_open") continue;
            const href = child.attrGet("href");
            if (!href?.startsWith("/")) continue;
            if (names.has(href.split("/")[1])) continue;
            child.attrSet(
              "href",
              translated(dir, href)
                ? `/${dir}${href}`
                : `${origins[dir] ?? ""}${href}`,
            );
          }
        }
      });
    },
  },
  transformPageData(pageData) {
    pageData.frontmatter.source ??=
      sourceBases[pageData.relativePath.split("/")[0]];
  },
});
