# Psychophysical Measures of Subjective Experience

Tools and templates for measuring subjective intensity in behavioral research — the **generalized Labeled Magnitude Scale (gLMS/gVAS)** and **magnitude estimation** — available in Python, R, jsPsych, and Qualtrics.

**[Tutorial & documentation →](https://vladchituc.github.io/glms-tools/)**

## Why these methods?

Standard labeled scales (Likert, VAS) have two well-documented problems:

1. **Interpersonal relativity** — "extremely angry" means different things to different people. If a group experiences emotions more intensely, their labels scale up with their experience (the [El Greco fallacy](https://en.wikipedia.org/wiki/El_Greco_fallacy)). The gLMS/gVAS solves this with a modality-general top anchor. See [Chituc & Scholl (2025)](https://doi.org/10.1007/s42761-025-00314-z), *Affective Science*.

2. **Nonlinearity** — Labeled scale responses are logarithmically related to actual subjective magnitude. Averaging Likert data directly is like averaging Richter scale values to estimate average earthquake energy — it systematically underestimates the mean (Jensen's inequality). See [Chituc, Crockett, & Scholl (2026)](https://doi.org/10.1016/j.cognition.2025.106315), *Cognition*.

**Magnitude estimation** provides ratio-scale measurement. The **gLMS** provides a visual analog scale that avoids interpersonal confounds.

## The gLMS / gVAS

A visual analog scale with quasi-logarithmically spaced semantic labels:

| Position | Label |
|----------|-------|
| 100 | Strongest imaginable sensation of any kind |
| 52.5 | Very strong |
| 34.7 | Strong |
| 17.2 | Moderate |
| 6.1 | Weak |
| 1.4 | Barely detectable |
| 0 | No sensation |

The key innovation: the top anchor ("strongest imaginable sensation of any kind") is modality-general. The **gLMS** is vertical; the **gVAS** is the horizontal variant with the same labels. Pilot data (N = 783) show equivalent results between orientations.

Based on: Bartoshuk et al. (2004), Green et al. (1993, 1996).

## Magnitude Estimation

Free-response numerical judgment relative to a named benchmark. Multiple instruction variants are included in the tutorial, organized by:

- **Modulus type**: fixed (experimenter assigns the number) vs. free (participant picks their own)
- **Instruction length**: two-page, one-paragraph, or minimal one-liner

All wordings are taken from actual published experiments. See the [tutorial](https://vladchituc.github.io/glms-tools/tutorial/) for exact text.

## Implementations

### Python (`python/glms.py`)

PsychoPy integration + standalone analysis helpers.

```python
from glms import gLMS, MagnitudeEstimation

# Collect a gLMS rating
scale = gLMS()
rating = scale.collect_rating("How intense was the taste?")

# gVAS (horizontal) variant
scale_h = gLMS(orientation="horizontal")

# Magnitude estimation
me = MagnitudeEstimation(
    benchmark_label="stealing a wallet",
    benchmark_value=10,
    domain="moral wrongness"
)
print(me.instructions)
```

### R (`R/glms.R`)

Shiny components + analysis helpers.

```r
source("glms.R")

# Shiny UI: vertical gLMS
glms_input("my_rating", "How intense was the taste?")

# Shiny UI: horizontal gVAS
glms_input("my_rating", "How intense?", orientation = "horizontal")

# Analysis helpers
me_log_transform(x)      # log(x + 1)
geometric_mean(x)         # exp(mean(log(x)))
plot_glms()               # Publication-ready figure

# Magnitude estimation instructions
me_instructions(benchmark_label = "stealing a wallet",
                benchmark_value = 10)
```

### jsPsych (`jspsych/plugin-glms.js`)

Plugin for jsPsych 7+.

```javascript
import gLMSPlugin from './plugin-glms.js';

const trial = {
  type: gLMSPlugin,
  prompt: "How intense was the anger you felt?",
  show_instructions: true,
  // orientation: "horizontal",  // for gVAS
};

// Data saved: { response: 34.7, rt: 2341 }
```

### Qualtrics (`qualtrics/glms-qualtrics.js`)

JavaScript to paste into a Qualtrics Slider question (gLMS, vertical). For gVAS (horizontal), no JavaScript needed — just a standard horizontal slider.

**Setup (gLMS):**
1. Create a Slider question
2. Set min = 0, max = 100, step = 0.1
3. Click the question → "Add JavaScript"
4. Paste the contents of `glms-qualtrics.js` into `addOnReady`

**Setup (gVAS):**
1. Create a horizontal Slider question (default)
2. Set min = 0, max = 100, step = 0.1
3. Add the gLMS instruction text as a preceding text block

**For magnitude estimation in Qualtrics**, no JavaScript needed:
1. Use a Text Entry question
2. Set validation: Number, Min = 0
3. Adapt the wording from the tutorial

## Interactive Demos

- [gLMS demo](tutorial/demo-glms.html) — vertical scale
- [gVAS demo](tutorial/demo-gvas.html) — horizontal scale
- [Magnitude estimation demo](tutorial/demo-me.html) — fixed and minimal variants

## Practice items

For gLMS/gVAS calibration, we recommend 15 practice trials (following Hayes et al., 2013) using cross-modal stimuli:

- The warmth of lukewarm water
- The brightness of a dimly lit room
- The loudness of a whisper
- The sweetness of a ripe strawberry
- The pain of biting your tongue
- The brightness of the sun on a clear day
- The warmth of holding a hot cup of coffee
- The loudness of a fire alarm
- The sweetness of honey
- The pain of a paper cut
- The strength of a firm handshake
- The warmth of a summer breeze
- The loudness of normal conversation
- The brightness of a candle in a dark room
- The pain of stubbing your toe

## References

- Bartoshuk, L. M., Duffy, V. B., Green, B. G., et al. (2004). Valid across-group comparisons with labeled scales: the gLMS versus magnitude matching. *Physiology & Behavior*, 82, 109-114.
- Chituc, V., Crockett, M. J., & Scholl, B. J. (2026). [How to show that a cruel prank is worse than a war crime.](https://doi.org/10.1016/j.cognition.2025.106315) *Cognition*, 266, 106315.
- Chituc, V. & Scholl, B. J. (2025). [The El Greco fallacy, this time with feeling.](https://doi.org/10.1007/s42761-025-00314-z) *Affective Science*, 6, 526-533.
- Green, B. G., Dalton, P., Cowart, B., et al. (1996). Evaluating the 'Labeled Magnitude Scale' for measuring sensations of taste and smell. *Chemical Senses*, 21, 323-334.
- Green, B. G., Shaffer, G. S., & Gilmore, M. M. (1993). Derivation and evaluation of a semantic scale of oral sensation magnitude with apparent ratio properties. *Chemical Senses*, 18, 683-702.
- Hayes, J. E., Allen, A. L., & Bennett, S. M. (2013). Direct comparison of the generalized Visual Analog Scale (gVAS) and general Labeled Magnitude Scale (gLMS). *Food Quality and Preference*, 28, 36-44.

## Author

[Vlad Chituc](https://vladchituc.com) — Yale University
