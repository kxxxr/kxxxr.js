import * as THREE from "three";

/**
 * Fluid-like hover tail reveal effect with two-image blending.
 * Simplified shader-based approach with trail persistence.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{
 *  imageUrl: string,
 *  backImageUrl?: string|null,
 *  width?: number,
 *  height?: number,
 *  speed?: number,
 *  decay?: number,
 *  lineWidth?: number,
 *  lineIntensity?: number,
 *  threshold?: number,
 *  edgeWidth?: number,
 *  hiDPI?: boolean,
 * }} options
 * @returns {() => void} dispose
 */
export function fluidSimulationEffect(canvas, options = {}) {
  const {
    imageUrl,
    backImageUrl = null,
    width = canvas.clientWidth || 512,
    height = canvas.clientHeight || 384,
    speed = 1.0, // control 
    decay = 0.97,
    lineWidth = 0.05,
    lineIntensity = 0.3,
    threshold = 0.02,
    edgeWidth = 0.004,
    hiDPI = true,
    movementTimeout = 50, // Stop effect after this many ms of no movement
  } = options;

  if (!canvas) throw new Error("fluidSimulationEffect: canvas is required");
  if (!imageUrl) throw new Error("fluidSimulationEffect: imageUrl is required");

  const dpr = hiDPI ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 1);

  // Render target params
  const rtParams = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
    depthBuffer: false,
    stencilBuffer: false,
  };

  // Trail render targets (ping-pong)
  const trailA = new THREE.WebGLRenderTarget(width, height, rtParams);
  const trailB = new THREE.WebGLRenderTarget(width, height, rtParams);
  let trailPing = trailA;
  let trailPong = trailB;

  // Load textures
  const loader = new THREE.TextureLoader();
  const topTextureSize = new THREE.Vector2(1024, 1024);
  const bottomTextureSize = new THREE.Vector2(1024, 1024);

  const topTexture = loader.load(imageUrl, (texture) => {
    topTextureSize.set(texture.image.width, texture.image.height);
  });
  topTexture.colorSpace = THREE.NoColorSpace;
  topTexture.minFilter = THREE.LinearFilter;
  topTexture.magFilter = THREE.LinearFilter;
  topTexture.flipY = true;
  topTexture.generateMipmaps = false;

  const bottomTexture = backImageUrl
    ? loader.load(backImageUrl, (texture) => {
        bottomTextureSize.set(texture.image.width, texture.image.height);
      })
    : topTexture;

  if (backImageUrl) {
    bottomTexture.colorSpace = THREE.NoColorSpace;
    bottomTexture.minFilter = THREE.LinearFilter;
    bottomTexture.magFilter = THREE.LinearFilter;
    bottomTexture.flipY = true;
    bottomTexture.generateMipmaps = false;
  } else {
    bottomTextureSize.copy(topTextureSize);
  }

  // Scenes
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
  scene.add(quad);

  // Mouse state
  const mouse = new THREE.Vector2(-100, -100);
  const prevMouse = new THREE.Vector2(-100, -100);
  let isMoving = false;
  let lastMoveTime = 0;
  let movementTimeoutId = null;

  function stopMovement() {
    isMoving = false;
  }

  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;

    if (!isMoving) {
      prevMouse.set(x, y);
    } else {
      prevMouse.copy(mouse);
    }
    mouse.set(x, y);
    isMoving = true;
    lastMoveTime = performance.now();

    // Clear existing timeout and set new one
    if (movementTimeoutId !== null) {
      clearTimeout(movementTimeoutId);
    }
    movementTimeoutId = setTimeout(stopMovement, movementTimeout);
  }

  function onLeave() {
    isMoving = false;
    mouse.set(-100, -100);
    prevMouse.set(-100, -100);
    if (movementTimeoutId !== null) {
      clearTimeout(movementTimeoutId);
      movementTimeoutId = null;
    }
  }

  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("mouseleave", onLeave);

  // Vertex shader (shared)
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // Fluid trail shader (accumulates trails)
  const fluidFragmentShader = `
    precision highp float;
    uniform sampler2D uPrevTrails;
    uniform vec2 uMouse;
    uniform vec2 uPrevMouse;
    uniform vec2 uResolution;
    uniform float uDecay;
    uniform bool uIsMoving;
    uniform float uLineWidth;
    uniform float uLineIntensity;

    varying vec2 vUv;

    void main() {
      vec4 prevState = texture2D(uPrevTrails, vUv);
      float newValue = prevState.r * uDecay;

      if (uIsMoving) {
        vec2 mouseDirection = uMouse - uPrevMouse;
        float lineLength = length(mouseDirection);

        if (lineLength > 0.001) {
          vec2 mouseDir = mouseDirection / lineLength;
          vec2 toPixel = vUv - uPrevMouse;
          float projAlong = dot(toPixel, mouseDir);
          projAlong = clamp(projAlong, 0.0, lineLength);

          vec2 closestPoint = uPrevMouse + projAlong * mouseDir;
          float dist = length(vUv - closestPoint);

          float intensity = smoothstep(uLineWidth, 0.0, dist) * uLineIntensity;
          newValue += intensity;
        }
      }

      gl_FragColor = vec4(newValue, 0.0, 0.0, 1.0);
    }
  `;

  // Display shader (blends two images based on fluid)
  const displayFragmentShader = `
    precision highp float;
    uniform sampler2D uFluid;
    uniform sampler2D uTopTexture;
    uniform sampler2D uBottomTexture;
    uniform vec2 uResolution;
    uniform float uDpr;
    uniform vec2 uTopTextureSize;
    uniform vec2 uBottomTextureSize;
    uniform float uThreshold;
    uniform float uEdgeWidth;

    varying vec2 vUv;

    vec2 getCoverUV(vec2 uv, vec2 textureSize) {
      if (textureSize.x < 1.0 || textureSize.y < 1.0) return uv;

      // Calculate aspect ratios
      vec2 ratio = vec2(
        min((uResolution.x / uResolution.y) / (textureSize.x / textureSize.y), 1.0),
        min((uResolution.y / uResolution.x) / (textureSize.y / textureSize.x), 1.0)
      );

      // Center and scale UV coordinates
      return vec2(
        uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
        uv.y * ratio.y + (1.0 - ratio.y) * 0.5
      );
    }

    void main() {
      float fluid = texture2D(uFluid, vUv).r;

      vec2 topUV = getCoverUV(vUv, uTopTextureSize);
      vec2 bottomUV = getCoverUV(vUv, uBottomTextureSize);

      vec4 topColor = texture2D(uTopTexture, topUV);
      vec4 bottomColor = texture2D(uBottomTexture, bottomUV);

      float edgeW = uEdgeWidth / uDpr;
      float t = smoothstep(uThreshold, uThreshold + edgeW, fluid);

      vec4 finalColor = mix(topColor, bottomColor, t);
      gl_FragColor = finalColor;
    }
  `;

  // Fluid material (trail simulation)
  const fluidMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uPrevTrails: { value: null },
      uMouse: { value: mouse },
      uPrevMouse: { value: prevMouse },
      uResolution: { value: new THREE.Vector2(width, height) },
      uDecay: { value: decay },
      uIsMoving: { value: false },
      uLineWidth: { value: lineWidth },
      uLineIntensity: { value: lineIntensity },
    },
    vertexShader,
    fragmentShader: fluidFragmentShader,
    depthTest: false,
    depthWrite: false,
  });

  // Display material (final output)
  const displayMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uFluid: { value: null },
      uTopTexture: { value: topTexture },
      uBottomTexture: { value: bottomTexture },
      uResolution: { value: new THREE.Vector2(width * dpr, height * dpr) },
      uDpr: { value: dpr },
      uTopTextureSize: { value: topTextureSize },
      uBottomTextureSize: { value: bottomTextureSize },
      uThreshold: { value: threshold },
      uEdgeWidth: { value: edgeWidth },
    },
    vertexShader,
    fragmentShader: displayFragmentShader,
    depthTest: false,
    depthWrite: false,
  });

  function resizeIfNeeded() {
    const w = canvas.clientWidth || width;
    const h = canvas.clientHeight || height;
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);

    if (canvas.width !== pw || canvas.height !== ph) {
      renderer.setSize(w, h, false);
      trailA.setSize(pw, ph);
      trailB.setSize(pw, ph);
      fluidMaterial.uniforms.uResolution.value.set(w, h);
      displayMaterial.uniforms.uResolution.value.set(pw, ph);
      displayMaterial.uniforms.uDpr.value = dpr;
    }
  }

  let disposed = false;

  function render() {
    if (disposed) return;
    requestAnimationFrame(render);
    resizeIfNeeded();

    // Run multiple simulation steps for speed > 1
    const steps = Math.max(1, Math.floor(speed));
    for (let i = 0; i < steps; i++) {
      // Update fluid trail
      fluidMaterial.uniforms.uPrevTrails.value = trailPing.texture;
      fluidMaterial.uniforms.uIsMoving.value = isMoving;
      quad.material = fluidMaterial;
      renderer.setRenderTarget(trailPong);
      renderer.render(scene, camera);

      // Swap ping-pong
      const temp = trailPing;
      trailPing = trailPong;
      trailPong = temp;
    }

    // Display final result
    displayMaterial.uniforms.uFluid.value = trailPing.texture;
    quad.material = displayMaterial;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
  }

  render();

  function dispose() {
    disposed = true;
    if (movementTimeoutId !== null) {
      clearTimeout(movementTimeoutId);
    }
    canvas.removeEventListener("mousemove", onMove);
    canvas.removeEventListener("mouseleave", onLeave);
    topTexture.dispose();
    if (backImageUrl) bottomTexture.dispose();
    trailA.dispose();
    trailB.dispose();
    quad.geometry.dispose();
    fluidMaterial.dispose();
    displayMaterial.dispose();
    renderer.dispose();
  }

  return dispose;
}
