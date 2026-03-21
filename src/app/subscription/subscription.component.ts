import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SubscriptionService, SubscriptionPlan, PlanPrice, TenantSubscription } from '../core/services/subscription.service';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="subscription-container">
      <h1>Selecciona tu Plan</h1>

      <!-- Suscripción Actual -->
      @if (currentSubscription()) {
        <div class="current-subscription-banner">
          <h3>Tu suscripción actual: {{ currentSubscription()?.plan?.name }}</h3>
          <p>Estado: <span class="status-{{ currentSubscription()?.status }}">{{ currentSubscription()?.status }}</span></p>
          <p>Vence: {{ currentSubscription()?.ends_at | date:'dd/MM/yyyy' }}</p>
          <p>Empresas: {{ currentSubscription()?.company_count }} / {{ currentSubscription()?.max_companies_allowed }}</p>
        </div>
      }

      <!-- Selector de Cantidad de Empresas -->
      <div class="company-selector">
        <label>¿Cuántas empresas necesitas gestionar?</label>
        <input
          type="number"
          [(ngModel)]="companyCount"
          (change)="filterPlans()"
          min="1"
          max="100"
          class="vd-input"
        />
      </div>

      <!-- Tabs de Tipo de Plan -->
      <div class="plan-tabs">
        <button
          [class.active]="selectedType() === 'standard'"
          (click)="selectType('standard')"
          class="tab-btn"
        >
          Planes Standard
        </button>
        <button
          [class.active]="selectedType() === 'firma'"
          (click)="selectType('firma')"
          class="tab-btn"
        >
          Planes Firma
        </button>
        <button
          [class.active]="selectedType() === 'corporativo'"
          (click)="selectType('corporativo')"
          class="tab-btn"
        >
          Corporativo
        </button>
      </div>

      <!-- Grid de Planes -->
      <div class="plans-grid">
        @for (plan of filteredPlans(); track plan.id) {
          <div
            class="plan-card"
            [class.selected]="selectedPlan()?.id === plan.id"
            [class.disabled]="!isPlanAvailable(plan)"
            (click)="selectPlan(plan)"
          >
            <h3>{{ plan.name }}</h3>
            <p class="description">{{ plan.description }}</p>

            <div class="capacity">
              <span>{{ plan.min_companies }} - {{ plan.max_companies }} empresas</span>
            </div>

            <!-- Precios -->
            <div class="pricing-section">
              @if (getPriceForPeriod(plan, 'monthly')) {
                <div
                  class="price-option"
                  [class.selected]="selectedPeriod() === 'monthly' && selectedPlan()?.id === plan.id"
                  (click)="selectPeriod('monthly', $event)"
                >
                  <span class="period">Mensual</span>
                  <span class="price">{{ formatPrice(getPriceForPeriod(plan, 'monthly')?.price) }}</span>
                </div>
              }

              @if (getPriceForPeriod(plan, 'semestral'); as price) {
                <div
                  class="price-option"
                  [class.selected]="selectedPeriod() === 'semestral' && selectedPlan()?.id === plan.id"
                  (click)="selectPeriod('semestral', $event)"
                >
                  <span class="period">Semestral</span>
                  <div class="price-container">
                    <span class="price">{{ formatPrice(getDiscountedPrice(price)) }}</span>
                    @if (price.discount_percentage > 0) {
                      <span class="discount">-{{ price.discount_percentage }}%</span>
                      <span class="original-price">{{ formatPrice(price.price) }}</span>
                    }
                  </div>
                </div>
              }

              @if (getPriceForPeriod(plan, 'annual'); as price) {
                <div
                  class="price-option"
                  [class.selected]="selectedPeriod() === 'annual' && selectedPlan()?.id === plan.id"
                  (click)="selectPeriod('annual', $event)"
                >
                  <span class="period">Anual</span>
                  <div class="price-container">
                    <span class="price">{{ formatPrice(getDiscountedPrice(price)) }}</span>
                    @if (price.discount_percentage > 0) {
                      <span class="discount">-{{ price.discount_percentage }}%</span>
                      <span class="original-price">{{ formatPrice(price.price) }}</span>
                    }
                  </div>
                </div>
              }

              <!-- Planes Corporativos -->
              @if (getPriceForPeriod(plan, '1_year'); as price) {
                <div
                  class="price-option"
                  [class.selected]="selectedPeriod() === '1_year' && selectedPlan()?.id === plan.id"
                  (click)="selectPeriod('1_year', $event)"
                >
                  <span class="period">1 año</span>
                  <span class="price">{{ formatPrice(price.price) }}</span>
                </div>
              }

              @if (getPriceForPeriod(plan, '2_years'); as price) {
                <div
                  class="price-option"
                  [class.selected]="selectedPeriod() === '2_years' && selectedPlan()?.id === plan.id"
                  (click)="selectPeriod('2_years', $event)"
                >
                  <span class="period">2 años</span>
                  <div class="price-container">
                    <span class="price">{{ formatPrice(getDiscountedPrice(price)) }}</span>
                    @if (price.discount_percentage > 0) {
                      <span class="discount">-{{ price.discount_percentage }}%</span>
                      <span class="original-price">{{ formatPrice(price.price) }}</span>
                    }
                  </div>
                </div>
              }

              @if (getPriceForPeriod(plan, '3_years'); as price) {
                <div
                  class="price-option"
                  [class.selected]="selectedPeriod() === '3_years' && selectedPlan()?.id === plan.id"
                  (click)="selectPeriod('3_years', $event)"
                >
                  <span class="period">3 años</span>
                  <div class="price-container">
                    <span class="price">{{ formatPrice(getDiscountedPrice(price)) }}</span>
                    @if (price.discount_percentage > 0) {
                      <span class="discount">-{{ price.discount_percentage }}%</span>
                      <span class="original-price">{{ formatPrice(price.price) }}</span>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Características -->
            <ul class="features">
              @for (feature of plan.features; track feature) {
                <li>{{ feature }}</li>
              }
            </ul>
          </div>
        }
      </div>

      <!-- Sección de Pago -->
      @if (selectedPlan() && selectedPeriod()) {
        <div class="payment-section">
          <h3>Método de Pago</h3>

          <div class="payment-methods">
            <label class="payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value="payphone"
                [(ngModel)]="paymentMethod"
              />
              <span class="payment-label">
                <strong>Tarjeta de Crédito</strong>
                <small>Pago seguro con PayPhone</small>
              </span>
            </label>

            <label class="payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value="bank_transfer"
                [(ngModel)]="paymentMethod"
              />
              <span class="payment-label">
                <strong>Transferencia Bancaria</strong>
                <small>Depósito o transferencia</small>
              </span>
            </label>
          </div>

          <!-- Resumen -->
          <div class="summary">
            <h4>Resumen</h4>
            <p>Plan: <strong>{{ selectedPlan()?.name }}</strong></p>
            <p>Período: <strong>{{ getPeriodLabel(selectedPeriod()) }}</strong></p>
            <p>Empresas: <strong>{{ companyCount() }}</strong></p>
            <p class="total">
              Total: <strong>{{ formatPrice(getSelectedPrice()) }}</strong>
            </p>
          </div>

          <!-- Botón de Pago -->
          <button
            class="vd-btn vd-btn-primary vd-btn-lg"
            [disabled]="!paymentMethod() || processing()"
            (click)="processPayment()"
          >
            @if (processing()) {
              Procesando...
            } @else {
              @if (paymentMethod() === 'payphone') {
                Pagar con Tarjeta
              } @else {
                Solicitar Transferencia
              }
            }
          </button>

          <!-- Error -->
          @if (error()) {
            <div class="error-message">{{ error() }}</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .subscription-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    h1 {
      text-align: center;
      margin-bottom: 2rem;
      color: var(--vd-text-primary);
    }

    .current-subscription-banner {
      background: linear-gradient(135deg, var(--vd-primary), var(--vd-secondary));
      color: white;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .current-subscription-banner h3 {
      margin: 0 0 0.5rem 0;
    }

    .current-subscription-banner p {
      margin: 0.25rem 0;
    }

    .status-active { color: #4caf50; }
    .status-pending { color: #ff9800; }
    .status-cancelled { color: #f44336; }

    .company-selector {
      margin-bottom: 2rem;
      text-align: center;
    }

    .company-selector label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .company-selector input {
      width: 200px;
      text-align: center;
      font-size: 1.2rem;
    }

    .plan-tabs {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .tab-btn {
      padding: 0.75rem 1.5rem;
      border: 2px solid var(--vd-border);
      background: white;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .tab-btn.active {
      background: var(--vd-primary);
      color: white;
      border-color: var(--vd-primary);
    }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .plan-card {
      background: white;
      border: 2px solid var(--vd-border);
      border-radius: 12px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .plan-card:hover {
      border-color: var(--vd-primary);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .plan-card.selected {
      border-color: var(--vd-primary);
      background: var(--vd-bg-secondary);
    }

    .plan-card.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .plan-card h3 {
      margin: 0 0 0.5rem 0;
      color: var(--vd-primary);
    }

    .description {
      color: var(--vd-text-secondary);
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .capacity {
      background: var(--vd-bg-secondary);
      padding: 0.5rem;
      border-radius: 6px;
      text-align: center;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .pricing-section {
      margin-bottom: 1rem;
    }

    .price-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border: 1px solid var(--vd-border);
      border-radius: 6px;
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .price-option:hover {
      background: var(--vd-bg-hover);
    }

    .price-option.selected {
      border-color: var(--vd-primary);
      background: var(--vd-primary-light);
    }

    .price-container {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }

    .price {
      font-weight: 600;
      font-size: 1.1rem;
      color: var(--vd-primary);
    }

    .discount {
      background: #4caf50;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .original-price {
      text-decoration: line-through;
      color: var(--vd-text-muted);
      font-size: 0.85rem;
    }

    .features {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .features li {
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--vd-border);
      font-size: 0.9rem;
    }

    .features li:last-child {
      border-bottom: none;
    }

    .features li::before {
      content: "✓";
      color: var(--vd-success);
      margin-right: 0.5rem;
    }

    .payment-section {
      background: white;
      border: 2px solid var(--vd-border);
      border-radius: 12px;
      padding: 2rem;
      margin-top: 2rem;
    }

    .payment-section h3 {
      margin-bottom: 1.5rem;
    }

    .payment-methods {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .payment-option {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 2px solid var(--vd-border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .payment-option:hover {
      border-color: var(--vd-primary);
    }

    .payment-option input[type="radio"] {
      width: 20px;
      height: 20px;
    }

    .payment-label {
      display: flex;
      flex-direction: column;
    }

    .payment-label strong {
      font-size: 1rem;
    }

    .payment-label small {
      color: var(--vd-text-secondary);
    }

    .summary {
      background: var(--vd-bg-secondary);
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .summary h4 {
      margin: 0 0 1rem 0;
    }

    .summary p {
      margin: 0.5rem 0;
    }

    .total {
      font-size: 1.3rem;
      border-top: 2px solid var(--vd-border);
      padding-top: 1rem;
      margin-top: 1rem;
    }

    .error-message {
      color: var(--vd-danger);
      margin-top: 1rem;
      padding: 1rem;
      background: #ffebee;
      border-radius: 6px;
    }
  `]
})
export class SubscriptionComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private router = inject(Router);

  // Signals
  plans = signal<SubscriptionPlan[]>([]);
  filteredPlans = signal<SubscriptionPlan[]>([]);
  currentSubscription = signal<TenantSubscription | null>(null);
  selectedType = signal<'standard' | 'firma' | 'corporativo'>('standard');
  selectedPlan = signal<SubscriptionPlan | null>(null);
  selectedPeriod = signal<string | null>(null);
  companyCount = signal<number>(1);
  paymentMethod = signal<'payphone' | 'bank_transfer' | null>(null);
  processing = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPlans();
    this.loadCurrentSubscription();
  }

  loadPlans(): void {
    this.subscriptionService.getPlans().subscribe({
      next: (response) => {
        this.plans.set(response.plans);
        this.filterPlans();
      },
      error: (err) => {
        console.error('Error loading plans:', err);
        this.error.set('Error al cargar los planes');
      }
    });
  }

  loadCurrentSubscription(): void {
    this.subscriptionService.getCurrentSubscription().subscribe({
      next: (response) => {
        if (response.subscription) {
          this.currentSubscription.set(response.subscription);
          this.companyCount.set(response.subscription.company_count);
        }
      },
      error: (err) => {
        console.error('Error loading subscription:', err);
      }
    });
  }

  selectType(type: 'standard' | 'firma' | 'corporativo'): void {
    this.selectedType.set(type);
    this.filterPlans();
    this.selectedPlan.set(null);
    this.selectedPeriod.set(null);
  }

  filterPlans(): void {
    const count = this.companyCount();
    const type = this.selectedType();

    const filtered = this.plans().filter(plan => {
      const matchesType = plan.type === type;
      const matchesCapacity = count >= plan.min_companies && count <= plan.max_companies;
      return matchesType && matchesCapacity;
    });

    this.filteredPlans.set(filtered);
  }

  selectPlan(plan: SubscriptionPlan): void {
    if (!this.isPlanAvailable(plan)) return;

    this.selectedPlan.set(plan);
    this.selectedPeriod.set(null);
    this.paymentMethod.set(null);
    this.error.set(null);
  }

  selectPeriod(period: string, event: Event): void {
    event.stopPropagation();
    this.selectedPeriod.set(period);
  }

  isPlanAvailable(plan: SubscriptionPlan): boolean {
    const count = this.companyCount();
    return count >= plan.min_companies && count <= plan.max_companies;
  }

  getPriceForPeriod(plan: SubscriptionPlan, period: string): PlanPrice | undefined {
    return plan.prices.find(p => p.billing_period === period && p.is_active);
  }

  getDiscountedPrice(price: PlanPrice | undefined): number {
    if (!price) return 0;
    return this.subscriptionService.getDiscountedPrice(price);
  }

  formatPrice(price: number | undefined): string {
    if (price === undefined) return '';
    return this.subscriptionService.formatPrice(price);
  }

  getPeriodLabel(period: string | null): string {
    if (!period) return '';
    return this.subscriptionService.getPeriodLabel(period);
  }

  getSelectedPrice(): number {
    const plan = this.selectedPlan();
    const period = this.selectedPeriod();
    if (!plan || !period) return 0;

    const price = this.getPriceForPeriod(plan, period);
    if (!price) return 0;

    return this.getDiscountedPrice(price);
  }

  processPayment(): void {
    const plan = this.selectedPlan();
    const period = this.selectedPeriod();
    const method = this.paymentMethod();

    if (!plan || !period || !method) {
      this.error.set('Por favor selecciona un plan, período y método de pago');
      return;
    }

    this.processing.set(true);
    this.error.set(null);

    this.subscriptionService.subscribe({
      plan_id: plan.id,
      billing_period: period,
      payment_method: method,
      company_count: this.companyCount()
    }).subscribe({
      next: (response) => {
        this.processing.set(false);

        if (method === 'payphone' && response.payment?.url) {
          // Redirigir a PayPhone
          window.location.href = response.payment.url;
        } else if (method === 'bank_transfer') {
          // Mostrar instrucciones de transferencia
          this.router.navigate(['/subscription/bank-transfer'], {
            state: {
              subscription: response.subscription,
              instructions: response.payment?.instructions
            }
          });
        }
      },
      error: (err) => {
        this.processing.set(false);
        this.error.set(err.error?.error || 'Error al procesar la suscripción');
      }
    });
  }
}
