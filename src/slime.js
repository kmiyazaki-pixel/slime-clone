// =====================================================
//  スライム - 装備可能な見た目+バフ
// =====================================================
//
//  方針:
//   - 同時に装備できるのは 1体だけ
//   - 装備中スライムの apply(s) だけが slime*** バフ系に反映される
//   - 所有 (state.slimes[id].owned) と装備 (state.activeSlimeId) を保存
//   - ロード時に recomputeSlimeBuffs() で乗算/加算を再計算
//   - みどりスライムは常時所有 (初期スライム)

import { state } from './state.js';
import { CONFIG } from './config.js';

// 装備中スライムの buff だけを反映 (所有してても装備してなければ効かない)
export function recomputeSlimeBuffs() {
  state.slimeAtkMul = 1;
  state.slimeFireRateMul = 1;
  state.slimeGoldMul = 1;
  state.slimeCritAdd = 0;

  const id = state.activeSlimeId;
  if (id && CONFIG.SLIMES[id]) {
    CONFIG.SLIMES[id].apply(state);
  }
}

// スライムを購入。成功なら true。コストを払えない or 所有済みなら false
export function buySlime(slimeId) {
  const def = CONFIG.SLIMES[slimeId];
  if (!def) return false;
  if (!state.slimes[slimeId]) state.slimes[slimeId] = { owned: false };
  if (state.slimes[slimeId].owned) return false;
  if (state.gold < def.cost) return false;

  state.gold -= def.cost;
  state.slimes[slimeId].owned = true;
  return true;
}

// 装備中スライムを切り替え。所有してない id は無視。成功で true
export function equipSlime(slimeId) {
  if (!state.slimes[slimeId] || !state.slimes[slimeId].owned) return false;
  if (state.activeSlimeId === slimeId) return false;
  state.activeSlimeId = slimeId;
  recomputeSlimeBuffs();
  return true;
}

// 所有してるスライム id 一覧
export function getOwnedSlimeIds() {
  return Object.entries(state.slimes)
    .filter(([, s]) => s && s.owned)
    .map(([id]) => id);
}

// 装備中スライムの id (UI表示用)
export function getActiveSlimeId() {
  return state.activeSlimeId;
}
