import * as THREE from "three";

/**
 * Advanced Glitch Effect with dynamic distortions, chromatic aberration,
 * block displacement, digital noise, scan artifacts, and horror elements.
 * @param {HTMLCanvasElement} canvas
 * @param {{ imageUrl?: string, videoElement?: HTMLVideoElement, speed?: number, intensity?: number, chromaShift?: number, displacement?: number, noiseAmount?: number, scanlineIntensity?: number, glitchFrequency?: number, horrorMode?: boolean, enableWarping?: boolean, warpingAmount?: number }} options
 * @returns {() => void} dispose
 */
export function glitchEffect(canvas, options = {}) {
  const {
    imageUrl,
    videoElement = null,
    speed = 1.0,
    intensity = 0.7,
    chromaShift = 3.0,
    displacement = 0.05,
    noiseAmount = 0.15,
    scanlineIntensity = 0.3,
    glitchFrequency = 0.3,
    horrorMode = false,
    enableWarping = true,
    warpingAmount = 0.3,
    // New: control vignette strength (0 disables vignette)
    vignette = 0.0,
    // New: blend strength for edge chromatic effect (0 disables)
    edgeChromaticStrength = 0.0,
    // New: control strength of horror-mode signal loss black bands
    signalLossStrength = 0.0,
    // New: control color distortion effects (0 disables)
    colorDistortionAmount = 0.0,
    // New: control block/stripe sizes
    blockSize = 15.0,
    horizontalStripeSize = 30.0,
    // New: control horror mode color grading (0 disables)
    horrorColorGradingAmount = 1.0,
  } = options;

  if (!imageUrl && !videoElement) {
    throw new Error("Either imageUrl or videoElement is required");
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(
    Math.max(1, canvas.clientWidth),
    Math.max(1, canvas.clientHeight),
    false
  );
  renderer.setClearColor(0x000000, 0);

  let tex;
  let isVideo = false;

  if (videoElement) {
    // Video texture
    isVideo = true;

    // Ensure video is playing
    videoElement.play().catch((err) => {
      console.warn("Video autoplay blocked:", err);
    });

    // Create video texture
    tex = new THREE.VideoTexture(videoElement);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.format = THREE.RGBAFormat;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
  } else {
    // Image texture
    const loader = new THREE.TextureLoader();
    tex = loader.load(imageUrl);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.flipY = true;
    tex.generateMipmaps = false;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    tDiffuse: { value: tex },
    uTime: { value: 0 },
    uIntensity: { value: intensity },
    uChromaShift: { value: chromaShift },
    uDisplacement: { value: displacement },
    uNoise: { value: noiseAmount },
    uScanline: { value: scanlineIntensity },
    uGlitchFreq: { value: glitchFrequency },
    uHorrorMode: { value: horrorMode ? 1.0 : 0.0 },
    uEnableWarping: { value: enableWarping ? 1.0 : 0.0 },
    uWarpingAmount: { value: warpingAmount },
    uResolution: { value: new THREE.Vector2(canvas.width, canvas.height) },
    uVignetteAmount: { value: vignette },
    uEdgeChromaticStrength: { value: edgeChromaticStrength },
    uSignalLossStrength: { value: signalLossStrength },
    uColorDistortionAmount: { value: colorDistortionAmount },
    uBlockSize: { value: blockSize },
    uHorizontalStripeSize: { value: horizontalStripeSize },
    uHorrorColorGradingAmount: { value: horrorColorGradingAmount },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      
      varying vec2 vUv;
      uniform sampler2D tDiffuse;
      uniform float uTime;
      uniform float uIntensity;
      uniform float uChromaShift;
      uniform float uDisplacement;
      uniform float uNoise;
      uniform float uScanline;
      uniform float uGlitchFreq;
      uniform float uHorrorMode;
      uniform float uEnableWarping;
      uniform float uWarpingAmount;
      uniform vec2 uResolution;
      uniform float uVignetteAmount;
      uniform float uEdgeChromaticStrength;
      uniform float uSignalLossStrength;
      uniform float uColorDistortionAmount;
      uniform float uBlockSize;
      uniform float uHorizontalStripeSize;
      uniform float uHorrorColorGradingAmount;

      // Better random functions
      float rand(vec2 co) {
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
      }

      float rand(float n) {
        return fract(sin(n) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = rand(i);
        float b = rand(i + vec2(1.0, 0.0));
        float c = rand(i + vec2(0.0, 1.0));
        float d = rand(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      // Smooth glitch trigger
      float glitchStrength(float time) {
        float t = time * uGlitchFreq;
        float pulse = step(0.85, fract(sin(floor(t) * 123.456) * 789.123));
        float wave = sin(t * 3.0) * 0.5 + 0.5;
        return pulse * wave * uIntensity;
      }

      // Block displacement
      vec2 blockDisplacement(vec2 uv, float time) {
        float glitch = glitchStrength(time);
        if (glitch < 0.01) return uv;

        float blockY = floor(uv.y * uBlockSize + time * 2.0);
        float displace = rand(blockY + floor(time * 3.0)) - 0.5;
        
        float threshold = 0.3 + rand(blockY) * 0.4;
        float amount = step(threshold, rand(blockY + time * 0.5));
        
        return uv + vec2(displace * uDisplacement * amount * glitch, 0.0);
      }

      // RGB channel shift with wave distortion
      vec3 chromaticAberration(sampler2D tex, vec2 uv, float time) {
        float glitch = glitchStrength(time);
        vec2 pixelSize = 1.0 / uResolution;
        
        float shift = uChromaShift * pixelSize.x * (0.3 + glitch * 0.7);
        float wave = sin(uv.y * 10.0 + time * 2.0) * 0.5;
        
        vec2 rOffset = vec2(shift * (1.0 + wave * 0.3), 0.0);
        vec2 bOffset = vec2(-shift * (1.0 + wave * 0.3), 0.0);
        
        float r = texture2D(tex, uv + rOffset).r;
        float g = texture2D(tex, uv).g;
        float b = texture2D(tex, uv + bOffset).b;
        
        return vec3(r, g, b);
      }

      // Digital scanlines
      float scanlines(vec2 uv, float time) {
        float line = sin(uv.y * uResolution.y * 1.5);
        float scroll = sin((uv.y + time * 0.05) * uResolution.y * 0.5);
        return 1.0 - ((line * 0.5 + 0.5) * 0.15 + (scroll * 0.5 + 0.5) * 0.1) * uScanline;
      }

      // Digital noise/grain
      float digitalNoise(vec2 uv, float time) {
        float glitch = glitchStrength(time);
        float n = noise(uv * uResolution * 0.5 + time * 10.0);
        float gridNoise = rand(floor(uv * uResolution * 0.1) + time * 5.0);
        return mix(n, gridNoise, glitch) * uNoise;
      }

      // Random horizontal tears
      vec2 horizontalTears(vec2 uv, float time) {
        float glitch = glitchStrength(time);
        if (glitch < 0.3) return uv;
        
        float lineY = floor(uv.y * uHorizontalStripeSize);
        float tearStrength = step(0.92, rand(lineY + floor(time * 8.0)));
        float tearOffset = (rand(lineY * 123.0 + time) - 0.5) * 0.1;
        
        return uv + vec2(tearOffset * tearStrength * glitch, 0.0);
      }

      // Color distortion
      vec3 colorDistortion(vec3 color, vec2 uv, float time) {
        if (uColorDistortionAmount < 0.01) return color;
        
        float glitch = glitchStrength(time);
        
        // Inverted bars
        float bar = step(0.95, rand(floor(uv.y * 20.0 + time * 5.0)));
        color = mix(color, 1.0 - color, bar * glitch * 0.6 * uColorDistortionAmount);
        
        // Brightness spikes
        float spike = rand(floor(time * 30.0)) * step(0.98, rand(uv.y + time));
        color += vec3(spike * glitch * 0.4 * uColorDistortionAmount);
        
        return color;
      }

      // === HORROR MODE EFFECTS ===
      
      // VHS tracking errors - horizontal distortion bands
      vec2 vhsTracking(vec2 uv, float time) {
        float t = floor(time * 0.5);
        float band = step(0.7, rand(vec2(floor(uv.y * 8.0), t)));
        float offset = (rand(vec2(floor(uv.y * 8.0), t + 123.0)) - 0.5) * 0.15;
        return uv + vec2(offset * band, 0.0);
      }

      // Face/image warping distortion
      vec2 horrorDistortion(vec2 uv, float time) {
        vec2 center = vec2(0.5, 0.45);
        vec2 toCenter = uv - center;
        float dist = length(toCenter);
        
        // Pulsating warp
        float warpTime = time * 0.3;
        float warpPulse = sin(warpTime) * 0.5 + 0.5;
        float warp = sin(dist * 15.0 - time * 2.0) * uWarpingAmount * warpPulse;
        
        // Stretch distortion (vertical stretching is creepier)
        float stretchTrigger = step(0.92, rand(floor(time * 0.5)));
        float verticalStretch = sin(uv.x * 20.0 + time * 3.0) * 0.08 * stretchTrigger;
        
        return uv + toCenter * warp + vec2(0.0, verticalStretch * uWarpingAmount);
      }

      // Screen static/dead pixels
      float staticNoise(vec2 uv, float time) {
        float t = floor(time * 50.0);
        float staticIntensity = step(0.88, rand(vec2(t, 0.0)));
        return rand(uv * time * 100.0) * staticIntensity;
      }

      // Signal loss effect
      float signalLoss(vec2 uv, float time) {
        float t = floor(time * 0.3);
        float lossArea = step(0.9, rand(vec2(t, 1.0)));
        float lossBand = step(rand(vec2(t, 2.0)), uv.y) * 
                         step(uv.y, rand(vec2(t, 3.0)));
        return lossArea * lossBand;
      }

      // Creepy color grading
      vec3 horrorColorGrade(vec3 color, float time) {
        if (uHorrorColorGradingAmount < 0.01) return color;
        
        vec3 originalColor = color;
        
        // Desaturate
        float gray = dot(color, vec3(0.299, 0.587, 0.114));
        color = mix(color, vec3(gray), 0.4);
        
        // Add creepy tint (randomly shift between red and green)
        float tintSwitch = step(0.5, fract(sin(floor(time * 0.2)) * 999.0));
        vec3 redTint = vec3(1.3, 0.7, 0.7);
        vec3 greenTint = vec3(0.7, 1.2, 0.8);
        vec3 tint = mix(greenTint, redTint, tintSwitch);
        color *= tint;
        
        // Crush blacks/boost contrast
        color = pow(color, vec3(1.3));
        color = (color - 0.5) * 1.4 + 0.5;
        
        return mix(originalColor, color, uHorrorColorGradingAmount);
      }

      // Ghosting/motion trails
      vec3 ghosting(sampler2D tex, vec2 uv, float time) {
        float glitch = glitchStrength(time);
        vec3 current = texture2D(tex, uv).rgb;
        
        // Sample previous frames with offset
        vec2 offset1 = vec2(0.003 * glitch, 0.0);
        vec2 offset2 = vec2(-0.006 * glitch, 0.0);
        vec3 ghost1 = texture2D(tex, uv + offset1).rgb * 0.4;
        vec3 ghost2 = texture2D(tex, uv + offset2).rgb * 0.25;
        
        return current + ghost1 + ghost2;
      }

      // Random inverted flashes
      float invertFlash(float time) {
        float t = floor(time * 10.0);
        return step(0.97, rand(vec2(t, 999.0)));
      }

      // Pixelation/blocky artifacts
      vec2 pixelate(vec2 uv, float time) {
        float glitch = glitchStrength(time);
        float blockSize = mix(1.0, 0.02, glitch * step(0.8, rand(floor(time))));
        vec2 blocks = floor(uv / blockSize) * blockSize;
        return mix(uv, blocks, step(0.85, glitch));
      }

      void main() {
        vec2 uv = vUv;
        
        // === HORROR MODE EFFECTS (if enabled) ===
        if (uHorrorMode > 0.5) {
          // Apply VHS tracking errors
          uv = vhsTracking(uv, uTime);
          
          // Apply creepy face/image warping (if enabled)
          if (uEnableWarping > 0.5) {
            uv = horrorDistortion(uv, uTime);
          }
          
          // Pixelation during intense glitches
          uv = pixelate(uv, uTime);
        }
        
        // Apply layered distortions
        uv = horizontalTears(uv, uTime);
        uv = blockDisplacement(uv, uTime);
        
        // Sample with chromatic aberration OR ghosting (horror mode)
        vec3 color;
        if (uHorrorMode > 0.5) {
          color = ghosting(tDiffuse, uv, uTime);
        } else {
          color = chromaticAberration(tDiffuse, uv, uTime);
        }
        
        // Apply scanlines
        color *= scanlines(vUv, uTime);
        
        // Add digital noise
        float noise = digitalNoise(vUv, uTime);
        color += vec3(noise);
        
        // === HORROR MODE EFFECTS ===
        if (uHorrorMode > 0.5) {
          // Add intense static
          float staticVal = staticNoise(vUv, uTime);
          color = mix(color, vec3(staticVal), staticVal * 0.5);
          
          // Signal loss (black bars)
          float sigLoss = signalLoss(vUv, uTime);
          color = mix(color, vec3(0.0), sigLoss * uSignalLossStrength);
          
          // Apply creepy color grading
          color = horrorColorGrade(color, uTime);
          
          // Random inverted flashes
          float flash = invertFlash(uTime);
          color = mix(color, 1.0 - color, flash * 0.8);
        }
        
        // Color distortions
        color = colorDistortion(color, vUv, uTime);
        
        // Configurable vignette (0 disables)
        if (uVignetteAmount > 0.0) {
          float vignette = 1.0 - length(vUv - 0.5) * uVignetteAmount;
          color *= clamp(vignette, 0.0, 1.0);
        }
        
        // Subtle RGB shift on edges (blend so grain/scanlines remain)
        if (uEdgeChromaticStrength > 0.0) {
          float edgeDist = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
          float edgeMask = smoothstep(0.05, 0.0, edgeDist);
          float edgeShift = (0.05 - clamp(edgeDist, 0.0, 0.05)) * 20.0;
          vec3 edgeCol = chromaticAberration(tDiffuse, uv, uTime + edgeShift);
          color = mix(color, edgeCol, edgeMask * uEdgeChromaticStrength);
        }
        
        gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
      }
    `,
    transparent: true,
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  function resizeIfNeeded() {
    const dpr = renderer.getPixelRatio();
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(w, h);
    }
  }

  let raf = 0;
  let disposed = false;

  function render() {
    if (disposed) return;
    resizeIfNeeded();
    uniforms.uTime.value += 0.016 * speed;

    // Update video texture if needed
    if (
      isVideo &&
      videoElement &&
      videoElement.readyState >= videoElement.HAVE_CURRENT_DATA
    ) {
      tex.needsUpdate = true;
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(render);
  }

  render();

  return function dispose() {
    disposed = true;
    cancelAnimationFrame(raf);
    tex.dispose();
    quad.geometry.dispose();
    material.dispose();
    renderer.dispose();
  };
}
