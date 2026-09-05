import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

const ROLE_PAGES: Record<string, string> = {
  admin: 'admin',
  agent: 'compteurs',
  chef_region: 'factures',
  chef_local: 'locaux',
};

export function normalizeRole(role?: string): string {
  if (!role) return 'agent';

  const normalized = role.toLowerCase().replace(/[\s-]/g, '_');
  if (normalized === 'cheflocal') return 'chef_local';
  if (normalized === 'chefregion') return 'chef_region';
  if (['admin', 'agent', 'chef_local', 'chef_region'].includes(normalized)) {
    return normalized;
  }

  return 'agent';
}

export function getStoredRole(): string {
  const raw = localStorage.getItem('user');
  if (!raw) return 'agent';

  try {
    return normalizeRole((JSON.parse(raw) as { role?: string }).role);
  } catch {
    return 'agent';
  }
}

export function homePathForRole(role?: string): string {
  return ROLE_PAGES[normalizeRole(role)] ?? 'agent';
}

export const authGuard: CanActivateFn = () => {
  const token = localStorage.getItem('token');
  if (token) {
    return true;
  }
  return inject(Router).createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return true;
  }
  return inject(Router).createUrlTree(['/home']);
};

export const homeRedirectGuard: CanActivateFn = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return inject(Router).createUrlTree(['/login']);
  }
  return inject(Router).createUrlTree(['/home', homePathForRole(getStoredRole())]);
};

export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return inject(Router).createUrlTree(['/login']);
    }

    const role = getStoredRole();
    if (allowedRoles.includes(role)) {
      return true;
    }

    return inject(Router).createUrlTree(['/home', homePathForRole(role)]);
  };
}
