// =====================================================
//  UI - ゴールド表示、強化パネルの描画、ステージ、ボス
// =====================================================

import { state } from './state.js';
import { CONFIG } from './config.js';
import {
  $goldDisplay,
  $upgrades,
  $stageLabel,
  $stageProgressBar,
  $stageProgressText,
  $autoToggle,
  $bossTimer,
  $bossTimerBar,
  $bossTimerText,
  $bossRetryBtn,
  $bossWarning,
} from './dom.js';
import { formatNum, upgradeCost } from './utils.js';
import { retryBoss } from './stage.js';

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
  if (state.inBossFight) {
    $stageLabel.textContent = `BOSS ${state.world}`;
    $stageLabel.classList.add('boss');
    $stageProgressText.textContent = 'BOSS FIGHT';
    $stageProgressBar.style.width = '100%';
    $stageProgressBar.classList.add('boss');
  } else {
    $stageLabel.textContent = `${state.world}-${state.stage}`;
    $stageLabel.classList.remove('boss');
    $stageProgressText.textContent = `${state.killsInStage} / ${state.killsRequired}`;
    const ratio = Math.min(1, state.killsInStage / state.killsRequired);
    $stageProgressBar.style.width = (ratio * 100) + '%';
    $stageProgressBar.classList.remove('boss');
  }
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

// =====================================================
//  ボスUI
// =====================================================

// ボスタイマー表示を更新
export function updateBossTimer() {
  const remain = Math.max(0, state.bossTimer);
  $bossTimerText.textContent = Math.ceil(remain);
  const ratio = remain / CONFIG.BOSS.TIMER_SECONDS;
  $bossTimerBar.style.width = (ratio * 100) + '%';
  // 残り5秒で赤く点滅
  if (remain <= 5) {
    $bossTimer.classList.add('urgent');
  } else {
    $bossTimer.classList.remove('urgent');
  }
}

export function showBossTimer() {
  $bossTimer.hidden = false;
}

export function hideBossTimer() {
  $bossTimer.hidden = true;
  $bossTimer.classList.remove('urgent');
}

export function showRetryButton() {
  $bossRetryBtn.hidden = false;
}

export function hideRetryButton() {
  $bossRetryBtn.hidden = true;
}

// ボス出現警告フラッシュ
export function showBossWarning() {
  $bossWarning.hidden = false;
  $bossWarning.classList.remove('flash');
  // 強制リフロー → 次フレームで animation 再起動
  void $bossWarning.offsetWidth;
  $bossWarning.classList.add('flash');
  setTimeout(() => {
    $bossWarning.hidden = true;
    $bossWarning.classList.remove('flash');
  }, 1200);
}

// UI のイベントリスナーを一括セットアップ
export function setupUI() {
  $autoToggle.addEventListener('click', () => {
    state.autoProgress = !state.autoProgress;
    updateAutoButton();
  });

  $bossRetryBtn.addEventListener('click', () => {
    hideRetryButton();
    retryBoss();
  });
}
