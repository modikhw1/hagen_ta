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
        const { videos } = get();
        // Use ALL videos, not just rated ones - this is for discovery!
        const availableVideos = videos.length > 0 ? videos : [];
        const queue: Array<{ videoA: Video; videoB: Video; dimension: string }> = [];
        
        // Generate strategic pairs - random selection for now
        for (let i = 0; i < count && availableVideos.length >= 2; i++) {
          const shuffled = [...availableVideos].sort(() => Math.random() - 0.5);
          queue.push({
            videoA: shuffled[0],
            videoB: shuffled[1],
            dimension,
          });
        }
        
        set({ comparisonQueue: queue });
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
