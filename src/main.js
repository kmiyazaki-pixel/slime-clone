// =====================================================
//  エントリポイント - 初期化とゲームループ
// =====================================================

import { state } from './state.js';
import { CONFIG } from './config.js';
import { $battlefield } from './dom.js';
import { spawnEnemy, findNearestEnemy, updateEnemies } from './enemy.js';
import { spawnProjectile, updateProjectiles } from './projectile.js';
import { bindUI } from './effects.js';
import {
  updateGoldDisplay,
  renderUpgrades,
  refreshUpgradeButtons,
  updateStageDisplay,
  updateAutoButton,
  setupUI,
} from './ui.js';

// プレイヤーの位置を戦場の高さに合わせて設定
function setPlayerY() {
  const fieldH = $battlefield.clientHeight;
  state.player.y = fieldH * CONFIG.GROUND_RATIO + 20;
  state.player.x = CONFIG.PLAYER_X;
}

// =====================================================
//  ゲームループ
// =====================================================
let lastFrame = performance.now();

function gameLoop(now) {
  // dt = 前フレームからの経過秒数 (フレームレート非依存)
  // 上限 0.05 はタブが裏で長時間止まった後のジャンプ防止
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;

  // 敵スポーン
  if (now - state.lastSpawn > CONFIG.SPAWN_INTERVAL) {
    state.lastSpawn = now;
    spawnEnemy();
  }

  // 敵の移動
  updateEnemies(dt);

  // 自動射撃 (一定間隔で一番近い敵を撃つ)
  if (now - state.lastShot > state.shotInterval) {
    const t = findNearestEnemy();
    if (t) {
      spawnProjectile(t);
      state.lastShot = now;
    }
  }

  // 弾の移動と衝突判定
  updateProjectiles(dt);

  // 死んだもの・期限切れを配列から除去
  state.enemies     = state.enemies.filter(e => e.alive);
  state.projectiles = state.projectiles.filter(p => p.life > 0);

  requestAnimationFrame(gameLoop);
}

// =====================================================
//  初期化
// =====================================================
function init() {
  // effects.js に updateGoldDisplay を渡す (循環依存回避)
  bindUI(updateGoldDisplay);

  setPlayerY();
  updateGoldDisplay();
  updateStageDisplay();
  updateAutoButton();
  renderUpgrades();
  setupUI();

  // ウィンドウサイズ変更時にプレイヤー位置を再計算
  window.addEventListener('resize', setPlayerY);

  // ゴールドが増えたら買えるようになったボタンを有効化
  setInterval(refreshUpgradeButtons, 200);

  requestAnimationFrame(gameLoop);
}

init();
