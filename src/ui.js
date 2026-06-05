// =====================================================
//  UI - ゴールド表示、強化パネルの描画、ステージ、ボス
// =====================================================

import { state } from './state.js';
import { CONFIG } from './config.js';
import {
  $battlefield,
  $playerLv,
  $goldDisplay,
  $gemDisplay,
  $upgrades,
  $upgradeGold,
  $stageBanner,
  $stageLabel,
  $stageProgressBar,
  $stageProgressText,
  $idleTimer,
  $autoToggle,
  $bossTimer,
  $bossTimerBar,
  $bossTimerText,
  $bossRetryBtn,
  $bossWarning,
  $settingsBtn,
  $authModal,
  $authModalBg,
  $authSignedOut,
  $authSignedIn,
  $authEmailInput,
  $authSendBtn,
  $authStatus,
  $authEmailDisplay,
  $authSyncBtn,
  $authLogoutBtn,
  $authCloseBtn,
  $authLoginDot,
  $idleModal,
  $idleModalBg,
  $idleModalElapsed,
  $idleModalCapMsg,
  $idleModalGold,
  $idleModalClaimBtn,
} from './dom.js';
import { formatNum, upgradeCost } from './utils.js';
import { retryBoss } from './stage.js';
import { saveGame } from './save.js';

// ゴールド表示を最新値に更新 (上部バーと強化パネル上の両方)
export function updateGoldDisplay() {
  const v = formatNum(state.gold);
  $goldDisplay.textContent = v;
  $upgradeGold.textContent = v;
}

// ジェム表示 (見た目だけ)
export function updateGemDisplay() {
  $gemDisplay.textContent = formatNum(state.gems);
}

// プレイヤーLv表示 (見た目だけ)
export function updatePlayerLv() {
  $playerLv.textContent = state.playerLv;
}

// 放置時間表示 (HH:MM:SS)
export function updateIdleTimer() {
  const total = Math.floor(state.idleSeconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  $idleTimer.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// 強化項目ごとの現在値ラベル
function getStatLabel(key) {
  if (key === 'attack')    return formatNum(state.attack);
  if (key === 'fireRate')  return `${state.shotInterval.toFixed(0)}ms`;
  if (key === 'multiShot') return `${state.shotCount}発`;
  if (key === 'critRate')  return `${(state.critChance * 100).toFixed(0)}%`;
  if (key === 'critDmg')   return `x${state.critMultiplier.toFixed(1)}`;
  if (key === 'goldBoost') return `+${Math.round((state.goldMultiplier - 1) * 100)}%`;
  if (key === 'pierce')    return `${state.pierceCount}回`;
  return '';
}

function getStatName(key) {
  if (key === 'attack')    return 'ダメージ';
  if (key === 'fireRate')  return '攻撃間隔';
  if (key === 'multiShot') return '同時発射数';
  if (key === 'critRate')  return '会心の確率';
  if (key === 'critDmg')   return '会心ダメージ';
  if (key === 'goldBoost') return 'ゴールド倍率';
  if (key === 'pierce')    return '貫通する敵数';
  return '';
}

// 強化パネル全体を再描画
export function renderUpgrades() {
  $upgrades.innerHTML = '';
  for (const [key, u] of Object.entries(state.upgrades)) {
    const cost = upgradeCost(u);
    const canAfford = state.gold >= cost;

    const row = document.createElement('div');
    row.className = `upgrade-row up-${key}`;
    row.innerHTML = `
      <div class="upg-icon-wrap">
        <div class="upg-icon">${u.icon}</div>
        <div class="upg-level">Lv ${u.level}</div>
      </div>
      <div class="upg-info">
        <div class="upg-name">${u.name}</div>
        <div class="upg-value">${getStatLabel(key)}</div>
        <div class="upg-substat">${getStatName(key)}</div>
      </div>
      <button class="upg-btn" ${canAfford ? '' : 'disabled'} data-key="${key}">
        <div class="upg-btn-label">強化</div>
        <div class="upg-cost">
          <span class="upg-cost-icon"></span>${formatNum(cost)}
        </div>
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
  saveGame();
}

// ボタンの有効/無効だけを軽く更新 (毎フレーム再描画は重いので)
export function refreshUpgradeButtons() {
  $upgrades.querySelectorAll('button[data-key]').forEach(btn => {
    const u = state.upgrades[btn.dataset.key];
    btn.disabled = state.gold < upgradeCost(u);
  });
}

// ステージ表示を更新 (ラベル + 進捗バー + ワールド別の景色テーマ)
export function updateStageDisplay() {
  // 4ワールドごとに景色テーマをループ (W1, W2, W3, W4, W1, ...)
  const theme = ((state.world - 1) % 4) + 1;
  $battlefield.dataset.world = String(theme);

  if (state.inBossFight) {
    $stageLabel.textContent = `BOSS ${state.world}`;
    $stageLabel.classList.add('boss');
    $stageProgressText.textContent = 'BOSS';
    $stageProgressBar.style.width = '100%';
    $stageProgressBar.classList.add('boss');
  } else {
    $stageLabel.textContent = `STAGE ${state.world}-${state.stage}`;
    $stageLabel.classList.remove('boss');
    $stageProgressText.textContent = `${state.killsInStage} / ${state.killsRequired}`;
    const ratio = Math.min(1, state.killsInStage / state.killsRequired);
    $stageProgressBar.style.width = (ratio * 100) + '%';
    $stageProgressBar.classList.remove('boss');
  }
}

// AUTO ボタンの見た目を state に合わせる
export function updateAutoButton() {
  const span = $autoToggle.querySelector('.auto-text');
  if (state.autoProgress) {
    span.innerHTML = 'AUTO<br>ON';
    $autoToggle.classList.remove('off');
  } else {
    span.innerHTML = 'AUTO<br>OFF';
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
  if (remain <= 5) {
    $bossTimer.classList.add('urgent');
  } else {
    $bossTimer.classList.remove('urgent');
  }
}

export function showBossTimer() {
  $bossTimer.hidden = false;
  // ボス戦中はステージバナーを隠してボスタイマーが目立つようにする
  $stageBanner.hidden = true;
}

export function hideBossTimer() {
  $bossTimer.hidden = true;
  $bossTimer.classList.remove('urgent');
  $stageBanner.hidden = false;
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

  // 下部ナビは見た目だけ (タップでアクティブ切替)
  document.querySelectorAll('.bottom-nav .nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bottom-nav .nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // ⚙ ボタンでクラウドセーブ/ログインのモーダルを開く
  $settingsBtn.addEventListener('click', openAuthModal);
  $authModalBg.addEventListener('click', closeAuthModal);
  $authCloseBtn.addEventListener('click', closeAuthModal);
  $authSendBtn.addEventListener('click', handleSendMagicLink);
  $authSyncBtn.addEventListener('click', handleManualSync);
  $authLogoutBtn.addEventListener('click', handleLogout);
  // Enter キーでもメール送信
  $authEmailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSendMagicLink();
  });
}

// =====================================================
//  画面全部を state に合わせて再描画 (クラウドから state が差し替わった後など)
// =====================================================
export function renderAll() {
  updatePlayerLv();
  updateGoldDisplay();
  updateGemDisplay();
  updateIdleTimer();
  updateStageDisplay();
  updateAutoButton();
  renderUpgrades();
}

// =====================================================
//  クラウド/認証モーダル
// =====================================================

// 遅延 import される cloud.js を差し込むためのスロット
let cloud = null;
export function bindCloud(mod) {
  cloud = mod;
  refreshAuthUI();
}

function openAuthModal() {
  $authModal.hidden = false;
  $authStatus.textContent = '';
  refreshAuthUI();
}

function closeAuthModal() {
  $authModal.hidden = true;
  $authStatus.textContent = '';
}

// セッション状態に合わせてモーダル内とドット表示を更新
export async function refreshAuthUI() {
  if (!cloud) {
    $authSignedOut.hidden = false;
    $authSignedIn.hidden = true;
    $authLoginDot.hidden = true;
    return;
  }
  const session = await cloud.getCurrentSession();
  if (session) {
    $authSignedOut.hidden = true;
    $authSignedIn.hidden = false;
    $authEmailDisplay.textContent = session.user.email || '(no email)';
    $authLoginDot.hidden = false;
  } else {
    $authSignedOut.hidden = false;
    $authSignedIn.hidden = true;
    $authLoginDot.hidden = true;
  }
}

async function handleSendMagicLink() {
  if (!cloud) {
    $authStatus.textContent = 'クラウドが読み込めていません';
    return;
  }
  const email = $authEmailInput.value.trim();
  if (!email || !email.includes('@')) {
    $authStatus.textContent = 'メールアドレスを入力してください';
    return;
  }
  $authStatus.textContent = '送信中…';
  $authSendBtn.disabled = true;
  try {
    const { error } = await cloud.signInWithEmail(email);
    if (error) {
      $authStatus.textContent = `エラー: ${error.message}`;
    } else {
      $authStatus.textContent = 'メールを送りました。届いたリンクを開いてください';
    }
  } catch (e) {
    $authStatus.textContent = `エラー: ${e && e.message}`;
  } finally {
    $authSendBtn.disabled = false;
  }
}

async function handleManualSync() {
  if (!cloud) return;
  $authStatus.textContent = '同期中…';
  const pushRes = await cloud.pushNow();
  const applied = await cloud.pullAndApply();
  if (applied) renderAll();
  $authStatus.textContent = pushRes.ok ? '同期しました' : `同期失敗: ${pushRes.reason || '不明'}`;
}

async function handleLogout() {
  if (!cloud) return;
  await cloud.signOut();
  $authStatus.textContent = 'ログアウトしました';
  refreshAuthUI();
}

// =====================================================
//  放置報酬ポップアップ
// =====================================================

function formatElapsed(seconds) {
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}時間 ${m}分`;
  if (m > 0) return `${m}分`;
  return `${total}秒`;
}

// 公開: 放置報酬のモーダルを表示 (reward は idle.js の computeIdleReward の戻り値)
export function showIdleReward(reward) {
  $idleModalElapsed.textContent = formatElapsed(reward.rawSeconds);
  $idleModalGold.textContent = formatNum(reward.gold);
  $idleModalCapMsg.hidden = !reward.cappedAtMax;
  $idleModal.hidden = false;

  // 受け取り処理 (毎回付け替え)
  $idleModalClaimBtn.onclick = () => {
    state.gold += reward.gold;
    updateGoldDisplay();
    $idleModal.hidden = true;
    saveGame();
  };
  // 背景クリックでも受け取り扱い (放置報酬は逃したくないので消すだけにせず加算)
  $idleModalBg.onclick = () => {
    $idleModalClaimBtn.onclick();
  };
}
