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
            <h4>📋 Información General</h4>
            <div class="form-grid">
              <div class="form-group">
                <label class="vd-label">Fecha de detección *</label>
                <input type="date" class="vd-input" [(ngModel)]="newIncident().detection_date">
              </div>
              <div class="form-group">
                <label class="vd-label">Fecha de ocurrencia (estimada)</label>
                <input type="date" class="vd-input" [(ngModel)]="newIncident().occurrence_date">
              </div>
              <div class="form-group">
                <label class="vd-label">Tipo de incidente *</label>
                <select class="vd-select" [(ngModel)]="newIncident().type">
                  <option value="">Seleccionar...</option>
                  <option value="perdida">Pérdida de datos</option>
                  <option value="robo">Robo o hurto</option>
                  <option value="acceso_no_autorizado">Acceso no autorizado</option>
                  <option value="modificacion_no_autorizada">Modificación no autorizada</option>
                  <option value="eliminacion_no_autorizada">Eliminación no autorizada</option>
                  <option value="copia_no_autorizada">Copia no autorizada</option>
                  <option value="transmision_no_autorizada">Transmisión no autorizada</option>
                  <option value="falla_tecnica">Falla técnica</option>
                  <option value="error_humano">Error humano</option>
                  <option value="ataque_cibernetico">Ataque cibernético</option>
                </select>
              </div>
              <div class="form-group">
                <label class="vd-label">Canal de detección</label>
                <select class="vd-select" [(ngModel)]="newIncident().detection_channel">
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
            <h4>👤 Titulares Afectados</h4>
            <div class="form-grid">
              <div class="form-group">
                <label class="vd-label">¿Cuántos titulares se estima afectados? *</label>
                <input type="number" class="vd-input" [ngModel]="newIncident().affected_count" (ngModelChange)="updateNewIncident('affected_count', $event)" min="0">
              </div>
              <div class="form-group">
                <label class="vd-label">Categorías de datos afectados *</label>
                <select class="vd-select" [ngModel]="newIncident().data_categories" (ngModelChange)="updateNewIncident('data_categories', $event)">
                  <option value="generales">Datos generales (nombre, contacto)</option>
                  <option value="sensibles_no_alto_riesgo">Sensibles sin identificación</option>
                  <option value="sensibles_id">Sensibles con identificación</option>
                  <option value="financieros">Datos financieros</option>
                  <option value="biometricos">Datos biométricos</option>
                  <option value="salud">Datos de salud</option>
                  <option value="menores">Datos de menores</option>
                  <option value="mixtos">Combinación de categorías</option>
                </select>
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
            </div>
          </div>

          <div class="form-section">
            <h4>⚠️ Evaluación de Gravedad</h4>
            <div class="form-grid">
              <div class="form-group">
                <label class="vd-label">¿Hay riesgo de daño a titulares? *</label>
                <select class="vd-select" [ngModel]="newIncident().risk_of_harm" (ngModelChange)="updateNewIncident('risk_of_harm', $event)">
                  <option [ngValue]="">Seleccionar...</option>
                  <option [ngValue]="true">Sí, existe riesgo</option>
                  <option [ngValue]="false">No, no existe riesgo</option>
                  <option [ngValue]="null">No se puede determinar</option>
                </select>
              </div>
              <div class="form-group">
                <label class="vd-label">Tipo de daño potencial</label>
                <select class="vd-select" [ngModel]="newIncident().harm_type" (ngModelChange)="updateNewIncident('harm_type', $event)">
                  <option value="">Seleccionar...</option>
                  <option value="discriminacion">Discriminación</option>
                  <option value="robo_identidad">Robo de identidad</option>
                  <option value="perdida_financiera">Pérdida financiera</option>
                  <option value="dano_reputacional">Daño reputacional</option>
                  <option value="perdida_confidencialidad">Pérdida de confidencialidad</option>
                  <option value="violacion_derechos">Violación de derechos fundamentales</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              <div class="form-group">
                <label class="vd-label">¿El incidente es de carácter masivo? *</label>
                <select class="vd-select" [ngModel]="newIncident().is_massive" (ngModelChange)="updateNewIncident('is_massive', $event)">
                  <option [ngValue]="">Seleccionar...</option>
                  <option [ngValue]="true">Sí (&gt;1000 titulares)</option>
                  <option [ngValue]="false">No</option>
                </select>
              </div>
              <div class="form-group">
                <label class="vd-label">Área responsable</label>
                <input class="vd-input" [ngModel]="newIncident().responsible_area" (ngModelChange)="updateNewIncident('responsible_area', $event)" placeholder="Ej: Seguridad, IT, Legal">
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>📝 Descripción</h4>
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

          <button class="vd-btn vd-btn-primary" (click)="addIncident()">🚨 Registrar Incidente</button>
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
            <h4>Criterios evaluados:</h4>
            <ul>
              @for (criterion of lastIncidentDecision()?.criteria; track criterion.name) {
                <li [class.met]="criterion.met">{{ criterion.met ? '✅' : '❌' }} {{ criterion.name }}</li>
              }
            </ul>
          </div>
          <div class="decision-actions">
            @if (lastIncidentDecision()?.decision === 'notificar') {
              <button class="vd-btn vd-btn-danger" (click)="notifySpdp()">🚨 Notificar a SPDP</button>
              <button class="vd-btn vd-btn-secondary" (click)="generateNotification()">📄 Generar oficio</button>
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
          <table class="vd-table incidents-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha det.</th>
                <th>Tipo</th>
                <th>Titulares</th>
                <th>Categoría datos</th>
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
                  <td>{{ incident.type }}</td>
                  <td>{{ incident.affected_count }}</td>
                  <td>{{ incident.data_categories }}</td>
                  <td>
                    <span class="vd-badge" [class]="'vd-badge-' + incident.notification_decision">
                      {{ incident.notification_decision === 'notificar' ? '🚨 SÍ - URGENTE' : incident.notification_decision === 'evaluar' ? '⚠️ Evaluar' : '✅ No' }}
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
    .decision-panel { border-left: 4px solid #f59e0b; }
    .decision-panel.decision-notificar { border-left-color: #ef4444; }
    .decision-panel.decision-no_notificar { border-left-color: #22c55e; }
    .decision-result { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: rgba(245,158,11,0.05); border-radius: 8px; margin-bottom: 1rem; }
    .decision-notificar .decision-result { background: rgba(239,68,68,0.05); }
    .decision-no_notificar .decision-result { background: rgba(34,197,94,0.05); }
    .decision-icon { font-size: 2rem; }
    .decision-text { flex: 1; }
    .decision-text strong { display: block; font-size: 1.125rem; margin-bottom: 0.5rem; color: #f59e0b; }
    .decision-notificar .decision-text strong { color: #dc2626; }
    .decision-no_notificar .decision-text strong { color: #16a34a; }
    .decision-text p { margin: 0; color: #64748b; font-size: 0.875rem; }
    .decision-criteria { margin-bottom: 1rem; }
    .decision-criteria h4 { margin: 0 0 0.5rem; font-size: 0.875rem; }
    .decision-criteria ul { margin: 0; padding-left: 1.5rem; }
    .decision-criteria li { font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem; }
    .decision-criteria li.met { color: #16a34a; }
    .decision-actions { display: flex; gap: 0.75rem; }
    .vd-btn-danger { background: #ef4444; color: white; }
    .vd-btn-danger:hover { background: #dc2626; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .section-header h3 { margin: 0; }
    .filters { display: flex; gap: 0.5rem; }
    .table-container { overflow-x: auto; }
    .incidents-table { min-width: 1000px; }
    .incidents-table th { font-size: 0.6875rem; background: #f8fafc; }
    .incidents-table td { padding: 0.75rem; font-size: 0.875rem; }
    .incidents-table tr.row-notificar { background: rgba(239,68,68,0.05); }
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
    @media (max-width: 1024px) { .form-grid { grid-template-columns: repeat(2, 1fr); } .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } .form-row { flex-direction: column; } }
  `],
})
export class IncidentsComponent implements OnInit {
  newIncident = signal<any>({
    detection_date: '', occurrence_date: '', type: '', detection_channel: 'monitoreo',
    affected_count: 0, data_categories: 'generales', affects_minors: false, affects_sensitive: false,
    risk_of_harm: '', harm_type: '', is_massive: '', responsible_area: '',
    description: '', containment_measures: ''
  });

  incidents = signal<any[]>([]);
  filterDecision = signal<string>('');
  lastIncidentDecision = signal<any>(null);

  private pdpToolsService = inject(PdpToolsService);

  ngOnInit(): void {
    this.loadIncidents();
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

  evaluateIncident(incident: any): any {
    const criteria = [
      { name: 'Afecta > 1000 titulares o datos sensibles de menores', met: incident.affected_count > 1000 || (incident.affects_minors && incident.affects_sensitive) },
      { name: 'Hay riesgo de daño real a titulares', met: incident.risk_of_harm === true },
      { name: 'Datos sensibles o financieros involucrados', met: incident.affects_sensitive || incident.data_categories?.includes('sensibles') },
      { name: 'Acceso no autorizado o exfiltración', met: ['acceso_no_autorizado', 'transmision_no_autorizada', 'robo'].includes(incident.type) },
      { name: 'Incidente de carácter masivo', met: incident.is_massive === true },
    ];

    const criticalMet = criteria.slice(0, 3).filter(c => c.met).length;
    const allMet = criteria.filter(c => c.met).length;

    if (criticalMet >= 2 || (incident.affected_count > 5000 && incident.affects_sensitive)) {
      return { decision: 'notificar', reason: 'Según Art. 39 del Reglamento a la LOPDP, debe notificar a la Autoridad de Control dentro de las 72 horas.', criteria };
    } else if (allMet >= 2) {
      return { decision: 'evaluar', reason: 'Se recomienda evaluar notificación preventiva o documentar la no notificación.', criteria };
    } else {
      return { decision: 'no_notificar', reason: 'No se cumplen los criterios de notificación obligatoria según la normativa.', criteria };
    }
  }

  addIncident(): void {
    const newId = this.incidents().length + 1;
    const incident = { id: newId, code: `INC-${String(newId).padStart(3, '0')}`, ...this.newIncident(), status: 'detectado' };

    const decision = this.evaluateIncident(incident);
    incident.notification_decision = decision.decision;

    this.incidents.update(incs => [...incs, incident]);
    this.lastIncidentDecision.set(decision);

    // Reset form
    this.newIncident.set({
      detection_date: '', occurrence_date: '', type: '', detection_channel: 'monitoreo',
      affected_count: 0, data_categories: 'generales', affects_minors: false, affects_sensitive: false,
      risk_of_harm: '', harm_type: '', is_massive: '', responsible_area: '',
      description: '', containment_measures: ''
    });
  }

  filteredIncidents(): any[] {
    if (!this.filterDecision()) return this.incidents();
    return this.incidents().filter(i => i.notification_decision === this.filterDecision());
  }

  notifySpdp(): void { alert('Iniciando proceso de notificación a SPDP...'); }
  generateNotification(): void { alert('Generando oficio de notificación...'); }
  viewLegalBasis(): void { alert('Art. 39 del Reglamento a la LOPDP - Notificación de brechas de seguridad'); }
  viewIncident(id: number): void { /* TODO */ }
  exportIncidents(): void { alert('Exportando incidentes...'); }

  incidentsRequiringNotification(): number { return this.incidents().filter(i => i.notification_decision === 'notificar').length; }
  totalIncidents(): number { return this.incidents().length; }
  incidentsByType(type: string): number { return this.incidents().filter(i => i.type === type).length; }

  updateNewIncident(field: string, value: any): void {
    this.newIncident.update(inc => ({ ...inc, [field]: value }));
  }
}
