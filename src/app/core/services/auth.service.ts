import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../environment';
import { AuthResponse, User } from '../models/models';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly TOKEN_KEY = 'veridata_token';
    private readonly USER_KEY = 'veridata_user';

    currentUser = signal<User | null>(this.getStoredUser());
    isAuthenticated = computed(() => !!this.currentUser() && !!this.getToken());
    userRole = computed(() => this.currentUser()?.roles?.[0]?.name ?? 'junior');

    constructor(private http: HttpClient, private router: Router) { }

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
            tap((res: AuthResponse) => this.setSession(res))
        );
    }

    register(data: { name: string; email: string; password: string; password_confirmation: string; tenant_name: string }): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, data).pipe(
            tap((res: AuthResponse) => this.setSession(res))
        );
    }

    logout(): void {
        this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe();
        this.clearSession();
        this.router.navigate(['/login']);
    }

    getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }

    hasRole(role: string): boolean {
        return this.currentUser()?.roles?.some((r: { name: string }) => r.name === role) ?? false;
    }

    private setSession(res: AuthResponse): void {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
    }

    private clearSession(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.currentUser.set(null);
    }

    private getStoredUser(): User | null {
        const stored = localStorage.getItem(this.USER_KEY);
        return stored ? JSON.parse(stored) : null;
    }
}
