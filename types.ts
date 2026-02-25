
export interface ExtractionResult {
  metadata: {
    title: string;
    confidenceScore: number;
    detectedLanguage: string;
    documentType: string;
  };
  content: {
    rawText: string;
    entities: Array<{ category: string; value: string }>;
    keyValues: Array<{ key: string; value: string }>;
  };
  structuredData: {
    summary: string;
    details: Array<{ label: string; value: string }>;
  };
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
