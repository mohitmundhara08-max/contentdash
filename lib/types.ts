// ─── Instagram Account ───────────────────────────────────────────────
export interface IGAccount {
  id: string
  ig_user_id: string          // Instagram user ID from Graph API
  username: string            // @handle
  name: string                // Display name
  profile_picture_url: string
  access_token: string        // Long-lived token from OAuth (stored encrypted)
  token_expires_at: string
  followers_count: number
  media_count: number
  connected: boolean
  created_at: string
}

// ─── Channel (content planning profile) ─────────────────────────────
export interface Channel {
  id: string
  ig_account_id: string | null  // null = manual channel (no OAuth yet)
  name: string
  handle: string
  objective: string
  audience: string
  niche: string
  color: string
  created_at: string
  ig_account?: IGAccount        // joined relation
}

// ─── Content Plan ────────────────────────────────────────────────────
export interface ContentPlan {
  id: string
  channel_id: string
  keyword: string
  duration: number
  strategy: string
  hook_formula: string
  created_at: string
}

// ─── Post ─────────────────────────────────────────────────────────────
export interface Post {
  id: string
  plan_id: string
  channel_id: string
  day: number
  week: number
  format: 'Reel' | 'Carousel' | 'Long-form'
  pillar: string
  title: string
  hook: string
  content_brief: string
  script: string
  ai_prompt: string
  hashtags: string
  cta: string
  post_date: string
  reach_target: number
  saves_target: number
  shares_target: number
  comments_target: number
  plays_target: number
  priority: number
  notes: string
  created_at: string
  performance?: Performance
}

// ─── Performance ──────────────────────────────────────────────────────
export interface Performance {
  id: string
  post_id: string
  actual_reach: number
  actual_saves: number
  actual_shares: number
  actual_comments: number
  actual_plays: number
  recorded_at: string
}

// ─── Generate Request ────────────────────────────────────────────────
export interface GenerateRequest {
  channelName: string
  objective: string
  audience: string
  keyword: string
  duration: number
  quickMode: boolean
  apiKey?: string
}
