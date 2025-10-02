/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseDeepLink, updateDeepLink } from '../useDeepLink';

describe('parseDeepLink', () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    // Mock window.location
    delete (window as { location?: Location }).location;
    window.location = { search: '' } as Location;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('should return null values when no params', () => {
    window.location.search = '';
    const result = parseDeepLink();
    expect(result).toEqual({ scenario: null, line: null });
  });

  it('should parse scenario param', () => {
    window.location.search = '?scenario=serialization-boundary';
    const result = parseDeepLink();
    expect(result).toEqual({ scenario: 'serialization-boundary', line: null });
  });

  it('should parse line param', () => {
    window.location.search = '?line=4';
    const result = parseDeepLink();
    expect(result).toEqual({ scenario: null, line: 4 });
  });

  it('should parse both scenario and line params', () => {
    window.location.search = '?scenario=suspense-boundary&line=2';
    const result = parseDeepLink();
    expect(result).toEqual({ scenario: 'suspense-boundary', line: 2 });
  });

  it('should handle invalid line number', () => {
    window.location.search = '?line=invalid';
    const result = parseDeepLink();
    expect(result).toEqual({ scenario: null, line: null });
  });

  it('should handle negative line number', () => {
    window.location.search = '?line=-1';
    const result = parseDeepLink();
    expect(result).toEqual({ scenario: null, line: null });
  });

  it('should handle zero line number', () => {
    window.location.search = '?line=0';
    const result = parseDeepLink();
    expect(result).toEqual({ scenario: null, line: null });
  });

  it('should handle extra params', () => {
    window.location.search = '?scenario=react19-cache&line=3&foo=bar';
    const result = parseDeepLink();
    expect(result).toEqual({ scenario: 'react19-cache', line: 3 });
  });
});

describe('updateDeepLink', () => {
  let originalHistory: History;
  let originalLocation: Location;

  beforeEach(() => {
    originalHistory = window.history;
    originalLocation = window.location;

    // Mock window.history and window.location
    window.history = {
      replaceState: vi.fn(),
    } as unknown as History;

    delete (window as { location?: Location }).location;
    window.location = {
      pathname: '/demo',
      search: '',
    } as Location;
  });

  afterEach(() => {
    window.history = originalHistory;
    window.location = originalLocation;
  });

  it('should update URL with scenario only', () => {
    updateDeepLink({ scenario: 'serialization-boundary' });
    expect(window.history.replaceState).toHaveBeenCalledWith(
      {},
      '',
      '/demo?scenario=serialization-boundary'
    );
  });

  it('should update URL with scenario and line', () => {
    updateDeepLink({ scenario: 'suspense-boundary', line: 4 });
    expect(window.history.replaceState).toHaveBeenCalledWith(
      {},
      '',
      '/demo?scenario=suspense-boundary&line=4'
    );
  });

  it('should ignore null line', () => {
    updateDeepLink({ scenario: 'react19-cache', line: null });
    expect(window.history.replaceState).toHaveBeenCalledWith(
      {},
      '',
      '/demo?scenario=react19-cache'
    );
  });

  it('should ignore zero line', () => {
    updateDeepLink({ scenario: 'client-size', line: 0 });
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '/demo?scenario=client-size');
  });

  it('should ignore negative line', () => {
    updateDeepLink({ scenario: 'route-config', line: -1 });
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '/demo?scenario=route-config');
  });
});
