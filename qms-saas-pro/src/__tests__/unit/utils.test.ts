import { describe, it, expect } from 'vitest';
import { cn, formatDate } from '@/lib/utils';

// ---------------------------------------------------------------------------
// cn()
// ---------------------------------------------------------------------------
describe('cn()', () => {
  it('returns a single class name unchanged', () => {
    expect(cn('px-4')).toBe('px-4');
  });

  it('merges multiple class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('handles conditional classes via falsy values', () => {
    expect(cn('base', false && 'hidden', null, undefined, '')).toBe('base');
  });

  it('handles conditional classes via truthy values', () => {
    expect(cn('base', true && 'active')).toBe('base active');
  });

  it('resolves tailwind-merge conflicts (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('resolves tailwind-merge conflicts across multiple conflicting pairs', () => {
    expect(cn('px-2 py-1', 'px-4', 'py-3')).toBe('px-4 py-3');
  });

  it('preserves non-conflicting classes while merging', () => {
    expect(cn('text-sm font-bold', 'text-lg')).toBe('font-bold text-lg');
  });

  it('handles arrays of class names', () => {
    expect(cn(['px-4', 'py-2'])).toBe('px-4 py-2');
  });

  it('handles mixed inputs: strings, conditionals, and arrays', () => {
    expect(cn('base', ['px-2'], true && 'active', false && 'hidden')).toBe(
      'base px-2 active',
    );
  });

  it('returns an empty string when no classes are provided', () => {
    expect(cn()).toBe('');
  });
});

// ---------------------------------------------------------------------------
// formatDate()
// ---------------------------------------------------------------------------
describe('formatDate()', () => {
  it('returns "-" for null input', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('returns "-" for undefined input', () => {
    expect(formatDate(undefined)).toBe('-');
  });

  it('returns "-" for empty string input', () => {
    expect(formatDate('')).toBe('-');
  });

  it('returns "-" for an invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('-');
  });

  it('formats a valid ISO date string in long format (DD Mon YYYY)', () => {
    // 2024-05-15T00:00:00.000Z → "15 May 2024"
    expect(formatDate('2024-05-15T00:00:00.000Z')).toBe('15 May 2024');
  });

  it('formats a valid ISO date string in short format (DD/MM/YY)', () => {
    expect(formatDate('2024-05-15T00:00:00.000Z', true)).toBe('15/05/24');
  });

  it('formats 1st of January correctly with zero-padded day', () => {
    expect(formatDate('2023-01-01T00:00:00.000Z')).toBe('01 Jan 2023');
  });

  it('formats 31st of December correctly', () => {
    expect(formatDate('2022-12-31T00:00:00.000Z')).toBe('31 Dec 2022');
  });

  it('formats short mode for 1st of March 2025', () => {
    expect(formatDate('2025-03-01T00:00:00.000Z', true)).toBe('01/03/25');
  });

  it('uses UTC-based formatting — no local timezone shift', () => {
    // 2024-01-01T23:59:59.999Z should still be day=01 in UTC
    const result = formatDate('2024-01-01T23:59:59.999Z');
    expect(result).toBe('01 Jan 2024');
  });

  it('handles a date-only ISO string (no time component)', () => {
    // "2024-07-20" is parsed as UTC midnight by the Date constructor in most environments
    const result = formatDate('2024-07-20');
    // The string "2024-07-20" is treated as UTC by new Date() in V8
    expect(result).toBe('20 Jul 2024');
  });
});
