// =====================================================
//  視覚エフェクト - ダメージ数字、ゴールド粒子
// =====================================================

import { state } from './state.js';
import { $battlefield, $goldDisplay } from './dom.js';
import { formatNum } from './utils.js';

// 注: updateGoldDisplay は ui.js から動的 import で取得
// (循環依存を避けるため、初期化時に setUI() で渡してもらう形にする)
let _updateGoldDisplay = null;

export function bindUI(updateGoldDisplay) {
  _updateGoldDisplay = updateGoldDisplay;
}

// ダメージ数字を表示
export function showDamage(x, y, dmg) {
  const el = document.createElement('div');
  el.className = 'dmg-num';
  el.textContent = formatNum(dmg);
  el.style.left = x + 'px';
  el.style.top  = (y - 12) + 'px';
  $battlefield.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

// ゴールド粒子をスポーン (ゴールド表示まで飛んで加算される)
export function spawnGoldDrop(x, y, amount) {
  const el = document.createElement('div');
  el.className = 'gold-drop';
  el.style.left = x + 'px';
  el.style.top  = y + 'px';

  // ゴールド表示の位置までの差分を計算
  const goldRect  = $goldDisplay.getBoundingClientRect();
  const fieldRect = $battlefield.getBoundingClientRect();
  const tx = (goldRect.left - fieldRect.left + 18) - x;
  const ty = (goldRect.top  - fieldRect.top  + 14) - y;

  // CSS変数経由でアニメーションに渡す
  el.style.setProperty('--tx', tx + 'px');
  el.style.setProperty('--ty', ty + 'px');
  el.style.setProperty('--mx', (tx / 2) + 'px');

  $battlefield.appendChild(el);

  // アニメーション終了後にゴールド加算
  setTimeout(() => {
    state.gold += amount;
    if (_updateGoldDisplay) _updateGoldDisplay();
    el.remove();
  }, 600);
}
