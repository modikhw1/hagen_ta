# σTaste System Alignment Review

## Current State vs Dataset Reality

### ✅ What Works (Compare Page)
The comparison page is **fully aligned** with your goals and dataset:

**Goals Alignment:**
- ✅ Discovers hidden variables through pairwise comparison
- ✅ Captures subjective preferences ("which is better?")
- ✅ Works WITHOUT requiring ratings in the dataset
- ✅ Auto-normalizes your notes ("first one" → "Video A (left, 69e4bbea)")
- ✅ Saves to localStorage, exports to JSON
- ✅ No prompt editing needed - pure UI interaction

**How It Assists Your Goals:**
1. **Discovers σTaste Variables**: Your notes like "the first one has better timing" reveal what you value
2. **Builds Training Data**: 6 comparisons = 6 pairwise judgments that show relative preferences
3. **Scales Efficiently**: Can make 200-300 comparisons faster than rating each video
4. **Captures Nuance**: "barely confident" vs "certain" + reasoning text = richer signal
5. **Export = Training Set**: Your comparison JSON becomes input for model fine-tuning

**Current Workflow:**
```
1. See two videos side by side (A/B)
2. Download videos to view in QuickTime (H.265 codec issue)
3. Choose winner + confidence level
4. Write reasoning (auto-normalized to video IDs)
5. Export after 50-100 comparisons → Git commit
```

---

## ⚠️ What Needs Fixing

### 1. Adversarial Page (NOT WORKING)
**Problem**: Requires `rating.overall_score` field that your dataset LACKS

```typescript
// Line 297-302: This filter fails because rating field doesn't exist
.filter(v => {
  if (!v.rating?.overall_score) return false;  // ← ALL your videos fail here!
  const aiScore = v.deep_analysis?.engagement?.replayValue ?? null;
  if (aiScore === null) return false;
  return Math.abs(v.rating.overall_score - (aiScore / 10)) > threshold;
})
```

**Your Dataset Has:**
- `visual_analysis` ✓
- `audio_analysis` ✓
- `computed_scores` ✓
- `deep_analysis` ✓

**Your Dataset LACKS:**
- `rating` field ✗

**Result**: Adversarial page shows "No Divergent Cases" because it can't find any videos with human ratings to compare against AI scores.

---

### 2. Clusters Page (PARTIALLY WORKING)
**Problem**: Uses `rating.overall_score` for positioning (line 29)

```typescript
const overallScore = video.rating?.overall_score ?? 0.5;  // ← Defaults to 0.5 for all
```

**Current Behavior:**
- Clusters ARE generated (based on visual_analysis, deep_analysis)
- Positioning IS somewhat meaningful (uses engagement scores)
- But WITHOUT ratings, all videos have same baseline score
- Reduces cluster separation quality

**What It Does:**
- Groups videos by similarity using k-means
- You can drag videos between clusters
- Records corrections as "hidden variable suggestions"
- Works but less accurate without human ratings

---

### 3. Calibrate Page (PARTIALLY WORKING)
**Problem**: Computes weighted scores but has nothing to validate against

```typescript
// Line 81-92: Weights dimensions but can't compare to ground truth
const audience = analysis.schema_v1_signals?.target_audience ? 0.7 : 0.5;
const tone = analysis.script?.humor?.isHumorous ? 0.8 : 0.5;
// ... calculates weighted score
```

**What It Shows:**
- Sliders to adjust dimension weights
- Live preview of how rankings change
- But WITHOUT your ratings, can't tell if new weights are "better"

**Missing Feedback Loop:**
Your comparisons → could become ratings → calibrate validates changes

---

## 🎯 Recommended Workflow (Current System)

### Phase 1: Discovery via Comparison (YOU ARE HERE)
**Tool**: `/compare` page
**Goal**: Make 200-300 pairwise comparisons
**Output**: Export JSON with comparison data

**Why This Works:**
- Doesn't need pre-existing ratings
- Reveals what you value through choices
- Fast workflow (10-30 seconds per pair)

**Process:**
1. Start session, select dimension (Overall Quality)
2. Download both videos
3. Watch in QuickTime side by side
4. Choose winner + confidence
5. Write 1-2 sentence reasoning
6. Repeat
7. Export every 50 comparisons

---

### Phase 2: Convert Comparisons to Ratings (NEEDED)
**Current Gap**: No way to apply your comparisons back to videos

**What You Need:**
A script that takes your comparison export and computes ratings:
```python
# Bradley-Terry model or similar
comparisons = load('sigma-taste-export-2025-12-16.json')
ratings = fit_bradley_terry(comparisons)  # Converts pairwise to scores
save_ratings(ratings)  # Add to video dataset
```

**Then Re-import** to database with rating field populated

---

### Phase 3: Adversarial Testing (AFTER RATINGS)
**Tool**: `/adversarial` page
**Requirement**: Videos must have `rating.overall_score` field

**What It Does:**
- Finds videos where AI score ≠ your rating
- Forces you to articulate WHY the gap exists
- Discovers hidden variables AI missed

**Example:**
- AI thinks video is 8.5/10
- You rated it 4.0/10
- Page asks: "What did AI fail to see as negative?"
- You write: "The joke timing is awkward, feels forced"
- System suggests: Maybe "Subtle Timing" is a hidden variable

---

### Phase 4: Weight Calibration (AFTER RATINGS)
**Tool**: `/calibrate` page
**Requirement**: Videos need ratings to validate changes

**What It Does:**
- Adjust weights for: audience_alignment, tone_match, format, aspiration
- See how it changes video rankings
- Check if new rankings better match YOUR preferences

---

## 🔧 What to Fix

### Option A: Quick Fix (Use Comparisons Only)
**Keep current workflow:**
1. Make 200-300 comparisons
2. Export regularly
3. Use comparison data for model training
4. SKIP adversarial/calibrate pages (won't work without ratings)

**Pros:** No code changes needed
**Cons:** Can't use 40% of the app

---

### Option B: Add Rating Generation (Recommended)
**Process:**
1. Make 50-100 comparisons
2. Export comparisons
3. Run Bradley-Terry algorithm to compute ratings from comparisons
4. Update dataset with ratings
5. Reload app with rated videos
6. NOW use adversarial + calibrate pages

**Benefit:** Full system works as designed

**Implementation:**
I can create a script that:
- Takes your comparison export
- Computes implied ratings via pairwise model
- Outputs updated dataset with rating field

---

### Option C: Refactor Pages to Use Comparisons
**Change adversarial/calibrate to work from comparison data instead of ratings**

**Adversarial becomes:**
- "Videos where your comparison patterns are inconsistent"
- "Videos where you chose differently than expected"

**Calibrate becomes:**
- "Adjust weights to better predict YOUR comparison choices"

**Benefit:** Everything works with current dataset
**Cost:** 2-3 hours of coding

---

## 📊 Current Data Flow

```
Videos (123)
  ├─ visual_analysis ✓
  ├─ audio_analysis ✓  
  ├─ deep_analysis ✓
  └─ rating ✗ (MISSING)
       
         ↓
         
Compare Page ✓ WORKS
  → Comparisons (6 so far)
  → Export JSON ✓
  → Stored in localStorage ✓
  
         ↓
         
Clusters Page ~ WORKS (degraded)
  → Uses deep_analysis scores
  → Missing human ratings hurts accuracy
  
         ↓
         
Adversarial Page ✗ BROKEN
  → Needs rating.overall_score
  → Shows "No Divergent Cases"
  
         ↓
         
Calibrate Page ~ WORKS (no validation)
  → Can adjust weights
  → Can't tell if better (no ground truth)
```

---

## 🎯 Alignment with Original Goals

Your goal: **"Create a reliable system that allows for my input to discover hidden variables in σTaste"**

### ✅ Comparison Page = PERFECT ALIGNMENT
- Your input: Pairwise choices + reasoning
- Discovers hidden variables: Via your written notes
- Visual controls: Select winner, adjust confidence
- No prompt editing: Pure UI
- Reliable: Saves to localStorage, exports to JSON

### ⚠️ Other Pages = PARTIAL ALIGNMENT
- Need ratings to unlock full functionality
- Could work WITH comparisons but need refactoring
- Calibrate page aligns with "visual controls" goal
- Adversarial aligns with "discover hidden variables" goal

---

## 💡 Recommendation

**For 200-300 comparison goal:**

**Stick with Compare page + Export workflow:**
1. Make 50 comparisons/day for 4-6 days
2. Export after each session
3. Git commit exports
4. After 200-300 comparisons, run rating generation
5. Then unlock adversarial + calibrate

**This approach:**
- ✅ Works with current dataset
- ✅ Aligns with your goals
- ✅ Generates high-quality training data
- ✅ Can scale to full workflow later

**Skip:** Clusters, Adversarial, Calibrate pages until you have ratings

**Focus:** Comparison page is your discovery tool right now
