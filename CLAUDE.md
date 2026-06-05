# CLAUDE.md

このファイルは Claude (Claude Code 含む) に向けたプロジェクト引き継ぎ書です。
新しいセッションを始めるときは、まずこのファイルを読んでください。

---

## プロジェクト概要

スマホゲーム「スライム伝説」を参考にした、横スクロール放置オートバトルを
自作する **個人プログラミング練習プロジェクト**。

- HTML / CSS / JS のみ、ES Modules
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
- [ ] **Phase 2-B**: ボス戦 ← **次はここから**
- [ ] **Phase 3**: ダブル/トリプルショット、複数強化項目
- [ ] **Phase 4**: 召喚、ペット、放置報酬、セーブ機能

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
    └── ui.js           UI描画
```

## 設計上のお約束

- **`config.js` vs `state.js`**: 実行中に変わらない値は `config`、変わる値は `state`
- **循環依存の回避**: `effects.js` は `ui.js` を直接 import せず、`main.js` から
  `bindUI()` でコールバックを渡してもらう (`bindUI` パターン)。
- **ゲームループ**: `requestAnimationFrame` + `dt`(delta time) でフレームレート非依存
- **数値表記**: 大きい数値は `1.23K` / `1.23M` 形式で表示 (`utils.formatNum`)
- **強化コスト**: 指数成長 (`baseCost * costMul^(level-1)`)

## 次にやること: Phase 2-B (ボス戦)

### 仕様

- 各ワールドの **Stage 10** に到達するとボスが出現
- ボスは普通の敵より大きく、HP は通常の `N` 倍、報酬も `N` 倍
- ボス戦には **制限時間** (例: 30秒)
- 倒したら → 次のワールドの Stage 1 へ進む
- 時間切れ → ボス消滅、雑魚スポーン再開、画面に「ボス再挑戦」ボタンを表示
- 再挑戦ボタンを押すといつでもボス戦をやり直せる (現スライム伝説の挙動と同じ)

### 実装プラン

1. **`config.js`** に追加:
   ```js
   BOSS: {
     HP_MULTIPLIER: 8,        // 通常敵の何倍のHP
     REWARD_MULTIPLIER: 30,   // 通常敵の何倍の報酬
     TIMER_SECONDS: 30,
     SIZE: 80,                // px (通常敵は 36px)
   }
   ```

2. **`state.js`** に追加:
   ```js
   inBossFight: false,
   bossTimer: 0,             // 残り秒数
   boss: null,               // 現在のボスインスタンス
   bossDefeated: false,      // 一度倒したワールドか (再挑戦ボタンの表示制御に使用)
   ```

3. **`stage.js`** の `advanceStage()` を改修:
   - Stage 9 から進む時 (=Stage 10 に入る時) に `startBossFight()` を呼ぶ
   - 普通の Stage 10 完了の処理は不要にする (ボスが進行制御するため)

4. **`stage.js`** に新規関数:
   - `startBossFight()`: 雑魚スポーンを止め、ボスをスポーン、タイマー開始
   - `endBossFight(victory)`:
     - victory=true → 次ワールドへ、雑魚スポーン再開
     - victory=false → ボス消滅、雑魚スポーン再開、再挑戦ボタン表示
   - `retryBoss()`: 再挑戦ボタンから呼ばれる

5. **`enemy.js`** に新規:
   - `spawnBoss()`: 大きい見た目の敵を生成、`isBoss: true` フラグ付き
   - `killEnemy()`: ボスだった場合は `endBossFight(true)` を呼ぶ

6. **`main.js`** ゲームループ:
   - `state.inBossFight` の間、`bossTimer -= dt`
   - `bossTimer <= 0` で `endBossFight(false)`
   - 雑魚スポーンは `!state.inBossFight` の時だけ実行

7. **`ui.js`** に追加:
   - `updateBossTimer()`: タイマーバー/数字を更新
   - `showRetryButton()` / `hideRetryButton()`

8. **`index.html`** に追加:
   - ボスタイマー表示 (戦場の上部にバーとして重ねる)
   - ボス再挑戦ボタン (画面右の浮きボタン)

9. **CSS**:
   - `.enemy.boss` (大きい、紫系の色で差別化)
   - `.boss-timer` (戦場上部にオーバーレイ)
   - `.boss-retry-btn` (浮きボタン)

### UX注意点

- ボス出現時は何らかの演出 (`.boss-warning` フラッシュとか) があると良い
- タイマー残り5秒で赤く点滅させる
- 倒した瞬間にゴールド粒子を盛大に飛ばす (報酬量も多いので)

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
