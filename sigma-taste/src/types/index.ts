// Core σTaste Types — v1.2 Schema
// Updated: 2025-12-18 for alignment with Hagen integration package

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
  // Core analysis sections
  audio?: AudioAnalysis;
  scenes?: SceneAnalysis;
  script?: ScriptAnalysis;
  trends?: TrendAnalysis;
  visual?: VisualAnalysis;
  content?: ContentAnalysis;
  technical?: TechnicalAnalysis;
  engagement?: EngagementAnalysis;
  
  // v1.2 structured signals
  schema_version?: number;
  schema_v1_signals?: SchemaV1Signals;
}

export interface AudioAnalysis {
  quality: number;
  audioMix?: string;
  musicType: string;
  musicGenre: string;
  audioEnergy: number;
  energyLevel?: string;
  hasVoiceover: boolean;
  soundEffects: string[];
  voiceoverTone?: string;
  audioVisualSync?: number;
  voiceoverQuality?: number | null;
}

export interface SceneBreakdownItem {
  duration: string;
  timestamp: string;
  sceneNumber: number;
  audioContent: string;
  visualContent: string;
  impliedMeaning: string;
  editSignificance: string;
  viewerAssumption: string;
  narrativeFunction: string;
}

export interface SceneAnalysis {
  sceneBreakdown: SceneBreakdownItem[];
  editAsPunchline: boolean;
  visualNarrativeSync?: number;
  misdirectionTechnique: string;
  editPunchlineExplanation?: string;
}

export interface ScriptAnalysis {
  humor: {
    humorType: string;
    isHumorous: boolean;
    comedyTiming: number;
    absurdismLevel: number;
    humorMechanism?: string;
    surrealismLevel?: number;
    visualComedyElement?: string;
  };
  emotional: {
    emotionalArc?: string;
    relatability?: number;
    primaryEmotion?: string;
    emotionalIntensity?: number;
  };
  hasScript?: boolean;
  structure: {
    hook: string;
    setup: string;
    payoff: string;
    hasTwist?: boolean;
    hookType?: string;
    payoffType?: string;
    development?: string;
    hasCallback?: boolean;
    twistDelivery?: string;
    payoffStrength?: number;
  };
  transcript: string;
  conceptCore?: string;
  originality: {
    score: number;
    novelElements?: string[];
    similarFormats?: string[];
  };
  replicability: {
    score: number;
    template?: string;
    requiredElements?: string[];
    variableElements?: string[];
    contextDependency?: number;
    resourceRequirements?: string;
  };
  scriptQuality?: number;
  visualTranscript?: string;
}

export interface TrendAnalysis {
  timelessness: number;
  trendAlignment: number;
  trendingElements: string[];
}

export interface VisualAnalysis {
  summary: string;
  transitions?: string[];
  colorPalette?: string[];
  hookStrength: number;
  mainElements: string[];
  textOverlays: string[];
  colorDiversity?: number;
  overallQuality: number;
  hookDescription?: string;
  visualHierarchy?: string;
  brandingElements?: string[];
  compositionQuality?: number;
}

export interface ContentAnalysis {
  style: string;
  topic: string;
  format: string;
  duration?: number;
  keyMessage: string;
  callsToAction?: string[];
  emotionalTone?: string;
  targetAudience: string;
  valueProposition?: string;
  uniquenessFactors?: string[];
  narrativeStructure?: string;
}

export interface TechnicalAnalysis {
  pacing: number;
  lighting: string;
  cameraWork: string;
  resolution?: string;
  aspectRatio?: string;
  editingStyle: string;
  cutsPerMinute: number;
  specialEffects?: string[];
  pacingDescription?: string;
}

export interface EngagementAnalysis {
  replayValue: number;
  shareability: number;
  scrollStopPower: number;
  engagementFactors?: string[];
  attentionRetention?: number;
}

// v1.2 Schema V1 Signals — Comprehensive structured analysis
export interface SchemaV1Signals {
  humor?: HumorSignals;
  coherence?: CoherenceSignals;
  execution?: ExecutionSignals;
  statement?: StatementSignals;
  conversion?: ConversionSignals;
  risk_level?: RiskLevel;
  hospitality?: HospitalitySignals;
  personality?: PersonalitySignals;
  replicability?: ReplicabilitySignals;
  target_audience?: TargetAudienceSignals;
  environment_requirements?: EnvironmentSignals;
}

export interface HumorSignals {
  target?: string;
  present: boolean;
  age_code?: string;
  humor_types?: string[];
  meanness_risk?: string;
}

export interface CoherenceSignals {
  contradictions?: string[];
  personality_message_alignment_0_1?: number;
}

export interface ExecutionSignals {
  format_name_if_any?: string;
  effortlessness_1_10?: number;
  intentionality_1_10?: number;
  has_repeatable_format?: boolean;
  social_permission_1_10?: number;
  production_investment_1_10?: number;
}

export interface StatementSignals {
  subtext?: string[];
  opinion_stance?: {
    defended?: boolean;
    edginess?: string;
    makes_opinions?: boolean;
  };
  primary_intent?: string;
  apparent_audience?: string;
  self_seriousness_1_10?: number;
}

export interface ConversionSignals {
  cta_types?: string[];
  visit_intent_strength_0_1?: number;
}

export interface RiskLevel {
  humor_risk?: string;
  content_edge: string;
  trend_reliance?: string;
  controversy_potential: string;
}

export interface HospitalitySignals {
  vibe: string | string[];
  occasion: string | string[];
  price_tier?: string;
  business_type?: string;
  service_ethos?: string | string[];
  locality_markers?: string[];
  tourist_orientation?: string;
  signature_items_or_offers?: string[];
}

export interface PersonalitySignals {
  energy_1_10?: number;
  warmth_1_10?: number;
  formality_1_10?: number;
  confidence_1_10?: number;
  traits_observed?: string[];
  social_positioning?: {
    accessibility?: string;
    authority_claims?: boolean;
    peer_relationship?: boolean;
  };
}

export interface ReplicabilitySignals {
  actor_count: string;
  setup_complexity: string;
  skill_required: string;
  environment_dependency: string;
  equipment_needed: string[];
  estimated_time: string;
}

export interface TargetAudienceSignals {
  age_range: { primary: string; secondary?: string };
  income_level: string;
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
