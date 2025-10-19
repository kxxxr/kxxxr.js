import { waterHoverEffect } from "./effects/waterHover.js";
import { realisticWaterHoverEffect as realisticEffect } from "./effects/realisticWaterHover.js";

/**
 * Auto-initialize effects based on CSS classes
 * Usage: <img class="kxxxr-ripple" src="image.jpg" />
 *        <div class="kxxxr-realistic" style="background-image: url('image.jpg')"></div>
 */

// Default configurations for each effect - smooth but fast
const DEFAULT_CONFIGS = {
  ripple: {
    strength: 0.08, // Increased back for more visible effect
    radius: 0.3, // Increased back for better visibility
    pulseSpeed: 2.0, // Faster pulse speed
    decay: 2.5, // Slower decay for longer effect
    frequency: 20, // Balanced frequency
  },
  realistic: {
    simulationSpeed: 1.4, // Faster simulation
    effectRadius: 25, // Larger radius for better effect
    headStrength: 0.7, // Stronger effect
    tailStrength: 0.6, // Stronger tail
    tailWidth: 20, // Wider tail
  },
};

// Store dispose functions for cleanup
const activeEffects = new Map();

/**
 * Initialize effects on elements with kxxxr classes
 */
function initKxxxrEffects() {
  // Find all elements with kxxxr classes
  const rippleElements = document.querySelectorAll(".kxxxr-ripple");
  const realisticElements = document.querySelectorAll(".kxxxr-realistic");

  // Initialize ripple effects
  rippleElements.forEach((element, index) => {
    initRippleEffect(element, index);
  });

  // Initialize realistic effects
  realisticElements.forEach((element, index) => {
    initRealisticEffect(element, index);
  });
}

/**
 * Initialize ripple effect on element
 */
function initRippleEffect(element, index) {
  const imageUrl = getImageUrl(element);
  if (!imageUrl) {
    console.warn(`kxxxr-ripple: No image found for element ${index}. Please add an image using:
    - src attribute (for img elements)
    - background-image CSS property
    - data-src attribute
    - data-image attribute`);
    return;
  }

  // Create canvas
  const canvas = createCanvas(element);
  if (!canvas) return;

  // Get custom config from data attributes
  const config = getConfigFromAttributes(element, "ripple");

  // Initialize effect
  const dispose = waterHoverEffect(canvas, {
    imageUrl,
    ...config,
  });

  // Store for cleanup
  activeEffects.set(element, dispose);
}

/**
 * Initialize realistic effect on element
 */
function initRealisticEffect(element, index) {
  const imageUrl = getImageUrl(element);
  if (!imageUrl) {
    console.warn(`kxxxr-realistic: No image found for element ${index}. Please add an image using:
    - src attribute (for img elements)
    - background-image CSS property
    - data-src attribute
    - data-image attribute`);
    return;
  }

  // Create canvas
  const canvas = createCanvas(element);
  if (!canvas) return;

  // Get element dimensions
  const rect = element.getBoundingClientRect();

  // Get custom config from data attributes
  const config = getConfigFromAttributes(element, "realistic");

  // Initialize effect with balanced resolution for smooth but fast performance
  const dispose = realisticEffect(canvas, {
    imageUrl,
    width: Math.min(rect.width || 400, 384),
    height: Math.min(rect.height || 300, 288),
    ...config,
  });

  // Store for cleanup
  activeEffects.set(element, dispose);
}

/**
 * Get image URL from element or create canvas from element
 */
function getImageUrl(element) {
  // Check src attribute (img, video)
  if (element.src) return element.src;

  // Check background-image CSS
  const bgImage = window.getComputedStyle(element).backgroundImage;
  if (bgImage && bgImage !== "none") {
    const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
    if (match) return match[1];
  }

  // Check data-src attribute
  if (element.dataset.src) return element.dataset.src;

  // Check data-image attribute
  if (element.dataset.image) return element.dataset.image;

  // If no image found, create canvas from element content
  return createCanvasFromElement(element);
}

/**
 * Create canvas from any element (div, svg, etc.) using enhanced rendering
 */
function createCanvasFromElement(element) {
  const rect = element.getBoundingClientRect();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Use actual element dimensions
  const width = rect.width || element.offsetWidth || 400;
  const height = rect.height || element.offsetHeight || 300;

  canvas.width = width;
  canvas.height = height;

  // Get computed styles
  const styles = window.getComputedStyle(element);

  // Draw background with all styling
  drawBackground(ctx, styles, width, height);

  // Draw content based on element type
  if (element.tagName.toLowerCase() === "svg") {
    drawSVGContentSync(ctx, element, width, height);
  } else {
    drawHTMLContent(ctx, element, styles, width, height);
  }

  // Convert canvas to data URL
  return canvas.toDataURL("image/png");
}

/**
 * Draw background with exact styling
 */
function drawBackground(ctx, styles, width, height) {
  // Draw background color
  const bgColor = styles.backgroundColor;
  if (bgColor && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
    ctx.fillStyle = bgColor;

    // Handle border radius
    const borderRadius = parseFloat(styles.borderRadius) || 0;
    if (borderRadius > 0) {
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, borderRadius);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, width, height);
    }
  }

  // Draw background image if exists
  const bgImage = styles.backgroundImage;
  if (bgImage && bgImage !== "none") {
    const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
    if (match) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        // Apply background-size and background-position
        const bgSize = styles.backgroundSize || "auto";
        const bgPosition = styles.backgroundPosition || "0% 0%";

        if (bgSize === "cover") {
          const scale = Math.max(width / img.width, height / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (width - scaledWidth) / 2;
          const y = (height - scaledHeight) / 2;
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        } else if (bgSize === "contain") {
          const scale = Math.min(width / img.width, height / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (width - scaledWidth) / 2;
          const y = (height - scaledHeight) / 2;
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        } else {
          ctx.drawImage(img, 0, 0, width, height);
        }
      };
      img.src = match[1];
    }
  }
}

/**
 * Draw HTML content with enhanced styling
 */
function drawHTMLContent(ctx, element, styles, width, height) {
  // Get display properties
  const display = styles.display;
  const flexDirection = styles.flexDirection;
  const alignItems = styles.alignItems;
  const justifyContent = styles.justifyContent;

  // Handle flexbox layout
  if (display === "flex") {
    drawFlexContent(ctx, element, styles, width, height);
  } else {
    drawBlockContent(ctx, element, styles, width, height);
  }
}

/**
 * Draw flexbox content
 */
function drawFlexContent(ctx, element, styles, width, height) {
  const textContent = element.textContent || element.innerText;
  if (textContent && textContent.trim()) {
    // Set exact font properties
    ctx.fillStyle = styles.color || "#000000";
    ctx.font = styles.font || "16px Arial";

    // Handle text alignment based on flex properties
    if (styles.alignItems === "center") {
      ctx.textBaseline = "middle";
    } else if (styles.alignItems === "flex-start") {
      ctx.textBaseline = "top";
    } else if (styles.alignItems === "flex-end") {
      ctx.textBaseline = "bottom";
    } else {
      ctx.textBaseline = "middle";
    }

    if (styles.justifyContent === "center") {
      ctx.textAlign = "center";
    } else if (styles.justifyContent === "flex-start") {
      ctx.textAlign = "left";
    } else if (styles.justifyContent === "flex-end") {
      ctx.textAlign = "right";
    } else {
      ctx.textAlign = "center";
    }

    // Calculate text position
    let x = width / 2;
    let y = height / 2;

    if (styles.justifyContent === "flex-start") x = 20;
    if (styles.justifyContent === "flex-end") x = width - 20;
    if (styles.alignItems === "flex-start") y = 20;
    if (styles.alignItems === "flex-end") y = height - 20;

    ctx.fillText(textContent.trim(), x, y);
  }
}

/**
 * Draw block content
 */
function drawBlockContent(ctx, element, styles, width, height) {
  const textContent = element.textContent || element.innerText;
  if (textContent && textContent.trim()) {
    // Set exact font properties
    ctx.fillStyle = styles.color || "#000000";
    ctx.font = styles.font || "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Handle text wrapping
    const words = textContent.trim().split(" ");
    const maxWidth = width - 40;
    const fontSize = parseFloat(styles.fontSize) || 16;
    const lineHeight = fontSize * 1.2;
    let line = "";
    let y = height / 2 - (words.length * lineHeight) / 2;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, width / 2, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, width / 2, y);
  }
}

/**
 * Draw SVG content synchronously
 */
function drawSVGContentSync(ctx, element, width, height) {
  // For SVG, create a simple representation based on SVG content
  try {
    // Get SVG children to understand what to draw
    const rects = element.querySelectorAll("rect");
    const circles = element.querySelectorAll("circle");
    const texts = element.querySelectorAll("text");

    // Draw rectangles
    rects.forEach((rect) => {
      const fill = rect.getAttribute("fill") || "#e0e0e0";
      const x = parseFloat(rect.getAttribute("x")) || 0;
      const y = parseFloat(rect.getAttribute("y")) || 0;
      const rectWidth = parseFloat(rect.getAttribute("width")) || width;
      const rectHeight = parseFloat(rect.getAttribute("height")) || height;

      ctx.fillStyle = fill;
      ctx.fillRect(x, y, rectWidth, rectHeight);
    });

    // Draw circles
    circles.forEach((circle) => {
      const fill = circle.getAttribute("fill") || "#e0e0e0";
      const cx = parseFloat(circle.getAttribute("cx")) || width / 2;
      const cy = parseFloat(circle.getAttribute("cy")) || height / 2;
      const r = parseFloat(circle.getAttribute("r")) || 50;

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw text
    texts.forEach((text) => {
      const fill = text.getAttribute("fill") || "#000000";
      const x = parseFloat(text.getAttribute("x")) || width / 2;
      const y = parseFloat(text.getAttribute("y")) || height / 2;
      const fontSize = text.getAttribute("font-size") || "16";
      const fontFamily = text.getAttribute("font-family") || "Arial";
      const textContent = text.textContent || "SVG Text";

      ctx.fillStyle = fill;
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(textContent, x, y);
    });

    // If no specific elements found, draw a simple representation
    if (rects.length === 0 && circles.length === 0 && texts.length === 0) {
      ctx.fillStyle = "#e0e0e0";
      ctx.fillRect(10, 10, width - 20, height - 20);

      ctx.fillStyle = "#666";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("SVG Element", width / 2, height / 2);
    }
  } catch (e) {
    // Fallback for SVG
    ctx.fillStyle = "#e0e0e0";
    ctx.fillRect(10, 10, width - 20, height - 20);

    ctx.fillStyle = "#666";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SVG Element", width / 2, height / 2);
  }
}

/**
 * Create canvas element and replace original element
 */
function createCanvas(element) {
  const rect = element.getBoundingClientRect();

  // Create canvas
  const canvas = document.createElement("canvas");

  // Use actual element dimensions
  const width = rect.width || element.offsetWidth || 400;
  const height = rect.height || element.offsetHeight || 300;

  canvas.width = width;
  canvas.height = height;

  // Set CSS size to match original element
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  canvas.style.display = "block";

  // Preserve original styling
  const styles = window.getComputedStyle(element);
  canvas.style.borderRadius = styles.borderRadius;
  canvas.style.border = styles.border;
  canvas.style.boxShadow = styles.boxShadow;
  canvas.style.margin = styles.margin;
  canvas.style.padding = styles.padding;

  // Replace element with canvas
  element.parentNode.replaceChild(canvas, element);

  return canvas;
}

/**
 * Get configuration from data attributes
 */
function getConfigFromAttributes(element, effectType) {
  const config = { ...DEFAULT_CONFIGS[effectType] };

  // Parse data attributes
  Object.keys(config).forEach((key) => {
    const attrName = `data-${key}`;
    const value = element.getAttribute(attrName);
    if (value !== null) {
      // Try to parse as number, fallback to string
      const numValue = parseFloat(value);
      config[key] = isNaN(numValue) ? value : numValue;
    }
  });

  return config;
}

/**
 * Cleanup all effects
 */
function cleanupKxxxrEffects() {
  activeEffects.forEach((dispose, element) => {
    dispose();
  });
  activeEffects.clear();
}

/**
 * Reinitialize effects (useful for dynamic content)
 */
function reinitKxxxrEffects() {
  cleanupKxxxrEffects();
  initKxxxrEffects();
}

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initKxxxrEffects);
} else {
  initKxxxrEffects();
}

// Export for manual control
export { initKxxxrEffects, cleanupKxxxrEffects, reinitKxxxrEffects };

// Simple API functions for easy usage
function rippleEffect(selector, options = {}) {
  const elements =
    typeof selector === "string"
      ? document.querySelectorAll(selector)
      : [selector];
  const disposes = [];

  elements.forEach((element) => {
    const imageUrl = getImageUrl(element);
    if (!imageUrl) {
      console.warn("kxxxr.rippleEffect: No image found for element");
      return;
    }

    const canvas = createCanvas(element);
    if (!canvas) return;

    const config = { ...DEFAULT_CONFIGS.ripple, ...options };
    const dispose = waterHoverEffect(canvas, {
      imageUrl,
      ...config,
    });

    disposes.push(dispose);
    activeEffects.set(element, dispose);
  });

  return () => disposes.forEach((dispose) => dispose());
}

function realisticEffectSimple(selector, options = {}) {
  const elements =
    typeof selector === "string"
      ? document.querySelectorAll(selector)
      : [selector];
  const disposes = [];

  elements.forEach((element) => {
    const imageUrl = getImageUrl(element);
    if (!imageUrl) {
      console.warn("kxxxr.realisticEffect: No image found for element");
      return;
    }

    const canvas = createCanvas(element);
    if (!canvas) return;

    const rect = element.getBoundingClientRect();
    const config = { ...DEFAULT_CONFIGS.realistic, ...options };

    const dispose = realisticEffect(canvas, {
      imageUrl,
      width: Math.min(rect.width || 400, 384),
      height: Math.min(rect.height || 300, 288),
      ...config,
    });

    disposes.push(dispose);
    activeEffects.set(element, dispose);
  });

  return () => disposes.forEach((dispose) => dispose());
}

// Make available globally for CDN usage
if (typeof window !== "undefined") {
  window.kxxxr = {
    init: initKxxxrEffects,
    cleanup: cleanupKxxxrEffects,
    reinit: reinitKxxxrEffects,
    // Simple API methods
    rippleEffect,
    realisticEffect: realisticEffectSimple,
    // Legacy methods
    effects: {
      ripple: waterHoverEffect,
      realistic: realisticEffect,
    },
  };
}
