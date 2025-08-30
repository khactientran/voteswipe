import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeVoterName(input: string): string {
  let sanitized = (input || "").trim();
  // Remove control characters
  sanitized = sanitized.replace(/[\u0000-\u001F\u007F]/g, "");
  // Collapse internal whitespace to single spaces
  sanitized = sanitized.replace(/\s+/g, " ");
  // Enforce max length
  if (sanitized.length > 64) sanitized = sanitized.slice(0, 64);
  return sanitized;
}

export function escapeCsvField(value: string): string {
  const str = String(value ?? "");
  // Prevent CSV injection by prefixing a single quote when starting with dangerous chars
  const needsFormulaEscape = /^[=+\-@]/.test(str);
  const safe = needsFormulaEscape ? `'${str}` : str;
  // Quote field and escape quotes
  const escaped = safe.replace(/"/g, '""');
  return `"${escaped}"`;
}
