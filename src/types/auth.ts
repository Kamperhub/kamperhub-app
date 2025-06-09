
// src/types/auth.ts

export const MOCK_AUTH_USERNAME_KEY = 'kamperhub_mock_username';
export const MOCK_AUTH_LOGGED_IN_KEY = 'kamperhub_mock_is_logged_in';
export const MOCK_AUTH_EMAIL_KEY = 'kamperhub_mock_email'; // New key for email

export interface MockAuthSession {
  isLoggedIn: boolean;
  username: string | null;
  email?: string | null; // Email is now part of the session
}
