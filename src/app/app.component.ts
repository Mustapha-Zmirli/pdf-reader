import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfReaderComponent } from './components/pdf-reader/pdf-reader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PdfReaderComponent],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>📄 PDF Reader Pro</h1>
        <p class="app-subtitle">Lecteur PDF avancé avec sélection de texte et actions intelligentes</p>
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

     <footer class="app-footer">
  <p>
     <strong>Conseils :</strong> 
    Cliquez sur 📁 pour charger un PDF local • 
    Double-cliquez pour sélectionner un mot • 
    Utilisez les flèches directionnelles pour naviguer ← → • 
    Ctrl+C pour copier rapidement
  </p>
</footer>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .app-header {
      text-align: center;
      margin-bottom: 20px;
      max-width: 900px;
    }

    .app-header h1 {
      color: #1f2937;
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 8px 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .app-subtitle {
      color: #6b7280;
      font-size: 1.1rem;
      margin: 0;
      font-weight: 400;
    }

    .app-main {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      width: 100%;
      max-width: 1200px;
    }

    .pdf-container {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    .app-footer {
      margin-top: 20px;
      text-align: center;
      max-width: 900px;
    }

    .app-footer p {
      color: #6b7280;
      font-size: 0.95rem;
      line-height: 1.6;
      margin: 0;
      padding: 16px 20px;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .app-container {
        padding: 10px;
      }

      .app-header h1 {
        font-size: 2rem;
      }

      .app-subtitle {
        font-size: 1rem;
      }

      .app-footer p {
        font-size: 0.9rem;
        padding: 12px 16px;
      }
    }

    @media (max-width: 480px) {
      .app-header h1 {
        font-size: 1.75rem;
      }

      .app-subtitle {
        font-size: 0.95rem;
      }
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
    showToolbar: true
  };

  onTextSelected(event: any) {
    console.log('📝 Text selected in app:', {
      text: event.selection.text.substring(0, 100) + '...',
      page: event.selection.pageNumber,
      timestamp: event.timestamp
    });
  }

  onActionExecuted(event: any) {
    console.log('🎯 Action executed in app:', {
      action: event.action.label,
      success: event.success,
      timestamp: event.timestamp,
      error: event.error
    });

    // You can add custom logic here, such as:
    // - Showing notifications
    // - Logging to analytics
    // - Storing selected text history
    // - etc.
  }
}