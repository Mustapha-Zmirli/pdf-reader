import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';

import { TextSelection, ActionCategory, TextAnalysisResult, DialogAction } from '../pdf-reader/pdf-reader.types';
import { TextAnalysisService } from '../../service/text-analysis.service';

@Component({
  selector: 'app-text-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    ChipModule,
    TagModule,
    ProgressSpinnerModule,
    DividerModule,
    TooltipModule,
    CardModule
  ],
  template: `
         <p-dialog 
       [visible]="visible" 
       [modal]="true"
       [closable]="false"
       [resizable]="true"
       [draggable]="true"
       styleClass="selection-dialog"
       [style]="{minWidth: '600px', maxWidth: '800px', maxHeight: '90vh'}"
       (onHide)="onDialogHide()"
       (onShow)="onDialogShow()"
       (click)="onDialogClick($event)">
       
       <!-- Custom Header -->
       <ng-template pTemplate="header">
         <div class="dialog-header-content">
           <h2 class="dialog-title">Texte sélectionné</h2>
           <button 
             class="dialog-close-btn" 
             (click)="closeDialog()"
             title="Fermer">
             <i class="pi pi-times"></i>
           </button>
         </div>
       </ng-template>
      
      <!-- Selected Text Display -->
      <div class="selected-text-section" *ngIf="selection">
        <div class="text-header">
          <h4 class="text-title">
            <i class="pi pi-quote-left"></i>
            Contenu sélectionné
          </h4>
          <div class="text-stats">
            <p-tag 
              value="Page {{ selection.pageNumber }}" 
              severity="info" 
              icon="pi pi-file">
            </p-tag>
            <p-tag 
              [value]="getWordCount() + ' mots'" 
              severity="secondary" 
              icon="pi pi-align-left">
            </p-tag>
            <p-tag 
              [value]="selection.text.length + '  caractères'" 
              severity="secondary" 
              icon="pi pi-pencil">
            </p-tag>
          </div>
        </div>
        
        <div class="selected-text-content">
          <p class="selected-text">{{ selection.text }}</p>
        </div>
      </div>

      <p-divider></p-divider>

      <!-- Analysis Loading -->
      <div class="analysis-loading" *ngIf="isAnalyzing">
        <div class="loading-content">
          <p-progressSpinner 
            [style]="{width: '30px', height: '30px'}" 
            strokeWidth="4">
          </p-progressSpinner>
          <span class="loading-text">Analyse du contenu en cours...</span>
        </div>
      </div>

      <!-- Analysis Results -->
      <div class="analysis-section" *ngIf="analysisResult && !isAnalyzing">
        <div class="analysis-header">
          <h4 class="analysis-title">
            <i class="pi pi-chart-line"></i>
            Analyse et suggestions
          </h4>
        </div>

        <!-- Categories -->
        <div class="categories-section" *ngIf="analysisResult.categories.length > 0">
          <h5 class="section-subtitle">Catégories détectées</h5>
          <div class="categories-grid">
            <div 
              *ngFor="let category of analysisResult.categories" 
              class="category-card"
              [class.selected]="selectedCategory?.id === category.id"
              (click)="selectCategory(category)">
              <div class="category-header">
                <i [class]="category.icon" [style.color]="category.color"></i>
                <span class="category-name">{{ category.label }}</span>
              </div>
              <p class="category-description">{{ category.description }}</p>
            </div>
          </div>
        </div>

        <!-- Keywords -->
        <div class="keywords-section" *ngIf="analysisResult.keywords.length > 0">
          <h5 class="section-subtitle">Mots-clés identifiés</h5>
          <div class="keywords-container">
            <p-chip 
              *ngFor="let keyword of analysisResult.keywords" 
              [label]="keyword"
              styleClass="keyword-chip">
            </p-chip>
          </div>
        </div>

        <!-- Language and Sentiment -->
        <div class="metadata-section">
          <div class="metadata-item">
            <i class="pi pi-globe"></i>
            <span>Langue: {{ getLanguageLabel(analysisResult.language) }}</span>
          </div>
          <div class="metadata-item" *ngIf="analysisResult.sentiment">
            <i [class]="getSentimentIcon(analysisResult.sentiment)" 
               [style.color]="getSentimentColor(analysisResult.sentiment)"></i>
            <span>Sentiment: {{ getSentimentLabel(analysisResult.sentiment) }}</span>
          </div>
        </div>
      </div>

      <p-divider></p-divider>

      <!-- Actions Section -->
      <div class="actions-section">
        <div class="actions-header">
          <h4 class="actions-title">
            <i class="pi pi-bolt"></i>
            Actions disponibles
          </h4>
          <small class="actions-subtitle" *ngIf="selectedCategory">
            Actions pour la catégorie: {{ selectedCategory.label }}
          </small>
        </div>

        <div class="actions-grid">
          <button 
            *ngFor="let action of getAvailableActions()" 
            pButton 
            class="action-button"
            [class.loading]="action.loading"
            [disabled]="action.disabled || isExecutingAction"
            (click)="executeAction(action)">
            
            <div class="action-content">
              <i [class]="action.icon" *ngIf="!action.loading"></i>
              <p-progressSpinner 
                *ngIf="action.loading"
                [style]="{width: '16px', height: '16px'}" 
                strokeWidth="4">
              </p-progressSpinner>
              <span class="action-label">{{ action.label }}</span>
            </div>
          </button>
        </div>
      </div>

             <!-- Dialog Footer -->
       <ng-template pTemplate="footer">
         <div class="dialog-footer">
           <div class="footer-left">
             <p-button 
               label="Fermer" 
               icon="pi pi-times" 
               (onClick)="closeDialog()"
               styleClass="p-button-text close-btn">
             </p-button>
           </div>
           
           <div class="footer-right">
             <p-button 
               label="Copier le texte" 
               icon="pi pi-copy" 
               (onClick)="copyText()"
               [disabled]="!selection"
               styleClass="p-button-outlined copy-btn">
             </p-button>
           </div>
         </div>
       </ng-template>
    </p-dialog>
  `,
  styles: [`
         :host ::ng-deep .selection-dialog {
       .p-dialog {
         background: white;
         box-shadow: 0 25px 80px rgba(0,0,0,0.15);
         max-height: 90vh;
         overflow: hidden;
         border-radius: 16px;
         border: 1px solid rgba(255,255,255,0.2);
       }
       
       .p-dialog-header {
         background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
         color: white;
         border-radius: 16px 16px 0 0;
         padding: 20px 24px;
         position: relative;
       }
       
       .p-dialog-header .p-dialog-title {
         font-weight: 700;
         font-size: 1.3rem;
         padding-left: 8px;
         letter-spacing: -0.02em;
       }
       
       .p-dialog-header .p-dialog-header-icon {
         background: rgba(255,255,255,0.15);
         border: none;
         border-radius: 8px;
         width: 36px;
         height: 36px;
         display: flex;
         align-items: center;
         justify-content: center;
         transition: all 0.2s ease;
         margin-right: 8px;
       }
       
               .p-dialog-header .p-dialog-header-icon:hover {
          background: rgba(255,255,255,0.25);
          transform: scale(1.05);
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
          padding-left: 8px;
          letter-spacing: -0.02em;
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
      
                                                       .p-dialog-content {
           padding: 0;
           border-radius: 0 0 16px 16px;
           background: white;
           overflow-y: auto;
           max-height: 65vh;
           min-height: 400px;
          
          /* Custom scrollbar styling */
          &::-webkit-scrollbar {
            width: 10px;
          }
          
          &::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 5px;
          }
          
          &::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 5px;
            border: 2px solid #f1f1f1;
          }
          
          &::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
        }
      
             .p-dialog-footer {
         border-top: 1px solid #e5e7eb;
         background: #f8f9fa;
         border-radius: 0 0 16px 16px;
         padding: 20px 24px;
       }
    }

    .selected-text-section {
      padding: 24px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .text-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .text-title {
      margin: 0;
      color: #1e293b;
      font-size: 1.1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .text-stats {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .selected-text-content {
      background: white;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .selected-text {
      margin: 0;
      line-height: 1.6;
      color: #334155;
      font-size: 0.95rem;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .analysis-loading {
      padding: 32px;
      text-align: center;
    }

    .loading-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .loading-text {
      color: #64748b;
      font-size: 0.95rem;
    }

    .analysis-section {
      padding: 24px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
    }

    .analysis-header, .actions-header {
      margin-bottom: 20px;
    }

    .analysis-title, .actions-title {
      margin: 0 0 4px 0;
      color: #1e293b;
      font-size: 1.1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-subtitle {
      margin: 20px 0 12px 0;
      color: #475569;
      font-size: 0.9rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }

    .category-card {
      padding: 16px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .category-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      transform: translateY(-1px);
    }

    .category-card.selected {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
    }

    .category-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .category-name {
      font-weight: 600;
      color: #1e293b;
    }

    .category-description {
      margin: 0;
      font-size: 0.85rem;
      color: #64748b;
      line-height: 1.4;
    }

    .keywords-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    :host ::ng-deep .keyword-chip {
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }

    .metadata-section {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      margin-top: 16px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .metadata-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #64748b;
      font-size: 0.9rem;
    }

         .actions-section {
       padding: 24px;
       background: #f8fafc;
       padding-bottom: 32px;
     }

    .actions-subtitle {
      color: #64748b;
      font-style: italic;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }

    .action-button {
      min-height: 56px;
      border-radius: 8px;
      border: 2px solid #e2e8f0;
      background: white;
      transition: all 0.2s ease;
    }

    .action-button:not(:disabled):hover {
      border-color: #3b82f6;
      background: #eff6ff;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }

    .action-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      flex-direction: column;
    }

    .action-label {
      font-size: 0.85rem;
      font-weight: 500;
      text-align: center;
    }

         .dialog-footer {
       display: flex;
       justify-content: space-between;
       align-items: center;
       gap: 16px;
     }
     
     .footer-left, .footer-right {
       display: flex;
       align-items: center;
     }
     
     :host ::ng-deep .close-btn {
       color: #6b7280;
       font-weight: 500;
       padding: 10px 16px;
       border-radius: 8px;
       transition: all 0.2s ease;
     }
     
     :host ::ng-deep .close-btn:hover {
       background: #f3f4f6;
       color: #374151;
     }
     
     :host ::ng-deep .copy-btn {
       background: #3b82f6;
       border-color: #3b82f6;
       color: white;
       font-weight: 500;
       padding: 10px 20px;
       border-radius: 8px;
       transition: all 0.2s ease;
     }
     
     :host ::ng-deep .copy-btn:hover:not(:disabled) {
       background: #2563eb;
       border-color: #2563eb;
       transform: translateY(-1px);
       box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
     }
     
     :host ::ng-deep .copy-btn:disabled {
       background: #9ca3af;
       border-color: #9ca3af;
       opacity: 0.6;
     }

    /* Responsive design */
    @media (max-width: 768px) {
      .text-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .categories-grid {
        grid-template-columns: 1fr;
      }
      
      .actions-grid {
        grid-template-columns: 1fr;
      }
      
      .metadata-section {
        flex-direction: column;
        gap: 12px;
      }
    }
  `]
})
export class TextSelectionDialogComponent implements OnInit, OnDestroy, OnChanges {
  @Input() visible = false;
  @Input() selection: TextSelection | null = null;
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() actionExecuted = new EventEmitter<any>();
  @Output() dialogClosed = new EventEmitter<void>();

  analysisResult: TextAnalysisResult | null = null;
  selectedCategory: ActionCategory | null = null;
  isAnalyzing = false;
  isExecutingAction = false;

  private availableActions: DialogAction[] = [
    {
      id: 'copy',
      label: 'Copier',
      icon: 'pi pi-copy',
      category: { id: 'general', label: 'Général', icon: 'pi pi-file-o' },
      action: this.copyToClipboard.bind(this)
    },
    {
      id: 'search-google',
      label: 'Rechercher sur Google',
      icon: 'pi pi-search',
      category: { id: 'general', label: 'Général', icon: 'pi pi-file-o' },
      action: this.searchGoogle.bind(this)
    },
    {
      id: 'translate',
      label: 'Traduire',
      icon: 'pi pi-language',
      category: { id: 'general', label: 'Général', icon: 'pi pi-file-o' },
      action: this.translateText.bind(this)
    },
    {
      id: 'academic-search',
      label: 'Recherche académique',
      icon: 'pi pi-book',
      category: { id: 'academic', label: 'Académique', icon: 'pi pi-book' },
      action: this.searchAcademic.bind(this)
    },
    {
      id: 'definition',
      label: 'Définition',
      icon: 'pi pi-info-circle',
      category: { id: 'academic', label: 'Académique', icon: 'pi pi-book' },
      action: this.searchDefinition.bind(this)
    }
  ];

     private documentClickListener?: (event: Event) => void;

   constructor(private textAnalysisService: TextAnalysisService) {}

     ngOnInit() {
     if (this.visible && this.selection) {
       this.analyzeSelection();
     }
     this.setupEventListeners();
   }

  ngOnChanges() {
    // Trigger analysis when dialog becomes visible or selection changes
    if (this.visible && this.selection && !this.isAnalyzing && !this.analysisResult) {
      console.log('🔍 Starting text analysis for:', this.selection.text.substring(0, 50));
      this.analyzeSelection();
    }
  }

     ngOnDestroy() {
     this.removeEventListeners();
   }

   private setupEventListeners() {
     this.documentClickListener = this.onDocumentClick.bind(this);
     document.addEventListener('click', this.documentClickListener);
   }

   private removeEventListeners() {
     if (this.documentClickListener) {
       document.removeEventListener('click', this.documentClickListener);
     }
   }

   private onDocumentClick(event: Event) {
     if (!this.visible) return;
     
     const target = event.target as HTMLElement;
     const dialogElement = target.closest('.p-dialog');
     
     // If click is outside the dialog, close it
     if (!dialogElement) {
       this.closeDialog();
     }
   }

  async analyzeSelection() {
    if (!this.selection) return;

    this.isAnalyzing = true;
    this.analysisResult = null;
    this.selectedCategory = null;

    console.log('🔍 Analyzing text:', this.selection.text.substring(0, 100));

    try {
      this.analysisResult = await this.textAnalysisService.analyzeText(this.selection.text);
      
      console.log('✅ Analysis completed:', {
        categories: this.analysisResult.categories.length,
        keywords: this.analysisResult.keywords.length,
        language: this.analysisResult.language,
        sentiment: this.analysisResult.sentiment
      });
      
      // Auto-select the first category if available
      if (this.analysisResult.categories.length > 0) {
        this.selectedCategory = this.analysisResult.categories[0];
        console.log('📂 Auto-selected category:', this.selectedCategory.label);
      }
    } catch (error) {
      console.error('❌ Error analyzing text:', error);
      // Set a fallback result
      this.analysisResult = {
        categories: [this.textAnalysisService.getCategoryById('general')!],
        keywords: [],
        wordCount: this.getWordCount(),
        charCount: this.selection.text.length
      };
      this.selectedCategory = this.analysisResult.categories[0];
    } finally {
      this.isAnalyzing = false;
      console.log('🏁 Analysis finished, isAnalyzing:', this.isAnalyzing);
    }
  }

  selectCategory(category: ActionCategory) {
    this.selectedCategory = category;
  }

  getAvailableActions(): DialogAction[] {
    if (!this.selectedCategory) {
      return this.availableActions.filter(action => action.category.id === 'general');
    }
    
    return this.availableActions.filter(action => 
      action.category.id === this.selectedCategory!.id || action.category.id === 'general'
    );
  }

  async executeAction(action: DialogAction) {
    if (!this.selection || this.isExecutingAction) return;

    this.isExecutingAction = true;
    action.loading = true;

    let success = true;
    let error: string | undefined;

    try {
      await action.action(this.selection.text, this.selection, this.analysisResult || undefined);
      console.log(`✅ Dialog action "${action.label}" executed successfully`);
    } catch (err) {
      success = false;
      error = (err as Error).message;
      console.error(`❌ Dialog action "${action.label}" failed:`, err);
    } finally {
      action.loading = false;
      this.isExecutingAction = false;
      
      this.actionExecuted.emit({
        action,
        selection: this.selection,
        timestamp: new Date(),
        success,
        error,
        category: this.selectedCategory
      });

      if (success) {
        // Close dialog after successful action (except for copy)
        if (action.id !== 'copy') {
          setTimeout(() => this.closeDialog(), 1000);
        }
      }
    }
  }

  async copyText() {
    if (!this.selection) return;
    
    const copyAction = this.availableActions.find(a => a.id === 'copy');
    if (copyAction) {
      await this.executeAction(copyAction);
    }
  }

  private async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      console.log('✅ Text copied to clipboard via dialog');
    } catch (err) {
      console.error('❌ Failed to copy with Clipboard API:', err);
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (!successful) {
        throw new Error('Failed to copy text');
      }
      console.log('✅ Text copied using fallback method');
    }
  }

  private async searchGoogle(text: string): Promise<void> {
    const query = encodeURIComponent(text.trim());
    const url = `https://www.google.com/search?q=${query}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private async translateText(text: string): Promise<void> {
    const query = encodeURIComponent(text.trim());
    const url = `https://translate.google.com/?text=${query}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private async searchAcademic(text: string): Promise<void> {
    const query = encodeURIComponent(text.trim());
    const url = `https://scholar.google.com/scholar?q=${query}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private async searchDefinition(text: string): Promise<void> {
    const query = encodeURIComponent(`définition ${text.trim()}`);
    const url = `https://www.google.com/search?q=${query}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  getWordCount(): number {
    if (!this.selection) return 0;
    return this.selection.text.trim().split(/\s+/).length;
  }

  getLanguageLabel(language?: string): string {
    switch (language) {
      case 'fr': return 'Français';
      case 'en': return 'Anglais';
      default: return 'Non détecté';
    }
  }

  getSentimentLabel(sentiment: string): string {
    switch (sentiment) {
      case 'positive': return 'Positif';
      case 'negative': return 'Négatif';
      case 'neutral': return 'Neutre';
      default: return 'Non analysé';
    }
  }

  getSentimentIcon(sentiment: string): string {
    switch (sentiment) {
      case 'positive': return 'pi pi-thumbs-up';
      case 'negative': return 'pi pi-thumbs-down';
      case 'neutral': return 'pi pi-minus';
      default: return 'pi pi-question';
    }
  }

  getSentimentColor(sentiment: string): string {
    switch (sentiment) {
      case 'positive': return '#22c55e';
      case 'negative': return '#ef4444';
      case 'neutral': return '#6b7280';
      default: return '#6b7280';
    }
  }

     onDialogShow() {
     console.log('🎯 Dialog shown');
   }

   onDialogClick(event: Event) {
     // Prevent clicks inside the dialog from closing it
     event.stopPropagation();
   }

   onDialogHide() {
     this.visibleChange.emit(false);
     this.dialogClosed.emit();
     // Reset analysis when dialog is closed
     this.analysisResult = null;
     this.selectedCategory = null;
     this.isAnalyzing = false;
   }

  closeDialog() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.dialogClosed.emit();
    // Reset analysis when dialog is closed
    this.analysisResult = null;
    this.selectedCategory = null;
    this.isAnalyzing = false;
  }
}