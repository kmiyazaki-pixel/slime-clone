// =====================================================
//  数値定数 - バランス調整はここをいじる
// =====================================================

export const CONFIG = {
  // 敵
  ENEMY: {
    BASE_HP: 2,           // ステージ 1-1 の HP (was 5)
    HP_GROWTH: 1.15,      // ステージごとの HP 倍率 (was 1.20、もっと緩やかに)
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

  // ボス
  BOSS: {
    HP_MULTIPLIER: 18,       // 通常敵の何倍のHP (was 8、雑魚弱体化の補正)
    REWARD_MULTIPLIER: 30,   // 通常敵の何倍の報酬
    TIMER_SECONDS: 30,
    SIZE: 80,                // px (通常敵は 36px)
    SPEED: 18,               // px/sec (雑魚より遅め)
    STOP_RATIO: 0.55,        // 戦場幅に対する停止位置
    HIT_RADIUS: 44,          // ボス用の大きめ当たり判定
  },

  // ダブルショット (旧マルチショット)
  // 1発撃った直後に確率で 2発目を撃つ仕様
  DOUBLE_SHOT: {
    DELAY_MS: 120,           // 1発目と2発目の間隔
    PET_BONUS: 0.25,         // pet 'multi' (ダブル) 所有時の追加確率
  },

  // トリプルショット
  // ダブルの上位互換: 当たれば 1発目の後、間隔をあけて 2発目と 3発目
  // fireAt 内で「トリプル → ダブル」の順に判定する (優先カスケード)
  TRIPLE_SHOT: {
    PET_BONUS: 0,            // 専用ペットは未実装 (将来追加用に枠だけ)
  },

  // クリティカル
  CRIT: {
    RATE_PER_LV: 0.02,       // Lv上昇ごとの確率増分
    MAX_RATE: 1.0,
    BASE_MULTIPLIER: 2.0,    // クリ倍率 Lv1 の初期値
    MULTIPLIER_PER_LV: 0.2,  // Lv上昇ごとの倍率増分
  },

  // ゴールドブースト
  GOLD_BOOST: {
    PER_LV: 0.05,            // Lv上昇ごとに +5%
  },

  // 貫通
  PIERCE: {
    LV_STEP: 5,              // この Lv ごとに +1 貫通
  },

  // 放置報酬
  IDLE_REWARD: {
    MIN_SECONDS: 60,             // この秒数より短ければポップアップ出さない
    CAP_SECONDS: 8 * 60 * 60,    // 上限 8時間
    EFFICIENCY: 0.5,             // オフライン中は通常プレイの 50% の効率で稼ぐ
  },

  // スライムの移動 (敵集団に向かって走るモード)
  TRAVEL_DURATION: 1.5,          // ステージ間で travel モードに入っている秒数

  // スキル (アクティブ発動。所有=アクションバーに常駐、タップで使用)
  // チャージショット (一発系) / メテオ (範囲攻撃) / クリタイム (バフ系) /
  // ゴールドラッシュ (リソース系) の 4 種
  SKILLS: {
    chargeShot: {
      name: 'チャージショット',
      icon: '💥',
      desc: '攻撃×10 の大弾を 1発',
      cost: 3000,
      cooldown: 10,         // 秒
      damageMul: 10,
    },
    meteor: {
      name: 'メテオ',
      icon: '☄',
      desc: '画面の全敵に最大HP 50% ダメ',
      cost: 10000,
      cooldown: 30,
      hpRatioDmg: 0.5,
    },
    critTime: {
      name: 'クリタイム',
      icon: '⭐',
      desc: '5秒間 クリ倍率 ×2',
      cost: 20000,
      cooldown: 25,
      duration: 5,
      critMulFactor: 2,           // 持続中、state.critMultiplier に掛ける倍率
    },
    goldRush: {
      name: 'ゴールドラッシュ',
      icon: '💰',
      desc: '10秒間 ゴールド×3',
      cost: 40000,
      cooldown: 45,
      duration: 10,
      goldMul: 3,
    },
  },

  // スライムの種類 (装備中の1体だけバフが効く)
  // colors は battle.css の .slime[data-type=id] と対応
  SLIMES: {
    green: {
      name: 'みどりスライム',
      desc: '基本のスライム',
      cost: 0,                   // 初期所有
      apply: () => {},
    },
    red: {
      name: 'あかスライム',
      desc: '攻撃力 +20%',
      cost: 500,
      apply: (s) => { s.slimeAtkMul *= 1.2; },
    },
    blue: {
      name: 'あおスライム',
      desc: '攻撃速度 +15%',
      cost: 2000,
      apply: (s) => { s.slimeFireRateMul *= 0.87; },
    },
    gold: {
      name: 'きんスライム',
      desc: 'ゴールド +30%',
      cost: 5000,
      apply: (s) => { s.slimeGoldMul *= 1.3; },
    },
    purple: {
      name: 'むらさきスライム',
      desc: 'クリ確率 +10%',
      cost: 10000,
      apply: (s) => { s.slimeCritAdd += 0.1; },
    },
  },

  // ペット (常駐型バフ)
  // apply(s) で状態 s の petXxx フィールドを修正する。pet.js の recomputePetBuffs()
  // で初期値にリセットされてから所有してるペットの apply が順に呼ばれる。
  PETS: {
    attacker: {
      name: 'アタッカー',
      icon: '🐯',
      cost: 5000,
      desc: '攻撃力 +50%',
      apply: (s) => { s.petAtkMul *= 1.5; },
      fireInterval: 900,         // ms
      damageRatio: 0.5,          // state.attack の何倍を発射するか
    },
    coinDrop: {
      name: 'コインドロップ',
      icon: '🐹',
      cost: 4000,
      desc: 'ゴールド +50%',
      apply: (s) => { s.petGoldMul *= 1.5; },
      fireInterval: 1500,
      damageRatio: 0.25,
    },
    lucky: {
      name: 'ラッキー',
      icon: '🐰',
      cost: 6000,
      desc: 'クリ確率 +20%',
      apply: (s) => { s.petCritAdd += 0.2; },
      fireInterval: 1500,
      damageRatio: 0.25,
    },
    sharp: {
      name: 'シャープ',
      icon: '🐺',
      cost: 8000,
      desc: '貫通 +2',
      apply: (s) => { s.petPierceAdd += 2; },
      fireInterval: 1500,
      damageRatio: 0.25,
    },
    quick: {
      name: 'クイック',
      icon: '🐿️',
      cost: 10000,
      desc: '攻撃速度 +25%',
      apply: (s) => { s.petFireRateMul *= 0.8; }, // interval を 0.8倍 = 25% 高速化
      fireInterval: 1200,
      damageRatio: 0.3,
    },
    multi: {
      name: 'ダブル',
      icon: '🐑',
      cost: 15000,
      desc: 'ダブル確率 +25%',
      // CONFIG 自身の self-reference を避けるため値はハードコード
      apply: (s) => { s.petDoubleShotAdd += 0.25; },
      fireInterval: 1500,
      damageRatio: 0.3,
    },
    boost: {
      name: 'ブースト',
      icon: '🐼',
      cost: 12000,
      desc: '攻撃力 +25%',
      apply: (s) => { s.petAtkMul *= 1.25; },
      fireInterval: 1300,
      damageRatio: 0.3,
    },
  },
};
