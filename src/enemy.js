// =====================================================
//  敵 - スポーン、移動、死亡
// =====================================================

import { state } from './state.js';
import { CONFIG } from './config.js';
import { $battlefield } from './dom.js';
import { spawnGoldDrop } from './effects.js';
import { enemyHpAt, enemyRewardAt, onEnemyKilled, endBossFight } from './stage.js';

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
    isBoss: false,
    size: 36,
    hitRadius: CONFIG.HIT_RADIUS,
    stopX: null,
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

// ボスを1体スポーン (画面右外から登場、stopX で停止)
export function spawnBoss() {
  const fieldW = $battlefield.clientWidth;
  const fieldH = $battlefield.clientHeight;
  const groundY = fieldH * CONFIG.GROUND_RATIO;
  const size = CONFIG.BOSS.SIZE;

  const baseHp = enemyHpAt(state.world, state.stage);
  const baseReward = enemyRewardAt(state.world, state.stage);
  const hp = baseHp * CONFIG.BOSS.HP_MULTIPLIER;

  const b = {
    id: state._enemyId++,
    x: fieldW + 40,
    // 地面の上に立つように配置 (大きい分、地平線より上に頭が出る)
    y: groundY - size * 0.55,
    hp,
    maxHp: hp,
    speed: CONFIG.BOSS.SPEED,
    reward: baseReward * CONFIG.BOSS.REWARD_MULTIPLIER,
    alive: true,
    isBoss: true,
    size,
    hitRadius: CONFIG.BOSS.HIT_RADIUS,
    stopX: fieldW * CONFIG.BOSS.STOP_RATIO,
    el: null,
    hpFill: null,
  };

  const el = document.createElement('div');
  el.className = 'enemy boss';
  el.style.width  = size + 'px';
  el.style.height = size + 'px';
  el.style.left = b.x + 'px';
  el.style.top  = b.y + 'px';

  const bar  = document.createElement('div');
  bar.className = 'hp-bar boss-hp-bar';
  const fill = document.createElement('div');
  fill.className = 'hp-fill';
  fill.style.width = '100%';
  bar.appendChild(fill);
  el.appendChild(bar);

  $battlefield.appendChild(el);
  b.el = el;
  b.hpFill = fill;

  state.enemies.push(b);
  state.boss = b;
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

    // ボスは stopX に到達したら停止
    if (e.isBoss && e.stopX !== null && e.x <= e.stopX) {
      // 停止位置に到達 - 動かさない
    } else {
      e.x -= e.speed * dt;
    }
    e.el.style.left = e.x + 'px';

    // 画面外で消滅 (雑魚のみ。ボスは stopX で停まるのでここには来ない)
    if (!e.isBoss && e.x < -40) {
      e.el.remove();
      e.alive = false;
    }
  }
}

// 全ての雑魚敵を消去 (ボス戦開始時の画面クリア用)
export function removeAllEnemies() {
  for (const e of state.enemies) {
    if (e.alive && !e.isBoss) {
      e.alive = false;
      if (e.el) e.el.remove();
    }
  }
}

// 敵死亡処理 (ゴールドをドロップ)
export function killEnemy(e) {
  if (!e.alive) return;
  e.alive = false;
  e.el.classList.add('dying');

  const m = state.goldMultiplier;
  spawnGoldDrop(e.x + 10, e.y + 10, Math.floor(e.reward * m));

  // ボスは派手に: 複数のゴールド粒子を散らす
  if (e.isBoss) {
    const size = CONFIG.BOSS.SIZE;
    const small = Math.floor(e.reward * m / 9);
    for (let i = 0; i < 8; i++) {
      const ox = e.x + Math.random() * size;
      const oy = e.y + Math.random() * size;
      spawnGoldDrop(ox, oy, small);
    }
  }

  setTimeout(() => e.el.remove(), 300);

  if (e.isBoss) {
    endBossFight(true);
  } else {
    onEnemyKilled();
  }
}
