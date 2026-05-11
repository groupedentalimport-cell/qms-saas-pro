import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format an ISO date string for display, avoiding toLocaleDateString
 * to prevent hydration mismatches in SSR.
 * Returns format like "15 May 2024" or "15/05/2024" (short).
 */
export function formatDate(dateStr: string | undefined | null, short = false): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  if (short) return `${day}/${month}/${String(year).slice(-2)}`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[d.getUTCMonth()]} ${year}`;
}
