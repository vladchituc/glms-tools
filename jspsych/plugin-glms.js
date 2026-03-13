/**
 * gLMS (generalized Labeled Magnitude Scale) plugin for jsPsych 7+
 *
 * A vertical visual analog scale with quasi-logarithmically spaced semantic
 * labels, designed for valid cross-group comparisons of subjective intensity.
 *
 * Based on: Bartoshuk et al. (2004), Green et al. (1993, 1996)
 *
 * Usage:
 *   import gLMSPlugin from './plugin-glms.js';
 *
 *   const trial = {
 *     type: gLMSPlugin,
 *     prompt: "How intense was the anger you felt?",
 *     show_instructions: true,
 *   };
 *
 * Data saved:
 *   response: number (0-100)
 *   rt: number (ms)
 *
 * Note on DOM construction: This plugin uses innerHTML for building its UI.
 * All content is hardcoded — no user input is rendered as HTML. This is safe
 * for a controlled experiment context. If you need to render user-provided
 * content, sanitize it first.
 *
 * Author: Vlad Chituc (https://vladchituc.com)
 */

const info = {
  name: "glms",
  version: "1.0.0",
  parameters: {
    prompt: { type: jspsych.ParameterType.HTML_STRING, default: "" },
    show_instructions: { type: jspsych.ParameterType.BOOL, default: true },
    orientation: { type: jspsych.ParameterType.STRING, default: "vertical" },
    scale_height: { type: jspsych.ParameterType.INT, default: 500 },
    button_label: { type: jspsych.ParameterType.STRING, default: "Continue" },
    required: { type: jspsych.ParameterType.BOOL, default: true },
    labels: { type: jspsych.ParameterType.COMPLEX, default: null },
  },
  data: {
    response: { type: jspsych.ParameterType.FLOAT },
    rt: { type: jspsych.ParameterType.INT },
  },
};

const GLMS_LABELS = [
  { position: 0,     label: "No sensation" },
  { position: 1.4,   label: "Barely detectable" },
  { position: 6.1,   label: "Weak" },
  { position: 17.2,  label: "Moderate" },
  { position: 34.7,  label: "Strong" },
  { position: 52.5,  label: "Very strong" },
  { position: 100,   label: "Strongest imaginable sensation of any kind" },
];

const GLMS_INSTRUCTIONS =
  "This scale captures the entire range of how intense experiences can " +
  "possibly be. The top of the scale (100) represents the strongest " +
  "sensation you could ever imagine experiencing \u2014 the absolute maximum " +
  "intensity across all sensory modalities. The bottom (0) is the complete " +
  "absence of any sensation.";

class gLMSPlugin {
  static info = info;

  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element, trial) {
    const labels = trial.labels || GLMS_LABELS;
    const startTime = performance.now();
    let currentValue = null;

    // Build UI using DOM methods
    const container = this._buildUI(trial, labels, display_element);

    const track = container.querySelector(".glms-track-area");
    const thumb = container.querySelector(".glms-thumb");
    const valueDisplay = container.querySelector(".glms-value");
    const btn = container.querySelector(".glms-submit-btn");

    const updateFromEvent = (e) => {
      const rect = track.getBoundingClientRect();
      let pct;
      if (trial.orientation === "vertical") {
        pct = 1 - (e.clientY - rect.top) / rect.height;
      } else {
        pct = (e.clientX - rect.left) / rect.width;
      }
      pct = Math.max(0, Math.min(1, pct));
      currentValue = Math.round(pct * 1000) / 10;

      if (trial.orientation === "vertical") {
        thumb.style.bottom = pct * 100 + "%";
      } else {
        thumb.style.left = pct * 100 + "%";
      }
      thumb.style.display = "block";
      valueDisplay.textContent = currentValue.toFixed(1);

      if (!trial.required || currentValue !== null) {
        btn.disabled = false;
        btn.style.opacity = "1";
      }
    };

    let isDragging = false;
    track.addEventListener("mousedown", (e) => { isDragging = true; updateFromEvent(e); });
    document.addEventListener("mousemove", (e) => { if (isDragging) updateFromEvent(e); });
    document.addEventListener("mouseup", () => { isDragging = false; });
    track.addEventListener("touchstart", (e) => { isDragging = true; updateFromEvent(e.touches[0]); e.preventDefault(); });
    document.addEventListener("touchmove", (e) => { if (isDragging) { updateFromEvent(e.touches[0]); e.preventDefault(); } });
    document.addEventListener("touchend", () => { isDragging = false; });

    btn.addEventListener("click", () => {
      if (trial.required && currentValue === null) return;
      const endTime = performance.now();
      display_element.replaceChildren();
      this.jsPsych.finishTrial({
        response: currentValue,
        rt: Math.round(endTime - startTime),
      });
    });
  }

  _buildUI(trial, labels, parent) {
    // Clear parent
    parent.replaceChildren();

    // Add styles
    const style = document.createElement("style");
    const h = trial.scale_height;
    style.textContent = `
      .glms-container { display:flex;flex-direction:column;align-items:center;font-family:"Source Sans Pro","Segoe UI",sans-serif;padding:20px; }
      .glms-prompt { font-size:20px;color:#3a3a3a;margin-bottom:8px;text-align:center; }
      .glms-instructions { font-size:14px;color:#888;max-width:500px;text-align:center;margin-bottom:20px;line-height:1.5; }
      .glms-scale-wrapper { display:flex;position:relative;height:${h}px;width:350px;margin:20px 0; }
      .glms-track-area { position:absolute;left:180px;top:0;bottom:0;width:40px;cursor:pointer;z-index:2; }
      .glms-track-line { position:absolute;left:50%;top:0;bottom:0;width:2px;background:#bbb;transform:translateX(-50%); }
      .glms-thumb { display:none;position:absolute;left:50%;width:16px;height:16px;border-radius:50%;background:#1b9e77;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);transform:translate(-50%,50%);z-index:3; }
      .glms-label-row { position:absolute;right:180px;left:0;display:flex;align-items:center;justify-content:flex-end;transform:translateY(50%); }
      .glms-label-text { font-size:13px;color:#555;text-align:right;padding-right:8px; }
      .glms-tick { position:absolute;right:-190px;width:10px;height:1px;background:#aaa; }
      .glms-value { font-size:16px;color:#3a3a3a;margin-top:12px;min-height:24px; }
      .glms-submit-btn { margin-top:16px;padding:10px 32px;font-size:16px;background:#1b9e77;color:white;border:none;border-radius:4px;cursor:pointer;opacity:0.4; }
      .glms-submit-btn:hover:not(:disabled) { background:#158f6b; }
    `;
    parent.appendChild(style);

    const container = document.createElement("div");
    container.className = "glms-container";

    // Prompt
    const prompt = document.createElement("div");
    prompt.className = "glms-prompt";
    prompt.textContent = trial.prompt;
    container.appendChild(prompt);

    // Instructions
    if (trial.show_instructions) {
      const instr = document.createElement("p");
      instr.className = "glms-instructions";
      instr.textContent = GLMS_INSTRUCTIONS;
      container.appendChild(instr);
    }

    // Scale wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "glms-scale-wrapper";

    // Labels
    labels.forEach((l) => {
      const row = document.createElement("div");
      row.className = "glms-label-row";
      row.style.bottom = (l.position / 100) * h + "px";

      const text = document.createElement("span");
      text.className = "glms-label-text";
      text.textContent = l.label;
      row.appendChild(text);

      const tick = document.createElement("span");
      tick.className = "glms-tick";
      row.appendChild(tick);

      wrapper.appendChild(row);
    });

    // Track
    const trackArea = document.createElement("div");
    trackArea.className = "glms-track-area";
    const trackLine = document.createElement("div");
    trackLine.className = "glms-track-line";
    trackArea.appendChild(trackLine);
    const thumb = document.createElement("div");
    thumb.className = "glms-thumb";
    trackArea.appendChild(thumb);
    wrapper.appendChild(trackArea);

    container.appendChild(wrapper);

    // Value display
    const valueDisplay = document.createElement("div");
    valueDisplay.className = "glms-value";
    valueDisplay.textContent = "\u00A0";
    container.appendChild(valueDisplay);

    // Submit button
    const btn = document.createElement("button");
    btn.className = "glms-submit-btn";
    btn.textContent = trial.button_label;
    if (trial.required) btn.disabled = true;
    container.appendChild(btn);

    parent.appendChild(container);
    return container;
  }
}

export default gLMSPlugin;

// ── Magnitude Estimation helpers ─────────────────────────────────

export const MAGNITUDE_ESTIMATION_DEFAULTS = {
  benchmark_label: "stealing a wallet",
  benchmark_value: 10,
  zero_label: "neither moral nor immoral",
  domain: "moral wrongness",
};

export function meInstructionText(opts = {}) {
  const o = { ...MAGNITUDE_ESTIMATION_DEFAULTS, ...opts };
  const half = o.benchmark_value / 2;
  const double = o.benchmark_value * 2;
  return (
    `Please use 0 to mean "${o.zero_label}."\n\n` +
    `As a ${o.benchmark_value}, think about: ${o.benchmark_label}. ` +
    `This is your benchmark.\n\n` +
    `Rate other items relative to this benchmark. If the item is equal in ` +
    `${o.domain}, rate it ${o.benchmark_value}. If half as intense, ` +
    `rate it ${half}. If twice as intense, rate it ${double}, and so on.\n\n` +
    `You can use any non-negative number, including decimals.`
  );
}
