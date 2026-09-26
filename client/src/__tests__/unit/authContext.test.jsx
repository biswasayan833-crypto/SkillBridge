import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Mock the Axios api service
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Test helper component that consumes AuthContext
const TestConsumer = () => {
  const { user, token, isAuthenticated, loading, login, register, logout } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'idle'}</div>
      <div data-testid="auth">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
      <div data-testid="user">{user ? user.name : 'null'}</div>
      <div data-testid="role">{user ? user.role : 'null'}</div>
      <div data-testid="token">{token || 'null'}</div>

      <button onClick={() => login('test@example.com', 'Password123!')}>Do Login</button>
      <button
        onClick={() =>
          register({
            name: 'New User',
            email: 'new@example.com',
            password: 'Password123!',
            role: 'student',
          })
        }
      >
        Do Register
      </button>
      <button onClick={() => logout()}>Do Logout</button>
    </div>
  );
};

describe('Frontend Unit Tests — AuthContext & useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should throw an error if useAuth is consumed outside of AuthProvider', () => {
    // Suppress console.error from React during boundary error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );

    spy.mockRestore();
  });

  it('should initialize as unauthenticated and not loading when localStorage has no token', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading').textContent).toBe('idle');
    expect(screen.getByTestId('auth').textContent).toBe('unauthenticated');
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('token').textContent).toBe('null');
  });

  it('should hydrate user session when valid token exists in localStorage', async () => {
    const fakeToken = 'mock_jwt_token_alice_123';
    localStorage.setItem('skillbridge_token', fakeToken);

    api.get.mockResolvedValueOnce({
      success: true,
      user: {
        _id: 'user_123',
        name: 'Alice Wonder',
        email: 'alice@example.com',
        role: 'student',
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('idle');
    });

    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(screen.getByTestId('auth').textContent).toBe('authenticated');
    expect(screen.getByTestId('user').textContent).toBe('Alice Wonder');
    expect(screen.getByTestId('role').textContent).toBe('student');
    expect(screen.getByTestId('token').textContent).toBe(fakeToken);
  });

  it('should clear token and reset state if token verification fails on mount', async () => {
    localStorage.setItem('skillbridge_token', 'expired_jwt_token');

    api.get.mockRejectedValueOnce(new Error('Token expired'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('idle');
    });

    expect(localStorage.getItem('skillbridge_token')).toBeNull();
    expect(screen.getByTestId('auth').textContent).toBe('unauthenticated');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('should update state and save token to localStorage upon successful login', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    api.post.mockResolvedValueOnce({
      success: true,
      token: 'newly_issued_jwt_token',
      user: {
        _id: 'recruiter_456',
        name: 'Bob Recruiter',
        email: 'bob@hiring.com',
        role: 'recruiter',
      },
    });

    await act(async () => {
      screen.getByText('Do Login').click();
    });

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(localStorage.getItem('skillbridge_token')).toBe('newly_issued_jwt_token');
    expect(screen.getByTestId('auth').textContent).toBe('authenticated');
    expect(screen.getByTestId('user').textContent).toBe('Bob Recruiter');
    expect(screen.getByTestId('role').textContent).toBe('recruiter');
  });

  it('should update state and save token to localStorage upon successful register', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    api.post.mockResolvedValueOnce({
      success: true,
      token: 'registered_user_token',
      user: {
        _id: 'student_789',
        name: 'New User',
        email: 'new@example.com',
        role: 'student',
      },
    });

    await act(async () => {
      screen.getByText('Do Register').click();
    });

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'New User',
      email: 'new@example.com',
      password: 'Password123!',
      role: 'student',
    });

    expect(localStorage.getItem('skillbridge_token')).toBe('registered_user_token');
    expect(screen.getByTestId('auth').textContent).toBe('authenticated');
    expect(screen.getByTestId('user').textContent).toBe('New User');
  });

  it('should clear localStorage, user, and token upon logout', async () => {
    localStorage.setItem('skillbridge_token', 'active_session_token');

    api.get.mockResolvedValueOnce({
      success: true,
      user: { name: 'Active User', role: 'student' },
    });
    api.post.mockResolvedValueOnce({ success: true });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth').textContent).toBe('authenticated');
    });

    await act(async () => {
      screen.getByText('Do Logout').click();
    });

    expect(api.post).toHaveBeenCalledWith('/auth/logout');
    expect(localStorage.getItem('skillbridge_token')).toBeNull();
    expect(screen.getByTestId('auth').textContent).toBe('unauthenticated');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });
});
