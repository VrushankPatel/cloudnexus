import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return targetDate.toLocaleDateString();
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('document')) return '📝';
  if (mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('presentation')) return '📈';
  if (mimeType === 'application/folder') return '📁';
  return '📄';
}

export function getFileTypeColor(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'bg-blue-500/20 text-blue-400';
  if (mimeType === 'application/pdf') return 'bg-red-500/20 text-red-400';
  if (mimeType.startsWith('video/')) return 'bg-purple-500/20 text-purple-400';
  if (mimeType.startsWith('audio/')) return 'bg-green-500/20 text-green-400';
  if (mimeType.includes('document')) return 'bg-orange-500/20 text-orange-400';
  if (mimeType === 'application/folder') return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-gray-500/20 text-gray-400';
}

export function getNoteColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    default: 'border-slate-700',
    red: 'border-red-500/30',
    blue: 'border-blue-500/30',
    green: 'border-emerald-500/30',
    yellow: 'border-amber-500/30',
    purple: 'border-purple-500/30',
  };
  return colorMap[color] || colorMap.default;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
