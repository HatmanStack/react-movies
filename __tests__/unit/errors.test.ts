/**
 * Unit tests for API error classes
 */

import { APIError, NetworkError, DatabaseError } from '../../src/api/errors';

describe('APIError', () => {
  it('should create APIError with message', () => {
    const error = new APIError('API failed');
    expect(error.message).toBe('API failed');
    expect(error.name).toBe('APIError');
    expect(error).toBeInstanceOf(Error);
  });

  it('should create APIError with status code and endpoint', () => {
    const error = new APIError('Not found', 404, '/api/movies');
    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.endpoint).toBe('/api/movies');
    expect(error.name).toBe('APIError');
  });

  it('should have proper stack trace', () => {
    const error = new APIError('Test error');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('APIError');
  });
});

describe('NetworkError', () => {
  it('should create NetworkError with message', () => {
    const error = new NetworkError('Network timeout');
    expect(error.message).toBe('Network timeout');
    expect(error.name).toBe('NetworkError');
    expect(error).toBeInstanceOf(Error);
  });

  it('should have proper stack trace', () => {
    const error = new NetworkError('Test error');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('NetworkError');
  });
});

describe('DatabaseError', () => {
  it('should create DatabaseError with message', () => {
    const error = new DatabaseError('Database write failed');
    expect(error.message).toBe('Database write failed');
    expect(error.name).toBe('DatabaseError');
    expect(error).toBeInstanceOf(Error);
  });

  it('should create DatabaseError with query', () => {
    const error = new DatabaseError('Query failed', 'SELECT * FROM movies');
    expect(error.message).toBe('Query failed');
    expect(error.query).toBe('SELECT * FROM movies');
    expect(error.name).toBe('DatabaseError');
  });

  it('should have proper stack trace', () => {
    const error = new DatabaseError('Test error');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('DatabaseError');
  });
});
