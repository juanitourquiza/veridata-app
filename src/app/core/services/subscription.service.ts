import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';

export interface SubscriptionPlan {
  id: number;
  code: string;
  name: string;
  description?: string;
  type: 'standard' | 'firma' | 'corporativo';
  min_companies: number;
  max_companies: number;
  is_active: boolean;
  features: string[];
  prices: PlanPrice[];
}

export interface PlanPrice {
  id: number;
  plan_id: number;
  billing_period: 'monthly' | 'semestral' | 'annual' | '1_year' | '2_years' | '3_years';
  price: number;
  discount_percentage: number;
  is_active: boolean;
}

export interface TenantSubscription {
  id: number;
  tenant_id: number;
  plan_id: number;
  price_id: number;
  status: 'active' | 'cancelled' | 'suspended' | 'pending';
  starts_at: string;
  ends_at: string;
  trial_ends_at?: string;
  company_count: number;
  max_companies_allowed: number;
  plan?: SubscriptionPlan;
  price?: PlanPrice;
}

export interface SubscriptionPayment {
  id: number;
  subscription_id: number;
  payment_method: 'credit_card' | 'bank_transfer' | 'payphone';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
  paid_at?: string;
}

export interface SubscribeRequest {
  plan_id: number;
  billing_period: string;
  payment_method: 'credit_card' | 'bank_transfer' | 'payphone';
  company_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Signals para estado global
  currentSubscription = signal<TenantSubscription | null>(null);
  availablePlans = signal<SubscriptionPlan[]>([]);
  loading = signal(false);

  getPlans(): Observable<{ plans: SubscriptionPlan[] }> {
    return this.http.get<{ plans: SubscriptionPlan[] }>(`${this.apiUrl}/subscriptions/plans`);
  }

  getRecommendedPlan(companyCount: number): Observable<{ plan: SubscriptionPlan }> {
    return this.http.get<{ plan: SubscriptionPlan }>(
      `${this.apiUrl}/subscriptions/recommended-plan`,
      { params: { company_count: companyCount.toString() } }
    );
  }

  getCurrentSubscription(): Observable<{
    subscription: TenantSubscription | null;
    remaining_slots?: number;
    can_add_company?: boolean;
  }> {
    return this.http.get<any>(`${this.apiUrl}/subscriptions/current`);
  }

  subscribe(data: SubscribeRequest): Observable<{
    subscription: TenantSubscription;
    payment?: {
      method: string;
      url?: string;
      transaction_id?: string;
      instructions?: any;
    }
  }> {
    return this.http.post<any>(`${this.apiUrl}/subscriptions/subscribe`, data);
  }

  confirmPayPhonePayment(subscriptionId: number, transactionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/subscriptions/confirm-payphone`, {
      subscription_id: subscriptionId,
      transaction_id: transactionId
    });
  }

  cancelSubscription(): Observable<any> {
    return this.http.post(`${this.apiUrl}/subscriptions/cancel`, {});
  }

  // Helpers
  getPeriodLabel(period: string): string {
    const labels: Record<string, string> = {
      'monthly': 'Mensual',
      'semestral': 'Semestral',
      'annual': 'Anual',
      '1_year': '1 año',
      '2_years': '2 años',
      '3_years': '3 años'
    };
    return labels[period] || period;
  }

  getDiscountedPrice(price: PlanPrice): number {
    return price.price * (1 - (price.discount_percentage / 100));
  }

  formatPrice(price: number): string {
    return `$${price.toFixed(2)}`;
  }

  canDowngrade(currentPlan: SubscriptionPlan, newPlan: SubscriptionPlan): boolean {
    return currentPlan.max_companies > newPlan.max_companies;
  }
}
