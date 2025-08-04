export interface PdfViewerOptions {
  showToolbar?: boolean;
  enableTextSelection?: boolean;
  defaultZoom?: number;
  popupActions?: PopupAction[];
  useDialogMode?: boolean; // New option for dialog vs popup
}

export interface TextSelection {
  text: string;
  pageNumber: number;
  boundingRect: DOMRect;
  ranges: Range[];
}

export interface PopupAction {
  id: string;
  label: string;
  icon?: string;
  action: (selectedText: string, selection: TextSelection) => Promise<void> | void;
  disabled?: boolean;
  category?: ActionCategory; // New category property
}

// New interfaces for enhanced dialog functionality
export interface ActionCategory {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  description?: string;
}

export interface TextAnalysisResult {
  categories: ActionCategory[];
  keywords: string[];
  language?: string;
  wordCount: number;
  charCount: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface DialogAction {
  id: string;
  label: string;
  icon: string;
  category: ActionCategory;
  action: (selectedText: string, selection: TextSelection, analysisResult?: TextAnalysisResult) => Promise<void> | void;
  disabled?: boolean;
  loading?: boolean;
}

// Enhanced event interfaces
export interface TextSelectionEvent {
  selection: TextSelection;
  timestamp: Date;
  analysisResult?: TextAnalysisResult;
}

export interface ActionExecutedEvent {
  action: PopupAction | DialogAction;
  selection: TextSelection;
  timestamp: Date;
  success: boolean;
  error?: string;
  category?: ActionCategory;
}