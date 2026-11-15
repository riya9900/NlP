export interface Product {
  product_id: string;
  title: string;
  price?: string | null;
  rating?: number | null;
  reviews_count?: number | null;
  thumbnail?: string | null;
  source?: string | null;
}

export interface ProductSearchResponse {
  query: string;
  products: Product[];
}

export interface Review {
  id: string;
  text: string;
  rating?: number | null;
  title?: string | null;
  date?: string | null;
  source?: string | null;
  language?: string | null;
  author?: string | null;
}

export interface ReviewsResponse {
  product_id: string;
  count: number;
  reviews: Review[];
}

export interface AnalyzeRequest {
  product_id?: string;
  reviews?: Review[];
  filter_spam: boolean;
  lang: string;
}

export interface Theme {
  id: number;
  label: string;
  mentions: number;
  sentiment: number; // -1..1
  score: number;
  quotes: string[];
  review_ids: string[];
}

export interface ReviewAnnotation {
  id: string;
  language: string;
  sentiment: number;
  spam_score: number;
  is_spam: boolean;
  spam_reasons: string[];
  theme_ids: number[];
}

export interface SummaryResponse {
  blurb: string;
  pros: Theme[];
  cons: Theme[];
  themes: Theme[];
  languages: Record<string, number>;
  total_reviews: number;
  analyzed_reviews: number;
  spam_removed: number;
  annotations: ReviewAnnotation[];
  llm_used: boolean;
}

export interface EvaluationClassReport {
  precision: number;
  recall: number;
  "f1-score": number;
  support: number;
}

export interface EvaluationResults {
  spam_english_test?: {
    acc?: number;
    precision?: number;
    recall?: number;
    f1?: number;
  };
  spam_demo?: {
    report?: {
      genuine?: EvaluationClassReport;
      spam?: EvaluationClassReport;
      accuracy?: number;
      "macro avg"?: EvaluationClassReport;
      "weighted avg"?: EvaluationClassReport;
    };
    confusion_matrix?: number[][];
    roc_auc?: number;
    ablation?: {
      precision?: Record<string, number>;
      recall?: Record<string, number>;
      f1?: Record<string, number>;
    };
  };
  sentiment_by_language?: Array<{
    lang: string;
    accuracy: number;
    n: number;
  }>;
  themes?: Array<{
    aspect: string;
    best_theme: string;
    jaccard: number;
    sentiment: number;
    sign_correct: boolean;
  }>;
  summary?: Record<string, number>;
}
