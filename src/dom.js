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
