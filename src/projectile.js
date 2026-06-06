// =====================================================
//  弾 - 発射、移動、衝突判定 (ダブルショット/クリ/貫通対応)
// =====================================================
// 旧マルチショット (扇形複数発射) は廃止。今は 1発撃って、確率で
// state.doubleShotChance + state.petDoubleShotAdd の合算分だけ
// CONFIG.DOUBLE_SHOT.DELAY_MS 後にもう一発撃つ仕様。

import { state } from './state.js';
import { CONFIG } from './config.js';
import { $battlefield } from './dom.js';
import { showDamage } from './effects.js';
import { killEnemy, findNearestEnemy } from './enemy.js';

// ターゲットへ角度を計算する小ヘルパ
function aimAngle(target) {
  const half = target.size / 2;
  const dx = (target.x + half) - state.player.x;
  const dy = (target.y + half) - state.player.y;
  return Math.atan2(dy, dx);
}

// 2発目以降を遅延予約するヘルパ
//   targetId が生きてればその敵、死んでたら最寄り敵に当てる
function scheduleExtraShot(targetId, delayMs) {
  setTimeout(() => {
    let t = state.enemies.find(e => e.id === targetId && e.alive);
    if (!t) t = findNearestEnemy();
    if (t) spawnSingleProjectile(t, aimAngle(t));
  }, delayMs);
}

// ターゲットに向けて弾を発射する公開API
//   - まず 1発撃つ (確定)
//   - 「トリプル → ダブル」の順に判定する優先カスケード:
//     - トリプル当選 → +2発 (合計3発)
//     - 外れた時だけダブル判定 → 当選で +1発 (合計2発)
//     - どちらも外れ → 1発のみ
//   - 2発目以降の時点で元ターゲットが死んでたら最寄りの敵に振り替え
export function fireAt(target) {
  spawnSingleProjectile(target, aimAngle(target));

  const tripleC = Math.min(1, state.tripleShotChance + state.petTripleShotAdd);
  const doubleC = Math.min(1, state.doubleShotChance + state.petDoubleShotAdd);
  const targetId = target.id;
  const dt = CONFIG.DOUBLE_SHOT.DELAY_MS;

  if (Math.random() < tripleC) {
    // トリプル: 2発目と 3発目を予約
    scheduleExtraShot(targetId, dt);
    scheduleExtraShot(targetId, dt * 2);
  } else if (Math.random() < doubleC) {
    // ダブル: 2発目だけ予約
    scheduleExtraShot(targetId, dt);
  }
}

// ペットの自前攻撃。ペットスプライトの位置から、シンプルな単発弾を撃つ
// (クリ/貫通/ダブルショットは適用しない。state.attack * damageRatio のみ)
export function firePetAt(target, petIndex, damage) {
  // 実 DOM からペットの中心位置を取る (renderPetSprites の式に依存しない)
  const sprites = $battlefield.querySelectorAll('.pet-sprite');
  const petSprite = sprites[petIndex];
  let sx, sy;
  if (petSprite) {
    sx = petSprite.offsetLeft + petSprite.offsetWidth / 2;
    sy = petSprite.offsetTop + petSprite.offsetHeight / 2;
  } else {
    // フォールバック (スプライト未描画の極稀ケース)
    sx = 20 + petIndex * 22;
    sy = state.player.y;
  }

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
  // スライム DOM 中心 = state.player.x/y から発射 (setPlayerY で同期)
  const sx = state.player.x;
  const sy = state.player.y;
  const speed = CONFIG.PROJECTILE.SPEED;

  const p = {
    id: state._projId++,
    x: sx,
    y: sy,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    // ペットの攻撃バフを反映 (アタッカー所有時 ×1.5 など)
    // ペットとスライムの攻撃乗算を両方反映
    damage: state.attack * state.petAtkMul * state.slimeAtkMul,
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
        // 命中 (クリ確率はペット + スライムのバフを加算)
        const isCrit = Math.random() < (state.critChance + state.petCritAdd + state.slimeCritAdd);
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
