// =====================================================
//  ユーティリティ関数
// =====================================================

// 大きい数字を 1.23K, 1.23M ... のように短縮表示
//   1000 → "1.00K"
//   1234567 → "1.23M"
const NUM_UNITS = ['', 'K', 'M', 'B', 'T', 'aa', 'bb', 'cc', 'dd', 'ee'];

export function formatNum(n) {
  if (n < 1000) return Math.floor(n).toString();
  let i = 0;
  while (n >= 1000 && i < NUM_UNITS.length - 1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(2) + NUM_UNITS[i];
}

// 強化コストの計算 (指数成長)
//   Lv1: baseCost
//   Lv2: baseCost * costMul
//   Lv3: baseCost * costMul^2
export function upgradeCost(u) {
  return Math.floor(u.baseCost * Math.pow(u.costMul, u.level - 1));
}
