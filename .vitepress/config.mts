import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "vitepress";
import { generateSidebar } from "vitepress-sidebar";

const root = join(import.meta.dirname, "..");
const domain = "tdocs.jp";

// TARGET=rust → rust.tdocs.jp のサイト。未指定/portal → tdocs.jp のポータル。
const target = process.env.TARGET === "portal" ? undefined : process.env.TARGET;

// 各submoduleディレクトリ = 1つの翻訳対象。
const targets = readdirSync(root, { withFileTypes: true })
  .filter(
    (e) =>
      e.isDirectory() && !e.name.startsWith(".") && e.name !== "node_modules",
  )
  .map((e) => e.name)
  .filter((name) =>
    readdirSync(join(root, name), { recursive: true }).some((p) =>
      String(p).endsWith("index.md"),
    ),
  );

// 翻訳対象ごとの原文サイト。
// home = AI翻訳の注意書きのリンク先、origin = 未翻訳ページへのリンク先。
const origins: Record<string, { home: string; origin: string }> = {
  rust: {
    home: "https://doc.rust-lang.org/stable/",
    origin: "https://doc.rust-lang.org",
  },
  go: { home: "https://go.dev/doc/", origin: "https://go.dev" },
  nodejs: { home: "https://nodejs.org/api/", origin: "https://nodejs.org" },
};

// href (原文サイト基準の絶対パス) に対応する翻訳済みページがあるか。
const translated = (href: string) => {
  const base = join(
    root,
    target ?? "",
    href
      .split(/[#?]/)[0]
      .replace(/\.html$/, "")
      .replace(/\/$/, ""),
  );
  return existsSync(`${base}.md`) || existsSync(join(base, "index.md"));
};

// ルートに index.md が無いサイト (rust) のトップをランディングへ飛ばす。
const landing = () => {
  const paths = readdirSync(join(root, target ?? ""), { recursive: true })
    .map((p) => String(p).replaceAll("\\", "/"))
    .filter((p) => p.endsWith("index.md"))
    .sort((a, b) => a.split("/").length - b.split("/").length);
  return `/${paths[0]?.replace(/index\.md$/, "") ?? ""}`;
};

export default defineConfig({
  title: target ? `tdocsjp ${target}` : "tdocsjp",
  description: target
    ? `${target} ドキュメントの非公式日本語訳`
    : "各種ドキュメントの非公式日本語訳",
  lang: "ja",
  srcDir: target ?? ".",
  outDir: join(".vitepress/dist", target ?? "portal"),
  lastUpdated: true,
  ignoreDeadLinks: true,
  // ポータルは index.md だけ。各サイトは submodule の README を除く。
  srcExclude: [
    "**/README.md",
    ...(target ? [] : targets.map((n) => `${n}/**`)),
  ],
  themeConfig: {
    // ナビは全サイト共通で各サブドメインへ。
    nav: targets.map((name) => ({
      text: name,
      link: `https://${name}.${domain}/`,
    })),
    sidebar: target
      ? generateSidebar({
          documentRootPath: target,
          useTitleFromFileHeading: true,
          useTitleFromFrontmatter: true,
          useFolderTitleFromIndexFile: true,
          collapsed: true,
          excludePattern: ["README.md"],
        })
      : [],
    search: { provider: "local" },
    socialLinks: [
      {
        icon: "github",
        link: `https://github.com/tdocsjp/${target ?? "website"}`,
      },
    ],
    footer: { message: "非公式翻訳。原文の著作権は各権利者に帰属します。" },
  },
  markdown: {
    // 翻訳文に `Vec<Span>` のような生の山括弧が混ざるため、生HTMLは無効化して
    // エスケープさせる (Vue のテンプレート解析エラーを防ぐ)。
    html: false,
    config(md) {
      // 未翻訳ページへの絶対リンクは原文サイトへ逃がす。
      const origin = target ? origins[target]?.origin : undefined;
      if (!origin) return;
      md.core.ruler.push("tdocsjp-untranslated-link", (state) => {
        for (const token of state.tokens) {
          for (const child of token.children ?? []) {
            if (child.type !== "link_open") continue;
            const href = child.attrGet("href");
            if (!href?.startsWith("/") || translated(href)) continue;
            child.attrSet("href", `${origin}${href}`);
          }
        }
      });
    },
  },
  buildEnd({ outDir }) {
    if (!target || existsSync(join(root, target, "index.md"))) return;
    // Cloudflare Pages の _redirects。
    writeFileSync(
      join(outDir, "_redirects"),
      `/ ${landing()} 302
`,
    );
  },
  transformPageData(pageData) {
    if (target) {
      pageData.frontmatter.source ??= origins[target]?.home;
      return;
    }
    // ポータルのカード。ドメインを1箇所で持つため frontmatter はここで組む。
    pageData.frontmatter.features = targets.map((name) => ({
      title: name,
      details: `${origins[name]?.origin ?? ""} の非公式日本語訳`,
      link: `https://${name}.${domain}/`,
    }));
  },
});
