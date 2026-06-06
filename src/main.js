// =====================================================
//  エントリポイント - 初期化とゲームループ
// =====================================================

import { state } from './state.js';
import { CONFIG } from './config.js';
import { $battlefield } from './dom.js';
import { spawnEnemy, findNearestEnemy, updateEnemies } from './enemy.js';
import { fireAt, firePetAt, updateProjectiles } from './projectile.js';
import { getOwnedPetIds } from './pet.js';
import { endBossFight, startBossFight } from './stage.js';
import { bindUI } from './effects.js';
import { saveGame, loadGame, bindCloud as bindCloudSave, getLastSavedTime } from './save.js';
import { computeIdleReward } from './idle.js';
import {
  updateGoldDisplay,
  updateGemDisplay,
  updatePlayerLv,
  updateIdleTimer,
  renderUpgrades,
  refreshUpgradeButtons,
  updateStageDisplay,
  updateAutoButton,
  updateBossTimer,
  setupUI,
  renderAll,
  bindCloud as bindCloudUI,
  refreshAuthUI,
  showIdleReward,
  renderPetSprites,
  updateSlimeVisual,
} from './ui.js';

// プレイヤーの位置を「スライムの実 DOM 中心」に合わせる
//   弾の発射点もここを基準にするので、見た目とぴったり合うようになる
function setPlayerY() {
  const slime = document.getElementById('slime');
  if (slime && slime.offsetWidth) {
    state.player.x = slime.offsetLeft + slime.offsetWidth / 2;
    state.player.y = slime.offsetTop + slime.offsetHeight / 2;
  } else {
    // フォールバック (init で DOM がまだ無い等の予防策)
    const fieldH = $battlefield.clientHeight;
    state.player.y = fieldH * CONFIG.GROUND_RATIO + 20;
    state.player.x = CONFIG.PLAYER_X;
  }
}

// =====================================================
//  ゲームループ
// =====================================================
let lastFrame = performance.now();

function gameLoop(now) {
  // dt = 前フレームからの経過秒数 (フレームレート非依存)
  // 上限 0.05 はタブが裏で長時間止まった後のジャンプ防止
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;

  // 移動モード (敵集団 → 走る → 次の集団) の状態遷移
  if (state.slimeMode === 'traveling') {
    state.travelTimer -= dt;
    if (state.travelTimer <= 0) {
      state.slimeMode = 'fighting';
      state.travelTimer = 0;
      state.enemiesSpawnedThisStage = 0;
    }
  }
  $battlefield.classList.toggle('traveling', state.slimeMode === 'traveling');

  // 敵スポーン:
  //   - ボス戦中は止める
  //   - traveling 中は止める (次の集団に向かって走ってる最中)
  //   - この stage で killsRequired 体まで spawn したら止める (敵が積み上がらないように)
  if (!state.inBossFight
      && state.slimeMode === 'fighting'
      && state.enemiesSpawnedThisStage < state.killsRequired
      && now - state.lastSpawn > CONFIG.SPAWN_INTERVAL) {
    state.lastSpawn = now;
    spawnEnemy();
    state.enemiesSpawnedThisStage++;
  }

  // ボスタイマー
  if (state.inBossFight) {
    state.bossTimer -= dt;
    updateBossTimer();
    if (state.bossTimer <= 0) {
      endBossFight(false);
    }
  }

  // 放置タイマー (見た目用)
  state.idleSeconds += dt;

  // 敵の移動
  updateEnemies(dt);

  // 自動射撃 (一定間隔で一番近い敵を撃つ。マルチショットなら扇状に)
  // ペットとスライム両方の interval バフを反映
  const effectiveInterval = state.shotInterval * state.petFireRateMul * state.slimeFireRateMul;
  if (now - state.lastShot > effectiveInterval) {
    const t = findNearestEnemy();
    if (t) {
      fireAt(t);
      state.lastShot = now;
    }
  }

  // ペットも自前で撃つ (各ペット個別のクールダウン)
  const ownedPets = getOwnedPetIds();
  if (ownedPets.length > 0) {
    const target = findNearestEnemy();
    if (target) {
      ownedPets.forEach((petId, idx) => {
        const def = CONFIG.PETS[petId];
        if (!def) return;
        const pet = state.pets[petId];
        if (!pet.lastShot) pet.lastShot = 0;
        if (now - pet.lastShot > def.fireInterval) {
          const damage = state.attack * def.damageRatio;
          firePetAt(target, idx, damage);
          pet.lastShot = now;
        }
      });
    }
  }

  // 弾の移動と衝突判定
  updateProjectiles(dt);

  // 死んだもの・期限切れを配列から除去
  state.enemies     = state.enemies.filter(e => e.alive);
  state.projectiles = state.projectiles.filter(p => p.life > 0);

  requestAnimationFrame(gameLoop);
}

// =====================================================
//  初期化
// =====================================================
function init() {
  // effects.js に updateGoldDisplay を渡す (循環依存回避)
  bindUI(updateGoldDisplay);

  // まずセーブから state を復元 (なければデフォルトのまま)
  loadGame();
  // mid-stage で離脱 → リロードでもその stage で必要な残り体数だけ spawn するように
  state.enemiesSpawnedThisStage = state.killsInStage;

  updatePlayerLv();
  updateGoldDisplay();
  updateGemDisplay();
  updateIdleTimer();
  updateStageDisplay();
  updateAutoButton();
  renderUpgrades();
  renderPetSprites();   // 所有ペットのスプライトを戦場に並べる
  updateSlimeVisual();  // 装備中スライムの色を戦場に反映
  setupUI();
  // renderUpgrades / renderPetSprites でレイアウトが確定したあとに
  // スライム DOM の中心位置を player に反映 (= 弾の発射点)
  setPlayerY();

  // ボス戦中にセーブされた = state.stage === 10 なら復帰時にボス戦を再開
  if (state.stage === 10 && !state.inBossFight) {
    startBossFight();
  }

  // 放置報酬チェック (起動時に1回だけ。クラウド同期完了後 or タイムアウトで実行)
  let idleChecked = false;
  function checkIdleReward() {
    if (idleChecked) return;
    idleChecked = true;
    const savedAt = getLastSavedTime();
    if (!savedAt) return; // セーブがない初回起動は対象外
    const elapsed = (Date.now() - savedAt) / 1000;
    if (elapsed < CONFIG.IDLE_REWARD.MIN_SECONDS) return;
    const reward = computeIdleReward(elapsed);
    if (reward.gold > 0) showIdleReward(reward);
  }

  // クラウド同期 (Supabase) は遅延ロード。失敗してもゲームは続行
  import('./cloud.js').then(cloud => {
    bindCloudSave(cloud.schedulePush);
    bindCloudUI(cloud);

    // 起動時・サインイン時にクラウドから引っ張ってきて適用
    cloud.onAuthChange(async (event) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        const applied = await cloud.pullAndApply();
        if (applied) {
          renderAll();
          if (state.stage === 10 && !state.inBossFight) startBossFight();
        } else {
          // クラウドが空 or ローカルが新しい → 今の状態を push しておく
          cloud.schedulePush();
        }
        // クラウド同期完了後に放置報酬を判定 (別端末プレイ分は不在扱いにしない)
        checkIdleReward();
      }
      refreshAuthUI();
    });
  }).catch(e => {
    console.warn('[cloud] unavailable, offline mode:', e && e.message);
    checkIdleReward();
  });

  // フェイルセーフ: クラウドが 3秒以内に応答しなくても放置報酬は出す
  setTimeout(checkIdleReward, 3000);

  // ウィンドウサイズ変更時にプレイヤー位置を再計算
  window.addEventListener('resize', setPlayerY);

  // ゴールドが増えたら買えるようになったボタンを有効化
  setInterval(refreshUpgradeButtons, 200);
  // 放置タイマー (見た目用) は1秒ごとに更新
  setInterval(updateIdleTimer, 1000);

  // セーブのトリガ:
  //  - 10秒ごとの保険 (ゴールド増分など細かい変化用)
  //  - タブが隠れた時 (アプリ閉じる/別タブ移動)
  //  - ページ離脱前
  setInterval(saveGame, 10000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) saveGame();
  });
  window.addEventListener('beforeunload', saveGame);

  requestAnimationFrame(gameLoop);
}

init();
