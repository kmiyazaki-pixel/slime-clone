// =====================================================
//  スキル - アクティブ発動 (購入 → アクションバーに常駐 → タップで使用)
// =====================================================
//
//  方針:
//   - スキルは「所有」したらアクションバーに常駐 (4スロット固定)
//   - 各スキルに固有のクールダウン (秒)、CD 中は再使用不可
//   - 効果は「即時系」(チャージショット、メテオ) と「持続系」
//     (クリタイム、ゴールドラッシュ) の2 種類
//   - 持続系は state.skillBuffsRemaining[id] を秒単位で減らし、
//     0 になったら効果終了
//   - 派生バフ (skillCritMul / skillGoldMul) は tickSkills() の中で
//     毎フレーム recompute する

import { state } from './state.js';
import { CONFIG } from './config.js';
import { findNearestEnemy, killEnemy } from './enemy.js';
import { spawnSkillProjectile } from './projectile.js';
import { showDamage } from './effects.js';

// 公開: スキルを購入。成功なら true
export function buySkill(id) {
  const def = CONFIG.SKILLS[id];
  if (!def) return false;
  if (state.skills[id] && state.skills[id].owned) return false;
  if (state.gold < def.cost) return false;
  state.gold -= def.cost;
  if (!state.skills[id]) state.skills[id] = { owned: false };
  state.skills[id].owned = true;
  return true;
}

// 公開: 発動可能か (所有 && CD 切れ)
export function isSkillReady(id) {
  if (!state.skills[id] || !state.skills[id].owned) return false;
  return (state.skillCooldowns[id] || 0) <= 0;
}

// 公開: スキルを使う。発動できれば true、CD 中等で発動できなければ false
export function useSkill(id) {
  if (!isSkillReady(id)) return false;
  const def = CONFIG.SKILLS[id];
  if (!def) return false;

  // 効果実行
  triggerSkill(id, def);

  // CD 開始
  state.skillCooldowns[id] = def.cooldown;
  return true;
}

// 公開: 所有してるスキル id 一覧
export function getOwnedSkillIds() {
  return Object.entries(state.skills)
    .filter(([, sk]) => sk && sk.owned)
    .map(([id]) => id);
}

// =====================================================
//  内部: 効果ディスパッチ
// =====================================================

function triggerSkill(id, def) {
  switch (id) {
    case 'chargeShot': triggerChargeShot(def); break;
    case 'meteor':     triggerMeteor(def); break;
    case 'critTime':
      state.skillBuffsRemaining.critTime = def.duration;
      break;
    case 'goldRush':
      state.skillBuffsRemaining.goldRush = def.duration;
      break;
  }
}

function triggerChargeShot(def) {
  const target = findNearestEnemy();
  if (!target) return;
  // 通常攻撃 (スライム/ペット buff 込み) の damageMul 倍を 1発
  const baseAtk = state.attack * state.petAtkMul * state.slimeAtkMul;
  const dmg = Math.floor(baseAtk * def.damageMul);
  spawnSkillProjectile(target, dmg);
}

function triggerMeteor(def) {
  // 画面の全敵 (生存中) に最大HPの hpRatioDmg 割合のダメージ
  for (const e of state.enemies) {
    if (!e.alive) continue;
    const dmg = Math.max(1, Math.floor(e.maxHp * def.hpRatioDmg));
    e.hp -= dmg;
    showDamage((e.x + e.size / 2) - 10, e.y - 4, dmg, true);
    if (e.hpFill) {
      e.hpFill.style.width = Math.max(0, (e.hp / e.maxHp) * 100) + '%';
    }
    if (e.el) {
      e.el.classList.add('hit');
      setTimeout(() => e.el && e.el.classList.remove('hit'), 60);
    }
    if (e.hp <= 0) killEnemy(e);
  }
}

// =====================================================
//  毎フレーム呼ぶ: CD と持続バフの時間進行 + 派生フィールドの再計算
// =====================================================
export function tickSkills(dt) {
  // クールダウン
  for (const id in state.skillCooldowns) {
    if (state.skillCooldowns[id] > 0) {
      state.skillCooldowns[id] = Math.max(0, state.skillCooldowns[id] - dt);
    }
  }
  // 持続バフ
  for (const id in state.skillBuffsRemaining) {
    if (state.skillBuffsRemaining[id] > 0) {
      state.skillBuffsRemaining[id] = Math.max(0, state.skillBuffsRemaining[id] - dt);
    }
  }
  // 派生バフを再計算
  state.skillCritMul = state.skillBuffsRemaining.critTime > 0
    ? CONFIG.SKILLS.critTime.critMulFactor
    : 1;
  state.skillGoldMul = state.skillBuffsRemaining.goldRush > 0
    ? CONFIG.SKILLS.goldRush.goldMul
    : 1;

  // AUTO ON のときは所有スキルを CD 切れ次第自動発動
  // (敵が必要なスキルは、敵がいる時だけ)
  if (state.autoProgress) {
    const hasEnemy = state.enemies.some(e => e.alive);
    for (const id in state.skills) {
      if (!state.skills[id] || !state.skills[id].owned) continue;
      if ((state.skillCooldowns[id] || 0) > 0) continue;
      const needsEnemy = id === 'chargeShot' || id === 'meteor';
      if (needsEnemy && !hasEnemy) continue;
      useSkill(id);
    }
  }
}
