'use client';

import { useEffect, useState } from 'react';
import { useSigmaTasteStore } from '@/store/sigma-taste-store';
import type { Video, HiddenVariable } from '@/types';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Eye,
  Lightbulb,
  RefreshCw,
  SkipForward,
  TrendingUp,
  TrendingDown,
  Sparkles
} from 'lucide-react';

interface AdversarialCase {
  video: Video;
  ai_score: number;
  human_score: number;
  divergence: number;
  direction: 'ai_higher' | 'ai_lower';
}

// Suggested hidden variables based on divergence patterns
const SUGGESTED_HIDDEN_VARS = [
  { id: 'nostalgic_depth', name: 'Nostalgic Depth', description: 'Emotional resonance with past experiences' },
  { id: 'authenticity_feel', name: 'Authenticity Feel', description: 'Sense of genuine vs manufactured content' },
  { id: 'chaotic_energy', name: 'Chaotic Energy', description: 'Unpredictable, raw entertainment value' },
  { id: 'insider_knowledge', name: 'Insider Knowledge', description: 'Content that rewards niche expertise' },
  { id: 'subtle_timing', name: 'Subtle Timing', description: 'Comedy timing that AI misses' },
  { id: 'aspirational_pull', name: 'Aspirational Pull', description: 'Makes viewer want that lifestyle' },
  { id: 'cultural_resonance', name: 'Cultural Resonance', description: 'Deep cultural context understanding' },
  { id: 'production_paradox', name: 'Production Paradox', description: 'Lo-fi aesthetic that works better' },
];

function AdversarialCard({ 
  adversarialCase, 
  onResolve, 
  onSkip 
}: { 
  adversarialCase: AdversarialCase; 
  onResolve: (notes: string, hiddenVars: string[]) => void;
  onSkip: () => void;
}) {
  const [notes, setNotes] = useState('');
  const [selectedVars, setSelectedVars] = useState<string[]>([]);
  const [customVar, setCustomVar] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const { video, ai_score, human_score, divergence, direction } = adversarialCase;
  
  const toggleVar = (varId: string) => {
    setSelectedVars(prev => 
      prev.includes(varId) 
        ? prev.filter(v => v !== varId) 
        : [...prev, varId]
    );
  };
  
  const handleSubmit = () => {
    const vars = [...selectedVars];
    if (customVar.trim()) {
      vars.push(customVar.trim());
    }
    onResolve(notes, vars);
  };
  
  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className={`p-4 ${direction === 'ai_higher' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${direction === 'ai_higher' ? 'text-red-400' : 'text-blue-400'}`} />
            <span className="font-semibold">
              {direction === 'ai_higher' ? 'AI Overrated' : 'AI Underrated'}
            </span>
          </div>
          <span className={`
            px-2 py-1 rounded-full text-xs font-bold
            ${Math.abs(divergence) > 0.4 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}
          `}>
            {(divergence * 10).toFixed(1)} gap
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Video Info */}
        <div className="flex gap-4">
          {/* Video Preview */}
          <div className="w-32 flex-shrink-0">
            {((video as any).video_player_url || video.gcs_uri?.startsWith('gs://')) ? (
              <div className="aspect-[9/16] bg-zinc-800 rounded-lg overflow-hidden">
                <video 
                  src={(video as any).video_player_url || video.gcs_uri?.replace('gs://', 'https://storage.googleapis.com/') || ''}
                  controls
                  loop
                  className="w-full h-full object-cover"
                />
              </div>
            ) : video.video_url ? (
              <a
                href={video.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-[9/16] bg-zinc-800 rounded-lg flex flex-col items-center justify-center p-2 hover:bg-zinc-700"
              >
                <Eye className="w-6 h-6 text-zinc-600 mb-1" />
                <span className="text-xs text-zinc-500">Open</span>
              </a>
            ) : (
              <div className="aspect-[9/16] bg-zinc-800 rounded-lg flex items-center justify-center">
                <Eye className="w-8 h-8 text-zinc-600" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <p className="font-mono text-xs text-zinc-500">{video.id.slice(0, 12)}...</p>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-zinc-800 rounded-lg">
                <div className="flex items-center gap-1 text-zinc-400 mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-xs">AI Score</span>
                </div>
                <span className="text-lg font-bold">{(ai_score * 10).toFixed(1)}</span>
              </div>
              <div className="p-2 bg-zinc-800 rounded-lg">
                <div className="flex items-center gap-1 text-zinc-400 mb-1">
                  <Eye className="w-3 h-3" />
                  <span className="text-xs">Your Score</span>
                </div>
                <span className="text-lg font-bold">{(human_score * 10).toFixed(1)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-sm">
              {direction === 'ai_higher' ? (
                <>
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-zinc-400">AI thinks it&apos;s better than it is</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-zinc-400">AI missed something good</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* AI Analysis Summary */}
        {video.deep_analysis && (
          <div className="p-3 bg-zinc-800/50 rounded-xl text-sm">
            <p className="text-zinc-400 mb-1">AI&apos;s assessment:</p>
            <div className="space-y-1 text-xs">
              {video.deep_analysis.content?.format && (
                <p><span className="text-zinc-500">Format:</span> {video.deep_analysis.content.format}</p>
              )}
              {video.deep_analysis.script?.humor?.isHumorous && (
                <p><span className="text-zinc-500">Humor:</span> {video.deep_analysis.script.humor.humorType || 'Yes'}</p>
              )}
              {video.deep_analysis.engagement && (
                <p>
                  <span className="text-zinc-500">Engagement:</span> 
                  {' '}Replay {video.deep_analysis.engagement.replayValue}/10, 
                  Share {video.deep_analysis.engagement.shareability}/10
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Resolution Form */}
        {!showForm ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="flex-1 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 
                         rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              Explain Gap
            </button>
            <button
              onClick={onSkip}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-200">
            <div>
              <label className="block text-sm font-medium mb-2">
                What did the AI {direction === 'ai_higher' ? 'miss seeing as negative' : 'fail to appreciate'}?
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  direction === 'ai_higher' 
                    ? "e.g., 'The joke lands awkwardly, timing is off'"
                    : "e.g., 'The raw authenticity is exactly what makes it work'"
                }
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white 
                           placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 resize-none text-sm"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Select hidden variables that explain this:
              </label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_HIDDEN_VARS.map(v => (
                  <button
                    key={v.id}
                    onClick={() => toggleVar(v.id)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs transition-all
                      ${selectedVars.includes(v.id)
                        ? 'bg-amber-500 text-black font-medium'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }
                    `}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Or name a new hidden variable:
              </label>
              <input
                type="text"
                value={customVar}
                onChange={(e) => setCustomVar(e.target.value)}
                placeholder="e.g., 'cultural insider joke'"
                className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white 
                           placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!notes.trim() && selectedVars.length === 0 && !customVar.trim()}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 
                           disabled:text-zinc-500 rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Resolve
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdversarialPage() {
  const { 
    videos, 
    adversarialQueue,
    hiddenVariables,
    setAdversarialQueue,
    resolveAdversarial,
    addHiddenVariable
  } = useSigmaTasteStore();
  
  const [cases, setCases] = useState<AdversarialCase[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [threshold, setThreshold] = useState(0.3);
  
  // Generate adversarial cases
  useEffect(() => {
    const adversarialCases: AdversarialCase[] = videos
      .filter(v => {
        if (!v.rating?.overall_score) return false;
        const aiScore = v.deep_analysis?.engagement?.replayValue ?? null;
        if (aiScore === null) return false;
        return Math.abs(v.rating.overall_score - (aiScore / 10)) > threshold;
      })
      .map(v => {
        const ai_score = (v.deep_analysis?.engagement?.replayValue ?? 5) / 10;
        const human_score = v.rating!.overall_score;
        return {
          video: v,
          ai_score,
          human_score,
          divergence: ai_score - human_score,
          direction: ai_score > human_score ? 'ai_higher' as const : 'ai_lower' as const,
        };
      })
      .sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence));
    
    setCases(adversarialCases);
    setAdversarialQueue(adversarialCases.map(c => c.video));
  }, [videos, threshold, setAdversarialQueue]);
  
  const currentCase = cases[currentIndex];
  
  const handleResolve = (notes: string, hiddenVars: string[]) => {
    if (!currentCase) return;
    
    // Add new hidden variables
    hiddenVars.forEach(varName => {
      const existing = hiddenVariables.find(v => v.name.toLowerCase() === varName.toLowerCase());
      if (!existing) {
        const suggested = SUGGESTED_HIDDEN_VARS.find(v => v.id === varName || v.name === varName);
        addHiddenVariable({
          name: suggested?.name || varName,
          description: suggested?.description || notes,
          discovered_from: 'adversarial',
          examples: [currentCase.video.id],
          counter_examples: [],
          confidence: 0.5,
        });
      }
    });
    
    resolveAdversarial(currentCase.video.id, notes);
    setResolvedCount(prev => prev + 1);
    setCurrentIndex(prev => Math.min(prev + 1, cases.length - 1));
  };
  
  const handleSkip = () => {
    setCurrentIndex(prev => Math.min(prev + 1, cases.length - 1));
  };
  
  const handleRefresh = () => {
    setCurrentIndex(0);
    setResolvedCount(0);
  };
  
  // Stats
  const aiHigherCount = cases.filter(c => c.direction === 'ai_higher').length;
  const aiLowerCount = cases.filter(c => c.direction === 'ai_lower').length;
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Adversarial Probing</h1>
          <p className="text-zinc-400">
            Surface videos where AI and human scores diverge. Articulate what the AI missed to discover hidden variables.
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{cases.length}</p>
            <p className="text-xs text-zinc-500">Divergent</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{aiHigherCount}</p>
            <p className="text-xs text-zinc-500">AI Higher</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{aiLowerCount}</p>
            <p className="text-xs text-zinc-500">AI Lower</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{resolvedCount}</p>
            <p className="text-xs text-zinc-500">Resolved</p>
          </div>
        </div>
        
        {/* Threshold Control */}
        <div className="bg-zinc-900 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Divergence Threshold</label>
            <span className="text-sm text-zinc-400">{threshold.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.6"
            step="0.1"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Higher = only show major disagreements
          </p>
        </div>
        
        {/* Progress */}
        {cases.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-zinc-400 mb-1">
              <span>Progress</span>
              <span>{currentIndex + 1} / {cases.length}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${((currentIndex + 1) / cases.length) * 100}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Current Case */}
        {currentCase ? (
          <AdversarialCard
            adversarialCase={currentCase}
            onResolve={handleResolve}
            onSkip={handleSkip}
          />
        ) : cases.length === 0 ? (
          <div className="bg-zinc-900 rounded-2xl p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No Divergent Cases</h2>
            <p className="text-zinc-400 mb-4">
              {videos.length === 0 
                ? 'Load videos with ratings to find disagreements'
                : `No videos have AI/human score gap > ${threshold.toFixed(1)}`
              }
            </p>
            {videos.length > 0 && (
              <button
                onClick={() => setThreshold(0.1)}
                className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg"
              >
                Lower Threshold
              </button>
            )}
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-2xl p-8 text-center">
            <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">All Cases Reviewed!</h2>
            <p className="text-zinc-400 mb-4">
              You resolved {resolvedCount} adversarial cases and discovered hidden variables.
            </p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Start Over
            </button>
          </div>
        )}
        
        {/* Discovered Variables */}
        {hiddenVariables.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold mb-3">Discovered Hidden Variables</h2>
            <div className="grid grid-cols-2 gap-3">
              {hiddenVariables.map(v => (
                <div 
                  key={v.id}
                  className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl"
                >
                  <p className="font-medium text-amber-400">{v.name}</p>
                  <p className="text-xs text-zinc-400 mt-1">{v.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                    <span>{v.examples.length} examples</span>
                    <span>•</span>
                    <span>{(v.confidence * 100).toFixed(0)}% confidence</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
