# プロンプト生成ツール & 名刺データ化アプリ

このアプリケーションには2つの主要機能があります：

1. **プロンプト生成ツール** - 様々な業務用途のプロンプトテンプレート
2. **名刺データ化ツール** - GPT-4o-miniを使用した名刺画像の自動データ抽出

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`を`.env`にコピーして、OpenAI APIキーを設定：

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```
OPENAI_API_KEY=sk-your-openai-api-key-here
PORT=3000
```

### 3. サーバー起動

```bash
npm start
```

サーバーが起動したら以下のURLにアクセス：

- プロンプト生成: http://localhost:3000/
- 名刺データ化: http://localhost:3000/business-card.html

**重要**: このアプリはサーバー経由でのみ動作します。HTMLファイルを直接ブラウザで開くとAPIキーにアクセスできないため、名刺データ化機能が使用できません。

## 動作方式

- **プロンプト生成**: サーバー不要、静的ファイルとして動作
- **名刺データ化**: サーバー必須、APIキー管理のため

## 機能

### プロンプト生成ツール

- 6つのテンプレート（メール作成、SNS投稿、ブログ投稿、コードレビュー、文書分析、プレゼンテーション作成）
- チェックボックスによる複数タスク選択
- 構造化されたプロンプト生成
- クリップボードへのコピー機能

### 名刺データ化ツール

- ドラッグ&ドロップ画像アップロード
- GPT-4o-miniによる自動データ抽出
- 構造化データ、JSON、CSV形式での表示
- SQLiteデータベースへの保存
- データのダウンロード機能

## セキュリティ

- APIキーは.envファイルで管理（Gitにコミットされません）
- データベースファイルもGitから除外
- サーバーサイドでのAPIキー管理

## 技術スタック

- フロントエンド: HTML, CSS, JavaScript
- バックエンド: Node.js, Express
- データベース: SQLite (sql.js)
- AI: OpenAI GPT-4o-mini

## ファイル構成

```
├── index.html              # プロンプト生成ツール
├── business-card.html      # 名刺データ化ツール
├── styles.css              # 共通スタイル
├── business-card.css       # 名刺ツール用スタイル
├── script.js               # プロンプト生成ロジック
├── business-card.js        # 名刺処理ロジック
├── server.js               # Express サーバー
├── package.json            # Node.js 依存関係
├── .env.example            # 環境変数テンプレート
├── .gitignore              # Git除外設定
└── README.md               # このファイル
```