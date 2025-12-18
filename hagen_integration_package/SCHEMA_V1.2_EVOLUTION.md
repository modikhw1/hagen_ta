# σTaste Schema v1.2 — Evolution from v1.1

> **Purpose:** Track changes between v1.1 (spec) and v1.2 (implemented) schema iterations.
> **Created:** December 18, 2025
> **Source Dataset:** `exports/v1.2/dataset_2025-12-18.json`

---

## Overview

This document tracks the evolution from the **v1.1 specification** (defined in `SCHEMA_V1.1_SIGMA_TASTE.md`) to the **v1.2 implementation** based on the actual output from the updated Vertex AI video analysis tool.

### Key Distinction

| Aspect | v1.1 | v1.2 |
|--------|------|------|
| **Status** | Specification document | Implemented dataset |
| **Schema Version** | `"1.1"` (proposed) | `schema_version: 1` (actual) |
| **Source** | Question Battery analysis | Vertex AI system output |
| **Location** | `SCHEMA_V1.1_SIGMA_TASTE.md` | `exports/v1.2/dataset_2025-12-18.json` |

---

## What v1.2 Implements from v1.1

### ✅ Fully Implemented

| v1.1 Signal | v1.2 Path | Notes |
|-------------|-----------|-------|
| `schema_v1_signals.execution` | ✅ Present | All 5 numeric signals implemented |
| `schema_v1_signals.personality` | ✅ Present | All 4 personality scores |
| `schema_v1_signals.coherence` | ✅ Present | `personality_message_alignment_0_1` |
| `schema_v1_signals.replicability` | ✅ Present | Categorical decomposition |
| `schema_v1_signals.risk_level` | ✅ Present | All risk signals |
| `schema_v1_signals.hospitality` | ✅ Present | Business context signals |
| `schema_v1_signals.target_audience` | ✅ Present | Demographic targeting |
| `schema_v1_signals.environment_requirements` | ✅ Present | Production context |

### ⚠️ Partially Implemented

| v1.1 Concept | v1.2 Reality | Gap |
|--------------|--------------|-----|
| `content_classification` (Stage 1) | Not separate object | Implicit in `content.format` and `hospitality` |
| `replicability_decomposed` (8 factors) | `schema_v1_signals.replicability` has 6 fields | Missing: `one_to_one_copy_feasibility.score`, `concept_transferability` |
| `utility_score` (computed) | Not present | Must compute client-side from replicability signals |
| `quality_score` (computed) | Not present | Must compute client-side from quality signals |
| `sigma_taste_final` | Not present | Must compute client-side |

### ❌ Not Yet Implemented

| v1.1 Signal | Status | Alternative in v1.2 |
|-------------|--------|---------------------|
| `narrative_flow` | Not in schema | Use `scenes.sceneBreakdown[].narrativeFunction` |
| `performer_execution` | Not separate object | Partially in `execution.effortlessness_1_10` |
| `hook_analysis.desperation_signals` | Not present | Use `visual.hookStrength` with caution (negative correlation) |
| `payoff_analysis.earned_vs_cheap` | Not structured | Use `script.structure.payoffStrength` |
| `production_polish` (composite) | Not computed | Derive from `audio.quality + visual.overallQuality` |

---

## v1.2 Schema Structure

### Data Flow

```
exports/v1.2/dataset_2025-12-18.json
    │
    ├── videos[] (115 items)
    │   ├── id, video_url, platform, metadata
    │   ├── deep_analysis
    │   │   ├── audio.*
    │   │   ├── scenes.*
    │   │   ├── script.*
    │   │   ├── trends.*
    │   │   ├── visual.*
    │   │   ├── content.*
    │   │   ├── technical.*
    │   │   ├── engagement.*
    │   │   ├── schema_version: 1
    │   │   └── schema_v1_signals.*  ← KEY SIGNALS
    │   ├── rating (human scores)
    │   └── ai_prediction (duplicate of deep_analysis)
    │
    └── comparisons (in exports/v1.1/sigma-taste-export-2025-12-16.json)
```

### Numeric Paths for Correlation Analysis

**36 extractable numeric variables** (up from 28 in v1.1):

```typescript
// Core Analysis
'audio.quality', 'audio.audioEnergy', 'audio.audioVisualSync',
'engagement.replayValue', 'engagement.shareability', 'engagement.scrollStopPower', 'engagement.attentionRetention',
'technical.pacing', 'technical.cutsPerMinute',
'visual.hookStrength', 'visual.colorDiversity', 'visual.overallQuality', 'visual.compositionQuality',
'trends.timelessness', 'trends.trendAlignment',

// Script Signals (NEW in v1.2)
'script.originality.score', 'script.replicability.score', 'script.replicability.contextDependency',
'script.scriptQuality', 'script.humor.comedyTiming', 'script.humor.absurdismLevel',
'script.emotional.relatability', 'script.emotional.emotionalIntensity', 'script.structure.payoffStrength',

// Scene Signals (NEW in v1.2)
'scenes.visualNarrativeSync',

// Schema V1 Signals
'schema_v1_signals.coherence.personality_message_alignment_0_1',
'schema_v1_signals.execution.effortlessness_1_10', 'schema_v1_signals.execution.intentionality_1_10',
'schema_v1_signals.execution.social_permission_1_10', 'schema_v1_signals.execution.production_investment_1_10',
'schema_v1_signals.statement.self_seriousness_1_10',
'schema_v1_signals.conversion.visit_intent_strength_0_1',
'schema_v1_signals.personality.energy_1_10', 'schema_v1_signals.personality.warmth_1_10',
'schema_v1_signals.personality.formality_1_10', 'schema_v1_signals.personality.confidence_1_10',
```

---

## Breaking Changes from v1.1

### 1. Field Type Changes

| Field | v1.1 Type | v1.2 Type |
|-------|-----------|-----------|
| `audio.quality` | `string` | `number` |
| `audio.audioEnergy` | `string` | `number` |
| `script.humor.comedyTiming` | `string` | `number` |
| `script.humor.absurdismLevel` | `string` | `number` |
| `trends.trendAlignment` | `string` | `number` |

### 2. Removed Fields

| Field | Reason |
|-------|--------|
| `script.originality` (as number) | Now `script.originality.score` (object with sub-fields) |
| `script.replicability` (as number) | Now `script.replicability.score` (object with sub-fields) |

### 3. New Rich Fields

| Field | Content |
|-------|---------|
| `script.conceptCore` | High-level premise description |
| `script.visualTranscript` | Visual-only narrative description |
| `script.humor.humorMechanism` | Why the content is funny |
| `scenes.editPunchlineExplanation` | How editing creates comedy |

---

## Iteration Roadmap: v1.2 → v1.3

Based on the v1.1 spec gaps, the next iteration should:

### Priority 1: Computed Scores

Implement client-side computation for:

```typescript
// utility_score: 0-1 (Stage 2)
utility_score = weighted_avg(
  replicability.score * 0.4,
  actor_count_score * 0.2,
  environment_dependency_score * 0.2,
  estimated_time_score * 0.2
);

// quality_score: 0-1 (Stage 3)  
quality_score = weighted_avg(
  engagement.attentionRetention * 2.0,  // TOP predictor
  audio.quality * 1.8,
  technical.cutsPerMinute * 1.5,
  script.originality.score * 1.4
);

// sigma_taste_final: 0-1
sigma_taste_final = utility_score * 0.35 + quality_score * 0.65;
```

### Priority 2: Content Classification (Stage 1)

Add hard filtering by content type:

```typescript
content_classification = {
  content_type: infer_from(content.format, content.style),
  service_relevance: 'in_scope' | 'out_of_scope' | 'edge_case',
  strata_id: derive_from(hospitality.business_type, hospitality.vibe)
};
```

### Priority 3: Hook Analysis Enhancement

Replace simple `visual.hookStrength` (negative predictor!) with:

```typescript
hook_analysis = {
  hook_style: 'question' | 'visual_intrigue' | 'relatable_situation',
  desperation_signal: boolean,  // Triggers negative weight
  promise_quality: {
    curiosity_generated: 1-10,
    payoff_expected: boolean
  }
};
```

---

## File Structure After v1.2

```
exports/
├── v1.1/                               # Legacy datasets
│   ├── dataset_2025-12-16.json
│   ├── exports_with_urls_2025-12-16.json
│   └── sigma-taste-export-2025-12-16.json  # Comparisons still valid
│
└── v1.2/                               # Current iteration
    └── dataset_2025-12-18.json         # 115 videos, updated analysis

sigma-taste/src/
├── types/index.ts                      # Updated for v1.2 schema
├── lib/
│   ├── dataLoader.ts                   # V1_2_DATASET_PATH constant
│   └── correlationAnalysis.ts          # 36 numeric paths
└── store/sigma-taste-store.ts          # Unchanged

hagen_integration_package/
├── SCHEMA_V1.1_SIGMA_TASTE.md          # Original spec
├── SCHEMA_V1.2_EVOLUTION.md            # This document
└── ...other integration files
```

---

## Next Steps

1. **Run correlation analysis** on v1.2 dataset with pairwise comparisons
2. **Compute utility/quality scores** using the formulas above
3. **Identify top predictors** from the new numeric paths (especially `script.*` and `scenes.*`)
4. **Update Vertex system instructions** for v1.3 to include missing v1.1 signals

---

*Last updated: December 18, 2025*
