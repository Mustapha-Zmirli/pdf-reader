import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as pdfjsLib from 'pdfjs-dist';
import { PdfViewerOptions, TextSelection, PopupAction, TextSelectionEvent, ActionExecutedEvent } from './pdf-reader.types';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

interface TextChar {
  char: string;
  normalizedX: number;
  normalizedY: number;
  normalizedWidth: number;
  normalizedHeight: number;
  displayX: number;
  displayY: number;
  displayWidth: number;
  displayHeight: number;
  fontSize: number;
  fontName: string;
  lineIndex: number;
  charIndex: number;
}

interface TextLine {
  chars: TextChar[];
  y: number;
  height: number;
  text: string;
}

interface SelectionRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-pdf-reader',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pdf-reader-container" [ngClass]="{'fullscreen': isFullscreen}">
      <!-- Toolbar -->
      <div class="pdf-toolbar">
        <div class="toolbar-group">
          <!-- File Upload Button -->
          <button 
            class="toolbar-btn upload-btn"
            (click)="triggerFileUpload()"
            title="Charger un PDF local">
            📁
            <input 
              #fileInput 
              type="file" 
              accept=".pdf,application/pdf"
              (change)="onFileSelected($event)"
              style="display: none;">
          </button>

          <button 
            (click)="previousPage()" 
            [disabled]="currentPage <= 1"
            class="toolbar-btn">
            ← Précédent
          </button>
          
          <span class="page-info">
            <input 
              type="number" 
              [value]="currentPage"
              (input)="onPageInputChange($event)"
              (keydown)="onPageInputKeydown($event)"
              (blur)="onPageInputBlur($event)"
              [min]="1" 
              [max]="totalPages"
              class="page-input"
              #pageInput>
            / {{ totalPages }}
          </span>
          
          <button 
            (click)="nextPage()" 
            [disabled]="currentPage >= totalPages"
            class="toolbar-btn">
            Suivant →
          </button>
        </div>

        <div class="toolbar-group">
          <button 
            (click)="zoomOut()" 
            [disabled]="currentZoom <= 0.25"
            class="toolbar-btn">
            Zoom -
          </button>
          
          <span class="zoom-info">{{ (currentZoom * 100).toFixed(0) }}%</span>
          
          <button 
            (click)="zoomIn()" 
            [disabled]="currentZoom >= 4.0"
            class="toolbar-btn">
            Zoom +
          </button>
        </div>

        <div class="toolbar-group">
          <button 
            (click)="toggleFullscreen()" 
            class="toolbar-btn">
            {{ isFullscreen ? 'Quitter plein écran' : 'Plein écran' }}
          </button>
        </div>

        <div class="toolbar-group">
          <label class="toolbar-checkbox">
            <input 
              type="checkbox" 
              [(ngModel)]="enableTextSelection"
              (change)="onTextSelectionToggle()">
            <span>Sélection de texte</span>
          </label>
        </div>

        <!-- Current file info -->
        <div class="toolbar-group" *ngIf="currentFileName">
          <span class="file-info" [title]="currentFileName">
            📄 {{ getShortFileName(currentFileName) }}
          </span>
        </div>
      </div>

      <!-- PDF Viewer -->
      <div class="pdf-viewer-wrapper" #viewerWrapper>
        <div class="pdf-loading" *ngIf="isLoading">
          <div class="loading-spinner"></div>
          <p>{{ loadingMessage }}</p>
        </div>
        
        <div class="pdf-error" *ngIf="error">
          <p>Erreur: {{ error }}</p>
          <button (click)="retryLoad()" class="retry-btn">Réessayer</button>
        </div>

        <!-- Welcome message when no PDF is loaded -->
       <div class="pdf-welcome" *ngIf="!isLoading && !error && !pdfDocument">
  <div class="welcome-content">
    <div class="welcome-icon">📄</div>
    <h3>Lecteur PDF Pro</h3>
    <p>Chargez un fichier PDF pour commencer la lecture</p>
    <button class="welcome-upload-btn" (click)="triggerFileUpload()">
      📁 Sélectionner un fichier PDF
    </button>
    

  </div>
</div>

        <div class="pdf-canvas-container" *ngIf="!isLoading && !error && pdfDocument">
          <canvas 
            #pdfCanvas 
            class="pdf-canvas">
          </canvas>
 <div 
    #textLayer 
    class="text-layer"
    *ngIf="enableTextSelection"
    (mousedown)="onSelectionStart($event)"
    (mousemove)="onSelectionMove($event)"
    (mouseup)="onSelectionEnd($event)"
    (click)="onTextLayerClick($event)"
    (dblclick)="onTextLayerDoubleClick($event)"
    (selectstart)="preventSelection($event)"
    (dragstart)="preventSelection($event)">
  </div>

          <!-- Selection Overlay -->
          <div class="selection-overlay" #selectionOverlay *ngIf="enableTextSelection">
            <div 
              *ngFor="let highlight of selectionHighlights"
              class="selection-highlight"
              [style.left.px]="highlight.left"
              [style.top.px]="highlight.top"
              [style.width.px]="highlight.width"
              [style.height.px]="highlight.height">
            </div>
          </div>
        </div>
      </div>

      <!-- Selection Popup -->
      <div 
        class="selection-popup" 
        *ngIf="showPopup && currentSelection"
        [style.left.px]="popupPosition.x"
        [style.top.px]="popupPosition.y"
        #popup>
        
        <div class="popup-header">
          <span class="selected-text-preview">
            "{{ getPreviewText(currentSelection.text) }}"
          </span>
          <button class="popup-close" (click)="closePopup()" title="Fermer">×</button>
        </div>

        <div class="popup-content">
          <div class="popup-info">
            <small>Page {{ currentSelection.pageNumber }} • {{ currentSelection.text.length }} caractères • {{ getWordCount(currentSelection.text) }} mots</small>
          </div>
          
          <div class="popup-actions">
            <button 
              *ngFor="let action of defaultActions" 
              class="popup-action-btn"
              [disabled]="action.disabled || isActionLoading"
              (click)="executeAction(action)"
              [class.loading]="loadingActions.has(action.id)"
              [title]="action.label">
              
              <span class="action-icon" *ngIf="action.icon">{{ action.icon }}</span>
              <span class="action-label">{{ action.label }}</span>
              
              <div class="action-spinner" *ngIf="loadingActions.has(action.id)">
                <div class="spinner"></div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pdf-reader-container {
      display: flex;
      flex-direction: column;
      width: 900px;
      height: 800px;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }

    .pdf-reader-container.fullscreen {
      width: 100vw;
      height: 100vh;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1000;
      border: none;
      border-radius: 0;
      box-shadow: none;
    }

    .pdf-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #e5e7eb;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      flex-wrap: wrap;
      gap: 8px;
    }

    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .toolbar-btn {
      padding: 8px 16px;
      border: 1px solid #d1d5db;
      background: #ffffff;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      transition: all 0.2s ease;
      position: relative;
    }

    .toolbar-btn:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .toolbar-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .upload-btn {
      font-size: 18px;
      padding: 8px 12px;
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .upload-btn:hover:not(:disabled) {
      background: #2563eb;
      border-color: #2563eb;
      color: white;
    }

    .toolbar-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #374151;
      cursor: pointer;
      user-select: none;
    }

    .toolbar-checkbox input[type="checkbox"] {
      margin: 0;
      accent-color: #3b82f6;
    }

    .file-info {
      font-size: 13px;
      color: #6b7280;
      background: #f3f4f6;
      padding: 6px 12px;
      border-radius: 6px;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .page-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #4b5563;
      font-weight: 500;
    }

    .page-input {
      width: 60px;
      padding: 6px 8px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      text-align: center;
      font-size: 14px;
      background: #ffffff;
    }

    .page-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .zoom-info {
      font-size: 14px;
      color: #4b5563;
      min-width: 60px;
      text-align: center;
      font-weight: 500;
    }

    .pdf-viewer-wrapper {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 24px;
      overflow: auto;
      background: #f1f5f9;
    }

    .pdf-canvas-container {
      position: relative;
      max-width: 100%;
      max-height: 100%;
    }

    .pdf-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      color: #4b5563;
    }

    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #f3f4f6;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .pdf-welcome {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      width: 100%;
    }

    .welcome-content {
      text-align: center;
      color: #6b7280;
      max-width: 400px;
      margin-bottom: 120px;
    }

    .welcome-icon {
      font-size: 64px;
      margin-bottom: 20px;
      opacity: 0.6;
    }

    .welcome-content h3 {
      margin: 0 0 12px 0;
      color: #374151;
      font-size: 24px;
      font-weight: 600;
    }

    .welcome-content p {
      margin: 0 0 32px 0;
      font-size: 16px;
      line-height: 1.6;
    }

    .welcome-upload-btn {
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .welcome-upload-btn:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .welcome-tips {
  margin-top: 32px;
  text-align: left;
  background: rgba(59, 130, 246, 0.05);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.welcome-tips p {
  margin: 0 0 12px 0;
  font-weight: 600;
  color: #3b82f6;
  text-align: center;
}

.welcome-tips ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.welcome-tips li {
  padding: 6px 0;
  font-size: 14px;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 8px;
}

    .pdf-error {
      text-align: center;
      color: #dc2626;
      font-size: 16px;
    }

    .retry-btn {
      margin-top: 12px;
      padding: 8px 20px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s ease;
    }

    .retry-btn:hover {
      background: #2563eb;
    }

    .pdf-canvas {
      box-shadow: 0 6px 16px rgba(0,0,0,0.12);
      background: white;
      display: block;
      image-rendering: optimizeQuality;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }

    .text-layer {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      opacity: 0;
      cursor: text;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }

    .selection-overlay {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 10;
    }

    .selection-highlight {
      position: absolute;
      background: rgba(59, 130, 246, 0.3);
      border-radius: 2px;
      pointer-events: none;
    }

    .selection-popup {
      position: absolute;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      z-index: 1000;
      min-width: 360px;
      max-width: 480px;
      animation: popupFadeIn 0.2s ease-out;
    }

    @keyframes popupFadeIn {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      background: #f8f9fa;
      border-radius: 12px 12px 0 0;
    }

    .selected-text-preview {
      flex: 1;
      font-size: 14px;
      color: #1f2937;
      font-style: italic;
      line-height: 1.5;
      margin-right: 12px;
      word-break: break-word;
    }

    .popup-close {
      background: none;
      border: none;
      font-size: 20px;
      color: #6b7280;
      cursor: pointer;
      padding: 4px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .popup-close:hover {
      color: #1f2937;
      background: #e5e7eb;
    }

    .popup-content {
      padding: 16px;
    }

    .popup-info {
      margin-bottom: 12px;
    }

    .popup-info small {
      color: #6b7280;
      font-size: 13px;
    }

    .popup-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .popup-action-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border: 1px solid #d1d5db;
      background: #ffffff;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
      position: relative;
      min-height: 44px;
    }

    .popup-action-btn:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #3b82f6;
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }

    .popup-action-btn:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .popup-action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .popup-action-btn.loading {
      color: transparent;
      cursor: wait;
    }

    .action-icon {
      font-size: 18px;
      min-width: 18px;
    }

    .action-label {
      flex: 1;
      text-align: left;
      font-weight: 500;
    }

    .action-spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 3px solid #f3f4f6;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .action-feedback {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      font-size: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
    }

    .action-feedback.success {
      background: #22c55e;
    }

    .action-feedback.error {
      background: #ef4444;
    }
  `]
})
export class PdfReaderComponent implements OnInit, OnDestroy {
  @Input() pdfUrl!: string;
  @Input() options: PdfViewerOptions = {};

  @Output() textSelected = new EventEmitter<TextSelectionEvent>();
  @Output() actionExecuted = new EventEmitter<ActionExecutedEvent>();

  @ViewChild('fileInput', { static: true }) fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('pdfCanvas', { static: false }) canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pageInput', { static: false }) pageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('textLayer', { static: false }) textLayer!: ElementRef<HTMLDivElement>;
  @ViewChild('viewerWrapper', { static: true }) viewerWrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('popup', { static: false }) popup!: ElementRef<HTMLDivElement>;
  @ViewChild('selectionOverlay', { static: false }) selectionOverlay!: ElementRef<HTMLDivElement>;

  // State
  isLoading = false;
  error: string | null = null;
  currentPage = 1;
  totalPages = 0;
  currentZoom = 1.0;
  enableTextSelection = true;
  isFullscreen = false;
  loadingMessage = 'Chargement du PDF...';
  currentFileName: string | null = null;

  // File handling
  private currentPdfData: ArrayBuffer | null = null;
  private currentPdfUrl: string | null = null;

  // Render management - Key additions for fixing the canvas error
  private currentRenderTask: any = null;
  private isRendering = false;
  private pendingRender = false;
  private renderQueue: (() => void)[] = [];

  // Text selection - zoom independent coordinates
  private normalizedTextChars: TextChar[] = [];
  private displayTextChars: TextChar[] = [];
  private textLines: TextLine[] = [];
  
  private isSelecting = false;
  private selectionStartChar: TextChar | null = null;
  private selectionEndChar: TextChar | null = null;
  selectionHighlights: SelectionRect[] = [];

  // Professional selection management
  hasActiveSelection = false;
  currentSelection: TextSelection | null = null;
  showPopup = false;
  popupPosition = { x: 0, y: 0 };
  loadingActions = new Set<string>();
  isActionLoading = false;

  // PDF.js objects
  pdfDocument: any = null;

  // Event listeners
  private documentClickListener?: (event: Event) => void;

  defaultActions: PopupAction[] = [
    {
      id: 'copy',
      label: 'Copier le texte',
      icon: '📋',
      action: async (text: string) => {
        try {
          await navigator.clipboard.writeText(text);
          console.log('✅ Text copied to clipboard successfully');
          this.showTemporaryFeedback('copy', 'success');
        } catch (err) {
          console.error('❌ Failed to copy with Clipboard API:', err);
          try {
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
            
            if (successful) {
              console.log('✅ Text copied using fallback method');
              this.showTemporaryFeedback('copy', 'success');
            } else {
              throw new Error('Fallback copy failed');
            }
          } catch (fallbackErr) {
            console.error('❌ All copy methods failed:', fallbackErr);
            this.showTemporaryFeedback('copy', 'error');
            throw new Error('Unable to copy text to clipboard');
          }
        }
      }
    },
    {
      id: 'search',
      label: 'Rechercher sur Google',
      icon: '🔍',
      action: async (text: string) => {
        try {
          const query = encodeURIComponent(text.trim());
          const url = `https://www.google.com/search?q=${query}`;
          window.open(url, '_blank', 'noopener,noreferrer');
          console.log('✅ Opened Google search for:', text.substring(0, 50) + '...');
          this.showTemporaryFeedback('search', 'success');
        } catch (err) {
          console.error('❌ Failed to open search:', err);
          this.showTemporaryFeedback('search', 'error');
          throw err;
        }
      }
    },
    {
      id: 'translate',
      label: 'Traduire',
      icon: '🌐',
      action: async (text: string) => {
        try {
          const query = encodeURIComponent(text.trim());
          const url = `https://translate.google.com/?text=${query}`;
          window.open(url, '_blank', 'noopener,noreferrer');
          console.log('✅ Opened Google Translate for:', text.substring(0, 50) + '...');
          this.showTemporaryFeedback('translate', 'success');
        } catch (err) {
          console.error('❌ Failed to open translator:', err);
          this.showTemporaryFeedback('translate', 'error');
          throw err;
        }
      }
    }
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.initializeOptions();
    this.setupEventListeners();
    
  
  }

  ngOnDestroy() {
    this.cancelCurrentRender();
    this.removeEventListeners();
    if (this.isFullscreen) {
      this.exitFullscreen();
    }
    // Clean up object URLs to prevent memory leaks
    this.cleanupObjectUrls();
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    // Cancel any pending renders and schedule a new one
    this.cancelCurrentRender();
    setTimeout(() => {
      if (this.pdfDocument && !this.isLoading) {
        this.safeRenderPage();
      }
    }, 150);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft' && this.currentPage > 1) {
      event.preventDefault();
      this.previousPage();
    } else if (event.key === 'ArrowRight' && this.currentPage < this.totalPages) {
      event.preventDefault();
      this.nextPage();
    } else if ((event.ctrlKey || event.metaKey) && (event.key === '+' || event.key === '=')) {
      event.preventDefault();
      this.zoomIn();
    } else if ((event.ctrlKey || event.metaKey) && event.key === '-') {
      event.preventDefault();
      this.zoomOut();
    } else if (event.key === 'Escape' && this.isFullscreen) {
      event.preventDefault();
      this.toggleFullscreen();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'c' && this.currentSelection) {
      event.preventDefault();
      this.copySelectedText();
    }
  }

  private initializeOptions() {
    this.enableTextSelection = this.options.enableTextSelection !== false;
  }

  private setupEventListeners() {
    this.documentClickListener = this.onDocumentClick.bind(this);
    document.addEventListener('click', this.documentClickListener);
    this.setupKeyboardListeners();
  }

  private setupCanvasClickListener() {
    if (this.canvas?.nativeElement) {
      this.canvas.nativeElement.addEventListener('click', (event) => {
        if (this.hasActiveSelection && !this.isSelecting) {
          event.stopPropagation();
          this.clearSelectionCompletely();
          console.log('❌ Selection cleared - clicked on canvas');
        }
      });
    }
  }

  // File Upload Methods
  triggerFileUpload() {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      this.error = 'Veuillez sélectionner un fichier PDF valide.';
      this.cdr.detectChanges();
      return;
    }

    console.log('📁 Loading local PDF file:', file.name, 'Size:', file.size, 'bytes');
    
    this.currentFileName = file.name;
    this.loadingMessage = `Chargement de ${file.name}...`;
    
    try {
      // Read file as ArrayBuffer for consistent processing
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      await this.loadPdfFromData(arrayBuffer);
      
      // Clear the input so the same file can be selected again
      input.value = '';
    } catch (err) {
      console.error('❌ Failed to read uploaded file:', err);
      this.error = 'Impossible de lire le fichier PDF sélectionné.';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsArrayBuffer(file);
    });
  }

  private cleanupObjectUrls() {
    if (this.currentPdfUrl && this.currentPdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.currentPdfUrl);
      this.currentPdfUrl = null;
    }
  }

  // Enhanced PDF Loading Methods
  async loadPdfFromUrl(url: string) {
    console.log('🌐 Loading PDF from URL:', url);
    this.currentFileName = this.extractFileNameFromUrl(url);
    this.currentPdfUrl = url;
    this.currentPdfData = null;
    await this.loadPdf();
  }

  async loadPdfFromData(arrayBuffer: ArrayBuffer) {
    console.log('📄 Loading PDF from local data, size:', arrayBuffer.byteLength, 'bytes');
    this.cleanupObjectUrls();
    this.currentPdfData = arrayBuffer;
    this.currentPdfUrl = null;
    await this.loadPdf();
  }

  private extractFileNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop() || 'document.pdf';
      return fileName.endsWith('.pdf') ? fileName : fileName + '.pdf';
    } catch {
      return 'document.pdf';
    }
  }

  getShortFileName(fileName: string): string {
    const maxLength = 25;
    if (fileName.length <= maxLength) return fileName;
    
    const extension = fileName.split('.').pop() || '';
    const nameWithoutExt = fileName.substring(0, fileName.length - extension.length - 1);
    const availableLength = maxLength - extension.length - 4; // 4 for "..." and "."
    
    return nameWithoutExt.substring(0, availableLength) + '...' + '.' + extension;
  }

  async loadPdf() {
    this.cancelCurrentRender();
    this.isLoading = true;
    this.error = null;
    this.closePopup();
    this.clearSelectionCompletely();
    this.cdr.detectChanges();

    try {
      let loadingTask;
      
      if (this.currentPdfData) {
        // Load from ArrayBuffer (uploaded file)
        console.log('📄 Loading PDF from ArrayBuffer data');
        loadingTask = pdfjsLib.getDocument({
          data: this.currentPdfData,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
          enableXfa: false,
          verbosity: 0,
          useWorkerFetch: false,
          disableAutoFetch: false,
          disableStream: false,
          // Enhanced options for better local file handling
          standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
          isEvalSupported: false,
          isOffscreenCanvasSupported: false
        });
      } else if (this.currentPdfUrl || this.pdfUrl) {
        // Load from URL
        const url = this.currentPdfUrl || this.pdfUrl;
        console.log('🌐 Loading PDF from URL:', url);
        loadingTask = pdfjsLib.getDocument({
          url: url,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
          enableXfa: false,
          verbosity: 0,
          useWorkerFetch: false,
          disableAutoFetch: false,
          disableStream: false
        });
      } else {
        throw new Error('No PDF source available');
      }
      
      this.pdfDocument = await loadingTask.promise;
      this.totalPages = this.pdfDocument.numPages;
      this.currentPage = 1;
      
      console.log('✅ PDF loaded successfully:', {
        pages: this.totalPages,
        fileName: this.currentFileName,
        source: this.currentPdfData ? 'local file' : 'URL'
      });
      
      this.isLoading = false;
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.safeRenderPage();
      }, 50);
      
    } catch (err) {
      console.error('❌ PDF loading failed:', err);
      this.error = 'Échec du chargement du PDF: ' + (err as Error).message;
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async retryLoad() {
    if (this.currentPdfData) {
      await this.loadPdfFromData(this.currentPdfData);
    } else if (this.currentPdfUrl) {
      await this.loadPdfFromUrl(this.currentPdfUrl);
    } else if (this.pdfUrl) {
      await this.loadPdfFromUrl(this.pdfUrl);
    }
  }

  // Key method for fixing canvas render conflicts
  private cancelCurrentRender() {
    if (this.currentRenderTask) {
      try {
        this.currentRenderTask.cancel();
        console.log('🚫 Cancelled previous render task');
      } catch (err) {
        console.warn('Failed to cancel render task:', err);
      }
      this.currentRenderTask = null;
    }
    this.isRendering = false;
    this.pendingRender = false;
  }

  // Safe render method that prevents overlapping renders
  private async safeRenderPage() {
    if (this.isRendering) {
      this.pendingRender = true;
      console.log('⏳ Render already in progress, queuing...');
      return;
    }

    this.cancelCurrentRender();
    await this.renderPage();

    // Handle any pending render requests
    if (this.pendingRender) {
      this.pendingRender = false;
      setTimeout(() => this.safeRenderPage(), 50);
    }
  }

  private async renderPage() {
    if (!this.pdfDocument || !this.canvas?.nativeElement) {
      console.log('Cannot render: missing document or canvas');
      return;
    }

    if (this.isRendering) {
      console.log('Render already in progress, skipping...');
      return;
    }

    this.isRendering = true;

    try {
      const page = await this.pdfDocument.getPage(this.currentPage);
      
      const devicePixelRatio = window.devicePixelRatio || 1;
      const baseScale = this.currentZoom;
      const renderScale = baseScale * devicePixelRatio;
      
      const viewport = page.getViewport({ scale: renderScale });
      
      const canvas = this.canvas.nativeElement;
      const context = canvas.getContext('2d');
      
      if (!context) {
        console.error('Cannot get canvas context');
        this.isRendering = false;
        return;
      }
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      canvas.style.width = Math.floor(viewport.width / devicePixelRatio) + 'px';
      canvas.style.height = Math.floor(viewport.height / devicePixelRatio) + 'px';
      
      console.log(`Rendering page ${this.currentPage} at zoom ${this.currentZoom} (render scale: ${renderScale}, DPR: ${devicePixelRatio})`);
      
      context.clearRect(0, 0, canvas.width, canvas.height);
      this.optimizeCanvasRendering(canvas, context);
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        enableWebGL: true,
        renderInteractiveForms: false
      };

      // Store the render task so we can cancel it if needed
      this.currentRenderTask = page.render(renderContext);
      await this.currentRenderTask.promise;
      
      // Clear the render task reference on successful completion
      this.currentRenderTask = null;
      
      if (this.enableTextSelection) {
        const textViewport = page.getViewport({ scale: baseScale });
        await this.renderTextLayer(page, textViewport);
      }
      
      console.log('✅ Page rendered successfully with enhanced quality');
      this.setupCanvasClickListener();
      
    } catch (err: any) {
      // Handle cancellation gracefully
      if (err.name === 'RenderingCancelledException' || err.message?.includes('cancel')) {
        console.log('🚫 Render was cancelled (this is normal)');
        return;
      }
      
      console.error('❌ Render error:', err);
      this.error = 'Failed to render page: ' + err.message;
      this.cdr.detectChanges();
    } finally {
      this.isRendering = false;
      this.currentRenderTask = null;
    }
  }

  private optimizeCanvasRendering(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    (context as any).textRenderingOptimization = 'optimizeQuality';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.textBaseline = 'alphabetic';
    context.imageSmoothingEnabled = true;
    if ((context as any).imageSmoothingQuality) {
      (context as any).imageSmoothingQuality = 'high';
    }
  }

  private async renderTextLayer(page: any, viewport: any) {
    if (!this.textLayer?.nativeElement) return;

    try {
      const textContent = await page.getTextContent();
      const textLayerDiv = this.textLayer.nativeElement;
      
      textLayerDiv.innerHTML = '';
      this.clearSelection();
      
      textLayerDiv.style.width = viewport.width + 'px';
      textLayerDiv.style.height = viewport.height + 'px';

      // Always rebuild text data for new pages or when switching between files
      if (this.normalizedTextChars.length === 0 || this.hasPageChanged()) {
        await this.buildNormalizedTextData(textContent, page);
      }

      this.updateDisplayCoordinates();

      console.log(`✅ Text layer rendered with ${this.displayTextChars.length} characters at zoom ${this.currentZoom}`);
      
    } catch (err) {
      console.warn('⚠️ Error rendering text layer:', err);
    }
  }

  private hasPageChanged(): boolean {
    // For simplicity, we'll rebuild text data for each render to ensure consistency
    // This ensures proper text selection for both local and remote PDFs
    return true;
  }

  private async buildNormalizedTextData(textContent: any, page: any) {
    this.normalizedTextChars = [];
    this.textLines = [];
    
    const normalizedViewport = page.getViewport({ scale: 1.0 });
    
    const lines = new Map<number, TextChar[]>();
    let charIndex = 0;

    textContent.items.forEach((item: any) => {
      const transform = pdfjsLib.Util.transform(normalizedViewport.transform, item.transform);
      const fontSize = Math.sqrt(transform[2] * transform[2] + transform[3] * transform[3]);
      
      const lineY = Math.round(transform[5] / 2) * 2;
      
      if (!lines.has(lineY)) {
        lines.set(lineY, []);
      }

      const chars = item.str.split('');
      let currentX = transform[4];
      const charWidth = item.width / chars.length;

      chars.forEach((char: string) => {
        const normalizedChar: TextChar = {
          char,
          normalizedX: currentX,
          normalizedY: transform[5] - fontSize,
          normalizedWidth: charWidth,
          normalizedHeight: fontSize,
          displayX: 0,
          displayY: 0,
          displayWidth: 0,
          displayHeight: 0,
          fontSize,
          fontName: item.fontName || 'sans-serif',
          lineIndex: 0,
          charIndex: charIndex++
        };

        lines.get(lineY)!.push(normalizedChar);
        this.normalizedTextChars.push(normalizedChar);
        currentX += charWidth;
      });
    });

    const sortedLines = Array.from(lines.entries())
      .sort(([a], [b]) => b - a)
      .map(([y, chars], lineIndex) => {
        chars.sort((a, b) => a.normalizedX - b.normalizedX);
        chars.forEach(char => char.lineIndex = lineIndex);
        
        return {
          chars,
          y,
          height: Math.max(...chars.map(c => c.normalizedHeight)),
          text: chars.map(c => c.char).join('')
        } as TextLine;
      });

    this.textLines = sortedLines;
    console.log(`📝 Built normalized text data: ${this.normalizedTextChars.length} characters, ${this.textLines.length} lines`);
  }

  private updateDisplayCoordinates() {
    this.displayTextChars = this.normalizedTextChars.map(normalizedChar => ({
      ...normalizedChar,
      displayX: normalizedChar.normalizedX * this.currentZoom,
      displayY: normalizedChar.normalizedY * this.currentZoom,
      displayWidth: normalizedChar.normalizedWidth * this.currentZoom,
      displayHeight: normalizedChar.normalizedHeight * this.currentZoom
    }));
  }

  onSelectionStart(event: MouseEvent) {
    if (!this.enableTextSelection) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    this.closePopupFast();
    
    this.isSelecting = true;
    
    const point = this.getRelativePoint(event);
    this.selectionStartChar = this.findCharAtPoint(point);
    this.selectionEndChar = this.selectionStartChar;
    
    if (this.selectionStartChar) {
      console.log('🎯 Selection started at char:', this.selectionStartChar.char, 'zoom:', this.currentZoom);
    }
  }

  onSelectionMove(event: MouseEvent) {
    if (!this.isSelecting || !this.enableTextSelection) return;
    
    event.preventDefault();
    
    const point = this.getRelativePoint(event);
    const newEndChar = this.findCharAtPoint(point);
    
    if (newEndChar && newEndChar !== this.selectionEndChar) {
      this.selectionEndChar = newEndChar;
      this.updateHighlight();
    }
  }

  onSelectionEnd(event: MouseEvent) {
    if (!this.isSelecting || !this.enableTextSelection) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isSelecting = false;
    
    if (this.selectionStartChar && this.selectionEndChar) {
      this.createTextSelectionImmediate();
    } else {
      this.clearSelection();
    }
  }

  private getRelativePoint(event: MouseEvent): {x: number, y: number} {
    const rect = this.textLayer.nativeElement.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  private findCharAtPoint(point: {x: number, y: number}): TextChar | null {
    let bestMatch: TextChar | null = null;
    let minDistance = Infinity;
    const CLICK_TOLERANCE = 5;
    
    for (const char of this.displayTextChars) {
      if (point.x >= char.displayX - CLICK_TOLERANCE && 
          point.x <= char.displayX + char.displayWidth + CLICK_TOLERANCE &&
          point.y >= char.displayY - CLICK_TOLERANCE && 
          point.y <= char.displayY + char.displayHeight + CLICK_TOLERANCE) {
        
        const charCenterX = char.displayX + char.displayWidth / 2;
        const charCenterY = char.displayY + char.displayHeight / 2;
        const distance = Math.sqrt(
          Math.pow(point.x - charCenterX, 2) + 
          Math.pow(point.y - charCenterY, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = char;
        }
      }
    }
    
    return minDistance <= CLICK_TOLERANCE * Math.sqrt(2) ? bestMatch : null;
  }

  onTextLayerClick(event: MouseEvent) {
    if (!this.hasActiveSelection || this.showPopup || this.isSelecting) {
      return;
    }
    
    event.preventDefault();
    event.stopPropagation();
    
    const point = this.getRelativePoint(event);
    const clickedChar = this.findCharAtPoint(point);
    
    if (!clickedChar) {
      console.log('❌ No character found at click point - ignoring click');
      return;
    }
    
    if (this.isCharInCurrentSelection(clickedChar) && 
        this.currentSelection && this.isValidForPopup(this.currentSelection.text)) {
      this.showPopup = true;
      this.cdr.detectChanges();
      console.log('🎯 Popup opened for selection');
    } else if (this.isCharInCurrentSelection(clickedChar) && this.currentSelection) {
      console.log('📝 Selection too short for popup (use Ctrl+C to copy):', this.currentSelection.text);
    }
  }

  private setupKeyboardListeners() {
    document.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  private removeKeyboardListeners() {
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
  }

  private onKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'c' && this.currentSelection) {
      event.preventDefault();
      this.copySelectedText();
    }
  }

  private async copySelectedText() {
    if (!this.currentSelection) return;
    
    try {
      await navigator.clipboard.writeText(this.currentSelection.text);
      console.log('✅ Text copied via Ctrl+C:', this.currentSelection.text.substring(0, 50) + '...');
    } catch (err) {
      console.error('❌ Failed to copy with Ctrl+C:', err);
      try {
        const textArea = document.createElement('textarea');
        textArea.value = this.currentSelection.text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log('✅ Text copied via Ctrl+C (fallback)');
      } catch (fallbackErr) {
        console.error('❌ All copy methods failed for Ctrl+C:', fallbackErr);
      }
    }
  }

  private isCharInCurrentSelection(char: TextChar): boolean {
    if (!this.selectionStartChar || !this.selectionEndChar) return false;
    
    const startIndex = Math.min(this.selectionStartChar.charIndex, this.selectionEndChar.charIndex);
    const endIndex = Math.max(this.selectionStartChar.charIndex, this.selectionEndChar.charIndex);
    
    return char.charIndex >= startIndex && char.charIndex <= endIndex;
  }

  private updateHighlight() {
    if (!this.selectionStartChar || !this.selectionEndChar) {
      this.selectionHighlights = [];
      return;
    }
    
    const startIndex = Math.min(this.selectionStartChar.charIndex, this.selectionEndChar.charIndex);
    const endIndex = Math.max(this.selectionStartChar.charIndex, this.selectionEndChar.charIndex);
    
    this.selectionHighlights = this.createHighlights(startIndex, endIndex);
    this.cdr.detectChanges();
  }

  private createHighlights(startIndex: number, endIndex: number): SelectionRect[] {
    const highlights: SelectionRect[] = [];
    const selectedChars = this.displayTextChars.slice(startIndex, endIndex + 1);
    
    if (selectedChars.length === 0) return highlights;
    
    const lineGroups = new Map<number, TextChar[]>();
    selectedChars.forEach(char => {
      if (!lineGroups.has(char.lineIndex)) {
        lineGroups.set(char.lineIndex, []);
      }
      lineGroups.get(char.lineIndex)!.push(char);
    });
    
    lineGroups.forEach(chars => {
      if (chars.length === 0) return;
      
      chars.sort((a, b) => a.displayX - b.displayX);
      
      const firstChar = chars[0];
      const lastChar = chars[chars.length - 1];
      
      highlights.push({
        left: firstChar.displayX,
        top: firstChar.displayY,
        width: (lastChar.displayX + lastChar.displayWidth) - firstChar.displayX,
        height: Math.max(...chars.map(c => c.displayHeight))
      });
    });
    
    return highlights;
  }

  private createTextSelectionImmediate() {
    if (!this.selectionStartChar || !this.selectionEndChar) return;
    
    const startIndex = Math.min(this.selectionStartChar.charIndex, this.selectionEndChar.charIndex);
    const endIndex = Math.max(this.selectionStartChar.charIndex, this.selectionEndChar.charIndex);
    
    const selectedChars = this.normalizedTextChars.slice(startIndex, endIndex + 1);
    let selectedText = selectedChars.map(char => char.char).join('');
    
    selectedText = selectedText.replace(/\s+/g, ' ').trim();

    if (selectedText.length === 0 || !this.isValidSelection(selectedText)) {
      this.clearSelection();
      console.log('❌ Selection too short or invalid:', selectedText);
      return;
    }
    
    const displaySelectedChars = this.displayTextChars.slice(startIndex, endIndex + 1);
    const firstChar = displaySelectedChars[0];
    const lastChar = displaySelectedChars[displaySelectedChars.length - 1];
    
    const boundingRect = new DOMRect(
      firstChar.displayX,
      Math.min(firstChar.displayY, lastChar.displayY),
      (lastChar.displayX + lastChar.displayWidth) - firstChar.displayX,
      Math.max(firstChar.displayY + firstChar.displayHeight, lastChar.displayY + lastChar.displayHeight) - Math.min(firstChar.displayY, lastChar.displayY)
    );
    
    this.currentSelection = {
      text: selectedText,
      pageNumber: this.currentPage,
      boundingRect,
      ranges: []
    };
    
    this.hasActiveSelection = true;
    
    this.positionPopupImmediate(boundingRect);
    
    this.showPopup = false;
    
    this.cdr.detectChanges();
    
    this.textSelected.emit({
      selection: this.currentSelection,
      timestamp: new Date()
    });
    
    console.log('✅ Text selected at zoom', this.currentZoom + ':', selectedText, '(click to show actions)');
  }

  private positionPopupImmediate(boundingRect: DOMRect) {
    const popupWidth = 360;
    const popupHeight = 200;
    
    const canvas = this.canvas.nativeElement;
    const wrapper = this.viewerWrapper.nativeElement;
    
    let x = boundingRect.left + boundingRect.width / 2 - popupWidth / 2;
    let y = boundingRect.bottom + 10;
    
    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;
    
    const canvasRect = canvas.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const wrapperOffsetX = canvasRect.left - wrapperRect.left;
    const wrapperOffsetY = canvasRect.top - wrapperRect.top;
    
    x += wrapperOffsetX;
    y += wrapperOffsetY;
    
    const maxX = wrapperWidth - popupWidth - 10;
    const maxY = wrapperHeight - popupHeight - 10;
    
    x = Math.max(10, Math.min(x, maxX));
    
    if (y > maxY) {
      y = boundingRect.top + wrapperOffsetY - popupHeight - 10;
      if (y < 10) {
        y = maxY;
      }
    }
    
    this.popupPosition = { x, y };
  }

  private clearSelectionCompletely() {
    this.hasActiveSelection = false;
    this.showPopup = false;
    this.currentSelection = null;
    this.selectionStartChar = null;
    this.selectionEndChar = null;
    this.selectionHighlights = [];
    this.cdr.detectChanges();
  }

  private clearSelection() {
    this.selectionStartChar = null;
    this.selectionEndChar = null;
    this.selectionHighlights = [];
  }

  preventSelection(event: Event) {
    event.preventDefault();
    return false;
  }

  async previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.normalizedTextChars = [];
      this.displayTextChars = [];
      this.textLines = [];
      this.clearSelectionCompletely();
      await this.safeRenderPage();
      this.updatePageInput();
      this.closePopup();
    }
  }

  async nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.normalizedTextChars = [];
      this.displayTextChars = [];
      this.textLines = [];
      this.clearSelectionCompletely();
      await this.safeRenderPage();
      this.updatePageInput();
      this.closePopup();
    }
  }

  onPageInputChange(event: any) {
    const value = event.target.value;
    console.log(`Page input changed to: "${value}"`);
  }

  onPageInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      console.log('Enter key pressed');
      event.preventDefault();
      this.navigateToInputPage(event.target as HTMLInputElement);
    }
  }

  onPageInputBlur(event: any) {
    console.log('Page input lost focus');
    this.navigateToInputPage(event.target as HTMLInputElement);
  }

  private async navigateToInputPage(input: HTMLInputElement) {
    const inputValue = input.value;
    const pageNum = parseInt(inputValue);
    
    console.log(`NavigateToInputPage called with input: "${inputValue}", parsed: ${pageNum}, current: ${this.currentPage}`);
    
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= this.totalPages) {
      if (pageNum !== this.currentPage) {
        console.log(`Navigating to page ${pageNum}`);
        this.currentPage = pageNum;
        this.normalizedTextChars = [];
        this.displayTextChars = [];
        this.textLines = [];
        this.clearSelectionCompletely();
        await this.safeRenderPage();
        this.closePopup();
      }
    } else {
      console.log(`Invalid page number, resetting input to ${this.currentPage}`);
      input.value = this.currentPage.toString();
    }
  }

  private updatePageInput() {
    if (this.pageInput?.nativeElement) {
      this.pageInput.nativeElement.value = this.currentPage.toString();
    }
  }

  async zoomIn() {
    if (this.currentZoom < 4.0) {
      this.currentZoom = Math.min(4.0, this.currentZoom + 0.25);
      this.currentZoom = Math.round(this.currentZoom * 100) / 100;
      
      console.log('🔍 Zooming in to:', this.currentZoom);
      this.clearSelectionCompletely();
      await this.safeRenderPage();
      this.closePopup();
    }
  }

  async zoomOut() {
    if (this.currentZoom > 0.25) {
      this.currentZoom = Math.max(0.25, this.currentZoom - 0.25);
      this.currentZoom = Math.round(this.currentZoom * 100) / 100;
      
      console.log('🔍 Zooming out to:', this.currentZoom);
      this.clearSelectionCompletely();
      await this.safeRenderPage();
      this.closePopup();
    }
  }

  toggleFullscreen() {
    const element = this.viewerWrapper.nativeElement;
    if (!this.isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      }
      this.isFullscreen = true;
    } else {
      this.exitFullscreen();
    }
    this.cdr.detectChanges();
    
    // Use safeRenderPage with longer delay for fullscreen transitions
    this.cancelCurrentRender();
    setTimeout(() => this.safeRenderPage(), 200);
  }

  private exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    this.isFullscreen = false;
    this.cdr.detectChanges();
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange() {
    if (!document.fullscreenElement) {
      this.isFullscreen = false;
      this.cdr.detectChanges();
      
      // Use safeRenderPage with delay for fullscreen exit
      this.cancelCurrentRender();
      setTimeout(() => this.safeRenderPage(), 200);
    }
  }

  private isValidSelection(text: string): boolean {
    if (text.length < 1) return false;
    if (!/[a-zA-Z0-9]/.test(text)) return false;
    return text.trim().length > 0;
  }
  
  private isValidForPopup(text: string): boolean {
    if (text.length < 3) return false;
    if (!/[a-zA-Z0-9]/.test(text)) return false;
    return text.trim().length >= 3;
  }

  onTextSelectionToggle() {
    console.log('🔤 Text selection toggled:', this.enableTextSelection);
    this.closePopup();
    this.clearSelectionCompletely();
    this.safeRenderPage();
  }

  async executeAction(action: PopupAction) {
    if (!this.currentSelection || this.loadingActions.has(action.id)) return;

    this.loadingActions.add(action.id);
    this.isActionLoading = true;
    this.cdr.detectChanges();

    let success = true;
    let error: string | undefined;

    try {
      await action.action(this.currentSelection.text, this.currentSelection);
      console.log(`✅ Action "${action.label}" executed successfully`);
    } catch (err) {
      success = false;
      error = (err as Error).message;
      console.error(`❌ Action "${action.label}" failed:`, err);
    } finally {
      this.loadingActions.delete(action.id);
      this.isActionLoading = this.loadingActions.size > 0;
      
      this.actionExecuted.emit({
        action,
        selection: this.currentSelection,
        timestamp: new Date(),
        success,
        error
      });
    
      this.closePopup();
    }
  }

  private showTemporaryFeedback(actionId: string, type: 'success' | 'error') {
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 2000);
  }

  private closePopupFast() {
    this.showPopup = false;
    this.currentSelection = null;
  }

  closePopup() {
    this.showPopup = false;
    this.loadingActions.clear();
    this.isActionLoading = false;
    this.cdr.detectChanges();
  }

  getPreviewText(text: string): string {
    const maxLength = 60;
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  getWordCount(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private removeEventListeners() {
    if (this.documentClickListener) {
      document.removeEventListener('click', this.documentClickListener);
    }
    this.removeKeyboardListeners();
  }

  private onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    
    if (this.showPopup && this.popup) {
      const popupElement = this.popup.nativeElement;
      if (!popupElement.contains(target)) {
        this.closePopup();
      }
    } else if (this.hasActiveSelection) {
      const textLayerElement = this.textLayer?.nativeElement;
      const canvasElement = this.canvas?.nativeElement;
      const readerContainer = target.closest('.pdf-reader-container');
      
      if (readerContainer) {
        const clickedOnCanvas = canvasElement && canvasElement.contains(target);
        const clickedOnTextLayer = textLayerElement && textLayerElement.contains(target);
        
        if (clickedOnCanvas || (!clickedOnTextLayer)) {
          this.clearSelectionCompletely();
          console.log('❌ Selection cleared - clicked on PDF page or outside text area');
        }
      } else {
        this.clearSelectionCompletely();
        console.log('❌ Selection cleared - clicked outside PDF reader');
      }
    }
  }

  onTextLayerDoubleClick(event: MouseEvent) {
    if (!this.enableTextSelection) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const point = this.getRelativePoint(event);
    const clickedChar = this.findCharAtPoint(point);
    
    if (!clickedChar) return;
    
    // Find word boundaries
    const word = this.selectWordAtChar(clickedChar);
    if (word) {
      this.createWordSelection(word);
      console.log('🖱️ Word selected via double-click:', word.text);
    }
  }

  private selectWordAtChar(char: TextChar): {startIndex: number, endIndex: number, text: string} | null {
    const charIndex = char.charIndex;
    const allChars = this.normalizedTextChars;
    
    // Find start of word (go backwards until we hit whitespace or punctuation)
    let startIndex = charIndex;
    while (startIndex > 0) {
      const prevChar = allChars[startIndex - 1];
      if (!prevChar || this.isWordBoundary(prevChar.char)) {
        break;
      }
      startIndex--;
    }
    
    // Find end of word (go forwards until we hit whitespace or punctuation)
    let endIndex = charIndex;
    while (endIndex < allChars.length - 1) {
      const nextChar = allChars[endIndex + 1];
      if (!nextChar || this.isWordBoundary(nextChar.char)) {
        break;
      }
      endIndex++;
    }
    
    // Extract the word text
    const wordChars = allChars.slice(startIndex, endIndex + 1);
    const wordText = wordChars.map(c => c.char).join('').trim();
    
    // Only select if it's a valid word (not just punctuation or whitespace)
    if (wordText.length > 0 && /[a-zA-Z0-9]/.test(wordText)) {
      return { startIndex, endIndex, text: wordText };
    }
    
    return null;
  }

  private isWordBoundary(char: string): boolean {
    // Consider spaces, punctuation, and special characters as word boundaries
    return /[\s\.,;:!?\-\(\)\[\]{}'"\/\\]/.test(char);
  }

  private createWordSelection(word: {startIndex: number, endIndex: number, text: string}) {
    // Set selection characters
    this.selectionStartChar = this.normalizedTextChars[word.startIndex];
    this.selectionEndChar = this.normalizedTextChars[word.endIndex];
    
    // Update highlights
    this.updateHighlight();
    
    // Create the text selection
    this.createTextSelectionImmediate();
  }
};
  