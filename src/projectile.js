// =====================================================
//  弾 - 発射、移動、衝突判定
// =====================================================

import { state } from './state.js';
import { CONFIG } from './config.js';
import { $battlefield } from './dom.js';
import { showDamage } from './effects.js';
import { killEnemy } from './enemy.js';

// ターゲットに向けて弾を発射
export function spawnProjectile(target) {
  const sx = state.player.x + 30;
  const sy = state.player.y;

  // ターゲット中心への単位ベクトル
  const dx = (target.x + 18) - sx;
  const dy = (target.y + 18) - sy;
  const dist = Math.hypot(dx, dy);

  const p = {
    id: state._projId++,
    x: sx,
    y: sy,
    vx: (dx / dist) * CONFIG.PROJECTILE.SPEED,
    vy: (dy / dist) * CONFIG.PROJECTILE.SPEED,
    damage: state.attack,
    targetId: target.id,
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
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.el.style.left = (p.x - 6) + 'px';
    p.el.style.top  = (p.y - 6) + 'px';

    // ターゲット (生きてる敵) との距離判定
    const t = state.enemies.find(e => e.id === p.targetId && e.alive);
    if (t) {
      const dx = (t.x + 18) - p.x;
      const dy = (t.y + 18) - p.y;
      if (Math.hypot(dx, dy) < CONFIG.HIT_RADIUS) {
        // 命中
        t.hp -= p.damage;
        showDamage(t.x + 10, t.y, p.damage);
        t.hpFill.style.width = Math.max(0, (t.hp / t.maxHp) * 100) + '%';
        t.el.classList.add('hit');
        setTimeout(() => t.el.classList.remove('hit'), 60);

        if (t.hp <= 0) killEnemy(t);

        p.el.remove();
        p.life = 0;
      }
    }

    // 寿命切れ or 画面外
    if (p.life <= 0 || p.x > $battlefield.clientWidth + 50) {
      p.el.remove();
      p.life = 0;
    }
  }
}
