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
 * Create canvas from any element (div, svg, etc.) using native canvas API
 */
function createCanvasFromElement(element) {
  const rect = element.getBoundingClientRect();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = rect.width || 400;
  canvas.height = rect.height || 300;

  // Get computed styles
  const styles = window.getComputedStyle(element);

  // Draw background color
  const bgColor = styles.backgroundColor;
  if (bgColor && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    // Default background
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw text content
  const textContent = element.textContent || element.innerText;
  if (textContent && textContent.trim()) {
    ctx.fillStyle = styles.color || "#000000";
    ctx.font = styles.font || "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Handle text wrapping for long text
    const words = textContent.trim().split(" ");
    const maxWidth = canvas.width - 40;
    let line = "";
    let y = canvas.height / 2 - (words.length * 20) / 2;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n] + " ";
        y += 20;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);
  }

  // For SVG elements, create a simple representation
  if (element.tagName.toLowerCase() === "svg") {
    // Draw SVG placeholder
    ctx.fillStyle = "#e0e0e0";
    ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.fillStyle = "#666";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SVG Element", canvas.width / 2, canvas.height / 2);
  }

  // Convert canvas to data URL
  return canvas.toDataURL("image/png");
}

/**
 * Create canvas element and replace original element
 */
function createCanvas(element) {
  const rect = element.getBoundingClientRect();

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = rect.width || 400;
  canvas.height = rect.height || 300;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";

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
