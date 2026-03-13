"""
gLMS (generalized Labeled Magnitude Scale) for Python/PsychoPy.

A vertical visual analog scale with quasi-logarithmically spaced semantic
labels, designed to enable valid cross-group comparisons of subjective
intensity (Bartoshuk et al., 2004; Green et al., 1993, 1996).

The key innovation: the top anchor ("strongest imaginable sensation of any
kind") is modality-general, so group differences in one modality (e.g.,
taste for supertasters) don't distort the scale anchors.

Standard label positions (0-100 scale):
    0.0   — No sensation
    1.4   — Barely detectable
    6.1   — Weak
   17.2   — Moderate
   34.7   — Strong
   52.5   — Very strong
  100.0   — Strongest imaginable sensation of any kind

Usage:
    from glms import gLMS
    scale = gLMS()
    rating = scale.collect_rating("How intense was the taste?")

Requires: psychopy (for GUI version) or works standalone for analysis.

References:
    Bartoshuk, L. M., Duffy, V. B., Green, B. G., et al. (2004).
        Valid across-group comparisons with labeled scales: the gLMS
        versus magnitude matching. Physiology & Behavior, 82, 109-114.
    Green, B. G., Dalton, P., Cowart, B., et al. (1996). Evaluating the
        'Labeled Magnitude Scale' for measuring sensations of taste and
        smell. Chemical Senses, 21, 323-334.
    Green, B. G., Shaffer, G. S., & Gilmore, M. M. (1993). Derivation
        and evaluation of a semantic scale of oral sensation magnitude
        with apparent ratio properties. Chemical Senses, 18, 683-702.

Author: Vlad Chituc (https://vladchituc.com)
"""

from dataclasses import dataclass, field
from typing import Optional

# ── Standard gLMS labels and positions ───────────────────────────

GLMS_LABELS = [
    (0.0,   "No sensation"),
    (1.4,   "Barely detectable"),
    (6.1,   "Weak"),
    (17.2,  "Moderate"),
    (34.7,  "Strong"),
    (52.5,  "Very strong"),
    (100.0, "Strongest imaginable sensation of any kind"),
]

GLMS_INSTRUCTIONS = (
    "This scale captures the entire range of how intense experiences can "
    "possibly be. The top of the scale (100) represents the strongest "
    "sensation you could ever imagine experiencing — the absolute maximum "
    "intensity across all sensory modalities. The bottom (0) is the complete "
    "absence of any sensation. You should be able to rate any experience "
    "you have ever had or could imagine having somewhere on this scale."
)

# ── gVAS variant (same logic, horizontal layout) ────────────────

GVAS_LABELS = GLMS_LABELS  # Same labels, just rendered horizontally


@dataclass
class gLMS:
    """Generalized Labeled Magnitude Scale.

    Parameters
    ----------
    labels : list of (position, text) tuples
        Label positions (0-100) and their text. Defaults to standard gLMS.
    orientation : str
        'vertical' (standard) or 'horizontal' (gVAS variant).
    scale_min : float
        Minimum value (default 0).
    scale_max : float
        Maximum value (default 100).
    instructions : str
        Instructions shown to participants.
    """
    labels: list = field(default_factory=lambda: list(GLMS_LABELS))
    orientation: str = "vertical"
    scale_min: float = 0.0
    scale_max: float = 100.0
    instructions: str = GLMS_INSTRUCTIONS

    def get_label_positions(self) -> dict:
        """Return {position: label_text} mapping."""
        return {pos: txt for pos, txt in self.labels}

    def normalized_positions(self) -> list:
        """Return label positions as proportions (0-1)."""
        rng = self.scale_max - self.scale_min
        return [(pos - self.scale_min) / rng for pos, _ in self.labels]

    # ── PsychoPy integration ─────────────────────────────────────

    def to_psychopy_slider(self, win, pos=(0, 0), size=(0.05, 0.8),
                           **kwargs):
        """Create a PsychoPy Slider configured as a gLMS.

        Parameters
        ----------
        win : psychopy.visual.Window
        pos : tuple
            Position on screen.
        size : tuple
            (width, height) in norm units.
        **kwargs
            Additional arguments passed to visual.Slider.

        Returns
        -------
        psychopy.visual.Slider
        """
        from psychopy import visual

        ticks = [p for p, _ in self.labels]
        tick_labels = [t for _, t in self.labels]

        slider = visual.Slider(
            win,
            ticks=ticks,
            labels=tick_labels,
            granularity=0.1,
            pos=pos,
            size=size if self.orientation == "vertical" else size[::-1],
            style="slider",
            labelHeight=0.02,
            **kwargs,
        )
        return slider

    def collect_rating(self, prompt: str, win=None) -> Optional[float]:
        """Show the gLMS and collect a single rating.

        If no window is provided, creates a temporary one.

        Parameters
        ----------
        prompt : str
            Question text shown above the scale.

        Returns
        -------
        float or None
            The rating (0-100), or None if skipped.
        """
        from psychopy import visual, event, core

        own_win = win is None
        if own_win:
            win = visual.Window(
                size=(800, 900), color="white", units="norm"
            )

        prompt_text = visual.TextStim(
            win, text=prompt, pos=(0, 0.9), height=0.04,
            color="black", wrapWidth=1.5
        )
        instr_text = visual.TextStim(
            win, text=self.instructions, pos=(0, 0.78), height=0.025,
            color="gray", wrapWidth=1.5
        )
        slider = self.to_psychopy_slider(win)
        submit = visual.TextStim(
            win, text="Click here to submit",
            pos=(0, -0.9), height=0.03, color="blue"
        )

        rating = None
        while True:
            prompt_text.draw()
            instr_text.draw()
            slider.draw()
            submit.draw()
            win.flip()

            keys = event.getKeys(["escape"])
            if "escape" in keys:
                break

            mouse = event.Mouse(win=win)
            if mouse.isPressedIn(submit) and slider.rating is not None:
                rating = slider.rating
                break

        if own_win:
            win.close()

        return rating


@dataclass
class MagnitudeEstimation:
    """Magnitude estimation with a named benchmark.

    Parameters
    ----------
    benchmark_label : str
        Description of the benchmark event (e.g., "stealing a wallet").
    benchmark_value : float
        The number assigned to the benchmark (e.g., 10).
    zero_label : str
        What 0 means (e.g., "neither moral nor immoral").
    domain : str
        What is being rated (e.g., "moral wrongness", "pain intensity").
    """
    benchmark_label: str = "stealing a wallet"
    benchmark_value: float = 10
    zero_label: str = "neither moral nor immoral"
    domain: str = "moral wrongness"

    @property
    def instructions(self) -> str:
        bv = self.benchmark_value
        half = bv / 2
        double = bv * 2
        return (
            f"Please use 0 to mean \"{self.zero_label}.\"\n\n"
            f"As a {bv:.0f}, we want you to think about: {self.benchmark_label}. "
            f"This is your benchmark.\n\n"
            f"We will ask you to rate other items relative to this benchmark. "
            f"If the item is equal to the benchmark in {self.domain}, rate it "
            f"{bv:.0f}. If it is half as intense, rate it {half:.0f}. If it is "
            f"twice as intense, rate it {double:.0f}, and so on.\n\n"
            f"You can use any non-negative number, including decimals."
        )

    def collect_rating(self, prompt: str) -> Optional[float]:
        """Collect a magnitude estimate via text input (terminal)."""
        print(self.instructions)
        print(f"\n{prompt}")
        while True:
            resp = input("Your rating: ").strip()
            try:
                val = float(resp)
                if val < 0:
                    print("Please enter a non-negative number.")
                    continue
                return val
            except ValueError:
                print("Please enter a valid number.")


# ── Practice items for gLMS calibration ──────────────────────────

PRACTICE_ITEMS = [
    "The warmth of lukewarm water",
    "The brightness of a dimly lit room",
    "The loudness of a whisper",
    "The sweetness of a ripe strawberry",
    "The pain of biting your tongue",
    "The brightness of the sun on a clear day",
    "The warmth of holding a hot cup of coffee",
    "The loudness of a fire alarm",
    "The sweetness of honey",
    "The pain of a paper cut",
    "The strength of a firm handshake",
    "The warmth of a summer breeze",
    "The loudness of normal conversation",
    "The brightness of a candle in a dark room",
    "The pain of stubbing your toe",
]


def run_glms_with_practice(
    prompt: str,
    n_practice: int = 15,
    practice_items: Optional[list] = None,
) -> dict:
    """Run a full gLMS session: instructions, practice trials, then target.

    Parameters
    ----------
    prompt : str
        The target question to rate.
    n_practice : int
        Number of practice items (default 15, following Hayes et al., 2013).
    practice_items : list, optional
        Custom practice items. Defaults to PRACTICE_ITEMS.

    Returns
    -------
    dict with keys:
        'target_rating': float — the actual rating of interest
        'practice_ratings': list of (item, rating) tuples
    """
    import random

    scale = gLMS()
    items = practice_items or PRACTICE_ITEMS[:n_practice]
    random.shuffle(items)

    practice_ratings = []
    for item in items:
        r = scale.collect_rating(f"Rate the intensity of:\n{item}")
        practice_ratings.append((item, r))

    target = scale.collect_rating(prompt)

    return {
        "target_rating": target,
        "practice_ratings": practice_ratings,
    }
