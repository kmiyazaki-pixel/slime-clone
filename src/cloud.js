// =====================================================
//  クラウド同期 - Supabase 経由でセーブをクラウドに保存
// =====================================================
//
//  使い方:
//   - 起動時に main.js が動的 import で読み込む
//   - bindCloud(schedulePush) で save.js のローカル保存に同期トリガを生やす
//   - onAuthChange で SIGNED_IN を受けたら pullAndApply() で取りに行く
//
//  保護:
//   - URL と Publishable key は公開しても良い設計
//   - 実際の権限制御は Supabase 側の Row Level Security (RLS) でやってる
//     → saves テーブルは自分の auth.uid() に紐づく行しか読み書きできない

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { snapshot, restore } from './save.js';

const SUPABASE_URL = 'https://ppruybnnqpwbhynyumyj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VB2RYVCZxHRYYrB_uWc7hw_G5UqtAtd';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // マジックリンクで戻ってきた時の token を URL hash から取る
  },
});

// =====================================================
//  Push (アップロード)
// =====================================================

let pushTimer = null;

// 公開: ローカル保存後に呼ばれる。連打を吸収するため 2 秒デバウンス
export function schedulePush() {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, 2000);
}

// 公開: いますぐ push (デバウンス無視。手動同期ボタン用)
export async function pushNow() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false, reason: 'not signed in' };

    const payload = snapshot();
    const { error } = await supabase.from('saves').upsert({
      user_id: session.user.id,
      data: payload,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('[cloud] push:', error.message);
      return { ok: false, reason: error.message };
    }
    return { ok: true };
  } catch (e) {
    console.warn('[cloud] push exception:', e && e.message);
    return { ok: false, reason: e?.message };
  }
}

// =====================================================
//  Pull (ダウンロード)
// =====================================================

// 公開: クラウドからセーブを取得し、ローカルより新しければ適用
//        戻り値: true = 適用した / false = しなかった (適用しなかったがエラーなしの場合も含む)
export async function pullAndApply() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { data: row, error } = await supabase
      .from('saves')
      .select('data, updated_at')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) {
      console.warn('[cloud] pull:', error.message);
      return false;
    }
    if (!row) return false; // クラウドにまだ何も無い

    const cloudTime = new Date(row.updated_at).getTime();
    const localTime = snapshot().savedAt || 0;

    if (cloudTime > localTime) {
      return restore(row.data);
    }
    return false; // ローカルの方が新しい → そのまま
  } catch (e) {
    console.warn('[cloud] pull exception:', e && e.message);
    return false;
  }
}

// =====================================================
//  Auth
// =====================================================

// 公開: メールアドレスにマジックリンクを送る
export async function signInWithEmail(email) {
  const redirectTo = window.location.origin + window.location.pathname;
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
}

// 公開: ログアウト
export async function signOut() {
  return supabase.auth.signOut();
}

// 公開: 現在のセッションを取る
export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// 公開: 認証状態の変化を監視
//   コールバックには (event, session) が渡る
//   event: 'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | ...
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => callback(event, session));
}
