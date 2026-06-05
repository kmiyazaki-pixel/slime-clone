# スライム自作

スマホゲーム風の放置オートバトルを自作する個人練習プロジェクト。

## ローカルで動かす

ES Modules を使っているので `file://` 直接開きでは動きません。
簡易サーバーを立てるか、Vercel にデプロイして確認します。

```bash
# 方法1: Python があれば
python3 -m http.server 8000

# 方法2: Node があれば
npx serve

# 方法3: VS Code の Live Server 拡張機能
```

ブラウザで `http://localhost:8000` を開く。

## ファイル構成

```
.
├── index.html          HTML骨格。CSS/JS を読み込むだけ
├── styles/
│   ├── base.css        リセット、CSS変数、全体レイアウト
│   ├── battle.css      戦場・スライム・敵・弾・エフェクトの見た目
│   └── ui.css          状態バー・強化パネルの見た目
└── src/
    ├── main.js         エントリポイント。初期化＋ゲームループ
    ├── config.js       チューニング用の定数 (HP、コスト倍率など)
    ├── state.js        ゲーム状態と強化項目の定義
    ├── dom.js          DOM参照を集約
    ├── utils.js        formatNum, upgradeCost
    ├── stage.js        ステージ進行と難易度スケーリング
    ├── enemy.js        敵の生成・移動・死亡
    ├── projectile.js   弾の生成・移動・衝突判定
    ├── effects.js      ダメージ数字、ゴールド粒子
    └── ui.js           UI描画 (ゴールド表示、強化パネル、ステージ、AUTO)
```

## どこを触ればいい？

| やりたいこと | 触るファイル |
|---|---|
| バランス調整 (HP、コスト、速度、成長率) | `src/config.js` |
| 新しい強化項目を追加 | `src/state.js` の `upgrades` |
| ステージ進行ロジックの変更 | `src/stage.js` |
| 敵の種類を増やす | `src/enemy.js` |
| 弾の挙動を変える (貫通、爆発など) | `src/projectile.js` |
| 新しいエフェクトを追加 | `src/effects.js` + `styles/battle.css` |
| メニュー画面を追加 | `index.html` + `styles/ui.css` + 新しい `src/xxx.js` |

## 依存関係 (import の流れ)

```
main.js ──┬─→ state.js
          ├─→ config.js
          ├─→ dom.js
          ├─→ stage.js ─→ ui.js ─→ utils.js
          ├─→ enemy.js ─┬─→ stage.js
          │             └─→ effects.js
          ├─→ projectile.js ─┬─→ enemy.js
          │                  └─→ effects.js
          └─→ ui.js
```

`effects.js` だけ `ui.js` の `updateGoldDisplay` を直接 import せず、
`main.js` から `bindUI()` で渡してもらう形にしている (循環依存回避)。

## デプロイ

GitHub に push → Vercel が自動で再デプロイ。設定不要。

## Phase ロードマップ

- [x] **Phase 1**: コアループ (自動射撃、敵スポーン、ゴールド、攻撃強化)
- [x] **Phase 2-A**: ステージ進行、難易度スケーリング、AUTO切替
- [ ] **Phase 2-B**: ボス戦、制限時間、リトライ
- [ ] **Phase 3**: ダブル/トリプルショット、複数強化項目
- [ ] **Phase 4**: 召喚、ペット、放置報酬、セーブ
