import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdpToolsService } from '../pdp-tools.service';

// Large Scale Calculator - Cálculo de Gran Escala según Art. 14 LOPDP y R52-2026
// Corrected scoring logic based on SPDP methodology

@Component({
  selector: 'app-large-scale-calculator',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tools-container">
      <header class="tools-header">
        <h1>📊 Cálculo de Gran Escala</h1>
        <p class="tools-subtitle">Determinación de tratamiento a gran escala según Reglamento R52-2026 de la SPDP Ecuador</p>
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
              <input type="number" class="vd-input" [ngModel]="params().data_subjects" (ngModelChange)="updateParam('data_subjects', $event)" min="0">
              <small class="input-help">Incluye todos los titulares cuyos datos se tratan en un año</small>
            </div>
            <div class="parameter-score">
              <span class="score-label">Puntuación:</span>
              <span class="score-value">{{ getSubjectScore() }} puntos</span>
            </div>
          </div>

          <!-- Data Volume -->
          <div class="calc-section">
            <h4>📦 Volumen de Datos</h4>
            <div class="form-group">
              <label class="vd-label">Tipos de datos por titular</label>
              <input type="number" class="vd-input" [ngModel]="params().data_volume" (ngModelChange)="updateParam('data_volume', $event)" min="0">
              <small class="input-help">Cantidad promedio de categorías diferentes por titular</small>
            </div>
            <div class="parameter-score">
              <span class="score-label">Puntuación:</span>
              <span class="score-value">{{ getVolumeScore() }} puntos</span>
            </div>
          </div>

          <!-- Treatment Frequency -->
          <div class="calc-section">
            <h4>🔄 Frecuencia del Tratamiento</h4>
            <div class="form-group">
              <label class="vd-label">Periodicidad del tratamiento</label>
              <select class="vd-select" [ngModel]="params().frequency" (ngModelChange)="updateParam('frequency', $event)">
                <option value="puntual">Puntual (única vez)</option>
                <option value="periodica">Periódica (múltiples veces al año)</option>
                <option value="continua">Continua (permanente/tiempo real)</option>
              </select>
            </div>
            <div class="parameter-score">
              <span class="score-label">Puntuación:</span>
              <span class="score-value">{{ getFrequencyScore() }} puntos</span>
            </div>
          </div>

          <!-- Treatment Duration -->
          <div class="calc-section">
            <h4>⏱️ Permanencia del Tratamiento</h4>
            <div class="form-group">
              <label class="vd-label">Duración del tratamiento</label>
              <select class="vd-select" [ngModel]="params().duration" (ngModelChange)="updateParam('duration', $event)">
                <option value="ocasional">Ocasional (< 3 meses)</option>
                <option value="temporal">Temporal (3-12 meses)</option>
                <option value="prolongada">Prolongada (> 12 meses)</option>
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
                <option value="local">Local (una ciudad/localidad)</option>
                <option value="regional">Regional (varias provincias)</option>
                <option value="nacional">Nacional (todo el país)</option>
                <option value="internacional">Internacional (múltiples países)</option>
              </select>
            </div>
            <div class="parameter-score">
              <span class="score-label">Puntuación:</span>
              <span class="score-value">{{ getGeographicScore() }} puntos</span>
            </div>
          </div>

          <!-- Special Data Categories -->
          <div class="calc-section">
            <h4>⚠️ Datos Especiales</h4>
            <div class="checkbox-list">
              <label class="checkbox-item">
                <input type="checkbox" [ngModel]="params().health_data" (ngModelChange)="updateParam('health_data', $event)">
                <span>Datos de salud</span>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" [ngModel]="params().financial_data" (ngModelChange)="updateParam('financial_data', $event)">
                <span>Datos financieros</span>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" [ngModel]="params().biometric_data" (ngModelChange)="updateParam('biometric_data', $event)">
                <span>Datos biométricos</span>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" [ngModel]="params().minors_data" (ngModelChange)="updateParam('minors_data', $event)">
                <span>Datos de menores</span>
              </label>
            </div>
            <div class="parameter-score">
              <span class="score-label">Puntuación especial:</span>
              <span class="score-value">{{ getSpecialScore() }} puntos</span>
            </div>
          </div>
        </div>

        <!-- Direct Qualification Cases -->
        <div class="direct-qualification">
          <h4>⚡ Casos de Calificación Directa</h4>
          <p class="section-desc">El tratamiento se presume a gran escala si cumple alguno de estos criterios (Art. 14.3 LOPDP):</p>
          <div class="checkbox-list">
            <label class="checkbox-item">
              <input type="checkbox" [ngModel]="params().direct_profiling" (ngModelChange)="updateParam('direct_profiling', $event)">
              <span>Perfilamiento sistemático con efectos significativos</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" [ngModel]="params().direct_surveillance" (ngModelChange)="updateParam('direct_surveillance', $event)">
              <span>Vigilancia sistemática de áreas públicas</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" [ngModel]="params().direct_sensitive_massive" (ngModelChange)="updateParam('direct_sensitive_massive', $event)">
              <span>Tratamiento masivo de datos sensibles</span>
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
            <span class="total-label">Puntuación Total:</span>
            <span class="total-value" [class.high]="getTotalScore() >= 50">{{ getTotalScore() }} / 100</span>
          </div>
          <div class="score-bar">
            <div class="score-fill" [style.width.%]="getTotalScore()" [class.high]="isLargeScale()"></div>
          </div>
          <div class="threshold-marker">Umbral: 50 puntos</div>
        </div>

        <div class="calculation-details">
          <h4>Desglose del cálculo MTGE:</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Titulares ({{ params().data_subjects || 0 | number }}):</span>
              <span class="detail-value">{{ getSubjectScore() }} pts</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Volumen ({{ params().data_volume || 0 }}):</span>
              <span class="detail-value">{{ getVolumeScore() }} pts</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Frecuencia:</span>
              <span class="detail-value">{{ getFrequencyScore() }} pts</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Permanencia:</span>
              <span class="detail-value">{{ getDurationScore() }} pts</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Alcance:</span>
              <span class="detail-value">{{ getGeographicScore() }} pts</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Datos especiales:</span>
              <span class="detail-value">{{ getSpecialScore() }} pts</span>
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
    .tools-header h1 { font-size: 1.5rem; color: #0f172a; margin: 0 0 0.5rem; }
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
export class LargeScaleCalculatorComponent {
  params = signal<any>({
    data_subjects: 1000,
    data_volume: 1000,
    frequency: 'puntual',
    duration: 'temporal',
    geographic_scope: 'regional',
    health_data: true,
    financial_data: true,
    biometric_data: false,
    minors_data: false,
    direct_profiling: false,
    direct_surveillance: false,
    direct_sensitive_massive: false,
  });

  private pdpToolsService = inject(PdpToolsService);

  /**
   * Titulares scoring (max 25 pts):
   * The R52-2026 methodology uses logarithmic-like bands.
   * >= 100,000 titulares → 25 pts (automatic gran escala if sensibles > 5000)
   * >= 50,000 → 20 pts
   * >= 10,000 → 15 pts
   * >= 5,000 → 10 pts
   * >= 1,000 → 5 pts
   * >= 500 → 3 pts
   * < 500 → 1 pt
   */
  getSubjectScore(): number {
    const s = this.params().data_subjects || 0;
    if (s >= 100000) return 25;
    if (s >= 50000) return 20;
    if (s >= 10000) return 15;
    if (s >= 5000) return 10;
    if (s >= 1000) return 5;
    if (s >= 500) return 3;
    if (s > 0) return 1;
    return 0;
  }

  /**
   * Volumen de datos scoring (max 15 pts):
   * Number of data categories per person.
   * >= 100 types → 15 pts
   * >= 50 → 12 pts
   * >= 20 → 10 pts
   * >= 10 → 7 pts
   * >= 5 → 5 pts
   * < 5 → proportional up to 4 pts
   */
  getVolumeScore(): number {
    const v = this.params().data_volume || 0;
    if (v >= 100) return 15;
    if (v >= 50) return 12;
    if (v >= 20) return 10;
    if (v >= 10) return 7;
    if (v >= 5) return 5;
    if (v > 0) return Math.min(4, v);
    return 0;
  }

  /**
   * Frecuencia scoring (max 15 pts):
   * puntual → 0
   * periódica → 8
   * continua → 15
   */
  getFrequencyScore(): number {
    const scores: Record<string, number> = { puntual: 0, periodica: 8, continua: 15 };
    return scores[this.params().frequency] || 0;
  }

  /**
   * Permanencia scoring (max 10 pts):
   * ocasional → 2
   * temporal → 5
   * prolongada → 10
   */
  getDurationScore(): number {
    const scores: Record<string, number> = { ocasional: 2, temporal: 5, prolongada: 10 };
    return scores[this.params().duration] || 0;
  }

  /**
   * Alcance geográfico scoring (max 15 pts):
   * local → 2
   * regional → 5
   * nacional → 10
   * internacional → 15
   */
  getGeographicScore(): number {
    const scores: Record<string, number> = { local: 2, regional: 5, nacional: 10, internacional: 15 };
    return scores[this.params().geographic_scope] || 0;
  }

  /**
   * Datos especiales scoring (max 20 pts):
   * Salud → 5 pts
   * Financieros → 3 pts
   * Biométricos → 5 pts
   * Menores → 7 pts
   */
  getSpecialScore(): number {
    let score = 0;
    if (this.params().health_data) score += 5;
    if (this.params().financial_data) score += 3;
    if (this.params().biometric_data) score += 5;
    if (this.params().minors_data) score += 7;
    return score;
  }

  getTotalScore(): number {
    return Math.min(100,
      this.getSubjectScore() + this.getVolumeScore() + this.getFrequencyScore() +
      this.getDurationScore() + this.getGeographicScore() + this.getSpecialScore()
    );
  }

  hasDirectQualification(): boolean {
    return this.params().direct_profiling || this.params().direct_surveillance || this.params().direct_sensitive_massive;
  }

  isLargeScale(): boolean {
    // Direct qualification always counts
    if (this.hasDirectQualification()) return true;
    // Score-based: threshold is 50
    return this.getTotalScore() >= 50;
  }

  getResultClass(): string {
    return this.isLargeScale() ? 'large' : 'normal';
  }

  resetParams(): void {
    this.params.set({
      data_subjects: 0,
      data_volume: 0,
      frequency: 'puntual',
      duration: 'ocasional',
      geographic_scope: 'local',
      health_data: false,
      financial_data: false,
      biometric_data: false,
      minors_data: false,
      direct_profiling: false,
      direct_surveillance: false,
      direct_sensitive_massive: false,
    });
  }

  updateParam(field: string, value: any): void {
    this.params.update(p => ({ ...p, [field]: value }));
  }
}
