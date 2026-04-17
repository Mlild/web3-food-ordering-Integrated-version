import type { Metadata } from "next";

import { Web3Provider } from "@/components/providers/web3-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "MealVote — 手繪共識，鏈上點餐",
  description: "Group meal proposals, weighted on-chain voting, and wallet-gated ordering on Sepolia."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Manrope:wght@500;600;700;800&family=Noto+Sans+TC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {/* SVG filters for sketch effects */}
        <svg id="sketch-filters" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            <filter id="wobble">
              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" result="noise" seed="2" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:bg-primary focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-sketch"
          style={{ borderRadius: "10px 15px 12px 8px" }}
        >
          跳至主要內容
        </a>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
