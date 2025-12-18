const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./exports/v1.2/sigma-taste-export-2025-12-18.json', 'utf8'));
const comparisons = data.comparisons;

console.log('=== COMPARISON ANALYSIS ===\n');
console.log('Total comparisons:', comparisons.length);

// Dimension breakdown
const byDimension = {};
comparisons.forEach(c => {
  byDimension[c.dimension] = (byDimension[c.dimension] || 0) + 1;
});
console.log('\nBy Dimension:', byDimension);

// Confidence breakdown
const byConfidence = {};
comparisons.forEach(c => {
  byConfidence[c.confidence] = (byConfidence[c.confidence] || 0) + 1;
});
console.log('\nBy Confidence:', byConfidence);

// Ties vs decisions
const ties = comparisons.filter(c => c.winner_id === null).length;
console.log('\nTies (no winner):', ties, '(' + (100*ties/comparisons.length).toFixed(1) + '%)');
console.log('Clear winners:', comparisons.length - ties);

// Video win/loss tracking
const videoStats = {};
comparisons.forEach(c => {
  const aId = c.video_a_id;
  const bId = c.video_b_id;
  
  if (!aId || !bId) {
    console.log('Skipping invalid comparison:', c.id);
    return;
  }
  
  if (!videoStats[aId]) {
    videoStats[aId] = { wins: 0, losses: 0, ties: 0, appearances: 0 };
  }
  if (!videoStats[bId]) {
    videoStats[bId] = { wins: 0, losses: 0, ties: 0, appearances: 0 };
  }
  
  videoStats[aId].appearances++;
  videoStats[bId].appearances++;
  
  if (c.winner_id === null) {
    videoStats[aId].ties++;
    videoStats[bId].ties++;
  } else if (c.winner_id === aId) {
    videoStats[aId].wins++;
    videoStats[bId].losses++;
  } else {
    videoStats[bId].wins++;
    videoStats[aId].losses++;
  }
});

// Calculate win rates
const videoRankings = Object.entries(videoStats).map(([id, stats]) => ({
  id: id.substring(0, 8),
  fullId: id,
  ...stats,
  winRate: stats.appearances > 0 ? (stats.wins + stats.ties * 0.5) / stats.appearances : 0
})).sort((a, b) => b.winRate - a.winRate);

console.log('\n=== TOP 15 VIDEOS (by win rate, min 3 appearances) ===');
videoRankings.filter(v => v.appearances >= 3).slice(0, 15).forEach((v, i) => {
  console.log(`${i+1}. ${v.id}...: ${(v.winRate * 100).toFixed(0)}% win rate (${v.wins}W/${v.losses}L/${v.ties}T, ${v.appearances} apps)`);
});

console.log('\n=== BOTTOM 10 VIDEOS (by win rate, min 3 appearances) ===');
videoRankings.filter(v => v.appearances >= 3).slice(-10).forEach((v, i) => {
  console.log(`${i+1}. ${v.id}...: ${(v.winRate * 100).toFixed(0)}% win rate (${v.wins}W/${v.losses}L/${v.ties}T, ${v.appearances} apps)`);
});

// Extract key themes from reasoning
const allReasoning = comparisons.map(c => c.reasoning || '').join(' ').toLowerCase();

const themes = {
  'sketch/premise': (allReasoning.match(/sketch|premise|setup/g) || []).length,
  'multiple shots': (allReasoning.match(/multiple shots|separate shots|shot change/g) || []).length,
  'single shot': (allReasoning.match(/single shot/g) || []).length,
  'absurdist/absurd': (allReasoning.match(/absurd/g) || []).length,
  'editing/production': (allReasoning.match(/editing|production/g) || []).length,
  'humor/funny': (allReasoning.match(/humor|funny|funnier/g) || []).length,
  'tempo/pacing': (allReasoning.match(/tempo|pacing|pace/g) || []).length,
  'replicable/replicability': (allReasoning.match(/replic/g) || []).length,
  'payoff': (allReasoning.match(/payoff/g) || []).length,
  'engaging/memorable': (allReasoning.match(/engaging|memorable/g) || []).length,
  'music/sound': (allReasoning.match(/music|sound/g) || []).length,
  'visual gag': (allReasoning.match(/visual gag|visual scene/g) || []).length,
};

console.log('\n=== THEME FREQUENCY IN REASONING ===');
Object.entries(themes).sort((a,b) => b[1] - a[1]).forEach(([theme, count]) => {
  if (count > 0) console.log(`${theme}: ${count} mentions`);
});

// Unique videos compared
console.log('\n=== COVERAGE ===');
console.log('Unique videos compared:', Object.keys(videoStats).length);
console.log('Avg appearances per video:', (comparisons.length * 2 / Object.keys(videoStats).length).toFixed(1));

// Most compared videos
console.log('\n=== MOST COMPARED VIDEOS ===');
[...videoRankings].sort((a,b) => b.appearances - a.appearances).slice(0, 10).forEach((v, i) => {
  console.log(`${i+1}. ${v.id}...: ${v.appearances} appearances (${(v.winRate * 100).toFixed(0)}% win rate)`);
});

// Confidence vs outcome analysis
console.log('\n=== CONFIDENCE DISTRIBUTION ===');
const confCounts = { barely: 0, somewhat: 0, certain: 0 };
comparisons.forEach(c => confCounts[c.confidence]++);
console.log(`Barely confident: ${confCounts.barely} (${(100*confCounts.barely/comparisons.length).toFixed(1)}%)`);
console.log(`Somewhat confident: ${confCounts.somewhat} (${(100*confCounts.somewhat/comparisons.length).toFixed(1)}%)`);
console.log(`Certain: ${confCounts.certain} (${(100*confCounts.certain/comparisons.length).toFixed(1)}%)`);

// Time analysis
const times = comparisons.map(c => new Date(c.created_at));
const startTime = new Date(Math.min(...times));
const endTime = new Date(Math.max(...times));
const durationMinutes = (endTime - startTime) / 60000;
console.log('\n=== SESSION INFO ===');
console.log(`Session duration: ${durationMinutes.toFixed(0)} minutes`);
console.log(`Avg time per comparison: ${(durationMinutes * 60 / comparisons.length).toFixed(1)} seconds`);
