// Mirrors the backend's Pydantic models (domain/models/*.py) and the
// shapes web/server.py actually returns - kept in sync by hand since the
// two are separate codebases; if a backend field changes, update here too.

export type LessonLevel = "primary" | "secondary" | "college" | "professional";

export type ExerciseType =
  | "multiple_choice"
  | "fill_blank"
  | "essay"
  | "speaking"
  | "listening"
  | "conversation";

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  context?: string | null;
  choices?: string[] | null;
  blank_words?: string[] | null;
  audio_file?: string | null;
  correct_answer?: string | null;
  alternative_answers: string[];
  points: number;
  difficulty: number;
  hint?: string | null;
  explanation: string;
}

// Summary shape returned by GET /api/lessons (not the full lesson detail).
export interface LessonSummary {
  id: string;
  level: LessonLevel;
  title: string;
  description: string;
  topic: string;
  difficulty: number;
  duration_minutes: number;
  exercise_count: number;
  max_score: number;
  is_locked: boolean;
  locked_reason: string | null;
}

// Full shape returned by GET /api/lessons/:id.
export interface LessonDetail extends Omit<LessonSummary, "exercise_count"> {
  introduction: string;
  examples: string[];
  key_points: string[];
  exercises: Exercise[];
  prerequisites: string[];
}

export interface LessonProgress {
  user_id: string;
  lesson_id: string;
  exercises_attempted: number;
  exercises_passed: number;
  score: number;
  max_score: number;
  is_completed: boolean;
  started_at?: string | null;
  completed_at?: string | null;
}

// The item shape /api/progress returns per lesson (LessonProgress plus
// lesson metadata merged in server-side - see web/server.py's progress()).
export interface ProgressItem extends LessonProgress {
  title: string;
  level: LessonLevel;
  topic: string;
  exercise_count: number;
}

export interface ProgressSummary {
  lessons_started: number;
  lessons_completed: number;
  total_score: number;
  total_max_score: number;
  completion_rate: number;
  accuracy_rate: number;
}

export interface ProgressResponse {
  summary: ProgressSummary;
  lessons: ProgressItem[];
  recommendations: {
    weak_topics: string[];
    next_lesson: { id: string; title: string; level: LessonLevel; topic: string } | null;
  };
}

export interface ExerciseResult {
  success: boolean;
  is_correct: boolean;
  score: number;
  feedback: string;
}

export interface VocabularyWord {
  word: string;
  topic: string;
  level: LessonLevel;
  lesson_title: string;
  meaning: string;
  example: string;
}

export interface Achievement {
  title: string;
  description: string;
  status: "done" | "in_progress";
  progress: string;
}

export interface Voice {
  key: string;
  id: string;
  name: string;
  accent: string;
  gender: string;
}

export type VoiceMode = "auto" | "online" | "offline";

// Mirrors domain/models/user.py's UserResponse (never the full User -
// that includes password_hash, which the backend never sends over the wire).
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
  is_admin: boolean;
  admin_role: AdminRole | null;
  totp_enabled: boolean;
}

// Mirrors web/auth_routes.py's ADMIN_ROLES. Only meaningful when is_admin
// is true.
export type AdminRole = "root_admin" | "manager" | "receptionist" | "it_admin";

export interface AuthResponse {
  token: string;
  user: User;
}

// --- TOTP two-factor auth (see web/auth_routes.py, web/totp_routes.py) --

export interface TotpRequiredResponse {
  totp_required: true;
  totp_pending_token: string;
}

// /api/auth/login (and the Google OAuth login) return one or the other
// depending on whether the account is an admin with TOTP enabled.
export type LoginResult = AuthResponse | TotpRequiredResponse;

export interface TotpSetupResponse {
  secret: string;
  otpauth_uri: string;
}

export interface RagDocument {
  name: string;
  size_bytes: number;
}

export interface RagDocumentsResponse {
  backend: string;
  documents: RagDocument[];
}

export interface RagUploadResponse {
  saved: string;
  indexed_chunks: number | null;
  note?: string;
}

// --- Profile / Program (see web/profile_routes.py) -------------------

export interface Program {
  id: string;
  name: string;
  goal: string;
}

export interface Profile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  native_language: string | null;
  program: Program;
  learning_goals: string[];
  preferred_voice: string;
  timezone: string;
  onboarding_completed: boolean;
  total_exercises_completed: number;
  total_sessions: number;
  total_learning_hours: number;
  join_date: string | null;
  last_activity_date: string | null;
}

export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  age?: number;
  native_language?: string;
  program_id?: string;
  learning_goals?: string[];
  preferred_voice?: string;
  timezone?: string;
  onboarding_completed?: boolean;
}

// --- Pronunciation analysis (see web/analysis_routes.py) --------------

export interface PronunciationResult {
  score: number;
  distance: number;
  acoustic_distance: number;
  differences: {
    word_distance: number;
    phoneme_distance: number;
    word_error_rate: number;
    phoneme_error_rate: number;
    errors: unknown[];
    feedback: string;
    transcribe: string;
  };
}

// --- Subscription (see web/subscription_routes.py) ---------------------

export interface Tier {
  id: string;
  name: string;
  chat_messages_per_day: number;
  voice_minutes_per_day: number;
}

export interface UsageToday {
  chat_messages_used: number;
  chat_messages_limit: number;
  voice_minutes_used: number;
  voice_minutes_limit: number;
}

export interface Subscription {
  tier: Tier;
  usage_today: UsageToday;
  accessible_program_ids: string[];
  plan_selected: boolean;
  upgrade_requested: boolean;
}

export interface AdminSubscriptionUpdateRequest {
  tier_id?: string;
  chat_messages_per_day_override?: number;
  voice_minutes_per_day_override?: number;
}

export interface PlanSelectionRequest {
  tier_id: string;
}

// --- Invoices (see web/invoice_routes.py) -------------------------------

export type InvoiceStatus = "unpaid" | "paid";

export interface Invoice {
  id: string;
  invoice_number: string;
  tier_id: string;
  tier_name: string;
  period_start: string;
  period_end: string;
  amount_cents: number;
  currency: string;
  chat_messages_used: number;
  voice_minutes_used: number;
  status: InvoiceStatus;
  issued_at: string;
  paid_at: string | null;
}
