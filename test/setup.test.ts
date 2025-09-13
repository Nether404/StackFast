import { describe, it, expect } from 'vitest';

describe('Test Setup', () => {
  it('should have vitest globals available', () => {
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it('should have DOM environment available', () => {
    expect(document).toBeDefined();
    expect(window).toBeDefined();
  });

  it('should have mocked window.matchMedia', () => {
    expect(window.matchMedia).toBeDefined();
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    expect(mediaQuery.matches).toBe(false);
  });

  it('should have ResizeObserver mock', () => {
    expect(ResizeObserver).toBeDefined();
    const observer = new ResizeObserver(() => {});
    expect(observer.observe).toBeDefined();
    expect(observer.unobserve).toBeDefined();
    expect(observer.disconnect).toBeDefined();
  });
});