# CLAUDE.md

## プロジェクト概要

特定額の JPYC 支払いを求める QR コード（EIP-681準拠のURIを基にしている）をクライアントサイドで生成する静的サイト。
[jpyc-payment-qr](https://www.npmjs.com/package/jpyc-payment-qr) パッケージを使用。

## 技術スタック

- **SSG**: Eleventy 3.x（`"type": "module"` 必須、ESM 設定）
- **CSS**: Bulma 1.x（CDN 不使用、`node_modules` からコピー）
- **JS バンドラー**: esbuild（IIFE 形式、`platform: browser`）
- **Linter**: Biome 2.x（lint + import 整列のみ。フォーマットは無効）
- **Formatter**: Prettier 3.x
- **パッケージマネージャー**: pnpm

## ディレクトリ構成

```
src/
  _includes/
    base.njk          # HTML レイアウト
    qr-panel.njk      # QR 表示パネル（警告・EIP-681 URI 含む）
    payment-form.njk  # 入力フォーム（アドレス・金額・ネットワーク）
    sitefooter.njk    # フッター
  js/
    main.js           # エントリーポイント
    qr-panel.js       # QR パネル DOM 操作
    payment-form.js   # フォーム状態管理
  index.njk           # メインページ
eleventy.config.js    # Eleventy 設定
biome.json            # Biome 設定（対象: src/js/, eleventy.config.js）
.prettierrc           # Prettier 設定（tabs, double quotes）
_site/                # ビルド出力（.gitignore 済み）
```

## コマンド

```bash
pnpm run build      # 本番ビルド（minify あり）
pnpm run serve      # 開発サーバー（minify なし、sourcemap あり）
pnpm run lint       # Biome + Prettier チェック（CI 用）
pnpm run lint:fix   # Biome + Prettier 自動修正
```

## コード規約

- インデント: タブ
- クォート: ダブルクォート
- import: アルファベット順（Biome assist で自動整列）

## jpyc-payment-qr API の注意点

```js
// generatePaymentQR は warnings を返さない
const qr = await generatePaymentQR({ merchantAddress, amount, network });
// → { data: DataURL, format, uri }

// warnings は validateGenerateOptions から取得する
const validation = validateGenerateOptions({ merchantAddress, amount, network });
// → { valid, errors, warnings }

// テストネット用: JPYC コントラクトアドレスは本番と同じ
const jpycAddress = CHAIN_CONFIGS[mainnetNetwork].jpycAddress;
const uri = encodeEIP681(jpycAddress, merchantAddress, jpyToWei(amount), testnetChainId);
```

テストネット chainId: Polygon Amoy=80002, Ethereum Sepolia=11155111, Avalanche Fuji=43113

## 既知の問題・回避策

### PurgeCSS + Windows の file:// URL 問題
`eleventy-plugin-purgecss` に設定ファイルパスを渡すと、Windows 環境で PurgeCSS 8.x の ESM `import()` が失敗する。
`eleventy.config.js` ではファイルパスではなくオブジェクト形式で設定を直接渡すことで回避している。

```js
eleventyConfig.addPlugin(pluginPurgeCSS, {
  config: { content: [...], css: [...] }, // ← パスではなくオブジェクト
});
```

`purgecss.config.cjs` は参照用として残しているが、実際には読み込まれない。

### PurgeCSS と動的クラスの safelist
JS で動的に付与する Bulma クラスは静的 HTML に存在しないため、PurgeCSS に除去される。
`eleventy.config.js` の `safelist` に明示的に列挙して保護する。

```js
safelist: ["is-inline-block"],
```

### esbuild pnpm ビルドスクリプト警告
pnpm は esbuild の postinstall スクリプトを無視する警告が出るが、バイナリは正常に動作する。
