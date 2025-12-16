# Dialogue with Claude

Very concisely. Can AI learn taste? For example, what makes a good photo, good song, etc. If it is purely without any technical analysis, just mass data and human input, is it just volume and rating? And what would be the normal way of forming a subjective rating system that actually captures the real values underneath?13:00AI can learn taste patterns, but with caveats:
What AI actually learns:

Statistical correlations between features and human preferences
Not inherent "goodness" but what groups of humans consistently prefer
Works best when taste has some underlying structure (composition, harmony, cultural conventions)

The pure data approach:
Volume + ratings can work but has issues:

Captures popularity ≠ quality (viral content problem)
Reflects biases in who rates
Misses context (a "good" photo of a sunset vs. documentary photo)

Better rating systems typically use:

Comparative judgments - "Which is better?" rather than absolute scores (more reliable, less scale-drift)
Multiple dimensions - Rate "technical skill," "emotional impact," "originality" separately, then combine
Calibration sets - Include known benchmark examples so raters align
Expert weighting - Weight experienced judges more heavily (though risks elitism)
Context tags - "Good for what purpose?" matters enormously

The deep problem: Taste often involves ineffable qualities that even humans can't articulate. AI might predict that something will be liked without understanding why in any meaningful sense. It's pattern-matching preferences, not experiencing aesthetic value.
Human curation of training data remains critical—what you choose to show the model encodes values implicitly.Lets say that one human, has perfect taste that trumps all others opinions, and also perfect understanding of how the taste manifests and all of the subjective relational dynamics between subject, object and context. If trained on 100000 photos, that are somehow rated by this person, what would the data set end up as?If the goal is to get the AI to follow the persons taste exactly, rating just like the human would13:03With your perfect-taste oracle rating 100,000 photos, the ideal dataset would be:
Structure:

Comparative pairs/rankings - Not "7/10" but "A > B" across thousands of matchups

Forces consistency, reveals preference intensity
Avoids arbitrary scale problems



Multi-dimensional ratings per photo:

Core dimensions this person's taste actually uses (e.g., "visual tension," "authenticity," "compositional balance")
Their holistic final judgment
Crucially: Context tags - "genre," "intended purpose," "cultural moment" - since taste is relational

Rich annotations:

Which specific elements drove the rating (cropping, light quality, subject expression)
Negative examples with explanations ("technically perfect but soulless")
Edge cases where rules conflict

What makes this hard:
Even perfect-taste-person's ratings encode:

Implicit context they assume but don't state
Gestalt qualities - they know a photo works but can't decompose why into features AI can see
Relational judgments - this photo is good relative to photographic traditions AI hasn't internalized

The brutal truth:
100k photos might not be enough. If their taste depends on subtle interplay of 50+ factors, you need coverage of that combinatorial space. And if some "magic" depends on cultural knowledge or emotional resonance the person feels but can't articulate, the AI hits a ceiling.
You'd need the person to basically teach their taste - decompose their intuitions into rateable features - not just rate.Imagine that 1 and 2 isn't a problem. All context is stated, and can decompose any conceptual cluster of meaning, either singular or millions of small points.Is it also reasonable to assume that any technical insight, as composition, color schemes etc would be much easier to model than "has nostalgic depth", where the number of accurate datapoints need to be greater for it to work?13:06Yes, absolutely reasonable.
Technical features are easier because:

Discrete and measurable - "rule of thirds," "complementary colors" can be detected directly from pixels
Lower dimensional - Relatively few variables, clear boundaries
Consistent across contexts - A leading line is a leading line

"Nostalgic depth" is harder because:

Highly contextual - Depends on cultural memory, personal associations, historical awareness
Emergent property - Arises from combination of subtle cues (faded colors + analog grain + 90s fashion + casual framing)
Sparse signal - Most photos don't have it, so fewer positive examples
Needs broader knowledge - The AI must understand what era/culture/emotion is being evoked and why it resonates

Data requirements scale with:

Abstraction level - "Nostalgic" requires understanding human temporal experience
Feature interaction complexity - If it's the interplay of 20 subtle elements, you need examples covering that space
Context dependence - Same visual could be nostalgic in one context, kitsch in another

Practical implication:
You could probably train "good composition" on 1,000 photos. "Nostalgic depth" might need 50,000+ because you need:

Enough examples across different types of nostalgia
Near-misses (looks vintage but feels empty)
Cultural context variations

The conceptual clusters for abstract aesthetic qualities are just much larger dimensional spaces.Imagine someone is trying to teach a model to understand humor, by first explaining why a joke works, teaching it the human understanding of what makes a joke hit or miss, and then, assigning values to it's quality (either good or bad joke), that is subjective but assumed to be graded with a "perfect" evaluation as stated before.Let's say that I'm looking to model factors within Highly contextual, Emergent property, Sparse and Needs broader knowledge. How can I learn what signals to look for? If 1:1 taste accuracy is the goal, then hidden variables would need to be found.Would this only be possible with either perfect understanding of humour/jokes/and perfect taste, or is it a computable thing? For example, if TikTok aimed to teach a model to understand if a piece of content is good or bad, without relying on metadata as likes, comments, view times. How would their process look?Show less13:11The core problem: Hidden variable discovery
You need to surface the latent structure of what makes humor work - variables the expert uses but hasn't explicitly named.
Approaches to find hidden signals:
1. Adversarial probing

Show the model pairs where it disagrees with expert
Force expert to articulate: "What distinguishes these two?"
Iteratively reveals unconsidered dimensions

2. Feature ablation with expert

Systematically modify jokes (change timing, context, setup)
Expert rates each variant
Reveals which changes matter and by how much
Maps the sensitivity landscape

3. Cluster analysis + expert labeling

Model groups "similar" jokes by patterns it detects
Expert explains why clusters don't align with quality ratings
Reveals what model is missing (e.g., "these cluster on wordplay but ignore cultural timing")

4. Synthetic generation + grading

Model generates jokes using learned rules
Expert grades them
Failures reveal gaps: "technically correct setup-punchline but no subtext"

Is perfect understanding required?
No, but:

Expert must be able to recognize and grade the hidden variable when shown examples, even if they can't initially name it
Enough data diversity to triangulate the variable's effects
Iterative: find variable → label it → retrain → find next variable

The TikTok case:
Their process would likely be:

Start with expert panels grading content on multiple dimensions

Not just "good/bad" but: novelty, emotional resonance, craft, timing, cultural relevance


Active learning loop:

Model predicts quality
Surfaces high-disagreement cases to experts
"Why is this 'flat' despite good editing?" → discovers "lacks authenticity signal"


Behavioral proxy validation:

Eventually check: does model's "good" correlate with completion rate, shares?
Not to train on it, but to validate hidden variables were captured


Cross-cultural testing:

Same video rated across regions reveals context-dependent variables



The brutal constraint:
If a quality is truly ineffable - the expert genuinely cannot decompose it even when prompted - then you hit a wall. You'd need:

Massive data to let the model find correlations expert can't articulate
Risk of model learning spurious patterns (e.g., "good content has warm lighting" because expert happened to rate those samples)

The workaround:
Rather than 1:1 taste replication, aim for taste transfer learning: capture the expert's judgment process, not just outcomes. Have them grade while thinking aloud, noting hesitations, comparisons made. The reasoning path contains more signal than final scores.