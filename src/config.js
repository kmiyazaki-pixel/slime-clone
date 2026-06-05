// =====================================================
//  数値定数 - バランス調整はここをいじる
// =====================================================

export const CONFIG = {
  // 敵
  ENEMY: {
    BASE_HP: 5,           // ステージ 1-1 の HP
    HP_GROWTH: 1.20,      // ステージごとの HP 倍率
    SPEED_MIN: 25,        // px/sec
    SPEED_RANGE: 12,      // ランダム加算分
    REWARD: 2,            // ステージ 1-1 のゴールド報酬
    REWARD_GROWTH: 1.18,  // ステージごとの報酬倍率
  },

  // 弾
  PROJECTILE: {
    SPEED: 700,         // px/sec
    LIFE: 2.0,          // 秒
  },

  // スポーン間隔 (ms)
  SPAWN_INTERVAL: 1300,

  // 地平線の位置 (戦場の高さに対する比率)
  GROUND_RATIO: 0.60,

  // プレイヤー(スライム)の x 座標
  PLAYER_X: 90,

  // 当たり判定の半径
  HIT_RADIUS: 22,
};
