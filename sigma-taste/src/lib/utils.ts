import type { Video, VideoCluster, HiddenVariable, SigmaTasteWeights, PairwiseComparison } from '@/types';

/**
 * Export the learned σTaste configuration as a pluggable JSON
 */
export interface SigmaTasteExport {
  version: string;
  exported_at: string;
  weights: SigmaTasteWeights;
  hidden_variables: HiddenVariable[];
  clusters: Array<{
    name: string;
    description: string;
    defining_signals: string[];
    example_count: number;
  }>;
  comparison_stats: {
    total: number;
    by_dimension: Record<string, number>;
  };
  training_data_summary: {
    video_count: number;
    rated_count: number;
    average_score: number;
  };
}

export function createExport(
  comparisons: PairwiseComparison[],
  clusterCorrections: any[],
  hiddenVariables: HiddenVariable[],
  weights: SigmaTasteWeights,
  clusters: VideoCluster[] = [],
  videos: Video[] = []
): any {
  const ratedVideos = videos.filter(v => v.rating?.overall_score !== undefined);
  const avgScore = ratedVideos.length > 0
    ? ratedVideos.reduce((sum, v) => sum + (v.rating?.overall_score ?? 0), 0) / ratedVideos.length
    : 0;
  
  const comparisonsByDimension: Record<string, number> = {};
  comparisons.forEach(c => {
    comparisonsByDimension[c.dimension] = (comparisonsByDimension[c.dimension] || 0) + 1;
  });
  
  return {
    version: '1.0.0',
    
    // Your comparison data (this is what you want!)
    comparisons: comparisons.map(c => ({
      id: c.id,
      video_a_id: c.video_a_id,
      video_b_id: c.video_b_id,
      winner_id: c.winner_id,
      dimension: c.dimension,
      confidence: c.confidence,
      reasoning: c.reasoning,
      created_at: c.created_at,
    })),
    
    cluster_corrections: clusterCorrections,
    hidden_variables: hiddenVariables,
    weights,
    
    // Stats
    stats: {
      total_comparisons: comparisons.length,
      by_dimension: comparisonsByDimension,
      video_count: videos.length,
      rated_count: ratedVideos.length,
      average_score: avgScore,
    },
    
    // Clusters (if any)
    clusters: clusters.map(c => ({
      name: c.name,
      description: c.description,
      defining_signals: c.defining_signals,
      example_count: c.video_ids.length,
    })),
  };
}

export function downloadJson(data: object, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Calculate divergence score between AI prediction and human rating
 */
export function calculateDivergence(video: Video): number | null {
  if (!video.rating?.overall_score) return null;
  
  const aiScore = video.deep_analysis?.engagement?.replayValue;
  if (aiScore === undefined || aiScore === null) return null;
  
  return video.rating.overall_score - (aiScore / 10);
}

/**
 * Extract feature vector from video for clustering/similarity
 */
export function extractFeatureVector(video: Video): number[] {
  const analysis = video.deep_analysis;
  
  return [
    // Engagement features
    (analysis?.engagement?.replayValue ?? 5) / 10,
    (analysis?.engagement?.shareability ?? 5) / 10,
    (analysis?.engagement?.scrollStopPower ?? 5) / 10,
    
    // Technical features
    (analysis?.technical?.pacing ?? 5) / 10,
    (analysis?.visual?.hookStrength ?? 5) / 10,
    (analysis?.visual?.overallQuality ?? 5) / 10,
    
    // Content features (v1.2 uses nested objects)
    analysis?.script?.humor?.isHumorous ? 1 : 0,
    (analysis?.script?.originality?.score ?? 5) / 10,
    (analysis?.trends?.timelessness ?? 5) / 10,
    
    // Rating if available
    video.rating?.overall_score ?? 0.5,
  ];
}

/**
 * Compute cosine similarity between two feature vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Build preference graph from pairwise comparisons
 */
export function buildPreferenceGraph(
  comparisons: PairwiseComparison[]
): Map<string, { wins: number; losses: number; ties: number }> {
  const stats = new Map<string, { wins: number; losses: number; ties: number }>();
  
  const getStats = (id: string) => {
    if (!stats.has(id)) {
      stats.set(id, { wins: 0, losses: 0, ties: 0 });
    }
    return stats.get(id)!;
  };
  
  comparisons.forEach(c => {
    const statsA = getStats(c.video_a_id);
    const statsB = getStats(c.video_b_id);
    
    if (c.winner_id === null) {
      statsA.ties++;
      statsB.ties++;
    } else if (c.winner_id === c.video_a_id) {
      statsA.wins++;
      statsB.losses++;
    } else {
      statsB.wins++;
      statsA.losses++;
    }
  });
  
  return stats;
}

/**
 * Calculate Bradley-Terry style scores from preference data
 */
export function calculateBradleyTerryScores(
  preferenceGraph: Map<string, { wins: number; losses: number; ties: number }>
): Map<string, number> {
  const scores = new Map<string, number>();
  
  preferenceGraph.forEach((stats, videoId) => {
    const total = stats.wins + stats.losses + stats.ties;
    if (total === 0) {
      scores.set(videoId, 0.5);
    } else {
      // Simple win rate with tie consideration
      const score = (stats.wins + stats.ties * 0.5) / total;
      scores.set(videoId, score);
    }
  });
  
  return scores;
}

/**
 * Find videos that would be most informative to compare
 * (those with similar scores but potentially different hidden qualities)
 */
export function findInformativePairs(
  videos: Video[],
  existingComparisons: PairwiseComparison[],
  dimension: string,
  count: number = 10
): Array<{ videoA: Video; videoB: Video }> {
  const ratedVideos = videos.filter(v => v.rating?.overall_score !== undefined);
  
  // Get videos not yet compared in this dimension
  const comparedPairs = new Set(
    existingComparisons
      .filter(c => c.dimension === dimension)
      .map(c => [c.video_a_id, c.video_b_id].sort().join('|'))
  );
  
  const pairs: Array<{ videoA: Video; videoB: Video; scoreDiff: number }> = [];
  
  for (let i = 0; i < ratedVideos.length; i++) {
    for (let j = i + 1; j < ratedVideos.length; j++) {
      const a = ratedVideos[i];
      const b = ratedVideos[j];
      const pairKey = [a.id, b.id].sort().join('|');
      
      if (comparedPairs.has(pairKey)) continue;
      
      const scoreDiff = Math.abs(
        (a.rating?.overall_score ?? 0.5) - (b.rating?.overall_score ?? 0.5)
      );
      
      // Prioritize pairs with similar scores (more informative)
      pairs.push({ videoA: a, videoB: b, scoreDiff });
    }
  }
  
  // Shuffle pairs first to ensure true randomness, then sort by score difference
  // Fisher-Yates shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  
  // Sort by score difference (lower = more informative) with significant randomness
  // Use higher random factor (0.3) to ensure variety while still preferring informative pairs
  pairs.sort((a, b) => {
    const aDiff = a.scoreDiff + Math.random() * 0.3;
    const bDiff = b.scoreDiff + Math.random() * 0.3;
    return aDiff - bDiff;
  });
  
  // Ensure we don't repeat the same videos too often in a batch
  const selectedPairs: Array<{ videoA: Video; videoB: Video }> = [];
  const usedVideoIds = new Set<string>();
  
  for (const pair of pairs) {
    if (selectedPairs.length >= count) break;
    
    // Limit how often each video appears (max 2 times per batch)
    const aCount = [...usedVideoIds].filter(id => id === pair.videoA.id).length;
    const bCount = [...usedVideoIds].filter(id => id === pair.videoB.id).length;
    
    if (aCount < 2 && bCount < 2) {
      selectedPairs.push({ videoA: pair.videoA, videoB: pair.videoB });
      usedVideoIds.add(pair.videoA.id);
      usedVideoIds.add(pair.videoB.id);
    }
  }
  
  // If we couldn't fill the count with the diversity constraint, add more
  if (selectedPairs.length < count) {
    for (const pair of pairs) {
      if (selectedPairs.length >= count) break;
      const alreadySelected = selectedPairs.some(
        p => (p.videoA.id === pair.videoA.id && p.videoB.id === pair.videoB.id) ||
             (p.videoA.id === pair.videoB.id && p.videoB.id === pair.videoA.id)
      );
      if (!alreadySelected) {
        selectedPairs.push({ videoA: pair.videoA, videoB: pair.videoB });
      }
    }
  }
  
  return selectedPairs;
}

/**
 * Extract common patterns from hidden variable descriptions
 */
export function analyzeHiddenVariablePatterns(
  hiddenVariables: HiddenVariable[]
): { themes: string[]; frequency: Map<string, number> } {
  const wordFrequency = new Map<string, number>();
  
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'that', 'which', 'this', 'with', 'for', 'from', 'to', 'of', 'in', 'on', 'at']);
  
  hiddenVariables.forEach(v => {
    const text = `${v.name} ${v.description}`.toLowerCase();
    const words = text.split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w));
    
    words.forEach(word => {
      wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
    });
  });
  
  // Get top themes
  const sorted = Array.from(wordFrequency.entries())
    .sort((a, b) => b[1] - a[1]);
  
  const themes = sorted.slice(0, 10).map(([word]) => word);
  
  return { themes, frequency: wordFrequency };
}
