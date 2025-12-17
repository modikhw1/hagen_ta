# σTaste Calibration Battery
## Combining Comparison Insights with Video Analysis Data

This document surfaces AI-generated assessments from your 120 videos alongside the insights discovered from your 254 pairwise comparisons. The goal is to understand **why** certain variables predict your preferences, identify where AI assessments are wrong, and discover hidden factors.

**Important Context:** Many AI scores below are *subjective guesses* by Google Gemini Vertex, not objective measurements. Your answers will help calibrate which AI judgments to trust and which to override.

# Notes by creator, added 17 december

In the original datasource containing 120 videos and it's related models, there is functionality to "correct" humor analysis that is incorrect. These corrections are added through a RAG correcting system, but does not alter the original scripts or the vertex interpretation of it. Meaning that some videos (likely 30-40%) would have incorrect analysises of what the joke is about, or how the setup/release works. This will skew this batterys overall understanding. Especially videos relying on visual reveals/payoffs may be misunderstood in the file "exports/dataset_2025-12-16.json"

---

# Part 1: The Audio Paradox

## Discovery
**Quantitative Finding:** `audioQuality` is your 2nd strongest predictor (r=+0.169)
**Qualitative Finding:** Only 7.5% of your notes mention audio

### Question 1.1: Audio Awareness
The AI rated these videos on audio quality:

**High Audio Quality (AI Score 8-9):**
- Video with "Dialogue and sound effects are clear and balanced" + tape ripping sounds (absurdist customer service skit)
- Videos with "comedic sting" + well-timed sound effects

**Low Audio Quality (AI Score 5-6):**
- Videos with "no music, just ambient noise"
- Videos with "voice unclear at moments"

**Your Question:**
When you prefer one video over another, how often do you consciously notice the audio quality?

- [X] Almost never - audio doesn't register consciously
- [ ] Sometimes - only when it's notably bad or good
- [ ] Often - I notice audio differences but don't articulate them
- [ ] Always - audio is a major conscious factor

**Follow-up:** If you rarely notice audio consciously, why do you think higher audio quality videos win your comparisons?

```
Your answer:
_____________________________________________________________________________

I watched these videos earlier when analyzing them using the other codespace hagen. This time, I watched the clips without audio, since I have previewed them earlier. Meaning that realistically, audioquality would be connected to clips with good or intentional production quality. Perhaps videos with good composition, good camera angles would also have the underlying value of having good audio.
____________________________________________________________________________
```

### Question 1.2: What Counts as "Good Audio"?
The AI considers these elements for audio quality:
- `audioVisualSync` - How well audio matches visuals (Scale 1-10)
- `audioMix` - Balance of dialogue, music, effects
- `soundEffects` - Comedic stings, ambient sounds
- `musicType` - Stock music, none, original

**Your Question:**
Which audio element do you think matters most to your enjoyment (even subconsciously)?

- [ ] Timing of sound effects (comedic stings landing perfectly)
- [ X ] Clean dialogue/voice clarity
- [ X ] Absence of distracting audio issues
- [ X ] Music choice and energy
- [ ] Something else: ________________

```
Your answer:
_____________________________________________________________________________
```

---

# Part 2: The Hook vs. Retention Disconnect

## Discovery
**Quantitative Finding:** `hookStrength` is NEGATIVE (r=-0.047), but `attentionRetention` is your TOP predictor (+0.173)
**Meaning:** Flashy openings hurt your preference; sustained engagement wins

### Video Examples from Your Data:

**High Hook, Variable Retention:**
> **Video 69e4bbea (Lunch break skit):**
> - Hook: "Text overlay: POV: you're about to start your lunch break" 
> - AI `hookStrength`: 8/10
> - AI `attentionRetention`: 8/10
> - Hook Type: "relatable-situation"
> - Your notes: "The premise is decent and the humor is accessible... simple workplace dynamic"

**High Retention, Lower Hook:**
> **Video f3ed3256 (Absurdist pastry bite):**
> - Hook: "Man taking a bite of the pastry"
> - AI `hookStrength`: 7/10
> - AI `attentionRetention`: 7/10
> - Hook Type: "action"
> - Your notes: "The joke is played out as a scenario... The video description initially describes this idea..."

### Question 2.1: What Makes You Keep Watching?
Your notes frequently mention concepts like "premise," "payoff," and "engaging." The AI tracks these separately:
- `hookStrength` - Initial grab power
- `scrollStopPower` - Likelihood to stop scrolling
- `attentionRetention` - Sustained interest throughout

**Your Question:**
Which best describes what keeps you watching a video?

- [ X ] Strong opening that promises something interesting
- [ X ] Curiosity about how the premise will resolve
- [ X ] Feeling like each moment adds something
- [ ] Waiting for a payoff I can sense is coming
- [ ] Something else: ________________

```
Elaborate:
_____________________________________________________________________________

The concept of hookStrength would likely have to do with how active the first shot is, meaning that it begins with some movement (perhaps a character entering the shot), a nice composited shot, or some effect that makes the video pop and draw attention. In these videos, usually a text-overlay accompanies the video which sets the theme. Depending on how long or simple the text is to read, different amounts of hookStrength can be assumed. The premise itself also matters, where an emotional undertone (however that is defined) can strengthen the curiosity and engagement. hookStrength and scrollStopPower seem equal somehow. Attention retention likely has a multitude of variables that make the person want to see the clip. Perhaps physical attraction (attractive scenes, backdrops, people), or interest points (themes, businesses, premises).
_____________________________________________________________________________
```

### Question 2.2: The "Slow Burn" Hypothesis
Based on your data, you seem to prefer "slow burn" content over "clickbait hooks."

**AI Hook Type Classifications in Your Videos:**
- `relatable-situation` - "POV: you're about to start your lunch break"
- `question` - "Hi, do you guys sell cakes?"
- `action` - "Man taking a bite of the pastry"
- `visual-intrigue` - Showing something unusual immediately

**Your Question:**
Do you agree that flashy/aggressive hooks turn you off, even if they're effective at grabbing attention?

- [ ] Yes - I prefer understated openings that earn my attention
- [ X ] Partially - Some hooks work, but desperation is off-putting
- [ ] No - Good hooks are good, I don't have anti-hook bias
- [ X ] Unsure - Need to think about specific examples

```
What makes a hook feel "earned" vs "desperate"?
_____________________________________________________________________________

The hook in how I perceive it is the interest it draws in, while very early either promising or alluding to a reason to stay. Some of the content I 'dont' like will usually point towards a POV text overlay that does too much, sets too much of the premise or overexplains. This isn't inherently bad, but I think I subconsciously connect it to low effort content that has a premise setup entirely the first second, and then getting the "payoff" within 3-7 seconds, often in a unsophisticated/uncreative way. The videos that have a strong hook, but allows for a slow burn tempo, with actually creative movements/beats, or even a good payoff, are good. But that depends on concept/premise/script quality or if the core idea is original/unique or creative.
_____________________________________________________________________________
```

---

# Part 3: The Originality Paradox

## Discovery
**Quantitative:** `scriptOriginality` correlates positively (+0.123) - you prefer novel content
**Qualitative:** 44.3% of your notes discuss originality/creativity

BUT: `scriptReplicability` has near-zero correlation (+0.033), even though 42.5% of notes discuss it

### Video Examples with Originality Assessments:

**Video 69e4bbea (Lunch break interruption):**
```json
{
  "originality": {
    "score": 7,
    "novelElements": ["The emphasis on editing as the punchline, the concise storytelling."],
    "similarFormats": ["Relatable work-related skits on TikTok and Instagram."]
  },
  "replicability": {
    "score": 9,
    "template": "A worker is about to enjoy a simple pleasure, only to have it abruptly interrupted, followed by an over-the-top comedic reaction."
  }
}
```
**Your Rating:** 0.7/1.0 with note: "The premise is decent and the humor is accessible. It's not the most clever..."

**Video f3ed3256 (Absurdist pastry bite → biting colleague):**
```json
{
  "originality": {
    "score": 7,
    "novelElements": ["The specific chain of events – bad taste leading to biting someone – is relatively unique."],
    "similarFormats": ["Reaction videos", "Prank videos"]
  },
  "replicability": {
    "score": 7,
    "template": "Someone eats something disgusting, leading to a ridiculous or violent reaction on another person or object."
  }
}
```
**Your Rating:** 0.7/1.0 with note: "The premise is somewhat funny. It is somewhat creative, not extremely clever or amusing."

### Question 3.1: What Counts as "Original" to You?
The AI identifies `novelElements` for each video. Looking at the examples above:

**Your Question:**
When you say something is "creative" or "more original," what do you actually mean?

- [ ] The premise/idea itself is new (never seen this concept)
- [ ] The execution is fresh (familiar concept, novel approach)
- [ ] The combination of elements is unexpected
- [ ] The twist/payoff subverts expectations
- [ X ] Something harder to articulate: creative or original would be something that subverts expectations, that perhaps plays on a good trope or a cultural callback without doing it in a too obvious or straightforward way. If the joke feels like it's coming from miles away, this is usually something that hinders the feeling of something being creative. If the trope is not emotionally engaging, or too far fetched, it will not capture people in general.

```
Can you describe what makes a video premise feel "clever" vs "obvious"?

Different people have different propensities to what they find amusing. If someone is very simple or not comedically adjusted to extreme/absurdist/subtle types of humor, then a simple scenario or simple dialogue can go a long way. In the two clips you described, the first video of someone being interrupted by a customer, before eating, is a fairly "simple" premise. It's something that doesn't win any prices of unique setups, or trying to "say anything", or take a position or show off a certain personality trait. It's a common scenario, people understand it and it doesn't contain a lot of interesting aspects, but it can be amusing for people who like simple stuff.

The second video is also within the safe realm, but has more cleverness to it due to implying that the story is set in another dimension, first eating some dessert, and then being alluded to being in a dream-state, where the two colleagues are in a car and the person eating dessert was biting his friend's arm. This has some more creativity to it.

```

### Question 3.2: The Replicability Disconnect
You frequently analyze replicability in notes, but it doesn't predict your preference.

From your comparison notes:
> "Video A is easier to replicate, but the humour in itself is very simple and not the most amusing."
> "The first video is easier to replicate, but the humour in itself is very simple and not the most amusing. The second video is harder to replicate, but has a more engaging and creative premise."

**Your Question:**
Why do you think about replicability if it doesn't influence which video you prefer?

- [ ] Professional/analytical habit - I evaluate it but it doesn't sway preference
- [ ] I WANT to prefer replicable content but something else wins
- [ X ] Replicability matters for utility, not enjoyment
- [ ] I'm actually not sure why I analyze it so much

```
What role SHOULD replicability play in your content assessment?
_____________________________________________________________________________

Replicability is a metric that can hold many variables to create the cluster of meaning. Right now, a singular value doesn't make sense, especially if an AI is attempting to define it. The σTaste value has to do with my subjective taste, but that also contains what I consider to be valuable and 'good' for using in a service I aim to develop.

Replicability is included in my σTaste value, and replicability would contain a multitude of factors

-How easy the content would be to replicate by a similar company (either restaurant, café or bar)
-How much hassle/preparation would be needed (my understanding based on what I see), and within this value: How advanced is the setup? How much is expected of the characters to make the premise work? (i.e. does someone have to take big social risks? Is animated acting essential?)
-Amount of people required, props required, backdrops required
-If a script has strength by itself, making the backdrop irrelevant, or highly important for the premise in itself.
-If props or scenes need to be replaced or creatively altered, meaning that a sketch that talks about drinks, can it effectively be replaced by a food or coffée item? Or if the sketch has visual comedy, seen with 3-4 shots that "play out" the punch line - does the business replicating the video have to come up with their own version for the sketch to make sense? (1:1 copying not possible)
-Does the clip require skilled editing.
-Is the concept too niche or have an underlying tone that alienates a lot of people? For example, if the setting and set utilized teenagers, and talking about teenage issues, would a restaurant aiming to attract general audiences replicate the premise?

The videos I prefer have replicable premise, and is usually strong regardless of setting. One video I rate highly isn't set in a restaurant, but is in my opinion smart and can be reused in a service environment, as long as the prop can be interchanged easily (e1ad2e56).

_____________________________________________________________________________
```

---

# Part 4: Humor Mechanics

## Discovery
**Qualitative:** 49.1% of notes mention humor, but no humor metric strongly predicts preference
**Hypothesis:** It's not IF something is funny, but HOW the humor is executed

### Humor Types in Your Video Dataset:

**AI Classification `humorType`:**
- `observational, visual-reveal, edit-punchline` - Most common
- `absurdist` - Second most common
- `situational, reaction`
- `exaggeration, physical`

**AI Explanation Examples:**

**Video 69e4bbea:**
> "The humor comes from the relatable experience of having a longed-for break interrupted. The visual reveal of the customer, followed by the immediate black-and-white transition and sting music amplifies the employee's annoyance in an exaggerated way."

**Video with taped faces:**
> "The humor comes from the absurdity of the situation - literally taping on smiling faces to mask genuine annoyance. The contrast between the forced politeness and the underlying anger creates the comedic effect."

### Question 4.1: Humor Type Preferences
Looking at the humor types above:

**Your Question:**
Which humor mechanics consistently land for you?

Rate each 1-5 (1=rarely works, 5=almost always works):

- [ ] Observational (relatable situations) ___
- [ ] Visual reveal (something unexpected shown) ___
- [ ] Edit as punchline (the cut IS the joke) ___
- [ ] Absurdist (disproportionate/illogical reactions) ___
- [ ] Situational (context creates humor) ___
- [ ] Physical/slapstick ___
- [ ] Verbal wit/wordplay ___

### Question 4.2: Execution Quality
The AI rates `comedyTiming` (1-10) for each video.

**Your Question:**
When a funny premise doesn't land, what usually fails?

- [ ] Timing is off (too slow, too fast)
- [ ] The performer isn't selling it
- [ ] The payoff doesn't match the setup
- [ ] It goes on too long
- [ ] Something about the production undermines it
- [ ] Other: ________________

```
Describe a video that had a good premise but failed in execution:
_____________________________________________________________________________
_____________________________________________________________________________
```

### Question 4.3: The "Clever" Factor
From your notes:
> "The idea of proposing with that type of camera reveal is clever."
> "Video A has a more fun premise"
> "The premise is not super good or clever"

**Your Question:**
What makes a comedic premise feel "clever" vs just "funny"?

```
Your answer:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
```

---

# Part 5: Payoff Structure

## Discovery
**Qualitative:** 40.6% of notes discuss "payoff" or "punchline"
**Quantitative:** No direct payoff metric predicts, but `attentionRetention` is top

### AI Payoff Analysis Examples:

**Video 69e4bbea:**
```json
{
  "payoff": "A customer enters the shop, and the video quickly transitions to black and white with a comedic sting, indicating the employee's ruined lunch break.",
  "payoffStrength": 9,
  "payoffType": "visual-reveal, edit-cut"
}
```

**Video with taped faces:**
```json
{
  "payoff": "The polite response delivered while the characters have taped-on smiles is the punchline.",
  "payoffStrength": 9,
  "payoffType": "visual-reveal",
  "hasCallback": true
}
```

### Question 5.1: Payoff Expectations
The AI tracks `payoffStrength` (1-10) and `payoffType`:
- `visual-reveal` - Something shown creates the punchline
- `edit-cut` - The edit itself is the joke
- `dialogue-delivery` - A line delivers the punch
- `twist` - Expectation subversion

**Your Question:**
When you describe a "strong payoff," what are you actually evaluating?

- [ ] Surprise factor (didn't see it coming)
- [ ] Logical fit (makes sense in retrospect)
- [ ] Proportionality (payoff matches setup investment)
- [ ] Satisfaction (feeling of completion)
- [ ] Cleverness (the "ah, that's smart" reaction)
- [ ] All of these, they're interconnected

```
Can you describe what a "weak payoff" feels like?
_____________________________________________________________________________
_____________________________________________________________________________
```

### Question 5.2: Setup-Payoff Balance
From your notes:
> "Video B has a somewhat amusing premise, but the payoff isn't very strong in itself"
> "Both premises are ok, with scripts that keep the viewer somewhat engaged and has a slow payoff structure, without a clear payoff in either video"

**Your Question:**
What's the ideal relationship between setup length and payoff magnitude?

- [ ] Short setup → punchy payoff (efficiency)
- [ ] Longer setup → bigger payoff (investment rewarded)
- [ ] Setup and payoff should feel proportional
- [ ] It depends on the content type
- [ ] I don't think in these terms

```
When does a setup feel "earned" vs "wasted time"?
_____________________________________________________________________________
_____________________________________________________________________________
```

---

# Part 6: Production & Technical Factors

## Discovery
**Quantitative:** `cutsPerMinute` correlates positively (+0.129) - you prefer faster editing
**Technical data in videos:** pacing, cutsPerMinute, editingStyle

### Technical Data Examples:

**Video 69e4bbea (Lunch break):**
```json
{
  "pacing": 9,
  "cutsPerMinute": 20,
  "editingStyle": "Abrupt and comedic. The cuts are used to emphasize the comedic timing.",
  "pacingDescription": "The video is very fast-paced. The short scenes and quick cuts maintain momentum."
}
```

**Video with taped faces:**
```json
{
  "pacing": 9,
  "cutsPerMinute": 36,
  "editingStyle": "Straightforward and comedic, with abrupt cuts to maximize the impact of the visual gags.",
  "pacingDescription": "The video is quick and to the point, with fast cuts that emphasize the comedic moments."
}
```

### Question 6.1: Pacing Preference
The AI tracks both raw `cutsPerMinute` and subjective `pacing` score.

**Your Question:**
When you prefer "faster pacing," what are you actually responding to?

- [ ] More happens per second (information density)
- [ ] No dead time/filler
- [ ] Energy/momentum feeling
- [ ] Quick comedic timing
- [ ] Something else: ________________

```
Is there such thing as "too fast"? What would that look like?
_____________________________________________________________________________
_____________________________________________________________________________
```

### Question 6.2: "Production Quality" Meaning
52.8% of your notes mention production. But what does that mean to you?

**Your Question:**
When you evaluate "production quality," which elements matter most?

Rate each 1-5 (1=don't care, 5=matters a lot):

- [ ] Image resolution/clarity ___
- [ ] Lighting quality ___
- [ ] Audio clarity ___
- [ ] Editing sophistication ___
- [ ] Camera work/framing ___
- [ ] Overall "polish" feeling ___
- [ ] Color grading ___

---

# Part 7: Hidden Variables & Gaps

Based on the analysis, these factors may be missing from the current model:

## Question 7.1: Narrative Coherence
Your top predictor is `attentionRetention`, and you often mention "flow" and "engagement."

**Hypothesis:** There's a "narrative coherence" quality beyond just pacing or editing.

**Your Question:**
What makes a video feel like it "flows" well vs feeling disjointed?

```
Your answer:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
```

## Question 7.2: Performer Quality
From your notes:
> "The barista requires some animated acting, which he does well"
> "The actress (worker) is also a bit more animated, and more attractive which helps with engagement"

**Your Question:**
How much does the performer's execution matter vs the premise itself?

- [ ] Premise is 80%+, performer is secondary
- [ ] About 50/50
- [ ] Performer can elevate or kill a premise significantly
- [ ] Great performer can make weak premise work

```
What makes someone "good" at performing short-form comedy?
_____________________________________________________________________________
_____________________________________________________________________________
```

## Question 7.3: AI Assessment Accuracy
Many AI scores are "guessed" by Gemini based on video analysis.

**Your Question:**
Based on the AI assessments you've seen in this document, how accurate do they feel?

- [ ] Surprisingly accurate - AI gets it
- [ ] Directionally right - scores correlate but aren't precise
- [ ] Often wrong - I disagree with many assessments
- [ ] Mixed - accurate on some dimensions, wrong on others

```
Which AI assessment type feels most/least reliable?
_____________________________________________________________________________
_____________________________________________________________________________
```

---

# Part 8: Meta Reflection

### Question 8.1: What This Revealed
After going through these questions, what new understanding do you have about your own preferences?

```
Your answer:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
```

### Question 8.2: Missing Factors
Is there something important to your content judgment that wasn't captured anywhere in this document?

```
Your answer:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
```

### Question 8.3: Priority for Model Improvement
If you could add ONE new variable to the analysis model, what would it be?

```
Your answer:
_____________________________________________________________________________
_____________________________________________________________________________
```

---

# Summary: Key Calibration Points

After completing this battery, the following should be clearer:

1. **Audio:** Why audio predicts preference despite low conscious awareness
2. **Hook vs Retention:** What "sustained engagement" actually means to you
3. **Originality:** What "clever" vs "obvious" means in your vocabulary
4. **Replicability:** Why you analyze it but don't prefer it
5. **Humor:** Which mechanics land and what kills execution
6. **Payoff:** What makes resolution "satisfying"
7. **Production:** Which technical elements you actually notice
8. **Hidden factors:** Narrative coherence, performer quality, and gaps

---

*This document combines:*
- *254 pairwise comparisons with 106 reasoning notes*
- *120 videos with full AI analysis (38,500 lines of JSON)*
- *Weighted correlation analysis (r values)*
- *Thematic analysis of your qualitative notes*

*Your answers will inform the next iteration of the σTaste model and Hagen fingerprint system.*
