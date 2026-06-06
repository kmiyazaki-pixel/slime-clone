// =====================================================
//  ステージ - 難易度スケーリングと進行管理
// =====================================================

import { state } from './state.js';
import { CONFIG } from './config.js';
import {
  updateStageDisplay,
  updateBossTimer,
  showBossTimer,
  hideBossTimer,
  showRetryButton,
  hideRetryButton,
  showBossWarning,
} from './ui.js';
import { spawnBoss, removeAllEnemies } from './enemy.js';
import { saveGame } from './save.js';

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
  // ボス戦中の雑魚キルは進行に影響させない (ボスが進行を管理する)
  if (state.inBossFight) return;

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

// 「次の敵集団に向かって走る」モードに入る
export function enterTravelingMode() {
  state.slimeMode = 'traveling';
  state.travelTimer = CONFIG.TRAVEL_DURATION;
  state.enemiesSpawnedThisStage = 0;
}

// 次のステージへ進む
export function advanceStage() {
  state.killsInStage = 0;
  if (state.stage < 9) {
    state.stage++;
    enterTravelingMode();         // 走って次の敵集団へ
    updateStageDisplay();
    saveGame();
  } else if (state.stage === 9) {
    // Stage 9 完了 → Stage 10 (ボス戦) へ突入 (ボスは即対面)
    state.stage = 10;
    updateStageDisplay();
    startBossFight();
  } else {
    // Stage 10 はボスが進行を管理するので、ここでは何もしない
    state.killsInStage = state.killsRequired;
    updateStageDisplay();
  }
}

// =====================================================
//  ボス戦
// =====================================================

// ボス戦を開始
export function startBossFight() {
  state.inBossFight = true;
  state.bossTimer = CONFIG.BOSS.TIMER_SECONDS;
  state.bossDefeated = false;

  // 残ってる雑魚は消去 (ボス登場とともに画面をクリア)
  removeAllEnemies();

  spawnBoss();
  showBossWarning();
  showBossTimer();
  updateBossTimer();
  hideRetryButton();
  updateStageDisplay();
}

// ボス戦終了 (victory=true: 撃破, false: タイムアップ)
export function endBossFight(victory) {
  state.inBossFight = false;
  state.bossTimer = 0;

  if (victory) {
    state.bossDefeated = true;
    state.boss = null;
    // 次のワールドへ → トラベルモードで景色を流す
    state.world++;
    state.stage = 1;
    state.killsInStage = 0;
    enterTravelingMode();
    hideRetryButton();
  } else {
    // タイムアップ: ボス消滅、再挑戦ボタンを表示
    if (state.boss && state.boss.alive) {
      state.boss.alive = false;
      if (state.boss.el) state.boss.el.remove();
    }
    state.boss = null;
    showRetryButton();
  }

  hideBossTimer();
  updateStageDisplay();
  saveGame();
}

// 再挑戦ボタンから呼ばれる - もう一度ボス戦をやる
export function retryBoss() {
  // Stage 10 にいる前提 (=現ワールドのボスがまだ未撃破)
  if (state.inBossFight) return;
  startBossFight();
}
