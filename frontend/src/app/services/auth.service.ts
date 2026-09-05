import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { LoginRequest } from '../models/loginRequest';
import { UserResponse } from '../models/userResponse';
import { StoredUser } from '../models/storedUser';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly USER_KEY = 'user';
  private readonly USERS_KEY = 'users';

  constructor(private http: HttpClient) {}

  login(loginRequest: LoginRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/login`, loginRequest);
  }

  setSession(response: UserResponse): void {
    localStorage.setItem('token', response.token);

    const user: StoredUser = {
      id: response.id,
      email: response.email,
      name: response.name,
      prenom: response.prenom,
      role: this.normalizeStoredRole(response.role),
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getStoredUser(): StoredUser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  }

  getAllusers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  addUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/adduser`, user);
  }

  updateUser(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  setStoredUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  getStoredUsers(): User[] {
    const raw = localStorage.getItem(this.USERS_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as User[];
    } catch {
      return [];
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem(this.USER_KEY);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  private normalizeStoredRole(role?: string): string {
    if (!role) return 'agent';

    const normalized = role.toLowerCase().replace(/[\s-]/g, '_');
    if (normalized === 'cheflocal') return 'chef_local';
    if (normalized === 'chefregion') return 'chef_region';
    if (['admin', 'agent', 'chef_local', 'chef_region'].includes(normalized)) {
      return normalized;
    }

    return 'agent';
  }
}
