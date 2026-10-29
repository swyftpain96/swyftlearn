export type LanguageKind = 'spoken' | 'code';

export interface BaseLanguage {
  id: string;
  kind: LanguageKind;
  tags: readonly string[];
}

export interface SpokenLanguage extends BaseLanguage {
  kind: 'spoken';
  flag: string;
}

export interface CodeLanguage extends BaseLanguage {
  kind: 'code';
  icon: string;
}

export type Language = SpokenLanguage | CodeLanguage;

export interface LangIdeas {
  label: string;
  en: string;
  out: {
    Español: string;
    日本語: string;
    Serbian: string;
    English: string;
    JavaScript: string;
    TypeScript: string;
  };
}

export type Theme = 'light' | 'dark';

export interface InquiryFormData {
  name: string;
  email: string;
  languages: string[];
  message: string;
}

export interface ServerInquiryResponse {
  success: boolean;
  message: string;
  timestamp: string;
  inquiryId?: string;
  details?: InquiryFormData;
  error?: string;
}

export type InquiryState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'success';
      message: string;
      timestamp: string;
      inquiryId: string;
      details: InquiryFormData;
    }
  | {
      status: 'error';
      message: string;
    };
