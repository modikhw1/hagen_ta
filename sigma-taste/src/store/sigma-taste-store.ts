import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Video, 
  PairwiseComparison, 
  VideoCluster, 
  ClusterCorrection,
  HiddenVariable,
  SigmaTasteWeights,
  VideoProjection 
} from '@/types';
import { findInformativePairs } from '@/lib/utils';

interface SigmaTasteState {
  // Data
  videos: Video[];
  projections: VideoProjection[];
  clusters: VideoCluster[];
  comparisons: PairwiseComparison[];
  clusterCorrections: ClusterCorrection[];
  hiddenVariables: HiddenVariable[];
  
  // Weights Configuration
  weights: SigmaTasteWeights;
  
  // UI State
  selectedVideoIds: string[];
  activeClusterId: string | null;
  comparisonQueue: Array<{ videoA: Video; videoB: Video; dimension: string }>;
  adversarialQueue: Video[];
  
  // Actions - Data Loading
  setVideos: (videos: Video[]) => void;
  setProjections: (projections: VideoProjection[]) => void;
  setClusters: (clusters: VideoCluster[]) => void;
  
  // Actions - Comparisons
  addComparison: (comparison: PairwiseComparison) => void;
  generateComparisonQueue: (dimension: string, count: number) => void;
  nextComparison: () => { videoA: Video; videoB: Video; dimension: string } | null;
  
  // Actions - Clusters
  moveVideoToCluster: (videoId: string, fromClusterId: string, toClusterId: string, reason: string, hiddenVar: string) => void;
  createCluster: (cluster: Omit<VideoCluster, 'id'>) => void;
  
  // Actions - Hidden Variables
  addHiddenVariable: (variable: Omit<HiddenVariable, 'id' | 'created_at'>) => void;
  
  // Actions - Weights
  setWeight: (dimension: string, value: number) => void;
  addCustomDimension: (name: string, weight: number) => void;
  removeCustomDimension: (name: string) => void;
  
  // Actions - Selection
  selectVideo: (videoId: string) => void;
  deselectVideo: (videoId: string) => void;
  clearSelection: () => void;
  setActiveCluster: (clusterId: string | null) => void;
  
  // Actions - Adversarial
  setAdversarialQueue: (videos: Video[]) => void;
  resolveAdversarial: (videoId: string, notes: string) => void;
  
  // Actions - Import
  importComparisons: (comparisons: PairwiseComparison[], merge?: boolean) => void;
  importVideos: (videos: Video[], merge?: boolean) => void;
  
  // Computed
  getVideoById: (id: string) => Video | undefined;
  getAdversarialCases: () => Video[];
  getClusterVideos: (clusterId: string) => Video[];
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useSigmaTasteStore = create<SigmaTasteState>()(
  persist(
    (set, get) => ({
      // Initial State
      videos: [],
      projections: [],
      clusters: [],
      comparisons: [],
      clusterCorrections: [],
      hiddenVariables: [],
      weights: {
        audience_alignment: 0.35,
        tone_personality_match: 0.30,
        format_appropriateness: 0.20,
        aspiration_alignment: 0.15,
        custom_dimensions: {},
      },
      selectedVideoIds: [],
      activeClusterId: null,
      comparisonQueue: [],
      adversarialQueue: [],

      // Data Loading
      setVideos: (videos) => set({ videos }),
      setProjections: (projections) => set({ projections }),
      setClusters: (clusters) => set({ clusters }),

      // Comparisons
      addComparison: (comparison) => set((state) => ({
        comparisons: [...state.comparisons, comparison],
        comparisonQueue: state.comparisonQueue.slice(1),
      })),
      
      generateComparisonQueue: (dimension, count) => {
        const { videos, comparisons } = get();
        if (videos.length < 2) return;
        
        // Try smart selection first (for rated videos)
        const ratedVideos = videos.filter(v => v.rating?.overall_score !== undefined);
        
        let queue: Array<{ videoA: Video; videoB: Video; dimension: string }> = [];
        
        if (ratedVideos.length >= 2) {
          // Use informative pair selection for rated videos
          const smartPairs = findInformativePairs(videos, comparisons, dimension, Math.min(count, 10));
          queue = smartPairs.map(p => ({ ...p, dimension }));
        }
        
        // Fill remaining with random uncompared pairs
        const comparedPairs = new Set(
          comparisons
            .filter(c => c.dimension === dimension)
            .map(c => [c.video_a_id, c.video_b_id].sort().join('|'))
        );
        
        const availableVideos = [...videos];
        while (queue.length < count && availableVideos.length >= 2) {
          const shuffled = [...availableVideos].sort(() => Math.random() - 0.5);
          const videoA = shuffled[0];
          const videoB = shuffled[1];
          const pairKey = [videoA.id, videoB.id].sort().join('|');
          
          // Prefer uncompared pairs
          if (!comparedPairs.has(pairKey)) {
            queue.push({ videoA, videoB, dimension });
            comparedPairs.add(pairKey);
          } else if (Math.random() < 0.2) {
            // Occasionally allow re-comparison (20% chance) for consistency checks
            queue.push({ videoA, videoB, dimension });
          }
        }
        
        set({ comparisonQueue: queue.slice(0, count) });
      },
      
      nextComparison: () => {
        const { comparisonQueue } = get();
        return comparisonQueue[0] || null;
      },

      // Clusters
      moveVideoToCluster: (videoId, fromClusterId, toClusterId, reason, hiddenVar) => {
        const correction: ClusterCorrection = {
          id: generateId(),
          video_id: videoId,
          from_cluster_id: fromClusterId,
          to_cluster_id: toClusterId,
          reason,
          hidden_variable_suggestion: hiddenVar,
          created_at: new Date().toISOString(),
        };
        
        set((state) => ({
          clusterCorrections: [...state.clusterCorrections, correction],
          clusters: state.clusters.map(cluster => {
            if (cluster.id === fromClusterId) {
              return { ...cluster, video_ids: cluster.video_ids.filter(id => id !== videoId) };
            }
            if (cluster.id === toClusterId) {
              return { ...cluster, video_ids: [...cluster.video_ids, videoId] };
            }
            return cluster;
          }),
        }));
      },
      
      createCluster: (clusterData) => {
        const cluster: VideoCluster = {
          id: generateId(),
          ...clusterData,
        };
        set((state) => ({ clusters: [...state.clusters, cluster] }));
      },

      // Hidden Variables
      addHiddenVariable: (variable) => {
        const hiddenVar: HiddenVariable = {
          id: generateId(),
          ...variable,
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          hiddenVariables: [...state.hiddenVariables, hiddenVar],
        }));
      },

      // Weights
      setWeight: (dimension, value) => set((state) => {
        if (dimension in state.weights && dimension !== 'custom_dimensions') {
          return { weights: { ...state.weights, [dimension]: value } };
        }
        return {
          weights: {
            ...state.weights,
            custom_dimensions: { ...state.weights.custom_dimensions, [dimension]: value },
          },
        };
      }),
      
      addCustomDimension: (name, weight) => set((state) => ({
        weights: {
          ...state.weights,
          custom_dimensions: { ...state.weights.custom_dimensions, [name]: weight },
        },
      })),
      
      removeCustomDimension: (name) => set((state) => {
        const { [name]: _, ...rest } = state.weights.custom_dimensions;
        return { weights: { ...state.weights, custom_dimensions: rest } };
      }),

      // Selection
      selectVideo: (videoId) => set((state) => ({
        selectedVideoIds: [...state.selectedVideoIds, videoId],
      })),
      deselectVideo: (videoId) => set((state) => ({
        selectedVideoIds: state.selectedVideoIds.filter(id => id !== videoId),
      })),
      clearSelection: () => set({ selectedVideoIds: [] }),
      setActiveCluster: (clusterId) => set({ activeClusterId: clusterId }),

      // Adversarial
      setAdversarialQueue: (videos) => set({ adversarialQueue: videos }),
      resolveAdversarial: (videoId, notes) => set((state) => ({
        adversarialQueue: state.adversarialQueue.filter(v => v.id !== videoId),
      })),
      
      // Import
      importComparisons: (newComparisons, merge = true) => set((state) => {
        if (!merge) {
          return { comparisons: newComparisons };
        }
        // Merge: add new comparisons that don't exist
        const existingIds = new Set(state.comparisons.map(c => c.id));
        const toAdd = newComparisons.filter(c => !existingIds.has(c.id));
        return { comparisons: [...state.comparisons, ...toAdd] };
      }),
      
      importVideos: (newVideos, merge = true) => set((state) => {
        if (!merge) {
          return { videos: newVideos };
        }
        // Merge: update existing videos, add new ones
        const existingMap = new Map(state.videos.map(v => [v.id, v]));
        for (const video of newVideos) {
          existingMap.set(video.id, video);
        }
        return { videos: Array.from(existingMap.values()) };
      }),

      // Computed
      getVideoById: (id) => get().videos.find(v => v.id === id),
      getAdversarialCases: () => {
        const { videos } = get();
        return videos.filter(v => {
          if (!v.rating?.overall_score || !v.deep_analysis?.engagement?.replayValue) return false;
          const divergence = Math.abs(v.rating.overall_score - (v.deep_analysis.engagement.replayValue / 10));
          return divergence > 0.3;
        });
      },
      getClusterVideos: (clusterId) => {
        const { videos, clusters } = get();
        const cluster = clusters.find(c => c.id === clusterId);
        if (!cluster) return [];
        return videos.filter(v => cluster.video_ids.includes(v.id));
      },
    }),
    {
      name: 'sigma-taste-storage',
      partialize: (state) => ({
        comparisons: state.comparisons,
        clusterCorrections: state.clusterCorrections,
        hiddenVariables: state.hiddenVariables,
        weights: state.weights,
        clusters: state.clusters,
      }),
    }
  )
);
