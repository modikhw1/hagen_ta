'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSigmaTasteStore } from '@/store/sigma-taste-store';
import { parseFileContent, matchComparisonsWithVideos } from '@/lib/dataLoader';
import type { Video } from '@/types';
import {
  GitCompare,
  Network,
  AlertTriangle,
  Sliders,
  Upload,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Eye,
  FileJson,
  BarChart3,
} from 'lucide-react';

export default function HomePage() {
  const { 
    videos, 
    comparisons, 
    clusterCorrections,
    hiddenVariables,
    setVideos,
    importComparisons,
    importVideos,
  } = useSigmaTasteStore();
  
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const loadVideos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/videos');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setVideos(data);
          setDataLoaded(true);
        }
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    }
    setLoading(false);
  };
  
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setImportStatus(null);
    
    try {
      const content = await file.text();
      const parsed = parseFileContent(content);
      
      let statusParts: string[] = [];
      
      if (parsed.videos && parsed.videos.length > 0) {
        importVideos(parsed.videos, true);
        statusParts.push(`${parsed.videos.length} videos`);
      }
      
      if (parsed.comparisons && parsed.comparisons.length > 0) {
        importComparisons(parsed.comparisons, true);
        statusParts.push(`${parsed.comparisons.length} comparisons`);
      }
      
      if (statusParts.length > 0) {
        setImportStatus(`Imported ${statusParts.join(' and ')}`);
        setDataLoaded(true);
      } else {
        setImportStatus('No valid data found in file');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('Error importing file');
    }
    
    setLoading(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  useEffect(() => {
    if (videos.length === 0) {
      loadVideos();
    } else {
      setDataLoaded(true);
    }
  }, [videos.length]);
  
  // Stats
  const ratedVideos = videos.filter(v => v.rating?.overall_score !== undefined);
  const avgScore = ratedVideos.length > 0 
    ? ratedVideos.reduce((sum, v) => sum + (v.rating?.overall_score ?? 0), 0) / ratedVideos.length
    : 0;
  
  const adversarialCount = videos.filter(v => {
    if (!v.rating?.overall_score || !v.deep_analysis?.engagement?.replayValue) return false;
    return Math.abs(v.rating.overall_score - (v.deep_analysis.engagement.replayValue / 10)) > 0.3;
  }).length;
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 px-8 pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            σTaste Discovery System
          </h1>
          <p className="text-lg text-zinc-400">
            Uncover hidden variables that define quality. Train your model through comparison, 
            clustering, and adversarial probing.
          </p>
        </div>
        
        {/* Data Status */}
        <div className="bg-zinc-900 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {dataLoaded ? (
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-zinc-400" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold">
                  {dataLoaded ? `${videos.length} Videos Loaded` : 'No Data Loaded'}
                </h2>
                <p className="text-sm text-zinc-400">
                  {dataLoaded 
                    ? `${ratedVideos.length} with human ratings • ${comparisons.length} comparisons`
                    : 'Load your dataset to begin'
                  }
                </p>
                {importStatus && (
                  <p className="text-sm text-green-400 mt-1">{importStatus}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* File Import */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
                id="file-import"
              />
              <label
                htmlFor="file-import"
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium 
                           flex items-center gap-2 cursor-pointer text-sm"
              >
                <FileJson className="w-4 h-4" />
                Import JSON
              </label>
              
              {!dataLoaded && (
                <button
                  onClick={loadVideos}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 
                             rounded-lg font-medium flex items-center gap-2 text-sm"
                >
                  {loading ? 'Loading...' : 'Load from API'}
                </button>
              )}
            </div>
          </div>
          
          {dataLoaded && (
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="p-4 bg-zinc-800 rounded-xl">
                <p className="text-2xl font-bold text-blue-400">{videos.length}</p>
                <p className="text-sm text-zinc-400">Total Videos</p>
              </div>
              <div className="p-4 bg-zinc-800 rounded-xl">
                <p className="text-2xl font-bold text-green-400">{ratedVideos.length}</p>
                <p className="text-sm text-zinc-400">Rated</p>
              </div>
              <div className="p-4 bg-zinc-800 rounded-xl">
                <p className="text-2xl font-bold text-amber-400">{(avgScore * 10).toFixed(1)}</p>
                <p className="text-sm text-zinc-400">Avg Score</p>
              </div>
              <div className="p-4 bg-zinc-800 rounded-xl">
                <p className="text-2xl font-bold text-red-400">{adversarialCount}</p>
                <p className="text-sm text-zinc-400">Divergent</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Discovery Progress */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <GitCompare className="w-5 h-5 text-blue-400" />
              <span className="font-semibold">Comparisons</span>
            </div>
            <p className="text-3xl font-bold">{comparisons.length}</p>
            <p className="text-sm text-zinc-400">pairwise judgments made</p>
          </div>
          
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Network className="w-5 h-5 text-purple-400" />
              <span className="font-semibold">Corrections</span>
            </div>
            <p className="text-3xl font-bold">{clusterCorrections.length}</p>
            <p className="text-sm text-zinc-400">cluster adjustments</p>
          </div>
          
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <span className="font-semibold">Hidden Variables</span>
            </div>
            <p className="text-3xl font-bold">{hiddenVariables.length}</p>
            <p className="text-sm text-zinc-400">discovered dimensions</p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <h2 className="text-xl font-bold mb-4">Discovery Workflow</h2>
        <div className="grid grid-cols-2 gap-4">
          <Link 
            href="/compare"
            className="group bg-zinc-900 rounded-2xl p-6 hover:bg-zinc-800/80 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <GitCompare className="w-6 h-6 text-blue-400" />
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 
                                     group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Comparative Rating</h3>
            <p className="text-sm text-zinc-400">
              Compare video pairs to reveal subtle preferences. &quot;Which is better?&quot; 
              captures what absolute scores miss.
            </p>
            <span className="inline-block mt-2 px-2 py-1 bg-blue-500/20 text-blue-400 
                             text-xs rounded-full">
              {comparisons.length} / 500 target
            </span>
          </Link>
          
          <Link 
            href="/insights"
            className="group bg-zinc-900 rounded-2xl p-6 hover:bg-zinc-800/80 transition-all border border-purple-500/30"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 
                                     group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Variable Insights</h3>
            <p className="text-sm text-zinc-400">
              Analyze which AI variables predict your preferences, find gaps, 
              and discover hidden dimensions.
            </p>
            <span className="inline-block mt-2 px-2 py-1 bg-purple-500/20 text-purple-400 
                             text-xs rounded-full">
              NEW
            </span>
          </Link>
          
          <Link 
            href="/clusters"
            className="group bg-zinc-900 rounded-2xl p-6 hover:bg-zinc-800/80 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Network className="w-6 h-6 text-purple-400" />
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 
                                     group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Cluster Explorer</h3>
            <p className="text-sm text-zinc-400">
              See videos grouped by similarity. Drag to correct clusters and 
              reveal what dimensions the model is missing.
            </p>
          </Link>
          
          <Link 
            href="/adversarial"
            className="group bg-zinc-900 rounded-2xl p-6 hover:bg-zinc-800/80 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 
                                     group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Adversarial Probing</h3>
            <p className="text-sm text-zinc-400">
              Review cases where AI and human scores diverge. Articulate the gap 
              to discover hidden quality signals.
            </p>
            {adversarialCount > 0 && (
              <span className="inline-block mt-2 px-2 py-1 bg-red-500/20 text-red-400 
                               text-xs rounded-full">
                {adversarialCount} cases waiting
              </span>
            )}
          </Link>
          
          <Link 
            href="/calibrate"
            className="group bg-zinc-900 rounded-2xl p-6 hover:bg-zinc-800/80 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Sliders className="w-6 h-6 text-green-400" />
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 
                                     group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Weight Calibration</h3>
            <p className="text-sm text-zinc-400">
              Adjust dimension weights visually. See how changes affect rankings 
              in real-time without touching prompts.
            </p>
          </Link>
        </div>
        
        {/* Discovered Variables */}
        {hiddenVariables.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Recently Discovered</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {hiddenVariables.slice(0, 6).map(variable => (
                <div 
                  key={variable.id}
                  className="flex-shrink-0 p-4 bg-amber-500/10 border border-amber-500/30 
                             rounded-xl min-w-[200px]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span className="font-medium text-amber-400">{variable.name}</span>
                  </div>
                  <p className="text-xs text-zinc-400">{variable.description}</p>
                  <p className="text-xs text-zinc-500 mt-2">
                    via {variable.discovered_from}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
