// =====================================================
//  DOM参照 - HTMLの要素を一箇所にまとめておく
//  どこからでも import { $battlefield } from './dom.js' で使える
// =====================================================

export const $battlefield        = document.getElementById('battlefield');
export const $slime              = document.getElementById('slime');

// 上部ステータスバー
export const $playerLv           = document.getElementById('playerLv');
export const $goldDisplay        = document.getElementById('goldDisplay');
export const $gemDisplay         = document.getElementById('gemDisplay');

// 戦場オーバーレイ
export const $stageBanner        = document.getElementById('stageBanner');
export const $stageLabel         = document.getElementById('stageLabel');
export const $stageProgressBar   = document.getElementById('stageProgressBar');
export const $stageProgressText  = document.getElementById('stageProgressText');
export const $idleTimer          = document.getElementById('idleTimer');

// アクションバー
export const $autoToggle         = document.getElementById('autoToggle');

// 強化パネル
export const $upgrades           = document.getElementById('upgrades');
export const $upgradeGold        = document.getElementById('upgradeGold');

// ボス戦
export const $bossTimer          = document.getElementById('bossTimer');
export const $bossTimerBar       = document.getElementById('bossTimerBar');
export const $bossTimerText      = document.getElementById('bossTimerText');
export const $bossRetryBtn       = document.getElementById('bossRetryBtn');
export const $bossWarning        = document.getElementById('bossWarning');

// 認証/クラウド (上部バーの ⚙ ボタン → モーダル)
export const $settingsBtn        = document.querySelector('.settings-btn');
export const $authModal          = document.getElementById('authModal');
export const $authModalBg        = document.getElementById('authModalBg');
export const $authSignedOut      = document.getElementById('authSignedOut');
export const $authSignedIn       = document.getElementById('authSignedIn');
export const $authEmailInput     = document.getElementById('authEmailInput');
export const $authSendBtn        = document.getElementById('authSendBtn');
export const $authStatus         = document.getElementById('authStatus');
export const $authEmailDisplay   = document.getElementById('authEmailDisplay');
export const $authSyncBtn        = document.getElementById('authSyncBtn');
export const $authLogoutBtn      = document.getElementById('authLogoutBtn');
export const $authCloseBtn       = document.getElementById('authCloseBtn');
export const $authLoginDot       = document.getElementById('authLoginDot');

// 放置報酬モーダル
export const $idleModal          = document.getElementById('idleModal');
export const $idleModalBg        = document.getElementById('idleModalBg');
export const $idleModalElapsed   = document.getElementById('idleModalElapsed');
export const $idleModalCapMsg    = document.getElementById('idleModalCapMsg');
export const $idleModalGold      = document.getElementById('idleModalGold');
export const $idleModalClaimBtn  = document.getElementById('idleModalClaimBtn');
