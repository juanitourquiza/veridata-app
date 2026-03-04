import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
    selector: 'app-layout',
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
    template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-brand"><svg viewBox="0 0 40 40" fill="none" width="32" height="32"><path d="M20 4L6 12v16l14 8 14-8V12L20 4z" fill="#5687f3" opacity="0.2"/><path d="M20 4L6 12v16l14 8 14-8V12L20 4z" stroke="#5687f3" stroke-width="2" fill="none"/><path d="M14 20l4 4 8-8" stroke="#5687f3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="brand-text">Veridata</span></div>
        <nav class="sidebar-nav">
          <a routerLink="/projects" routerLinkActive="active" class="nav-item"><span class="nav-icon">📁</span><span>Proyectos</span></a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info"><div class="user-avatar">{{ auth.currentUser()?.name?.charAt(0) || 'U' }}</div><div class="user-details"><span class="user-name">{{ auth.currentUser()?.name }}</span><span class="user-role">{{ auth.userRole() }}</span></div></div>
          <button class="logout-btn" (click)="auth.logout()" title="Salir">✕</button>
        </div>
      </aside>
      <main class="main-content"><router-outlet /></main>
    </div>
  `,
    styles: [`
    .layout { display: flex; min-height: 100vh; }
    .sidebar { width: 240px; background: linear-gradient(180deg, #0d1321, #121b30); color: white; display: flex; flex-direction: column; position: fixed; inset: 0; right: auto; z-index: 30; }
    .sidebar-brand { display: flex; align-items: center; gap: 0.625rem; padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .brand-text { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; }
    .sidebar-nav { flex: 1; padding: 1rem 0.75rem; }
    .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.875rem; color: #8890a8; text-decoration: none; border-radius: 8px; font-size: 0.875rem; transition: all 0.2s; margin-bottom: 0.25rem; }
    .nav-item:hover { background: rgba(86,135,243,0.1); color: #c4c8d6; }
    .nav-item.active { background: rgba(86,135,243,0.15); color: #5687f3; font-weight: 600; }
    .nav-icon { font-size: 1.125rem; width: 1.5rem; text-align: center; }
    .sidebar-footer { border-top: 1px solid rgba(255,255,255,0.08); padding: 1rem; display: flex; align-items: center; justify-content: space-between; }
    .user-info { display: flex; align-items: center; gap: 0.625rem; }
    .user-avatar { width: 32px; height: 32px; background: #5687f3; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8125rem; font-weight: 700; }
    .user-details { display: flex; flex-direction: column; }
    .user-name { font-size: 0.8125rem; font-weight: 600; }
    .user-role { font-size: 0.6875rem; color: #8890a8; text-transform: capitalize; }
    .logout-btn { background: none; border: none; color: #8890a8; cursor: pointer; padding: 0.375rem 0.5rem; border-radius: 6px; font-size: 0.875rem; }
    .logout-btn:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
    .main-content { flex: 1; margin-left: 240px; padding: 2rem; min-height: 100vh; }
    @media (max-width: 768px) { .sidebar { display: none; } .main-content { margin-left: 0; } }
  `],
})
export class LayoutComponent {
    constructor(public auth: AuthService) { }
}
