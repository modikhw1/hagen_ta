'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSigmaTasteStore } from '@/store/sigma-taste-store';
import type { Video, SigmaTasteWeights, HiddenVariable } from '@/types';
import {
  Sliders,
  Plus,
  X,
  Download,
  Upload,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Equal,
  Lightbulb,
  Save,
  Eye
} from 'lucide-react';

interface WeightSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
  description?: string;
  isCustom?: boolean;
  onRemove?: () => void;
}

function WeightSlider({ label, value, onChange, color, description, isCustom, onRemove }: WeightSliderProps) {
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-medium text-sm">{label}</span>
          {isCustom && (
            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
              discovered
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono w-12 text-right">{(value * 100).toFixed(0)}%</span>
          {isCustom && onRemove && (
            <button
              onClick={onRemove}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded transition-all"
            >
              <X className="w-3 h-3 text-zinc-400" />
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${value * 100}%, #3f3f46 ${value * 100}%)`,
        }}
      />
      {description && (
        <p className="text-xs text-zinc-500 mt-1">{description}</p>
      )}
    </div>
  );
}

interface VideoRankingPreview {
  video: Video;
  originalScore: number;
  newScore: number;
  rankChange: number;
}

function computeWeightedScore(video: Video, weights: SigmaTasteWeights): number {
  const analysis = video.deep_analysis;
  if (!analysis) return 0.5;
  
  // Extract dimension scores (normalized 0-1)
  const audience = analysis.schema_v1_signals?.target_audience ? 0.7 : 0.5; // simplified
  const tone = analysis.script?.humor?.isHumorous ? 0.8 : 0.5;
  const format = analysis.content?.format ? 0.7 : 0.5;
  const aspiration = (analysis.engagement?.shareability ?? 5) / 10;
  
  // Base weighted score
  let score = 
    audience * weights.audience_alignment +
    tone * weights.tone_personality_match +
    format * weights.format_appropriateness +
    aspiration * weights.aspiration_alignment;
  
  // Add custom dimension contributions
  Object.entries(weights.custom_dimensions).forEach(([dimension, weight]) => {
    // For custom dimensions, check if the video has signals that might relate
    // This is simplified - in production you'd have proper dimension extraction
    const randomContribution = Math.random() * 0.2 + 0.4; // 0.4-0.6
    score += randomContribution * weight * 0.5; // Custom dimensions have less impact initially
  });
  
  // Normalize
  const totalWeight = 
    weights.audience_alignment +
    weights.tone_personality_match +
    weights.format_appropriateness +
    weights.aspiration_alignment +
    Object.values(weights.custom_dimensions).reduce((a, b) => a + b, 0) * 0.5;
  
  return totalWeight > 0 ? score / totalWeight : 0.5;
}

export default function CalibratePage() {
  const {
    videos,
    weights,
    hiddenVariables,
    setWeight,
    addCustomDimension,
    removeCustomDimension,
  } = useSigmaTasteStore();
  
  const [newDimensionName, setNewDimensionName] = useState('');
  const [showAddDimension, setShowAddDimension] = useState(false);
  const [previewMode, setPreviewMode] = useState<'rankings' | 'distribution'>('rankings');
  
  // Default weights
  const defaultWeights: SigmaTasteWeights = {
    audience_alignment: 0.35,
    tone_personality_match: 0.30,
    format_appropriateness: 0.20,
    aspiration_alignment: 0.15,
    custom_dimensions: {},
  };
  
  // Compute ranking preview
  const rankingPreview = useMemo(() => {
    if (videos.length === 0) return [];
    
    const previews: VideoRankingPreview[] = videos
      .filter(v => v.rating?.overall_score !== undefined)
      .map(video => {
        const originalScore = video.rating!.overall_score;
        const newScore = computeWeightedScore(video, weights);
        return {
          video,
          originalScore,
          newScore,
          rankChange: 0, // will calculate after sorting
        };
      });
    
    // Sort by original score
    const originalOrder = [...previews].sort((a, b) => b.originalScore - a.originalScore);
    const originalRanks = new Map(originalOrder.map((p, i) => [p.video.id, i + 1]));
    
    // Sort by new score
    const newOrder = [...previews].sort((a, b) => b.newScore - a.newScore);
    const newRanks = new Map(newOrder.map((p, i) => [p.video.id, i + 1]));
    
    // Calculate rank changes
    return newOrder.map(p => ({
      ...p,
      rankChange: (originalRanks.get(p.video.id) ?? 0) - (newRanks.get(p.video.id) ?? 0),
    }));
  }, [videos, weights]);
  
  // Weight sum validation
  const totalCoreWeight = 
    weights.audience_alignment +
    weights.tone_personality_match +
    weights.format_appropriateness +
    weights.aspiration_alignment;
  
  const totalCustomWeight = Object.values(weights.custom_dimensions).reduce((a, b) => a + b, 0);
  
  const handleAddDimension = () => {
    if (newDimensionName.trim()) {
      addCustomDimension(newDimensionName.trim(), 0.1);
      setNewDimensionName('');
      setShowAddDimension(false);
    }
  };
  
  const handleAddFromDiscovered = (variable: HiddenVariable) => {
    addCustomDimension(variable.name, 0.1);
  };
  
  const handleReset = () => {
    setWeight('audience_alignment', defaultWeights.audience_alignment);
    setWeight('tone_personality_match', defaultWeights.tone_personality_match);
    setWeight('format_appropriateness', defaultWeights.format_appropriateness);
    setWeight('aspiration_alignment', defaultWeights.aspiration_alignment);
    Object.keys(weights.custom_dimensions).forEach(key => {
      removeCustomDimension(key);
    });
  };
  
  const handleExport = () => {
    const exportData = {
      weights,
      hiddenVariables,
      exported_at: new Date().toISOString(),
      video_count: videos.length,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sigma-taste-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const dimensionColors = {
    audience_alignment: '#3b82f6',
    tone_personality_match: '#22c55e',
    format_appropriateness: '#f59e0b',
    aspiration_alignment: '#a855f7',
  };
  
  const dimensionDescriptions = {
    audience_alignment: 'How well does content match target demographics?',
    tone_personality_match: 'Does the personality/vibe resonate?',
    format_appropriateness: 'Is the format suitable for the context?',
    aspiration_alignment: 'Does it inspire the desired lifestyle?',
  };
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="flex">
        {/* Left Panel - Weight Controls */}
        <div className="w-[400px] border-r border-zinc-800 p-6 overflow-y-auto max-h-screen">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sliders className="w-6 h-6" />
              σTaste Calibration
            </h1>
          </div>
          
          {/* Weight Sum Indicator */}
          <div className="bg-zinc-900 rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Total Weight</span>
              <span className={totalCoreWeight > 1.1 ? 'text-red-400' : 'text-green-400'}>
                {(totalCoreWeight * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${totalCoreWeight > 1.1 ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(totalCoreWeight * 100, 100)}%` }}
              />
            </div>
            {totalCoreWeight > 1.1 && (
              <p className="text-xs text-red-400 mt-1">Weights exceed 100% - normalize recommended</p>
            )}
          </div>
          
          {/* Core Dimensions */}
          <div className="space-y-6 mb-8">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
              Core Dimensions
            </h2>
            
            <WeightSlider
              label="Audience Alignment"
              value={weights.audience_alignment}
              onChange={(v) => setWeight('audience_alignment', v)}
              color={dimensionColors.audience_alignment}
              description={dimensionDescriptions.audience_alignment}
            />
            
            <WeightSlider
              label="Tone/Personality Match"
              value={weights.tone_personality_match}
              onChange={(v) => setWeight('tone_personality_match', v)}
              color={dimensionColors.tone_personality_match}
              description={dimensionDescriptions.tone_personality_match}
            />
            
            <WeightSlider
              label="Format Appropriateness"
              value={weights.format_appropriateness}
              onChange={(v) => setWeight('format_appropriateness', v)}
              color={dimensionColors.format_appropriateness}
              description={dimensionDescriptions.format_appropriateness}
            />
            
            <WeightSlider
              label="Aspiration Alignment"
              value={weights.aspiration_alignment}
              onChange={(v) => setWeight('aspiration_alignment', v)}
              color={dimensionColors.aspiration_alignment}
              description={dimensionDescriptions.aspiration_alignment}
            />
          </div>
          
          {/* Custom/Discovered Dimensions */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                Custom Dimensions
              </h2>
              {totalCustomWeight > 0 && (
                <span className="text-xs text-amber-400">
                  +{(totalCustomWeight * 100).toFixed(0)}%
                </span>
              )}
            </div>
            
            {Object.entries(weights.custom_dimensions).map(([name, value]) => (
              <WeightSlider
                key={name}
                label={name}
                value={value}
                onChange={(v) => setWeight(name, v)}
                color="#ec4899"
                isCustom
                onRemove={() => removeCustomDimension(name)}
              />
            ))}
            
            {!showAddDimension ? (
              <button
                onClick={() => setShowAddDimension(true)}
                className="w-full py-2 flex items-center justify-center gap-2 
                           bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Dimension
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDimensionName}
                  onChange={(e) => setNewDimensionName(e.target.value)}
                  placeholder="Dimension name..."
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg 
                             text-white text-sm focus:outline-none focus:border-amber-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDimension()}
                  autoFocus
                />
                <button
                  onClick={handleAddDimension}
                  className="px-3 py-2 bg-amber-500 text-black rounded-lg"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddDimension(false)}
                  className="px-3 py-2 bg-zinc-800 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {/* Discovered Variables - Quick Add */}
          {hiddenVariables.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                <Lightbulb className="w-4 h-4" />
                Discovered Variables
              </h2>
              <div className="space-y-2">
                {hiddenVariables
                  .filter(v => !weights.custom_dimensions[v.name])
                  .slice(0, 5)
                  .map(variable => (
                    <button
                      key={variable.id}
                      onClick={() => handleAddFromDiscovered(variable)}
                      className="w-full p-3 bg-amber-500/10 border border-amber-500/30 
                                 hover:bg-amber-500/20 rounded-xl text-left transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-amber-400">{variable.name}</span>
                        <Plus className="w-4 h-4 text-amber-400" />
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{variable.description}</p>
                    </button>
                  ))}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleReset}
              className="w-full py-2.5 flex items-center justify-center gap-2 
                         bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
            
            <button
              onClick={handleExport}
              className="w-full py-2.5 flex items-center justify-center gap-2 
                         bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export Configuration
            </button>
          </div>
        </div>
        
        {/* Right Panel - Preview */}
        <div className="flex-1 p-6 overflow-y-auto max-h-screen">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Ranking Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode('rankings')}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  previewMode === 'rankings' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                Rankings
              </button>
              <button
                onClick={() => setPreviewMode('distribution')}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  previewMode === 'distribution' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                Distribution
              </button>
            </div>
          </div>
          
          {rankingPreview.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Eye className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">Load rated videos to see ranking impact</p>
              </div>
            </div>
          ) : previewMode === 'rankings' ? (
            <div className="space-y-2">
              {rankingPreview.slice(0, 20).map((item, index) => (
                <div 
                  key={item.video.id}
                  className="flex items-center gap-4 p-3 bg-zinc-900 rounded-xl"
                >
                  <span className="w-8 text-center text-lg font-bold text-zinc-400">
                    {index + 1}
                  </span>
                  
                  <div className="flex-1">
                    <p className="font-mono text-xs text-zinc-500 mb-1">
                      {item.video.id.slice(0, 12)}...
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-zinc-400">
                        Original: <span className="text-white font-medium">{(item.originalScore * 10).toFixed(1)}</span>
                      </span>
                      <span className="text-zinc-400">
                        New: <span className="text-blue-400 font-medium">{(item.newScore * 10).toFixed(1)}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {item.rankChange > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm">+{item.rankChange}</span>
                      </>
                    ) : item.rankChange < 0 ? (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 text-sm">{item.rankChange}</span>
                      </>
                    ) : (
                      <>
                        <Equal className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-500 text-sm">0</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {rankingPreview.length > 20 && (
                <p className="text-center text-zinc-500 text-sm py-4">
                  +{rankingPreview.length - 20} more videos
                </p>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Score Distribution</h3>
              <div className="h-64 flex items-end gap-1">
                {Array.from({ length: 10 }, (_, i) => {
                  const rangeStart = i / 10;
                  const rangeEnd = (i + 1) / 10;
                  const count = rankingPreview.filter(
                    p => p.newScore >= rangeStart && p.newScore < rangeEnd
                  ).length;
                  const maxCount = Math.max(...Array.from({ length: 10 }, (_, j) => {
                    const s = j / 10;
                    const e = (j + 1) / 10;
                    return rankingPreview.filter(p => p.newScore >= s && p.newScore < e).length;
                  }));
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-500 rounded-t transition-all"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-zinc-500 mt-2">{i}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-xs text-zinc-500 mt-2">Score (0-10)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
