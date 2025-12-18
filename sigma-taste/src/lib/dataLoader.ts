/**
 * Data Loader Utilities — v1.2
 * 
 * Functions to load and merge data from v1.2 export files
 * Updated: 2025-12-18 for alignment with Hagen integration package
 */

import type { Video, PairwiseComparison } from '@/types';

// Default path for v1.2 dataset
export const V1_2_DATASET_PATH = '/exports/v1.2/dataset_2025-12-18.json';
export const V1_2_COMPARISONS_PATH = '/exports/v1.1/sigma-taste-export-2025-12-16.json';

/**
 * Load videos from dataset export file
 * Handles the format from exports/v1.2/dataset_2025-12-18.json
 */
export async function loadVideosFromDataset(url: string): Promise<Video[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    
    const data = await response.json();
    
    // Validate schema version
    const firstVideo = data.videos?.[0] || data[0];
    if (firstVideo?.deep_analysis?.schema_version) {
      console.log(`[DataLoader] Detected schema version: ${firstVideo.deep_analysis.schema_version}`);
    }
    
    // Handle different export formats
    if (data.videos && Array.isArray(data.videos)) {
      return data.videos.map(normalizeVideo);
    }
    
    if (Array.isArray(data)) {
      return data.map(normalizeVideo);
    }
    
    throw new Error('Unknown data format');
  } catch (error) {
    console.error('Error loading videos:', error);
    return [];
  }
}

/**
 * Load comparisons from sigma-taste export file
 * Handles the format from sigma-taste-export-*.json
 */
export async function loadComparisonsFromExport(url: string): Promise<PairwiseComparison[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    
    const data = await response.json();
    
    // Handle different export formats
    if (data.comparisons && Array.isArray(data.comparisons)) {
      return data.comparisons.map(normalizeComparison);
    }
    
    if (Array.isArray(data)) {
      return data.map(normalizeComparison);
    }
    
    throw new Error('Unknown data format');
  } catch (error) {
    console.error('Error loading comparisons:', error);
    return [];
  }
}

/**
 * Normalize video data to match our Video type (v1.2)
 * Handles the schema_v1_signals structure from Vertex AI analysis
 */
function normalizeVideo(raw: any): Video {
  const deepAnalysis = raw.deep_analysis || raw.visual_analysis || {};
  
  return {
    id: raw.id,
    video_url: raw.video_url || raw.metadata?.url || '',
    platform: raw.platform || 'unknown',
    metadata: raw.metadata || {
      url: raw.video_url || '',
      videoId: raw.video_id || raw.id,
      platform: raw.platform || 'unknown',
      provider: 'unknown',
    },
    deep_analysis: {
      ...deepAnalysis,
      // Ensure schema_version is present
      schema_version: deepAnalysis.schema_version || 1,
    },
    gcs_uri: raw.gcs_uri || raw.signed_url || null,
    created_at: raw.created_at || new Date().toISOString(),
    analyzed_at: raw.analyzed_at || raw.created_at || new Date().toISOString(),
    rating: raw.rating || null,
    ai_prediction: raw.ai_prediction || deepAnalysis,
  };
}

/**
 * Normalize comparison data to match our PairwiseComparison type
 */
function normalizeComparison(raw: any): PairwiseComparison {
  return {
    id: raw.id,
    video_a_id: raw.video_a_id,
    video_b_id: raw.video_b_id,
    winner_id: raw.winner_id,
    dimension: raw.dimension || 'overall',
    confidence: raw.confidence || 'somewhat',
    reasoning: raw.reasoning || '',
    created_at: raw.created_at || new Date().toISOString(),
  };
}

/**
 * Parse file input and extract data
 */
export function parseFileContent(content: string): { videos?: Video[]; comparisons?: PairwiseComparison[] } {
  try {
    const data = JSON.parse(content);
    
    const result: { videos?: Video[]; comparisons?: PairwiseComparison[] } = {};
    
    // Check for videos
    if (data.videos && Array.isArray(data.videos)) {
      result.videos = data.videos.map(normalizeVideo);
    }
    
    // Check for comparisons
    if (data.comparisons && Array.isArray(data.comparisons)) {
      result.comparisons = data.comparisons.map(normalizeComparison);
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing file:', error);
    return {};
  }
}

/**
 * Match comparisons with videos by UUID
 * Returns stats about matching
 */
export function matchComparisonsWithVideos(
  comparisons: PairwiseComparison[],
  videos: Video[]
): {
  matched: number;
  unmatched: number;
  missingVideoIds: string[];
  comparisonCoverage: Map<string, { wins: number; losses: number; ties: number }>;
} {
  const videoIds = new Set(videos.map(v => v.id));
  const missingVideoIds = new Set<string>();
  let matched = 0;
  let unmatched = 0;
  
  const coverage = new Map<string, { wins: number; losses: number; ties: number }>();
  
  for (const comparison of comparisons) {
    const hasA = videoIds.has(comparison.video_a_id);
    const hasB = videoIds.has(comparison.video_b_id);
    
    if (hasA && hasB) {
      matched++;
      
      // Track coverage
      for (const id of [comparison.video_a_id, comparison.video_b_id]) {
        if (!coverage.has(id)) {
          coverage.set(id, { wins: 0, losses: 0, ties: 0 });
        }
        const stats = coverage.get(id)!;
        
        if (comparison.winner_id === null) {
          stats.ties++;
        } else if (comparison.winner_id === id) {
          stats.wins++;
        } else {
          stats.losses++;
        }
      }
    } else {
      unmatched++;
      if (!hasA) missingVideoIds.add(comparison.video_a_id);
      if (!hasB) missingVideoIds.add(comparison.video_b_id);
    }
  }
  
  return {
    matched,
    unmatched,
    missingVideoIds: Array.from(missingVideoIds),
    comparisonCoverage: coverage,
  };
}

/**
 * Get Bradley-Terry rankings from comparisons
 */
export function calculateRankings(
  comparisons: PairwiseComparison[],
  videos: Video[]
): Array<{ video: Video; score: number; wins: number; losses: number; ties: number }> {
  const videoMap = new Map(videos.map(v => [v.id, v]));
  const stats = new Map<string, { wins: number; losses: number; ties: number }>();
  
  // Initialize stats for all videos
  for (const video of videos) {
    stats.set(video.id, { wins: 0, losses: 0, ties: 0 });
  }
  
  // Count wins/losses/ties
  for (const c of comparisons) {
    const statsA = stats.get(c.video_a_id);
    const statsB = stats.get(c.video_b_id);
    
    if (!statsA || !statsB) continue;
    
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
  }
  
  // Calculate Bradley-Terry style scores
  const rankings: Array<{ video: Video; score: number; wins: number; losses: number; ties: number }> = [];
  
  for (const [id, s] of stats) {
    const video = videoMap.get(id);
    if (!video) continue;
    
    const total = s.wins + s.losses + s.ties;
    const score = total > 0 ? (s.wins + s.ties * 0.5) / total : 0.5;
    
    rankings.push({
      video,
      score,
      wins: s.wins,
      losses: s.losses,
      ties: s.ties,
    });
  }
  
  // Sort by score descending
  rankings.sort((a, b) => b.score - a.score);
  
  return rankings;
}
