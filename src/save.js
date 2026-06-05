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
//  ボス戦中に保存された場合の扱い: state.stage = 10 で復元 → main.js 側で
//  `startBossFight()` を呼び直して再開する (この save.js では関知しない)

import { state } from './state.js';

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
  'world',
  'stage',
  'killsInStage',
  'autoProgress',
];

function snapshot() {
  const data = { v: VERSION, savedAt: Date.now() };
  for (const k of SCALAR_KEYS) {
    data[k] = state[k];
  }
  // 強化の level だけ保存 (apply関数とかは保存しない)
  const levels = {};
  for (const key in state.upgrades) {
    levels[key] = state.upgrades[key].level;
  }
  data.upgradeLevels = levels;
  return data;
}

function restore(snap) {
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
}

// 公開: 現在の state を localStorage に書き出す
export function saveGame() {
  try {
    const data = snapshot();
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    // localStorage が使えない (プライベートブラウジング等) は無視
    console.warn('[save] failed:', e && e.message);
  }
}

// 公開: 起動時に呼ぶ。復元できれば true、何もなければ false
export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const snap = JSON.parse(raw);
    if (!snap || snap.v !== VERSION) {
      console.warn('[save] schema mismatch, starting fresh');
      return false;
    }
    restore(snap);
    return true;
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
