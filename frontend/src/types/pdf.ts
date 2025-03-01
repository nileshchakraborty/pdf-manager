export interface PlagiarismMatch {
  text: string;
  similarity: number;
  source: string;
}

export interface PlagiarismResult {
  similarity: number;
  matches: PlagiarismMatch[];
}

export interface EditOperation {
  operation: 'add-text' | 'remove-text' | 'replace-text';
  page: number;
  text?: string;
  font?: string;
  fontSize?: number;
  alignment?: 'left' | 'center' | 'right';
  position?: {
    x: number;
    y: number;
  };
}

export interface PDFResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}
