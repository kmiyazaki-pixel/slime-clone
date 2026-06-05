// =====================================================
//  ゲーム状態 - 実行中に変化する値はぜんぶここ
// =====================================================

export const state = {
  // 資源
  gold: 0,

  // ステータス
  attack: 1,
  shotInterval: 600,   // ms

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
  },
};
