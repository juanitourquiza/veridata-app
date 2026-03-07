import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Project } from '../../core/models/models';

@Component({
  selector: 'app-project-list',
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-header">
      <div><h1>Proyectos</h1><p class="subtitle">Gestiona tus evaluaciones de cumplimiento</p></div>
      @if (auth.canCreateProjects()) { <a routerLink="/projects/new" class="vd-btn vd-btn-primary">+ Nuevo Proyecto</a> }
    </div>
    @if (loading()) {
      <div class="loading"><div class="spinner"></div><p>Cargando proyectos...</p></div>
    } @else if (projects().length === 0) {
      <div class="empty-state vd-card">
        <div class="empty-icon">📁</div>
        <h3>Sin proyectos aún</h3>
        <p>Crea tu primer proyecto de evaluación de cumplimiento</p>
        @if (auth.canCreateProjects()) { <a routerLink="/projects/new" class="vd-btn vd-btn-primary">Crear primer proyecto</a> }
      </div>
    } @else {
      <div class="project-grid">
        @for (project of projects(); track project.id) {
          <a [routerLink]="'/projects/' + project.id" class="vd-card project-card">
            <div class="card-header"><h3>{{ project.name }}</h3><span class="vd-badge" [class]="'vd-badge-' + statusBadge(project.status)">{{ statusLabel(project.status) }}</span></div>
            <p class="desc">{{ project.description || 'Sin descripción' }}</p>
            <div class="card-meta"><span>📋 {{ project.framework?.name || 'N/A' }}</span><span>👥 {{ project.data_subjects_count | number }} titulares</span></div>
            <div class="maturity"><div class="maturity-label"><span>Madurez Global</span><strong>{{ (project.global_maturity / 5) * 100 | number:'1.0-0' }}% ({{ project.global_maturity | number:'1.1-1' }}/5)</strong></div><div class="vd-progress-bar"><div class="vd-progress-fill" [style.width.%]="(project.global_maturity / 5) * 100"></div></div></div>
            @if (project.large_scale) { <div class="risk-badges"><span class="vd-badge vd-badge-critico">Gran Escala</span>@if (project.dpo_required) { <span class="vd-badge vd-badge-alto">DPO Requerido</span> }</div> }
            <div class="card-actions">
              <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="openHistory($event, project)">📚 Historial</button>
            </div>
          </a>
        }
      </div>
    }

    <!-- History Dialog -->
    @if (showHistoryDialog()) {
      <div class="history-overlay" (click)="closeHistory()">
        <div class="history-dialog" (click)="$event.stopPropagation()">
          <div class="history-header">
            <h3>📚 Historial: {{ selectedProject()?.name }}</h3>
            <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="showSaveDialog.set(true)">💾 Guardar Evaluación</button>
          </div>
          @if (snapshots().length === 0) {
            <p style="color:#64748b;text-align:center;padding:2rem">No hay evaluaciones guardadas.</p>
          }
          <div class="snapshot-list">
            @for (snapshot of snapshots(); track snapshot.id) {
              <div class="snapshot-item">
                <div class="snapshot-name">{{ snapshot.name }}</div>
                <div class="snapshot-meta">
                  <span>{{ snapshot.snapshot_date | date:'dd/MM/yyyy HH:mm' }}</span>
                  <span class="vd-badge vd-badge-baja">Madurez: {{ snapshot.global_maturity | number:'1.1-1' }}/5</span>
                </div>
                @if (snapshot.notes) {
                  <div class="snapshot-notes">{{ snapshot.notes }}</div>
                }
                <div class="snapshot-actions">
                  <button class="vd-btn vd-btn-primary vd-btn-sm" (click)="restoreSnapshot(snapshot.id)">↩️ Restaurar</button>
                  <button class="vd-btn vd-btn-secondary vd-btn-sm" (click)="deleteSnapshot(snapshot.id)">🗑️ Eliminar</button>
                </div>
              </div>
            }
          </div>
          <div class="dialog-actions">
            <button class="vd-btn vd-btn-secondary" (click)="closeHistory()">Cerrar</button>
          </div>
        </div>
      </div>
    }

    <!-- Save Snapshot Dialog -->
    @if (showSaveDialog()) {
      <div class="history-overlay" (click)="showSaveDialog.set(false)">
        <div class="history-dialog" (click)="$event.stopPropagation()">
          <h3>💾 Guardar Evaluación</h3>
          <div class="form-group">
            <label>Nombre</label>
            <input #snapshotName class="vd-input" placeholder="Ej: Evaluación Marzo 2026">
          </div>
          <div class="form-group">
            <label>Notas (opcional)</label>
            <textarea #snapshotNotes class="vd-input" rows="3" placeholder="Notas sobre esta evaluación..."></textarea>
          </div>
          <div class="dialog-actions">
            <button class="vd-btn vd-btn-secondary" (click)="showSaveDialog.set(false)">Cancelar</button>
            <button class="vd-btn vd-btn-primary" (click)="saveSnapshot(snapshotName.value, snapshotNotes.value)" [disabled]="saving()">{{ saving() ? 'Guardando...' : 'Guardar' }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    h1 { margin: 0; font-size: 1.5rem; }
    .subtitle { color: #64748b; font-size: 0.875rem; margin: 0.25rem 0 0; }
    .project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem; }
    .project-card { text-decoration: none; color: inherit; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
    .project-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.08); }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
    .card-header h3 { margin: 0; font-size: 1.0625rem; }
    .desc { color: #64748b; font-size: 0.8125rem; margin: 0 0 1rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .card-meta { display: flex; gap: 1rem; font-size: 0.8125rem; color: #64748b; margin-bottom: 1rem; }
    .maturity { margin-top: auto; }
    .maturity-label { display: flex; justify-content: space-between; margin-bottom: 0.375rem; font-size: 0.75rem; color: #64748b; }
    .maturity-label strong { color: #5687f3; }
    .risk-badges { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
    .empty-state { text-align: center; padding: 3rem; max-width: 400px; margin: 2rem auto; }
    .empty-icon { font-size: 2.5rem; margin-bottom: 1rem; }
    .empty-state h3 { margin: 0 0 0.5rem; }
    .empty-state p { color: #64748b; font-size: 0.875rem; margin: 0 0 1.5rem; }
    .loading { text-align: center; padding: 3rem; color: #64748b; }
    .spinner { width: 2rem; height: 2rem; border: 3px solid #e2e8f0; border-top-color: #5687f3; border-radius: 50%; animation: spin 0.6s linear infinite; margin: 0 auto 1rem; }
    .card-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; justify-content: flex-end; }
    .history-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; }
    .history-dialog { background: white; border-radius: 12px; padding: 1.5rem; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto; }
    .history-dialog h3 { margin: 0 0 1rem; }
    .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .snapshot-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .snapshot-item { padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; }
    .snapshot-name { font-weight: 600; font-size: 0.875rem; margin-bottom: 0.25rem; }
    .snapshot-meta { display: flex; gap: 0.5rem; font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem; }
    .snapshot-notes { font-size: 0.75rem; color: #64748b; font-style: italic; margin-bottom: 0.5rem; }
    .snapshot-actions { display: flex; gap: 0.25rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.875rem; margin-bottom: 0.25rem; }
    .form-group input, .form-group textarea { width: 100%; }
    .dialog-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem; }
  `],
})
export class ProjectListComponent implements OnInit {
  projects = signal<Project[]>([]);
  loading = signal(true);

  // History dialog signals
  showHistoryDialog = signal(false);
  showSaveDialog = signal(false);
  selectedProject = signal<Project | null>(null);
  snapshots = signal<{ id: number; name: string; snapshot_date: string; global_maturity: number; notes?: string }[]>([]);
  saving = signal(false);

  constructor(private api: ApiService, public auth: AuthService) { }
  ngOnInit(): void { this.api.getProjects().subscribe({ next: (res) => { this.projects.set(res.data); this.loading.set(false); }, error: () => this.loading.set(false) }); }
  statusBadge(status: string): string {
    const map: Record<string, string> = {
      'draft': 'alto',
      'in_progress': 'medio',
      'completed': 'bajo',
      'archived': 'critico'
    };
    return map[status] || 'critico';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      'draft': 'Borrador',
      'in_progress': 'En Progreso',
      'completed': 'Completado',
      'archived': 'Archivado'
    };
    return map[status] || status;
  }

  // History methods
  openHistory(event: Event, project: Project): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedProject.set(project);
    this.loadSnapshots(project.id);
    this.showHistoryDialog.set(true);
  }

  closeHistory(): void {
    this.showHistoryDialog.set(false);
    this.selectedProject.set(null);
    this.snapshots.set([]);
  }

  loadSnapshots(projectId: number): void {
    this.api.getEvaluationSnapshots(projectId).subscribe({
      next: (res: { snapshots: { id: number; name: string; snapshot_date: string; global_maturity: number; notes?: string }[] }) => {
        this.snapshots.set(res.snapshots);
      }
    });
  }

  saveSnapshot(name: string, notes?: string): void {
    if (!name.trim()) {
      alert('Por favor ingresa un nombre para la evaluación.');
      return;
    }
    const projectId = this.selectedProject()?.id;
    if (!projectId) return;

    this.saving.set(true);
    this.api.createEvaluationSnapshot(projectId, name, notes).subscribe({
      next: () => {
        this.saving.set(false);
        this.showSaveDialog.set(false);
        this.loadSnapshots(projectId);
      },
      error: () => {
        this.saving.set(false);
        alert('Error al guardar la evaluación.');
      }
    });
  }

  restoreSnapshot(snapshotId: number): void {
    if (!confirm('¿Estás seguro de restaurar esta evaluación? Se reemplazará la evaluación actual del proyecto.')) return;
    const projectId = this.selectedProject()?.id;
    if (!projectId) return;

    this.api.restoreEvaluationSnapshot(projectId, snapshotId).subscribe({
      next: () => {
        alert('Evaluación restaurada exitosamente. Actualizando...');
        this.loadSnapshots(projectId);
        // Reload projects to update maturity
        this.api.getProjects().subscribe({
          next: (res) => { this.projects.set(res.data); }
        });
      },
      error: () => alert('Error al restaurar la evaluación.')
    });
  }

  deleteSnapshot(snapshotId: number): void {
    if (!confirm('¿Estás seguro de eliminar esta versión guardada?')) return;
    const projectId = this.selectedProject()?.id;
    if (!projectId) return;

    this.api.deleteEvaluationSnapshot(projectId, snapshotId).subscribe({
      next: () => {
        this.loadSnapshots(projectId);
      },
      error: () => alert('Error al eliminar la evaluación.')
    });
  }
}
