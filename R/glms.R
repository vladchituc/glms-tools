#' gLMS (generalized Labeled Magnitude Scale) for R / Shiny
#'
#' A vertical visual analog scale with quasi-logarithmically spaced semantic
#' labels, designed to enable valid cross-group comparisons of subjective
#' intensity (Bartoshuk et al., 2004; Green et al., 1993, 1996).
#'
#' The key innovation: the top anchor ("strongest imaginable sensation of any
#' kind") is modality-general, so group differences in one modality (e.g.,
#' taste for supertasters) don't distort the scale anchors.
#'
#' Usage:
#'   source("glms.R")
#'   # For Shiny apps:
#'   glms_input("my_rating", "How intense was the taste?")
#'   # For analysis:
#'   glms_labels()
#'
#' References:
#'   Bartoshuk et al. (2004). Physiology & Behavior, 82, 109-114.
#'   Green et al. (1993). Chemical Senses, 18, 683-702.
#'   Green et al. (1996). Chemical Senses, 21, 323-334.
#'
#' Author: Vlad Chituc (https://vladchituc.com)

# ── Standard gLMS labels and positions ───────────────────────────

glms_labels <- function() {
  tibble::tibble(
    position = c(0, 1.4, 6.1, 17.2, 34.7, 52.5, 100),
    label = c(
      "No sensation",
      "Barely detectable",
      "Weak",
      "Moderate",
      "Strong",
      "Very strong",
      "Strongest imaginable sensation of any kind"
    )
  )
}

glms_instructions <- function() {
  paste(
    "This scale captures the entire range of how intense experiences can",
    "possibly be. The top of the scale (100) represents the strongest",
    "sensation you could ever imagine experiencing \u2014 the absolute maximum",
    "intensity across all sensory modalities. The bottom (0) is the complete",
    "absence of any sensation. You should be able to rate any experience",
    "you have ever had or could imagine having somewhere on this scale."
  )
}

# ── Practice items for calibration ───────────────────────────────

glms_practice_items <- function() {
  c(
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
    "The pain of stubbing your toe"
  )
}

# ── Shiny UI component ──────────────────────────────────────────

#' Create a gLMS slider input for Shiny
#'
#' @param inputId Character. Shiny input ID.
#' @param prompt Character. Question text shown above the scale.
#' @param show_instructions Logical. Show gLMS instructions (default TRUE).
#' @param orientation Character. "vertical" (standard) or "horizontal" (gVAS).
#' @param height Character. CSS height for vertical orientation.
#'
#' @return A Shiny tagList.
glms_input <- function(inputId, prompt,
                       show_instructions = TRUE,
                       orientation = "vertical",
                       height = "500px") {
  labels <- glms_labels()

  if (orientation == "vertical") {
    glms_input_vertical(inputId, prompt, labels, show_instructions, height)
  } else {
    glms_input_horizontal(inputId, prompt, labels, show_instructions)
  }
}

glms_input_vertical <- function(inputId, prompt, labels, show_instructions, height) {
  # Build the CSS for label positioning
  label_css <- paste0(
    sapply(seq_len(nrow(labels)), function(i) {
      # Invert position (0 at bottom, 100 at top)
      pct <- 100 - labels$position[i]
      sprintf(
        '.glms-label[data-pos="%s"] { top: %s%%; }',
        labels$position[i], pct
      )
    }),
    collapse = "\n"
  )

  label_divs <- paste0(
    sapply(seq_len(nrow(labels)), function(i) {
      sprintf(
        '<div class="glms-label" data-pos="%s">%s</div>',
        labels$position[i], labels$label[i]
      )
    }),
    collapse = "\n"
  )

  instructions_html <- if (show_instructions) {
    sprintf(
      '<p class="glms-instructions">%s</p>',
      glms_instructions()
    )
  } else ""

  shiny::tagList(
    shiny::tags$style(shiny::HTML(sprintf('
      .glms-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: "Source Sans Pro", sans-serif;
      }
      .glms-prompt {
        font-size: 18px;
        color: #3a3a3a;
        margin-bottom: 8px;
      }
      .glms-instructions {
        font-size: 13px;
        color: #888;
        max-width: 500px;
        text-align: center;
        margin-bottom: 16px;
      }
      .glms-scale-area {
        display: flex;
        position: relative;
        height: %s;
        width: 300px;
      }
      .glms-track {
        position: absolute;
        left: 50%%;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #ccc;
        transform: translateX(-50%%);
      }
      .glms-label {
        position: absolute;
        right: 55%%;
        transform: translateY(-50%%);
        text-align: right;
        font-size: 13px;
        color: #666;
        white-space: nowrap;
        padding-right: 12px;
      }
      .glms-tick {
        position: absolute;
        left: calc(50%% - 6px);
        width: 12px;
        height: 1px;
        background: #aaa;
      }
      .glms-value-display {
        margin-top: 12px;
        font-size: 16px;
        color: #3a3a3a;
      }
      %s
    ', height, label_css))),
    shiny::tags$div(
      class = "glms-container",
      shiny::tags$p(class = "glms-prompt", prompt),
      shiny::HTML(instructions_html),
      shiny::tags$div(
        class = "glms-scale-area",
        shiny::tags$div(class = "glms-track"),
        shiny::HTML(label_divs),
        shiny::sliderInput(
          inputId = inputId,
          label = NULL,
          min = 0, max = 100,
          value = NA,
          step = 0.1,
          width = "100%"
        )
      )
    )
  )
}

glms_input_horizontal <- function(inputId, prompt, labels, show_instructions) {
  # Simpler horizontal variant (gVAS)
  instructions_html <- if (show_instructions) {
    sprintf('<p style="font-size:13px;color:#888;max-width:600px;">%s</p>',
            glms_instructions())
  } else ""

  shiny::tagList(
    shiny::tags$p(style = "font-size:18px;color:#3a3a3a;", prompt),
    shiny::HTML(instructions_html),
    shiny::sliderInput(
      inputId = inputId,
      label = NULL,
      min = 0, max = 100,
      value = NA,
      step = 0.1,
      width = "600px"
    ),
    shiny::tags$div(
      style = "display:flex;justify-content:space-between;width:600px;font-size:11px;color:#888;",
      shiny::tags$span("No sensation"),
      shiny::tags$span("Barely detectable"),
      shiny::tags$span("Weak"),
      shiny::tags$span("Moderate"),
      shiny::tags$span("Strong"),
      shiny::tags$span("Very strong"),
      shiny::tags$span("Strongest imaginable")
    )
  )
}

# ── Magnitude Estimation ────────────────────────────────────────

#' Generate magnitude estimation instructions
#'
#' @param benchmark_label Character. What the benchmark is (e.g., "stealing a wallet").
#' @param benchmark_value Numeric. The number assigned to the benchmark (e.g., 10).
#' @param zero_label Character. What 0 means.
#' @param domain Character. What's being rated.
#'
#' @return Character string of instructions.
me_instructions <- function(benchmark_label = "stealing a wallet",
                            benchmark_value = 10,
                            zero_label = "neither moral nor immoral",
                            domain = "moral wrongness") {
  half <- benchmark_value / 2
  double <- benchmark_value * 2
  glue::glue(
    'Please use 0 to mean "{zero_label}."

As a {benchmark_value}, we want you to think about: {benchmark_label}. ',
    'This is your benchmark.

We will ask you to rate other items relative to this benchmark. ',
    'If the item is equal to the benchmark in {domain}, rate it {benchmark_value}. ',
    'If it is half as intense, rate it {half}. ',
    'If it is twice as intense, rate it {double}, and so on.

You can use any non-negative number, including decimals.'
  )
}

# ── Analysis helpers ────────────────────────────────────────────

#' Log-transform magnitude estimation data (standard preprocessing)
#'
#' Adds 1 before log to handle zeros, following Chituc et al. (2025).
#'
#' @param x Numeric vector of raw magnitude estimates.
#' @return Numeric vector of log-transformed values.
me_log_transform <- function(x) {
  log(x + 1)
}

#' Geometric mean (for magnitude estimation data)
#'
#' @param x Numeric vector.
#' @param na.rm Logical.
#' @return Numeric scalar.
geometric_mean <- function(x, na.rm = TRUE) {
  if (na.rm) x <- x[!is.na(x)]
  exp(mean(log(x[x > 0])))
}

#' Plot a gLMS scale (for figures / methods sections)
#'
#' @param title Optional title.
#' @param accent_color Color for the scale line.
#' @return A ggplot object.
plot_glms <- function(title = NULL, accent_color = "#1b9e77") {
  library(ggplot2)

  labels <- glms_labels()

  ggplot(labels, aes(x = 0, y = position)) +
    geom_segment(aes(x = -0.1, xend = 0.1, yend = position),
                 color = accent_color, linewidth = 0.5) +
    geom_segment(aes(x = 0, xend = 0, y = 0, yend = 100),
                 color = accent_color, linewidth = 1) +
    geom_text(aes(x = -0.15, label = label), hjust = 1, size = 3.5,
              color = "#3a3a3a") +
    geom_text(aes(x = 0.15, label = sprintf("%.0f", position)), hjust = 0,
              size = 3, color = "#999") +
    scale_y_continuous(limits = c(-2, 105), expand = c(0, 0)) +
    scale_x_continuous(limits = c(-2, 0.5)) +
    labs(title = title) +
    theme_void(base_size = 13) +
    theme(
      plot.title = element_text(hjust = 0.5, size = 14, face = "bold",
                                color = "#3a3a3a")
    )
}
