'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSigmaTasteStore } from '@/store/sigma-taste-store';
import {
  runFullAnalysis,
  exportForFingerprint,
  buildVideoMap,
  buildTrainingDataset,
  discoverAllNumericPaths,
  type SigmaTasteAnalysis,
  type VariableCorrelation,
} from '@/lib/correlationAnalysis';
import { downloadJson } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Brain,
  Lightbulb,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  FileText,
  Zap,
  Loader2,
} from 'lucide-react';

type DimensionFilter = 'overall' | 'hook' | 'production' | 'rewatchable' | 'all';

export default function InsightsPage() {
  const { comparisons, videos, setVideos } = useSigmaTasteStore();
  const [analysis, setAnalysis] = useState<SigmaTasteAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [dimension, setDimension] = useState<DimensionFilter>('overall');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['importance', 'hidden', 'recommendations', 'diagnostics'])
  );

  // Load videos from API if not present
  const loadVideosFromAPI = async () => {
    setLoadingVideos(true);
    try {
      const response = await fetch('/api/videos');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setVideos(data);
        }
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    }
    setLoadingVideos(false);
  };

  // Auto-load videos if we have comparisons but no videos
  useEffect(() => {
    if (comparisons.length > 0 && videos.length === 0 && !loadingVideos) {
      loadVideosFromAPI();
    }
  }, [comparisons.length, videos.length]);

  const runAnalysis = () => {
    if (comparisons.length === 0 || videos.length === 0) return;
    
    setLoading(true);
    // Use setTimeout to not block UI
    setTimeout(() => {
      const result = runFullAnalysis(comparisons, videos, dimension);
      setAnalysis(result);
      setLoading(false);
    }, 100);
  };

  useEffect(() => {
    if (comparisons.length > 0 && videos.length > 0 && !analysis) {
      runAnalysis();
    }
  }, [comparisons.length, videos.length]);

  // Diagnostics: check how many comparisons match loaded videos
  const diagnostics = useMemo(() => {
    if (videos.length === 0 || comparisons.length === 0) {
      return { matchedComparisons: 0, unmatchedComparisons: 0, missingVideoCount: 0, discoveredPaths: 0 };
    }
    
    const videoMap = buildVideoMap(videos);
    const trainingData = buildTrainingDataset(comparisons, videoMap);
    const missingIds = new Set<string>();
    
    comparisons.forEach(c => {
      if (!videoMap.has(c.video_a_id)) missingIds.add(c.video_a_id);
      if (!videoMap.has(c.video_b_id)) missingIds.add(c.video_b_id);
    });
    
    const discoveredPaths = discoverAllNumericPaths(videos);
    
    return {
      matchedComparisons: trainingData.length,
      unmatchedComparisons: comparisons.filter(c => c.winner_id !== null).length - trainingData.length,
      missingVideoCount: missingIds.size,
      discoveredPaths: discoveredPaths.length,
    };
  }, [videos, comparisons]);

  const toggleSection = (section: string) => {
    const next = new Set(expandedSections);
    if (next.has(section)) {
      next.delete(section);
    } else {
      next.add(section);
    }
    setExpandedSections(next);
  };

  const handleExport = () => {
    if (!analysis) return;
    const exportData = exportForFingerprint(analysis);
    const filename = `sigma-taste-analysis-${new Date().toISOString().split('T')[0]}.json`;
    downloadJson(exportData, filename);
  };

  // Stats
  const comparisonStats = useMemo(() => {
    const byDimension: Record<string, number> = {};
    const withWinner = comparisons.filter(c => c.winner_id !== null);
    comparisons.forEach(c => {
      byDimension[c.dimension] = (byDimension[c.dimension] || 0) + 1;
    });
    return { total: comparisons.length, withWinner: withWinner.length, byDimension };
  }, [comparisons]);

  if (comparisons.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white pt-20 px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <BarChart3 className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Comparison Data</h2>
            <p className="text-zinc-400 mb-6">
              Start making pairwise comparisons to analyze variable importance.
            </p>
            <a
              href="/compare"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
            >
              Start Comparing
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white pt-20 px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            {loadingVideos ? (
              <>
                <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
                <h2 className="text-2xl font-bold mb-2">Loading Video Data...</h2>
                <p className="text-zinc-400">
                  Fetching videos from exports to match with comparisons
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Video Data Required</h2>
                <p className="text-zinc-400 mb-2">
                  Analysis requires video metadata to correlate with your {comparisons.length} comparisons.
                </p>
                <p className="text-zinc-500 text-sm mb-6">
                  The comparison data references video UUIDs that need to be matched with deep_analysis metadata.
                </p>
                <button
                  onClick={loadVideosFromAPI}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                >
                  <RefreshCw className="w-5 h-5" />
                  Load Videos from API
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-20 px-8 pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-400" />
              σTaste Insights
            </h1>
            <p className="text-zinc-400">
              Correlate comparison outcomes with AI variables to discover what predicts your preferences
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Re-analyze
            </button>
            <button
              onClick={handleExport}
              disabled={!analysis}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export for Hagen
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="text-3xl font-bold text-blue-400">{comparisonStats.total}</div>
            <div className="text-sm text-zinc-400">Total Comparisons</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="text-3xl font-bold text-green-400">{diagnostics.matchedComparisons}</div>
            <div className="text-sm text-zinc-400">Matched with Videos</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="text-3xl font-bold text-amber-400">{videos.length}</div>
            <div className="text-sm text-zinc-400">Videos Loaded</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="text-3xl font-bold text-cyan-400">{diagnostics.discoveredPaths}</div>
            <div className="text-sm text-zinc-400">Numeric Variables</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="text-3xl font-bold text-purple-400">
              {analysis?.variableImportance.filter(v => v.confidence !== 'insufficient').length || 0}
            </div>
            <div className="text-sm text-zinc-400">Variables Analyzed</div>
          </div>
        </div>

        {/* Dimension Filter */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-zinc-400">Filter by dimension:</span>
          {(['all', 'overall', 'hook', 'production', 'rewatchable'] as DimensionFilter[]).map(d => (
            <button
              key={d}
              onClick={() => {
                setDimension(d);
                setTimeout(runAnalysis, 50);
              }}
              className={`px-3 py-1 rounded-lg text-sm ${
                dimension === d
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
              {comparisonStats.byDimension[d] && (
                <span className="ml-1 text-xs opacity-70">({comparisonStats.byDimension[d]})</span>
              )}
            </button>
          ))}
        </div>

        {/* Diagnostics Warning - Unmatched Comparisons */}
        {diagnostics.unmatchedComparisons > 0 && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <div className="font-medium text-red-300">Missing Video Data</div>
              <div className="text-sm text-red-200/70">
                {diagnostics.unmatchedComparisons} comparisons reference {diagnostics.missingVideoCount} video IDs 
                not found in loaded data. These comparisons cannot be analyzed until matching videos are imported.
              </div>
            </div>
          </div>
        )}

        {/* Sample Size Warning */}
        {diagnostics.matchedComparisons < 50 && diagnostics.matchedComparisons > 0 && (
          <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <div className="font-medium text-amber-300">Limited Sample Size</div>
              <div className="text-sm text-amber-200/70">
                With {diagnostics.matchedComparisons} matched comparisons, statistical confidence is limited. 
                Target 500+ for robust conclusions. Current results are directional indicators only.
              </div>
            </div>
          </div>
        )}

        {/* No matched comparisons warning */}
        {diagnostics.matchedComparisons === 0 && videos.length > 0 && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <div className="font-medium text-red-300">No Matching Data</div>
              <div className="text-sm text-red-200/70">
                None of your {comparisons.length} comparisons reference videos in the loaded dataset.
                The comparison video UUIDs don&apos;t match the loaded video IDs.
                Make sure you&apos;re loading the correct dataset that contains the compared videos.
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            <span className="ml-3 text-zinc-400">Running analysis...</span>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* Recommendations */}
            <CollapsibleSection
              title="Recommendations"
              icon={<Zap className="w-5 h-5 text-amber-400" />}
              expanded={expandedSections.has('recommendations')}
              onToggle={() => toggleSection('recommendations')}
            >
              <div className="space-y-2">
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                    <span className="text-sm text-zinc-300">{rec}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* Variable Importance */}
            <CollapsibleSection
              title="Variable Importance Ranking"
              icon={<TrendingUp className="w-5 h-5 text-green-400" />}
              expanded={expandedSections.has('importance')}
              onToggle={() => toggleSection('importance')}
              badge={`${analysis.variableImportance.filter(v => v.confidence !== 'insufficient').length} variables`}
            >
              <VariableImportanceTable variables={analysis.variableImportance} />
            </CollapsibleSection>

            {/* Logistic Regression */}
            <CollapsibleSection
              title="Logistic Regression Model"
              icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
              expanded={expandedSections.has('logistic')}
              onToggle={() => toggleSection('logistic')}
              badge={`${(analysis.logisticRegression.accuracy * 100).toFixed(0)}% accuracy`}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-400">
                      {(analysis.logisticRegression.accuracy * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-zinc-400">Model Accuracy</div>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-400">
                      {analysis.logisticRegression.topPredictors.length}
                    </div>
                    <div className="text-xs text-zinc-400">Active Features</div>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-400">
                      {analysis.logisticRegression.intercept.toFixed(3)}
                    </div>
                    <div className="text-xs text-zinc-400">Base Intercept</div>
                  </div>
                </div>
                
                <div className="text-sm text-zinc-400 mb-2">Top Predictors (by coefficient weight):</div>
                <div className="space-y-1">
                  {analysis.logisticRegression.topPredictors.map((pred, i) => (
                    <div key={pred.path} className="flex items-center gap-3 p-2 bg-zinc-800/50 rounded">
                      <span className="text-xs text-zinc-500 w-6">{i + 1}</span>
                      <span className="flex-1 font-mono text-sm text-zinc-300">{pred.path}</span>
                      <DirectionBadge direction={pred.direction as 'higher_wins' | 'lower_wins'} />
                      <span className={`text-sm font-medium ${pred.weight > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pred.weight > 0 ? '+' : ''}{pred.weight.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleSection>

            {/* Hidden Variable Candidates */}
            <CollapsibleSection
              title="Hidden Variable Candidates"
              icon={<Lightbulb className="w-5 h-5 text-yellow-400" />}
              expanded={expandedSections.has('hidden')}
              onToggle={() => toggleSection('hidden')}
              badge={`${analysis.hiddenVariableCandidates.length} found`}
            >
              {analysis.hiddenVariableCandidates.length === 0 ? (
                <div className="text-zinc-500 text-sm">
                  No clear hidden variable patterns detected yet. More comparisons may reveal patterns.
                </div>
              ) : (
                <div className="space-y-4">
                  {analysis.hiddenVariableCandidates.map((hv, i) => (
                    <div key={i} className="bg-zinc-800 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-yellow-300 capitalize">{hv.name}</div>
                          <div className="text-sm text-zinc-400">{hv.description}</div>
                        </div>
                        <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                          {hv.frequency} mentions
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 mb-2">Suggested path: {hv.suggestedPath}</div>
                      {hv.evidence.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs text-zinc-400">Evidence from reasoning:</div>
                          {hv.evidence.map((e, j) => (
                            <div key={j} className="text-xs text-zinc-500 italic pl-2 border-l border-zinc-700">
                              {e}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleSection>

            {/* Reasoning Themes */}
            <CollapsibleSection
              title="Reasoning Text Themes"
              icon={<FileText className="w-5 h-5 text-cyan-400" />}
              expanded={expandedSections.has('themes')}
              onToggle={() => toggleSection('themes')}
              badge={`${analysis.reasoningThemes.length} themes`}
            >
              <div className="flex flex-wrap gap-2">
                {analysis.reasoningThemes.slice(0, 30).map((theme, i) => (
                  <div
                    key={i}
                    className="px-3 py-1 bg-zinc-800 rounded-full text-sm flex items-center gap-2"
                    title={theme.contexts.join('\n')}
                  >
                    <span className="text-zinc-300">{theme.term}</span>
                    <span className="text-xs text-zinc-500">{theme.frequency}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </div>
        ) : (
          <div className="text-center py-20 text-zinc-500">
            Click &quot;Re-analyze&quot; to run analysis
          </div>
        )}
      </div>
    </div>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  badge,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 hover:bg-zinc-800/50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-zinc-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-zinc-500" />
        )}
        {icon}
        <span className="font-medium flex-1 text-left">{title}</span>
        {badge && (
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
            {badge}
          </span>
        )}
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// Direction Badge
function DirectionBadge({ direction }: { direction: 'higher_wins' | 'lower_wins' | 'neutral' }) {
  if (direction === 'higher_wins') {
    return (
      <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
        <TrendingUp className="w-3 h-3" /> Higher wins
      </span>
    );
  }
  if (direction === 'lower_wins') {
    return (
      <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
        <TrendingDown className="w-3 h-3" /> Lower wins
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs bg-zinc-700 text-zinc-400 px-2 py-0.5 rounded">
      <Minus className="w-3 h-3" /> Neutral
    </span>
  );
}

// Confidence Badge
function ConfidenceBadge({ confidence }: { confidence: string }) {
  const styles: Record<string, string> = {
    high: 'bg-green-500/20 text-green-400',
    medium: 'bg-amber-500/20 text-amber-400',
    low: 'bg-zinc-700 text-zinc-400',
    insufficient: 'bg-zinc-800 text-zinc-500',
  };
  
  const icons: Record<string, React.ReactNode> = {
    high: <CheckCircle2 className="w-3 h-3" />,
    medium: <AlertCircle className="w-3 h-3" />,
    low: <HelpCircle className="w-3 h-3" />,
    insufficient: <Minus className="w-3 h-3" />,
  };
  
  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${styles[confidence]}`}>
      {icons[confidence]} {confidence}
    </span>
  );
}

// Variable Importance Table
function VariableImportanceTable({ variables }: { variables: VariableCorrelation[] }) {
  // Filter out insufficient data and sort by effect size
  const filtered = variables
    .filter(v => v.confidence !== 'insufficient')
    .sort((a, b) => Math.abs(b.effectSize) - Math.abs(a.effectSize));
  
  if (filtered.length === 0) {
    return (
      <div className="text-zinc-500 text-sm">
        Insufficient data for analysis. Need more comparisons with overlapping video pairs.
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-zinc-400 border-b border-zinc-800">
            <th className="pb-2 font-medium">#</th>
            <th className="pb-2 font-medium">Variable Path</th>
            <th className="pb-2 font-medium">Direction</th>
            <th className="pb-2 font-medium text-right">Effect Size</th>
            <th className="pb-2 font-medium text-right">Mean Δ</th>
            <th className="pb-2 font-medium text-right">Samples</th>
            <th className="pb-2 font-medium">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {filtered.slice(0, 30).map((v, i) => (
            <tr key={v.path} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
              <td className="py-2 text-zinc-500">{i + 1}</td>
              <td className="py-2 font-mono text-zinc-300">{v.path}</td>
              <td className="py-2">
                <DirectionBadge direction={v.direction} />
              </td>
              <td className="py-2 text-right">
                <span className={Math.abs(v.effectSize) > 0.3 ? 'text-purple-400 font-medium' : 'text-zinc-400'}>
                  {v.effectSize.toFixed(3)}
                </span>
              </td>
              <td className="py-2 text-right">
                <span className={v.meanDelta > 0 ? 'text-green-400' : v.meanDelta < 0 ? 'text-red-400' : 'text-zinc-400'}>
                  {v.meanDelta > 0 ? '+' : ''}{v.meanDelta.toFixed(3)}
                </span>
              </td>
              <td className="py-2 text-right text-zinc-400">{v.sampleCount}</td>
              <td className="py-2">
                <ConfidenceBadge confidence={v.confidence} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {filtered.length > 30 && (
        <div className="text-center text-zinc-500 text-sm mt-4">
          Showing top 30 of {filtered.length} variables
        </div>
      )}
    </div>
  );
}
