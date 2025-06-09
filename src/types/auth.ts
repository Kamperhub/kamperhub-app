
// src/types/auth.ts

export const MOCK_AUTH_USERNAME_KEY = 'kamperhub_mock_username';
export const MOCK_AUTH_LOGGED_IN_KEY = 'kamperhub_mock_is_logged_in';

export interface MockAuthSession {
  isLoggedIn: boolean;
  username: string | null;
}
