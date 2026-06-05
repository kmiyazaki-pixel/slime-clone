// =====================================================
//  ステージ - 難易度スケーリングと進行管理
// =====================================================

import { state } from './state.js';
import { CONFIG } from './config.js';
import { updateStageDisplay } from './ui.js';

// ステージ通算番号 (1-1=0, 1-2=1, ..., 2-1=10, ...)
function stageIndex(world, stage) {
  return (world - 1) * 10 + (stage - 1);
}

// 敵のHPスケーリング - 1ステージごとに HP_GROWTH 倍
export function enemyHpAt(world, stage) {
  const base = CONFIG.ENEMY.BASE_HP;
  return Math.max(1, Math.floor(base * Math.pow(CONFIG.ENEMY.HP_GROWTH, stageIndex(world, stage))));
}

// 敵の報酬スケーリング - 1ステージごとに REWARD_GROWTH 倍
// (HPより少し遅くすることで、強化が必要になる)
export function enemyRewardAt(world, stage) {
  const base = CONFIG.ENEMY.REWARD;
  return Math.max(1, Math.floor(base * Math.pow(CONFIG.ENEMY.REWARD_GROWTH, stageIndex(world, stage))));
}

// 敵を倒した時に呼ばれる - キルカウントを進めて、必要数に達したらステージ進行
export function onEnemyKilled() {
  state.killsInStage++;

  if (state.killsInStage >= state.killsRequired) {
    if (state.autoProgress) {
      advanceStage();
    } else {
      // 周回モード: 進捗バーが満タンのまま敵を倒し続けられる
      state.killsInStage = state.killsRequired;
    }
  }
  updateStageDisplay();
}

// 次のステージへ進む
export function advanceStage() {
  state.killsInStage = 0;
  if (state.stage < 10) {
    state.stage++;
  } else {
    // Chunk B でここをボス戦に差し替える予定
    state.world++;
    state.stage = 1;
  }
  updateStageDisplay();
}
