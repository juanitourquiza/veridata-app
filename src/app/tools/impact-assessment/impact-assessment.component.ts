import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdpToolsService } from '../pdp-tools.service';

// Impact Assessment Component - Evaluación de Riesgos e Impacto

@Component({
  selector: 'app-impact-assessment',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tools-container">
      <header class="tools-header">
        <h1>⚠️ Evaluación de Riesgos e Impacto</h1>
        <p class="tools-subtitle">Análisis de riesgos y evaluación de impacto en protección de datos</p>
      </header>

      <div class="vd-card">
        <h3>Evaluación de Impacto en Protección de Datos (EIPD)</h3>
        <p class="section-desc">Requerido según Art. 14 de la LOPDP para tratamientos a gran escala o de alto riesgo</p>

        <div class="eipd-form">
          <div class="form-row">
            <label class="vd-label">Nombre del tratamiento evaluado</label>
            <input class="vd-input" [ngModel]="assessment().name" (ngModelChange)="updateAssessment('name', $event)" placeholder="Identificación del tratamiento">
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="vd-label">Naturaleza de los datos</label>
              <select class="vd-select" [ngModel]="assessment().data_nature" (ngModelChange)="updateAssessment('data_nature', $event)">
                <option value="publicos">Datos públicos</option>
                <option value="ordinarios">Datos ordinarios</option>
                <option value="sensibles">Datos sensibles</option>
              </select>
            </div>
            <div class="form-group">
              <label class="vd-label">Volumen de titulares</label>
              <input type="number" class="vd-input" [ngModel]="assessment().volume" (ngModelChange)="updateAssessment('volume', $event)" placeholder="Cantidad">
            </div>
            <div class="form-group">
              <label class="vd-label">Duración del tratamiento</label>
              <select class="vd-select" [ngModel]="assessment().duration" (ngModelChange)="updateAssessment('duration', $event)">
                <option value="temporal">Temporal (&lt; 1 año)</option>
                <option value="prolongada">Prolongada (1-5 años)</option>
                <option value="permanente">Permanente (&gt; 5 años)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="vd-label">Contexto y finalidad</label>
              <select class="vd-select" [ngModel]="assessment().context" (ngModelChange)="updateAssessment('context', $event)">
                <option value="ordinario">Tratamiento ordinario</option>
                <option value="innovador">Nueva tecnología</option>
                <option value="sistematico">Monitoreo sistemático</option>
                <option value="vulnerables">Personas vulnerables</option>
              </select>
            </div>
          </div>

          <div class="risk-matrix">
            <h4>Matriz de Evaluación de Riesgos</h4>
            <table class="vd-table">
              <thead>
                <tr>
                  <th>Riesgo identificado</th>
                  <th>Probabilidad</th>
                  <th>Impacto</th>
                  <th>Nivel de riesgo</th>
                  <th>Medidas propuestas</th>
                </tr>
              </thead>
              <tbody>
                @for (risk of assessment().risks; track risk.id) {
                  <tr>
                    <td><input class="vd-input" [ngModel]="risk.description" (ngModelChange)="updateRiskField(risk.id, 'description', $event)" placeholder="Describa el riesgo"></td>
                    <td>
                      <select class="vd-select" [ngModel]="risk.probability" (ngModelChange)="updateRiskField(risk.id, 'probability', $event)">
                        <option [ngValue]="1">Baja</option>
                        <option [ngValue]="2">Media</option>
                        <option [ngValue]="3">Alta</option>
                      </select>
                    </td>
                    <td>
                      <select class="vd-select" [ngModel]="risk.impact" (ngModelChange)="updateRiskField(risk.id, 'impact', $event)">
                        <option [ngValue]="1">Leve</option>
                        <option [ngValue]="2">Moderado</option>
                        <option [ngValue]="3">Grave</option>
                      </select>
                    </td>
                    <td><span class="vd-badge" [class]="'vd-badge-' + calculateRiskLevel(risk)">{{ calculateRiskLevel(risk) }}</span></td>
                    <td><input class="vd-input" [ngModel]="risk.mitigation" (ngModelChange)="updateRiskField(risk.id, 'mitigation', $event)" placeholder="Medida de mitigación"></td>
                  </tr>
                }
              </tbody>
            </table>
            <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="addRisk()">+ Agregar riesgo</button>
          </div>

          <div class="action-buttons">
            <button class="vd-btn vd-btn-primary" (click)="generateEIPD()">📄 Generar EIPD</button>
            <button class="vd-btn vd-btn-secondary" (click)="saveAssessment()">💾 Guardar evaluación</button>
          </div>
        </div>
      </div>

      <!-- History -->
      <div class="vd-card">
        <h3>📚 Histórico de Evaluaciones</h3>
        <div class="history-list">
          @for (item of assessmentHistory(); track item.id) {
            <div class="history-item">
              <span>{{ item.name }}</span>
              <span class="history-meta">{{ item.date | date:'dd/MM/yyyy' }} - {{ item.risk_level }}</span>
              <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="viewAssessment(item.id)">Ver</button>
            </div>
          }
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
    .eipd-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-row { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .risk-matrix { margin-top: 1rem; }
    .risk-matrix h4 { margin-bottom: 0.75rem; font-size: 1rem; }
    .vd-badge-alta { background: rgba(239,68,68,0.1); color: #dc2626; }
    .vd-badge-media { background: rgba(245,158,11,0.1); color: #d97706; }
    .vd-badge-baja { background: rgba(34,197,94,0.1); color: #16a34a; }
    .action-buttons { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
    .history-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .history-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8fafc; border-radius: 8px; }
    .history-meta { color: #64748b; font-size: 0.875rem; }
    @media (max-width: 1024px) { .form-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
  `],
})
export class ImpactAssessmentComponent implements OnInit {
  assessment = signal<any>({
    name: '',
    data_nature: 'ordinarios',
    volume: 0,
    duration: 'temporal',
    context: 'ordinario',
    risks: []
  });
  assessmentHistory = signal<any[]>([]);
  loading = signal(false);

  private pdpToolsService = inject(PdpToolsService);

  ngOnInit(): void {
    this.addRisk(); // Add first risk row
    this.loadHistory();
  }

  addRisk(): void {
    this.assessment.update(a => ({
      ...a,
      risks: [...a.risks, { id: a.risks.length + 1, description: '', probability: 1, impact: 1, mitigation: '' }]
    }));
  }

  calculateRiskLevel(risk: any): string {
    const score = risk.probability * risk.impact;
    if (score >= 6) return 'alta';
    if (score >= 3) return 'media';
    return 'baja';
  }

  generateEIPD(): void {
    alert('Generando documento EIPD... (integración con PDF próximamente)');
  }

  saveAssessment(): void {
    const data = {
      name: this.assessment().name,
      data_nature: this.assessment().data_nature,
      volume: this.assessment().volume,
      duration: this.assessment().duration,
      context: this.assessment().context,
      risks: this.assessment().risks
    };

    this.pdpToolsService.createImpactAssessment(data).subscribe({
      next: () => {
        alert('Evaluación guardada correctamente');
        this.loadHistory();
      },
      error: (err: any) => alert('Error al guardar: ' + err.message)
    });
  }

  loadHistory(): void {
    this.pdpToolsService.getImpactAssessments().subscribe({
      next: (res: any) => {
        this.assessmentHistory.set(res.data || []);
      },
      error: (err: any) => console.error('Error loading assessments:', err)
    });
  }

  viewAssessment(id: number): void {
    this.pdpToolsService.getImpactAssessment(id).subscribe({
      next: (res: any) => {
        this.assessment.set({
          name: res.name,
          data_nature: res.data_nature,
          volume: res.volume,
          duration: res.duration,
          context: res.context,
          risks: res.risks || []
        });
      },
      error: (err: any) => alert('Error al cargar evaluación: ' + err.message)
    });
  }

  updateAssessment(field: string, value: any): void {
    this.assessment.update(a => ({ ...a, [field]: value }));
  }

  updateRiskField(riskId: number, field: string, value: any): void {
    this.assessment.update(a => ({
      ...a,
      risks: a.risks.map((r: any) => r.id === riskId ? { ...r, [field]: value } : r)
    }));
  }
}
