import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PdpToolsService } from '../pdp-tools.service';
import { ModalService } from '../../shared/modal.service';

// Rights Exercise Component - Registro de Ejercicio de Derechos

@Component({
  selector: 'app-rights-exercise',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tools-container">
      <header class="tools-header">
        <div class="header-title">
          <h1>✋ Ejercicio de Derechos (ARCO)</h1>
          @if (projectId()) {
            <div class="project-badge">📁 Proyecto #{{ projectId() }}</div>
          }
        </div>
        <p class="tools-subtitle">Seguimiento de solicitudes ARCO según Art. 17-22 LOPDP</p>
      </header>

      <!-- Form Header Info -->
      <div class="vd-card form-header">
        <div class="form-header-grid">
          <div class="form-group">
            <label class="vd-label">Código del registro</label>
            <input class="vd-input" [ngModel]="registryInfo().code" (ngModelChange)="updateRegistryInfo('code', $event)" placeholder="Ej: RED-2026-001">
          </div>
          <div class="form-group">
            <label class="vd-label">Versión</label>
            <input class="vd-input" [ngModel]="registryInfo().version" (ngModelChange)="updateRegistryInfo('version', $event)" placeholder="1.0">
          </div>
          <div class="form-group">
            <label class="vd-label">Fecha</label>
            <input type="date" class="vd-input" [ngModel]="registryInfo().date" (ngModelChange)="updateRegistryInfo('date', $event)">
          </div>
          <div class="form-group">
            <label class="vd-label">Responsable / Área</label>
            <input class="vd-input" [ngModel]="registryInfo().responsible" (ngModelChange)="updateRegistryInfo('responsible', $event)" placeholder="Área responsable">
          </div>
        </div>
      </div>

      <!-- New Request Form -->
      <div class="vd-card">
        <h3>➕ Nueva Solicitud de Ejercicio de Derechos</h3>
        <div class="new-request-form">
          <div class="form-row">
            <div class="form-group">
              <label class="vd-label">Fecha de recepción *</label>
              <input type="date" class="vd-input" [ngModel]="newRequest().received_date" (ngModelChange)="updateNewRequest('received_date', $event)">
            </div>
            <div class="form-group">
              <label class="vd-label">Canal de recepción *</label>
              <select class="vd-select" [ngModel]="newRequest().channel" (ngModelChange)="updateNewRequest('channel', $event)">
                <option value="">Seleccionar...</option>
                <option value="email">Correo electrónico</option>
                <option value="form">Formulario web</option>
                <option value="phone">Teléfono</option>
                <option value="in_person">Presencial</option>
                <option value="letter">Carta física</option>
              </select>
            </div>
            <div class="form-group">
              <label class="vd-label">Tipo de solicitante *</label>
              <select class="vd-select" [ngModel]="newRequest().requester_type" (ngModelChange)="updateNewRequest('requester_type', $event)">
                <option value="">Seleccionar...</option>
                <option value="titular">Titular de datos</option>
                <option value="representante">Representante legal</option>
                <option value="tutor">Tutor/curador</option>
                <option value="heredero">Causahabiente</option>
              </select>
            </div>
            <div class="form-group">
              <label class="vd-label">Nombre del titular/solicitante *</label>
              <input class="vd-input" [ngModel]="newRequest().requester_name" (ngModelChange)="updateNewRequest('requester_name', $event)" placeholder="Nombre completo">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="vd-label">Derecho ejercido *</label>
              <select class="vd-select" [ngModel]="newRequest().right_type" (ngModelChange)="updateNewRequest('right_type', $event)">
                <option value="">Seleccionar...</option>
                <option value="acceso">ACCESO (Art. 27)</option>
                <option value="rectificacion">RECTIFICACIÓN (Art. 28)</option>
                <option value="supresion">SUPRESIÓN / DERECHO AL OLVIDO (Art. 29)</option>
                <option value="eliminacion">ELIMINACIÓN (Art. 61)</option>
                <option value="oposicion">OPOSICIÓN (Art. 30)</option>
                <option value="portabilidad">PORTABILIDAD (Art. 31)</option>
                <option value="informacion">INFORMACIÓN (Art. 26)</option>
                <option value="decision_automatizada">NO SER OBJETO DE DECISIONES AUTOMATIZADAS (Art. 32)</option>
                <option value="revocatoria">REVOCATORIA DEL CONSENTIMIENTO (Art. 18)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="vd-label">Área responsable</label>
              <input class="vd-input" [ngModel]="newRequest().responsible_area" (ngModelChange)="updateNewRequest('responsible_area', $event)" placeholder="Área que atiende">
            </div>
            <div class="form-group">
              <label class="vd-label">¿Requiere aclaración?</label>
              <select class="vd-select" [ngModel]="newRequest().requires_clarification" (ngModelChange)="updateNewRequest('requires_clarification', $event)">
                <option [ngValue]="false">No</option>
                <option [ngValue]="true">Sí</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group full">
              <label class="vd-label">Descripción de la solicitud</label>
              <textarea class="vd-input" rows="3" [ngModel]="newRequest().description" (ngModelChange)="updateNewRequest('description', $event)" placeholder="Detalle de lo solicitado..."></textarea>
            </div>
          </div>

          <button class="vd-btn vd-btn-primary" (click)="addRequest()">➕ Agregar solicitud</button>
        </div>
      </div>

      <!-- Requests Table -->
      <div class="vd-card">
        <div class="section-header">
          <h3>📊 Solicitudes Registradas</h3>
          <div class="filters">
            <select class="vd-select vd-select-sm" [ngModel]="filterStatus()" (ngModelChange)="filterStatus.set($event); applyFilter()">
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En proceso</option>
              <option value="respondida">Respondida</option>
              <option value="cerrada">Cerrada</option>
            </select>
            <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="exportRequests()" [disabled]="exporting()">
              {{ exporting() ? '⏳ Exportando...' : '📥 Exportar' }}
            </button>
          </div>
        </div>

        <div class="table-container">
          <table class="vd-table rights-table">
            <thead>
              <tr>
                <th style="width: 60px">ID</th>
                <th style="width: 100px">Fecha rec.</th>
                <th style="width: 100px">Canal</th>
                <th style="width: 120px">Solicitante</th>
                <th style="width: 150px">Derecho</th>
                <th style="width: 120px">Área</th>
                <th style="width: 100px">Estado</th>
                <th style="width: 100px">Resultado</th>
                <th style="width: 110px">Fecha límite</th>
                <th style="width: 110px">Fecha resp.</th>
                <th>Observaciones</th>
                <th style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (request of filteredRequests(); track request.id) {
                <tr [class.overdue]="isOverdue(request)">
                  <td><strong>{{ request.code }}</strong></td>
                  <td>{{ request.received_date | date:'dd/MM/yy' }}</td>
                  <td>{{ request.channel }}</td>
                  <td>{{ request.requester_name }}</td>
                  <td><span class="right-badge" [class]="'right-' + request.right_type">{{ getRightLabel(request.right_type) }}</span></td>
                  <td>{{ request.responsible_area }}</td>
                  <td>
                    <select class="vd-select vd-select-sm" [ngModel]="request.status" (ngModelChange)="updateRequestField(request.id, 'status', $event); updateStatus(request)">
                      <option value="pendiente">⏳ Pendiente</option>
                      <option value="en_proceso">🔄 En proceso</option>
                      <option value="respondida">✅ Respondida</option>
                      <option value="cerrada">📋 Cerrada</option>
                    </select>
                  </td>
                  <td>
                    <select class="vd-select vd-select-sm" [ngModel]="request.result" (ngModelChange)="updateRequestField(request.id, 'result', $event)">
                      <option value="">Pendiente</option>
                      <option value="accede">✅ Accede</option>
                      <option value="parcial">⚠️ Parcial</option>
                      <option value="deniega">❌ Deniega</option>
                      <option value="inadmisible">⛔ Inadmisible</option>
                    </select>
                  </td>
                  <td [class.overdue-date]="isOverdue(request)">{{ request.deadline_date | date:'dd/MM/yy' }}</td>
                  <td>{{ request.response_date | date:'dd/MM/yy' }}</td>
                  <td><input class="vd-input vd-input-sm" [ngModel]="request.observations" (ngModelChange)="updateRequestField(request.id, 'observations', $event)" placeholder="Notas..."></td>
                  <td><button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="deleteRequest(request.id)">🗑️</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Statistics -->
      <div class="vd-card">
        <h3>📈 Estadísticas de Ejercicio de Derechos</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-number">{{ totalRequests() }}</span>
            <span class="stat-label">Total solicitudes</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ pendingRequests() }}</span>
            <span class="stat-label">Pendientes</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ overdueRequests() }}</span>
            <span class="stat-label">Vencidas (SLA)</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ avgResponseTime() }} días</span>
            <span class="stat-label">Tiempo promedio respuesta</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ requestsByRight('acceso') }}</span>
            <span class="stat-label">Acceso</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ requestsByRight('supresion') }}</span>
            <span class="stat-label">Supresión</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tools-container { max-width: 1400px; margin: 0 auto; }
    .tools-header { margin-bottom: 1.5rem; }
    .header-title { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .tools-header h1 { font-size: 1.5rem; color: #0f172a; margin: 0; }
    .project-badge { background: rgba(86,135,243,0.1); color: #5687f3; padding: 0.375rem 0.75rem; border-radius: 20px; font-size: 0.875rem; font-weight: 500; border: 1px solid rgba(86,135,243,0.2); }
    .tools-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 0.5rem; }
    .tools-subtitle { color: #64748b; font-size: 0.875rem; }
    .form-header-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .new-request-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .form-row .full { grid-column: span 4; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group.full { grid-column: 1 / -1; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .section-header h3 { margin: 0; }
    .filters { display: flex; gap: 0.5rem; }
    .table-container { overflow-x: auto; }
    .rights-table { min-width: 1400px; }
    .rights-table th { font-size: 0.6875rem; background: #f8fafc; }
    .rights-table td { padding: 0.5rem; font-size: 0.75rem; }
    .rights-table tr.overdue { background: rgba(239,68,68,0.05); }
    .overdue-date { color: #dc2626; font-weight: 600; }
    .vd-select-sm { padding: 0.25rem; font-size: 0.75rem; }
    .vd-input-sm { padding: 0.25rem; font-size: 0.75rem; }
    .right-badge { font-size: 0.625rem; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 500; }
    .right-acceso { background: rgba(86,135,243,0.1); color: #5687f3; }
    .right-rectificacion { background: rgba(245,158,11,0.1); color: #d97706; }
    .right-supresion { background: rgba(239,68,68,0.1); color: #dc2626; }
    .right-oposicion { background: rgba(34,197,94,0.1); color: #16a34a; }
    .right-portabilidad { background: rgba(139,92,246,0.1); color: #8b5cf6; }
    .right-informacion { background: rgba(100,116,139,0.1); color: #64748b; }
    .right-decision_automatizada { background: rgba(236,72,153,0.1); color: #ec4899; }
    .right-eliminacion { background: rgba(220,38,38,0.1); color: #b91c1c; }
    .right-revocatoria { background: rgba(168,85,247,0.1); color: #7c3aed; }
    .stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; }
    .stat-item { text-align: center; padding: 1rem; background: #f8fafc; border-radius: 8px; }
    .stat-number { display: block; font-size: 1.5rem; font-weight: 700; color: #5687f3; }
    .stat-label { font-size: 0.75rem; color: #64748b; }
  `],
})
export class RightsExerciseComponent implements OnInit {
  projectId = signal<number | null>(null);
  registryInfo = signal<any>({ code: '', version: '1.0', date: new Date().toISOString().split('T')[0], responsible: '' });
  requests = signal<any[]>([]);
  newRequest = signal<any>({
    received_date: '',
    channel: '',
    requester_type: '',
    requester_name: '',
    right_type: '',
    responsible_area: '',
    requires_clarification: false,
    description: ''
  });
  filterStatus = signal<string>('');
  loading = signal(false);
  exporting = signal(false);

  private pdpToolsService = inject(PdpToolsService);
  private route = inject(ActivatedRoute);
  private modal = inject(ModalService);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const pid = params['project_id'];
      if (pid) this.projectId.set(parseInt(pid, 10));
    });
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading.set(true);
    const params: any = this.filterStatus() ? { status: this.filterStatus() } : {};
    if (this.projectId()) {
      params.project_id = this.projectId();
    }

    this.pdpToolsService.getRightsRequests(params).subscribe({
      next: (res: any) => {
        this.requests.set(res.data || []);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading requests:', err);
        this.loading.set(false);
      }
    });
  }

  getRightLabel(rightType: string): string {
    const labels: any = {
      'acceso': 'ACCESO',
      'rectificacion': 'RECTIF.',
      'supresion': 'SUPRESIÓN',
      'eliminacion': 'ELIMINACIÓN',
      'oposicion': 'OPOSICIÓN',
      'portabilidad': 'PORTAB.',
      'informacion': 'INFO.',
      'decision_automatizada': 'NO AUTO.',
      'revocatoria': 'REVOCATORIA'
    };
    return labels[rightType] || rightType;
  }

  calculateDeadline(receivedDate: string): string {
    if (!receivedDate) return '';
    const date = new Date(receivedDate);
    date.setDate(date.getDate() + 15); // 15 days SLA
    return date.toISOString().split('T')[0];
  }

  isOverdue(request: any): boolean {
    if (!request.deadline_date || request.status === 'respondida' || request.status === 'cerrada') return false;
    return new Date(request.deadline_date) < new Date();
  }

  addRequest(): void {
    // Validate required fields
    if (!this.newRequest().received_date) {
      this.modal.error('Error', 'La fecha de recepción es obligatoria');
      return;
    }
    if (!this.newRequest().requester_name?.trim()) {
      this.modal.error('Error', 'El nombre del solicitante es obligatorio');
      return;
    }
    if (!this.newRequest().right_type) {
      this.modal.error('Error', 'El derecho ejercido es obligatorio');
      return;
    }

    // Map frontend fields to backend expected fields
    const requestData = {
      project_id: this.projectId(),
      request_type: this.newRequest().right_type,  // Maps right_type → request_type
      requester_name: this.newRequest().requester_name,
      requester_email: '',  // Optional field, backend accepts empty
      request_date: this.newRequest().received_date,  // Maps received_date → request_date
      description: `Canal: ${this.newRequest().channel || 'N/A'} | Tipo solicitante: ${this.newRequest().requester_type || 'N/A'} | Área: ${this.newRequest().responsible_area || 'N/A'} | ${this.newRequest().description || ''}`
    };

    this.pdpToolsService.createRightsRequest(requestData).subscribe({
      next: () => {
        this.modal.success('Solicitud registrada', 'La solicitud de ejercicio de derechos se registró correctamente.');
        this.loadRequests();
        this.newRequest.set({ received_date: '', channel: '', requester_type: '', requester_name: '', right_type: '', responsible_area: '', requires_clarification: false, description: '' });
      },
      error: (err: any) => {
        const msg = err.error?.message || err.error?.errors ? JSON.stringify(err.error?.errors) : err.message;
        this.modal.error('Error al guardar', msg);
      }
    });
  }

  async deleteRequest(id: number): Promise<void> {
    const confirmed = await this.modal.confirm('¿Eliminar solicitud?', 'Esta acción no se puede deshacer.');
    if (confirmed) {
      this.pdpToolsService.deleteRightsRequest(id).subscribe({
        next: () => {
          this.requests.update(reqs => reqs.filter(r => r.id !== id));
          this.modal.success('Éxito', 'Solicitud eliminada correctamente');
        },
        error: (err: any) => this.modal.error('Error', 'Error al eliminar: ' + (err.message || 'Intenta de nuevo'))
      });
    }
  }

  updateStatus(request: any): void {
    const data: any = { status: request.status };
    if (request.status === 'respondida' && !request.response_date) {
      data.response_date = new Date().toISOString().split('T')[0];
      request.response_date = data.response_date;
    }
    if (request.result) {
      data.result = request.result;
    }
    if (request.response_content) {
      data.response_content = request.response_content;
    }

    this.pdpToolsService.updateRightsRequest(request.id, data).subscribe({
      next: () => {
        // Status updated
      },
      error: (err: any) => this.modal.error('Error al actualizar', err.message)
    });
  }

  filteredRequests(): any[] {
    if (!this.filterStatus()) return this.requests();
    return this.requests().filter(r => r.status === this.filterStatus());
  }

  applyFilter(): void {
    this.loadRequests();
  }

  totalRequests(): number { return this.requests().length; }
  pendingRequests(): number { return this.requests().filter(r => r.status !== 'respondida' && r.status !== 'cerrada').length; }
  overdueRequests(): number { return this.requests().filter(r => this.isOverdue(r)).length; }
  avgResponseTime(): number {
    const responded = this.requests().filter(r => r.response_date && r.received_date);
    if (responded.length === 0) return 0;
    const totalDays = responded.reduce((sum, r) => {
      const received = new Date(r.received_date);
      const response = new Date(r.response_date);
      return sum + Math.ceil((response.getTime() - received.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    return Math.round(totalDays / responded.length);
  }
  requestsByRight(rightType: string): number { return this.requests().filter(r => r.right_type === rightType).length; }

  exportRequests(): void {
    this.exporting.set(true);

    const params: any = this.filterStatus() ? { status: this.filterStatus() } : {};
    if (this.projectId()) {
      params.project_id = this.projectId();
    }

    this.pdpToolsService.exportRightsRequests(params).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Solicitudes_Derechos_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: (err: any) => {
        this.modal.error('Error al exportar', err.error?.message || err.message);
        this.exporting.set(false);
      }
    });
  }

  updateNewRequest(field: string, value: any): void {
    this.newRequest.update(req => ({ ...req, [field]: value }));
  }

  updateRegistryInfo(field: string, value: any): void {
    this.registryInfo.update(info => ({ ...info, [field]: value }));
  }

  updateRequestField(requestId: number, field: string, value: any): void {
    this.requests.update(reqs =>
      reqs.map(r => r.id === requestId ? { ...r, [field]: value } : r)
    );
  }
}
