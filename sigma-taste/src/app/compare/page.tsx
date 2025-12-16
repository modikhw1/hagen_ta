'use client';

import { useState, useEffect } from 'react';
import { useSigmaTasteStore } from '@/store/sigma-taste-store';
import type { Video, PairwiseComparison } from '@/types';
import { 
  ThumbsUp, 
  Equal, 
  ChevronRight, 
  SkipForward,
  Sparkles,
  Zap,
  Heart,
  Eye,
  RefreshCw,
  Download
} from 'lucide-react';

const COMPARISON_DIMENSIONS = [
  { id: 'overall', label: 'Overall Quality', icon: Sparkles, description: 'Which video is better overall?' },
  { id: 'hook', label: 'Hook Strength', icon: Zap, description: 'Which video grabs attention faster?' },
  { id: 'emotional', label: 'Emotional Impact', icon: Heart, description: 'Which video creates stronger feeling?' },
  { id: 'production', label: 'Production Quality', icon: Eye, description: 'Which is more polished?' },
  { id: 'rewatchable', label: 'Rewatchability', icon: RefreshCw, description: 'Which would you watch again?' },
];

interface VideoCardProps {
  video: Video;
  selected: boolean;
  onSelect: () => void;
  position: 'A' | 'B';
}

// Extract TikTok video ID from URL
function extractTikTokId(url: string): string | null {
  const match = url.match(/video\/(\d+)/);
  return match ? match[1] : null;
}

function VideoCard({ video, selected, onSelect, position }: VideoCardProps) {
  const score = video.rating?.overall_score ?? 'N/A';
  
  // Determine video source priority: TikTok embed > signed URL > download
  const tiktokUrl = video.video_url;
  const tiktokId = tiktokUrl ? extractTikTokId(tiktokUrl) : null;
  const signedUrl = (video as any).video_player_url;
  
  return (
    <div 
      onClick={onSelect}
      className={`
        relative flex-1 rounded-xl border-2 cursor-pointer transition-all
        ${selected 
          ? 'border-blue-500 bg-blue-500/10 scale-[1.02] shadow-lg shadow-blue-500/20' 
          : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
        }
      `}
    >
      {/* Position Badge */}
      <div className={`
        absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10
        ${position === 'A' ? 'bg-amber-500 text-black' : 'bg-purple-500 text-white'}
      `}>
        {position}
      </div>
      
      {/* Video Player - TikTok Embed */}
      <div className="aspect-[9/16] max-h-[500px] bg-zinc-900 rounded-t-xl overflow-hidden relative">
        {tiktokId ? (
          <iframe
            src={`https://www.tiktok.com/embed/v2/${tiktokId}`}
            className="w-full h-full"
            style={{ border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onClick={(e) => e.stopPropagation()}
          />
        ) : signedUrl ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-4">
            <Eye className="w-16 h-16 text-zinc-600" />
            <p className="text-sm text-zinc-400 text-center">
              No TikTok embed available
            </p>
            <a
              href={signedUrl}
              download
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download MP4
            </a>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <div className="text-center p-4">
              <Eye className="w-12 h-12 mx-auto mb-2" />
              <p className="text-xs">No video source</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Info Panel */}
      <div className="p-4 space-y-2">
        {/* Video ID */}
        <div className="text-xs text-zinc-600 font-mono mb-2 flex items-center justify-between">
          <span>{video.id.substring(0, 12)}...</span>
          {tiktokId && (
            <span className="text-green-400">TikTok ✓</span>
          )}
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-zinc-400">Current Score</span>
          <span className={`font-bold ${typeof score === 'number' && score >= 0.7 ? 'text-green-400' : 'text-zinc-300'}`}>
            {typeof score === 'number' ? (score * 10).toFixed(1) : score}
          </span>
        </div>
        
        {video.deep_analysis?.script?.humor?.isHumorous && (
          <span className="inline-block px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
            Humor
          </span>
        )}
        
        {(video as any).visual_analysis?.script?.videoType && (
          <p className="text-xs text-zinc-500 truncate">
            Type: {(video as any).visual_analysis.script.videoType}
          </p>
        )}
      </div>
      
      {/* Selected Overlay */}
      {selected && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 rounded-xl pointer-events-none">
          <ThumbsUp className="w-16 h-16 text-blue-400" />
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  const { 
    videos, 
    comparisonQueue, 
    comparisons,
    addComparison, 
    generateComparisonQueue,
    nextComparison 
  } = useSigmaTasteStore();
  
  const [currentDimension, setCurrentDimension] = useState(COMPARISON_DIMENSIONS[0]);
  const [currentPair, setCurrentPair] = useState<{ videoA: Video; videoB: Video } | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<'A' | 'B' | 'tie' | null>(null);
  const [confidence, setConfidence] = useState<'certain' | 'somewhat' | 'barely'>('somewhat');
  const [reasoning, setReasoning] = useState('');
  const [showComplete, setShowComplete] = useState(false);
  
  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/videos');
        if (response.ok) {
          const data = await response.json();
          useSigmaTasteStore.getState().setVideos(data);
        }
      } catch (e) {
        console.log('Will use mock data');
      }
    };
    if (videos.length === 0) {
      loadData();
    }
  }, [videos.length]);
  
  // Get next pair when queue changes
  useEffect(() => {
    const pair = nextComparison();
    if (pair) {
      setCurrentPair({ videoA: pair.videoA, videoB: pair.videoB });
      setSelectedWinner(null);
      setReasoning('');
    }
  }, [comparisonQueue, nextComparison]);
  
  const handleStartSession = () => {
    generateComparisonQueue(currentDimension.id, 10);
  };
  
  const handleSubmit = () => {
    if (!currentPair || !selectedWinner) return;
    
    // Normalize reasoning text to replace ambiguous references
    const normalizedReasoning = reasoning
      .replace(/\b(the\s+)?first(\s+one)?(\s+video)?\b/gi, `Video A (left, ${currentPair.videoA.id.substring(0, 8)})`)
      .replace(/\b(the\s+)?second(\s+one)?(\s+video)?\b/gi, `Video B (right, ${currentPair.videoB.id.substring(0, 8)})`)
      .replace(/\b(the\s+)?left(\s+one)?(\s+video)?\b/gi, `Video A (${currentPair.videoA.id.substring(0, 8)})`)
      .replace(/\b(the\s+)?right(\s+one)?(\s+video)?\b/gi, `Video B (${currentPair.videoB.id.substring(0, 8)})`)
      .replace(/\bvideo\s+a\b/gi, `Video A (${currentPair.videoA.id.substring(0, 8)})`)
      .replace(/\bvideo\s+b\b/gi, `Video B (${currentPair.videoB.id.substring(0, 8)})`);
    
    const comparison: PairwiseComparison = {
      id: Math.random().toString(36).substring(2, 15),
      video_a_id: currentPair.videoA.id,
      video_b_id: currentPair.videoB.id,
      winner_id: selectedWinner === 'tie' 
        ? null 
        : selectedWinner === 'A' 
          ? currentPair.videoA.id 
          : currentPair.videoB.id,
      dimension: currentDimension.id,
      confidence,
      reasoning: normalizedReasoning,
      created_at: new Date().toISOString(),
    };
    
    addComparison(comparison);
    
    if (comparisonQueue.length <= 1) {
      setShowComplete(true);
    }
  };
  
  const handleSkip = () => {
    const pair = nextComparison();
    if (pair) {
      setCurrentPair({ videoA: pair.videoA, videoB: pair.videoB });
      setSelectedWinner(null);
      setReasoning('');
    }
  };
  
  // No pair - show dimension selector
  if (!currentPair) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Comparative Rating</h1>
          <p className="text-zinc-400 mb-8">
            Train σTaste by comparing video pairs. This reveals preferences that absolute scores miss.
          </p>
          
          <div className="bg-zinc-900 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Select Comparison Dimension</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {COMPARISON_DIMENSIONS.map((dim) => {
                const Icon = dim.icon;
                const isSelected = currentDimension.id === dim.id;
                return (
                  <button
                    key={dim.id}
                    onClick={() => setCurrentDimension(dim)}
                    className={`
                      flex items-center gap-3 p-4 rounded-xl text-left transition-all
                      ${isSelected 
                        ? 'bg-blue-500/20 border-2 border-blue-500' 
                        : 'bg-zinc-800 border-2 border-transparent hover:border-zinc-600'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-400' : 'text-zinc-400'}`} />
                    <div>
                      <p className="font-medium">{dim.label}</p>
                      <p className="text-sm text-zinc-500">{dim.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          <button
            onClick={handleStartSession}
            disabled={videos.length < 2}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 
                       rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Start Comparison Session
            <ChevronRight className="w-5 h-5" />
          </button>
          
          {videos.length < 2 && (
            <p className="text-center text-zinc-500 mt-4 text-sm">
              Load videos to begin comparing
            </p>
          )}
          
          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-zinc-900 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{comparisons.length}</p>
              <p className="text-xs text-zinc-500">Comparisons Made</p>
            </div>
            <div className="bg-zinc-900 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{videos.length}</p>
              <p className="text-xs text-zinc-500">Videos Loaded</p>
            </div>
            <div className="bg-zinc-900 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">{comparisonQueue.length}</p>
              <p className="text-xs text-zinc-500">In Queue</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Completion screen
  if (showComplete) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Session Complete!</h1>
          <p className="text-zinc-400 mb-6">
            You compared {comparisons.length} video pairs for {currentDimension.label}.
          </p>
          <button
            onClick={() => {
              setShowComplete(false);
              setCurrentPair(null);
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold"
          >
            Start New Session
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 p-4 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {(() => {
                const Icon = currentDimension.icon;
                return <Icon className="w-5 h-5 text-blue-400" />;
              })()}
              {currentDimension.label}
            </h1>
            <p className="text-sm text-zinc-400">{currentDimension.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">
              {comparisonQueue.length} remaining
            </span>
            <button
              onClick={handleSkip}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg"
            >
              <SkipForward className="w-4 h-4" /> Skip
            </button>
          </div>
        </div>
      </div>
      
      {/* Comparison Area */}
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex gap-6 mb-8">
          <VideoCard 
            video={currentPair.videoA} 
            selected={selectedWinner === 'A'} 
            onSelect={() => setSelectedWinner('A')}
            position="A"
          />
          
          {/* VS Divider */}
          <div className="flex flex-col items-center justify-center">
            <button
              onClick={() => setSelectedWinner('tie')}
              className={`
                w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all
                ${selectedWinner === 'tie' 
                  ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400' 
                  : 'border-zinc-600 text-zinc-500 hover:border-zinc-400'
                }
              `}
            >
              <Equal className="w-5 h-5" />
            </button>
            <span className="text-xs text-zinc-500 mt-1">Tie</span>
          </div>
          
          <VideoCard 
            video={currentPair.videoB} 
            selected={selectedWinner === 'B'} 
            onSelect={() => setSelectedWinner('B')}
            position="B"
          />
        </div>
        
        {/* Confidence & Reasoning */}
        {selectedWinner && (
          <div className="bg-zinc-900 rounded-2xl p-6 space-y-4 animate-in fade-in duration-300">
            <div>
              <label className="block text-sm font-medium mb-2">How confident?</label>
              <div className="flex gap-2">
                {(['certain', 'somewhat', 'barely'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setConfidence(level)}
                    className={`
                      flex-1 py-2 rounded-lg capitalize transition-all
                      ${confidence === level 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }
                    `}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                What made {selectedWinner === 'tie' ? 'them equal' : `${selectedWinner} better`}? 
                <span className="text-zinc-500 font-normal"> (helps discover hidden signals)</span>
              </label>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="e.g., 'The timing felt more natural' or 'There's an intangible authenticity'"
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white 
                           placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
                rows={2}
              />
            </div>
            
            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-semibold 
                         transition-colors flex items-center justify-center gap-2"
            >
              Submit & Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
