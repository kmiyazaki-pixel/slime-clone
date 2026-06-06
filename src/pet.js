// =====================================================
//  ペット - 常駐型の永続バフ
// =====================================================
//
//  方針:
//   - 既存のスタッツ (state.attack 等) を直接いじらない
//   - ペット専用フィールド (petAtkMul / petGoldMul / petCritAdd / petPierceAdd)
//     を介して damage/gold/crit/pierce 計算式に効かせる
//   - 所有マップ (state.pets[petId].owned) だけ保存。ロード時に
//     recomputePetBuffs() を呼んで乗算/加算フィールドを再計算する
//     → バフの値や仕様変更があってもセーブ互換を維持できる

import { state } from './state.js';
import { CONFIG } from './config.js';

// 所有してるペット全部の apply を順に流して buff フィールドを再生成
export function recomputePetBuffs() {
  state.petAtkMul = 1;
  state.petGoldMul = 1;
  state.petCritAdd = 0;
  state.petPierceAdd = 0;
  state.petFireRateMul = 1;
  state.petShotAdd = 0;         // legacy: 旧マルチショット
  state.petDoubleShotAdd = 0;   // ダブルペット所有時に +0.25
  state.petTripleShotAdd = 0;   // 将来用 (現状は専用ペットなし)
  for (const id in state.pets) {
    if (state.pets[id] && state.pets[id].owned && CONFIG.PETS[id]) {
      CONFIG.PETS[id].apply(state);
    }
  }
}

// ペットを購入。成功なら true、失敗 (既所有 / 所持金不足) なら false
export function buyPet(petId) {
  const def = CONFIG.PETS[petId];
  if (!def) return false;
  if (!state.pets[petId]) state.pets[petId] = { owned: false };
  if (state.pets[petId].owned) return false;
  if (state.gold < def.cost) return false;

  state.gold -= def.cost;
  state.pets[petId].owned = true;
  recomputePetBuffs();
  return true;
}

// 所有してるペットの id 一覧
export function getOwnedPetIds() {
  return Object.entries(state.pets)
    .filter(([, p]) => p && p.owned)
    .map(([id]) => id);
}
