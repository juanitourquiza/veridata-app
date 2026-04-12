import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

interface Infraccion {
  codigo: string;
  descripcion: string;
  rangoMin: number;
  rangoMax: number;
}

interface TipoInfraccion {
  tipo: 'leve' | 'grave';
  label: string;
  rango: string;
  infracciones: Infraccion[];
}

@Component({
  selector: 'app-sanctions-calculator',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tools-container">
      <div class="calc-header">
        <div class="header-title">
          <h1>💰 Calculadora de Sanciones</h1>
          @if (projectId()) {
            <div class="project-badge">📁 Proyecto #{{ projectId() }}</div>
          }
        </div>
        <p class="subtitle">Estimación según Art. 67 y 68 LOPDP</p>
      </div>

      <div class="progress-bar">
        @for (s of [1,2,3,4]; track s) {
          <div class="progress-step" [class.active]="step() >= s" [class.current]="step() === s">
            <span class="step-number">{{ s }}</span>
            <span class="step-label">{{ s === 1 ? 'Tipo' : s === 2 ? 'Infracción' : s === 3 ? 'Factores' : 'Resultado' }}</span>
          </div>
        }
      </div>

      @if (step() === 1) {
        <div class="vd-card step-card">
          <h3>Paso 1: Tipo de Infracción</h3>
          <p class="step-desc">Seleccione la categoría según el Art. 67 de la LOPDP</p>
          <div class="tipo-grid">
            @for (tipo of tiposInfraccion; track tipo.tipo) {
              <div class="tipo-card" [class.selected]="selectedTipo()?.tipo === tipo.tipo" [class]="'tipo-' + tipo.tipo" (click)="selectTipo(tipo)" [style.grid-column]="tipo.tipo === 'grave' ? 'span 1' : ''">
                <div class="tipo-header">
                  <span class="tipo-badge" [class]="'badge-' + tipo.tipo">{{ tipo.label }}</span>
                  <span class="tipo-rango">{{ tipo.rango }}</span>
                </div>
                <p class="tipo-desc">{{ getTipoDescripcion(tipo.tipo) }}</p>
              </div>
            }
          </div>
          <div class="step-nav">
            <div></div>
            <button class="vd-btn vd-btn-primary" (click)="goToStep(2)" [disabled]="!selectedTipo()">Siguiente →</button>
          </div>
        </div>
      }

      @if (step() === 2) {
        <div class="vd-card step-card">
          <h3>Paso 2: Código de Infracción</h3>
          <p class="step-desc">Seleccione la infracción específica</p>
          <div class="selected-tipo-info">
            <span class="tipo-badge" [class]="'badge-' + selectedTipo()?.tipo">{{ selectedTipo()?.label }}</span>
            <span class="rango-info">{{ selectedTipo()?.rango }}</span>
          </div>
          <div class="infracciones-list">
            @for (inf of selectedTipo()?.infracciones; track inf.codigo) {
              <div class="infraccion-item" [class.selected]="selectedInfraccion()?.codigo === inf.codigo" (click)="selectedInfraccion.set(inf)">
                <div class="infraccion-header">
                  <span class="infraccion-codigo">{{ inf.codigo }}</span>
                  <span class="infraccion-rango">{{ inf.rangoMin }}% - {{ inf.rangoMax }}%</span>
                </div>
                <p class="infraccion-desc">{{ inf.descripcion }}</p>
              </div>
            }
          </div>
          <div class="step-nav">
            <button class="vd-btn vd-btn-secondary" (click)="goToStep(1)">← Anterior</button>
            <button class="vd-btn vd-btn-primary" (click)="goToStep(3)" [disabled]="!selectedInfraccion()">Siguiente →</button>
          </div>
        </div>
      }

      @if (step() === 3) {
        <div class="vd-card step-card">
          <h3>Paso 3: Factores de Graduación</h3>
          <p class="step-desc">Complete según el Art. 68 LOPDP</p>
          <div class="selected-summary">
            <span class="tipo-badge" [class]="'badge-' + selectedTipo()?.tipo">{{ selectedInfraccion()?.codigo }}</span>
            <span class="infraccion-mini">{{ selectedInfraccion()?.descripcion }}</span>
          </div>

          <!-- Selector de Sector -->
          <div class="sector-section">
            <h4>🏢 Sector</h4>
            <div class="sector-options">
              <label class="sector-option" [class.selected]="sectorTipo() === 'privado'">
                <input type="radio" name="sector" [checked]="sectorTipo() === 'privado'" (change)="sectorTipo.set('privado')">
                <span class="sector-label">Sector Privado</span>
                <span class="sector-desc">(VDN - Volumen de Negocio)</span>
              </label>
              <label class="sector-option" [class.selected]="sectorTipo() === 'publico'">
                <input type="radio" name="sector" [checked]="sectorTipo() === 'publico'" (change)="sectorTipo.set('publico')">
                <span class="sector-label">Sector Público</span>
                <span class="sector-desc">(SBU - Salario Básico Unificado)</span>
              </label>
            </div>
          </div>

          <!-- VDN o SBU según sector -->
          @if (sectorTipo() === 'privado') {
            <div class="vdn-section">
              <label class="vd-label">Volumen de Negocio Anual (VDN) USD</label>
              <div class="currency-input">
                <span class="currency-prefix">$</span>
                <input type="number" class="vd-input" [ngModel]="vdn()" (ngModelChange)="vdn.set($event)" placeholder="Ej: 1000000" min="0">
              </div>
            </div>
          } @else {
            <div class="vdn-section">
              <label class="vd-label">Salario Básico Unificado (SBU) USD</label>
              <div class="currency-input">
                <span class="currency-prefix">$</span>
                <input type="number" class="vd-input" [ngModel]="sbu()" (ngModelChange)="sbu.set($event)" placeholder="Ej: 460" min="0">
                <small class="input-help">Valor referencial SBU Ecuador 2025</small>
              </div>
            </div>
          }

          <!-- Rango de la Infracción -->
          <div class="rango-section">
            <h4>📊 Rango de la Infracción (0-100%)</h4>
            <p class="rango-desc">Grado de cumplimiento normativo y medidas correctivas adoptadas</p>
            <div class="range-slider">
              <input type="range" min="0" max="100" [ngModel]="rangoInfraccion()" (ngModelChange)="rangoInfraccion.set($event)">
              <div class="range-labels">
                <span>Mínima (0%)</span>
                <span class="range-value">{{ rangoInfraccion() }}%</span>
                <span>Máxima (100%)</span>
              </div>
            </div>
          </div>

          <div class="factores-section">
            <h4>✅ Factores Atenuantes</h4>
            @for (f of factoresAtenuantes; track f.id) {
              <label class="factor-item">
                <input type="checkbox" [checked]="f.selected" (change)="toggleFactor('atenuante', f.id)">
                <span class="factor-text">{{ f.descripcion }}</span>
                <span class="factor-impact">{{ f.impacto }}%</span>
              </label>
            }
          </div>
          <div class="factores-section agravantes">
            <h4>❌ Factores Agravantes</h4>
            @for (f of factoresAgravantes; track f.id) {
              <label class="factor-item">
                <input type="checkbox" [checked]="f.selected" (change)="toggleFactor('agravante', f.id)">
                <span class="factor-text">{{ f.descripcion }}</span>
                <span class="factor-impact">+{{ f.impacto }}%</span>
              </label>
            }
          </div>
          <div class="capacidad-section">
            <h4>💼 Capacidad Económica</h4>
            <div class="capacidad-options">
              @for (c of capacidades; track c.id) {
                <label class="capacidad-option" [class.selected]="capacidadSelected()?.id === c.id">
                  <input type="radio" name="capacidad" [checked]="capacidadSelected()?.id === c.id" (change)="capacidadSelected.set(c)">
                  <span class="cap-label">{{ c.label }}</span>
                  <span class="cap-impact">{{ c.impacto > 0 ? '+' : '' }}{{ c.impacto }}%</span>
                </label>
              }
            </div>
          </div>
          <div class="step-nav">
            <button class="vd-btn vd-btn-secondary" (click)="goToStep(2)">← Anterior</button>
            <button class="vd-btn vd-btn-primary" (click)="calcular()" [disabled]="sectorTipo() === 'privado' ? !vdn() : !sbu()">Calcular</button>
          </div>
        </div>
      }

      @if (step() === 4) {
        <div class="vd-card result-card" [class]="'result-' + selectedTipo()?.tipo">
          <h3>📊 Resultado</h3>
          <div class="result-infraccion">
            <span class="infraccion-codigo-large">{{ selectedInfraccion()?.codigo }}</span>
            <span class="tipo-badge" [class]="'badge-' + selectedTipo()?.tipo">{{ selectedTipo()?.label }}</span>
          </div>
          <div class="result-summary">
            <div class="result-row">
              <span class="result-label">Sector:</span>
              <span class="result-value">{{ sectorTipo() === 'privado' ? 'Privado' : 'Público' }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">{{ sectorTipo() === 'privado' ? 'VDN:' : 'SBU:' }}</span>
              <span class="result-value">{{ sectorTipo() === 'privado' ? (vdn() | currency:'USD':'symbol':'1.0-0') : (sbu() | currency:'USD':'symbol':'1.0-0') }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">Rango Legal:</span>
              <span class="result-value">{{ selectedInfraccion()?.rangoMin }}% - {{ selectedInfraccion()?.rangoMax }}%</span>
            </div>
            <div class="result-row">
              <span class="result-label">Rango Infracción:</span>
              <span class="result-value">{{ rangoInfraccion() }}%</span>
            </div>
            <div class="result-row">
              <span class="result-label">Sanción Base:</span>
              <span class="result-value">{{ sancionBase() | currency:'USD':'symbol':'1.0-0' }}</span>
            </div>
          </div>
          @if (totalAjuste() !== 0) {
            <div class="ajustes-section">
              <div class="ajuste-row" [class.positive]="totalAjuste() < 0" [class.negative]="totalAjuste() > 0">
                <span class="ajuste-label">Ajuste total:</span>
                <span class="ajuste-value">{{ totalAjuste() > 0 ? '+' : '' }}{{ totalAjuste() }}%</span>
              </div>
              <div class="ajuste-monto">
                <span class="ajuste-label">Monto ajuste:</span>
                <span class="ajuste-value">{{ montoAjuste() | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
            </div>
          }
          <div class="resultado-final" [class]="'final-' + selectedTipo()?.tipo">
            <div class="final-label">Sanción Final Estimada:</div>
            <div class="final-amount">{{ sancionFinal() | currency:'USD':'symbol':'1.0-0' }}</div>
            <div class="final-rango">Rango: {{ rangoMinFinal() | currency:'USD':'symbol':'1.0-0' }} - {{ rangoMaxFinal() | currency:'USD':'symbol':'1.0-0' }}</div>
          </div>
          <div class="range-visual">
            <div class="range-bar">
              <div class="range-marker" [style.left.%]="getMarkerPosition()"></div>
            </div>
            <div class="range-labels">
              <span>Mín</span>
              <span class="current-position">Calculada</span>
              <span>Máx</span>
            </div>
          </div>
          <div class="resumen-factores">
            <h4>Factores aplicados:</h4>
            @for (f of getFactoresAplicados(); track f.id) {
              <div class="factor-aplicado" [class.atenuante]="f.tipo === 'atenuante'" [class.agravante]="f.tipo === 'agravante'">
                <span>{{ f.tipo === 'atenuante' ? '✅' : '❌' }} {{ f.descripcion }}</span>
                <span>{{ f.tipo === 'atenuante' ? '-' : '+' }}{{ f.impacto }}%</span>
              </div>
            }
            @if (capacidadSelected()) {
              <div class="factor-aplicado capacidad">
                <span>💼 {{ capacidadSelected()?.label }}</span>
                <span>{{ capacidadSelected()?.impacto && capacidadSelected()!.impacto > 0 ? '+' : '' }}{{ capacidadSelected()?.impacto }}%</span>
              </div>
            }
          </div>
          <div class="result-actions">
            <button class="vd-btn vd-btn-secondary" (click)="reset()">🔄 Nuevo</button>
          </div>
          <p class="disclaimer">⚠️ Estimación orientativa. La sanción definitiva es competencia exclusiva de la SPDP.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .tools-container { max-width: 900px; margin: 0 auto; }
    .calc-header { text-align: center; margin-bottom: 2rem; }
    .header-title { display: flex; align-items: center; justify-content: center; gap: 1rem; flex-wrap: wrap; }
    .calc-header h1 { font-size: 1.5rem; color: #0f172a; margin: 0; }
    .project-badge { background: rgba(86,135,243,0.1); color: #5687f3; padding: 0.375rem 0.75rem; border-radius: 20px; font-size: 0.875rem; font-weight: 500; border: 1px solid rgba(86,135,243,0.2); }
    .tools-subtitle { color: #64748b; font-size: 0.875rem; }
    .progress-bar { display: flex; justify-content: center; gap: 2rem; margin-bottom: 2rem; }
    .progress-step { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; opacity: 0.4; }
    .progress-step.active { opacity: 1; }
    .progress-step.current .step-number { background: #5687f3; color: white; }
    .step-number { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #e2e8f0; font-weight: 700; font-size: 0.875rem; }
    .progress-step.active .step-number { background: #22c55e; color: white; }
    .step-label { font-size: 0.75rem; color: #64748b; }
    .step-card { max-width: 800px; margin: 0 auto; }
    .step-card h3 { text-align: center; font-size: 1.25rem; margin-bottom: 0.5rem; }
    .step-desc { text-align: center; color: #64748b; font-size: 0.875rem; margin-bottom: 1.5rem; }
    .step-nav { display: flex; justify-content: space-between; margin-top: 2rem; }
    .tipo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .tipo-card { padding: 1.25rem; border: 2px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
    .tipo-card:hover { border-color: #cbd5e0; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .tipo-card.selected { border-color: #5687f3; background: rgba(86,135,243,0.05); }
    .tipo-card.tipo-leve.selected { border-color: #22c55e; background: rgba(34,197,94,0.05); }
    .tipo-card.tipo-grave.selected { border-color: #f59e0b; background: rgba(245,158,11,0.05); }
    .tipo-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .tipo-badge { font-size: 0.625rem; font-weight: 700; padding: 0.25rem 0.5rem; border-radius: 4px; text-transform: uppercase; }
    .badge-leve { background: rgba(34,197,94,0.1); color: #16a34a; }
    .badge-grave { background: rgba(245,158,11,0.1); color: #d97706; }
    .tipo-rango { font-size: 0.75rem; color: #64748b; }
    .tipo-desc { margin: 0; font-size: 0.75rem; color: #64748b; line-height: 1.4; }
    .selected-tipo-info { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 8px; }
    .rango-info { font-size: 0.875rem; color: #64748b; }
    .infracciones-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .infraccion-item { padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
    .infraccion-item:hover { border-color: #cbd5e0; background: #f8fafc; }
    .infraccion-item.selected { border-color: #5687f3; background: rgba(86,135,243,0.05); }
    .infraccion-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .infraccion-codigo { font-weight: 700; font-size: 0.875rem; color: #0f172a; font-family: monospace; background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 4px; }
    .infraccion-rango { font-size: 0.75rem; color: #64748b; font-weight: 500; }
    .infraccion-desc { margin: 0; font-size: 0.8125rem; color: #334155; }
    .selected-summary { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; padding: 0.5rem 0.75rem; background: #f8fafc; border-radius: 6px; }
    .infraccion-mini { font-size: 0.8125rem; color: #334155; }
    .vdn-section { margin-bottom: 1.5rem; }
    .currency-input { display: flex; align-items: center; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; max-width: 300px; }
    .currency-prefix { padding: 0.75rem 1rem; background: #f8fafc; color: #64748b; font-weight: 600; border-right: 1px solid #e2e8f0; }
    .currency-input .vd-input { border: none; border-radius: 0; flex: 1; }
    .factores-section { margin-bottom: 1.5rem; }
    .factores-section h4 { font-size: 0.875rem; margin: 0 0 0.75rem; color: #0f172a; }
    .factores-section.agravantes h4 { color: #dc2626; }
    .factor-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.75rem; background: #f8fafc; border-radius: 6px; margin-bottom: 0.5rem; cursor: pointer; transition: all 0.15s; }
    .factor-item:hover { background: #edf2f7; }
    .factor-item input { accent-color: #5687f3; width: 16px; height: 16px; }
    .factor-text { flex: 1; font-size: 0.8125rem; color: #334155; }
    .factor-impact { font-size: 0.75rem; font-weight: 600; color: #16a34a; }
    .agravantes .factor-impact { color: #dc2626; }
    .capacidad-section { margin-bottom: 1.5rem; }
    .capacidad-section h4 { font-size: 0.875rem; margin: 0 0 0.75rem; color: #0f172a; }
    .capacidad-options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
    .capacidad-option { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
    .capacidad-option:hover { border-color: #cbd5e0; }
    .capacidad-option.selected { border-color: #5687f3; background: rgba(86,135,243,0.05); }
    .capacidad-option input { accent-color: #5687f3; }
    .cap-label { flex: 1; font-size: 0.8125rem; color: #334155; }
    .cap-impact { font-size: 0.75rem; font-weight: 600; color: #64748b; }
    .result-card { border-left: 4px solid #5687f3; }
    .result-card.result-leve { border-left-color: #22c55e; }
    .result-card.result-grave { border-left-color: #f59e0b; }
    .result-infraccion { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0; }
    .infraccion-codigo-large { font-size: 1.25rem; font-weight: 700; font-family: monospace; color: #0f172a; background: #f1f5f9; padding: 0.5rem 0.75rem; border-radius: 6px; }
    .result-summary { margin-bottom: 1.5rem; }
    .result-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9; }
    .result-label { font-size: 0.875rem; color: #64748b; }
    .result-value { font-size: 0.875rem; font-weight: 600; color: #0f172a; }
    .ajustes-section { margin-bottom: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: 8px; }
    .ajuste-row { display: flex; justify-content: space-between; padding: 0.5rem 0; }
    .ajuste-row.positive { color: #16a34a; }
    .ajuste-row.negative { color: #dc2626; }
    .ajuste-value { font-weight: 700; }
    .ajuste-monto { display: flex; justify-content: space-between; padding: 0.5rem 0; border-top: 1px dashed #cbd5e0; margin-top: 0.5rem; }
    .resultado-final { text-align: center; padding: 1.5rem; background: linear-gradient(135deg, #f8fafc, #edf2f7); border-radius: 12px; margin-bottom: 1.5rem; }
    .resultado-final.final-leve { background: linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.05)); }
    .resultado-final.final-grave { background: linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05)); }
    .final-label { font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem; }
    .final-amount { font-size: 2.5rem; font-weight: 800; color: #5687f3; margin-bottom: 0.5rem; }
    .final-leve .final-amount { color: #16a34a; }
    .final-grave .final-amount { color: #d97706; }
    .final-rango { font-size: 0.75rem; color: #94a3b8; }
    .range-visual { margin-bottom: 1.5rem; }
    .range-bar { height: 12px; background: linear-gradient(90deg, #22c55e, #f59e0b, #ef4444); border-radius: 6px; position: relative; }
    .range-marker { position: absolute; top: -6px; width: 4px; height: 24px; background: #0f172a; border-radius: 2px; transform: translateX(-50%); transition: left 0.3s; }
    .range-labels { display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.6875rem; color: #94a3b8; }
    .current-position { font-weight: 600; color: #5687f3; }
    .resumen-factores { margin-bottom: 1.5rem; }
    .resumen-factores h4 { font-size: 0.875rem; margin: 0 0 0.75rem; color: #0f172a; }
    .factor-aplicado { display: flex; justify-content: space-between; padding: 0.5rem 0.75rem; background: #f8fafc; border-radius: 6px; font-size: 0.75rem; margin-bottom: 0.25rem; }
    .factor-aplicado.atenuante { border-left: 3px solid #22c55e; }
    .factor-aplicado.agravante { border-left: 3px solid #ef4444; }
    .factor-aplicado.capacidad { border-left: 3px solid #5687f3; }
    .result-actions { display: flex; gap: 0.75rem; justify-content: center; margin-bottom: 1rem; }
    .disclaimer { text-align: center; font-size: 0.6875rem; color: #94a3b8; font-style: italic; margin: 0; }
    @media (max-width: 768px) {
      .tipo-grid { grid-template-columns: 1fr; }
      .capacidad-options { grid-template-columns: 1fr; }
      .progress-bar { gap: 1rem; }
    }
  `],
})
export class SanctionsCalculatorComponent implements OnInit {
  projectId = signal<number | null>(null);
  step = signal(1);

  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const pid = params['project_id'];
      if (pid) this.projectId.set(parseInt(pid, 10));
    });
  }
  selectedTipo = signal<TipoInfraccion | null>(null);
  selectedInfraccion = signal<Infraccion | null>(null);
  vdn = signal<number>(0);
  capacidadSelected = signal<{id: string; label: string; impacto: number} | null>(null);

  sancionBase = signal(0);
  sancionFinal = signal(0);
  totalAjuste = signal(0);
  montoAjuste = signal(0);
  rangoMinFinal = signal(0);
  rangoMaxFinal = signal(0);

  // Modelo según Resolución SPDP-SPD-2025-0022-R
  sectorTipo = signal<'privado' | 'publico'>('privado');
  sbu = signal<number>(0); // Salario Básico Unificado para sector público
  rangoInfraccion = signal<number>(50); // 0-100% según nivel de cumplimiento

  tiposInfraccion: TipoInfraccion[] = [
    {
      tipo: 'leve',
      label: 'Leve',
      rango: '0.1% - 0.7% VDN',
      infracciones: [
        { codigo: 'Art. 67.1.a', descripcion: 'No proporcionar información al titular sobre el tratamiento de sus datos personales', rangoMin: 0.1, rangoMax: 0.7 },
        { codigo: 'Art. 67.1.b', descripcion: 'No responder solicitudes de ejercicio de derechos en el plazo establecido', rangoMin: 0.1, rangoMax: 0.7 },
        { codigo: 'Art. 67.1.c', descripcion: 'No mantener actualizado el registro de actividades de tratamiento (RAT)', rangoMin: 0.1, rangoMax: 0.7 },
        { codigo: 'Art. 67.1.d', descripcion: 'No mantener disponible y publicada la política de protección de datos', rangoMin: 0.1, rangoMax: 0.7 },
        { codigo: 'Art. 67.1.e', descripcion: 'No aplicar las medidas de seguridad establecidas en la normativa', rangoMin: 0.1, rangoMax: 0.7 },
        { codigo: 'Art. 67.1.f', descripcion: 'No implementar la privacidad desde el diseño por defecto (PbD)', rangoMin: 0.1, rangoMax: 0.7 },
        { codigo: 'Art. 67.1.g', descripcion: 'No formalizar la relación con encargados mediante contrato o acto jurídico equivalente', rangoMin: 0.1, rangoMax: 0.7 },
        { codigo: 'Art. 67.1.h', descripcion: 'No realizar evaluaciones de impacto en la protección de datos (EIPD) cuando sea obligatorio', rangoMin: 0.1, rangoMax: 0.7 },
        { codigo: 'Art. 67.1.i', descripcion: 'No designar delegado de protección de datos (DPD) cuando sea obligatorio', rangoMin: 0.1, rangoMax: 0.7 },
        { codigo: 'Art. 67.1.j', descripcion: 'No notificar a la autoridad las brechas de seguridad en el plazo establecido', rangoMin: 0.1, rangoMax: 0.7 },
        { codigo: 'Art. 67.1.k', descripcion: 'No informar a los titulares sobre las brechas de seguridad cuando corresponda', rangoMin: 0.1, rangoMax: 0.7 },
      ]
    },
    {
      tipo: 'grave',
      label: 'Grave',
      rango: '0.7% - 1.0% VDN',
      infracciones: [
        { codigo: 'Art. 67.2.a', descripcion: 'Tratamiento ilícito de datos personales sin base legal válida', rangoMin: 0.7, rangoMax: 1.0 },
        { codigo: 'Art. 67.2.b', descripcion: 'Tratamiento ilícito de datos sensibles sin autorización de la autoridad', rangoMin: 0.7, rangoMax: 1.0 },
        { codigo: 'Art. 67.2.c', descripcion: 'Tratamiento ilícito de datos personales de niñas, niños o adolescentes', rangoMin: 0.7, rangoMax: 1.0 },
        { codigo: 'Art. 67.2.d', descripcion: 'Transferencia internacional de datos sin garantías de protección adecuadas', rangoMin: 0.7, rangoMax: 1.0 },
        { codigo: 'Art. 67.2.e', descripcion: 'Uso de datos personales para fines discriminatorios o ilegales', rangoMin: 0.7, rangoMax: 1.0 },
        { codigo: 'Art. 67.2.f', descripcion: 'Venta de datos personales sin consentimiento expreso del titular', rangoMin: 0.7, rangoMax: 1.0 },
        { codigo: 'Art. 67.2.g', descripcion: 'Obstaculización de las facultades de inspección o investigación de la autoridad', rangoMin: 0.7, rangoMax: 1.0 },
        { codigo: 'Art. 67.2.h', descripcion: 'No adoptar medidas de seguridad que resulten en vulneración grave de datos', rangoMin: 0.7, rangoMax: 1.0 },
        { codigo: 'Art. 67.2.i', descripcion: 'Reincidencia en infracciones leves sancionadas previamente', rangoMin: 0.7, rangoMax: 1.0 },
        { codigo: 'Art. 67.2.j', descripcion: 'Mantenimiento de datos personales después del plazo de conservación sin causa justificada', rangoMin: 0.7, rangoMax: 1.0 },
      ]
    }
  ];

  // Factores atenuantes según Art. 68 LOPDP
  factoresAtenuantes = [
    { id: 'at1', descripcion: 'Cumplimiento de medidas de seguridad apropiadas (Art. 68.1.a)', impacto: -20, selected: false },
    { id: 'at2', descripcion: 'Cooperación activa con la autoridad (Art. 68.1.b)', impacto: -25, selected: false },
    { id: 'at3', descripcion: 'Adopción de medidas correctivas inmediatas (Art. 68.1.c)', impacto: -20, selected: false },
    { id: 'at4', descripcion: 'Buena fe del infractor y ausencia de dolo (Art. 68.1.d)', impacto: -15, selected: false },
    { id: 'at5', descripcion: 'Ausencia de beneficio económico indebido (Art. 68.1.e)', impacto: -10, selected: false },
    { id: 'at6', descripcion: 'Tamaño reducido de la organización (Art. 68.1.f)', impacto: -10, selected: false },
    { id: 'at7', descripcion: 'Cumplimiento previo de obligaciones de transparencia (Art. 68.1.g)', impacto: -10, selected: false },
  ];

  // Factores agravantes según Art. 68 LOPDP
  factoresAgravantes = [
    { id: 'ag1', descripcion: 'Beneficio económico derivado de la infracción (Art. 68.2.a)', impacto: 30, selected: false },
    { id: 'ag2', descripcion: 'Reincidencia en infracciones similares (Art. 68.2.b)', impacto: 40, selected: false },
    { id: 'ag3', descripcion: 'Duración prolongada de la infracción (Art. 68.2.c)', impacto: 20, selected: false },
    { id: 'ag4', descripcion: 'Vulneración de datos sensibles o de menores de edad (Art. 68.2.d)', impacto: 35, selected: false },
    { id: 'ag5', descripcion: 'Número elevado de titulares afectados (Art. 68.2.e)', impacto: 25, selected: false },
    { id: 'ag6', descripcion: 'Mala fe o intencionalidad en la conducta (Art. 68.2.f)', impacto: 20, selected: false },
    { id: 'ag7', descripcion: 'Obstaculización de la investigación (Art. 68.2.g)', impacto: 20, selected: false },
    { id: 'ag8', descripcion: 'Posición dominante en el mercado (Art. 68.2.h)', impacto: 15, selected: false },
  ];

  capacidades = [
    { id: 'cap1', label: 'Microempresa (<50 trabajadores, <USD 1M)', impacto: -20 },
    { id: 'cap2', label: 'Pequeña empresa (50-100 trabajadores)', impacto: -10 },
    { id: 'cap3', label: 'Mediana empresa (100-200 trabajadores)', impacto: 0 },
    { id: 'cap4', label: 'Gran empresa (>200 trabajadores, >USD 5M)', impacto: 10 },
    { id: 'cap5', label: 'Posición dominante en el mercado', impacto: 20 },
  ];

  selectTipo(tipo: TipoInfraccion): void {
    this.selectedTipo.set(tipo);
    this.selectedInfraccion.set(null);
  }

  goToStep(s: number): void {
    this.step.set(s);
  }

  getTipoDescripcion(tipo: string): string {
    const descs: Record<string, string> = {
      leve: 'Infracciones formales o de carácter leve.',
      grave: 'Infracciones que vulneran derechos fundamentales a la protección de datos.'
    };
    return descs[tipo] || '';
  }

  toggleFactor(tipo: 'atenuante' | 'agravante', id: string): void {
    const lista = tipo === 'atenuante' ? this.factoresAtenuantes : this.factoresAgravantes;
    const f = lista.find(x => x.id === id);
    if (f) f.selected = !f.selected;
  }

  getFactoresAplicados(): Array<{id: string; tipo: string; descripcion: string; impacto: number}> {
    const at = this.factoresAtenuantes.filter(f => f.selected).map(f => ({ ...f, tipo: 'atenuante' }));
    const ag = this.factoresAgravantes.filter(f => f.selected).map(f => ({ ...f, tipo: 'agravante' }));
    return [...at, ...ag];
  }

  calcular(): void {
    const inf = this.selectedInfraccion();
    if (!inf) return;

    // Determinar base (VDN o SBU según sector)
    let baseMonto: number;
    if (this.sectorTipo() === 'privado') {
      const vdn = this.vdn();
      if (!vdn) return;
      baseMonto = vdn;
    } else {
      const sbu = this.sbu();
      if (!sbu) return;
      baseMonto = sbu;
    }

    // Calcular sanción base usando rango de infracción
    // El rango de infracción (0-100%) interpola entre rangoMin y rangoMax
    const rangoPct = this.rangoInfraccion() / 100;
    const porcentajeAplicado = inf.rangoMin + (inf.rangoMax - inf.rangoMin) * rangoPct;
    const base = baseMonto * (porcentajeAplicado / 100);

    // Calcular ajuste por factores
    let ajuste = 0;
    this.factoresAtenuantes.forEach(f => { if (f.selected) ajuste += f.impacto; });
    this.factoresAgravantes.forEach(f => { if (f.selected) ajuste += f.impacto; });
    if (this.capacidadSelected()) ajuste += this.capacidadSelected()!.impacto;

    ajuste = Math.max(-50, Math.min(50, ajuste));
    const montoAjuste = base * (ajuste / 100);
    let final = base + montoAjuste;
    const min = baseMonto * (inf.rangoMin / 100);
    const max = baseMonto * (inf.rangoMax / 100);
    final = Math.max(min, Math.min(max, final));

    this.sancionBase.set(Math.round(base));
    this.sancionFinal.set(Math.round(final));
    this.totalAjuste.set(ajuste);
    this.montoAjuste.set(Math.round(montoAjuste));
    this.rangoMinFinal.set(Math.round(min));
    this.rangoMaxFinal.set(Math.round(max));
    this.step.set(4);
  }

  getMarkerPosition(): number {
    const min = this.rangoMinFinal();
    const max = this.rangoMaxFinal();
    const final = this.sancionFinal();
    if (max === min) return 50;
    return ((final - min) / (max - min)) * 100;
  }

  reset(): void {
    this.step.set(1);
    this.selectedTipo.set(null);
    this.selectedInfraccion.set(null);
    this.vdn.set(0);
    this.sbu.set(0);
    this.sectorTipo.set('privado');
    this.rangoInfraccion.set(50);
    this.capacidadSelected.set(null);
    this.factoresAtenuantes.forEach(f => f.selected = false);
    this.factoresAgravantes.forEach(f => f.selected = false);
    this.sancionBase.set(0);
    this.sancionFinal.set(0);
    this.totalAjuste.set(0);
    this.montoAjuste.set(0);
    this.rangoMinFinal.set(0);
    this.rangoMaxFinal.set(0);
  }
}
