import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-help-popup',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    DividerModule,
    TagModule
  ],
  template: `
    <p-dialog 
      [visible]="visible" 
      [modal]="true"
      [closable]="false"
      [resizable]="false"
      [draggable]="true"
      [blockScroll]="true"
      [dismissableMask]="true"
      [closeOnEscape]="true"
      styleClass="help-dialog"
      [style]="{minWidth: '700px', maxWidth: '900px'}"
      (onHide)="closeDialog()">
      
      <!-- Custom Header -->
      <ng-template pTemplate="header">
        <div class="dialog-header-content">
          <h2 class="dialog-title">📄 PDF Reader Pro - Guide & Documentation</h2>
          <button 
            class="dialog-close-btn" 
            (click)="closeDialog()"
            title="Fermer">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </ng-template>
      
      <div class="help-content"
           (click)="$event.stopPropagation()">
        
        <!-- Introduction -->
        <div class="section">
          <h3 class="section-title">
            <i class="pi pi-info-circle"></i>
            À propos de PDF Reader Pro
          </h3>
          <p class="section-text">
            PDF Reader Pro est un lecteur PDF avancé avec des fonctionnalités intelligentes de sélection de texte, 
            d'analyse automatique et d'actions contextuelles. Conçu pour une expérience professionnelle et intuitive.
          </p>
        </div>

        <p-divider></p-divider>

        <!-- Key Features -->
        <div class="section">
          <h3 class="section-title">
            <i class="pi pi-star"></i>
            Fonctionnalités principales
          </h3>
          
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📁</div>
              <h4>Chargement local</h4>
              <p>Chargez vos PDF depuis votre ordinateur en toute sécurité</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">🔍</div>
              <h4>Zoom avancé</h4>
              <p>Zoom de 25% à 400% avec qualité optimisée</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">📱</div>
              <h4>Plein écran</h4>
              <p>Mode plein écran pour une lecture immersive</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">✨</div>
              <h4>Sélection intelligente</h4>
              <p>Sélectionnez du texte avec analyse automatique</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">🤖</div>
              <h4>Analyse intelligent</h4>
              <p>Catégorisation automatique et détection de mots-clés</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">🎯</div>
              <h4>Actions contextuelles</h4>
              <p>Actions intelligentes selon le type de contenu</p>
            </div>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- How to Use -->
        <div class="section">
          <h3 class="section-title">
            <i class="pi pi-play"></i>
            Comment utiliser
          </h3>
          
          <div class="steps-list">
            <div class="step-item">
              <div class="step-number">1</div>
              <div class="step-content">
                <h4>Charger un PDF</h4>
                <p>Cliquez sur l'icône 📁 pour sélectionner un fichier PDF depuis votre ordinateur</p>
              </div>
            </div>
            
            <div class="step-item">
              <div class="step-number">2</div>
              <div class="step-content">
                <h4>Navigation</h4>
                <p>Utilisez les boutons de navigation ou les flèches ← → du clavier pour parcourir les pages</p>
              </div>
            </div>
            
            <div class="step-item">
              <div class="step-number">3</div>
              <div class="step-content">
                <h4>Sélection de texte</h4>
                <p>Activez la sélection de texte et glissez pour sélectionner. Double-cliquez pour sélectionner un mot</p>
              </div>
            </div>
            
            <div class="step-item">
              <div class="step-number">4</div>
              <div class="step-content">
                <h4>Actions intelligentes</h4>
                <p>Cliquez sur le texte sélectionné pour ouvrir le dialogue avec analyse et actions contextuelles</p>
              </div>
            </div>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Text Analysis Categories -->
        <div class="section">
          <h3 class="section-title">
            <i class="pi pi-chart-line"></i>
            Catégories d'analyse intelligente
          </h3>
          
          <div class="categories-grid">
            <div class="category-item">
              <i class="pi pi-book" style="color: #3b82f6;"></i>
              <div class="category-info">
                <h4>Académique</h4>
                <p>Contenu éducatif, recherche, citations scientifiques</p>
              </div>
            </div>
            
            <div class="category-item">
              <i class="pi pi-cog" style="color: #8b5cf6;"></i>
              <div class="category-info">
                <h4>Technique</h4>
                <p>Code, algorithmes, spécifications techniques</p>
              </div>
            </div>
            
            <div class="category-item">
              <i class="pi pi-briefcase" style="color: #10b981;"></i>
              <div class="category-info">
                <h4>Business</h4>
                <p>Finance, management, stratégie d'entreprise</p>
              </div>
            </div>
            
            <div class="category-item">
              <i class="pi pi-shield" style="color: #f59e0b;"></i>
              <div class="category-info">
                <h4>Juridique</h4>
                <p>Lois, contrats, réglementations légales</p>
              </div>
            </div>
            
            <div class="category-item">
              <i class="pi pi-heart" style="color: #ef4444;"></i>
              <div class="category-info">
                <h4>Médical</h4>
                <p>Santé, médecine, diagnostics médicaux</p>
              </div>
            </div>
            
            <div class="category-item">
              <i class="pi pi-file-o" style="color: #6b7280;"></i>
              <div class="category-info">
                <h4>Général</h4>
                <p>Contenu général et divers</p>
              </div>
            </div>
          </div>
        </div>

        <p-divider></p-divider>

        <!-- Keyboard Shortcuts -->
        <div class="section">
          <h3 class="section-title">
            <i class="pi pi-keyboard"></i>
            Raccourcis clavier
          </h3>
          
          <div class="shortcuts-grid">
            <div class="shortcut-item">
              <kbd>←</kbd> <kbd>→</kbd>
              <span>Navigation entre les pages</span>
            </div>
            
            <div class="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>+</kbd>
              <span>Zoom avant</span>
            </div>
            
            <div class="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>-</kbd>
              <span>Zoom arrière</span>
            </div>
            
            <div class="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>C</kbd>
              
              <span>   Copier le texte sélectionné</span>
            </div>
            
            <div class="shortcut-item">
              <kbd>Échap</kbd>
              <span>Quitter le plein écran</span>
            </div>
            
            <div class="shortcut-item">
              <kbd>Double-clic</kbd>
              <span>Sélectionner un mot</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Dialog Footer -->
      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <p-button 
            label="Fermer" 
            icon="pi pi-times" 
            (onClick)="closeDialog()"
            styleClass="p-button-text">
          </p-button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    /* Force proper dialog backdrop */
    :host ::ng-deep .p-dialog-mask {
      background-color: rgba(0, 0, 0, 0.6) !important;
      backdrop-filter: blur(4px) !important;
      z-index: 9999 !important;
    }

    /* Ensure dialog is above everything */
    :host ::ng-deep .p-dialog {
      z-index: 10000 !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
      border-radius: 12px !important;
      overflow: hidden !important;
    }

    /* Fix dialog container positioning */
    :host ::ng-deep .help-dialog {
      .p-dialog-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        border-radius: 12px 12px 0 0 !important;
        padding: 20px 24px !important;
        border: none !important;
      }
      
      .p-dialog-header .p-dialog-title {
        font-weight: 600 !important;
        font-size: 1.3rem !important;
        color: white !important;
      }

        .dialog-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        
        .dialog-title {
          margin: 0;
          font-weight: 700;
          font-size: 1.3rem;
          color: white;
        }
        
        .dialog-close-btn {
          background: rgba(255,255,255,0.15);
          border: none;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          cursor: pointer;
          color: white;
          font-size: 16px;
        }
        
        .dialog-close-btn:hover {
          background: rgba(255,255,255,0.25);
          transform: scale(1.05);
        }

      .p-dialog-header .p-dialog-header-icons {
        .p-dialog-header-close {
          color: white !important;
          background: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          transition: all 0.2s ease !important;

          &:hover {
            background: rgba(255, 255, 255, 0.2) !important;
            border-color: rgba(255, 255, 255, 0.3) !important;
          }
        }
      }
      
      .p-dialog-content {
        padding: 0 !important;
        max-height: 70vh !important;
        overflow-y: auto !important;
        background: white !important;
        border: none !important;
      }
      
      .p-dialog-footer {
        border-top: 1px solid #e5e7eb !important;
        background: #f8f9fa !important;
        border-radius: 0 0 12px 12px !important;
        padding: 16px 24px !important;
        text-align: center !important;
        border-left: none !important;
        border-right: none !important;
        border-bottom: none !important;
      }
    }

    /* Ensure dialog content is properly styled */
    .help-content {
      padding: 0;
      background: white;
      position: relative;
      z-index: 1;
    }

    .section {
      padding: 24px;
      border-bottom: 1px solid #f1f5f9;
      background: white;
    }

    .section:last-child {
      border-bottom: none;
    }

    .section-title {
      margin: 0 0 16px 0;
      color: #1e293b;
      font-size: 1.2rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-text {
      margin: 0;
      color: #64748b;
      line-height: 1.6;
      font-size: 1rem;
    }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .feature-card {
      padding: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      text-align: center;
      transition: all 0.2s ease;
    }

    .feature-card:hover {
      background: #eff6ff;
      border-color: #3b82f6;
      transform: translateY(-1px);
    }

    .feature-icon {
      font-size: 2rem;
      margin-bottom: 8px;
    }

    .feature-card h4 {
      margin: 0 0 8px 0;
      color: #1e293b;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .feature-card p {
      margin: 0;
      color: #64748b;
      font-size: 0.8rem;
      line-height: 1.4;
    }

    /* Steps List */
    .steps-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 16px;
    }

    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .step-number {
      width: 32px;
      height: 32px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
      flex-shrink: 0;
    }

    .step-content h4 {
      margin: 0 0 6px 0;
      color: #1e293b;
      font-size: 1rem;
      font-weight: 600;
    }

    .step-content p {
      margin: 0;
      color: #64748b;
      line-height: 1.5;
      font-size: 0.9rem;
    }

    /* Categories Grid */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .category-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }

    .category-item i {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .category-info h4 {
      margin: 0 0 4px 0;
      color: #1e293b;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .category-info p {
      margin: 0;
      color: #64748b;
      font-size: 0.85rem;
      line-height: 1.4;
    }

    /* Shortcuts Grid */
    .shortcuts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }

    .shortcut-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    kbd {
      background: #1e293b;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
      margin: 0 2px;
    }

    .dialog-footer {
      text-align: center;
    }

    /* Responsive */
    @media (max-width: 768px) {
      :host ::ng-deep .help-dialog {
        .p-dialog {
          width: 95vw !important;
          max-width: 95vw !important;
          margin: 1rem !important;
        }
      }

      .features-grid {
        grid-template-columns: 1fr;
      }
      
      .categories-grid {
        grid-template-columns: 1fr;
      }
      
      .shortcuts-grid {
        grid-template-columns: 1fr;
      }
      
      .shortcut-item {
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }

      .section {
        padding: 16px;
      }
    }

    /* Ensure proper scrolling */
    :host ::ng-deep .p-dialog-content {
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f1f5f9;
    }

    :host ::ng-deep .p-dialog-content::-webkit-scrollbar {
      width: 6px;
    }

    :host ::ng-deep .p-dialog-content::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    :host ::ng-deep .p-dialog-content::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    :host ::ng-deep .p-dialog-content::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class HelpPopupComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  onDialogHide() {
    this.closeDialog();
  }

  closeDialog() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}