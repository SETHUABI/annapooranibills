import { User } from '@/types';
import { getUserByUsername } from './db';
import bcrypt from 'bcryptjs';

const AUTH_KEY = 'pos_current_user';

export async function login(username: string, password: string): Promise<User | null> {
  try {
    const user = await getUserByUsername(username);
    
    if (!user) {
      return null;
    }

    if (!user.isActive) {
      throw new Error('User account is disabled');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return null;
    }

    // Store user session
    const userSession = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    };
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(userSession));
    
    return user;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

export function logout(): void {
  sessionStorage.removeItem(AUTH_KEY);
}

export function getCurrentUser(): Pick<User, 'id' | 'username' | 'role' | 'name'> | null {
  const userStr = sessionStorage.getItem(AUTH_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function hasRole(role: User['role'] | User['role'][]): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
}
