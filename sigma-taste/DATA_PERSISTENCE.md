# Data Persistence & Storage in σTaste

## Current Implementation: Browser LocalStorage

### How Data is Saved

All your interactions are **automatically saved** to browser localStorage via Zustand's persistence middleware:

```typescript
// Automatically persisted:
- comparisons: PairwiseComparison[]      // Every A vs B judgment
- clusterCorrections: ClusterCorrection[] // When you drag videos between clusters
- hiddenVariables: HiddenVariable[]       // Discovered quality dimensions
- weights: SigmaTasteWeights             // Your calibrated weights
```

### Storage Location
- **Key**: `sigma-taste-storage`
- **Location**: Browser localStorage (per-domain, persists across sessions)
- **Format**: JSON

### What This Means

✅ **Pros:**
- Zero setup - works immediately
- No server/database needed
- Data persists across browser sessions
- Fast - no network requests
- Private - stays on your machine

⚠️ **Limitations:**
- Data is **browser-specific** (Chrome vs Firefox = different storage)
- **Not backed up** - clearing browser data = data loss
- **No sync** across devices
- **5-10MB limit** (enough for ~500-1000 comparisons)
- **No collaboration** - can't share work between team members

### Viewing Your Saved Data

Open browser DevTools (F12) → Application → Local Storage → `http://localhost:3000`:

```json
{
  "state": {
    "comparisons": [...],      // Your pairwise judgments
    "clusterCorrections": [...], // Your cluster moves
    "hiddenVariables": [...],   // Discovered dimensions
    "weights": {...}            // Current weight settings
  },
  "version": 0
}
```

---

## Export Workflow (Current Best Practice)

### For 200-300 Comparisons

**Recommended approach:**

1. **Work in localStorage** (current setup)
   - Make 200-300 comparisons
   - Adjust cluster corrections
   - Calibrate weights
   - Discover hidden variables

2. **Export periodically** using the Export button (navigation)
   - Downloads JSON snapshot: `sigma-taste-export-YYYY-MM-DD.json`
   - Includes ALL comparisons, corrections, variables, weights
   - Timestamped for version tracking

3. **Backup strategy:**
   - Export after every 50-100 comparisons
   - Keep exports in Git repo or cloud storage
   - Enables rollback if needed

### Export Format

```json
{
  "exported_at": "2025-12-16T14:30:00.000Z",
  "version": "1.0",
  "comparisons": [
    {
      "id": "abc123",
      "video_a_id": "...",
      "video_b_id": "...",
      "winner_id": "...",
      "dimension": "overall",
      "confidence": "certain",
      "reasoning": "A had better hook timing",
      "created_at": "2025-12-16T12:00:00.000Z"
    }
  ],
  "cluster_corrections": [...],
  "hidden_variables": [...],
  "weights": {...},
  "stats": {
    "total_comparisons": 250,
    "dimensions_explored": ["overall", "hook", "emotional"],
    "videos_compared": 85
  }
}
```

---

## When to Move to Database

### Stay with localStorage if:
- ✅ Solo researcher
- ✅ Under 1000 comparisons
- ✅ Single device/browser
- ✅ Periodic exports are acceptable

### Upgrade to database if:
- ❌ Team collaboration needed
- ❌ Multi-device sync required
- ❌ 1000+ comparisons (localStorage full)
- ❌ Need audit trail/history
- ❌ Want to run analytics on historical data

---

## Database Migration (Future)

### Architecture Options

#### Option 1: Supabase (Recommended)
```
Pros:
- PostgreSQL with real-time subscriptions
- Free tier: 500MB storage
- Built-in auth
- Works with existing video dataset

Migration effort: ~2-3 hours
```

#### Option 2: SQLite + Turso
```
Pros:
- Embedded database
- Easy local development
- Edge deployment
- No server management

Migration effort: ~1-2 hours
```

#### Option 3: MongoDB Atlas
```
Pros:
- Document model matches JSON structure
- Free tier available
- Flexible schema

Migration effort: ~2 hours
```

### Migration Process

1. **Schema Design**
   ```sql
   CREATE TABLE comparisons (
     id UUID PRIMARY KEY,
     video_a_id UUID,
     video_b_id UUID,
     winner_id UUID,
     dimension TEXT,
     confidence TEXT,
     reasoning TEXT,
     created_at TIMESTAMP
   );
   ```

2. **Import Existing Data**
   - Export from localStorage
   - Bulk insert into database
   - Verify data integrity

3. **Update Store**
   ```typescript
   // Replace localStorage with API calls
   addComparison: async (comparison) => {
     await fetch('/api/comparisons', {
       method: 'POST',
       body: JSON.stringify(comparison)
     });
   }
   ```

---

## Recommended Workflow for 200-300 Comparisons

### Phase 1: Rapid Discovery (Day 1-2)
```
1. Load 123 videos ✓
2. Make 50 "overall quality" comparisons
3. Export → sigma-taste-day1.json
4. Switch to "hook" dimension
5. Make 50 more comparisons
6. Export → sigma-taste-day2.json
```

### Phase 2: Cluster Exploration (Day 3-4)
```
1. Review auto-generated clusters
2. Drag 20-30 videos to correct clusters
3. Document why (hidden variables)
4. Export → sigma-taste-clusters.json
```

### Phase 3: Adversarial Testing (Day 5)
```
1. Review divergent cases (AI vs human)
2. Make targeted comparisons on edge cases
3. Articulate what AI missed
4. Export → sigma-taste-adversarial.json
```

### Phase 4: Weight Calibration (Day 6)
```
1. Adjust dimension weights
2. Validate against known "good" videos
3. Export final configuration
```

### Phase 5: Consolidation (Day 7)
```
1. Combine all exports
2. Analyze patterns in comparisons
3. Document discovered hidden variables
4. Prepare for v1.1 iteration
```

---

## Data Export Button Status

**Current State**: Button exists in navigation but not yet wired up

**Implementation**: Already coded in `/src/lib/utils.ts`:
```typescript
export function createExport(
  comparisons: PairwiseComparison[],
  corrections: ClusterCorrection[],
  hiddenVariables: HiddenVariable[],
  weights: SigmaTasteWeights
): ExportData { ... }

export function downloadJson(data: any, filename: string) { ... }
```

**To Wire Up**: Connect Navigation button to these utilities (5 minute task)

---

## Summary

✅ **For your 200-300 comparison goal**: Stay with localStorage + periodic exports
- Simple, fast, no infrastructure
- Export every 50 comparisons as backup
- Git commit exports for version history

🔄 **If you want collaboration/scale**: Consider database migration
- 2-3 hour effort for Supabase
- Enables team workflows
- Provides audit trail

📊 **Current Reality**: The UI is using **real JSON structures** loaded from your dataset
- 123 videos loaded from `exports_with_urls_2025-12-16.json`
- 109 have working signed URLs
- All visual/deep analysis data is real
- Comparisons are saved to localStorage (not in original JSON)
