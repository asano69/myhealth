
```
src/
├── App.jsx                    ← 編集済み(quoteのルートをQuoteRoutesに委譲)
└── quote/
    ├── QuoteRoutes.jsx        ← 新規。/quote と /quote/new のRoute定義
    ├── QuoteListPage.jsx      ← 一覧ページ(取得処理 + QuoteTable表示)
    ├── QuoteInputPage.jsx     ← 入力ページ(保存処理 + QuoteForm表示)
    ├── QuoteForm.jsx          ← 入力フォーム本体(状態管理 + 送信)
    ├── QuoteTable.jsx         ← 一覧テーブル本体(表示専用)
    └── QuotePage.css          ← 既存のまま流用
```

データの流れ

- /quoteにアクセスするとQuoteListPageがPocketBaseから一覧を取得しQuoteTableに渡して表示、
- /quote/newに行くとQuoteInputPageがQuoteFormから受け取ったデータをPocketBaseに保存して/quoteへ遷移する
- App.jsxは今後quote機能に変更があっても触る必要がなく、<QuoteRoutes />の1行を読み込むだけになっています。:w

