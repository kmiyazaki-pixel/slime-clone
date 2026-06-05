// =====================================================
//  敵 - スポーン、移動、死亡
// =====================================================

import { state } from './state.js';
import { CONFIG } from './config.js';
import { $battlefield } from './dom.js';
import { spawnGoldDrop } from './effects.js';
import { enemyHpAt, enemyRewardAt, onEnemyKilled } from './stage.js';

// 敵を1体スポーン (画面右外から)
export function spawnEnemy() {
  const fieldH = $battlefield.clientHeight;
  const groundY = fieldH * CONFIG.GROUND_RATIO;
  const minY = groundY + 4;
  const maxY = fieldH - 44;

  const hp = enemyHpAt(state.world, state.stage);
  const e = {
    id: state._enemyId++,
    x: $battlefield.clientWidth + 20,
    y: minY + Math.random() * (maxY - minY),
    hp,
    maxHp: hp,
    speed: CONFIG.ENEMY.SPEED_MIN + Math.random() * CONFIG.ENEMY.SPEED_RANGE,
    reward: enemyRewardAt(state.world, state.stage),
    alive: true,
    el: null,
    hpFill: null,
  };

  // DOM要素を作る
  const el = document.createElement('div');
  el.className = 'enemy';
  el.style.left = e.x + 'px';
  el.style.top  = e.y + 'px';

  const bar  = document.createElement('div');
  bar.className = 'hp-bar';
  const fill = document.createElement('div');
  fill.className = 'hp-fill';
  fill.style.width = '100%';
  bar.appendChild(fill);
  el.appendChild(bar);

  $battlefield.appendChild(el);
  e.el = el;
  e.hpFill = fill;

  state.enemies.push(e);
}

// 一番近い前方の敵を探す (射撃対象)
export function findNearestEnemy() {
  let best = null;
  let bestD = Infinity;
  for (const e of state.enemies) {
    if (!e.alive) continue;
    const d = e.x - state.player.x;
    if (d > 0 && d < bestD) {
      best = e;
      bestD = d;
    }
  }
  return best;
}

// 毎フレーム敵を左に移動
export function updateEnemies(dt) {
  for (const e of state.enemies) {
    if (!e.alive) continue;
    e.x -= e.speed * dt;
    e.el.style.left = e.x + 'px';
    // 画面外で消滅 (Phase 1 ではプレイヤーHPなし)
    if (e.x < -40) {
      e.el.remove();
      e.alive = false;
    }
  }
}

// 敵死亡処理 (ゴールドをドロップ)
export function killEnemy(e) {
  if (!e.alive) return;
  e.alive = false;
  e.el.classList.add('dying');
  spawnGoldDrop(e.x + 10, e.y + 10, e.reward);
  setTimeout(() => e.el.remove(), 300);
  onEnemyKilled();
}
