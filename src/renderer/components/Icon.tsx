// src/renderer/components/Icon.tsx
// 内联 SVG 图标集 — 替换 emoji
// emoji 在跨平台桌面应用中不可控：Windows 不渲染国旗、三平台字形差异巨大、
// 无法继承 currentColor、语义污染可见文本节点。本图标集 24×24、stroke 继承
// currentColor、aria-hidden（装饰性），语义由外层按钮/文本的 aria-label 承担。

const PATHS = {
  cfLogo: 'M12 3 8 9h8l-4-6ZM12 9v2M7 11h10M7 11v3M17 11v3M10 14v3M14 14v3M7 14H5M17 14h2',
  dna: 'M4 2c0 4 4 4 4 8s-4 4-4 8M12 2c0 4 4 4 4 8s-4 4-4 8M4 10h16M2 6c0 4 6 4 6 8s-6 4-6 8',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5ZM14 3v5h5',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  download: 'M12 3v12m0 0 4-4m-4 4-4-4M4 21h16',
  image: 'M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6',
  ruler: 'M3 17h18v3H3zM6 17V7h2v10M12 17V7h2v10',
  close: 'M6 6l12 12M18 6 6 18',
  tree: 'M12 22v-6M12 16 6 10M12 16l6-6M6 10V4M18 10V4',
  triangle: 'M12 4 3 20h18L12 4Z',
  table: 'M3 5h18v14H3zM3 10h18M9 10v9M15 10v9',
  link: 'M9 15l6-6M8 12l-2 2a3 3 0 0 0 4 4l2-2M16 12l2-2a3 3 0 0 0-4-4l-2 2',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  gear: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.4-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z',
  reset: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  warning: 'M12 3 2 20h20L12 3ZM12 9v5M12 17.5h.01',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M20 6 9 17l-5-5',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 8h.01M12 12v5',
  chevronDown: 'M6 9l6 6 6-6',
  trash: 'M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 11v6M14 11v6',
} as const

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  size = 16,
  className,
}: {
  name: IconName
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
