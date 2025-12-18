/**
 * Correlation Analysis Engine for σTaste Discovery — v1.2
 * 
 * Joins pairwise comparisons with video metadata to find which AI variables
 * predict human preferences, which are noise, and where gaps exist.
 * 
 * Updated: 2025-12-18 for v1.2 schema alignment
 */

import type { Video, PairwiseComparison, DeepAnalysis } from '@/types';

// Confidence weights: certain=1.0, somewhat=0.7, barely=0.4
const CONFIDENCE_WEIGHTS: Record<string, number> = {
  certain: 1.0,
  somewhat: 0.7,
  barely: 0.4,
};

// All numeric variable paths to extract from deep_analysis
// v1.2 paths matching dataset_2025-12-18.json structure
export const NUMERIC_VARIABLE_PATHS = [
  // Audio (3)
  'audio.quality',
  'audio.audioEnergy',
  'audio.audioVisualSync',
  
  // Engagement (4)
  'engagement.replayValue',
  'engagement.shareability',
  'engagement.scrollStopPower',
  'engagement.attentionRetention',
  
  // Technical (2)
  'technical.pacing',
  'technical.cutsPerMinute',
  
  // Visual (4)
  'visual.hookStrength',
  'visual.colorDiversity',
  'visual.overallQuality',
  'visual.compositionQuality',
  
  // Trends (2)
  'trends.timelessness',
  'trends.trendAlignment',
  
  // Script - nested objects (5)
  'script.originality.score',
  'script.replicability.score',
  'script.replicability.contextDependency',
  'script.scriptQuality',
  'script.humor.comedyTiming',
  'script.humor.absurdismLevel',
  'script.emotional.relatability',
  'script.emotional.emotionalIntensity',
  'script.structure.payoffStrength',
  
  // Scenes (2)
  'scenes.visualNarrativeSync',
  
  // Schema V1 Signals - Coherence (1)
  'schema_v1_signals.coherence.personality_message_alignment_0_1',
  
  // Schema V1 Signals - Execution (4)
  'schema_v1_signals.execution.effortlessness_1_10',
  'schema_v1_signals.execution.intentionality_1_10',
  'schema_v1_signals.execution.social_permission_1_10',
  'schema_v1_signals.execution.production_investment_1_10',
  
  // Schema V1 Signals - Statement (1)
  'schema_v1_signals.statement.self_seriousness_1_10',
  
  // Schema V1 Signals - Conversion (1)
  'schema_v1_signals.conversion.visit_intent_strength_0_1',
  
  // Schema V1 Signals - Personality (4)
  'schema_v1_signals.personality.energy_1_10',
  'schema_v1_signals.personality.warmth_1_10',
  'schema_v1_signals.personality.formality_1_10',
  'schema_v1_signals.personality.confidence_1_10',
];

// Total: 36 numeric variable paths

// Categorical variable paths for one-hot encoding (future use)
export const CATEGORICAL_VARIABLE_PATHS = [
  'audio.musicType',
  'audio.energyLevel',
  'content.format',
  'content.style',
  'technical.editingStyle',
  'schema_v1_signals.replicability.actor_count',
  'schema_v1_signals.replicability.setup_complexity',
  'schema_v1_signals.replicability.skill_required',
  'schema_v1_signals.risk_level.content_edge',
  'schema_v1_signals.risk_level.humor_risk',
];

/**
 * Dynamically discover all numeric paths in a deep_analysis object
 * This handles any schema and extracts ALL numeric fields
 */
export function discoverNumericPaths(obj: any, prefix: string = ''): string[] {
  const paths: string[] = [];
  if (obj === null || obj === undefined) return paths;
  
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'number') {
      paths.push(path);
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...discoverNumericPaths(value, path));
    }
  }
  return paths;
}

/**
 * Get all unique numeric paths across multiple videos
 * Use this for dynamic schema discovery
 */
export function discoverAllNumericPaths(videos: Video[]): string[] {
  const allPaths = new Set<string>();
  
  // Sample first 20 videos for efficiency
  const sampleSize = Math.min(20, videos.length);
  for (let i = 0; i < sampleSize; i++) {
    const paths = discoverNumericPaths(videos[i].deep_analysis);
    paths.forEach(p => allPaths.add(p));
  }
  
  return Array.from(allPaths).sort();
}

/**
 * Safely get a nested value from an object using dot notation path
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
}

/**
 * Normalize a value to 0-1 range based on its type/context
 */
function normalizeValue(value: any, path: string): number | null {
  if (value === null || value === undefined) return null;
  
  // Already a number
  if (typeof value === 'number') {
    // Check if it's a 1-10 scale
    if (path.includes('_1_10') || path.includes('1_10')) {
      return value / 10;
    }
    // Check if it's a 0-1 scale
    if (path.includes('_0_1') || path.includes('0_1')) {
      return value;
    }
    // Check if it's a score that's already 0-10
    if (value >= 0 && value <= 10) {
      return value / 10;
    }
    // For things like cutsPerMinute, normalize assuming max ~30
    if (path.includes('cutsPerMinute')) {
      return Math.min(value / 30, 1);
    }
    return value;
  }
  
  // String that might be a number
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return normalizeValue(parsed, path);
    }
  }
  
  return null;
}

/**
 * Extract all numeric features from a video's deep_analysis
 * Uses both predefined paths AND dynamically discovers additional numeric fields
 */
export function extractNumericFeatures(video: Video, useDynamicDiscovery: boolean = true): Map<string, number> {
  const features = new Map<string, number>();
  const analysis = video.deep_analysis;
  
  if (!analysis) return features;
  
  // Start with known paths
  const pathsToCheck = [...NUMERIC_VARIABLE_PATHS];
  
  // Optionally add dynamically discovered paths
  if (useDynamicDiscovery) {
    const discoveredPaths = discoverNumericPaths(analysis);
    for (const path of discoveredPaths) {
      if (!pathsToCheck.includes(path)) {
        pathsToCheck.push(path);
      }
    }
  }
  
  for (const path of pathsToCheck) {
    const value = getNestedValue(analysis, path);
    const normalized = normalizeValue(value, path);
    if (normalized !== null) {
      features.set(path, normalized);
    }
  }
  
  return features;
}

/**
 * Build a map of video ID to Video object for fast lookups
 */
export function buildVideoMap(videos: Video[]): Map<string, Video> {
  return new Map(videos.map(v => [v.id, v]));
}

/**
 * Training row for correlation analysis
 */
export interface TrainingRow {
  comparison_id: string;
  dimension: string;
  confidence_weight: number;
  winner_id: string;
  loser_id: string;
  deltas: Map<string, number>; // winner_value - loser_value for each variable
  reasoning: string;
}

/**
 * Build training dataset from comparisons and video metadata
 */
export function buildTrainingDataset(
  comparisons: PairwiseComparison[],
  videoMap: Map<string, Video>
): TrainingRow[] {
  const rows: TrainingRow[] = [];
  
  for (const comparison of comparisons) {
    // Skip ties - we can't learn direction from them
    if (comparison.winner_id === null) continue;
    
    const winner = videoMap.get(comparison.winner_id);
    const loserId = comparison.winner_id === comparison.video_a_id 
      ? comparison.video_b_id 
      : comparison.video_a_id;
    const loser = videoMap.get(loserId);
    
    // Skip if we don't have both videos
    if (!winner || !loser) continue;
    
    const winnerFeatures = extractNumericFeatures(winner);
    const loserFeatures = extractNumericFeatures(loser);
    
    // Compute deltas: winner - loser
    const deltas = new Map<string, number>();
    const allPaths = new Set([...winnerFeatures.keys(), ...loserFeatures.keys()]);
    
    for (const path of allPaths) {
      const winnerVal = winnerFeatures.get(path);
      const loserVal = loserFeatures.get(path);
      
      if (winnerVal !== undefined && loserVal !== undefined) {
        deltas.set(path, winnerVal - loserVal);
      }
    }
    
    rows.push({
      comparison_id: comparison.id,
      dimension: comparison.dimension,
      confidence_weight: CONFIDENCE_WEIGHTS[comparison.confidence] || 0.5,
      winner_id: comparison.winner_id,
      loser_id: loserId,
      deltas,
      reasoning: comparison.reasoning,
    });
  }
  
  return rows;
}

/**
 * Variable correlation result
 */
export interface VariableCorrelation {
  path: string;
  correlation: number;        // Weighted correlation with winning
  pValue: number;             // Statistical significance
  direction: 'higher_wins' | 'lower_wins' | 'neutral';
  sampleCount: number;        // Number of comparisons with this variable
  meanDelta: number;          // Average winner-loser difference
  stdDelta: number;           // Standard deviation of deltas
  effectSize: number;         // Cohen's d effect size
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
}

/**
 * Calculate Pearson correlation coefficient
 */
function pearsonCorrelation(x: number[], y: number[], weights?: number[]): number {
  const n = x.length;
  if (n === 0) return 0;
  
  // Use weights or default to 1
  const w = weights || x.map(() => 1);
  const totalWeight = w.reduce((a, b) => a + b, 0);
  
  // Weighted means
  const meanX = x.reduce((sum, xi, i) => sum + xi * w[i], 0) / totalWeight;
  const meanY = y.reduce((sum, yi, i) => sum + yi * w[i], 0) / totalWeight;
  
  // Weighted covariance and variances
  let cov = 0, varX = 0, varY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    cov += w[i] * dx * dy;
    varX += w[i] * dx * dx;
    varY += w[i] * dy * dy;
  }
  
  if (varX === 0 || varY === 0) return 0;
  return cov / Math.sqrt(varX * varY);
}

/**
 * Calculate p-value using t-distribution approximation
 */
function calculatePValue(correlation: number, n: number): number {
  if (n <= 2) return 1;
  
  const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation + 0.0001));
  const df = n - 2;
  
  // Approximation of two-tailed p-value
  const absT = Math.abs(t);
  const p = Math.exp(-0.717 * absT - 0.416 * absT * absT);
  return Math.min(p * 2, 1); // Two-tailed
}

/**
 * Run correlation analysis on training data
 */
export function runCorrelationAnalysis(
  trainingData: TrainingRow[],
  dimension: string = 'overall'
): VariableCorrelation[] {
  // Filter by dimension
  const filtered = dimension === 'all' 
    ? trainingData 
    : trainingData.filter(r => r.dimension === dimension);
  
  if (filtered.length === 0) return [];
  
  // Collect all variable paths
  const allPaths = new Set<string>();
  filtered.forEach(row => row.deltas.forEach((_, path) => allPaths.add(path)));
  
  const results: VariableCorrelation[] = [];
  
  for (const path of allPaths) {
    // Collect deltas and weights for this variable
    const deltas: number[] = [];
    const weights: number[] = [];
    
    for (const row of filtered) {
      const delta = row.deltas.get(path);
      if (delta !== undefined) {
        deltas.push(delta);
        weights.push(row.confidence_weight);
      }
    }
    
    if (deltas.length < 5) {
      // Insufficient data
      results.push({
        path,
        correlation: 0,
        pValue: 1,
        direction: 'neutral',
        sampleCount: deltas.length,
        meanDelta: 0,
        stdDelta: 0,
        effectSize: 0,
        confidence: 'insufficient',
      });
      continue;
    }
    
    // Target is always 1 (winner wins) - we're measuring if positive delta predicts winning
    const target = deltas.map(() => 1);
    
    // Calculate weighted mean and std of deltas
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const meanDelta = deltas.reduce((sum, d, i) => sum + d * weights[i], 0) / totalWeight;
    const variance = deltas.reduce((sum, d, i) => sum + weights[i] * (d - meanDelta) ** 2, 0) / totalWeight;
    const stdDelta = Math.sqrt(variance);
    
    // Correlation: positive delta should correlate with winning
    // Since target is always 1, we're really measuring if deltas are positive
    const correlation = meanDelta / (stdDelta + 0.001); // Normalized mean
    const normalizedCorr = Math.tanh(correlation); // Bound to [-1, 1]
    
    const pValue = calculatePValue(normalizedCorr, deltas.length);
    
    // Effect size (Cohen's d)
    const effectSize = stdDelta > 0 ? Math.abs(meanDelta) / stdDelta : 0;
    
    // Determine direction
    let direction: 'higher_wins' | 'lower_wins' | 'neutral' = 'neutral';
    if (Math.abs(meanDelta) > 0.02 && pValue < 0.2) {
      direction = meanDelta > 0 ? 'higher_wins' : 'lower_wins';
    }
    
    // Confidence level
    let confidence: 'high' | 'medium' | 'low' | 'insufficient';
    if (deltas.length >= 30 && pValue < 0.05) {
      confidence = 'high';
    } else if (deltas.length >= 15 && pValue < 0.1) {
      confidence = 'medium';
    } else if (deltas.length >= 5) {
      confidence = 'low';
    } else {
      confidence = 'insufficient';
    }
    
    results.push({
      path,
      correlation: normalizedCorr,
      pValue,
      direction,
      sampleCount: deltas.length,
      meanDelta,
      stdDelta,
      effectSize,
      confidence,
    });
  }
  
  // Sort by absolute effect size
  results.sort((a, b) => Math.abs(b.effectSize) - Math.abs(a.effectSize));
  
  return results;
}

/**
 * Logistic regression coefficients for interpretability
 */
export interface LogisticRegressionResult {
  coefficients: Map<string, number>;
  intercept: number;
  accuracy: number;
  topPredictors: Array<{ path: string; weight: number; direction: string }>;
}

/**
 * Simple logistic regression using gradient descent
 * Regularized with L2 to prevent overfitting on small datasets
 */
export function runLogisticRegression(
  trainingData: TrainingRow[],
  dimension: string = 'overall',
  learningRate: number = 0.1,
  iterations: number = 1000,
  lambda: number = 0.1 // L2 regularization
): LogisticRegressionResult {
  const filtered = dimension === 'all' 
    ? trainingData 
    : trainingData.filter(r => r.dimension === dimension);
  
  if (filtered.length < 10) {
    return {
      coefficients: new Map(),
      intercept: 0,
      accuracy: 0,
      topPredictors: [],
    };
  }
  
  // Get all variable paths present in data
  const allPaths = new Set<string>();
  filtered.forEach(row => row.deltas.forEach((_, path) => allPaths.add(path)));
  const paths = Array.from(allPaths);
  
  // Build feature matrix X and weights W
  const X: number[][] = [];
  const W: number[] = [];
  
  for (const row of filtered) {
    const features = paths.map(p => row.deltas.get(p) ?? 0);
    X.push(features);
    W.push(row.confidence_weight);
  }
  
  // Initialize coefficients
  const coeffs = new Array(paths.length).fill(0);
  let intercept = 0;
  
  // Sigmoid function
  const sigmoid = (z: number) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z))));
  
  // Gradient descent
  for (let iter = 0; iter < iterations; iter++) {
    const gradCoeffs = new Array(paths.length).fill(0);
    let gradIntercept = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < X.length; i++) {
      const features = X[i];
      const weight = W[i];
      
      // Forward pass
      const z = intercept + features.reduce((sum, f, j) => sum + f * coeffs[j], 0);
      const pred = sigmoid(z);
      
      // Error (target is always 1 - winner wins)
      const error = (pred - 1) * weight;
      
      // Gradients
      gradIntercept += error;
      for (let j = 0; j < paths.length; j++) {
        gradCoeffs[j] += error * features[j] + lambda * coeffs[j]; // L2 regularization
      }
      totalWeight += weight;
    }
    
    // Update
    intercept -= learningRate * gradIntercept / totalWeight;
    for (let j = 0; j < paths.length; j++) {
      coeffs[j] -= learningRate * gradCoeffs[j] / totalWeight;
    }
  }
  
  // Calculate accuracy
  let correct = 0;
  let total = 0;
  for (let i = 0; i < X.length; i++) {
    const z = intercept + X[i].reduce((sum, f, j) => sum + f * coeffs[j], 0);
    const pred = sigmoid(z) > 0.5 ? 1 : 0;
    correct += pred === 1 ? W[i] : 0;
    total += W[i];
  }
  const accuracy = total > 0 ? correct / total : 0;
  
  // Build result
  const coeffMap = new Map<string, number>();
  paths.forEach((p, i) => coeffMap.set(p, coeffs[i]));
  
  // Get top predictors
  const topPredictors = paths
    .map((p, i) => ({
      path: p,
      weight: coeffs[i],
      direction: coeffs[i] > 0 ? 'higher_wins' : 'lower_wins',
    }))
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 15);
  
  return {
    coefficients: coeffMap,
    intercept,
    accuracy,
    topPredictors,
  };
}

/**
 * Reasoning text analysis to extract hidden themes
 */
export interface ReasoningTheme {
  term: string;
  frequency: number;
  associatedWins: string[]; // video IDs that won when this term was mentioned
  associatedLosses: string[]; // video IDs that lost when this term was mentioned
  contexts: string[]; // Example snippets
}

/**
 * Extract themes from comparison reasoning text
 */
export function analyzeReasoningText(
  trainingData: TrainingRow[]
): ReasoningTheme[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'that', 'which', 'this', 'these', 'those', 'what', 'who', 'whom',
    'with', 'for', 'from', 'to', 'of', 'in', 'on', 'at', 'by', 'about',
    'but', 'and', 'or', 'so', 'if', 'then', 'than', 'as', 'also',
    'video', 'first', 'second', 'one', 'other', 'both', 'more', 'less',
    'very', 'really', 'just', 'only', 'even', 'still', 'already',
    'not', 'no', 'none', 'nor', 'neither',
    'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'them',
  ]);
  
  // Important terms we want to track (domain-specific)
  const importantTerms = new Set([
    'replicable', 'replicability', 'replicate', 'replication',
    'premise', 'concept', 'idea', 'creative', 'creativity', 'original', 'originality',
    'humor', 'humour', 'funny', 'amusing', 'comedic', 'comedy', 'joke',
    'acting', 'performance', 'performer', 'actor', 'energy', 'charisma',
    'pacing', 'tempo', 'rhythm', 'flow', 'fast', 'slow', 'quick',
    'editing', 'edit', 'cuts', 'transitions', 'production',
    'engaging', 'engagement', 'attention', 'captivating', 'hook',
    'payoff', 'punchline', 'reveal', 'twist', 'surprise',
    'absurd', 'absurdism', 'absurdist', 'surreal',
    'relatable', 'relatability', 'authentic', 'genuine',
    'clever', 'smart', 'witty', 'intelligent',
    'simple', 'complex', 'easy', 'difficult', 'hard',
    'attractive', 'aesthetic', 'visual', 'visually',
  ]);
  
  const termData = new Map<string, {
    count: number;
    wins: Set<string>;
    losses: Set<string>;
    contexts: string[];
  }>();
  
  for (const row of trainingData) {
    const text = row.reasoning.toLowerCase();
    const words = text.split(/\W+/).filter(w => w.length > 2);
    
    // Also extract bigrams for phrases
    const bigrams: string[] = [];
    for (let i = 0; i < words.length - 1; i++) {
      bigrams.push(`${words[i]} ${words[i+1]}`);
    }
    
    const allTerms = [...words, ...bigrams];
    const seenInRow = new Set<string>();
    
    for (const term of allTerms) {
      // Skip stop words (for single words)
      if (!term.includes(' ') && stopWords.has(term)) continue;
      
      // Track important terms or any term that appears multiple times
      if (!seenInRow.has(term)) {
        seenInRow.add(term);
        
        if (!termData.has(term)) {
          termData.set(term, {
            count: 0,
            wins: new Set(),
            losses: new Set(),
            contexts: [],
          });
        }
        
        const data = termData.get(term)!;
        data.count++;
        data.wins.add(row.winner_id);
        data.losses.add(row.loser_id);
        
        // Store context snippet (first occurrence)
        if (data.contexts.length < 3) {
          const idx = text.indexOf(term);
          if (idx >= 0) {
            const start = Math.max(0, idx - 30);
            const end = Math.min(text.length, idx + term.length + 30);
            data.contexts.push('...' + text.slice(start, end) + '...');
          }
        }
      }
    }
  }
  
  // Convert to array and filter
  const results: ReasoningTheme[] = [];
  
  termData.forEach((data, term) => {
    // Only include terms that appear at least twice or are important
    if (data.count >= 2 || importantTerms.has(term.split(' ')[0])) {
      results.push({
        term,
        frequency: data.count,
        associatedWins: Array.from(data.wins),
        associatedLosses: Array.from(data.losses),
        contexts: data.contexts,
      });
    }
  });
  
  // Sort by frequency
  results.sort((a, b) => b.frequency - a.frequency);
  
  return results.slice(0, 50); // Top 50 themes
}

/**
 * Identify potential hidden variables from reasoning analysis
 */
export interface HiddenVariableCandidate {
  name: string;
  description: string;
  evidence: string[];
  frequency: number;
  suggestedPath: string; // Where it might fit in deep_analysis schema
}

export function identifyHiddenVariables(
  themes: ReasoningTheme[],
  correlations: VariableCorrelation[]
): HiddenVariableCandidate[] {
  const candidates: HiddenVariableCandidate[] = [];
  
  // Terms that appear frequently but don't have corresponding high-correlation variables
  const highCorrelationPaths = new Set(
    correlations
      .filter(c => c.confidence !== 'insufficient' && Math.abs(c.effectSize) > 0.3)
      .map(c => c.path.toLowerCase())
  );
  
  // Themes that might represent hidden variables
  const hiddenConcepts: Record<string, { 
    terms: string[]; 
    suggestedPath: string; 
    description: string;
  }> = {
    'replicability_ease': {
      terms: ['replicable', 'replicability', 'replicate', 'easy', 'simple', 'accessible'],
      suggestedPath: 'script.replicability.ease_score',
      description: 'How easy it would be for a brand to recreate this video format',
    },
    'premise_strength': {
      terms: ['premise', 'concept', 'idea', 'clever', 'smart', 'creative'],
      suggestedPath: 'script.premise.strength',
      description: 'The core concept or hook that makes the video interesting',
    },
    'performance_quality': {
      terms: ['acting', 'performance', 'performer', 'charisma', 'energy', 'presence'],
      suggestedPath: 'execution.performance_quality',
      description: 'How well the on-screen talent performs their role',
    },
    'comedic_execution': {
      terms: ['timing', 'punchline', 'payoff', 'delivery', 'comedic', 'funny'],
      suggestedPath: 'script.humor.execution_quality',
      description: 'The execution quality of comedic elements, not just presence of humor',
    },
    'visual_appeal': {
      terms: ['attractive', 'aesthetic', 'visually', 'beautiful', 'pleasing'],
      suggestedPath: 'visual.aesthetic_appeal',
      description: 'Visual attractiveness beyond technical quality',
    },
  };
  
  for (const [name, config] of Object.entries(hiddenConcepts)) {
    const matchingThemes = themes.filter(t => 
      config.terms.some(term => t.term.includes(term))
    );
    
    if (matchingThemes.length > 0) {
      const totalFreq = matchingThemes.reduce((sum, t) => sum + t.frequency, 0);
      
      // Check if this is already captured by a variable
      const alreadyCaptured = config.terms.some(term => 
        Array.from(highCorrelationPaths).some(path => path.includes(term))
      );
      
      if (!alreadyCaptured || totalFreq > 5) {
        candidates.push({
          name: name.replace(/_/g, ' '),
          description: config.description,
          evidence: matchingThemes.flatMap(t => t.contexts).slice(0, 3),
          frequency: totalFreq,
          suggestedPath: config.suggestedPath,
        });
      }
    }
  }
  
  // Sort by frequency
  candidates.sort((a, b) => b.frequency - a.frequency);
  
  return candidates;
}

/**
 * Complete analysis results for export to hagen fingerprint system
 */
export interface SigmaTasteAnalysis {
  version: string;
  analyzedAt: string;
  sampleSize: {
    totalComparisons: number;
    withWinner: number;
    byDimension: Record<string, number>;
  };
  variableImportance: VariableCorrelation[];
  logisticRegression: LogisticRegressionResult;
  reasoningThemes: ReasoningTheme[];
  hiddenVariableCandidates: HiddenVariableCandidate[];
  recommendations: string[];
}

/**
 * Run complete analysis and generate export
 */
export function runFullAnalysis(
  comparisons: PairwiseComparison[],
  videos: Video[],
  dimension: string = 'overall'
): SigmaTasteAnalysis {
  const videoMap = buildVideoMap(videos);
  const trainingData = buildTrainingDataset(comparisons, videoMap);
  
  // Count by dimension
  const byDimension: Record<string, number> = {};
  trainingData.forEach(r => {
    byDimension[r.dimension] = (byDimension[r.dimension] || 0) + 1;
  });
  
  // Run analyses
  const correlations = runCorrelationAnalysis(trainingData, dimension);
  const logistic = runLogisticRegression(trainingData, dimension);
  const themes = analyzeReasoningText(trainingData);
  const hiddenVars = identifyHiddenVariables(themes, correlations);
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  // Sample size recommendation
  if (trainingData.length < 100) {
    recommendations.push(
      `Current sample size (${trainingData.length}) is limited. Target 500+ comparisons for robust statistical confidence.`
    );
  }
  
  // Top predictors
  const topPositive = correlations
    .filter(c => c.direction === 'higher_wins' && c.confidence !== 'insufficient')
    .slice(0, 3);
  const topNegative = correlations
    .filter(c => c.direction === 'lower_wins' && c.confidence !== 'insufficient')
    .slice(0, 3);
  
  if (topPositive.length > 0) {
    recommendations.push(
      `Variables that predict winning: ${topPositive.map(c => c.path.split('.').pop()).join(', ')}`
    );
  }
  
  if (topNegative.length > 0) {
    recommendations.push(
      `Variables where LOWER is better: ${topNegative.map(c => c.path.split('.').pop()).join(', ')}`
    );
  }
  
  // Weak predictors
  const weakPredictors = correlations
    .filter(c => c.sampleCount >= 10 && Math.abs(c.effectSize) < 0.1)
    .slice(0, 5);
  
  if (weakPredictors.length > 0) {
    recommendations.push(
      `Variables with no predictive power (consider removing): ${weakPredictors.map(c => c.path.split('.').pop()).join(', ')}`
    );
  }
  
  // Hidden variables
  if (hiddenVars.length > 0) {
    recommendations.push(
      `Potential hidden variables found: ${hiddenVars.map(h => h.name).join(', ')}`
    );
  }
  
  return {
    version: '1.0.0',
    analyzedAt: new Date().toISOString(),
    sampleSize: {
      totalComparisons: comparisons.length,
      withWinner: trainingData.length,
      byDimension,
    },
    variableImportance: correlations,
    logisticRegression: logistic,
    reasoningThemes: themes,
    hiddenVariableCandidates: hiddenVars,
    recommendations,
  };
}

/**
 * Export analysis results in a format suitable for hagen's fingerprint system
 */
export function exportForFingerprint(analysis: SigmaTasteAnalysis): object {
  return {
    version: analysis.version,
    analyzedAt: analysis.analyzedAt,
    sampleSize: analysis.sampleSize,
    
    // Variable weights for fingerprint scoring
    variableWeights: Object.fromEntries(
      analysis.logisticRegression.topPredictors.map(p => [
        p.path,
        { weight: p.weight, direction: p.direction }
      ])
    ),
    
    // Recommended variable adjustments
    adjustments: {
      increase_weight: analysis.variableImportance
        .filter(v => v.direction === 'higher_wins' && v.confidence === 'high')
        .map(v => v.path),
      decrease_weight: analysis.variableImportance
        .filter(v => v.direction === 'lower_wins' && v.confidence === 'high')
        .map(v => v.path),
      remove_or_review: analysis.variableImportance
        .filter(v => v.sampleCount >= 20 && Math.abs(v.effectSize) < 0.05)
        .map(v => v.path),
    },
    
    // Hidden variables to add
    proposedNewVariables: analysis.hiddenVariableCandidates.map(h => ({
      name: h.name,
      path: h.suggestedPath,
      description: h.description,
      evidence: h.evidence,
    })),
    
    // Human reasoning patterns
    commonThemes: analysis.reasoningThemes.slice(0, 20).map(t => ({
      term: t.term,
      frequency: t.frequency,
    })),
    
    recommendations: analysis.recommendations,
  };
}
