"use client";

import type { MerchantBuilding } from "@/lib/api";

const SKINS: Record<string, { body: string; roof: string; trim: string; window: string }> = {
  oak: { body: "#C98A4A", roof: "#7A4D16", trim: "#F8E7D3", window: "#FFF5C2" },
  brick: { body: "#D97852", roof: "#8D3C2E", trim: "#F9E1D4", window: "#FFE7A8" },
  sand: { body: "#D7B679", roof: "#8D6A2D", trim: "#FFF4D9", window: "#FFF0B8" },
  copper: { body: "#C17B4A", roof: "#6A3F28", trim: "#F7E4D8", window: "#D9F4FF" },
  glass: { body: "#89B8D8", roof: "#2E5B78", trim: "#E9F7FF", window: "#FFFFFF" }
};

export function MerchantBuildingIllustration({
  building,
  compact = false,
  className = ""
}: {
  building: MerchantBuilding;
  compact?: boolean;
  className?: string;
}) {
  const skin = SKINS[building.skin] || SKINS.oak;
  const floors = Math.max(1, Math.min(10, building.floors || 1));
  const width = compact ? 120 : 180;
  const height = compact ? 144 : 220;
  const towerWidth = compact ? 54 : 82;
  const floorHeight = compact ? 10 : 13;
  const baseHeight = compact ? 18 : 24;
  const towerHeight = floors * floorHeight + 18;
  const left = (width - towerWidth) / 2;
  const top = height - baseHeight - towerHeight;
  const roofHeight = compact ? 12 : 18;
  const windowsPerFloor = compact ? 2 : 3;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={`${building.title} 建築圖`}
    >
      <rect x="8" y={height - baseHeight} width={width - 16} height={baseHeight} rx="10" fill="#F4E6D4" stroke="#C9A57A" strokeWidth="2" />
      <rect x={left} y={top} width={towerWidth} height={towerHeight} rx="12" fill={skin.body} stroke={skin.trim} strokeWidth="3" />
      <polygon
        points={`${left - 6},${top + 8} ${width / 2},${top - roofHeight} ${left + towerWidth + 6},${top + 8}`}
        fill={skin.roof}
        stroke={skin.trim}
        strokeWidth="3"
      />

      {Array.from({ length: floors }).map((_, floorIndex) => {
        const y = top + 16 + floorIndex * floorHeight;
        return (
          <g key={floorIndex}>
            <line x1={left + 5} y1={y - 2} x2={left + towerWidth - 5} y2={y - 2} stroke={skin.trim} strokeOpacity="0.45" />
            {Array.from({ length: windowsPerFloor }).map((__, windowIndex) => {
              const gap = towerWidth / (windowsPerFloor + 1);
              const windowX = left + gap * (windowIndex + 1) - (compact ? 5 : 6);
              return (
                <rect
                  key={windowIndex}
                  x={windowX}
                  y={y}
                  width={compact ? 10 : 12}
                  height={compact ? 7 : 9}
                  rx="2"
                  fill={skin.window}
                  stroke={skin.trim}
                  strokeWidth="1.4"
                />
              );
            })}
          </g>
        );
      })}

      <rect
        x={width / 2 - (compact ? 7 : 9)}
        y={height - baseHeight - (compact ? 16 : 22)}
        width={compact ? 14 : 18}
        height={compact ? 16 : 22}
        rx="4"
        fill={skin.roof}
        stroke={skin.trim}
        strokeWidth="2"
      />
    </svg>
  );
}

export function merchantBuildingBadgeClass(tone: MerchantBuilding["badges"][number]["tone"]) {
  if (tone === "gold") return "border-amber-300 bg-amber-50 text-amber-900";
  if (tone === "emerald") return "border-emerald-300 bg-emerald-50 text-emerald-900";
  if (tone === "blue") return "border-sky-300 bg-sky-50 text-sky-900";
  return "border-orange-300 bg-orange-50 text-orange-900";
}
