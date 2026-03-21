import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../environment';
import { AuthResponse, User } from '../models/models';
import { Observable, tap } from 'rxjs';

interface SubscriptionInfo {
    has_active: boolean;
    plan_name: string | null;
    ends_at: string | null;
    status: string;
    days_remaining?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly TOKEN_KEY = 'veridata_token';
    private readonly USER_KEY = 'veridata_user';
    private readonly SUB_KEY = 'veridata_subscription';

    currentUser = signal<User | null>(this.getStoredUser());
    isAuthenticated = computed(() => !!this.currentUser() && !!this.getToken());
    userRole = computed(() => this.currentUser()?.roles?.[0]?.name ?? 'junior');
    canCreateProjects = computed(() => this.userRole() !== 'junior');

    // Subscription signals
    subscription = signal<SubscriptionInfo | null>(this.getStoredSubscription());
    hasActiveSubscription = computed(() => {
        const sub = this.subscription();
        if (!sub) return false;
        // Admins always have access
        if (this.userRole() === 'admin') return true;
        return sub.has_active;
    });
    subscriptionPlanName = computed(() => this.subscription()?.plan_name ?? null);
    subscriptionDaysRemaining = computed(() => this.subscription()?.days_remaining ?? 0);

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

    /** Refresh subscription status from /me endpoint */
    refreshSubscription(): void {
        this.http.get<any>(`${environment.apiUrl}/auth/me`).subscribe({
            next: (res) => {
                if (res.subscription) {
                    localStorage.setItem(this.SUB_KEY, JSON.stringify(res.subscription));
                    this.subscription.set(res.subscription);
                }
            }
        });
    }

    private setSession(res: AuthResponse): void {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);

        // Store subscription info if present
        if ((res as any).subscription) {
            localStorage.setItem(this.SUB_KEY, JSON.stringify((res as any).subscription));
            this.subscription.set((res as any).subscription);
        }
    }

    private clearSession(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.SUB_KEY);
        this.currentUser.set(null);
        this.subscription.set(null);
    }

    private getStoredUser(): User | null {
        const stored = localStorage.getItem(this.USER_KEY);
        return stored ? JSON.parse(stored) : null;
    }

    private getStoredSubscription(): SubscriptionInfo | null {
        const stored = localStorage.getItem(this.SUB_KEY);
        return stored ? JSON.parse(stored) : null;
    }
}
