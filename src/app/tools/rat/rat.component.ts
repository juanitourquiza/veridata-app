import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PdpToolsService } from '../pdp-tools.service';
import { ModalService } from '../../shared/modal.service';

// RAT Component - Registro de Actividades de Tratamiento
// Supports manual entry, PDF upload, and transcript processing

@Component({
  selector: 'app-rat',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tools-container">
      <div class="tools-header">
        <div class="header-title">
          <h1>� Registro de Actividades de Tratamiento (RAT)</h1>
          @if (projectId()) {
            <div class="project-badge">📁 Proyecto #{{ projectId() }}</div>
          }
        </div>
        <p class="tools-subtitle">Inventario de tratamientos de datos personales según Art. 12 LOPDP</p>
      </div>

      <!-- Upload Section -->
      <div class="vd-card upload-section">
        <h3>Cargar información automáticamente</h3>
        <div class="upload-grid">
          <div class="upload-box" (click)="fileInput.click()">
            <span class="upload-icon">📄</span>
            <span>Subir PDF o documento</span>
            <small>Arrastra o haz clic para cargar</small>
            <input #fileInput type="file" accept=".pdf,.doc,.docx" (change)="onFileUpload($event)" hidden>
          </div>
          <div class="upload-box" (click)="transcriptInput.click()">
            <span class="upload-icon">🎙️</span>
            <span>Transcripción de entrevista</span>
            <small>Audio o texto transcrito</small>
            <input #transcriptInput type="file" accept="audio/*,.txt" (change)="onTranscriptUpload($event)" hidden>
          </div>
        </div>
        @if (processing()) {
          <div class="processing-indicator">
            <span class="spinner"></span>
            <span>Procesando con IA... {{ processingStatus() }}</span>
          </div>
        }
      </div>

      <!-- RAT Matrix -->
      <div class="vd-card">
        <div class="section-header">
          <h3>Matriz RAT - Información del Tratamiento</h3>
          <div class="header-actions">
            <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="addActivity()">+ Agregar Actividad</button>
            <button class="vd-btn vd-btn-primary vd-btn-sm" (click)="saveRat()">💾 Guardar RAT</button>
          </div>
        </div>

        <div class="table-container">
          <table class="vd-table rat-table">
            <thead>
              <tr>
                <th style="width: 80px">ID</th>
                <th>Nombre del tratamiento</th>
                <th>Finalidad</th>
                <th>Categorías de titulares</th>
                <th>Categorías de datos</th>
                <th>Base legal</th>
                <th>Encargado</th>
                <th>Destinatarios</th>
                <th>Transferencias</th>
                <th>Plazo conservación</th>
                <th>Medidas de seguridad</th>
                <th style="width: 120px">Nivel de riesgo</th>
                <th style="width: 100px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (activity of activities(); track activity.id) {
                <tr>
                  <td>{{ activity.code }}</td>
                  <td><input class="vd-input vd-input-sm" [ngModel]="activity.name" (ngModelChange)="updateActivityField(activity.id, 'name', $event)" placeholder="Ej: Gestión de clientes"></td>
                  <td><input class="vd-input vd-input-sm" [ngModel]="activity.purpose" (ngModelChange)="updateActivityField(activity.id, 'purpose', $event)" placeholder="Finalidad específica"></td>
                  <td><input class="vd-input vd-input-sm" [ngModel]="activity.data_subjects" (ngModelChange)="updateActivityField(activity.id, 'data_subjects', $event)" placeholder="Clientes, empleados..."></td>
                  <td><input class="vd-input vd-input-sm" [ngModel]="activity.data_categories" (ngModelChange)="updateActivityField(activity.id, 'data_categories', $event)" placeholder="Identificación, contacto..."></td>
                  <td><select class="vd-select vd-select-sm" [ngModel]="activity.legal_basis" (ngModelChange)="updateActivityField(activity.id, 'legal_basis', $event)"><option value="">Seleccionar...</option><option value="consentimiento">Consentimiento</option><option value="contrato">Contrato</option><option value="legal">Obligación legal</option><option value="interes_vital">Interés vital</option><option value="publico">Interés público</option><option value="legitimo">Interés legítimo</option></select></td>
                  <td><input class="vd-input vd-input-sm" [ngModel]="activity.responsible" (ngModelChange)="updateActivityField(activity.id, 'responsible', $event)" placeholder="Área responsable"></td>
                  <td><input class="vd-input vd-input-sm" [ngModel]="activity.recipients" (ngModelChange)="updateActivityField(activity.id, 'recipients', $event)" placeholder="Internos/externos"></td>
                  <td><select class="vd-select vd-select-sm" [ngModel]="activity.international_transfer" (ngModelChange)="updateActivityField(activity.id, 'international_transfer', $event)"><option [ngValue]="false">No</option><option [ngValue]="true">Sí</option></select></td>
                  <td><input class="vd-input vd-input-sm" [ngModel]="activity.retention_period" (ngModelChange)="updateActivityField(activity.id, 'retention_period', $event)" placeholder="Ej: 5 años"></td>
                  <td><input class="vd-input vd-input-sm" [ngModel]="activity.security_measures" (ngModelChange)="updateActivityField(activity.id, 'security_measures', $event)" placeholder="Encriptación, acceso..."></td>
                  <td><span class="vd-badge" [class]="'vd-badge-' + calculateRiskLevel(activity)">{{ calculateRiskLevel(activity) }}</span></td>
                  <td><button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="deleteActivity(activity.id)">🗑️</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- History -->
      <div class="vd-card">
        <h3>📚 Histórico de RAT</h3>
        <div class="history-grid">
          @for (version of ratHistory(); track version.id) {
            <div class="history-item" (click)="loadVersion(version.id)">
              <div class="history-info">
                <strong>{{ version.name }}</strong>
                <span class="history-date">{{ version.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="history-actions">
                <span class="vd-badge vd-badge-sm">{{ version.activity_count }} actividades</span>
                <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="compareVersion(version.id); $event.stopPropagation()">↩️ Comparar</button>
              </div>
            </div>
          }
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
    .upload-section { margin-bottom: 1.5rem; }
    .upload-section h3 { margin: 0 0 1rem; font-size: 1rem; }
    .upload-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .upload-box { border: 2px dashed #e2e8f0; border-radius: 8px; padding: 1.5rem; text-align: center; cursor: pointer; transition: all 0.2s; }
    .upload-box:hover { border-color: #5687f3; background: #f8fafc; }
    .upload-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
    .upload-box span { display: block; font-weight: 500; color: #0f172a; }
    .upload-box small { color: #64748b; font-size: 0.75rem; }
    .processing-indicator { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: rgba(86,135,243,0.1); border-radius: 6px; color: #5687f3; }
    .spinner { width: 16px; height: 16px; border: 2px solid #5687f3; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .section-header h3 { margin: 0; font-size: 1rem; }
    .header-actions { display: flex; gap: 0.5rem; }
    .table-container { overflow-x: auto; }
    .rat-table { min-width: 1400px; }
    .rat-table th { font-size: 0.75rem; white-space: nowrap; }
    .rat-table td { padding: 0.5rem; }
    .vd-input-sm { padding: 0.375rem; font-size: 0.75rem; }
    .vd-select-sm { padding: 0.375rem; font-size: 0.75rem; }
    .vd-badge-alta { background: rgba(239,68,68,0.1); color: #dc2626; }
    .vd-badge-media { background: rgba(245,158,11,0.1); color: #d97706; }
    .vd-badge-baja { background: rgba(34,197,94,0.1); color: #16a34a; }
    .history-grid { display: grid; gap: 0.75rem; }
    .history-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
    .history-item:hover { border-color: #5687f3; background: #f8fafc; }
    .history-info { display: flex; flex-direction: column; }
    .history-date { font-size: 0.75rem; color: #64748b; }
    .history-actions { display: flex; align-items: center; gap: 0.5rem; }
  `],
})
export class RatComponent implements OnInit {
  activities = signal<any[]>([]);
  ratHistory = signal<any[]>([]);
  processing = signal(false);
  processingStatus = signal('');
  projectId = signal<number | null>(null);
  ratInfo = signal<any>({ name: '', code: '', version: '1.0', area: '' });

  private pdpToolsService = inject(PdpToolsService);
  private modalService = inject(ModalService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const pid = params['project_id'];
      if (pid) this.projectId.set(parseInt(pid, 10));
    });
    this.loadActivities();
    this.loadRatHistory();
  }

  loadRatHistory(): void {
    const params: any = {};
    if (this.projectId()) {
      params.project_id = this.projectId();
    }
    this.pdpToolsService.getRatRecords(params).subscribe({
      next: (res) => {
        this.ratHistory.set(res.data || []);
      },
      error: (err) => console.error('Error loading RAT history:', err)
    });
  }

  loadActivities(): void {
    // TODO: Load from API
    this.activities.set([
      { id: 1, code: 'T-001', name: '', purpose: '', data_subjects: '', data_categories: '', legal_basis: '', responsible: '', recipients: '', international_transfer: false, retention_period: '', security_measures: '' }
    ]);
  }


  addActivity(): void {
    const newId = this.activities().length + 1;
    this.activities.update(acts => [...acts, {
      id: newId,
      code: `T-${String(newId).padStart(3, '0')}`,
      name: '', purpose: '', data_subjects: '', data_categories: '',
      legal_basis: '', responsible: '', recipients: '',
      international_transfer: false, retention_period: '', security_measures: ''
    }]);
  }

  deleteActivity(id: number): void {
    if (confirm('¿Eliminar esta actividad?')) {
      this.activities.update(acts => acts.filter(a => a.id !== id));
    }
  }

  calculateRiskLevel(activity: any): string {
    // TODO: Implement risk calculation logic based on data categories, volume, etc.
    if (!activity.data_categories) return 'baja';
    const sensitiveData = ['salud', 'financieros', 'biometricos', 'menores'].some(cat =>
      activity.data_categories.toLowerCase().includes(cat)
    );
    return sensitiveData ? 'alta' : 'media';
  }

  onFileUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.processing.set(true);
      this.processingStatus.set('Analizando documento con IA...');

      this.pdpToolsService.processRatWithAi(file, 'pdf').subscribe({
        next: (res: any) => {
          this.processing.set(false);
          if (res.activities) {
            res.activities.forEach((act: any) => {
              this.activities.update(acts => [...acts, {
                id: acts.length + 1,
                code: `A-${String(acts.length + 1).padStart(3, '0')}`,
                ...act,
                risk_level: 'baja'
              }]);
            });
            alert(`Se han extraído ${res.activities.length} actividades del documento.`);
          }
        },
        error: () => {
          this.processing.set(false);
          alert('Error al procesar el documento.');
        }
      });
    }
  }

  onTranscriptUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.processing.set(true);
      this.processingStatus.set('Procesando transcripción con IA...');

      this.pdpToolsService.processRatWithAi(file, 'transcript').subscribe({
        next: (res: any) => {
          this.processing.set(false);
          if (res.activities) {
            res.activities.forEach((act: any) => {
              this.activities.update(acts => [...acts, {
                id: acts.length + 1,
                code: `A-${String(acts.length + 1).padStart(3, '0')}`,
                ...act,
                risk_level: 'baja'
              }]);
            });
            this.modalService.success('Extracción completada', `Se han extraído ${res.activities.length} actividades de la transcripción.`);
          }
        },
        error: () => {
          this.processing.set(false);
          this.modalService.error('Error', 'Error al procesar la transcripción.');
        }
      });
    }
  }

  saveRat(): void {
    const ratData = {
      ...this.ratInfo(),
      activities: this.activities()
    };

    this.pdpToolsService.createRatRecord(ratData).subscribe({
      next: () => {
        this.modalService.success('Éxito', 'RAT guardado correctamente');
        this.loadRatHistory();
      },
      error: (err) => this.modalService.error('Error', 'Error al guardar el RAT: ' + err.message)
    });
  }

  loadVersion(id: number): void {
    this.pdpToolsService.getRatRecord(id).subscribe({
      next: (res) => {
        this.ratInfo.set({
          name: res.name,
          code: res.code,
          version: res.version,
          area: res.area
        });
        this.activities.set(res.activities || []);
      },
      error: (err) => this.modalService.error('Error', 'Error al cargar versión: ' + err.message)
    });
  }

  compareVersion(id: number): void {
    // TODO: Show comparison view
  }

  updateActivityField(activityId: number, field: string, value: any): void {
    this.activities.update(acts =>
      acts.map(a => a.id === activityId ? { ...a, [field]: value } : a)
    );
  }
}
