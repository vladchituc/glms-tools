/**
 * gLMS (generalized Labeled Magnitude Scale) for Qualtrics
 *
 * Paste this into the JavaScript editor of a Qualtrics Slider question.
 * Set the slider to 0-100 with step size 0.1.
 *
 * This script transforms a standard Qualtrics slider into a vertical gLMS
 * with quasi-logarithmically spaced labels.
 *
 * Setup in Qualtrics:
 *   1. Create a Slider question
 *   2. Set min = 0, max = 100, step = 0.1
 *   3. Click the question, go to "Add JavaScript"
 *   4. Paste this entire script into the addOnReady function
 *
 * Based on: Bartoshuk et al. (2004), Green et al. (1993, 1996)
 * Author: Vlad Chituc (https://vladchituc.com)
 */

Qualtrics.SurveyEngine.addOnReady(function() {
  var qid = this.questionId;
  var container = this.getQuestionContainer();

  // ── Configuration ─────────────────────────────────────────────
  var LABELS = [
    { position: 0,     text: "No sensation" },
    { position: 1.4,   text: "Barely detectable" },
    { position: 6.1,   text: "Weak" },
    { position: 17.2,  text: "Moderate" },
    { position: 34.7,  text: "Strong" },
    { position: 52.5,  text: "Very strong" },
    { position: 100,   text: "Strongest imaginable sensation of any kind" },
  ];

  var SCALE_HEIGHT = 500;  // px
  var ACCENT_COLOR = "#1b9e77";  // Dark2 teal

  // ── Hide default Qualtrics slider ─────────────────────────────
  var choiceContainer = container.querySelector(".ChoiceStructure");
  if (choiceContainer) choiceContainer.style.display = "none";

  // ── Build custom gLMS ─────────────────────────────────────────
  var scaleDiv = document.createElement("div");
  scaleDiv.style.cssText =
    "display:flex;justify-content:center;margin:20px 0;";

  var scaleInner = document.createElement("div");
  scaleInner.style.cssText =
    "position:relative;height:" + SCALE_HEIGHT + "px;width:320px;";

  // Track line
  var trackLine = document.createElement("div");
  trackLine.style.cssText =
    "position:absolute;left:200px;top:0;bottom:0;width:2px;background:#ccc;";
  scaleInner.appendChild(trackLine);

  // Labels and ticks
  LABELS.forEach(function(lab) {
    var pct = 100 - lab.position;  // Invert: 0 at bottom, 100 at top

    // Tick mark
    var tick = document.createElement("div");
    tick.style.cssText =
      "position:absolute;left:195px;width:12px;height:1px;background:#aaa;" +
      "top:" + pct + "%;";
    scaleInner.appendChild(tick);

    // Label text
    var label = document.createElement("div");
    label.style.cssText =
      "position:absolute;right:" + (320 - 190) + "px;top:" + pct + "%;" +
      "transform:translateY(-50%);text-align:right;font-size:13px;" +
      "color:#555;white-space:nowrap;font-family:'Source Sans Pro',sans-serif;";
    label.textContent = lab.text;
    scaleInner.appendChild(label);
  });

  // Click/drag area
  var trackArea = document.createElement("div");
  trackArea.style.cssText =
    "position:absolute;left:180px;top:0;bottom:0;width:42px;" +
    "cursor:pointer;z-index:10;";
  scaleInner.appendChild(trackArea);

  // Thumb
  var thumb = document.createElement("div");
  thumb.style.cssText =
    "display:none;position:absolute;left:201px;width:18px;height:18px;" +
    "border-radius:50%;background:" + ACCENT_COLOR + ";" +
    "border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);" +
    "transform:translate(-50%,50%);z-index:11;pointer-events:none;";
  scaleInner.appendChild(thumb);

  // Value display
  var valueDisp = document.createElement("div");
  valueDisp.style.cssText =
    "text-align:center;font-size:16px;color:#3a3a3a;margin-top:12px;" +
    "font-family:'Source Sans Pro',sans-serif;";
  valueDisp.textContent = "\u00A0";

  scaleDiv.appendChild(scaleInner);

  // Insert after question text
  var questionText = container.querySelector(".QuestionText");
  if (questionText && questionText.nextSibling) {
    questionText.parentNode.insertBefore(scaleDiv, questionText.nextSibling);
    questionText.parentNode.insertBefore(
      valueDisp, scaleDiv.nextSibling
    );
  } else {
    container.appendChild(scaleDiv);
    container.appendChild(valueDisp);
  }

  // ── Interaction ───────────────────────────────────────────────
  var self = this;
  var isDragging = false;

  function updateFromEvent(e) {
    var rect = trackArea.getBoundingClientRect();
    var pct = 1 - (e.clientY - rect.top) / rect.height;
    pct = Math.max(0, Math.min(1, pct));
    var value = Math.round(pct * 1000) / 10;

    // Update thumb position
    thumb.style.display = "block";
    thumb.style.bottom = (pct * 100) + "%";
    thumb.style.top = "auto";
    valueDisp.textContent = value.toFixed(1);

    // Set the actual Qualtrics embedded data / slider value
    // Find the hidden input and update it
    var inputs = container.querySelectorAll("input[type='text'], input[type='hidden']");
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].id && inputs[i].id.indexOf(qid) !== -1) {
        inputs[i].value = value;
        // Trigger change event
        var evt = new Event("change", { bubbles: true });
        inputs[i].dispatchEvent(evt);
        break;
      }
    }

    // Also try the Qualtrics API
    try {
      self.setChoiceValue(1, value);
    } catch(err) {
      // Some Qualtrics versions use different API
    }
  }

  trackArea.addEventListener("mousedown", function(e) {
    isDragging = true;
    updateFromEvent(e);
    e.preventDefault();
  });
  document.addEventListener("mousemove", function(e) {
    if (isDragging) updateFromEvent(e);
  });
  document.addEventListener("mouseup", function() {
    isDragging = false;
  });

  // Touch support for mobile
  trackArea.addEventListener("touchstart", function(e) {
    isDragging = true;
    updateFromEvent(e.touches[0]);
    e.preventDefault();
  });
  document.addEventListener("touchmove", function(e) {
    if (isDragging) {
      updateFromEvent(e.touches[0]);
      e.preventDefault();
    }
  });
  document.addEventListener("touchend", function() {
    isDragging = false;
  });
});

/*
 * ── MAGNITUDE ESTIMATION VERSION ──────────────────────────────
 *
 * For magnitude estimation, you don't need custom JavaScript.
 * Just use a Text Entry question (number validation) with
 * these instructions in the question text:
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │ Please use 0 to mean "[zero label]."                     │
 * │                                                          │
 * │ As a [benchmark_value], we want you to think about:      │
 * │ [benchmark_label]. This is your benchmark.               │
 * │                                                          │
 * │ Rate other items relative to this benchmark. If the      │
 * │ item is equal in [domain], rate it [benchmark_value].    │
 * │ If it is half as intense, rate it [half]. If it is       │
 * │ twice as intense, rate it [double], and so on.           │
 * │                                                          │
 * │ You can use any non-negative number, including decimals. │
 * └──────────────────────────────────────────────────────────┘
 *
 * Qualtrics setup:
 *   1. Question type: Text Entry
 *   2. Validation: Number, Min = 0
 *   3. No custom JavaScript needed
 *
 * For the Cruel Prank study (Chituc, Crockett, & Scholl, 2025):
 *   - Zero label: "neither moral nor immoral"
 *   - Benchmark: "stealing a wallet" = 10
 *   - Domain: "moral wrongness"
 *
 * Analysis: log-transform responses (add 1 first to handle zeros),
 * report geometric means.
 */
