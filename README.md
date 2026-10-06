# tdocsjp/website

各種ドキュメントの非公式日本語訳サイト (VitePress)。
翻訳本体は対象ごとの別リポジトリで管理し、submodule として取り込む。

## 開発

```sh
bun install
bun run pull   # submodule の取得・最新化

TARGET=rust bun run dev            # sh
$env:TARGET='rust'; bun run dev    # PowerShell
TARGET=portal bun run dev          # ポータル (tdocs.jp)
```

`bun run lint` / `bun run typecheck` も同様。

## サイト構成

1ターゲット = 1サイト = 1サブドメイン。`TARGET` で切り替える。

| TARGET | ドメイン | 出力 |
| --- | --- | --- |
| `portal` | tdocs.jp | `.vitepress/dist/portal` |
| `rust` | rust.tdocs.jp | `.vitepress/dist/rust` |
| `go` | go.tdocs.jp | `.vitepress/dist/go` |
| `nodejs` | nodejs.tdocs.jp | `.vitepress/dist/nodejs` |

各サイトの `base` は `/` なので、翻訳リポジトリ内の絶対リンク (`/doc/api/path`)
はそのまま使える。未翻訳ページへのリンクだけ原文サイトへ書き換える。

## デプロイ

`main` への push と毎日 18:00 UTC に GitHub Actions
(`.github/workflows/deploy.yml`) が4サイトを並列ビルドして Cloudflare Pages に公開する。
翻訳リポジトリ側を更新した場合は、そのリポジトリに push すれば翌日のビルドで反映される
(即時反映したいときは Actions の Deploy を手動実行)。

### 一度だけ必要な設定

```sh
# Pages プロジェクトを作る
for t in portal rust go nodejs; do
  bunx wrangler@4 pages project create tdocsjp-$t --production-branch main
done
```

- Cloudflare ダッシュボードで各プロジェクトにカスタムドメインを割り当てる
  (`tdocsjp-portal` → `tdocs.jp`、`tdocsjp-rust` → `rust.tdocs.jp` …)
- GitHub の repository secrets に `CLOUDFLARE_API_TOKEN`（Pages 編集権限）と
  `CLOUDFLARE_ACCOUNT_ID` を登録する

## 翻訳対象を追加する

1. `tdocsjp/<name>` リポジトリを作り、翻訳済み `.md` を置く（`index.md` があればそこがランディングページ）
2. ここに submodule として追加する

```sh
git submodule add https://github.com/tdocsjp/<name>.git <name>
git commit -m "add <name>"
```

サイドバーはディレクトリ構成から自動生成される。追加で必要なのは:

1. `.vitepress/config.mts` の `origins` に原文サイトのURLを1行
2. `.github/workflows/deploy.yml` の matrix に `<name>` を追加
3. `tdocsjp-<name>` プロジェクトを作り `<name>.tdocs.jp` を割り当てる

## 注意

原文のライセンス（MIT / CC-BY など）に従い、各翻訳リポジトリの README に
原文へのリンク・ライセンス表記・非公式である旨を記載する。
