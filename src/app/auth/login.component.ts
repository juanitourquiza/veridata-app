import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
    selector: 'app-login',
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="login-page">
      <div class="login-left">
        <div class="brand">
          <svg viewBox="0 0 40 40" fill="none" width="48" height="48">
            <path d="M20 4L6 12v16l14 8 14-8V12L20 4z" fill="#5687f3" opacity="0.2"/>
            <path d="M20 4L6 12v16l14 8 14-8V12L20 4z" stroke="#5687f3" stroke-width="2" fill="none"/>
            <path d="M14 20l4 4 8-8" stroke="#5687f3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h1>Veridata</h1>
        </div>
        <p class="tagline">Plataforma inteligente para el cumplimiento de protección de datos personales</p>
        <div class="features">
          <div class="feature"><span>🛡️</span><div><strong>Evaluación de Controles</strong><p>Matriz de madurez con 11 dominios y +30 controles</p></div></div>
          <div class="feature"><span>📊</span><div><strong>Dashboard de Resultados</strong><p>Madurez por dominio, informe GAP y plan de acción</p></div></div>
          <div class="feature"><span>🤖</span><div><strong>Informe Ejecutivo IA</strong><p>Generación automática con OpenAI, Anthropic o DeepSeek</p></div></div>
        </div>
      </div>
      <div class="login-right">
        <div class="login-card">
          <h2>Iniciar Sesión</h2>
          <p class="subtitle">Ingresa tus credenciales para acceder</p>
          @if (error()) { <div class="alert-error">{{ error() }}</div> }
          <form (ngSubmit)="onLogin()">
            <div class="form-group"><label class="vd-label" for="email">Correo electrónico</label><input id="email" type="email" class="vd-input" [(ngModel)]="email" name="email" placeholder="correo&#64;empresa.com" required></div>
            <div class="form-group"><label class="vd-label" for="password">Contraseña</label><input id="password" type="password" class="vd-input" [(ngModel)]="password" name="password" placeholder="••••••••" required></div>
            <button type="submit" class="vd-btn vd-btn-primary login-btn" [disabled]="loading()">{{ loading() ? 'Ingresando...' : 'Ingresar' }}</button>
          </form>
          <p class="register-link">¿No tienes cuenta? <a routerLink="/register">Crear cuenta</a></p>
          <div class="demo-credentials"><p><strong>Demo:</strong></p><small>Admin: admin&#64;veridata.io / password123</small><br><small>Senior: senior&#64;veridata.io / password123</small></div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .login-page { display: flex; min-height: 100vh; }
    .login-left { flex: 1; background: linear-gradient(135deg, #0d1321, #1a2540, #20283e); color: white; padding: 3rem; display: flex; flex-direction: column; justify-content: center; }
    .brand { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .brand h1 { font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; }
    .tagline { font-size: 1.125rem; color: #8890a8; margin-bottom: 3rem; max-width: 400px; line-height: 1.6; }
    .features { display: flex; flex-direction: column; gap: 1.5rem; }
    .feature { display: flex; gap: 1rem; align-items: flex-start; }
    .feature span { font-size: 1.5rem; flex-shrink: 0; }
    .feature strong { display: block; font-size: 0.9375rem; margin-bottom: 0.25rem; }
    .feature p { font-size: 0.8125rem; color: #8890a8; margin: 0; line-height: 1.4; }
    .login-right { flex: 1; display: flex; align-items: center; justify-content: center; background: #f8fafc; padding: 2rem; }
    .login-card { background: white; padding: 2.5rem; border-radius: 16px; box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.08); width: 100%; max-width: 420px; }
    .login-card h2 { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.25rem; }
    .subtitle { color: #64748b; font-size: 0.875rem; margin: 0 0 1.5rem; }
    .form-group { margin-bottom: 1.25rem; }
    .login-btn { width: 100%; padding: 0.75rem; font-size: 0.9375rem; margin-top: 0.5rem; }
    .alert-error { background: rgba(239,68,68,0.1); color: #ef4444; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.8125rem; margin-bottom: 1rem; }
    .register-link { text-align: center; margin-top: 1.25rem; font-size: 0.8125rem; color: #64748b; }
    .register-link a { color: #5687f3; font-weight: 600; text-decoration: none; }
    .demo-credentials { margin-top: 1.5rem; padding: 0.75rem; background: #f1f5f9; border-radius: 8px; font-size: 0.75rem; color: #64748b; }
    .demo-credentials p { margin: 0 0 0.25rem; }
    @media (max-width: 768px) { .login-page { flex-direction: column; } .login-left { padding: 2rem; } .features { display: none; } }
  `],
})
export class LoginComponent {
    email = '';
    password = '';
    error = signal('');
    loading = signal(false);
    constructor(private authService: AuthService, private router: Router) {
        if (this.authService.isAuthenticated()) this.router.navigate(['/projects']);
    }
    onLogin(): void {
        this.loading.set(true); this.error.set('');
        this.authService.login(this.email, this.password).subscribe({
            next: () => { this.loading.set(false); this.router.navigate(['/projects']); },
            error: (err: { error?: { message?: string } }) => { this.loading.set(false); this.error.set(err.error?.message || 'Error al iniciar sesión'); },
        });
    }
}
