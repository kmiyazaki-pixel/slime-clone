// =====================================================
//  放置報酬 - オフライン中に貯まるゴールドの計算
// =====================================================
//
//  方針:
//   - 実際にオフライン中シミュレーションするのではなく、
//     現在の DPS・スポーン頻度・敵HP・報酬から「想定 gold/秒」を出す
//   - 不在秒数 × 想定 gold/秒 × 効率 = 放置報酬
//   - 上限: CONFIG.IDLE_REWARD.CAP_SECONDS

import { state } from './state.js';
import { CONFIG } from './config.js';
import { enemyHpAt, enemyRewardAt } from './stage.js';

// 現在の構成での DPS (1秒あたりの総ダメージ)
function dpsEstimate() {
  // ペット + スライムを反映した実効 interval
  const effectiveInterval = state.shotInterval * state.petFireRateMul * state.slimeFireRateMul;
  const shotsPerSec = 1000 / effectiveInterval;
  // クリ込みの期待ダメージ倍率 (確率はペット + スライム加算)
  const critRate = Math.min(1, state.critChance + state.petCritAdd + state.slimeCritAdd);
  const critBonus = 1 + critRate * (state.critMultiplier - 1);
  // ペット + スライムの攻撃乗算と発射数追加を含める
  const shotCount = state.shotCount + state.petShotAdd;
  const atk = state.attack * state.petAtkMul * state.slimeAtkMul;
  return shotsPerSec * atk * critBonus * shotCount;
}

// 1秒あたりに倒せる雑魚の数
function killsPerSecond(world, stage) {
  const dps = dpsEstimate();
  const hp = enemyHpAt(world, stage);
  const limitedByDps = dps / hp;
  const limitedBySpawn = 1000 / CONFIG.SPAWN_INTERVAL;
  return Math.min(limitedByDps, limitedBySpawn);
}

// 1秒あたりに獲得するゴールド (現在の状態を使った概算)
function goldPerSecond() {
  // ボス戦 (stage 10) はオフライン中に進行しない想定なので
  // ステージは最大 9 にクリップして雑魚相手の rate を使う
  const w = state.world;
  const s = Math.min(state.stage, 9);
  const kps = killsPerSecond(w, s);
  // ペット + スライム両方のゴールド乗算を含める
  const goldPerKill = enemyRewardAt(w, s) * state.goldMultiplier * state.petGoldMul * state.slimeGoldMul;
  return kps * goldPerKill;
}

// 不在秒数から放置報酬を算出
//   戻り値: { seconds, rawSeconds, cappedAtMax, gold, goldPerSec }
export function computeIdleReward(elapsedSeconds) {
  const cap = CONFIG.IDLE_REWARD.CAP_SECONDS;
  const eff = CONFIG.IDLE_REWARD.EFFICIENCY;
  const seconds = Math.min(elapsedSeconds, cap);
  const rate = goldPerSecond();
  return {
    rawSeconds: elapsedSeconds,
    seconds,
    cappedAtMax: elapsedSeconds > cap,
    goldPerSec: rate,
    gold: Math.floor(seconds * rate * eff),
  };
}
