# kxxxr.js

**Universal WebGL Water Effect Library**

kxxxr.js transforms any DOM element into beautiful, interactive water effects with mouse displacement, rendered in high-performance WebGL.

[![Version](https://img.shields.io/badge/version-0.1.4-blue.svg)](https://github.com/kxxxr/kxxxr.js)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![WebGL](https://img.shields.io/badge/WebGL-Required-orange.svg)](https://get.webgl.org/)

## Overview

kxxxr.js brings interactive water effects to the web with a lightweight WebGL renderer. It converts any DOM element, images, SVGs, or divs into responsive water systems that react to mouse movement. The library features smooth ripple distortions and realistic water physics, creating natural and performant user experiences.

## Demo

[Live Demo (Vercel)](https://kxxxr-js.vercel.app)

![kxxxr.js Demo Preview](demo/preview.gif)

## Key Features

| Feature                   | Supported | Feature                     | Supported |
| ------------------------- | --------- | --------------------------- | --------- |
| **Auto-Initialization**   | ✅        | **Custom Configuration**    | ✅        |
| **Ripple Effects**        | ✅        | **Realistic Water Physics** | ✅        |
| **Image Support**         | ✅        | **SVG Support**             | ✅        |
| **Div Background Images** | ✅        | **Mouse Displacement**      | ✅        |
| **Smooth Animations**     | ✅        | **High Performance**        | ✅        |
| **CDN Ready**             | ✅        | **Zero Dependencies**       | ✅        |
| **Responsive Design**     | ✅        | **Mobile Friendly**         | ✅        |

## Prerequisites

Add the following script before you initialize kxxxr.js (normally at the end of the `<body>`):

```html
<!-- Three.js – WebGL 3D library (required) -->
<script src="https://unpkg.com/three/build/three.min.js"></script>

<!-- kxxxr.js – the library itself -->
<script src="https://unpkg.com/kxxxr.js/dist/kxxxr.js"></script>
```

Three.js provides the WebGL rendering engine that powers kxxxr.js. The library will not work without Three.js.

## Quick Start

### Auto-Initialization (Easiest Way)

Just add CSS classes to your elements and kxxxr.js will automatically initialize the effects:

```html
<!-- Ripple effect on images -->
<img class="kxxxr-ripple" src="image.jpg" alt="Water Effect" />

<!-- Realistic water effect on divs -->
<div class="kxxxr-realistic" style="background-image: url('image.jpg')">
  <!-- Content here -->
  <p>Hello, world!</p>
</div>

<!-- Works with SVGs too -->
<svg class="kxxxr-ripple" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="blue" />
</svg>
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
    effectRadius: 25,
    headStrength: 0.8,
    // Advanced filter customization (optional)
    reflectionIntensity: 0.8,
    reflectionColor: "#ffffff",
    contrast: 1.1,
    saturation: 1.1,
    brightness: 1.1,
    tint: "#ffffff",
    shadowIntensity: -0.15,
  });
</script>
```

## HTML Data Attributes

In addition to JavaScript options, kxxxr.js can be configured using data attributes on your HTML elements:

| Attribute              | Description              | Example                      |
| ---------------------- | ------------------------ | ---------------------------- |
| `data-strength`        | Displacement intensity   | `data-strength="0.12"`       |
| `data-radius`          | Effect radius            | `data-radius="0.4"`          |
| `data-pulseSpeed`      | Ring expansion speed     | `data-pulseSpeed="2.0"`      |
| `data-decay`           | Amplitude decay rate     | `data-decay="2.5"`           |
| `data-frequency`       | Wave frequency           | `data-frequency="20"`        |
| `data-simulationSpeed` | Physics simulation speed | `data-simulationSpeed="1.8"` |
| `data-effectRadius`    | Head radius              | `data-effectRadius="35"`     |
| `data-headStrength`    | Head effect strength     | `data-headStrength="0.8"`    |
| `data-tailStrength`    | Tail effect strength     | `data-tailStrength="0.6"`    |
| `data-tailWidth`       | Tail width               | `data-tailWidth="25"`        |

Advanced filter customization (for `kxxxr-realistic`). Both kebab-case and camelCase are supported, e.g. `data-reflection-intensity` or `data-reflectionIntensity`:

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
  data-simulationSpeed="1.8"
  data-effectRadius="35"
  data-reflectionIntensity="0.8"
  data-reflectionColor="#ffffff"
  data-contrast="1.1"
  data-saturation="1.1"
  data-brightness="1.1"
  data-tint="#ffffff"
  data-shadowIntensity="-0.15"
></div>
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
