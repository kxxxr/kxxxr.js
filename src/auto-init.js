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
    console.warn(`kxxxr-ripple: No image found for element ${index}`);
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
    console.warn(`kxxxr-realistic: No image found for element ${index}`);
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
 * Get image URL from element
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

  return null;
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
