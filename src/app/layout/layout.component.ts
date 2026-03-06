import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { environment } from '../core/environment';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout" [class.dark-mode]="darkMode()">
      <aside class="sidebar">
        <div class="sidebar-brand"><svg viewBox="0 0 40 40" fill="none" width="32" height="32"><path d="M20 4L6 12v16l14 8 14-8V12L20 4z" fill="#5687f3" opacity="0.2"/><path d="M20 4L6 12v16l14 8 14-8V12L20 4z" stroke="#5687f3" stroke-width="2" fill="none"/><path d="M14 20l4 4 8-8" stroke="#5687f3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="brand-info"><span class="brand-text">Veridata</span><span class="brand-version">v{{ version }}</span></div></div>
        <nav class="sidebar-nav">
          <a routerLink="/projects" routerLinkActive="active" class="nav-item"><span class="nav-icon">📁</span><span>Proyectos</span></a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info"><div class="user-avatar">{{ auth.currentUser()?.name?.charAt(0) || 'U' }}</div><div class="user-details"><span class="user-name">{{ auth.currentUser()?.name }}</span><span class="user-role">{{ auth.userRole() }}</span></div></div>
          <button class="logout-btn" (click)="auth.logout()" title="Salir">✕</button>
        </div>
      </aside>
      <main class="main-content">
        <div class="content-header">
          <button class="theme-toggle" (click)="toggleDarkMode()" title="Cambiar tema">
            {{ darkMode() ? '☀️' : '🌙' }}
          </button>
        </div>
        <router-outlet />
      </main>

      <!-- WhatsApp Floating Button -->
      <a href="https://wa.me/593995310341" target="_blank" class="whatsapp-float" title="¿Dudas? Escríbenos">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M17.6 6.3c-.2-.5-.7-.7-1.2-.5-.5.2-.7.7-.5 1.2.3.6.4 1.3.4 2 0 2.5-2 4.5-4.5 4.5-.7 0-1.4-.2-2-.4-.5-.2-1-.1-1.2.4-.2.5-.1 1 .4 1.2.8.4 1.7.6 2.6.6 3.6 0 6.5-2.9 6.5-6.5 0-.9-.2-1.8-.6-2.5z" fill="currentColor"/>
          <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5-1.3C8.5 21.5 10.2 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3.1-.2-.3C4.4 15.1 4 13.6 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z" fill="currentColor"/>
        </svg>
        <span class="whatsapp-tooltip">¿Dudas? Escríbenos</span>
      </a>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; }
    .sidebar { width: 240px; background: linear-gradient(180deg, #0d1321, #121b30); color: white; display: flex; flex-direction: column; position: fixed; inset: 0; right: auto; z-index: 30; }
    .sidebar-brand { display: flex; align-items: center; gap: 0.625rem; padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .brand-text { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; }
    .brand-info { display: flex; flex-direction: column; }
    .brand-version { font-size: 0.625rem; color: #5a6385; font-weight: 500; }
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

    .content-header { display: flex; justify-content: flex-end; padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; }
    .theme-toggle { background: #f1f5f9; border: none; border-radius: 8px; padding: 0.5rem 0.75rem; cursor: pointer; font-size: 1.25rem; transition: all 0.2s; }
    .theme-toggle:hover { background: #e2e8f0; }

    .main-content { flex: 1; margin-left: 240px; min-height: 100vh; }

    /* WhatsApp Floating Button */
    .whatsapp-float {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(37, 211, 102, 0.4);
      transition: all 0.3s ease;
      z-index: 1000;
    }
    .whatsapp-float:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(37, 211, 102, 0.5);
    }
    .whatsapp-tooltip {
      position: absolute;
      right: 70px;
      background: #1e293b;
      color: white;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      font-size: 0.875rem;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }
    .whatsapp-float:hover .whatsapp-tooltip {
      opacity: 1;
      visibility: visible;
    }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main-content { margin-left: 0; }
      .whatsapp-float { bottom: 16px; right: 16px; }
    }
  `],
})
export class LayoutComponent implements OnInit {
  version = environment.version;
  darkMode = signal(false);

  constructor(public auth: AuthService) { }

  ngOnInit(): void {
    const saved = localStorage.getItem('darkMode');
    this.darkMode.set(saved === 'true');
    this.applyTheme();
  }

  toggleDarkMode(): void {
    this.darkMode.update(v => !v);
    localStorage.setItem('darkMode', this.darkMode().toString());
    this.applyTheme();
  }

  private applyTheme(): void {
    if (this.darkMode()) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}
