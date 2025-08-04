import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfReaderComponent } from './components/pdf-reader/pdf-reader.component';
import { HelpPopupComponent } from './components/app-help-popup/app-help-popup.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PdfReaderComponent, HelpPopupComponent],
  template: `
    <div class="app-container">
      <!-- Background Elements -->
      <div class="background-elements">
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
        <div class="gradient-orb orb-3"></div>
        <div class="floating-particles">
          <div class="particle" *ngFor="let particle of particles; let i = index" 
               [style.left.%]="particle.x"
               [style.top.%]="particle.y"
               [style.animation-delay.s]="particle.delay"></div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="content-wrapper">
        <header class="app-header">
          <div class="header-content">
            <div class="brand-section">
              <div class="brand-icon">
                <div class="icon-background">
                  <span class="icon-text">📄</span>
                </div>
              </div>
              <div class="brand-text">
                <h1 class="app-title">
                  <span class="title-main">PDF Reader</span>
                  <span class="title-accent">Pro</span>
                </h1>
                <p class="app-subtitle">
                  Lecteur PDF professionnel avec analyse intelligente et actions contextuelles
                </p>
              </div>
            </div>
            
            <div class="header-features">
              <div class="feature-badge">
                <div class="badge-icon">✨</div>
                <span class="badge-text">Analyses Intégrées</span>
              </div>
              <div class="feature-badge">
                <div class="badge-icon">🚀</div>
                <span class="badge-text">Ultra Rapide</span>
              </div>
              <div class="feature-badge">
                <div class="badge-icon">🔒</div>
                <span class="badge-text">100% Sécurisé</span>
              </div>
            </div>
          </div>
        </header>
        
        <main class="app-main">
          <div class="pdf-container">
            <app-pdf-reader
              [pdfUrl]="defaultPdfUrl"
              [options]="pdfOptions"
              (textSelected)="onTextSelected($event)"
              (actionExecuted)="onActionExecuted($event)">
            </app-pdf-reader>
          </div>
        </main>

        <!-- Enhanced Footer -->
        <footer class="app-footer">
          <div class="footer-content">
            <div class="footer-section">
              <h4 class="footer-title">PDF Reader Pro</h4>
              <p class="footer-text">
                Solution professionnelle pour la lecture et l'analyse de documents PDF
              </p>
            </div>
            
            <div class="footer-section">
              <h4 class="footer-title">Fonctionnalités</h4>
              <ul class="footer-list">
                <li>Analyse Intelligent avancée</li>
                <li>Sélection intelligente</li>
                <li>Actions contextuelles</li>
                <li>Interface moderne</li>
              </ul>
            </div>
            
            <div class="footer-section">
              <h4 class="footer-title">Performance</h4>
              <div class="performance-stats">
                <div class="stat">
                  <span class="stat-value">99.9%</span>
                  <span class="stat-label">Précision</span>
                </div>
                <div class="stat">
                  <span class="stat-value">&lt;2s</span>
                  <span class="stat-label">Chargement</span>
                </div>
                <div class="stat">
                  <span class="stat-value">24/7</span>
                  <span class="stat-label">Disponible</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="footer-bottom">
            <p class="copyright">
              © 2025 PDF Reader Pro. Tous droits réservés.
            </p>
            
          </div>
        </footer>
      </div>

      <!-- Enhanced Help Button -->
      <button 
        class="help-button"
        (click)="showHelp = true"
        title="Aide et documentation"
        [class.pulsing]="!hasInteracted">
        <div class="help-button-bg"></div>
        <div class="help-button-content">
          <i class="help-icon">💡</i>
          <div class="help-ripple"></div>
        </div>
        <div class="help-tooltip" *ngIf="!hasInteracted">
          <span>Besoin d'aide ?</span>
          <div class="tooltip-arrow"></div>
        </div>
      </button>

    

      <!-- Help Popup -->
      <app-help-popup
        [(visible)]="showHelp"
        (visibleChange)="onHelpToggle($event)">
      </app-help-popup>

      <!-- Notification Toast -->
      <div class="notification-toast" 
           *ngIf="showNotification"
           [class.success]="notificationType === 'success'"
           [class.error]="notificationType === 'error'"
           [class.info]="notificationType === 'info'">
        <div class="toast-icon">
          {{ getNotificationIcon() }}
        </div>
        <div class="toast-content">
          <h4 class="toast-title">{{ notificationTitle }}</h4>
          <p class="toast-message">{{ notificationMessage }}</p>
        </div>
        <button class="toast-close" (click)="hideNotification()">×</button>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow-x: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Background Elements */
    .background-elements {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    }

    .gradient-orb {
      position: absolute;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      filter: blur(40px);
      animation: float-orb 20s ease-in-out infinite;
    }

    .orb-1 {
      width: 400px;
      height: 400px;
      top: -200px;
      left: -200px;
      animation-delay: 0s;
    }

    .orb-2 {
      width: 300px;
      height: 300px;
      top: 50%;
      right: -150px;
      animation-delay: -7s;
    }

    .orb-3 {
      width: 250px;
      height: 250px;
      bottom: -125px;
      left: 30%;
      animation-delay: -14s;
    }

    @keyframes float-orb {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(30px, -30px) rotate(120deg); }
      66% { transform: translate(-20px, 20px) rotate(240deg); }
    }

    .floating-particles {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    .particle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      animation: float-particle 15s linear infinite;
    }

    @keyframes float-particle {
      0% {
        transform: translateY(100vh) rotate(0deg);
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      90% {
        opacity: 1;
      }
      100% {
        transform: translateY(-100px) rotate(360deg);
        opacity: 0;
      }
    }

    /* Content Wrapper */
    .content-wrapper {
      position: relative;
      z-index: 1;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Enhanced Header */
    .app-header {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 24px;
      padding: 32px 40px;
      margin-bottom: 32px;
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 32px;
      flex-wrap: wrap;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .brand-icon {
      position: relative;
    }

    .icon-background {
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 
        0 8px 16px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      animation: icon-glow 4s ease-in-out infinite;
    }

    @keyframes icon-glow {
      0%, 100% { box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
      50% { box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 255, 255, 0.2); }
    }

    .icon-text {
      font-size: 32px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }

    .brand-text {
      color: white;
    }

    .app-title {
      margin: 0 0 8px 0;
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }

    .title-main {
      background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .title-accent {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-left: 8px;
    }

    .app-subtitle {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.5;
      max-width: 600px;
    }

    .header-features {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .feature-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }

    .feature-badge:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }

    .badge-icon {
      font-size: 16px;
    }

    .badge-text {
      color: white;
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
    }

    /* Main Content */
    .app-main {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      margin-bottom: 40px;
    }

    .pdf-container {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    /* Enhanced Footer */
    .app-footer {
      background: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 32px 40px 24px;
      color: white;
      margin-top: 32px;
    }

    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 32px;
      margin-bottom: 24px;
    }

    .footer-section {
      display: flex;
      flex-direction: column;
    }

    .footer-title {
      margin: 0 0 16px 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
    }

    .footer-text {
      margin: 0;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.6;
      font-size: 0.95rem;
    }

    .footer-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-list li {
      padding: 4px 0;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
      position: relative;
      padding-left: 16px;
    }

    .footer-list li::before {
      content: '→';
      position: absolute;
      left: 0;
      color: rgba(255, 255, 255, 0.6);
    }

    .performance-stats {
      display: flex;
      gap: 16px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      min-width: 60px;
    }

    .stat-value {
      font-size: 1.2rem;
      font-weight: 700;
      color: #fbbf24;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.8);
      text-align: center;
    }

    .footer-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      flex-wrap: wrap;
      gap: 16px;
    }

    .copyright {
      margin: 0;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    .footer-links {
      display: flex;
      gap: 24px;
    }

    .footer-link {
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.3s ease;
    }

    .footer-link:hover {
      color: white;
    }

    /* Enhanced Help Button */
    .help-button {
      position: fixed;
      bottom: 32px;
      right: 32px;
      width: 64px;
      height: 64px;
      background: none;
      border: none;
      cursor: pointer;
      z-index: 1000;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .help-button:hover {
      transform: scale(1.1);
    }

    .help-button.pulsing .help-button-content {
      animation: pulse-help 2s ease-in-out infinite;
    }

    @keyframes pulse-help {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .help-button-bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      border-radius: 50%;
      box-shadow: 
        0 8px 24px rgba(59, 130, 246, 0.4),
        0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
    }

    .help-button:hover .help-button-bg {
      box-shadow: 
        0 12px 32px rgba(59, 130, 246, 0.6),
        0 8px 16px rgba(0, 0, 0, 0.2);
    }

    .help-button-content {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      overflow: hidden;
    }

    .help-icon {
      font-size: 28px;
      z-index: 2;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }

    .help-ripple {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
      border-radius: 50%;
      transform: scale(0);
      transition: transform 0.6s ease;
    }

    .help-button:active .help-ripple {
      transform: scale(1);
    }

    .help-tooltip {
      position: absolute;
      bottom: 100%;
      right: 0;
      margin-bottom: 12px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      backdrop-filter: blur(10px);
      animation: tooltip-bounce 0.5s ease-out;
    }

    @keyframes tooltip-bounce {
      0% { opacity: 0; transform: translateY(10px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    .tooltip-arrow {
      position: absolute;
      top: 100%;
      right: 16px;
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid rgba(0, 0, 0, 0.9);
    }

    /* Status Indicator */
    .status-indicator {
      position: fixed;
      bottom: 32px;
      left: 32px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(10px);
      padding: 8px 16px;
      border-radius: 20px;
      color: white;
      font-size: 12px;
      font-weight: 500;
      z-index: 1000;
      transition: all 0.3s ease;
    }

    .status-indicator.online {
      background: rgba(34, 197, 94, 0.8);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ef4444;
      transition: background 0.3s ease;
    }

    .status-indicator.online .status-dot {
      background: #22c55e;
      animation: pulse-dot 2s ease-in-out infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .status-text {
      font-size: 11px;
    }

    /* Notification Toast */
    .notification-toast {
      position: fixed;
      top: 32px;
      right: 32px;
      background: white;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
      border: 1px solid #e5e7eb;
      z-index: 1001;
      max-width: 400px;
      animation: toast-slide-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    @keyframes toast-slide-in {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .notification-toast.success {
      border-left: 4px solid #22c55e;
    }

    .notification-toast.error {
      border-left: 4px solid #ef4444;
    }

    .notification-toast.info {
      border-left: 4px solid #3b82f6;
    }

    .toast-icon {
      font-size: 20px;
      margin-top: 2px;
    }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }

    .toast-message {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 18px;
      color: #9ca3af;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .toast-close:hover {
      background: #f3f4f6;
      color: #6b7280;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .content-wrapper {
        padding: 12px;
      }

      .app-header {
        padding: 24px 20px;
        margin-bottom: 20px;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 20px;
      }

      .brand-section {
        width: 100%;
      }

      .app-title {
        font-size: 2rem;
      }

      .app-subtitle {
        font-size: 1rem;
      }

      .header-features {
        width: 100%;
        justify-content: center;
      }

      .app-footer {
        padding: 24px 20px 16px;
        margin-top: 20px;
      }

      .footer-content {
        grid-template-columns: 1fr;
        gap: 24px;
      }

      .footer-bottom {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .performance-stats {
        justify-content: center;
      }

      .help-button {
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
      }

      .help-icon {
        font-size: 24px;
      }

      .status-indicator {
        bottom: 20px;
        left: 20px;
        font-size: 11px;
      }

      .notification-toast {
        top: 20px;
        right: 20px;
        left: 20px;
        max-width: none;
      }

      .help-tooltip {
        right: -20px;
        bottom: 120%;
      }
    }

    @media (max-width: 480px) {
      .brand-section {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .app-title {
        font-size: 1.75rem;
      }

      .app-subtitle {
        font-size: 0.95rem;
      }

      .feature-badge {
        padding: 8px 12px;
      }

      .badge-text {
        font-size: 12px;
      }

      .footer-links {
        flex-direction: column;
        gap: 12px;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .notification-toast {
        background: #1f2937;
        border-color: #374151;
        color: white;
      }

      .toast-title {
        color: #f9fafb;
      }

      .toast-message {
        color: #d1d5db;
      }

      .toast-close {
        color: #9ca3af;
      }

      .toast-close:hover {
        background: #374151;
        color: #d1d5db;
      }
    }

    /* Accessibility improvements */
    @media (prefers-reduced-motion: reduce) {
      .gradient-orb,
      .particle,
      .icon-background,
      .help-button.pulsing .help-button-content,
      .status-indicator.online .status-dot {
        animation: none;
      }

      .notification-toast {
        animation: none;
      }

      .help-tooltip {
        animation: none;
      }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      .app-header,
      .app-footer {
        border: 2px solid rgba(255, 255, 255, 0.5);
      }

      .feature-badge,
      .help-button-bg,
      .status-indicator {
        border: 2px solid rgba(255, 255, 255, 0.3);
      }

      .notification-toast {
        border: 2px solid #000;
      }
    }

    /* Focus styles for accessibility */
    .help-button:focus-visible {
      outline: 3px solid rgba(255, 255, 255, 0.8);
      outline-offset: 4px;
    }

    .footer-link:focus-visible,
    .toast-close:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.8);
      outline-offset: 2px;
    }
  `]
})
export class AppComponent {
  // Default PDF URL - you can change this or set to empty string to start with welcome screen
  defaultPdfUrl = '';  
  
  // PDF reader options
  pdfOptions = {
    enableTextSelection: true,
    defaultZoom: 1.0,
    showToolbar: true,
    useDialogMode: true
  };

  // Help popup state
  showHelp = false;
  hasInteracted = false;

  // Online status
  isOnline = navigator.onLine;

  // Notification system
  showNotification = false;
  notificationType: 'success' | 'error' | 'info' = 'info';
  notificationTitle = '';
  notificationMessage = '';
  private notificationTimeout?: number;

  // Floating particles for background animation
  particles = Array.from({ length: 20 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 15
  }));

  constructor() {
    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showNotificationMessage('Connexion rétablie', 'Vous êtes de nouveau en ligne', 'success');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showNotificationMessage('Connexion perdue', 'Vous êtes actuellement hors ligne', 'error');
    });

    // Auto-hide help tooltip after first interaction
    setTimeout(() => {
      this.hasInteracted = true;
    }, 10000);
  }

  onTextSelected(event: any) {
    console.log('📝 Text selected in app:', {
      text: event.selection.text.substring(0, 100) + '...',
      page: event.selection.pageNumber,
      timestamp: event.timestamp
    });

    this.showNotificationMessage(
      'Texte sélectionné', 
      `${event.selection.text.length} caractères sélectionnés sur la page ${event.selection.pageNumber}`, 
      'info'
    );
  }

  onActionExecuted(event: any) {
    console.log('🎯 Action executed in app:', {
      action: event.action.label,
      success: event.success,
      timestamp: event.timestamp,
      error: event.error
    });

    if (event.success) {
      this.showNotificationMessage(
        'Action réussie',
        `${event.action.label} exécuté avec succès`,
        'success'
      );
    } else {
      this.showNotificationMessage(
        'Erreur d\'action',
        `Échec de l'exécution: ${event.error || 'Erreur inconnue'}`,
        'error'
      );
    }
  }

  onHelpToggle(visible: boolean) {
    if (visible) {
      this.hasInteracted = true;
    }
  }

  showNotificationMessage(title: string, message: string, type: 'success' | 'error' | 'info') {
    this.notificationTitle = title;
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    // Clear existing timeout
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    // Auto-hide after 5 seconds
    this.notificationTimeout = window.setTimeout(() => {
      this.hideNotification();
    }, 5000);
  }

  hideNotification() {
    this.showNotification = false;
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }

  getNotificationIcon(): string {
    switch (this.notificationType) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }
}