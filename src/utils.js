// =====================================================
//  ユーティリティ関数
// =====================================================

// 大きい数字を A, B, C ... 表記で短縮 (スライム伝説風)
//   999       → "999"
//   1000      → "1.00A"
//   25600     → "25.6A"
//   144000    → "144A"
//   1.23e6    → "1.23B"
//   1.23e9    → "1.23C"
//   ... Z まで26階層、その先は AA, AB, AC ...

const TIERS = (() => {
  const arr = [];
  for (let i = 0; i < 26; i++) arr.push(String.fromCharCode(65 + i)); // A-Z
  for (let a = 0; a < 26; a++) {
    for (let b = 0; b < 26; b++) {
      arr.push(String.fromCharCode(65 + a) + String.fromCharCode(65 + b)); // AA-ZZ
    }
  }
  return arr;
})();

// 値の桁数で小数の数を調整
//   100以上 → 整数 (144 → "144")
//   100未満 → 最大2桁、ただし末尾のゼロは削る
//     25.60 → "25.6"、144.00 → "144"、1.00 → "1"、65.31 → "65.31"
function formatTier(val) {
  if (val >= 100) return val.toFixed(0);
  const s = val.toFixed(2);
  return s.replace(/0+$/, '').replace(/\.$/, '');
}

export function formatNum(n) {
  if (!isFinite(n)) return '∞';
  if (n < 0) return '-' + formatNum(-n);
  if (n < 1000) return Math.floor(n).toString();

  let tier = 0;
  let val = n;
  while (val >= 1000 && tier < TIERS.length - 1) {
    val /= 1000;
    tier++;
  }

  let str = formatTier(val);
  // 端数の繰り上がりで 1000 を超えたら次の段へ
  if (parseFloat(str) >= 1000 && tier < TIERS.length - 1) {
    val /= 1000;
    tier++;
    str = formatTier(val);
  }

  return str + TIERS[tier - 1];
}

// 強化コストの計算 (指数成長)
//   Lv1: baseCost
//   Lv2: baseCost * costMul
//   Lv3: baseCost * costMul^2
export function upgradeCost(u) {
  return Math.floor(u.baseCost * Math.pow(u.costMul, u.level - 1));
}
