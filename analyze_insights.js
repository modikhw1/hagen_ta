const fs = require('fs');

// Load comparison data from localStorage (sigma-taste store)
// Since we can't access browser localStorage from Node, check if there's an export
const exportFiles = [
  'sigma-taste-export-2025-12-17 (2).json',
  'sigma-taste-export-2025-12-16 (1).json'
].map(f => f);

let comparisons = [];
for (const file of exportFiles) {
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (data.comparisons) {
      comparisons = data.comparisons;
      console.log(`Loaded ${comparisons.length} comparisons from ${file}`);
      break;
    }
  }
}

if (comparisons.length === 0) {
  console.log('No comparison data found in export files');
  process.exit(0);
}

// Analyze the comparisons
const withWinner = comparisons.filter(c => c.winner_id !== null);
const byDimension = {};
const byConfidence = {};

comparisons.forEach(c => {
  byDimension[c.dimension] = (byDimension[c.dimension] || 0) + 1;
  if (c.confidence) {
    byConfidence[c.confidence] = (byConfidence[c.confidence] || 0) + 1;
  }
});

console.log('\n=== COMPARISON STATISTICS ===');
console.log(`Total comparisons: ${comparisons.length}`);
console.log(`With winner declared: ${withWinner.length} (${(withWinner.length/comparisons.length*100).toFixed(1)}%)`);

console.log('\n=== BY DIMENSION ===');
Object.entries(byDimension).sort((a,b) => b[1] - a[1]).forEach(([dim, count]) => {
  console.log(`${dim}: ${count} (${(count/comparisons.length*100).toFixed(1)}%)`);
});

console.log('\n=== BY CONFIDENCE ===');
Object.entries(byConfidence).sort((a,b) => b[1] - a[1]).forEach(([conf, count]) => {
  console.log(`${conf}: ${count} (${(count/comparisons.length*100).toFixed(1)}%)`);
});

// Check video coverage
const videoIds = new Set();
comparisons.forEach(c => {
  videoIds.add(c.video_a_id);
  videoIds.add(c.video_b_id);
});

console.log(`\n=== VIDEO COVERAGE ===`);
console.log(`Unique videos in comparisons: ${videoIds.size}`);

// Load video data
const videoFile = 'exports/exports_with_urls_2025-12-16.json';
if (fs.existsSync(videoFile)) {
  const videoData = JSON.parse(fs.readFileSync(videoFile, 'utf-8'));
  const videos = videoData.videos || videoData;
  console.log(`Total videos available: ${videos.length}`);
  
  // Check how many comparison videos have analysis data
  const videoMap = new Map(videos.map(v => [v.id, v]));
  const videosWithAnalysis = Array.from(videoIds).filter(id => {
    const v = videoMap.get(id);
    return v && (v.deep_analysis || v.visual_analysis);
  }).length;
  
  console.log(`Comparison videos with analysis data: ${videosWithAnalysis}/${videoIds.size}`);
}

console.log('\n=== INSIGHTS TO EXPLORE ===');
console.log('1. With ~250 comparisons, you have solid statistical power');
console.log('2. Check which dimensions you\'ve rated most/least');
console.log('3. Look for patterns in your confidence levels');
console.log('4. The correlation analysis can now identify meaningful patterns');
console.log('5. Ready to discover which AI variables predict your taste');

