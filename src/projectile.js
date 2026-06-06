// =====================================================
//  弾 - 発射、移動、衝突判定 (マルチショット/クリ/貫通対応)
// =====================================================

import { state } from './state.js';
import { CONFIG } from './config.js';
import { $battlefield } from './dom.js';
import { showDamage } from './effects.js';
import { killEnemy } from './enemy.js';

// ターゲットに向けて弾を発射する公開API
// state.shotCount に応じて扇形に複数発射
export function fireAt(target) {
  const sx = state.player.x + 30;
  const sy = state.player.y;
  const half = target.size / 2;
  const tcx = target.x + half;
  const tcy = target.y + half;
  const centerAngle = Math.atan2(tcy - sy, tcx - sx);

  // マルチペット所有時は同時発射数が増える
  const count = state.shotCount + state.petShotAdd;
  const spread = CONFIG.MULTI_SHOT.SPREAD_DEG * Math.PI / 180;

  for (let i = 0; i < count; i++) {
    let offset = 0;
    if (count > 1) {
      // i=0 が一番上、i=count-1 が一番下になるよう -spread/2 ~ +spread/2 に等間隔
      offset = -spread / 2 + (i / (count - 1)) * spread;
    }
    spawnSingleProjectile(target, centerAngle + offset);
  }
}

// ペットの自前攻撃。ペットスプライトの位置から、シンプルな単発弾を撃つ
// (クリ/貫通/マルチショットは適用しない。state.attack * damageRatio のみ)
export function firePetAt(target, petIndex, damage) {
  const sx = 20 + petIndex * 22;   // renderPetSprites と一致させる
  const sy = state.player.y + (petIndex % 2 === 0 ? 6 : 0);

  const half = target.size / 2;
  const dx = (target.x + half) - sx;
  const dy = (target.y + half) - sy;
  const dist = Math.hypot(dx, dy);
  const speed = CONFIG.PROJECTILE.SPEED * 0.85;

  const p = {
    id: state._projId++,
    x: sx,
    y: sy,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    damage: Math.max(1, Math.floor(damage)),
    targetId: target.id,
    hitIds: new Set(),
    piercesLeft: 0,                // ペット弾は貫通しない
    life: CONFIG.PROJECTILE.LIFE,
    el: null,
    isPet: true,
  };

  const el = document.createElement('div');
  el.className = 'projectile pet-projectile';
  el.style.left = (p.x - 5) + 'px';
  el.style.top  = (p.y - 5) + 'px';
  $battlefield.appendChild(el);
  p.el = el;

  state.projectiles.push(p);
}

function spawnSingleProjectile(target, angle) {
  const sx = state.player.x + 30;
  const sy = state.player.y;
  const speed = CONFIG.PROJECTILE.SPEED;

  const p = {
    id: state._projId++,
    x: sx,
    y: sy,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    // ペットの攻撃バフを反映 (アタッカー所有時 ×1.5 など)
    damage: state.attack * state.petAtkMul,
    targetId: target.id,
    hitIds: new Set(),
    // ペットの貫通バフを加算 (シャープ所有時 +2 など)
    piercesLeft: state.pierceCount + state.petPierceAdd,
    life: CONFIG.PROJECTILE.LIFE,
    el: null,
  };

  const el = document.createElement('div');
  el.className = 'projectile';
  el.style.left = (p.x - 6) + 'px';
  el.style.top  = (p.y - 6) + 'px';
  $battlefield.appendChild(el);
  p.el = el;

  state.projectiles.push(p);
}

// 毎フレーム弾を更新 (移動と衝突)
export function updateProjectiles(dt) {
  for (const p of state.projectiles) {
    if (p.life <= 0) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.el.style.left = (p.x - 6) + 'px';
    p.el.style.top  = (p.y - 6) + 'px';

    // 全敵をチェック (貫通対応: ターゲット以外にも当たる)
    for (const t of state.enemies) {
      if (!t.alive) continue;
      if (p.hitIds.has(t.id)) continue;

      const half = t.size / 2;
      const tcx = t.x + half;
      const tcy = t.y + half;
      const dx = tcx - p.x;
      const dy = tcy - p.y;

      if (Math.hypot(dx, dy) < t.hitRadius) {
        // 命中 (クリ確率はペットバフを加算)
        const isCrit = Math.random() < (state.critChance + state.petCritAdd);
        const dmg = Math.max(1, Math.floor(p.damage * (isCrit ? state.critMultiplier : 1)));

        t.hp -= dmg;
        showDamage(t.x + half - 10, t.y, dmg, isCrit);
        t.hpFill.style.width = Math.max(0, (t.hp / t.maxHp) * 100) + '%';
        t.el.classList.add('hit');
        setTimeout(() => t.el.classList.remove('hit'), 60);

        if (t.hp <= 0) killEnemy(t);

        p.hitIds.add(t.id);

        // 貫通残りがあれば継続、なければ消滅
        if (p.piercesLeft > 0) {
          p.piercesLeft--;
        } else {
          p.el.remove();
          p.life = 0;
          break;
        }
      }
    }

    // 寿命切れ or 画面外
    if (p.life > 0 && p.x > $battlefield.clientWidth + 50) {
      p.el.remove();
      p.life = 0;
    }
  }
}
