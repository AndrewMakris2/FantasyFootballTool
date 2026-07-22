import type { Platform } from "../types/league";

export function PlatformBadge({ platform }: { platform: Platform }) {
  return <span className={`platform-badge platform-badge--${platform}`}>{platform}</span>;
}
