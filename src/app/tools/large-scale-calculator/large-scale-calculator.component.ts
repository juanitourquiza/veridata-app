import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PdpToolsService } from '../pdp-tools.service';

// Large Scale Calculator - Cálculo de Gran Escala según Art. 14 LOPDP y R52-2026
// Corrected scoring logic based on SPDP methodology

@Component({
  selector: 'app-large-scale-calculator',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tools-container">
      <header class="tools-header">
        <div class="header-title">
          <h1>� Cálculo de Gran Escala (MTGE)</h1>
          @if (projectId()) {
            <div class="project-badge">📁 Proyecto #{{ projectId() }}</div>
          }
        </div>
        <p class="tools-subtitle">Matriz Técnica de Gran Escala según Art. 8 LOPDP</p>
      </header>

      <!-- Calculator Form -->
      <div class="vd-card">
        <h3>🔢 Parámetros de Evaluación</h3>
        <p class="section-desc">Complete los siguientes parámetros para determinar si el tratamiento constituye "gran escala" según el Art. 14 de la LOPDP</p>

        <div class="calc-grid">
          <!-- Data Subjects Count -->
          <div class="calc-section">
            <h4>👥 Titulares de Datos (12 meses)</h4>
            <div class="form-group">
              <label class="vd-label">Número estimado de titulares afectados</label>
              <select class="vd-select" [ngModel]="params().data_subjects_band" (ngModelChange)="updateParam('data_subjects_band', $event)">
                <option value="1">0 a 1.000 (1 pt)</option>
                <option value="2">1.001 a 10.000 (2 pts)</option>
                <option value="3">10.001 a 100.000 (3 pts)</option>
                <option value="4">101.000 o más (4 pts)</option>
              </select>
            </div>
            <div class="parameter-score">
              <span class="score-label">Puntuación:</span>
              <span class="score-value">{{ getSubjectScore() }} puntos</span>
            </div>
          </div>

          <!-- Data Volume -->
          <div class="calc-section">
            <h4>📦 Volumen (Tipos de datos)</h4>
            <div class="form-group">
              <label class="vd-label">Cantidad de tipos de datos tratados</label>
              <select class="vd-select" [ngModel]="params().data_volume_band" (ngModelChange)="updateParam('data_volume_band', $event)">
                <option value="0.5">Hasta 10 tipos (0.5 pts)</option>
                <option value="1">Entre 11 y 30 tipos (1 pt)</option>
                <option value="2">Entre 31 y 100 tipos (2 pts)</option>
                <option value="3">101 o más tipos (3 pts)</option>
              </select>
            </div>
            <div class="parameter-score">
              <span class="score-label">Puntuación:</span>
              <span class="score-value">{{ getVolumeScore() }} puntos</span>
            </div>
          </div>

          <!-- Treatment Frequency -->
          <div class="calc-section">
            <h4>🔄 Frecuencia</h4>
            <div class="form-group">
              <label class="vd-label">Periodicidad del tratamiento</label>
              <select class="vd-select" [ngModel]="params().frequency" (ngModelChange)="updateParam('frequency', $event)">
                <option value="0.5">Puntual (0.5 pts)</option>
                <option value="1">Periódica (1 pt)</option>
                <option value="2">Continua / Tiempo real (2 pts)</option>
              </select>
            </div>
            <div class="parameter-score">
              <span class="score-label">Puntuación:</span>
              <span class="score-value">{{ getFrequencyScore() }} puntos</span>
            </div>
          </div>

          <!-- Treatment Duration -->
          <div class="calc-section">
            <h4>⏱️ Permanencia</h4>
            <div class="form-group">
              <label class="vd-label">Duración del tratamiento</label>
              <select class="vd-select" [ngModel]="params().duration" (ngModelChange)="updateParam('duration', $event)">
                <option value="0.5">Ocasional (0.5 pts)</option>
                <option value="1">Temporal (1 pt)</option>
                <option value="2">Prolongada (2 pts)</option>
              </select>
            </div>
            <div class="parameter-score">
              <span class="score-label">Puntuación:</span>
              <span class="score-value">{{ getDurationScore() }} puntos</span>
            </div>
          </div>

          <!-- Geographic Scope -->
          <div class="calc-section">
            <h4>🌎 Alcance Geográfico</h4>
            <div class="form-group">
              <label class="vd-label">Cobertura territorial</label>
              <select class="vd-select" [ngModel]="params().geographic_scope" (ngModelChange)="updateParam('geographic_scope', $event)">
                <option value="1">Local (1 pt)</option>
                <option value="2">Nacional (2 pts)</option>
                <option value="3">Global/Transfronterizo (3 pts)</option>
              </select>
            </div>
            <div class="parameter-score">
              <span class="score-label">Puntuación:</span>
              <span class="score-value">{{ getGeographicScore() }} puntos</span>
            </div>
          </div>

          <!-- Special Data Categories -->
          <div class="calc-section">
            <h4>⚠️ Categorías de Datos</h4>
            <div class="form-group">
              <label class="vd-label">Tipo de datos tratados</label>
              <select class="vd-select" [ngModel]="params().categories_band" (ngModelChange)="updateParam('categories_band', $event)">
                <option value="0.5">Solo datos básicos (0.5 pts)</option>
                <option value="2">Incluye 1 categoría especial (2 pts)</option>
                <option value="3">Más de 1 especial o datos penales (3 pts)</option>
              </select>
            </div>
            <div class="parameter-score">
              <span class="score-label">Puntuación:</span>
              <span class="score-value">{{ getCategoriesScore() }} puntos</span>
            </div>
          </div>
        </div>

        <!-- Direct Qualification Cases -->
        <div class="direct-qualification">
          <h4>⚡ Casos de Calificación Directa Obligatoria (Art. 14)</h4>
          <p class="section-desc">El tratamiento se presume a gran escala si cumple alguno de estos criterios:</p>
          <div class="checkbox-list">
            <label class="checkbox-item">
              <input type="checkbox" [ngModel]="params().direct_health" (ngModelChange)="updateParam('direct_health', $event)">
              <span>Tratamientos de salud, sistemas sanitarios o historiales clínicos (Art. 14.1)</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" [ngModel]="params().direct_profiling" (ngModelChange)="updateParam('direct_profiling', $event)">
              <span>Perfilamiento automatizado con efectos jurídicos (Art. 14.2)</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" [ngModel]="params().direct_surveillance" (ngModelChange)="updateParam('direct_surveillance', $event)">
              <span>Videovigilancia en zonas de acceso público (Art. 14.3)</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" [ngModel]="params().direct_biometric" (ngModelChange)="updateParam('direct_biometric', $event)">
              <span>Datos biométricos o geolocalización (Art. 14.4)</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" [ngModel]="params().direct_credit" (ngModelChange)="updateParam('direct_credit', $event)">
              <span>Información crediticia, riesgo económico o financiero (Art. 14.5)</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" [ngModel]="params().direct_minors" (ngModelChange)="updateParam('direct_minors', $event)">
              <span>Datos de menores en entornos institucionales/educativos (Art. 14.5 bis)</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" [ngModel]="params().direct_transfer" (ngModelChange)="updateParam('direct_transfer', $event)">
              <span>Transferencias sistemáticas continuas de datos (Art. 14.6)</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" [ngModel]="params().direct_courier" (ngModelChange)="updateParam('direct_courier', $event)">
              <span>Mensajería acelerada, expresa o courier (Art. 14.7)</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Result Panel -->
      <div class="vd-card result-card" [class]="'result-' + getResultClass()">
        <h3>📊 Resultado del Cálculo</h3>
        <div class="result-main">
          <div class="result-icon">{{ isLargeScale() ? '🚨' : '✅' }}</div>
          <div class="result-text">
            <strong class="result-title">{{ isLargeScale() ? 'TRATAMIENTO A GRAN ESCALA' : 'TRATAMIENTO NO ES A GRAN ESCALA' }}</strong>
            <p class="result-description">
              {{ isLargeScale()
                ? 'El tratamiento requiere Evaluación de Impacto en Protección de Datos (EIPD) según Art. 14 LOPDP.'
                : 'El tratamiento no requiere EIPD obligatoria, pero se recomienda considerar medidas de seguridad proporcionales.' }}
            </p>
          </div>
        </div>

        @if (hasDirectQualification()) {
          <div class="direct-alert">
            <strong>⚡ Calificación directa aplicada</strong> — El tratamiento se califica automáticamente como gran escala por cumplir criterios del Art. 14.3 LOPDP, independientemente del puntaje.
          </div>
        }

        <div class="score-breakdown">
          <div class="score-total">
            <span class="total-label">Puntuación Total MTGE:</span>
            <span class="total-value" [class.high]="getTotalScore() >= 8">{{ getTotalScore() }} / 13.5</span>
          </div>
          <div class="score-bar">
            <div class="score-fill" [style.width.%]="(getTotalScore() / 13.5) * 100" [class.high]="isLargeScale()"></div>
          </div>
          <div class="threshold-marker">Umbral: 8 puntos (gran escala)</div>
        </div>

        <div class="calculation-details">
          <h4>Desglose MTGE (Art. 8):</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">1. Titulares:</span>
              <span class="detail-value">{{ getSubjectScore() }} pts</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">2. Volumen (Tipos):</span>
              <span class="detail-value">{{ getVolumeScore() }} pts</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">3. Categorías:</span>
              <span class="detail-value">{{ getCategoriesScore() }} pts</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">4. Frecuencia:</span>
              <span class="detail-value">{{ getFrequencyScore() }} pts</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">5. Permanencia:</span>
              <span class="detail-value">{{ getDurationScore() }} pts</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">6. Alcance Geo.:</span>
              <span class="detail-value">{{ getGeographicScore() }} pts</span>
            </div>
          </div>
        </div>

        <div class="result-actions">
          <button class="vd-btn vd-btn-secondary" (click)="resetParams()">🔄 Reiniciar</button>
        </div>
      </div>

      <!-- Reference -->
      <div class="vd-card info-card">
        <h3>📚 Referencia Legal</h3>
        <div class="legal-info">
          <p><strong>Art. 14 LOPDP - Tratamiento a gran escala:</strong></p>
          <p>Se presume tratamiento a gran escala cuando el tratamiento involucra:</p>
          <ul>
            <li>Tratamiento sistemático de datos personales de más de 50,000 titulares</li>
            <li>Tratamiento de datos sensibles de más de 5,000 titulares</li>
            <li>Perfilamiento con efectos jurídicos o significativos</li>
            <li>Vigilancia sistemática de lugares de acceso público</li>
          </ul>
          <p><strong>Reglamento R52-2026:</strong> Establece la metodología de cálculo del MTGE (Método de Tratamiento a Gran Escala)</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tools-container { max-width: 1200px; margin: 0 auto; }
    .tools-header { margin-bottom: 1.5rem; }
    .header-title { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .tools-header h1 { font-size: 1.5rem; color: #0f172a; margin: 0; }
    .project-badge { background: rgba(86,135,243,0.1); color: #5687f3; padding: 0.375rem 0.75rem; border-radius: 20px; font-size: 0.875rem; font-weight: 500; border: 1px solid rgba(86,135,243,0.2); }
    .tools-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 0.5rem; }
    .tools-subtitle { color: #64748b; font-size: 0.875rem; }
    .section-desc { color: #64748b; font-size: 0.875rem; margin: 0.5rem 0 1rem; }
    .calc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .calc-section { padding: 1rem; background: #f8fafc; border-radius: 8px; }
    .calc-section h4 { margin: 0 0 1rem; font-size: 0.875rem; color: #64748b; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
    .input-help { font-size: 0.625rem; color: #94a3b8; }
    .parameter-score { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .score-label { font-size: 0.75rem; color: #64748b; }
    .score-value { font-size: 0.875rem; font-weight: 600; color: #5687f3; }
    .checkbox-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .checkbox-item { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.813rem; }
    .checkbox-item input { accent-color: #5687f3; }
    .direct-qualification { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; }
    .direct-qualification h4 { margin: 0 0 0.5rem; }
    .result-card { border-left: 4px solid #22c55e; }
    .result-card.result-large { border-left-color: #ef4444; }
    .result-main { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
    .result-icon { font-size: 2.5rem; }
    .result-text { flex: 1; }
    .result-title { display: block; font-size: 1.125rem; margin-bottom: 0.5rem; color: #16a34a; }
    .result-large .result-title { color: #dc2626; }
    .result-description { margin: 0; color: #64748b; font-size: 0.875rem; }
    .direct-alert { padding: 0.75rem 1rem; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #dc2626; border-radius: 8px; margin-bottom: 1rem; font-size: 0.813rem; }
    .score-breakdown { padding: 1rem; background: #f8fafc; border-radius: 8px; margin-bottom: 1rem; }
    .score-total { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .total-label { font-size: 0.875rem; color: #64748b; }
    .total-value { font-size: 1.5rem; font-weight: 700; color: #16a34a; }
    .total-value.high { color: #dc2626; }
    .score-bar { height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden; position: relative; }
    .score-bar::after { content: ''; position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; background: rgba(0,0,0,0.3); }
    .score-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #4ade80); border-radius: 6px; transition: width 0.3s; }
    .score-fill.high { background: linear-gradient(90deg, #ef4444, #f87171); }
    .threshold-marker { text-align: center; font-size: 0.625rem; color: #94a3b8; margin-top: 0.25rem; }
    .calculation-details { padding: 1rem; background: white; border-radius: 8px; margin-bottom: 1rem; }
    .calculation-details h4 { margin: 0 0 0.75rem; font-size: 0.875rem; }
    .detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
    .detail-item { display: flex; justify-content: space-between; font-size: 0.75rem; padding: 0.25rem 0; }
    .detail-label { color: #64748b; }
    .detail-value { font-weight: 500; color: #334155; }
    .result-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .info-card { background: rgba(86,135,243,0.05); }
    .legal-info { font-size: 0.875rem; }
    .legal-info p { margin: 0.5rem 0; }
    .legal-info ul { margin: 0.5rem 0; padding-left: 1.5rem; }
    .legal-info li { margin-bottom: 0.25rem; }
    @media (max-width: 1024px) { .calc-grid { grid-template-columns: repeat(2, 1fr); } .detail-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .calc-grid { grid-template-columns: 1fr; } .detail-grid { grid-template-columns: 1fr; } .result-actions { flex-direction: column; } }
  `],
})
export class LargeScaleCalculatorComponent implements OnInit {
  projectId = signal<number | null>(null);
  params = signal<any>({
    data_subjects_band: '1',
    data_volume_band: '0.5',
    categories_band: '0.5',
    frequency: '0.5',
    duration: '0.5',
    geographic_scope: '1',
    direct_health: false,
    direct_profiling: false,
    direct_surveillance: false,
    direct_biometric: false,
    direct_credit: false,
    direct_minors: false,
    direct_transfer: false,
    direct_courier: false,
  });

  private route = inject(ActivatedRoute);
  private pdpToolsService = inject(PdpToolsService);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const pid = params['project_id'];
      if (pid) this.projectId.set(parseInt(pid, 10));
    });
  }

  /**
   * Titulares scoring según MTGE:
   * 0 a 1.000 = 1 pt
   * 1.001 a 10.000 = 2 pts
   * 10.001 a 100.000 = 3 pts
   * 101.000 o más = 4 pts
   */
  getSubjectScore(): number {
    return parseFloat(this.params().data_subjects_band) || 1;
  }

  /**
   * Volumen (Tipos) scoring según MTGE:
   * Hasta 10 tipos = 0.5 pts
   * Entre 11 y 30 tipos = 1 pt
   * Entre 31 y 100 tipos = 2 pts
   * 101 o más tipos = 3 pts
   */
  getVolumeScore(): number {
    return parseFloat(this.params().data_volume_band) || 0.5;
  }

  /**
   * Categorías scoring según MTGE:
   * Solo básicos = 0.5 pts
   * Incluye 1 categoría especial = 2 pts
   * Más de 1 especial/penal = 3 pts
   */
  getCategoriesScore(): number {
    return parseFloat(this.params().categories_band) || 0.5;
  }

  /**
   * Frecuencia scoring según MTGE:
   * Puntual = 0.5 pts
   * Periódica = 1 pt
   * Continua / Tiempo real = 2 pts
   */
  getFrequencyScore(): number {
    return parseFloat(this.params().frequency) || 0.5;
  }

  /**
   * Permanencia scoring según MTGE:
   * Ocasional = 0.5 pts
   * Temporal = 1 pt
   * Prolongada = 2 pts
   */
  getDurationScore(): number {
    return parseFloat(this.params().duration) || 0.5;
  }

  /**
   * Alcance Geográfico scoring según MTGE:
   * Local = 1 pt
   * Nacional = 2 pts
   * Global/Transfronterizo = 3 pts
   */
  getGeographicScore(): number {
    return parseFloat(this.params().geographic_scope) || 1;
  }

  getTotalScore(): number {
    return this.getSubjectScore() + this.getVolumeScore() + this.getCategoriesScore() +
           this.getFrequencyScore() + this.getDurationScore() + this.getGeographicScore();
  }

  hasDirectQualification(): boolean {
    const p = this.params();
    return p.direct_health || p.direct_profiling || p.direct_surveillance ||
           p.direct_biometric || p.direct_credit || p.direct_minors ||
           p.direct_transfer || p.direct_courier;
  }

  isLargeScale(): boolean {
    // Direct qualification always counts
    if (this.hasDirectQualification()) return true;
    // Score-based: threshold is 8 puntos (MTGE)
    return this.getTotalScore() >= 8;
  }

  getResultClass(): string {
    return this.isLargeScale() ? 'large' : 'normal';
  }

  resetParams(): void {
    this.params.set({
      data_subjects_band: '1',
      data_volume_band: '0.5',
      categories_band: '0.5',
      frequency: '0.5',
      duration: '0.5',
      geographic_scope: '1',
      direct_health: false,
      direct_profiling: false,
      direct_surveillance: false,
      direct_biometric: false,
      direct_credit: false,
      direct_minors: false,
      direct_transfer: false,
      direct_courier: false,
    });
  }

  updateParam(field: string, value: any): void {
    this.params.update(p => ({ ...p, [field]: value }));
  }
}
