import { describe, it, expect } from 'vitest';
import { createLspClient } from '../factory';
import { MockLspClient } from '../MockLspClient';
import { HttpLspClient } from '../HttpLspClient';

describe('createLspClient', () => {
  it('creates mock client when type is mock', () => {
    const client = createLspClient({ type: 'mock' });
    expect(client).toBeInstanceOf(MockLspClient);
    expect(client.isMock()).toBe(true);
  });

  it('creates HTTP client when type is http with apiUrl', () => {
    const client = createLspClient({
      type: 'http',
      http: { apiUrl: '/api/lsp' },
    });
    expect(client).toBeInstanceOf(HttpLspClient);
    expect(client.isMock()).toBe(false);
  });

  it('throws error when type is http without apiUrl', () => {
    expect(() => createLspClient({ type: 'http' })).toThrow('http.apiUrl is required');
  });

  it('defaults to mock when type is auto without env vars', () => {
    const client = createLspClient({ type: 'auto' });
    expect(client).toBeInstanceOf(MockLspClient);
  });

  it('defaults to mock when no config provided', () => {
    const client = createLspClient();
    expect(client).toBeInstanceOf(MockLspClient);
  });

  it('throws error for unknown type', () => {
    expect(() => createLspClient({ type: 'unknown' as 'mock' })).toThrow('Unknown LSP client type');
  });
});
