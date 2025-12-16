'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useSigmaTasteStore } from '@/store/sigma-taste-store';
import type { Video, VideoProjection, VideoCluster } from '@/types';
import { 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Plus, 
  X,
  Lightbulb,
  MoveHorizontal
} from 'lucide-react';

// Generate t-SNE like projection from video features (simplified)
function generateProjections(videos: Video[]): VideoProjection[] {
  // Extract features and create 2D projection
  // In production, this would use actual embeddings + UMAP/t-SNE
  return videos.map((video, i) => {
    const engagementScore = video.deep_analysis?.engagement?.replayValue ?? 5;
    const productionScore = video.deep_analysis?.technical?.pacing ?? 5;
    const humorLevel = video.deep_analysis?.script?.humor?.isHumorous ? 1 : 0;
    const overallScore = video.rating?.overall_score ?? 0.5;
    
    // Create pseudo-projection based on features + random jitter
    const angle = (i / videos.length) * Math.PI * 2;
    const radius = 0.3 + (1 - overallScore) * 0.5;
    
    return {
      video_id: video.id,
      x: Math.cos(angle) * radius + (engagementScore / 20) + (Math.random() - 0.5) * 0.1,
      y: Math.sin(angle) * radius + (productionScore / 20) + humorLevel * 0.2 + (Math.random() - 0.5) * 0.1,
      cluster_id: null,
      overall_score: overallScore,
    };
  });
}

// Auto-cluster using k-means like approach
function autoClusters(projections: VideoProjection[], k: number = 6): VideoCluster[] {
  const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
  const clusterNames = ['High Energy', 'Polished', 'Authentic', 'Viral Hooks', 'Niche Appeal', 'Experimental'];
  
  // Simple clustering based on position
  const sorted = [...projections].sort((a, b) => a.x + a.y - (b.x + b.y));
  const perCluster = Math.ceil(sorted.length / k);
  
  return Array.from({ length: k }, (_, i) => {
    const start = i * perCluster;
    const clusterVideos = sorted.slice(start, start + perCluster);
    
    return {
      id: `cluster_${i}`,
      name: clusterNames[i] || `Cluster ${i + 1}`,
      description: '',
      centroid: [
        d3.mean(clusterVideos, d => d.x) || 0,
        d3.mean(clusterVideos, d => d.y) || 0,
      ],
      video_ids: clusterVideos.map(p => p.video_id),
      defining_signals: [],
      color: colors[i % colors.length],
    };
  });
}

interface ClusterCorrectionModalProps {
  video: Video;
  fromCluster: VideoCluster;
  clusters: VideoCluster[];
  onConfirm: (toClusterId: string, reason: string, hiddenVar: string) => void;
  onCancel: () => void;
}

function ClusterCorrectionModal({ video, fromCluster, clusters, onConfirm, onCancel }: ClusterCorrectionModalProps) {
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [reason, setReason] = useState('');
  const [hiddenVar, setHiddenVar] = useState('');
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl max-w-lg w-full p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">Move Video to Different Cluster</h2>
            <p className="text-sm text-zinc-400">
              Moving from <span className="font-medium" style={{ color: fromCluster.color }}>{fromCluster.name}</span>
            </p>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-zinc-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Move to cluster:</label>
          <div className="grid grid-cols-2 gap-2">
            {clusters.filter(c => c.id !== fromCluster.id).map(cluster => (
              <button
                key={cluster.id}
                onClick={() => setSelectedCluster(cluster.id)}
                className={`
                  p-3 rounded-lg text-left transition-all border-2
                  ${selectedCluster === cluster.id 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-transparent bg-zinc-800 hover:bg-zinc-700'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cluster.color }} />
                  <span className="font-medium">{cluster.name}</span>
                </div>
                <span className="text-xs text-zinc-500">{cluster.video_ids.length} videos</span>
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Why doesn&apos;t it fit in &quot;{fromCluster.name}&quot;?</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., 'The energy level is completely different'"
            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white 
                       placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
            rows={2}
          />
        </div>
        
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <label className="block text-sm font-medium text-amber-400 mb-1">
                Hidden Variable Discovery
              </label>
              <p className="text-xs text-zinc-400 mb-2">
                Name the quality that distinguishes this video from the cluster:
              </p>
              <input
                type="text"
                value={hiddenVar}
                onChange={(e) => setHiddenVar(e.target.value)}
                placeholder="e.g., 'nostalgic warmth' or 'chaotic energy'"
                className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white 
                           placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedCluster, reason, hiddenVar)}
            disabled={!selectedCluster}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 
                       disabled:text-zinc-500 rounded-xl font-medium"
          >
            Confirm Move
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClustersPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    videos, 
    projections, 
    clusters,
    clusterCorrections,
    hiddenVariables,
    setProjections, 
    setClusters,
    moveVideoToCluster,
    getVideoById 
  } = useSigmaTasteStore();
  
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [draggedVideo, setDraggedVideo] = useState<{ video: Video; fromCluster: VideoCluster } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Initialize projections and clusters
  useEffect(() => {
    if (videos.length > 0 && projections.length === 0) {
      const newProjections = generateProjections(videos);
      setProjections(newProjections);
      
      if (clusters.length === 0) {
        const newClusters = autoClusters(newProjections);
        setClusters(newClusters);
        
        // Update projections with cluster assignments
        const updatedProjections = newProjections.map(p => {
          const cluster = newClusters.find(c => c.video_ids.includes(p.video_id));
          return { ...p, cluster_id: cluster?.id || null };
        });
        setProjections(updatedProjections);
      }
    }
  }, [videos, projections.length, clusters.length, setProjections, setClusters]);
  
  // D3 Visualization
  useEffect(() => {
    if (!svgRef.current || projections.length === 0) return;
    
    const svg = d3.select(svgRef.current);
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    
    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();
    
    // Scales
    const xExtent = d3.extent(projections, d => d.x) as [number, number];
    const yExtent = d3.extent(projections, d => d.y) as [number, number];
    const padding = 0.1;
    
    const xScale = d3.scaleLinear()
      .domain([xExtent[0] - padding, xExtent[1] + padding])
      .range([50, width - 50]);
    
    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - padding, yExtent[1] + padding])
      .range([height - 50, 50]);
    
    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });
    
    svg.call(zoom);
    
    const g = svg.append('g');
    
    // Draw cluster hulls
    clusters.forEach(cluster => {
      const clusterProjections = projections.filter(p => 
        cluster.video_ids.includes(p.video_id)
      );
      
      if (clusterProjections.length < 3) return;
      
      const points: [number, number][] = clusterProjections.map(p => [
        xScale(p.x),
        yScale(p.y)
      ]);
      
      const hull = d3.polygonHull(points);
      if (!hull) return;
      
      g.append('path')
        .datum(hull)
        .attr('d', d => `M${d.join('L')}Z`)
        .attr('fill', cluster.color)
        .attr('fill-opacity', hoveredCluster === cluster.id ? 0.3 : 0.1)
        .attr('stroke', cluster.color)
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.5)
        .style('cursor', 'pointer')
        .on('mouseenter', () => setHoveredCluster(cluster.id))
        .on('mouseleave', () => setHoveredCluster(null));
      
      // Cluster label
      const centroidX = d3.mean(points, p => p[0]) || 0;
      const centroidY = d3.mean(points, p => p[1]) || 0;
      
      g.append('text')
        .attr('x', centroidX)
        .attr('y', centroidY - 20)
        .attr('text-anchor', 'middle')
        .attr('fill', cluster.color)
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(cluster.name);
    });
    
    // Draw video points
    const nodes = g.selectAll('circle')
      .data(projections)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', d => 6 + d.overall_score * 8)
      .attr('fill', d => {
        const cluster = clusters.find(c => c.video_ids.includes(d.video_id));
        return cluster?.color || '#666';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', d => selectedVideo?.id === d.video_id ? 3 : 1)
      .attr('opacity', d => 0.4 + d.overall_score * 0.6)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        const video = getVideoById(d.video_id);
        if (video) setSelectedVideo(video);
      });
    
    // Drag behavior for moving videos between clusters
    const drag = d3.drag<SVGCircleElement, VideoProjection>()
      .on('start', function(event, d) {
        d3.select(this).raise().attr('stroke-width', 3);
      })
      .on('drag', function(event) {
        d3.select(this).attr('cx', event.x).attr('cy', event.y);
      })
      .on('end', function(event, d) {
        d3.select(this).attr('stroke-width', 1);
        
        const video = getVideoById(d.video_id);
        const fromCluster = clusters.find(c => c.video_ids.includes(d.video_id));
        
        if (video && fromCluster) {
          setDraggedVideo({ video, fromCluster });
          setShowCorrectionModal(true);
        }
      });
    
    nodes.call(drag as any);
    
  }, [projections, clusters, selectedVideo, hoveredCluster, getVideoById]);
  
  const handleCorrectionConfirm = useCallback((toClusterId: string, reason: string, hiddenVar: string) => {
    if (!draggedVideo) return;
    
    moveVideoToCluster(
      draggedVideo.video.id,
      draggedVideo.fromCluster.id,
      toClusterId,
      reason,
      hiddenVar
    );
    
    setShowCorrectionModal(false);
    setDraggedVideo(null);
  }, [draggedVideo, moveVideoToCluster]);
  
  const handleRegenerate = () => {
    if (videos.length > 0) {
      const newProjections = generateProjections(videos);
      const newClusters = autoClusters(newProjections);
      setClusters(newClusters);
      
      const updatedProjections = newProjections.map(p => {
        const cluster = newClusters.find(c => c.video_ids.includes(p.video_id));
        return { ...p, cluster_id: cluster?.id || null };
      });
      setProjections(updatedProjections);
    }
  };
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Main Visualization Area */}
      <div className="flex-1 relative" ref={containerRef}>
        {/* Controls */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button
            onClick={() => setZoomLevel(z => Math.min(z * 1.2, 5))}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={() => setZoomLevel(z => Math.max(z / 1.2, 0.5))}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleRegenerate}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        
        {/* Instructions */}
        <div className="absolute top-4 right-4 z-10 bg-zinc-800/90 backdrop-blur rounded-xl p-3 max-w-xs">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <MoveHorizontal className="w-4 h-4" />
            Drag videos between clusters to correct groupings
          </div>
        </div>
        
        {/* SVG Canvas */}
        <svg ref={svgRef} className="w-full h-full" />
        
        {/* Empty State */}
        {projections.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-zinc-500 mb-4">Load videos to see cluster visualization</p>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg">
                Load Dataset
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Right Sidebar */}
      <div className="w-80 bg-zinc-900 border-l border-zinc-800 overflow-y-auto">
        {/* Clusters Panel */}
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold mb-3">Clusters</h2>
          <div className="space-y-2">
            {clusters.map(cluster => (
              <div 
                key={cluster.id}
                className={`
                  p-3 rounded-xl transition-all cursor-pointer
                  ${hoveredCluster === cluster.id ? 'bg-zinc-800' : 'bg-zinc-800/50 hover:bg-zinc-800'}
                `}
                onMouseEnter={() => setHoveredCluster(cluster.id)}
                onMouseLeave={() => setHoveredCluster(null)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: cluster.color }} 
                  />
                  <span className="font-medium">{cluster.name}</span>
                  <span className="text-xs text-zinc-500 ml-auto">
                    {cluster.video_ids.length}
                  </span>
                </div>
                {cluster.defining_signals.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {cluster.defining_signals.map(signal => (
                      <span key={signal} className="px-1.5 py-0.5 bg-zinc-700 text-xs rounded">
                        {signal}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button className="w-full mt-3 py-2 flex items-center justify-center gap-2 
                            bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm">
            <Plus className="w-4 h-4" /> New Cluster
          </button>
        </div>
        
        {/* Selected Video */}
        {selectedVideo && (
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-lg font-bold mb-3">Selected Video</h2>
            
            {/* Video Preview */}
            {((selectedVideo as any).video_player_url || selectedVideo.gcs_uri?.startsWith('gs://')) ? (
              <div className="mb-3 aspect-video bg-zinc-900 rounded-lg overflow-hidden">
                <video 
                  src={(selectedVideo as any).video_player_url || selectedVideo.gcs_uri?.replace('gs://', 'https://storage.googleapis.com/') || ''}
                  controls
                  loop
                  className="w-full h-full object-contain"
                >
                  <p className="text-zinc-500 text-xs p-2">Video unavailable</p>
                </video>
              </div>
            ) : selectedVideo.video_url && (
              <a
                href={selectedVideo.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mb-3 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-center text-sm"
              >
                Open Video in TikTok →
              </a>
            )}
            
            <div className="space-y-2 text-sm">
              <p className="font-mono text-xs text-zinc-400 break-all">
                {selectedVideo.id.slice(0, 12)}...
              </p>
              <div className="flex justify-between">
                <span className="text-zinc-400">Score</span>
                <span className="font-bold text-green-400">
                  {((selectedVideo.rating?.overall_score ?? 0) * 10).toFixed(1)}
                </span>
              </div>
              {selectedVideo.deep_analysis?.content?.format && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Format</span>
                  <span>{selectedVideo.deep_analysis.content.format}</span>
                </div>
              )}
              {selectedVideo.deep_analysis?.content?.style && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Style</span>
                  <span>{selectedVideo.deep_analysis.content.style}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Corrections Log */}
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold mb-3">Recent Corrections</h2>
          {clusterCorrections.length === 0 ? (
            <p className="text-sm text-zinc-500">No corrections yet</p>
          ) : (
            <div className="space-y-2">
              {clusterCorrections.slice(-5).reverse().map(correction => (
                <div key={correction.id} className="p-2 bg-zinc-800 rounded-lg text-sm">
                  <p className="text-xs text-zinc-400 mb-1">{correction.reason}</p>
                  {correction.hidden_variable_suggestion && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 
                                     text-amber-400 text-xs rounded-full">
                      <Lightbulb className="w-3 h-3" />
                      {correction.hidden_variable_suggestion}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Discovered Hidden Variables */}
        <div className="p-4">
          <h2 className="text-lg font-bold mb-3">Discovered Variables</h2>
          {hiddenVariables.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Move videos between clusters to discover hidden variables
            </p>
          ) : (
            <div className="space-y-2">
              {hiddenVariables.map(variable => (
                <div key={variable.id} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="font-medium text-amber-400">{variable.name}</p>
                  <p className="text-xs text-zinc-400 mt-1">{variable.description}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-zinc-500">Confidence:</span>
                    <div className="flex-1 h-1.5 bg-zinc-700 rounded-full">
                      <div 
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${variable.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Correction Modal */}
      {showCorrectionModal && draggedVideo && (
        <ClusterCorrectionModal
          video={draggedVideo.video}
          fromCluster={draggedVideo.fromCluster}
          clusters={clusters}
          onConfirm={handleCorrectionConfirm}
          onCancel={() => {
            setShowCorrectionModal(false);
            setDraggedVideo(null);
          }}
        />
      )}
    </div>
  );
}
