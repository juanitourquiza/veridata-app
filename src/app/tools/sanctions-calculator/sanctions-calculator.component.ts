import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdpToolsService } from '../pdp-tools.service';

// Sanctions Calculator Component - Calculadora de Sanciones SPDP

@Component({
  selector: 'app-sanctions-calculator',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tools-container">
      <header class="tools-header">
        <h1>💰 Calculadora de Sanciones</h1>
        <p class="tools-subtitle">Estimación de sanciones según modelos de la Superintendencia de Protección de Datos Personales del Ecuador</p>
      </header>

      <!-- Infringement Selection -->
      <div class="vd-card">
        <h3>⚖️ Selección de Infracción</h3>
        <div class="form-grid">
          <div class="form-group">
            <label class="vd-label">Tipo de infracción *</label>
            <select class="vd-select" [ngModel]="selectedType()" (ngModelChange)="selectedType.set($event); calculateSanction()">
              <option value="">Seleccionar...</option>
              <option value="gravísima">Gravísima - Art. 47 LOPDP</option>
              <option value="grave">Grave - Art. 46 LOPDP</option>
              <option value="leve">Leve - Art. 45 LOPDP</option>
            </select>
          </div>
          <div class="form-group">
            <label class="vd-label">Infracción específica</label>
            <select class="vd-select" [ngModel]="selectedInfringement()" (ngModelChange)="selectedInfringement.set($event); calculateSanction()">
              @for (inf of availableInfringements(); track inf.code) {
                <option [value]="inf.code">{{ inf.code }} - {{ inf.name }}</option>
              }
            </select>
          </div>
        </div>

        @if (selectedInfringementDetails()) {
          <div class="infringement-details">
            <p><strong>Descripción:</strong> {{ selectedInfringementDetails()?.description }}</p>
            <p><strong>Base legal:</strong> {{ selectedInfringementDetails()?.legal_basis }}</p>
          </div>
        }
      </div>

      <!-- Calculation Factors -->
      <div class="vd-card">
        <h3>📊 Factores de Graduación</h3>
        <div class="factors-grid">
          <!-- Gravity Factors -->
          <div class="factor-section">
            <h4>⚠️ Gravedad de la infracción</h4>
            <div class="factor-list">
              @for (factor of gravityFactors(); track factor.id) {
                <label class="factor-item">
                  <input type="checkbox" [(ngModel)]="factor.selected" (change)="calculateSanction()">
                  <span class="factor-name">{{ factor.name }}</span>
                  <span class="factor-value">+{{ factor.value }}%</span>
                </label>
              }
            </div>
          </div>

          <!-- Mitigating Factors -->
          <div class="factor-section">
            <h4>✅ Atenuantes</h4>
            <div class="factor-list">
              @for (factor of mitigatingFactors(); track factor.id) {
                <label class="factor-item">
                  <input type="checkbox" [(ngModel)]="factor.selected" (change)="calculateSanction()">
                  <span class="factor-name">{{ factor.name }}</span>
                  <span class="factor-value factor-reduce">-{{ factor.value }}%</span>
                </label>
              }
            </div>
          </div>

          <!-- Aggravating Factors -->
          <div class="factor-section">
            <h4>❌ Agravantes</h4>
            <div class="factor-list">
              @for (factor of aggravatingFactors(); track factor.id) {
                <label class="factor-item">
                  <input type="checkbox" [(ngModel)]="factor.selected" (change)="calculateSanction()">
                  <span class="factor-name">{{ factor.name }}</span>
                  <span class="factor-value">+{{ factor.value }}%</span>
                </label>
              }
            </div>
          </div>
        </div>

        <!-- Economic Capacity -->
        <div class="economic-capacity">
          <h4>💼 Capacidad económica del infractor</h4>
          <div class="form-row">
            <div class="form-group">
              <label class="vd-label">Tipo de entidad</label>
              <select class="vd-select" [ngModel]="entityType()" (ngModelChange)="entityType.set($event); calculateSanction()">
                <option value="micro">Microempresa (&lt; $100K UT)</option>
                <option value="pequeña">Pequeña empresa ($100K - $1M UT)</option>
                <option value="mediana">Mediana empresa ($1M - $10M UT)</option>
                <option value="grande">Gran empresa (&gt; $10M UT)</option>
                <option value="publica">Entidad pública</option>
              </select>
            </div>
            <div class="form-group">
              <label class="vd-label">Ingresos anuales estimados (UT)</label>
              <input type="number" class="vd-input" [ngModel]="annualRevenue()" (ngModelChange)="annualRevenue.set($event); calculateSanction()" placeholder="Unidades Tributarias">
            </div>
          </div>
        </div>
      </div>

      <!-- Calculation Result -->
      <div class="vd-card result-card" [class]="'result-' + selectedType()">
        <h3>💰 Resultado del Cálculo</h3>
        <div class="result-grid">
          <div class="result-item base">
            <span class="result-label">Sanción base</span>
            <span class="result-value">{{ calculationResult().base_amount | number }} UT</span>
            <small>{{ calculationResult().base_amount * utValue() | currency:'USD':'symbol':'1.0-0' }}</small>
          </div>
          <div class="result-item adjustments">
            <span class="result-label">Ajustes por factores</span>
            <span class="result-value">{{ calculationResult().adjustment_percentage }}%</span>
            <small>{{ calculationResult().adjustment_amount | number }} UT</small>
          </div>
          <div class="result-item final">
            <span class="result-label">Sanción final estimada</span>
            <span class="result-value final-amount">{{ calculationResult().final_amount | number }} UT</span>
            <small class="final-currency">≈ {{ calculationResult().final_amount * utValue() | currency:'USD':'symbol':'1.0-0' }}</small>
          </div>
          <div class="result-item range">
            <span class="result-label">Rango legal</span>
            <span class="result-value">{{ calculationResult().min_amount | number }} - {{ calculationResult().max_amount | number }} UT</span>
            <small>{{ calculationResult().within_range ? '✅ Dentro del rango' : '⚠️ Fuera del rango - ajustar' }}</small>
          </div>
        </div>

        <div class="calculation-breakdown">
          <h4>Desglose del cálculo:</h4>
          <div class="breakdown-list">
            <div class="breakdown-item">
              <span>Sanción base según Art. {{ selectedType() === 'gravísima' ? '47' : selectedType() === 'grave' ? '46' : '45' }}</span>
              <span>{{ calculationResult().base_amount | number }} UT</span>
            </div>
            @for (adj of calculationResult().adjustments; track adj.name) {
              <div class="breakdown-item" [class.positive]="adj.value > 0" [class.negative]="adj.value < 0">
                <span>{{ adj.name }}</span>
                <span>{{ adj.value > 0 ? '+' : '' }}{{ adj.value }}%</span>
              </div>
            }
            <div class="breakdown-item total">
              <span><strong>Total ajustes</strong></span>
              <span><strong>{{ calculationResult().adjustment_percentage }}%</strong></span>
            </div>
          </div>
        </div>

        <div class="result-actions">
          <button class="vd-btn vd-btn-primary" (click)="generateReport()">📄 Generar informe de cálculo</button>
          <button class="vd-btn vd-btn-secondary" (click)="saveCalculation()">💾 Guardar cálculo</button>
          <button class="vd-btn vd-btn-secondary" (click)="viewSpdpModels()">📚 Ver modelos SPDP</button>
        </div>
      </div>

      <!-- Reference Info -->
      <div class="vd-card info-card">
        <h3>📚 Referencias Legales</h3>
        <div class="legal-references">
          <div class="reference-item">
            <strong>Art. 45 LOPDP - Infracciones leves:</strong> 1 - 100 UT (aprox. $40 - $4,000 USD)
          </div>
          <div class="reference-item">
            <strong>Art. 46 LOPDP - Infracciones graves:</strong> 100 - 1,000 UT (aprox. $4,000 - $40,000 USD)
          </div>
          <div class="reference-item">
            <strong>Art. 47 LOPDP - Infracciones gravísimas:</strong> 1,000 - 50,000 UT (aprox. $40,000 - $2,000,000 USD)
          </div>
          <div class="reference-item">
            <strong>Valor UT actual:</strong> {{ utValue() | currency:'USD':'symbol':'1.2-2' }}
          </div>
        </div>
        <p class="disclaimer">⚠️ Este cálculo es una estimación orientativa. La sanción definitiva es competencia exclusiva de la SPDP.</p>
      </div>
    </div>
  `,
  styles: [`
    .tools-container { max-width: 1200px; margin: 0 auto; }
    .tools-header { margin-bottom: 1.5rem; }
    .tools-header h1 { font-size: 1.5rem; color: #0f172a; margin: 0 0 0.5rem; }
    .tools-subtitle { color: #64748b; font-size: 0.875rem; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .infringement-details { margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px; }
    .infringement-details p { margin: 0.25rem 0; font-size: 0.875rem; }
    .factors-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .factor-section h4 { margin: 0 0 1rem; font-size: 0.875rem; color: #64748b; text-transform: uppercase; }
    .factor-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .factor-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
    .factor-item:hover { background: #f8fafc; }
    .factor-name { flex: 1; font-size: 0.75rem; }
    .factor-value { font-size: 0.75rem; font-weight: 600; color: #dc2626; }
    .factor-value.factor-reduce { color: #16a34a; }
    .economic-capacity { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; }
    .economic-capacity h4 { margin: 0 0 1rem; font-size: 0.875rem; color: #64748b; }
    .form-row { display: flex; gap: 1rem; }
    .result-card { border-left: 4px solid #f59e0b; }
    .result-card.result-grave { border-left-color: #f59e0b; }
    .result-card.result-gravísima { border-left-color: #dc2626; }
    .result-card.result-leve { border-left-color: #16a34a; }
    .result-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .result-item { text-align: center; padding: 1rem; background: #f8fafc; border-radius: 8px; }
    .result-item.final { background: rgba(86,135,243,0.1); }
    .result-label { display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.5rem; }
    .result-value { display: block; font-size: 1.25rem; font-weight: 700; color: #0f172a; }
    .result-value.final-amount { font-size: 1.75rem; color: #5687f3; }
    .final-currency { font-size: 0.875rem; color: #16a34a; font-weight: 600; }
    .result-item small { display: block; margin-top: 0.25rem; color: #64748b; }
    .calculation-breakdown { padding: 1rem; background: #f8fafc; border-radius: 8px; margin-bottom: 1rem; }
    .calculation-breakdown h4 { margin: 0 0 0.75rem; font-size: 0.875rem; }
    .breakdown-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .breakdown-item { display: flex; justify-content: space-between; font-size: 0.875rem; }
    .breakdown-item.positive { color: #dc2626; }
    .breakdown-item.negative { color: #16a34a; }
    .breakdown-item.total { border-top: 1px solid #e2e8f0; padding-top: 0.5rem; margin-top: 0.25rem; }
    .result-actions { display: flex; gap: 0.75rem; }
    .info-card { background: rgba(86,135,243,0.05); }
    .legal-references { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
    .reference-item { font-size: 0.875rem; padding: 0.75rem; background: white; border-radius: 6px; border-left: 3px solid #5687f3; }
    .disclaimer { font-size: 0.75rem; color: #64748b; font-style: italic; margin: 0; }
    @media (max-width: 1024px) { .factors-grid { grid-template-columns: 1fr; } .result-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } .form-row { flex-direction: column; } .result-grid { grid-template-columns: 1fr; } }
  `],
})
export class SanctionsCalculatorComponent {
  selectedType = signal<string>('');
  selectedInfringement = signal<string>('');
  entityType = signal<string>('pequeña');
  annualRevenue = signal<number>(50000);
  utValue = signal<number>(40.50); // Approximate UT value in USD

  infringements = signal<any[]>([
    { code: 'G47-01', type: 'gravísima', name: 'Tratamiento masivo sin autorización', description: 'Realizar tratamiento masivo de datos sin legitimación', legal_basis: 'Art. 47.1 LOPDP' },
    { code: 'G47-02', type: 'gravísima', name: 'Venta de datos sin consentimiento', description: 'Vender datos personales sin consentimiento expreso', legal_basis: 'Art. 47.2 LOPDP' },
    { code: 'G46-01', type: 'grave', name: 'No informar a titulares', description: 'Incumplir el deber de información a titulares', legal_basis: 'Art. 46.1 LOPDP' },
    { code: 'G46-02', type: 'grave', name: 'Retención excesiva', description: 'Conservar datos por tiempo superior al permitido', legal_basis: 'Art. 46.2 LOPDP' },
    { code: 'G46-03', type: 'grave', name: 'Seguridad inadecuada', description: 'No implementar medidas de seguridad apropiadas', legal_basis: 'Art. 46.3 LOPDP' },
    { code: 'L45-01', type: 'leve', name: 'Formato de información inadecuado', description: 'Proporcionar información en formato no accesible', legal_basis: 'Art. 45.1 LOPDP' },
  ]);

  gravityFactors = signal<any[]>([
    { id: 1, name: 'Alto volumen de titulares afectados (>1000)', value: 20, selected: false },
    { id: 2, name: 'Datos sensibles o de menores involucrados', value: 30, selected: false },
    { id: 3, name: 'Daño real a titulares', value: 25, selected: false },
    { id: 4, name: 'Beneficio económico por la infracción', value: 15, selected: false },
  ]);

  mitigatingFactors = signal<any[]>([
    { id: 1, name: 'Cooperación con la SPDP', value: 15, selected: false },
    { id: 2, name: 'Medidas correctivas inmediatas', value: 20, selected: false },
    { id: 3, name: 'Infracción involuntaria/ negligencia leve', value: 10, selected: false },
    { id: 4, name: 'Cumplimiento previo ejemplar', value: 15, selected: false },
    { id: 5, name: 'Primera infracción', value: 10, selected: false },
  ]);

  aggravatingFactors = signal<any[]>([
    { id: 1, name: 'Reincidencia en infracciones similares', value: 25, selected: false },
    { id: 2, name: 'Obstaculización de la investigación', value: 30, selected: false },
    { id: 3, name: 'Beneficio económico significativo', value: 20, selected: false },
    { id: 4, name: 'Duración prolongada de la infracción', value: 15, selected: false },
  ]);

  calculationResult = signal<any>({
    base_amount: 0,
    adjustment_percentage: 0,
    adjustment_amount: 0,
    final_amount: 0,
    min_amount: 0,
    max_amount: 0,
    within_range: true,
    adjustments: []
  });

  availableInfringements(): any[] {
    if (!this.selectedType()) return [];
    return this.infringements().filter(i => i.type === this.selectedType());
  }

  selectedInfringementDetails(): any {
    return this.infringements().find(i => i.code === this.selectedInfringement());
  }

  calculateSanction(): void {
    const type = this.selectedType();
    if (!type) return;

    // Base amounts by type
    const baseAmounts: any = { 'leve': 50, 'grave': 550, 'gravísima': 25500 };
    const minAmounts: any = { 'leve': 1, 'grave': 100, 'gravísima': 1000 };
    const maxAmounts: any = { 'leve': 100, 'grave': 1000, 'gravísima': 50000 };

    let baseAmount = baseAmounts[type] || 0;

    // Adjust for entity size
    const sizeMultipliers: any = { 'micro': 0.5, 'pequeña': 1, 'mediana': 2, 'grande': 3, 'publica': 1 };
    baseAmount *= sizeMultipliers[this.entityType()] || 1;

    // Calculate adjustments
    let totalAdjustment = 0;
    const adjustments: { name: string; value: number }[] = [];

    [...this.gravityFactors(), ...this.aggravatingFactors()].forEach(f => {
      if (f.selected) {
        totalAdjustment += f.value;
        adjustments.push({ name: f.name, value: f.value });
      }
    });

    this.mitigatingFactors().forEach(f => {
      if (f.selected) {
        totalAdjustment -= f.value;
        adjustments.push({ name: f.name, value: -f.value });
      }
    });

    // Limit adjustments to ±50%
    totalAdjustment = Math.max(-50, Math.min(50, totalAdjustment));

    const adjustmentAmount = baseAmount * (totalAdjustment / 100);
    let finalAmount = baseAmount + adjustmentAmount;

    // Ensure within legal range
    finalAmount = Math.max(minAmounts[type], Math.min(maxAmounts[type], finalAmount));

    this.calculationResult.set({
      base_amount: Math.round(baseAmount),
      adjustment_percentage: totalAdjustment,
      adjustment_amount: Math.round(adjustmentAmount),
      final_amount: Math.round(finalAmount),
      min_amount: minAmounts[type],
      max_amount: maxAmounts[type],
      within_range: finalAmount >= minAmounts[type] && finalAmount <= maxAmounts[type],
      adjustments
    });
  }

  generateReport(): void { alert('Generando informe de cálculo de sanciones...'); }
  saveCalculation(): void { alert('Cálculo guardado'); }
  viewSpdpModels(): void { window.open('https://spdp.gob.ec/modelos_multas/', '_blank'); }

  updateFactor(factorList: 'gravityFactors' | 'mitigatingFactors' | 'aggravatingFactors', factorId: number, field: string, value: any): void {
    this[factorList].update(factors =>
      factors.map(f => f.id === factorId ? { ...f, [field]: value } : f)
    );
  }
}
