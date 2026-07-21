'use client';

import { api } from './api';

const TOKEN_KEY = 'seblak_id_token';
const USER_KEY = 'seblak_user';

export function saveSession(idToken, user) {
  localStorage.setItem(TOKEN_KEY, idToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getSession() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  if (!token || !userRaw) return null;
  try {
    return { idToken: token, user: JSON.parse(userRaw) };
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function loginWithGoogleToken(googleIdToken) {
  const result = await api.login(googleIdToken);
  if (!result.success) throw new Error(result.error);
  saveSession(googleIdToken, result.user);
  return result.user;
}

/** Role hierarchy helper: does `role` satisfy at least one of `allowedRoles`? */
export function hasRole(role, allowedRoles) {
  return allowedRoles.includes(role);
}

export const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin Support',
  employee: 'Karyawan',
};
