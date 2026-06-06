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
  $upgradePanel,
  $petPanel,
  $petGrid,
  $petPanelGold,
  $petPanelCount,
  $slimePanel,
  $slimeGrid,
  $slimePanelGold,
  $slimePanelCount,
  $slime,
  $skillPanel,
  $skillGrid,
  $skillPanelGold,
  $skillPanelCount,
} from './dom.js';
import { formatNum, upgradeCost } from './utils.js';
import { retryBoss } from './stage.js';
import { saveGame } from './save.js';
import { buyPet, getOwnedPetIds } from './pet.js';
import { buySlime, equipSlime } from './slime.js';
import { buySkill, useSkill, isSkillReady } from './skill.js';

// ゴールド表示を最新値に更新 (上部バー、強化パネル、ペット、スライム、スキル)
export function updateGoldDisplay() {
  const v = formatNum(state.gold);
  $goldDisplay.textContent = v;
  $upgradeGold.textContent = v;
  $petPanelGold.textContent = v;
  $slimePanelGold.textContent = v;
  $skillPanelGold.textContent = v;
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
  if (key === 'multiShot') return `${(state.doubleShotChance * 100).toFixed(0)}%`;
  if (key === 'tripleShot') return `${(state.tripleShotChance * 100).toFixed(0)}%`;
  if (key === 'critRate')  return `${(state.critChance * 100).toFixed(0)}%`;
  if (key === 'critDmg')   return `x${state.critMultiplier.toFixed(1)}`;
  if (key === 'goldBoost') return `+${Math.round((state.goldMultiplier - 1) * 100)}%`;
  if (key === 'pierce')    return `${state.pierceCount}回`;
  return '';
}

function getStatName(key) {
  if (key === 'attack')    return 'ダメージ';
  if (key === 'fireRate')  return '攻撃間隔';
  if (key === 'multiShot') return '2発目の確率';
  if (key === 'tripleShot') return '3発撃てる確率';
  if (key === 'critRate')  return '会心の確率';
  if (key === 'critDmg')   return '会心ダメージ';
  if (key === 'goldBoost') return 'ゴールド倍率';
  if (key === 'pierce')    return '貫通する敵数';
  return '';
}

// 強化が cap (上限) に達してるか
function isUpgradeMaxed(key) {
  if (key === 'critRate') return state.critChance >= 1.0;
  if (key === 'multiShot') return state.doubleShotChance >= 1.0;
  if (key === 'tripleShot') return state.tripleShotChance >= 1.0;
  if (key === 'fireRate')  return state.shotInterval <= 50;
  return false;
}

// =====================================================
//  強化の長押し連射: タップで1回、400ms 押し続けたら 80ms 間隔で連発
// =====================================================
let _holdTimer = null;
let _holdInterval = null;

function startUpgradeHold(key) {
  stopUpgradeHold();
  buyUpgrade(key);  // 即時 1回

  // 400ms 後に連射開始
  _holdTimer = setTimeout(() => {
    _holdInterval = setInterval(() => {
      const u = state.upgrades[key];
      if (!u) { stopUpgradeHold(); return; }
      if (isUpgradeMaxed(key)) { stopUpgradeHold(); return; }
      if (state.gold < upgradeCost(u)) { stopUpgradeHold(); return; }
      buyUpgrade(key);
    }, 80);
  }, 400);
}

function stopUpgradeHold() {
  clearTimeout(_holdTimer);
  clearInterval(_holdInterval);
  _holdTimer = null;
  _holdInterval = null;
}

// 強化パネル全体を再描画
export function renderUpgrades() {
  $upgrades.innerHTML = '';
  for (const [key, u] of Object.entries(state.upgrades)) {
    const cost = upgradeCost(u);
    const canAfford = state.gold >= cost;
    const maxed = isUpgradeMaxed(key);

    const row = document.createElement('div');
    row.className = `upgrade-row up-${key}` + (maxed ? ' maxed' : '');
    const btnInner = maxed
      ? `<div class="upg-btn-label">MAX</div>`
      : `<div class="upg-btn-label">強化</div>
         <div class="upg-cost"><span class="upg-cost-icon"></span>${formatNum(cost)}</div>`;
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
      <button class="upg-btn" ${(maxed || !canAfford) ? 'disabled' : ''} data-key="${key}">
        ${btnInner}
      </button>
    `;
    $upgrades.appendChild(row);
  }

  // クリック/長押しのリスナは setupUI でデリゲートしてるので、ここでは付けない
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
// 強化 + ペット購入 + スライム購入 + スキル購入 のボタンを全部対象にする
export function refreshUpgradeButtons() {
  $upgrades.querySelectorAll('button[data-key]').forEach(btn => {
    const key = btn.dataset.key;
    const u = state.upgrades[key];
    btn.disabled = isUpgradeMaxed(key) || state.gold < upgradeCost(u);
  });
  // ペット購入ボタン
  $petGrid.querySelectorAll('button[data-pet-id]').forEach(btn => {
    const id = btn.dataset.petId;
    const def = CONFIG.PETS[id];
    if (def) btn.disabled = state.gold < def.cost;
  });
  // スライム購入ボタン (data-action="buy" のみ。装備ボタンは触らない)
  $slimeGrid.querySelectorAll('button[data-action="buy"]').forEach(btn => {
    const id = btn.dataset.slimeId;
    const def = CONFIG.SLIMES[id];
    if (def) btn.disabled = state.gold < def.cost;
  });
  // スキル購入ボタン
  $skillGrid.querySelectorAll('button[data-skill-id]').forEach(btn => {
    const id = btn.dataset.skillId;
    const def = CONFIG.SKILLS[id];
    if (def) btn.disabled = state.gold < def.cost;
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

  // 下部ナビ: タブ切替 (hero=スライム / pet=ペット / dungeon=スキル / forge=強化)
  document.querySelectorAll('.bottom-nav .nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab === 'hero' || tab === 'pet' || tab === 'dungeon') {
        activateTab(tab);
      } else {
        activateTab('forge');
      }
    });
  });

  // アクションバーのスキルボタン: タップで発動
  document.querySelectorAll('.skill-btn[data-skill]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.skill;
      if (!state.skills[id] || !state.skills[id].owned) {
        // 未所有 → スキルパネルを開いて誘導
        activateTab('dungeon');
        return;
      }
      useSkill(id);
    });
  });
  // 将来用の空スロット (data-skill-empty) もタップでスキルページへ
  document.querySelectorAll('.skill-btn[data-skill-empty]').forEach(btn => {
    btn.addEventListener('click', () => activateTab('dungeon'));
  });

  // 強化ボタンの長押し連射: パネルにデリゲート + 文書全体で離した時に停止
  $upgrades.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('button[data-key]');
    if (!btn || btn.disabled) return;
    e.preventDefault();
    startUpgradeHold(btn.dataset.key);
  });
  document.addEventListener('pointerup', stopUpgradeHold);
  document.addEventListener('pointercancel', stopUpgradeHold);

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
  renderPetSprites();
  updateSlimeVisual();
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

// =====================================================
//  ペット (専用パネル + スプライト)
// =====================================================

// 下部ナビのタブ切替: hero / pet / dungeon / forge で出すパネルを切り替える
//   その他 (shop) はぜんぶ強化パネル (forge) にフォールバックする
function activateTab(tabName) {
  document.querySelectorAll('.bottom-nav .nav-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.bottom-nav .nav-btn[data-tab="${tabName}"]`);
  if (btn) btn.classList.add('active');

  const showPet = tabName === 'pet';
  const showHero = tabName === 'hero';
  const showSkill = tabName === 'dungeon';
  $upgradePanel.hidden = showPet || showHero || showSkill;
  $petPanel.hidden = !showPet;
  $slimePanel.hidden = !showHero;
  $skillPanel.hidden = !showSkill;

  if (showPet) renderPetGrid();
  if (showHero) renderSlimeGrid();
  if (showSkill) renderSkillGrid();
}

// 全体描画 (購入・state 変化のたびに呼ぶ)
function renderPetGrid() {
  // 所持数表示も更新
  const totalCount = Object.keys(CONFIG.PETS).length;
  const ownedCount = Object.values(state.pets).filter(p => p && p.owned).length;
  $petPanelCount.textContent = `${ownedCount} / ${totalCount}`;

  $petGrid.innerHTML = '';
  for (const [id, def] of Object.entries(CONFIG.PETS)) {
    const owned = !!(state.pets[id] && state.pets[id].owned);
    const canAfford = state.gold >= def.cost;
    const card = document.createElement('div');
    card.className = 'pet-card' + (owned ? ' owned' : '');
    if (owned) {
      card.innerHTML = `
        <div class="pet-card-icon">${def.icon}</div>
        <div class="pet-card-name">${def.name}</div>
        <div class="pet-card-desc">${def.desc}</div>
        <div class="pet-card-owned-label">所持</div>
      `;
    } else {
      card.innerHTML = `
        <div class="pet-card-icon">${def.icon}</div>
        <div class="pet-card-name">${def.name}</div>
        <div class="pet-card-desc">${def.desc}</div>
        <button class="pet-card-buy" data-pet-id="${id}" ${canAfford ? '' : 'disabled'}>
          <div class="pet-card-buy-label">購入</div>
          <div class="pet-card-buy-cost"><span class="coin-icon-mini"></span>${formatNum(def.cost)}</div>
        </button>
      `;
      // カード全体タップで購入可能
      card.addEventListener('click', () => {
        if (state.gold >= def.cost && !state.pets[id]?.owned) handleBuyPet(id);
      });
    }
    $petGrid.appendChild(card);
  }
}

function handleBuyPet(petId) {
  const ok = buyPet(petId);
  if (!ok) return;
  updateGoldDisplay();
  renderPetGrid();
  renderPetSprites();
  // 強化パネルの表示値 (クリ確率など) もペット買うと変わる
  renderUpgrades();
  saveGame();
}

// =====================================================
//  スライム選択パネル (左タブ = hero)
// =====================================================

// 戦場のスライムの色を装備中の id に合わせる
export function updateSlimeVisual() {
  $slime.dataset.slimeType = state.activeSlimeId || 'green';
}

// スライムグリッドを再描画
function renderSlimeGrid() {
  const totalCount = Object.keys(CONFIG.SLIMES).length;
  const ownedCount = Object.values(state.slimes).filter(s => s && s.owned).length;
  $slimePanelCount.textContent = `${ownedCount} / ${totalCount}`;

  $slimeGrid.innerHTML = '';
  for (const [id, def] of Object.entries(CONFIG.SLIMES)) {
    const owned = !!(state.slimes[id] && state.slimes[id].owned);
    const active = state.activeSlimeId === id;
    const canAfford = state.gold >= def.cost;

    const card = document.createElement('div');
    card.className = 'pet-card' + (owned ? ' owned' : '');
    if (active) card.classList.add('equipped');

    let actionHtml;
    if (active) {
      actionHtml = `<div class="pet-card-owned-label">装備中</div>`;
    } else if (owned) {
      actionHtml = `<button class="pet-card-buy" data-action="equip" data-slime-id="${id}">
        <div class="pet-card-buy-label">装備</div>
      </button>`;
    } else {
      actionHtml = `<button class="pet-card-buy" data-action="buy" data-slime-id="${id}" ${canAfford ? '' : 'disabled'}>
        <div class="pet-card-buy-label">購入</div>
        <div class="pet-card-buy-cost"><span class="coin-icon-mini"></span>${formatNum(def.cost)}</div>
      </button>`;
    }

    card.innerHTML = `
      <div class="pet-card-icon">
        <div class="slime-card-preview" data-slime-type="${id}"></div>
      </div>
      <div class="pet-card-name">${def.name}</div>
      <div class="pet-card-desc">${def.desc}</div>
      ${actionHtml}
    `;

    // カード全体をタップしても買える/装備できるように
    card.addEventListener('click', () => {
      if (state.activeSlimeId === id) return;
      if (state.slimes[id]?.owned) handleEquipSlime(id);
      else if (state.gold >= def.cost) handleBuySlime(id);
    });

    $slimeGrid.appendChild(card);
  }
}

function handleBuySlime(slimeId) {
  if (!buySlime(slimeId)) return;
  // 購入したら自動で装備
  equipSlime(slimeId);
  updateGoldDisplay();
  updateSlimeVisual();
  renderSlimeGrid();
  saveGame();
}

function handleEquipSlime(slimeId) {
  if (!equipSlime(slimeId)) return;
  updateSlimeVisual();
  renderSlimeGrid();
  saveGame();
}

// =====================================================
//  スキル選択パネル (中央タブ = dungeon) + アクションバー視覚
// =====================================================

function renderSkillGrid() {
  const totalCount = Object.keys(CONFIG.SKILLS).length;
  const ownedCount = Object.values(state.skills).filter(s => s && s.owned).length;
  $skillPanelCount.textContent = `${ownedCount} / ${totalCount}`;

  $skillGrid.innerHTML = '';
  for (const [id, def] of Object.entries(CONFIG.SKILLS)) {
    const owned = !!(state.skills[id] && state.skills[id].owned);
    const canAfford = state.gold >= def.cost;

    const card = document.createElement('div');
    card.className = 'pet-card skill-card' + (owned ? ' owned' : '');

    let action;
    if (owned) {
      action = `<div class="pet-card-owned-label">所有</div>`;
    } else {
      action = `<button class="pet-card-buy" data-skill-id="${id}" ${canAfford ? '' : 'disabled'}>
        <div class="pet-card-buy-label">購入</div>
        <div class="pet-card-buy-cost"><span class="coin-icon-mini"></span>${formatNum(def.cost)}</div>
      </button>`;
    }

    card.innerHTML = `
      <div class="pet-card-icon">${def.icon}</div>
      <div class="pet-card-name">${def.name}</div>
      <div class="pet-card-desc">${def.desc}</div>
      <div class="skill-card-cd">CD ${def.cooldown}s</div>
      ${action}
    `;

    if (!owned) {
      card.addEventListener('click', () => {
        if (state.gold >= def.cost && !state.skills[id]?.owned) handleBuySkill(id);
      });
    }
    $skillGrid.appendChild(card);
  }
}

function handleBuySkill(id) {
  if (!buySkill(id)) return;
  updateGoldDisplay();
  renderSkillGrid();
  updateActionBarSkillUI();
  saveGame();
}

// アクションバーのスキルボタンの状態を毎フレーム反映:
//   - 未所有 → locked クラス
//   - 所有 + CD中 → cd 残秒数表示、暗くする
//   - 所有 + 発動可 → 明るくする
export function updateActionBarSkillUI() {
  document.querySelectorAll('.skill-btn[data-skill]').forEach(btn => {
    const id = btn.dataset.skill;
    const owned = !!(state.skills[id] && state.skills[id].owned);
    const cd = state.skillCooldowns[id] || 0;
    btn.classList.toggle('skill-locked', !owned);
    btn.classList.toggle('skill-on-cd', owned && cd > 0);
    btn.classList.toggle('skill-ready', owned && cd <= 0);
    const cdEl = btn.querySelector('.skill-cd');
    if (cdEl) {
      cdEl.textContent = owned && cd > 0 ? Math.ceil(cd) : '';
    }
  });
}

// 戦場に所有ペットのスプライトを並べる (購入時 + ロード時に呼ぶ)
// 4個ずつ折り返して上に段を増やす (種類が増えても重ならない)
export function renderPetSprites() {
  $battlefield.querySelectorAll('.pet-sprite').forEach(el => el.remove());
  const owned = getOwnedPetIds();
  const COLS = 4;
  owned.forEach((id, i) => {
    const def = CONFIG.PETS[id];
    if (!def) return;
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const el = document.createElement('div');
    el.className = `pet-sprite pet-${id}`;
    el.style.left = (8 + col * 22) + 'px';
    el.style.bottom = (22 + row * 11 + (col % 2) * 3) + '%';
    el.textContent = def.icon;
    $battlefield.appendChild(el);
  });
}
