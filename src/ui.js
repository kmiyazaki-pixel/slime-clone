// =====================================================
//  UI - ゴールド表示、強化パネルの描画
// =====================================================

import { state } from './state.js';
import {
  $goldDisplay,
  $upgrades,
  $stageLabel,
  $stageProgressBar,
  $stageProgressText,
  $autoToggle,
} from './dom.js';
import { formatNum, upgradeCost } from './utils.js';

// ゴールド表示を最新値に更新
export function updateGoldDisplay() {
  $goldDisplay.textContent = formatNum(state.gold);
}

// 強化項目ごとの現在値ラベル
function getStatLabel(key) {
  if (key === 'attack')   return `ダメージ: ${formatNum(state.attack)}`;
  if (key === 'fireRate') return `間隔: ${state.shotInterval.toFixed(0)}ms`;
  return '';
}

// 強化パネル全体を再描画
export function renderUpgrades() {
  $upgrades.innerHTML = '';
  for (const [key, u] of Object.entries(state.upgrades)) {
    const cost = upgradeCost(u);
    const canAfford = state.gold >= cost;

    const row = document.createElement('div');
    row.className = 'upgrade-row';
    row.innerHTML = `
      <div class="upg-icon">${u.icon}</div>
      <div class="upg-info">
        <div class="upg-name">${u.name}</div>
        <div class="upg-stat">${getStatLabel(key)}</div>
        <div class="upg-level">Lv. ${u.level}</div>
      </div>
      <button class="upg-btn" ${canAfford ? '' : 'disabled'} data-key="${key}">
        <div>強化</div>
        <div class="upg-cost">${formatNum(cost)} G</div>
      </button>
    `;
    $upgrades.appendChild(row);
  }

  // ボタンにクリックイベントを再バインド
  $upgrades.querySelectorAll('button[data-key]').forEach(btn => {
    btn.addEventListener('click', () => buyUpgrade(btn.dataset.key));
  });
}

// 強化を購入
function buyUpgrade(key) {
  const u = state.upgrades[key];
  const cost = upgradeCost(u);
  if (state.gold < cost) return;
  state.gold -= cost;
  u.level++;
  u.apply(state);
  updateGoldDisplay();
  renderUpgrades();
}

// ボタンの有効/無効だけを軽く更新 (毎フレーム再描画は重いので)
export function refreshUpgradeButtons() {
  $upgrades.querySelectorAll('button[data-key]').forEach(btn => {
    const u = state.upgrades[btn.dataset.key];
    btn.disabled = state.gold < upgradeCost(u);
  });
}

// ステージ表示を更新 (バッジ + 進捗バー)
export function updateStageDisplay() {
  $stageLabel.textContent = `${state.world}-${state.stage}`;
  $stageProgressText.textContent = `${state.killsInStage} / ${state.killsRequired}`;
  const ratio = Math.min(1, state.killsInStage / state.killsRequired);
  $stageProgressBar.style.width = (ratio * 100) + '%';
}

// AUTO ボタンの見た目を state に合わせる
export function updateAutoButton() {
  if (state.autoProgress) {
    $autoToggle.innerHTML = 'AUTO<br>ON';
    $autoToggle.classList.remove('off');
  } else {
    $autoToggle.innerHTML = 'AUTO<br>OFF';
    $autoToggle.classList.add('off');
  }
}

// UI のイベントリスナーを一括セットアップ
export function setupUI() {
  $autoToggle.addEventListener('click', () => {
    state.autoProgress = !state.autoProgress;
    updateAutoButton();
  });
}
