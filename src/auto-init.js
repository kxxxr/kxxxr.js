import { waterHoverEffect } from "./effects/waterHover.js";
import { realisticWaterHoverEffect as realisticEffect } from "./effects/realisticWaterHover.js";
import { glitchEffect } from "./effects/glitch.js";
import { fluidSimulationEffect as fluidEffect } from "./effects/fluidSimulation.js";

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
    // Advanced filter customization (defaults match shader)
    reflectionIntensity: 0.5,
    reflectionColor: "#ffffff",
    contrast: 0.65,
    saturation: 0.9,
    brightness: 1.3,
    tint: "#ffffff",
    shadowIntensity: -0.28,
  },

  fluid: {
    speed: 1.0,
    decay: 0.97,
    lineWidth: 0.05,
    lineIntensity: 0.3,
    threshold: 0.02,
    edgeWidth: 0.004,
    movementTimeout: 50,
    hiDPI: true,
  },
  glitch: {
    speed: 1.0,
    intensity: 0.7,
    chromaShift: 3.0,
    displacement: 0.05,
    noiseAmount: 0.15,
    scanlineIntensity: 0.3,
    glitchFrequency: 0.3,
    horrorMode: false,
    enableWarping: true,
    warpingAmount: 0.3,
    vignette: 0.0,
    edgeChromaticStrength: 0.0,
    signalLossStrength: 0.0,
    colorDistortionAmount: 1.0,
    blockSize: 15.0,
    horizontalStripeSize: 30.0,
    horrorColorGradingAmount: 0.02,
  },
};

// Store dispose functions for cleanup
const activeEffects = new Map();

// (lightweight debug UI removed)

function initKxxxrEffects() {
  const rippleElements = document.querySelectorAll(".kxxxr-ripple");
  const realisticElements = document.querySelectorAll(".kxxxr-realistic");
  const glitchElements = document.querySelectorAll(".kxxxr-glitch");
  const fluidElements = document.querySelectorAll(".kxxxr-fluid");

  rippleElements.forEach((el, i) => initRippleEffect(el, i));
  realisticElements.forEach((el, i) => initRealisticEffect(el, i));
  glitchElements.forEach((el, i) => initGlitchEffect(el, i));
  fluidElements.forEach((el, i) => initFluidEffect(el, i));
}

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

  const canvas = createCanvas(element);
  if (!canvas) return;

  const config = getConfigFromAttributes(element, "ripple");

  let dispose = waterHoverEffect(canvas, {
    imageUrl,
    ...config,
  });

  activeEffects.set(element, dispose);

  if (config && config.debug === true) {
    let currentOptions = { ...config };
    const recreate = () => {
      if (dispose) dispose();
      dispose = waterHoverEffect(canvas, { imageUrl, ...currentOptions });
      activeEffects.set(element, dispose);
    };
    createDatGuiForProgrammatic("ripple", currentOptions, recreate);
  }
}

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

  const canvas = createCanvas(element);
  if (!canvas) return;
  const rect = element.getBoundingClientRect();
  const config = getConfigFromAttributes(element, "realistic");

  let dispose = realisticEffect(canvas, {
    imageUrl,
    width: Math.min(rect.width || 400, 384),
    height: Math.min(rect.height || 300, 288),
    ...mapAdvancedFilterConfig(config),
    ...config,
  });

  activeEffects.set(element, dispose);

  if (config && config.debug === true) {
    let currentOptions = { ...config };
    const recreate = () => {
      if (dispose) dispose();
      dispose = realisticEffect(canvas, {
        imageUrl,
        width: Math.min(rect.width || 400, 384),
        height: Math.min(rect.height || 300, 288),
        ...mapAdvancedFilterConfig(currentOptions),
        ...currentOptions,
      });
      activeEffects.set(element, dispose);
    };
    createDatGuiForProgrammatic("realistic", currentOptions, recreate);
  }
}

function initGlitchEffect(element, index) {
  const config = getConfigFromAttributes(element, "glitch");

  if (element.tagName.toLowerCase() === "video") {
    const videoElement = element;
    const initVideo = () => {
      const canvas = document.createElement("canvas");
      const rect = videoElement.getBoundingClientRect();
      const w = videoElement.videoWidth || rect.width || 640;
      const h = videoElement.videoHeight || rect.height || 480;
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = videoElement.style.width || "100%";
      canvas.style.height = videoElement.style.height || "100%";
      canvas.style.display = "block";
      canvas.style.objectFit = videoElement.style.objectFit || "cover";
      const styles = window.getComputedStyle(videoElement);
      canvas.style.borderRadius = styles.borderRadius;
      canvas.style.border = styles.border;
      canvas.style.boxShadow = styles.boxShadow;
      videoElement.style.position = "absolute";
      videoElement.style.opacity = "0";
      videoElement.style.pointerEvents = "none";
      videoElement.style.width = "1px";
      videoElement.style.height = "1px";
      videoElement.parentNode.insertBefore(canvas, videoElement);

      let dispose = glitchEffect(canvas, { videoElement, ...config });
      activeEffects.set(element, dispose);

      if (config && config.debug === true) {
        let currentOptions = { ...config };
        const recreate = () => {
          if (dispose) dispose();
          dispose = glitchEffect(canvas, { videoElement, ...currentOptions });
          activeEffects.set(element, dispose);
        };
        createDatGuiForProgrammatic("glitch", currentOptions, recreate);
      }
    };

    if (videoElement.readyState >= 2) {
      initVideo();
    } else {
      videoElement.addEventListener("loadedmetadata", initVideo, {
        once: true,
      });
      videoElement.addEventListener(
        "loadeddata",
        () => {
          if (!activeEffects.has(element)) initVideo();
        },
        { once: true }
      );
    }
  } else {
    const imageUrl = getImageUrl(element);
    if (!imageUrl) {
      console.warn(`kxxxr-glitch: No image found for element ${index}`);
      return;
    }
    const canvas = createCanvas(element);
    if (!canvas) return;
    let dispose = glitchEffect(canvas, { imageUrl, ...config });
    activeEffects.set(element, dispose);

    if (config && config.debug === true) {
      let currentOptions = { ...config };
      const recreate = () => {
        if (dispose) dispose();
        dispose = glitchEffect(canvas, { imageUrl, ...currentOptions });
        activeEffects.set(element, dispose);
      };
      createDatGuiForProgrammatic("glitch", currentOptions, recreate);
    }
  }
}

/** Duplicate removed **/

function initFluidEffect(element, index) {
  const imageUrl = getImageUrl(element);
  if (!imageUrl) {
    console.warn(`kxxxr-fluid: No image found for element ${index}. Please add an image using:
    - src attribute (for img elements)
    - background-image CSS property
    - data-src attribute
    - data-image attribute`);
    return;
  }
  const canvas = createCanvas(element);
  if (!canvas) return;
  const rect = element.getBoundingClientRect();
  const config = getConfigFromAttributes(element, "fluid");
  const backImageUrl =
    element.getAttribute("data-back") ||
    element.getAttribute("data-back-image") ||
    (element.dataset
      ? element.dataset.back || element.dataset.backImage
      : null);

  let dispose = fluidEffect(canvas, {
    imageUrl,
    backImageUrl,
    width: rect.width || 512,
    height: rect.height || 384,
    ...config,
  });
  activeEffects.set(element, dispose);

  if (config && config.debug === true) {
    let currentOptions = { ...config };
    const recreate = () => {
      if (dispose) dispose();
      dispose = fluidEffect(canvas, {
        imageUrl,
        backImageUrl,
        width: rect.width || 512,
        height: rect.height || 384,
        ...currentOptions,
      });
      activeEffects.set(element, dispose);
    };
    createDatGuiForProgrammatic("fluid", currentOptions, recreate);
  }
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
  // Preserve responsive sizing if the original element used percentages or viewport units
  const inlineWidth =
    element.style && element.style.width ? element.style.width.trim() : "";
  const inlineHeight =
    element.style && element.style.height ? element.style.height.trim() : "";
  const isResponsiveWidth = /%|vw|vh|vmin|vmax|auto/i.test(inlineWidth);
  const isResponsiveHeight = /%|vw|vh|vmin|vmax|auto/i.test(inlineHeight);
  canvas.style.width =
    isResponsiveWidth && inlineWidth ? inlineWidth : width + "px";
  canvas.style.height =
    isResponsiveHeight && inlineHeight ? inlineHeight : height + "px";
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
    // support data-camel and data-kebab
    const kebab = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    const candidates = [`data-${key}`, `data-${kebab}`];
    let value = null;
    for (const name of candidates) {
      const v = element.getAttribute(name);
      if (v !== null) {
        value = v;
        break;
      }
    }
    if (value !== null) {
      // Handle boolean values
      if (value === "true" || value === "false") {
        config[key] = value === "true";
      }
      // Color strings (#rrggbb or rgb/rgba) should remain strings
      else if (/^#|^rgb\(/i.test(value)) {
        config[key] = value;
      } else {
        const numValue = parseFloat(value);
        config[key] = isNaN(numValue) ? value : numValue;
      }
    }
  });

  // Debug flag via data-debug
  const dbg = element.getAttribute("data-debug");
  if (dbg === "true") config.debug = true;
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

// Helpers to map string colors to THREE.Color-compatible uniforms
function parseCssColorToLinear(color) {
  if (!color) return { r: 1, g: 1, b: 1 };
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = color;
  const computed = ctx.fillStyle; // normalized css color
  // Extract rgb(a)
  const m = computed.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b] = m[1]
      .split(",")
      .slice(0, 3)
      .map((v) => parseInt(v.trim(), 10) / 255);
    return { r, g, b };
  }
  // Fallback white
  return { r: 1, g: 1, b: 1 };
}

function mapAdvancedFilterConfig(c) {
  const out = {};
  if (c.reflectionIntensity !== undefined)
    out.reflectionIntensity = Number(c.reflectionIntensity);
  if (c.contrast !== undefined) out.contrast = Number(c.contrast);
  if (c.saturation !== undefined) out.saturation = Number(c.saturation);
  if (c.brightness !== undefined) out.brightness = Number(c.brightness);
  if (c.shadowIntensity !== undefined)
    out.shadowIntensity = Number(c.shadowIntensity);
  if (c.reflectionColor)
    out.reflectionColor = parseCssColorToLinear(c.reflectionColor);
  if (c.tint) out.tint = parseCssColorToLinear(c.tint);
  return out;
}

// Helpers: dat.gui debug for programmatic API (only if CDN dat.gui is present)
function createDatGuiForProgrammatic(effectType, optionsRef, recreate) {
  if (typeof window === "undefined" || !window.dat || !window.dat.GUI)
    return null;
  if (optionsRef && optionsRef.__gui) return optionsRef.__gui;
  const gui = new window.dat.GUI({ name: `kxxxr ${effectType}` });
  const addNum = (obj, key, min, max, step) =>
    gui.add(obj, key, min, max).step(step).onChange(recreate);
  const addBool = (obj, key) => gui.add(obj, key).onChange(recreate);

  if (effectType === "ripple") {
    addNum(optionsRef, "strength", 0, 1.5, 0.01);
    addNum(optionsRef, "radius", 0.05, 1, 0.01);
    addNum(optionsRef, "pulseSpeed", 0, 5, 0.1);
    addNum(optionsRef, "decay", 0.1, 5, 0.1);
    addNum(optionsRef, "frequency", 1, 60, 1);
  }
  if (effectType === "realistic") {
    addNum(optionsRef, "simulationSpeed", 0.1, 5, 0.1);
    addNum(optionsRef, "effectRadius", 1, 120, 1);
    addNum(optionsRef, "headStrength", 0, 2, 0.05);
    addNum(optionsRef, "tailStrength", 0, 2, 0.05);
    addNum(optionsRef, "tailWidth", 1, 120, 1);
    addNum(optionsRef, "reflectionIntensity", 0, 2, 0.05);
    addNum(optionsRef, "contrast", 0, 2, 0.05);
    addNum(optionsRef, "saturation", 0, 2, 0.05);
    addNum(optionsRef, "brightness", 0, 3, 0.05);
    addNum(optionsRef, "shadowIntensity", -1, 1, 0.05);
  }
  if (effectType === "glitch") {
    addNum(optionsRef, "speed", 0, 60, 0.1);
    addNum(optionsRef, "intensity", 0, 2, 0.05);
    addNum(optionsRef, "chromaShift", 0, 10, 0.1);
    addNum(optionsRef, "displacement", 0, 0.2, 0.005);
    addNum(optionsRef, "noiseAmount", 0, 1, 0.05);
    addNum(optionsRef, "scanlineIntensity", 0, 1, 0.05);
    addNum(optionsRef, "glitchFrequency", 0, 1, 0.01);
    addNum(optionsRef, "blockSize", 1, 60, 1);
    addNum(optionsRef, "horizontalStripeSize", 1, 60, 1);
    addBool(optionsRef, "horrorMode");
    addBool(optionsRef, "enableWarping");
    addNum(optionsRef, "warpingAmount", 0, 1, 0.01);
    addNum(optionsRef, "vignette", 0, 2, 0.01);
    addNum(optionsRef, "edgeChromaticStrength", 0, 1, 0.01);
    addNum(optionsRef, "signalLossStrength", 0, 1, 0.01);
    addNum(optionsRef, "colorDistortionAmount", 0, 1, 0.01);
    addNum(optionsRef, "horrorColorGradingAmount", 0, 1, 0.01);
  }
  if (effectType === "fluid") {
    addNum(optionsRef, "speed", 0.1, 20, 0.1);
    addNum(optionsRef, "lineWidth", 0.001, 0.2, 0.001);
    addNum(optionsRef, "lineIntensity", 0, 1, 0.01);
    addNum(optionsRef, "decay", 0.5, 0.999, 0.001);
    addNum(optionsRef, "threshold", 0, 0.2, 0.001);
    addNum(optionsRef, "edgeWidth", 0, 0.02, 0.0005);
  }

  optionsRef.__gui = gui;
  return gui;
}

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

    let currentOptions = { ...DEFAULT_CONFIGS.ripple, ...options };
    let dispose = waterHoverEffect(canvas, { imageUrl, ...currentOptions });

    const recreate = () => {
      if (dispose) dispose();
      dispose = waterHoverEffect(canvas, { imageUrl, ...currentOptions });
      activeEffects.set(element, dispose);
    };

    if (options && options.debug === true) {
      createDatGuiForProgrammatic("ripple", currentOptions, recreate);
    }

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
    let currentOptions = { ...DEFAULT_CONFIGS.realistic, ...options };

    let dispose = realisticEffect(canvas, {
      imageUrl,
      width: Math.min(rect.width || 400, 384),
      height: Math.min(rect.height || 300, 288),
      ...mapAdvancedFilterConfig(currentOptions),
      ...currentOptions,
    });

    const recreate = () => {
      if (dispose) dispose();
      dispose = realisticEffect(canvas, {
        imageUrl,
        width: Math.min(rect.width || 400, 384),
        height: Math.min(rect.height || 300, 288),
        ...mapAdvancedFilterConfig(currentOptions),
        ...currentOptions,
      });
      activeEffects.set(element, dispose);
    };

    if (options && options.debug === true) {
      createDatGuiForProgrammatic("realistic", currentOptions, recreate);
    }

    disposes.push(dispose);
    activeEffects.set(element, dispose);
  });

  return () => disposes.forEach((dispose) => dispose());
}

function glitchEffectSimple(selector, options = {}) {
  const elements =
    typeof selector === "string"
      ? document.querySelectorAll(selector)
      : [selector];
  const disposes = [];
  elements.forEach((element) => {
    const imageUrl = getImageUrl(element);
    if (!imageUrl) {
      console.warn("kxxxr.glitchEffect: No image found for element");
      return;
    }
    const canvas = createCanvas(element);
    if (!canvas) return;
    let currentOptions = { ...DEFAULT_CONFIGS.glitch, ...options };
    let dispose = glitchEffect(canvas, { imageUrl, ...currentOptions });

    const recreate = () => {
      if (dispose) dispose();
      dispose = glitchEffect(canvas, { imageUrl, ...currentOptions });
      activeEffects.set(element, dispose);
    };

    if (options && options.debug === true) {
      createDatGuiForProgrammatic("glitch", currentOptions, recreate);
    }

    disposes.push(dispose);
    activeEffects.set(element, dispose);
  });
  return () => disposes.forEach((dispose) => dispose());
}

function fluidEffectSimple(selector, options = {}) {
  const elements =
    typeof selector === "string"
      ? document.querySelectorAll(selector)
      : [selector];
  const disposes = [];
  elements.forEach((element) => {
    const imageUrl = getImageUrl(element);
    if (!imageUrl) {
      console.warn("kxxxr.fluidEffect: No image found for element");
      return;
    }
    const canvas = createCanvas(element);
    if (!canvas) return;
    const rect = element.getBoundingClientRect();
    let currentOptions = { ...DEFAULT_CONFIGS.fluid, ...options };
    let dispose = fluidEffect(canvas, {
      imageUrl,
      backImageUrl: options.backImageUrl,
      width: rect.width || 512,
      height: rect.height || 384,
      ...currentOptions,
    });

    const recreate = () => {
      if (dispose) dispose();
      dispose = fluidEffect(canvas, {
        imageUrl,
        backImageUrl: options.backImageUrl,
        width: rect.width || 512,
        height: rect.height || 384,
        ...currentOptions,
      });
      activeEffects.set(element, dispose);
    };

    if (options && options.debug === true) {
      createDatGuiForProgrammatic("fluid", currentOptions, recreate);
    }

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
    glitchEffect: glitchEffectSimple,
    fluidEffect: fluidEffectSimple,
    // Legacy methods
    effects: {
      ripple: waterHoverEffect,
      realistic: realisticEffect,
      glitch: glitchEffect,
      fluid: fluidEffect,
    },
  };
}
