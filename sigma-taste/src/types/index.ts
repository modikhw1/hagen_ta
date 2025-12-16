// Core σTaste Types

export interface Video {
  id: string;
  video_url: string;
  platform: string;
  metadata: {
    url: string;
    videoId: string;
    platform: string;
    provider: string;
  };
  deep_analysis: DeepAnalysis;
  gcs_uri: string | null;
  created_at: string;
  analyzed_at: string;
  rating: HumanRating | null;
  ai_prediction: DeepAnalysis;
}

export interface DeepAnalysis {
  audio?: AudioAnalysis;
  scenes?: SceneAnalysis;
  script?: ScriptAnalysis;
  trends?: TrendAnalysis;
  visual?: VisualAnalysis;
  content?: ContentAnalysis;
  technical?: TechnicalAnalysis;
  engagement?: EngagementAnalysis;
  schema_v1_signals?: SchemaV1Signals;
}

export interface AudioAnalysis {
  quality: string;
  musicType: string;
  musicGenre: string;
  audioEnergy: string;
  hasVoiceover: boolean;
  soundEffects: string[];
}

export interface SceneAnalysis {
  sceneBreakdown: any[];
  editAsPunchline: boolean;
  misdirectionTechnique: string;
}

export interface ScriptAnalysis {
  humor: {
    humorType: string;
    isHumorous: boolean;
    comedyTiming: string;
    absurdismLevel: string;
  };
  emotional: any;
  structure: {
    hook: string;
    setup: string;
    payoff: string;
  };
  transcript: string;
  originality: number;
  replicability: number;
}

export interface TrendAnalysis {
  timelessness: number;
  trendAlignment: string;
  trendingElements: string[];
}

export interface VisualAnalysis {
  summary: string;
  hookStrength: number;
  overallQuality: number;
  mainElements: string[];
  textOverlays: string[];
}

export interface ContentAnalysis {
  style: string;
  topic: string;
  format: string;
  keyMessage: string;
  targetAudience: string;
}

export interface TechnicalAnalysis {
  pacing: number;
  lighting: string;
  cameraWork: string;
  editingStyle: string;
  cutsPerMinute: number;
}

export interface EngagementAnalysis {
  replayValue: number;
  shareability: number;
  scrollStopPower: number;
}

export interface SchemaV1Signals {
  humor?: any;
  coherence?: any;
  execution?: any;
  statement?: any;
  conversion?: any;
  risk_level?: RiskLevel;
  hospitality?: HospitalitySignals;
  personality?: any;
  replicability?: ReplicabilitySignals;
  target_audience?: TargetAudienceSignals;
  environment_requirements?: EnvironmentSignals;
}

export interface ReplicabilitySignals {
  actor_count: 'solo' | 'duo' | 'small_team' | 'large_team';
  setup_complexity: 'phone_only' | 'basic_tripod' | 'lighting_setup' | 'full_studio';
  skill_required: 'anyone' | 'basic_editing' | 'intermediate' | 'professional';
  environment_dependency: 'anywhere' | 'specific_indoor' | 'specific_outdoor' | 'venue_required';
  equipment_needed: string[];
  estimated_time: 'under_1hr' | '1_4hrs' | 'half_day' | 'full_day';
}

export interface TargetAudienceSignals {
  age_range: { primary: string; secondary?: string };
  income_level: 'budget' | 'mid_range' | 'upscale' | 'luxury' | 'broad';
  lifestyle_tags: string[];
  vibe_alignment: string;
  primary_occasion: string;
}

export interface EnvironmentSignals {
  setting_type: string;
  space_requirements: string;
  lighting_conditions: string;
  noise_tolerance: string;
  customer_visibility: string;
}

export interface RiskLevel {
  content_edge: 'safe' | 'edgy' | 'risky';
  humor_risk: 'none' | 'low' | 'medium' | 'high';
  trend_reliance: 'none' | 'low' | 'medium' | 'high';
  controversy_potential: string;
}

export interface HospitalitySignals {
  vibe: string;
  occasion: string;
  price_tier: string;
  business_type: string;
  service_ethos: string;
  locality_markers: string[];
  tourist_orientation: string;
}

export interface HumanRating {
  overall_score: number;
  dimensions: {
    hook: number;
    pacing: number;
    payoff: number;
    originality: number;
    rewatchable: number;
  };
  notes: string;
  tags: string[];
  rated_at: string;
  rater_id: string;
}

// Pairwise Comparison Types
export interface PairwiseComparison {
  id: string;
  video_a_id: string;
  video_b_id: string;
  winner_id: string | null; // null means tie
  dimension: string; // 'overall' | 'hook' | 'humor' | 'production' | etc.
  confidence: 'certain' | 'somewhat' | 'barely';
  reasoning: string;
  created_at: string;
}

// Cluster Types
export interface VideoCluster {
  id: string;
  name: string;
  description: string;
  centroid: number[]; // embedding centroid
  video_ids: string[];
  defining_signals: string[]; // what makes this cluster distinct
  color: string;
}

export interface ClusterCorrection {
  id: string;
  video_id: string;
  from_cluster_id: string;
  to_cluster_id: string;
  reason: string;
  hidden_variable_suggestion: string;
  created_at: string;
}

// Hidden Variable Discovery Types
export interface HiddenVariable {
  id: string;
  name: string;
  description: string;
  discovered_from: 'adversarial' | 'cluster_correction' | 'pairwise' | 'manual';
  examples: string[]; // video_ids that exemplify this
  counter_examples: string[]; // video_ids that lack this
  confidence: number;
  created_at: string;
}

// σTaste Weight Configuration
export interface SigmaTasteWeights {
  audience_alignment: number;
  tone_personality_match: number;
  format_appropriateness: number;
  aspiration_alignment: number;
  // Hidden/discovered dimensions
  custom_dimensions: { [key: string]: number };
}

// Adversarial Probing Types
export interface AdversarialCase {
  video: Video;
  ai_score: number;
  human_score: number;
  divergence: number;
  suggested_gap: string;
  resolved: boolean;
  resolution_notes: string;
}

// 2D Projection for visualization
export interface VideoProjection {
  video_id: string;
  x: number;
  y: number;
  cluster_id: string | null;
  overall_score: number;
}
