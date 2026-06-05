// =====================================================
//  DOM参照 - HTMLの要素を一箇所にまとめておく
//  どこからでも import { $battlefield } from './dom.js' で使える
// =====================================================

export const $battlefield        = document.getElementById('battlefield');
export const $slime              = document.getElementById('slime');
export const $goldDisplay        = document.getElementById('goldDisplay');
export const $upgrades           = document.getElementById('upgrades');
export const $stageLabel         = document.getElementById('stageLabel');
export const $stageProgressBar   = document.getElementById('stageProgressBar');
export const $stageProgressText  = document.getElementById('stageProgressText');
export const $autoToggle         = document.getElementById('autoToggle');

// ボス戦
export const $bossTimer          = document.getElementById('bossTimer');
export const $bossTimerBar       = document.getElementById('bossTimerBar');
export const $bossTimerText      = document.getElementById('bossTimerText');
export const $bossRetryBtn       = document.getElementById('bossRetryBtn');
export const $bossWarning        = document.getElementById('bossWarning');
