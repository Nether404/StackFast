/**
 * Type-safe utility functions and type guards
 */

import type { ToolWithCategory, CompatibilityMatrix, ToolCategory } from "@shared/schema";

/**
 * Type guard to check if a value is not null or undefined
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if an array exists and has items
 */
export function hasItems<T>(array: T[] | null | undefined): array is T[] {
  return Array.isArray(array) && array.length > 0;
}

/**
 * Safe array access with default empty array
 */
export function safeArray<T>(array: T[] | null | undefined): T[] {
  return array || [];
}

/**
 * Safe string access with default empty string
 */
export function safeString(str: string | null | undefined): string {
  return str || "";
}

/**
 * Safe number access with default value
 */
export function safeNumber(num: number | null | undefined, defaultValue: number = 0): number {
  return num ?? defaultValue;
}

/**
 * Type guard for ToolWithCategory
 */
export function isToolWithCategory(obj: any): obj is ToolWithCategory {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    obj.category &&
    typeof obj.category.name === 'string'
  );
}

/**
 * Type guard for CompatibilityMatrix
 */
export function isCompatibilityMatrix(obj: any): obj is CompatibilityMatrix {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.toolOne &&
    obj.toolTwo &&
    obj.compatibility &&
    typeof obj.compatibility.compatibilityScore === 'number'
  );
}

/**
 * Type guard for ToolCategory
 */
export function isToolCategory(obj: any): obj is ToolCategory {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string'
  );
}

/**
 * Safe property access with type checking
 */
export function safeAccess<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined {
  return obj?.[key];
}

/**
 * Safe nested property access
 */
export function safeNestedAccess<T, K1 extends keyof T, K2 extends keyof T[K1]>(
  obj: T | null | undefined,
  key1: K1,
  key2: K2
): T[K1][K2] | undefined {
  return obj?.[key1]?.[key2];
}

/**
 * Filter array with type guard
 */
export function filterWithTypeGuard<T, U extends T>(
  array: T[],
  guard: (item: T) => item is U
): U[] {
  return array.filter(guard);
}

/**
 * Map array with null safety
 */
export function safeMap<T, U>(
  array: T[] | null | undefined,
  mapper: (item: T, index: number) => U
): U[] {
  return safeArray(array).map(mapper);
}

/**
 * Find item in array with type safety
 */
export function safeFind<T>(
  array: T[] | null | undefined,
  predicate: (item: T) => boolean
): T | undefined {
  return safeArray(array).find(predicate);
}

/**
 * Filter array with null safety
 */
export function safeFilter<T>(
  array: T[] | null | undefined,
  predicate: (item: T) => boolean
): T[] {
  return safeArray(array).filter(predicate);
}

/**
 * Sort array with null safety
 */
export function safeSort<T>(
  array: T[] | null | undefined,
  compareFn?: (a: T, b: T) => number
): T[] {
  return safeArray(array).sort(compareFn);
}

/**
 * Slice array with null safety
 */
export function safeSlice<T>(
  array: T[] | null | undefined,
  start?: number,
  end?: number
): T[] {
  return safeArray(array).slice(start, end);
}

/**
 * Join array with null safety
 */
export function safeJoin(
  array: string[] | null | undefined,
  separator: string = ", "
): string {
  return safeArray(array).join(separator);
}

/**
 * Get array length with null safety
 */
export function safeLength<T>(array: T[] | null | undefined): number {
  return safeArray(array).length;
}

/**
 * Check if string is not empty
 */
export function isNonEmptyString(str: string | null | undefined): str is string {
  return typeof str === 'string' && str.trim().length > 0;
}

/**
 * Check if number is valid (not NaN, null, or undefined)
 */
export function isValidNumber(num: number | null | undefined): num is number {
  return typeof num === 'number' && !isNaN(num);
}

/**
 * Ensure value is within bounds
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format percentage with safety
 */
export function formatPercentage(value: number | null | undefined, decimals: number = 1): string {
  const safeValue = safeNumber(value);
  return `${safeValue.toFixed(decimals)}%`;
}

/**
 * Truncate text safely
 */
export function safeTruncate(
  text: string | null | undefined,
  maxLength: number,
  suffix: string = "..."
): string {
  const safeText = safeString(text);
  if (safeText.length <= maxLength) return safeText;
  return safeText.substring(0, maxLength - suffix.length) + suffix;
}