export interface PdfViewerOptions {
    showToolbar?: boolean;
    enableTextSelection?: boolean;
    defaultZoom?: number;
    popupActions?: PopupAction[];
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
  }
  
  // New interfaces for text selection
  export interface TextSelectionEvent {
    selection: TextSelection;
    timestamp: Date;
  }
  
  export interface ActionExecutedEvent {
    action: PopupAction;
    selection: TextSelection;
    timestamp: Date;
    success: boolean;
    error?: string;
  }