import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdpToolsService } from '../pdp-tools.service';

// Incidents Component - Registro de Incidentes PDP con decisión automática SPDP

@Component({
  selector: 'app-incidents',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tools-container">
      <header class="tools-header">
        <h1>🚨 Registro de Incidentes de Protección de Datos</h1>
        <p class="tools-subtitle">Matriz de registro y decisión automática de notificación a la Superintendencia de Protección de Datos</p>
      </header>

      <!-- New Incident Form -->
      <div class="vd-card">
        <h3>➕ Reportar Nuevo Incidente</h3>
        <div class="incident-form">
          <div class="form-section">
            <h4>📋 INFORMACIÓN GENERAL</h4>
            <div class="form-grid">
              <div class="form-group">
                <label class="vd-label">Fecha de detección *</label>
                <input type="date" class="vd-input" [ngModel]="newIncident().detection_date" (ngModelChange)="updateNewIncident('detection_date', $event)">
              </div>
              <div class="form-group">
                <label class="vd-label">Fecha de ocurrencia (estimada)</label>
                <input type="date" class="vd-input" [ngModel]="newIncident().occurrence_date" (ngModelChange)="updateNewIncident('occurrence_date', $event)">
              </div>
              <div class="form-group">
                <label class="vd-label">Tipo de incidente *</label>
                <select class="vd-select" [ngModel]="newIncident().type" (ngModelChange)="updateNewIncident('type', $event)">
                  <option value="">Seleccionar...</option>
                  <option value="acceso_no_autorizado">Acceso no autorizado</option>
                  <option value="divulgacion_no_autorizada">Divulgación no autorizada</option>
                  <option value="modificacion_no_autorizada">Modificación no autorizada</option>
                  <option value="perdida">Pérdida / destrucción de datos</option>
                  <option value="robo">Robo o sustracción</option>
                  <option value="ataque_cibernetico">Ataque cibernético / ransomware</option>
                  <option value="phishing">Phishing / ingeniería social</option>
                  <option value="error_humano">Error humano</option>
                  <option value="falla_tecnica">Falla técnica / del sistema</option>
                  <option value="tratamiento_no_autorizado">Tratamiento ilícito o no autorizado</option>
                </select>
              </div>
              <div class="form-group">
                <label class="vd-label">Canal de detección</label>
                <select class="vd-select" [ngModel]="newIncident().detection_channel" (ngModelChange)="updateNewIncident('detection_channel', $event)">
                  <option value="monitoreo">Monitoreo interno</option>
                  <option value="reporte_usuario">Reporte de usuario</option>
                  <option value="auditoria">Auditoría</option>
                  <option value="tercero">Reporte de tercero</option>
                  <option value="autoridad">Notificación de autoridad</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>👤 TITULARES AFECTADOS</h4>
            <div class="form-grid">
              <div class="form-group">
                <label class="vd-label">¿Cuántos titulares se estima afectados? *</label>
                <input type="number" class="vd-input" [ngModel]="newIncident().affected_count" (ngModelChange)="updateNewIncident('affected_count', $event)" min="0">
              </div>
              <div class="form-group form-group-full">
                <label class="vd-label">Categorías de datos afectados *</label>
                <div class="checkbox-grid">
                  @for (dc of dataCategoryOptions; track dc.value) {
                    <label class="checkbox-item" [class.special]="dc.special">
                      <input type="checkbox"
                        [checked]="isDataCategorySelected(dc.value)"
                        (change)="toggleDataCategory(dc.value)">
                      <span class="checkbox-label">{{ dc.label }}</span>
                    </label>
                  }
                </div>
              </div>
              <div class="form-group">
                <label class="vd-label">¿El incidente afecta datos de menores?</label>
                <select class="vd-select" [ngModel]="newIncident().affects_minors" (ngModelChange)="updateNewIncident('affects_minors', $event)">
                  <option [ngValue]="false">No</option>
                  <option [ngValue]="true">Sí</option>
                </select>
              </div>
              <div class="form-group">
                <label class="vd-label">¿El incidente afecta datos sensibles?</label>
                <select class="vd-select" [ngModel]="newIncident().affects_sensitive" (ngModelChange)="updateNewIncident('affects_sensitive', $event)">
                  <option [ngValue]="false">No</option>
                  <option [ngValue]="true">Sí</option>
                </select>
              </div>
              <div class="form-group">
                <label class="vd-label">¿El incidente es de carácter masivo? *</label>
                <select class="vd-select" [ngModel]="newIncident().is_massive" (ngModelChange)="updateNewIncident('is_massive', $event)">
                  <option [ngValue]="false">No</option>
                  <option [ngValue]="true">Sí (>1000 titulares)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="vd-label">Área responsable</label>
                <input class="vd-input" [ngModel]="newIncident().responsible_area" (ngModelChange)="updateNewIncident('responsible_area', $event)" placeholder="Ej: Seguridad, IT, Legal">
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>⚖️ EVALUACIÓN DE RIESGO (Matriz de Decisión)</h4>
            <div class="instruction-box">
              <p><strong>Instrucción:</strong> Complete todos los factores según la matriz de incidentes. El sistema calculará automáticamente el puntaje de riesgo, nivel de riesgo, y la decisión de notificación a SPDP y al titular.</p>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="vd-label">Tipo de afectación *</label>
                <select class="vd-select" [ngModel]="newIncident().impact_type" (ngModelChange)="updateNewIncident('impact_type', $event)">
                  <option value="">Seleccionar...</option>
                  <option value="confidencialidad">Confidencialidad (3 pts)</option>
                  <option value="integridad">Integridad (2 pts)</option>
                  <option value="disponibilidad">Disponibilidad (1 pt)</option>
                  <option value="multiples">Múltiples dimensiones (4 pts)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="vd-label">¿Credenciales / datos financieros / salud expuestos?</label>
                <select class="vd-select" [ngModel]="newIncident().credentials_exposed" (ngModelChange)="updateNewIncident('credentials_exposed', $event)">
                  <option [ngValue]="false">No (0 pts)</option>
                  <option [ngValue]="true">Sí (3 pts)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="vd-label">Facilidad de identificación</label>
                <select class="vd-select" [ngModel]="newIncident().identification_ease" (ngModelChange)="updateNewIncident('identification_ease', $event)">
                  <option value="baja">Baja (1 pt)</option>
                  <option value="media">Media (2 pts)</option>
                  <option value="alta">Alta (3 pts)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="vd-label">Consecuencia potencial</label>
                <select class="vd-select" [ngModel]="newIncident().potential_consequence" (ngModelChange)="updateNewIncident('potential_consequence', $event)">
                  <option value="baja">Baja (1 pt)</option>
                  <option value="media">Media (2 pts)</option>
                  <option value="alta">Alta (3 pts)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="vd-label">Protección previa</label>
                <select class="vd-select" [ngModel]="newIncident().prior_protection" (ngModelChange)="updateNewIncident('prior_protection', $event)">
                  <option value="si">Sí, existían controles (0 pts)</option>
                  <option value="parcial">Parcial (2 pts)</option>
                  <option value="no">No había protección (3 pts)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="vd-label">¿Datos cifrados o seudonimizados de forma robusta?</label>
                <select class="vd-select" [ngModel]="newIncident().data_encrypted" (ngModelChange)="updateNewIncident('data_encrypted', $event)">
                  <option [ngValue]="true">Sí (0 pts)</option>
                  <option [ngValue]="false">No (3 pts)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="vd-label">¿Se mitigó el riesgo y ya no es probable que ocurra daño?</label>
                <select class="vd-select" [ngModel]="newIncident().risk_mitigated" (ngModelChange)="updateNewIncident('risk_mitigated', $event)">
                  <option [ngValue]="true">Sí (0 pts)</option>
                  <option [ngValue]="false">No (2 pts)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="vd-label">¿Es esfuerzo desproporcionado notificar al titular?</label>
                <select class="vd-select" [ngModel]="newIncident().disproportionate_effort" (ngModelChange)="updateNewIncident('disproportionate_effort', $event)">
                  <option [ngValue]="false">No</option>
                  <option [ngValue]="true">Sí</option>
                </select>
              </div>
            </div>

            <!-- Live Risk Score Preview -->
            <div class="risk-preview">
              <div class="risk-score-box" [class]="'risk-' + getPreviewRiskLevel()">
                <span class="risk-score-value">{{ getPreviewRiskScore() }}/21</span>
                <span class="risk-score-label">Puntaje riesgo</span>
              </div>
              <div class="risk-level-box" [class]="'risk-' + getPreviewRiskLevel()">
                <span class="risk-level-value">{{ getPreviewRiskLevel() | uppercase }}</span>
                <span class="risk-level-label">Nivel riesgo</span>
              </div>
              <div class="risk-decision-box">
                <span class="risk-decision-value">{{ getPreviewNotifySpdp() ? '🚨 SÍ' : '✅ NO' }}</span>
                <span class="risk-decision-label">¿Notificar SPDP?</span>
              </div>
              <div class="risk-decision-box">
                <span class="risk-decision-value">{{ getPreviewNotifyTitular() ? '🚨 SÍ' : '✅ NO' }}</span>
                <span class="risk-decision-label">¿Notificar titular?</span>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>📝 DESCRIPCIÓN</h4>
            <div class="form-row">
              <div class="form-group full">
                <label class="vd-label">Descripción detallada del incidente *</label>
                <textarea class="vd-input" rows="4" [ngModel]="newIncident().description" (ngModelChange)="updateNewIncident('description', $event)" placeholder="Describa qué ocurrió, cómo se detectó, datos involucrados..."></textarea>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group full">
                <label class="vd-label">Medidas de contención aplicadas</label>
                <textarea class="vd-input" rows="3" [ngModel]="newIncident().containment_measures" (ngModelChange)="updateNewIncident('containment_measures', $event)" placeholder="¿Qué se hizo para detener/contener el incidente?"></textarea>
              </div>
            </div>
          </div>

          <button class="vd-btn vd-btn-primary" (click)="addIncident()" [disabled]="saving()">
            {{ saving() ? '🚨 Registrando...' : '🚨 Registrar Incidente' }}
          </button>
        </div>
      </div>

      <!-- Automatic Decision Panel -->
      @if (lastIncidentDecision()) {
        <div class="vd-card decision-panel" [class]="'decision-' + lastIncidentDecision()?.decision">
          <h3>🤖 Decisión Automática - Notificación SPDP</h3>
          <div class="decision-result">
            <div class="decision-icon">{{ lastIncidentDecision()?.decision === 'notificar' ? '🚨' : lastIncidentDecision()?.decision === 'evaluar' ? '⚠️' : '✅' }}</div>
            <div class="decision-text">
              <strong>{{ lastIncidentDecision()?.decision === 'notificar' ? 'DEBE NOTIFICAR A LA SPDP' : lastIncidentDecision()?.decision === 'evaluar' ? 'EVALUAR NOTIFICACIÓN' : 'NO REQUIERE NOTIFICACIÓN' }}</strong>
              <p>{{ lastIncidentDecision()?.reason }}</p>
            </div>
          </div>
          <div class="decision-criteria">
            <h4>Factores de riesgo evaluados:</h4>
            <div class="criteria-grid">
              @for (criterion of lastIncidentDecision()?.criteria; track criterion.name) {
                <div class="criterion-item">
                  <span class="criterion-name">{{ criterion.name }}</span>
                  <span class="criterion-score" [class.high]="criterion.score >= criterion.max * 0.7">{{ criterion.score }}/{{ criterion.max }}</span>
                </div>
              }
            </div>
          </div>
          @if (lastIncidentDecision()?.notify_titular) {
            <div class="alert alert-danger">
              <strong>⚠️ También debe notificarse al titular afectado</strong> (Art. 24 RGLOPDP)
            </div>
          }
          <div class="decision-actions">
            @if (lastIncidentDecision()?.decision === 'notificar') {
              <button class="vd-btn vd-btn-danger" (click)="notifySpdp()">🚨 Notificar a SPDP</button>
            }
            <button class="vd-btn vd-btn-secondary" (click)="viewLegalBasis()">📚 Ver fundamento legal</button>
          </div>
        </div>
      }

      <!-- Incidents List -->
      <div class="vd-card">
        <div class="section-header">
          <h3>📊 Incidentes Registrados</h3>
          <div class="filters">
            <select class="vd-select vd-select-sm" [ngModel]="filterDecision()" (ngModelChange)="filterDecision.set($event); loadIncidents()">
              <option value="">Todos</option>
              <option value="notificar">Requieren notificación</option>
              <option value="no_notificar">No requieren</option>
            </select>
            <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="exportIncidents()">📥 Exportar</button>
          </div>
        </div>

        <div class="table-container">
          @if (incidents().length === 0) {
            <div class="empty-state"><p>No hay incidentes registrados.</p></div>
          } @else {
            <table class="vd-table incidents-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha det.</th>
                  <th>Tipo</th>
                  <th>Titulares</th>
                  <th>Categoría datos</th>
                  <th>Puntaje</th>
                  <th>¿Notificar SPDP?</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (incident of filteredIncidents(); track incident.id) {
                  <tr [class]="'row-' + incident.notification_decision">
                    <td><strong>{{ incident.code }}</strong></td>
                    <td>{{ incident.detection_date | date:'dd/MM/yy' }}</td>
                    <td>{{ getTypeLabel(incident.type) }}</td>
                    <td>{{ incident.affected_count }}</td>
                    <td>{{ formatCategories(incident.data_categories) }}</td>
                    <td>{{ incident.risk_score || '—' }}/21</td>
                    <td>
                      <span class="vd-badge" [class]="'vd-badge-' + incident.notification_decision">
                        {{ incident.notification_decision === 'notificar' ? '🚨 SÍ' : incident.notification_decision === 'evaluar' ? '⚠️ Evaluar' : '✅ No' }}
                      </span>
                    </td>
                    <td>
                      <select class="vd-select vd-select-sm" [(ngModel)]="incident.status">
                        <option value="detectado">🔴 Detectado</option>
                        <option value="en_investigacion">🟡 En investigación</option>
                        <option value="contenido">🟠 Contenido</option>
                        <option value="notificado">📤 Notificado SPDP</option>
                        <option value="cerrado">📋 Cerrado</option>
                      </select>
                    </td>
                    <td><button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="viewIncident(incident.id)">Ver</button></td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>

      <!-- Statistics -->
      <div class="vd-card">
        <h3>📈 Estadísticas de Incidentes</h3>
        <div class="stats-grid">
          <div class="stat-item danger">
            <span class="stat-number">{{ incidentsRequiringNotification() }}</span>
            <span class="stat-label">Requieren notificación</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ totalIncidents() }}</span>
            <span class="stat-label">Total incidentes</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ incidentsByType('ataque_cibernetico') }}</span>
            <span class="stat-label">Ciberataques</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ incidentsByType('acceso_no_autorizado') }}</span>
            <span class="stat-label">Accesos no autorizados</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tools-container { max-width: 1400px; margin: 0 auto; }
    .tools-header { margin-bottom: 1.5rem; }
    .tools-header h1 { font-size: 1.5rem; color: #0f172a; margin: 0 0 0.5rem; }
    .tools-subtitle { color: #64748b; font-size: 0.875rem; }
    .incident-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-section h4 { margin: 0 0 1rem; font-size: 0.875rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .form-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .form-row { display: flex; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group.full { flex: 1; }
    .form-group-full { grid-column: 1 / -1; }
    .checkbox-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
    .checkbox-item {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem;
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer;
      font-size: 0.8rem; transition: all 0.15s ease;
    }
    .checkbox-item:hover { background: #edf2f7; border-color: #cbd5e0; }
    .checkbox-item.special { border-left: 3px solid #e53e3e; }
    .checkbox-item input[type="checkbox"] { accent-color: #5687f3; width: 16px; height: 16px; }
    .checkbox-label { flex: 1; color: #2d3748; }
    .instruction-box { background: rgba(86,135,243,0.05); border-left: 4px solid #5687f3; padding: 1rem; margin-bottom: 1rem; border-radius: 0 8px 8px 0; }
    .instruction-box p { margin: 0; font-size: 0.875rem; color: #334155; }
    .risk-preview { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px; }
    .risk-score-box, .risk-level-box, .risk-decision-box { text-align: center; padding: 0.75rem; border-radius: 8px; background: white; border: 1px solid #e2e8f0; }
    .risk-score-value, .risk-level-value, .risk-decision-value { display: block; font-size: 1.25rem; font-weight: 700; }
    .risk-score-label, .risk-level-label, .risk-decision-label { display: block; font-size: 0.7rem; color: #64748b; margin-top: 0.25rem; }
    .risk-bajo { border-color: rgba(34,197,94,0.3); }
    .risk-bajo .risk-score-value, .risk-bajo .risk-level-value { color: #16a34a; }
    .risk-medio { border-color: rgba(245,158,11,0.3); }
    .risk-medio .risk-score-value, .risk-medio .risk-level-value { color: #d97706; }
    .risk-alto { border-color: rgba(239,68,68,0.3); }
    .risk-alto .risk-score-value, .risk-alto .risk-level-value { color: #dc2626; }
    .decision-panel { border-left: 4px solid #f59e0b; }
    .decision-panel.decision-notificar { border-left-color: #ef4444; }
    .decision-panel.decision-no_notificar { border-left-color: #22c55e; }
    .decision-result { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; background: rgba(245,158,11,0.05); }
    .decision-notificar .decision-result { background: rgba(239,68,68,0.05); }
    .decision-no_notificar .decision-result { background: rgba(34,197,94,0.05); }
    .decision-icon { font-size: 2rem; }
    .decision-text { flex: 1; }
    .decision-text strong { display: block; font-size: 1.125rem; margin-bottom: 0.5rem; color: #f59e0b; }
    .decision-notificar .decision-text strong { color: #dc2626; }
    .decision-no_notificar .decision-text strong { color: #16a34a; }
    .decision-text p { margin: 0; color: #64748b; font-size: 0.875rem; }
    .decision-criteria { margin-bottom: 1rem; }
    .decision-criteria h4 { margin: 0 0 0.75rem; font-size: 0.875rem; }
    .criteria-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
    .criterion-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: #f8fafc; border-radius: 6px; font-size: 0.8rem; }
    .criterion-name { color: #334155; }
    .criterion-score { font-weight: 700; color: #16a34a; }
    .criterion-score.high { color: #dc2626; }
    .alert { padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .alert-danger { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #dc2626; }
    .decision-actions { display: flex; gap: 0.75rem; }
    .vd-btn-danger { background: #ef4444; color: white; }
    .vd-btn-danger:hover { background: #dc2626; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .section-header h3 { margin: 0; }
    .filters { display: flex; gap: 0.5rem; }
    .table-container { overflow-x: auto; }
    .incidents-table { min-width: 1100px; }
    .incidents-table th { font-size: 0.6875rem; background: #f8fafc; }
    .incidents-table td { padding: 0.75rem; font-size: 0.875rem; }
    .incidents-table tr.row-notificar { background: rgba(239,68,68,0.05); }
    .empty-state { padding: 2rem; text-align: center; color: #94a3b8; }
    .vd-select-sm { padding: 0.25rem; font-size: 0.75rem; }
    .vd-badge-notificar { background: rgba(239,68,68,0.1); color: #dc2626; font-weight: 600; }
    .vd-badge-evaluar { background: rgba(245,158,11,0.1); color: #d97706; }
    .vd-badge-no_notificar { background: rgba(34,197,94,0.1); color: #16a34a; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .stat-item { text-align: center; padding: 1.25rem; background: #f8fafc; border-radius: 8px; }
    .stat-item.danger { background: rgba(239,68,68,0.05); }
    .stat-number { display: block; font-size: 1.75rem; font-weight: 700; color: #5687f3; }
    .stat-item.danger .stat-number { color: #dc2626; }
    .stat-label { font-size: 0.75rem; color: #64748b; }
    @media (max-width: 1024px) { .form-grid { grid-template-columns: repeat(2, 1fr); } .checkbox-grid { grid-template-columns: repeat(2, 1fr); } .stats-grid { grid-template-columns: repeat(2, 1fr); } .risk-preview { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } .form-row { flex-direction: column; } .checkbox-grid { grid-template-columns: 1fr; } .risk-preview { grid-template-columns: 1fr; } }
  `],
})
export class IncidentsComponent implements OnInit {
  newIncident = signal<any>({
    detection_date: '', occurrence_date: '', type: '', detection_channel: 'monitoreo',
    affected_count: 0, data_categories: [] as string[], affects_minors: false, affects_sensitive: false,
    risk_of_harm: false, harm_type: '', is_massive: false, responsible_area: '',
    description: '', containment_measures: '',
    // Risk assessment fields from Excel matrix
    impact_type: '', credentials_exposed: false, identification_ease: 'media',
    potential_consequence: 'media', prior_protection: 'no', data_encrypted: false,
    risk_mitigated: false, disproportionate_effort: false,
  });

  dataCategoryOptions = [
    { value: 'generales', label: 'Datos generales (nombre, contacto)', special: false },
    { value: 'sensibles_no_id', label: 'Sensibles sin identificación', special: true },
    { value: 'sensibles_id', label: 'Sensibles con identificación', special: true },
    { value: 'financieros', label: 'Datos financieros', special: false },
    { value: 'biometricos', label: 'Datos biométricos', special: true },
    { value: 'salud', label: 'Datos de salud', special: true },
    { value: 'menores', label: 'Datos de menores', special: true },
    { value: 'credenciales', label: 'Credenciales / contraseñas', special: false },
  ];

  incidents = signal<any[]>([]);
  filterDecision = signal<string>('');
  lastIncidentDecision = signal<any>(null);
  saving = signal(false);

  private pdpToolsService = inject(PdpToolsService);

  ngOnInit(): void {
    this.loadIncidents();
  }

  // Data categories multiselect
  isDataCategorySelected(value: string): boolean {
    return (this.newIncident().data_categories || []).includes(value);
  }

  toggleDataCategory(value: string): void {
    const current = [...(this.newIncident().data_categories || [])];
    const index = current.indexOf(value);
    if (index > -1) { current.splice(index, 1); } else { current.push(value); }
    this.updateNewIncident('data_categories', current);
  }

  formatCategories(categories: any): string {
    if (!categories) return '—';
    const arr = typeof categories === 'string' ? ((() => { try { return JSON.parse(categories); } catch { return [categories]; } })()) : categories;
    if (!Array.isArray(arr)) return String(categories);
    const labels: Record<string, string> = {
      generales: 'Generales', sensibles_no_id: 'Sensibles', sensibles_id: 'Sensibles+ID',
      financieros: 'Financieros', biometricos: 'Biométricos', salud: 'Salud',
      menores: 'Menores', credenciales: 'Credenciales',
    };
    return arr.map((c: string) => labels[c] || c).join(', ');
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      acceso_no_autorizado: 'Acceso no autorizado', divulgacion_no_autorizada: 'Divulgación',
      modificacion_no_autorizada: 'Modificación', perdida: 'Pérdida/destrucción',
      robo: 'Robo', ataque_cibernetico: 'Ciberataque', phishing: 'Phishing',
      error_humano: 'Error humano', falla_tecnica: 'Falla técnica',
      tratamiento_no_autorizado: 'Tratamiento ilícito',
    };
    return labels[type] || type;
  }

  // Live risk score preview (mirrors backend formula)
  getPreviewRiskScore(): number {
    const d = this.newIncident();
    const impact = ({ confidencialidad: 3, integridad: 2, disponibilidad: 1, multiples: 4 } as any)[d.impact_type] || 0;
    const credentials = d.credentials_exposed ? 3 : 0;
    const id = ({ alta: 3, media: 2, baja: 1 } as any)[d.identification_ease] || 2;
    const consequence = ({ alta: 3, media: 2, baja: 1 } as any)[d.potential_consequence] || 2;
    const protection = ({ si: 0, parcial: 2, no: 3 } as any)[d.prior_protection] || 3;
    const encryption = d.data_encrypted ? 0 : 3;
    const mitigation = d.risk_mitigated ? 0 : 2;
    return impact + credentials + id + consequence + protection + encryption + mitigation;
  }

  getPreviewRiskLevel(): string {
    const score = this.getPreviewRiskScore();
    if (score >= 15) return 'alto';
    if (score >= 10) return 'medio';
    return 'bajo';
  }

  getPreviewNotifySpdp(): boolean {
    const level = this.getPreviewRiskLevel();
    const d = this.newIncident();
    if (level === 'alto') return true;
    if (level === 'medio' && (d.affects_sensitive || d.affects_minors || d.is_massive || d.affected_count > 1000)) return true;
    return false;
  }

  getPreviewNotifyTitular(): boolean {
    const level = this.getPreviewRiskLevel();
    const d = this.newIncident();
    if (level === 'alto' && !d.data_encrypted && !d.risk_mitigated) return !d.disproportionate_effort;
    return false;
  }

  loadIncidents(): void {
    const params = this.filterDecision() ? { notification_decision: this.filterDecision() } : {};
    this.pdpToolsService.getIncidents(params).subscribe({
      next: (res: any) => {
        this.incidents.set(res.data || []);
      },
      error: (err: any) => console.error('Error loading incidents:', err)
    });
  }

  addIncident(): void {
    const d = this.newIncident();
    if (!d.detection_date || !d.type) {
      alert('Complete al menos la fecha de detección y tipo de incidente.');
      return;
    }
    if (!d.data_categories || d.data_categories.length === 0) {
      alert('Seleccione al menos una categoría de datos afectados.');
      return;
    }

    this.saving.set(true);

    this.pdpToolsService.createIncident(d).subscribe({
      next: (res: any) => {
        this.lastIncidentDecision.set(res.decision);
        this.loadIncidents();
        // Reset form
        this.newIncident.set({
          detection_date: '', occurrence_date: '', type: '', detection_channel: 'monitoreo',
          affected_count: 0, data_categories: [], affects_minors: false, affects_sensitive: false,
          risk_of_harm: false, harm_type: '', is_massive: false, responsible_area: '',
          description: '', containment_measures: '',
          impact_type: '', credentials_exposed: false, identification_ease: 'media',
          potential_consequence: 'media', prior_protection: 'no', data_encrypted: false,
          risk_mitigated: false, disproportionate_effort: false,
        });
        this.saving.set(false);
      },
      error: (err: any) => {
        const msg = err.error?.message || (err.error?.errors ? JSON.stringify(err.error.errors) : err.message);
        alert('Error al registrar: ' + msg);
        this.saving.set(false);
      }
    });
  }

  filteredIncidents(): any[] {
    if (!this.filterDecision()) return this.incidents();
    return this.incidents().filter((i: any) => i.notification_decision === this.filterDecision());
  }

  notifySpdp(): void { alert('Iniciando proceso de notificación a SPDP – Art. 39 Reglamento LOPDP'); }
  viewLegalBasis(): void { alert('Art. 39 del Reglamento a la LOPDP – Notificación de brechas de seguridad\nArt. 24 RGLOPDP – Notificación al titular'); }
  viewIncident(id: number): void { /* TODO */ }
  exportIncidents(): void { alert('Exportando incidentes...'); }

  incidentsRequiringNotification(): number { return this.incidents().filter((i: any) => i.notification_decision === 'notificar').length; }
  totalIncidents(): number { return this.incidents().length; }
  incidentsByType(type: string): number { return this.incidents().filter((i: any) => i.type === type).length; }

  updateNewIncident(field: string, value: any): void {
    this.newIncident.update(inc => ({ ...inc, [field]: value }));
  }
}
