export interface AnalyticsSummary {
  total_queries: number;
  blocked_queries: number;
  positive_feedback: number;
  negative_feedback: number;
  avg_response_ms: number;
}

export interface DailyStat {
  date: string;
  total_queries: number;
  blocked_queries: number;
  avg_response_ms: number;
  positive_feedback: number;
  negative_feedback: number;
}

export interface TopQuery {
  query_text: string;
  count: number;
  language: string;
  last_seen: string;
}

export interface FeedbackStat {
  total: number;
  positive: number;
  negative: number;
  ratio: number;
}

export interface DocumentRecord {
  id: string;
  filename: string;
  doc_type: string;
  language: string;
  chunk_count: number;
  summary: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface AuditEntry {
  id: number;
  admin_email: string;
  action: string;
  target: string;
  ip: string;
  created_at: string;
}

export interface AuditResponse {
  entries: AuditEntry[];
  total: number;
  offset: number;
  limit: number;
}

export interface QueryRow {
  query_hash: string;
  query_text: string;
  language: string;
  response_ms: number;
  sources_cnt: number;
  feedback: number;
  is_blocked: number;
  created_at: string;
}

export interface PromptVariant {
  id: number;
  name: string;
  language: string;
  prompt_text: string;
  is_active: boolean;
  usage_count: number;
  avg_score: number;
}

export type Role = "super_admin" | "news_editor" | "chatbot_admin";
export type AdminStatus = "active" | "disabled" | "pending";
export type DeliveryStatus = "pending" | "sent" | "delivery_failed";

export interface AdminUser {
  id: number;
  email: string;
  role: Role;
  status: AdminStatus;
  added_by: string;
  added_at: string;
  updated_at?: string;
  last_login_at?: string;
}

export interface AdminInvitation {
  id: string;
  email: string;
  role: Role;
  invited_by_admin_id: string;
  created_at: string;
  expires_at: string;
  accepted_at?: string;
  revoked_at?: string;
  last_sent_at?: string;
  delivery_status?: DeliveryStatus;
}

export interface ReindexAllResult {
  status: string;
  count: number;
}

export interface AdminNewsLocale {
  locale: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  seo_title: string;
  seo_description: string;
  keywords: string;
}

export interface AdminNewsTag {
  id: string;
  slug: string;
  name: string;
}

export interface AdminNewsCategoryLocale {
  locale: string;
  name: string;
  slug: string;
  description: string;
  seo_title: string;
  seo_description: string;
}

export interface AdminNewsCategory {
  id: string;
  color: string;
  icon: string;
  cover_image: string;
  cover_position?: "top" | "center" | "bottom";
  sort_order: number;
  status: "visible" | "hidden" | "archived";
  articles_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  locales: Record<string, AdminNewsCategoryLocale>;
}

export interface AdminNewsArticle {
  id: string;
  status: "draft" | "published";
  category_id: string;
  category?: AdminNewsCategory;
  tags: AdminNewsTag[];
  author: { name: string; avatar?: string; position?: string };
  image_url: string;
  cover_position?: string;
  gallery?: string[];
  video_url?: string;
  is_pinned: boolean;
  preview_token: string;
  publish_at?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  locales: Record<string, AdminNewsLocale>;
}

export interface AdminNewsListResponse {
  articles: AdminNewsArticle[];
  total: number;
  offset: number;
  limit: number;
  page: number;
}

export interface AdminNewsListParams {
  status?: string;
  category?: string;
  tag?: string;
  search?: string;
  include_deleted?: boolean;
  page?: number;
  limit?: number;
}
