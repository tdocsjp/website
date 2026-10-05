# tdocsjp/website

各種ドキュメントの非公式日本語訳サイト (VitePress)。
翻訳本体は対象ごとの別リポジトリで管理し、submodule として取り込む。

## 開発

```sh
npm ci
npm run pull   # submodule の取得・最新化
npm run dev
```

## 翻訳対象を追加する

1. `tdocsjp/<name>` リポジトリを作り、翻訳済み `.md` を置く（`index.md` 必須）
2. ここに submodule として追加する

```sh
git submodule add https://github.com/tdocsjp/<name>.git <name>
git commit -m "add <name>"
```

ナビとサイドバーはディレクトリ構成から自動生成されるので、設定変更は不要。

## 注意

原文のライセンス（MIT / CC-BY など）に従い、各翻訳リポジトリの README に
原文へのリンク・ライセンス表記・非公式である旨を記載する。
