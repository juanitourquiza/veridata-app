import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Project } from '../../core/models/models';

@Component({
  selector: 'app-project-list',
  imports: [CommonModule, RouterLink],
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
            <div class="card-header"><h3>{{ project.name }}</h3><span class="vd-badge" [class]="'vd-badge-' + statusBadge(project.status)">{{ project.status }}</span></div>
            <p class="desc">{{ project.description || 'Sin descripción' }}</p>
            <div class="card-meta"><span>📋 {{ project.framework?.name || 'N/A' }}</span><span>👥 {{ project.data_subjects_count | number }} titulares</span></div>
            <div class="maturity"><div class="maturity-label"><span>Madurez Global</span><strong>{{ project.global_maturity | number:'1.0-0' }}%</strong></div><div class="vd-progress-bar"><div class="vd-progress-fill" [style.width.%]="project.global_maturity * 20"></div></div></div>
            @if (project.large_scale) { <div class="risk-badges"><span class="vd-badge vd-badge-critico">Gran Escala</span>@if (project.dpo_required) { <span class="vd-badge vd-badge-alto">DPO Requerido</span> }</div> }
          </a>
        }
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
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class ProjectListComponent implements OnInit {
  projects = signal<Project[]>([]);
  loading = signal(true);
  constructor(private api: ApiService, public auth: AuthService) { }
  ngOnInit(): void { this.api.getProjects().subscribe({ next: (res) => { this.projects.set(res.data); this.loading.set(false); }, error: () => this.loading.set(false) }); }
  statusBadge(status: string): string { return status === 'completed' ? 'bajo' : status === 'in_progress' ? 'medio' : status === 'draft' ? 'alto' : 'critico'; }
}
