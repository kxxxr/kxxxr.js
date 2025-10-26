# kxxxr.js

**WebGL Effects Library**

kxxxr.js transforms DOM elements into beautiful, interactive visual effects (Ripple, Realistic Water, Fluid Simulation, and Glitch) with high-performance WebGL.

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](https://github.com/kxxxr/kxxxr.js)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![WebGL](https://img.shields.io/badge/WebGL-Required-orange.svg)](https://get.webgl.org/)

## Overview

kxxxr.js brings interactive effects to the web with a lightweight WebGL renderer. It converts images, videos, SVGs, or divs into responsive effects that react to mouse movement.

## Demo

[Live Demo](https://kxxxr-js.vercel.app)

![kxxxr.js Demo Preview](demo/assets/demo.gif)

## Key Features

| Feature                   | Supported | Feature                    | Supported |
| ------------------------- | --------- | -------------------------- | --------- |
| **Auto-Initialization**   | ✅        | **Custom Configuration**   | ✅        |
| **Ripple Effects**        | ✅        | **Realistic Water**        | ✅        |
| **Fluid Simulation**      | ✅        | **Glitch (Image & Video)** | ✅        |
| **Image Support**         | ✅        | **SVG Support**            | ✅        |
| **Div Background Images** | ✅        | **Mouse Displacement**     | ✅        |
| **Smooth Animations**     | ✅        | **High Performance**       | ✅        |
| **CDN Ready**             | ✅        | **Optional Debug GUI**     | ✅        |
| **Responsive Design**     | ✅        | **Mobile Friendly**        | ✅        |

## Prerequisites

Add the following script(s) before you initialize kxxxr.js (normally at the end of the `<body>`):

```html
<!-- Three.js – WebGL 3D library (required) -->
<script src="https://unpkg.com/three/build/three.min.js"></script>

<!-- kxxxr.js – the library itself -->
<script src="https://unpkg.com/kxxxr.js/dist/kxxxr.js"></script>
```

Three.js provides the WebGL rendering engine that powers kxxxr.js. The library will not work without Three.js.

Optional (only for debug controls):

```html
<!-- dat.gui – debug controls (optional) -->
<script src="https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/build/dat.gui.min.js"></script>
```

## Quick Start

### Auto-Initialization (Easiest Way)

Just add CSS classes to your elements and kxxxr.js will automatically initialize the effects:

```html
<!-- Ripple effect on images, svgs, divs  -->
<svg
  class="kxxxr-ripple"
  viewBox="0 0 100 100"
  xmlns="http://www.w3.org/2000/svg"
>
  <circle cx="50" cy="50" r="40" />
</svg>

<img class="kxxxr-ripple" src="image.jpg" alt="Water Effect" />

<div class="kxxxr-ripple" style="background-image: url('image.jpg')">
  <!-- Content here -->
  <p>Hello, world!</p>
</div>

<!-- Realistic water effect on divs, svgs, images -->
<svg
  class="kxxxr-realistic"
  viewBox="0 0 100 100"
  xmlns="http://www.w3.org/2000/svg"
>
  <circle cx="50" cy="50" r="40" />
</svg>

<img class="kxxxr-realistic" src="image.jpg" alt="Water Effect" />

<div class="kxxxr-realistic" style="background-image: url('image.jpg')">
  <!-- Content here -->
  <p>Hello, world!</p>
</div>

<!-- Fluid simulation (tail reveal) on images -->
<img class="kxxxr-fluid" src="top.jpg" data-back="bottom.jpg" />

<!-- Glitch effect on image or video -->
<img class="kxxxr-glitch" src="image.jpg" />

<video
  class="kxxxr-glitch"
  src="video.mp4"
  autoplay
  loop
  muted
  playsinline
></video>
```

### Custom Configuration

If you want to customize effects, use the simple API:

```html
<script>
  // Custom ripple effect
  kxxxr.rippleEffect(".my-images", {
    strength: 0.1, // Stronger effect
    radius: 0.4, // Larger radius
    pulseSpeed: 3.0, // Faster animation
  });

  // Custom realistic effect
  kxxxr.realisticEffect(".my-divs", {
    simulationSpeed: 1.4, // not more than 1.4
    effectRadius: 25, // radius of the effect
    headStrength: 0.8, // strength of the head of the effect
    // Advanced filter customization (optional)
    reflectionIntensity: 0.8, // intensity of the reflection
    reflectionColor: "#ffffff", // color of the reflection
    contrast: 1.1, // contrast of the effect
    saturation: 1.1, // saturation of the effect
    brightness: 1.1, // brightness of the effect
    tint: "#ffffff", // tint of the effect
    shadowIntensity: -0.15, // shadow intensity of the effect
  });

  // Custom glitch effect on images
  kxxxr.glitchEffect(".my-glitch-images", {
    speed: 1.0, // Speed of the glitch animation
    intensity: 0.7, // Amount of distortion
    chromaShift: 3.0, // RGB split intensity (color channel shifting)
    displacement: 0.05, // Max image displacement
    noiseAmount: 0.15, // Noise grain amount
    scanlineIntensity: 0.3, // Scanline darkness/contrast
    glitchFrequency: 0.3, // How frequently the effect jumps
    horrorMode: false, // Enable horror glitch color grading
    enableWarping: true, // Enable additional image warping/skew
    warpingAmount: 0.3, // Amount of warping/skew
    vignette: 0.0, // Vignette darkness amount
    edgeChromaticStrength: 0.0, // Chromatic aberration near edges
    signalLossStrength: 0.0, // Blackout/signal loss effect strength
    colorDistortionAmount: 1.0, // Color channel skew/distortion
    blockSize: 15.0, // Size of blocky glitch fragments
    horizontalStripeSize: 30.0, // Height of horizontal band artifacts
    horrorColorGradingAmount: 0.02, // Intensity of horror color grading (if enabled)
  });

  // Custom fluid simulation
  kxxxr.fluidEffect(".my-fluid-images", {
    speed: 7.0, // Viscosity/advection speed
    decay: 0.97, // Decay/persistence of trails (0–1, lower fades faster)
    lineWidth: 0.07, // Normalized tail/line width (0–1)
    lineIntensity: 0.5, // How bright the fluid lines are
    threshold: 0.02, // Distance threshold for tail reveal
    edgeWidth: 0.004, // Edge softness/transition
    backImageUrl: "bottom.jpg", // Optional: URL for back image to blend with
    width: 1024, // Output width (defaults: canvas or 512)
    height: 512, // Output height (defaults: canvas or 384)
    hiDPI: true, // HiDPI/Retina rendering
    movementTimeout: 50, // ms to keep trails alive after last movement
  });
</script>
```

## HTML Data Attributes

In addition to JavaScript options, kxxxr.js can be configured using data attributes on your HTML elements. Both kebab-case and camelCase are supported for option names (e.g., `data-reflectionIntensity` or `data-reflection-intensity`).

| Attribute              | Description               | Example                      |
| ---------------------- | ------------------------- | ---------------------------- |
| `data-strength`        | Displacement intensity    | `data-strength="0.12"`       |
| `data-radius`          | Effect radius             | `data-radius="0.4"`          |
| `data-pulseSpeed`      | Ring expansion speed      | `data-pulseSpeed="2.0"`      |
| `data-decay`           | Amplitude decay rate      | `data-decay="2.5"`           |
| `data-frequency`       | Wave frequency            | `data-frequency="20"`        |
| `data-simulationSpeed` | Physics simulation speed  | `data-simulationSpeed="1.8"` |
| `data-effectRadius`    | Head radius               | `data-effectRadius="35"`     |
| `data-headStrength`    | Head effect strength      | `data-headStrength="0.8"`    |
| `data-tailStrength`    | Tail effect strength      | `data-tailStrength="0.6"`    |
| `data-tailWidth`       | Tail width                | `data-tailWidth="25"`        |
| `data-debug`           | Enable debug panel (bool) | `data-debug="true"`          |

Advanced filter customization (for `kxxxr-realistic`):

| Attribute                  | Type   | Default   | Description                                  |
| -------------------------- | ------ | --------- | -------------------------------------------- |
| `data-reflectionIntensity` | number | `0.5`     | Reflection intensity (0.0–1.0)               |
| `data-reflectionColor`     | color  | `#ffffff` | Reflection color (CSS color)                 |
| `data-contrast`            | number | `0.65`    | Contrast multiplier                          |
| `data-saturation`          | number | `0.9`     | Saturation multiplier                        |
| `data-brightness`          | number | `1.3`     | Brightness multiplier                        |
| `data-tint`                | color  | `#ffffff` | Multiplicative tint color                    |
| `data-shadowIntensity`     | number | `-0.28`   | Vignette shadow intensity (negative allowed) |

```html
<!-- Custom ripple effect -->
<img
  class="kxxxr-ripple"
  src="image.jpg"
  data-strength="0.12"
  data-radius="0.4"
  data-pulseSpeed="2.0"
/>

<!-- Custom realistic water effect -->
<div
  class="kxxxr-realistic"
  style="background-image: url('image.jpg')"
  data-simulationSpeed="1.4"
  data-effectRadius="35"
  data-reflectionIntensity="0.8"
  data-reflectionColor="#ffffff"
  data-contrast="1.1"
  data-saturation="1.1"
  data-brightness="1.1"
  data-tint="#ffffff"
  data-shadowIntensity="-0.15"
></div>

<!-- Fluid simulation with debug -->
<img
  class="kxxxr-fluid"
  src="top.jpg"
  data-back="bottom.jpg"
  data-speed="7.0"
  data-line-width="0.07"
  data-line-intensity="0.5"
  data-threshold="0.02"
  data-edge-width="0.004"
  data-debug="true"
/>

<!-- Glitch on image with debug -->
<img class="kxxxr-glitch" src="image.jpg" data-debug="true" />
```

## Installation (for bundlers)

```bash
npm install three kxxxr.js
```

**Peer dependency:** `three@^0.170.0`

## Manual Usage (ESM / bundlers)

```js
import { waterHoverEffect, realisticWaterHoverEffect } from "kxxxr.js";

const canvas = document.querySelector("#canvas");
const dispose = waterHoverEffect(canvas, {
  imageUrl: "image.jpg",
  strength: 0.08,
  radius: 0.3,
});

// later if needed: dispose()
```

## Available Effects

### 🌊 Ripple Effect (`kxxxr-ripple`)

Interactive ripple distortion on mouse hover with smooth wave propagation.

### 🌊 Realistic Water Effect (`kxxxr-realistic`)

Advanced water simulation with physics-based fluid dynamics and realistic displacement.

### 🌊 Fluid Simulation (`kxxxr-fluid`)

Tail-reveal style effect that blends a top image into a background image using a fluid-like trail that follows the cursor.

### ⚡ Glitch Effect (`kxxxr-glitch`)

Advanced glitch with chromatic aberration, displacement, scanlines, blocks/stripes, optional horror mode, and supports both images and HTML5 videos.

## Parameters

### Ripple Effect Options

| Option       | Type   | Default | Description                       |
| ------------ | ------ | ------- | --------------------------------- |
| `strength`   | number | `0.08`  | Displacement intensity (0.01–0.2) |
| `radius`     | number | `0.3`   | Effect radius (0.1–0.8)           |
| `pulseSpeed` | number | `2.0`   | Ring expansion speed (0.5–5.0)    |
| `decay`      | number | `2.5`   | Amplitude decay rate (1.0–5.0)    |
| `frequency`  | number | `20`    | Wave frequency (10–50)            |

### Realistic Water Effect Options

| Option                | Type   | Default   | Description                                  |
| --------------------- | ------ | --------- | -------------------------------------------- |
| `simulationSpeed`     | number | `1.2`     | Physics simulation speed (0.5–3.0)           |
| `effectRadius`        | number | `25`      | Head radius (10–50)                          |
| `headStrength`        | number | `0.7`     | Head effect strength (0.1–1.0)               |
| `tailStrength`        | number | `0.6`     | Tail effect strength (0.1–1.0)               |
| `tailWidth`           | number | `20`      | Tail width (5–40)                            |
| `reflectionIntensity` | number | `0.5`     | Reflection intensity (0.0–1.0)               |
| `reflectionColor`     | color  | `#ffffff` | Reflection color (CSS color)                 |
| `contrast`            | number | `0.65`    | Contrast multiplier                          |
| `saturation`          | number | `0.9`     | Saturation multiplier                        |
| `brightness`          | number | `1.3`     | Brightness multiplier                        |
| `tint`                | color  | `#ffffff` | Multiplicative tint color                    |
| `shadowIntensity`     | number | `-0.28`   | Vignette shadow intensity (negative allowed) |

### Fluid Simulation Options

| Option            | Type    | Default | Description                             |
| ----------------- | ------- | ------- | --------------------------------------- |
| `speed`           | number  | `1.0`   | Simulation speed (steps per frame)      |
| `decay`           | number  | `0.97`  | Trail decay factor                      |
| `lineWidth`       | number  | `0.05`  | Trail stroke width                      |
| `lineIntensity`   | number  | `0.3`   | Trail intensity                         |
| `threshold`       | number  | `0.02`  | Blend threshold                         |
| `edgeWidth`       | number  | `0.004` | Soft edge width                         |
| `hiDPI`           | boolean | `true`  | Respect device pixel ratio              |
| `movementTimeout` | number  | `50`    | Stop movement after ms without activity |

Pass `backImageUrl` programmatically or `data-back` via HTML.

### Glitch Effect Options

| Option                     | Type    | Default | Description                        |
| -------------------------- | ------- | ------- | ---------------------------------- |
| `speed`                    | number  | `1.0`   | Animation speed                    |
| `intensity`                | number  | `0.7`   | Overall glitch strength            |
| `chromaShift`              | number  | `3.0`   | RGB channels shift amount          |
| `displacement`             | number  | `0.05`  | Horizontal displacement            |
| `noiseAmount`              | number  | `0.15`  | Digital noise amount               |
| `scanlineIntensity`        | number  | `0.3`   | Scanline strength                  |
| `glitchFrequency`          | number  | `0.3`   | How often glitches occur           |
| `horrorMode`               | boolean | `false` | Enable horror-style effects        |
| `enableWarping`            | boolean | `true`  | Enable warping in horror mode      |
| `warpingAmount`            | number  | `0.3`   | Warping intensity                  |
| `vignette`                 | number  | `0.0`   | Vignette strength                  |
| `edgeChromaticStrength`    | number  | `0.0`   | Edge chromatic blend amount        |
| `signalLossStrength`       | number  | `0.0`   | Black band signal-loss strength    |
| `colorDistortionAmount`    | number  | `1.0`   | Color distortion strength          |
| `blockSize`                | number  | `15.0`  | Block displacement band size       |
| `horizontalStripeSize`     | number  | `30.0`  | Horizontal tear stripe size        |
| `horrorColorGradingAmount` | number  | `0.02`  | Horror mode color grading strength |

## Debugging Controls (dat.gui)

kxxxr.js supports an optional debug panel powered by `dat.gui`.

- Include the dat.gui CDN script on the page (see Prerequisites)
- Enable via programmatic API (`debug: true`) or via auto-init attribute (`data-debug="true"`).

Programmatic:

```html
<script>
  // Ripple with debug GUI
  kxxxr.rippleEffect(".my-images", {
    debug: true,
    strength: 0.1,
    radius: 0.35,
  });

  // Glitch with debug GUI
  kxxxr.glitchEffect(".my-glitch", {
    debug: true,
    intensity: 0.8,
    chromaShift: 4.0,
  });
</script>
```

Auto-init (HTML only):

```html
<img
  class="kxxxr-fluid"
  src="top.jpg"
  data-back="bottom.jpg"
  data-debug="true"
/>
<img class="kxxxr-glitch" src="image.jpg" data-debug="true" />
```

## Presets

Below are some ready-made configurations for different effects:

| Name        | Settings                                                        | Purpose                                |
| ----------- | --------------------------------------------------------------- | -------------------------------------- |
| **Subtle**  | `{ strength: 0.05, radius: 0.2, pulseSpeed: 1.5 }`              | Minimal, elegant ripple effect         |
| **Dynamic** | `{ strength: 0.12, radius: 0.5, pulseSpeed: 3.0 }`              | High-energy ripple with fast animation |
| **Smooth**  | `{ simulationSpeed: 0.8, effectRadius: 20, headStrength: 0.5 }` | Gentle, flowing water simulation       |
| **Intense** | `{ simulationSpeed: 2.0, effectRadius: 35, headStrength: 0.9 }` | Strong, dramatic water effect          |

## API Reference

### Auto-initialization API

```js
kxxxr.init(); // Initialize all effects
kxxxr.cleanup(); // Cleanup all effects
kxxxr.reinit(); // Reinitialize (useful for dynamic content)
```

### Simple Global API (CDN)

```js
// Ripple effect on elements
kxxxr.rippleEffect(".my-images", {
  strength: 0.1,
  radius: 0.4,
});

// Realistic water effect on elements
kxxxr.realisticEffect(".my-divs", {
  simulationSpeed: 1.5,
  effectRadius: 30,
});

// Glitch effect on elements
kxxxr.glitchEffect(".my-glitch", {
  intensity: 0.8,
});

// Fluid simulation on elements
kxxxr.fluidEffect(".my-fluid", {
  speed: 6.0,
  backImageUrl: "bottom.jpg",
});
```

### Advanced API (ESM)

```js
import { waterHoverEffect, realisticWaterHoverEffect } from "kxxxr.js";

// Ripple effect
const dispose = waterHoverEffect(canvas, {
  imageUrl: "image.jpg",
  strength: 0.08,
  radius: 0.3,
});

// Realistic water effect
const dispose2 = realisticWaterHoverEffect(canvas, {
  imageUrl: "image.jpg",
  width: 400,
  height: 300,
  simulationSpeed: 1.2,
});
```

## FAQ

| Question                                       | Answer                                                                                                                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Does the library handle responsive design?** | Yes, kxxxr.js automatically handles window resize events and rebuilds effects as needed.                                                                               |
| **What happens to the original element?**      | The original element is hidden and replaced with the water effect canvas. The canvas precisely matches the original element's position and dimensions.                 |
| **Can I use custom images?**                   | Yes, works with any image format (JPG, PNG, SVG, WebP) and background images on divs.                                                                                  |
| **How do I optimize performance?**             | Use smaller effect radius, lower strength values, and limit the number of simultaneous effects. The library automatically optimizes rendering for off-screen elements. |
| **Does the effect work on mobile devices?**    | Yes, kxxxr.js works on most modern mobile devices that support WebGL. Interaction is based on touch events.                                                            |
| **What types of elements can be converted?**   | Images, SVGs, divs with background images, and any element with visual content.                                                                                        |

## Browser Support

The kxxxr.js library is compatible with all modern WebGL-enabled browsers:

| Browser        | Supported |
| -------------- | --------- |
| Google Chrome  | ✅        |
| Safari         | ✅        |
| Firefox        | ✅        |
| Microsoft Edge | ✅        |
| Mobile Safari  | ✅        |
| Mobile Chrome  | ✅        |

**Note:** Requires WebGL support. The library will fail to initialize if WebGL or Three.js are not available.

## License

MIT License - see [LICENSE](LICENSE) file for details.
