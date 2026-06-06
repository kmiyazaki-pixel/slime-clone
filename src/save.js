// =====================================================
//  セーブ / ロード - localStorage に state のスナップショットを保存
// =====================================================
//
//  方針:
//   - 保存対象は「育成した結果」だけ (gold, upgrades の level, 派生スタッツ, 進行)
//   - 一時状態 (敵リスト, 弾, ボスインスタンス, タイミング) は保存しない
//   - スキーマには v (バージョン) を持たせて、将来的な変更に備える
//   - localStorage が使えない / JSON が壊れている時は黙ってデフォルトで起動
//
//  クラウド同期 (cloud.js) は bindCloud() でフックを差し込むことで連携する。
//  save.js は cloud.js を直接 import しないので、Supabase なしでも動く。

import { state } from './state.js';
import { recomputePetBuffs } from './pet.js';
import { recomputeSlimeBuffs } from './slime.js';

const KEY = 'slime-clone-save';
const VERSION = 1;

// state の中で保存したいスカラー
const SCALAR_KEYS = [
  'gold',
  'gems',
  'playerLv',
  'idleSeconds',
  'attack',
  'shotInterval',
  'shotCount',
  'critChance',
  'critMultiplier',
  'goldMultiplier',
  'pierceCount',
  'doubleShotChance',
  'world',
  'stage',
  'killsInStage',
  'autoProgress',
];

// クラウド同期コールバック (cloud.js から bindCloud で差し込まれる)
let cloudHook = null;
export function bindCloud(cb) { cloudHook = cb; }

// 直近に復元した snapshot の savedAt (放置報酬の経過時間計算用)
let _lastSavedAt = null;
export function getLastSavedTime() { return _lastSavedAt; }

// 公開: state を平のオブジェクトにシリアライズ
export function snapshot() {
  const data = { v: VERSION, savedAt: Date.now() };
  for (const k of SCALAR_KEYS) data[k] = state[k];
  // 強化の level だけ保存 (apply関数とかは保存しない)
  const levels = {};
  for (const key in state.upgrades) {
    levels[key] = state.upgrades[key].level;
  }
  data.upgradeLevels = levels;
  // ペットは所有 bool だけ保存。petXxxMul/Add は recompute で復元する
  const ownedPets = {};
  for (const id in state.pets) {
    ownedPets[id] = !!(state.pets[id] && state.pets[id].owned);
  }
  data.pets = ownedPets;
  // スライムは所有 bool マップ + 装備中 id を保存
  const ownedSlimes = {};
  for (const id in state.slimes) {
    ownedSlimes[id] = !!(state.slimes[id] && state.slimes[id].owned);
  }
  data.slimes = ownedSlimes;
  data.activeSlimeId = state.activeSlimeId;
  return data;
}

// 公開: スナップショットを state に適用。成功なら true
export function restore(snap) {
  if (!snap || snap.v !== VERSION) return false;
  for (const k of SCALAR_KEYS) {
    if (snap[k] !== undefined) state[k] = snap[k];
  }
  if (snap.upgradeLevels) {
    for (const key in snap.upgradeLevels) {
      if (state.upgrades[key]) {
        state.upgrades[key].level = snap.upgradeLevels[key];
      }
    }
  }
  // ペット所有を復元してから buff を再計算
  if (snap.pets) {
    for (const id in snap.pets) {
      if (!state.pets[id]) state.pets[id] = { owned: false };
      state.pets[id].owned = !!snap.pets[id];
    }
  }
  recomputePetBuffs();
  // 旧マルチショット (shotCount-based) → 新ダブルショット (chance-based) のマイグレーション
  // 旧セーブには doubleShotChance フィールドが無いので、multiShot.level から再計算する
  if (state.upgrades.multiShot) {
    state.doubleShotChance = Math.min(1, state.upgrades.multiShot.level / 100);
  }
  state.shotCount = 1;            // legacy: 新仕様で未使用なので 1 に固定
  state.petShotAdd = 0;           // legacy: 新仕様で未使用
  // スライム所有状態を復元 → 装備中 id を反映 → buff 再計算
  if (snap.slimes) {
    for (const id in snap.slimes) {
      if (!state.slimes[id]) state.slimes[id] = { owned: false };
      state.slimes[id].owned = !!snap.slimes[id];
    }
  }
  // みどりスライムだけは常時所有 (初期スライム)
  if (!state.slimes.green) state.slimes.green = { owned: true };
  state.slimes.green.owned = true;
  // 装備中 id の整合性: 所有してないなら green にフォールバック
  if (snap.activeSlimeId && state.slimes[snap.activeSlimeId]?.owned) {
    state.activeSlimeId = snap.activeSlimeId;
  } else {
    state.activeSlimeId = 'green';
  }
  recomputeSlimeBuffs();
  // クリ確率だけ 1.0 で念のためクランプ (倍率は無制限)
  state.critChance = Math.min(1.0, state.critChance);
  if (snap.savedAt) _lastSavedAt = snap.savedAt;
  return true;
}

// 公開: 現在の state を localStorage に書き出す (+ クラウドにも通知)
export function saveGame() {
  try {
    const data = snapshot();
    localStorage.setItem(KEY, JSON.stringify(data));
    if (cloudHook) cloudHook();
  } catch (e) {
    console.warn('[save] failed:', e && e.message);
  }
}

// 公開: 起動時に呼ぶ。復元できれば true、何もなければ false
export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const snap = JSON.parse(raw);
    return restore(snap);
  } catch (e) {
    console.warn('[save] load failed:', e && e.message);
    return false;
  }
}

// 公開: セーブを消す (デバッグ/設定リセット用)
export function resetSave() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) { /* noop */ }
}

// DevTools から手動リセットしたい時のためにグローバルに置く
if (typeof window !== 'undefined') {
  window.__slimeResetSave = resetSave;
}
