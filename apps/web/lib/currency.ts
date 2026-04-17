"use client";

export const WEI_PER_ETH = 10n ** 18n;
export const APPROX_TWD_PER_ETH = 120000n;

function parseWei(value: string | number | bigint) {
  try {
    return BigInt(value || 0);
  } catch {
    return 0n;
  }
}

export function formatEth(value: string | number | bigint, decimals = 4) {
  const wei = parseWei(value);
  const integer = wei / WEI_PER_ETH;
  if (decimals <= 0) return `${integer.toString()} ETH`;

  const scale = 10n ** BigInt(decimals);
  const fraction = ((wei % WEI_PER_ETH) * scale) / WEI_PER_ETH;
  const fractionText = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${integer.toString()}${fractionText ? `.${fractionText}` : ""} ETH`;
}

export function formatTwdFromWei(value: string | number | bigint) {
  const wei = parseWei(value);
  const twd = Number((wei * APPROX_TWD_PER_ETH) / WEI_PER_ETH);
  return `NT$${twd.toLocaleString("zh-TW")}`;
}

export function formatWeiAsTwdEth(value: string | number | bigint, ethDecimals = 4) {
  return `${formatTwdFromWei(value)} / ${formatEth(value, ethDecimals)}`;
}
