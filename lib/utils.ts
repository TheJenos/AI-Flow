import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const trimStrings = (text: string, maxLength: number = 15) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}