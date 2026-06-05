# CLAUDE.md

このファイルは Claude (Claude Code 含む) に向けたプロジェクト引き継ぎ書です。
新しいセッションを始めるときは、まずこのファイルを読んでください。

---

## プロジェクト概要

スマホゲーム「スライム伝説」を参考にした、横スクロール放置オートバトルを
自作する **個人プログラミング練習プロジェクト**。

- HTML / CSS / JS / PHP のみ、ES Modules
- ビルドツールなし (素のブラウザで `<script type="module">` で動く)
- GitHub → Vercel で自動デプロイ
- 個人練習のため、既存ゲームの素材・コードは一切コピーしない

## ユーザー情報

- 日本語でやりとり
- JS/HTML は理解している
- React/Next.js などのフレームワークは未経験
- このプロジェクトを通じて「素のJSでモジュール分割する感覚」を習得中
- スマホでの確認も多いので、レスポンシブ・タップ操作対応は維持

## 重要な制約 (絶対に守る)

1. **グラフィックは CSS で描いた図形のみ** — `<div>` + gradient + border-radius
   + box-shadow で表現する。画像ファイル (.png/.jpg/.svg) は使わない。
2. **既存ゲームの素材・コード・固有名詞をコピーしない** — トッケビ、CQ表記、
   特定のスライム名などは使わない。仕組みだけを参考に、独自の見た目で実装する。
3. **ビルドツールを導入しない** — Vite/Webpack/Next.js などは使わず、
   素のブラウザで動く構成を維持。これは学習目的のため。
4. **ファイル分割の方針を維持** — 1ファイル1責務。状態は `state.js`、
   定数は `config.js`、DOM参照は `dom.js` に集約。

## 現在のステータス

- [x] **Phase 1**: コアループ (自動射撃、敵スポーン、ゴールド、攻撃強化)
- [x] **Phase 2-A**: ステージ進行、難易度スケーリング、AUTO切替
- [x] **Phase 2-B**: ボス戦 (Stage 10 で出現、30秒制限、再挑戦ボタン)
- [x] **Phase 3**: マルチショット/クリ率/クリ倍率/ゴールドUP/貫通弾 の5強化追加
- [x] **UI 刷新**: スライム伝説風レイアウト (上部バー/戦場オーバーレイ/円形アクション/下部ナビ)
- [x] **背景演出**: 2層スクロール + 4ワールドのテーマ切替 + 敵の通り抜け阻止
- [ ] **Phase 4**: 召喚、ペット、放置報酬、セーブ機能
  - [x] セーブ機能 (localStorage、強化購入/進行/ボス決着/タブ非表示/10秒ごと)
  - [ ] 放置報酬
  - [ ] ペット
  - [ ] 召喚

## ファイル構成

```
.
├── index.html          HTML骨格
├── styles/
│   ├── base.css        リセット、CSS変数、全体レイアウト
│   ├── battle.css      戦場・スライム・敵・弾・エフェクト
│   └── ui.css          状態バー・強化パネル・ステージ表示・AUTO
└── src/
    ├── main.js         エントリ。初期化＋ゲームループ
    ├── config.js       チューニング用定数
    ├── state.js        ゲーム状態
    ├── dom.js          DOM参照を集約
    ├── utils.js        formatNum, upgradeCost
    ├── stage.js        ステージ進行と難易度スケーリング
    ├── enemy.js        敵の生成・移動・死亡
    ├── projectile.js   弾の生成・移動・衝突判定
    ├── effects.js      ダメージ数字、ゴールド粒子
    ├── save.js         localStorage への保存・復元 (Phase 4)
    └── ui.js           UI描画
```

## 設計上のお約束

- **`config.js` vs `state.js`**: 実行中に変わらない値は `config`、変わる値は `state`
- **循環依存の回避**: `effects.js` は `ui.js` を直接 import せず、`main.js` から
  `bindUI()` でコールバックを渡してもらう (`bindUI` パターン)。
- **ゲームループ**: `requestAnimationFrame` + `dt`(delta time) でフレームレート非依存
- **数値表記**: 大きい数値は `1.23K` / `1.23M` 形式で表示 (`utils.formatNum`)
- **強化コスト**: 指数成長 (`baseCost * costMul^(level-1)`)

## 既に出来上がっているもの (参考)

### Phase 2-B ボス戦
- 各ワールドの Stage 10 でボス出現 (HP×8, 報酬×30, 30秒制限)
- 撃破 → 次ワールド Stage 1 / タイムアップ → 雑魚スポーン再開＆再挑戦ボタン
- 関連 config: `CONFIG.BOSS`、state: `inBossFight`/`bossTimer`/`boss`/`bossDefeated`
- 主な関数: `startBossFight`/`endBossFight`/`retryBoss` (stage.js)、`spawnBoss` (enemy.js)

### Phase 3 強化項目
追加された5項目: マルチショット (Lv4ごとに+1発, 扇形)、クリ率 (+2%/Lv)、
クリ倍率 (+0.2x/Lv, 初期2.0x)、ゴールドUP (+5%/Lv)、貫通弾 (Lv5ごとに+1)。
- 関連 config: `CONFIG.MULTI_SHOT`/`CRIT`/`GOLD_BOOST`/`PIERCE`
- 関連 state: `shotCount`/`critChance`/`critMultiplier`/`goldMultiplier`/`pierceCount`
- 発射の公開API: `fireAt(target)` (projectile.js)

## 次にやること: Phase 4 (召喚 / ペット / 放置報酬 / セーブ)

### ざっくり仕様 (要相談)

- **召喚**: ゴールドを払って一時的に味方ユニットを呼ぶ。スライムの後ろに並んで自動で前方に攻撃。一定時間で消える or 永続化。
- **ペット**: 召喚と違って常駐。種類ごとに別の効果 (攻撃補助 / ゴールドUP / クリ補助 など)。スロット数制限あり。
- **放置報酬**: 一定時間後にゲームを開いたら、放置中に倒せた敵分のゴールドを `e^k*t` 風にまとめて受け取れる。
- **セーブ機能**: `localStorage` に state のスナップショットを保存して、リロードでも続きから。

### 実装方針メモ

- セーブ対象は `state` 全体ではなく、永続化したいフィールドだけ (gold, world, stage, upgrades の level、Phase 3 系の派生値、ペット/召喚の進捗)。
- セーブのトリガは「強化購入時」「ステージ進行時」「ボス勝敗時」「タブ非表示時」あたり。
- 召喚/ペットはまず1種類だけ実装して仕組みを通す → あとから種類追加。
- 放置報酬は「最後にセーブした時間」と「現在時刻」の差から計算 (実時間ベース)。

## ローカル開発

ES Modules は file:// では動かないので、簡易サーバーを立てる:

```bash
# Python があれば
python3 -m http.server 8000

# Node があれば
npx serve
```

ブラウザで http://localhost:8000

## デプロイ

GitHub に push すれば Vercel が自動で再デプロイ。設定不要。

---

## 開発時のお願い (Claude へ)

- 大きい変更を入れる前に、なぜそうするのかを一言説明してください
- 「Phase X-Y 進めて」と言われたら、上記の実装プランに沿って進めてください
- ファイル分割の境界を勝手に変えないでください (議論してから変更)
- バランス調整 (HP倍率、コスト倍率など) は `config.js` の数値だけで完結させてください
- レスポンスは日本語で、簡潔に
