import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendApiUrl } from './api';

const AUTH_USER_KEY = '@crm_auth_user';
const AUTH_SESSION_KEY = '@crm_is_authenticated';

export interface AuthUser {
  username: string;
  password: string;
}

const DEFAULT_AUTH_USER: AuthUser = {
  username: 'arshan',
  password: 'Arshan@ahmed'
};

/**
 * Initialize auth credentials with default user (arshan / Arshan@ahmed)
 */
export async function initAuth(): Promise<AuthUser> {
  try {
    const data = await AsyncStorage.getItem(AUTH_USER_KEY);
    if (!data) {
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(DEFAULT_AUTH_USER));
      return DEFAULT_AUTH_USER;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_AUTH_USER;
  }
}

/**
 * Check if the user is currently authenticated
 */
export async function checkIsLoggedIn(): Promise<boolean> {
  try {
    const session = await AsyncStorage.getItem(AUTH_SESSION_KEY);
    return session === 'true';
  } catch {
    return false;
  }
}

/**
 * Perform login check
 */
export async function login(
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; message?: string }> {
  const username = usernameInput.trim().toLowerCase();
  const password = passwordInput.trim();

  // Try remote MongoDB login first if online
  try {
    const base = await getBackendApiUrl();
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        // Also update local credentials cache
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify({ username, password }));
        await AsyncStorage.setItem(AUTH_SESSION_KEY, 'true');
        return { success: true };
      }
    } else {
      const errData = await res.json().catch(() => null);
      if (errData?.error && res.status === 401) {
        return { success: false, message: errData.error };
      }
    }
  } catch {
    // Server is unreachable, continue with local authentication fallback
  }

  // Local fallback authentication
  const storedUser = await initAuth();
  if (
    username === storedUser.username.toLowerCase() &&
    password === storedUser.password
  ) {
    await AsyncStorage.setItem(AUTH_SESSION_KEY, 'true');
    return { success: true };
  }

  return { success: false, message: 'Invalid username or password' };
}

/**
 * Log out
 */
export async function logout(): Promise<void> {
  await AsyncStorage.setItem(AUTH_SESSION_KEY, 'false');
}

/**
 * Change / Reset Password
 */
export async function changePassword(
  currentPasswordInput: string,
  newPasswordInput: string
): Promise<{ success: boolean; message: string }> {
  const currentPassword = currentPasswordInput.trim();
  const newPassword = newPasswordInput.trim();

  if (newPassword.length < 6) {
    return { success: false, message: 'New password must be at least 6 characters long' };
  }

  const storedUser = await initAuth();
  if (currentPassword !== storedUser.password) {
    return { success: false, message: 'Current password is incorrect' };
  }

  // Try updating on remote MongoDB server
  try {
    const base = await getBackendApiUrl();
    await fetch(`${base}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: storedUser.username,
        currentPassword,
        newPassword
      })
    });
  } catch {
    // Offline mode or server not running
  }

  // Update local credentials
  const updated: AuthUser = {
    ...storedUser,
    password: newPassword
  };
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));

  return { success: true, message: 'Password updated successfully!' };
}

/**
 * Get current logged in username
 */
export async function getCurrentUsername(): Promise<string> {
  const user = await initAuth();
  return user.username;
}
