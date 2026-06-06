// =====================================================
//  ゲーム状態 - 実行中に変化する値はぜんぶここ
// =====================================================

export const state = {
  // 資源
  gold: 0,
  gems: 0,             // ジェム (将来用、いまは表示のみ)

  // プレイヤー (見た目用)
  playerLv: 1,

  // 放置時間 (秒、ゲーム起動からの経過)
  idleSeconds: 0,

  // ステータス
  attack: 1,
  shotInterval: 600,   // ms

  // Phase 3 → ダブルショットに仕様変更
  shotCount: 1,        // legacy: 旧マルチショットの同時発射数。新仕様では未使用 (初期値で固定)
  doubleShotChance: 0.01, // Lv 1 で 1% (level/100、Lv 100 で 100% MAX)
  critChance: 0,       // 0-1
  critMultiplier: 2.0, // クリ時のダメージ倍率
  goldMultiplier: 1.0, // ゴールド報酬の倍率
  pierceCount: 0,      // 弾が貫通できる追加敵数 (0=単発)

  // Phase 4 ペット: 所有マップと、所有から計算されるバフ
  pets: {},            // { petId: { owned: bool } }
  petAtkMul: 1,        // attack に掛ける乗算 (recompute で 1 にリセット)
  petGoldMul: 1,       // goldMultiplier に掛ける乗算
  petCritAdd: 0,       // critChance に加算
  petPierceAdd: 0,     // pierceCount に加算
  petFireRateMul: 1,   // shotInterval に掛ける乗算 (小さいほど高速)
  petShotAdd: 0,       // legacy: 旧 shotCount 加算。新仕様では未使用
  petDoubleShotAdd: 0, // doubleShotChance に加算 (ダブルペット所有時 +0.25)

  // スライム: 所有マップ + 装備中の id + 装備スライムからのバフ
  // (みどりスライムだけ最初から所有 + 装備済み)
  slimes: { green: { owned: true } },
  activeSlimeId: 'green',
  slimeAtkMul: 1,      // attack 乗算
  slimeFireRateMul: 1, // shotInterval 乗算
  slimeGoldMul: 1,     // goldMultiplier 乗算
  slimeCritAdd: 0,     // critChance 加算

  // ステージ進行
  world: 1,
  stage: 1,
  killsInStage: 0,
  killsRequired: 5,
  autoProgress: true,  // AUTO ON/OFF

  // ボス戦
  inBossFight: false,
  bossTimer: 0,        // 残り秒数
  boss: null,          // 現在のボスインスタンス
  bossDefeated: false, // 現ワールドのボスを倒したか (再挑戦ボタン制御)

  // スライムの行動モード (敵集団 → 走る → 次の集団)
  slimeMode: 'fighting',           // 'fighting' | 'traveling'
  travelTimer: 0,                  // 残り travel 秒
  enemiesSpawnedThisStage: 0,      // 今ステージで既に spawn した雑魚数 (上限: killsRequired)

  // タイミング
  lastShot: 0,
  lastSpawn: 0,

  // エンティティ
  enemies: [],
  projectiles: [],

  // プレイヤー位置 (main.js の setPlayerY で実行時に設定)
  player: { x: 0, y: 0 },

  // ID 採番用
  _enemyId: 0,
  _projId: 0,

  // 強化項目の定義
  //   level    : 現在のレベル
  //   baseCost : Lv1 のコスト
  //   costMul  : レベルが上がるたびに何倍になるか
  //   apply(s) : 状態 s を変化させる関数
  upgrades: {
    attack: {
      name: '攻撃力',
      icon: '⚔️',
      level: 1,
      baseCost: 10,
      costMul: 1.15,
      apply: (s) => { s.attack += 1; },
    },
    fireRate: {
      name: '攻撃速度',
      icon: '⚡',
      level: 1,
      baseCost: 25,
      costMul: 1.20,
      apply: (s) => {
        s.shotInterval = Math.max(120, s.shotInterval * 0.94);
      },
    },
    multiShot: {
      name: 'ダブルショット',
      icon: '🎯',
      level: 1,
      baseCost: 150,
      costMul: 1.10,            // Lv 100 が無理ゲーにならない伸び (was 1.45)
      apply: (s) => {
        // Lv N で N% の確率で 2発目を撃つ。Lv 100 で 100% MAX
        s.doubleShotChance = Math.min(1, s.upgrades.multiShot.level / 100);
      },
    },
    critRate: {
      name: 'クリ率',
      icon: '🎲',
      level: 1,
      baseCost: 80,
      costMul: 1.22,
      apply: (s) => {
        s.critChance = Math.min(1.0, s.critChance + 0.02);
      },
    },
    critDmg: {
      name: 'クリ倍率',
      icon: '💥',
      level: 1,
      baseCost: 120,
      costMul: 1.25,
      apply: (s) => {
        s.critMultiplier += 0.2;
      },
    },
    goldBoost: {
      name: 'ゴールドUP',
      icon: '💰',
      level: 1,
      baseCost: 60,
      costMul: 1.18,
      apply: (s) => {
        s.goldMultiplier += 0.05;
      },
    },
    pierce: {
      name: '貫通弾',
      icon: '🏹',
      level: 1,
      baseCost: 200,
      costMul: 1.5,
      apply: (s) => {
        // Lv 5 ごとに +1貫通 (Lv5=1, Lv10=2...)
        if (s.upgrades.pierce.level % 5 === 0) s.pierceCount++;
      },
    },
  },
};
