# tdocsjp/website

各種ドキュメントの非公式日本語訳サイト (VitePress)。
翻訳本体は対象ごとの別リポジトリで管理し、submodule として取り込む。

## 開発

```sh
bun install
bun run pull   # submodule の取得・最新化
bun run dev
```

`bun run lint` / `bun run typecheck` / `bun run build` も同様。

## デプロイ

`main` への push と毎日 18:00 UTC に GitHub Actions
(`.github/workflows/deploy.yml`) がビルドして GitHub Pages
(https://tdocsjp.github.io/website/) に公開する。
翻訳リポジトリ側を更新した場合は、そのリポジトリに push すれば翌日のビルドで反映される
(即時反映したいときは Actions の Deploy を手動実行)。

## 翻訳対象を追加する

1. `tdocsjp/<name>` リポジトリを作り、翻訳済み `.md` を置く（`index.md` があればそこがランディングページ）
2. ここに submodule として追加する

```sh
git submodule add https://github.com/tdocsjp/<name>.git <name>
git commit -m "add <name>"
```

ナビとサイドバーはディレクトリ構成から自動生成される。
原文サイトのURL（AI翻訳の注意書きと未翻訳ページへのリンク先）だけ
`.vitepress/config.mts` の `sourceBases` / `origins` に1行追加する。

## 注意

原文のライセンス（MIT / CC-BY など）に従い、各翻訳リポジトリの README に
原文へのリンク・ライセンス表記・非公式である旨を記載する。
