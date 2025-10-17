import {
  WebGLRenderer,
  Scene,
  OrthographicCamera,
  TextureLoader,
  SRGBColorSpace,
  LinearFilter,
  Vector2,
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  Clock,
} from "three";

/**
 * Water ripple hover effect that distorts an image texture based on mouse.
 * @param {HTMLCanvasElement} canvas
 * @param {{ imageUrl:string, strength?:number, radius?:number }} options
 * @returns {() => void} dispose
 */
export function waterHoverEffect(canvas, options = {}) {
  if (!canvas) throw new Error("waterHoverEffect: canvas is required");
  const {
    imageUrl,
    strength = 0.08,
    radius = 0.25, // used as ring width default
    pulseSpeed = 1.2,
    decay = 1.8,
    frequency = 20.0,
  } = options;
  if (!imageUrl)
    throw new Error("waterHoverEffect: options.imageUrl is required");

  const renderer = new WebGLRenderer({
    canvas,
    antialias: false, // Disable antialiasing for better performance
    alpha: true,
    powerPreference: "high-performance", // Use dedicated GPU if available
  });
  renderer.setPixelRatio(1); // Fixed pixel ratio for maximum performance
  renderer.setClearColor(0x000000, 0); // transparent background
  renderer.outputColorSpace = SRGBColorSpace; // proper color space
  renderer.toneMappingExposure = 1.0; // no tone mapping
  renderer.toneMapping = 0; // LinearToneMapping

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 10);
  camera.position.z = 1;

  const loader = new TextureLoader();
  const texture = loader.load(imageUrl);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.flipY = true; // fix texture orientation
  texture.generateMipmaps = false; // disable mipmaps

  const uniforms = {
    uTime: { value: 0 },
    uTex: { value: texture },
    uResolution: { value: new Vector2(1, 1) },
    uMouse: { value: new Vector2(-10, -10) }, // offscreen init
    uStrength: { value: strength },
    uRadius: { value: radius },
    uPulseTime: { value: 0 },
    uPulseAmp: { value: 0 },
    uPulseSpeed: { value: pulseSpeed },
    uFrequency: { value: frequency },
  };

  const vertexShader = `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTex;
    uniform vec2 uMouse; // in UV space (0..1)
    uniform float uTime;
    uniform float uStrength; // displacement intensity
    uniform float uRadius;   // radius of effect in UV
    uniform float uPulseTime; // time since last pulse
    uniform float uPulseAmp;  // decaying amplitude
    uniform float uPulseSpeed; // ring expansion speed
    uniform float uFrequency;  // wave frequency

    // Ring-shaped envelope centered at expanding radius
    float ringEnvelope(float d, float t, float speed, float width) {
      float center = t * speed;
      float x = (d - center) / max(width, 1e-4);
      return exp(-x * x);
    }

    void main(){
      float d = distance(vUv, uMouse);
      float env = ringEnvelope(d, uPulseTime, uPulseSpeed, uRadius);
      vec2 dir = normalize(vUv - uMouse + 1e-6);
      float phase = (d - uPulseTime * uPulseSpeed) * uFrequency;
      float wave = sin(phase);
      float disp = env * wave * uStrength * uPulseAmp;
      vec2 uv = vUv + dir * disp;
      
      vec4 color = texture2D(uTex, uv);
      color.rgb = pow(color.rgb, vec3(0.5)); // moderate gamma
      color.rgb *= 1.1; // gentle brightness boost
      gl_FragColor = color;
    }
  `;

  const geometry = new PlaneGeometry(2, 2, 1, 1);
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: false, // no transparency needed for full image
    depthWrite: false,
    depthTest: false,
    side: 0, // FrontSide
    toneMapped: false, // disable tone mapping
  });
  const mesh = new Mesh(geometry, material);
  scene.add(mesh);

  function resize() {
    const w = canvas.clientWidth || canvas.width || 800;
    const h = canvas.clientHeight || canvas.height || 600;
    renderer.setSize(w, h, false);
  }
  resize();

  const clock = new Clock();
  let raf = 0;
  let disposed = false;
  // Removed pulse lock - allow immediate restart on mouse move

  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    uniforms.uMouse.value.set(x, 1.0 - y);
    // immediate restart: stop current ripple and start new one
    uniforms.uPulseTime.value = 0.0;
    uniforms.uPulseAmp.value = 1.0;
  }
  function onLeave() {
    uniforms.uMouse.value.set(-10, -10);
    uniforms.uPulseAmp.value = 0.0;
  }
  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("mouseleave", onLeave);

  function render() {
    if (disposed) return;
    raf = requestAnimationFrame(render);
    const dt = clock.getDelta();
    uniforms.uTime.value += dt;
    uniforms.uPulseTime.value += dt;
    // exponential decay of pulse amplitude
    uniforms.uPulseAmp.value *= Math.exp(-decay * dt);
    // auto-stop when amplitude gets very low
    if (uniforms.uPulseAmp.value < 0.01) {
      uniforms.uPulseAmp.value = 0.0;
    }
    renderer.render(scene, camera);
  }
  render();

  function dispose() {
    disposed = true;
    cancelAnimationFrame(raf);
    canvas.removeEventListener("mousemove", onMove);
    canvas.removeEventListener("mouseleave", onLeave);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    texture.dispose();
  }

  return dispose;
}

/**
 * Water hover effect with liquid simulation (wavy effect) on an image.
 * @param {HTMLCanvasElement} canvas
 * @param {{ imageUrl:string, amplitude?:number, width?:number, height?:number }} options
 * @returns {() => void} dispose
 */
export function waterHoverLiquidEffect(canvas, options = {}) {
  const {
    imageUrl,
    width = canvas.clientWidth || 800,
    height = canvas.clientHeight || 600,
    amplitude = 1.0,
  } = options;
  if (!imageUrl)
    throw new Error("waterHoverLiquidEffect: options.imageUrl is required");

  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1.4, 1.4, 1, -1, 0, 10);
  camera.position.z = 2.2;

  const geometry = new PlaneGeometry(2.8, 2.0, 200, 200);

  // Load image as texture
  const loader = new TextureLoader();
  const texture = loader.load(imageUrl);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.flipY = true;
  texture.generateMipmaps = false;

  // Mouse uniform
  const uniforms = {
    uTime: { value: 0 },
    uAmplitude: { value: amplitude },
    uTex: { value: texture },
    uMouse: { value: new Vector2(-10, -10) }, // offscreen init
  };

  const vertexShader = `
    uniform float uTime;
    uniform float uAmplitude;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 pos = position;
      float wave1 = sin((pos.x + uTime * 0.6) * 2.0) * 0.15;
      float wave2 = cos((pos.y * 1.2 + uTime) * 3.0) * 0.1;
      float wave3 = sin((pos.x * 2.4 - uTime * 0.7) + pos.y * 1.7) * 0.08;
      pos.z += (wave1 + wave2 + wave3) * uAmplitude;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;
  const fragmentShader = `
    precision highp float;
    uniform float uTime;
    uniform sampler2D uTex;
    uniform vec2 uMouse;
    varying vec2 vUv;
    void main() {
      float t = uTime * 0.2;
      vec2 p = vUv * 2.0 - 1.0;
      float dist = distance(vUv, uMouse);
      float mouseMask = exp(-dist * 18.0); // strong near mouse, fades out
      float baseWave = sin(8.0 * p.x + t) * 0.01 + cos(8.0 * p.y - t) * 0.01;
      float mouseWave = sin(18.0 * p.x + t * 2.0) * 0.03 * mouseMask;
      vec2 uv = vUv + baseWave * p + mouseWave * (p - (uMouse - 0.5));
      vec4 texColor = texture2D(uTex, uv);
      gl_FragColor = texColor;
    }
  `;
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    side: 0, // FrontSide
    transparent: true,
  });
  const mesh = new Mesh(geometry, material);
  scene.add(mesh);

  // Mouse interaction
  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    uniforms.uMouse.value.set(x, 1.0 - y);
  }
  function onLeave() {
    uniforms.uMouse.value.set(-10, -10);
  }
  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("mouseleave", onLeave);

  const clock = new Clock();
  let rafId = 0;
  let isDisposed = false;

  function resizeToDisplaySize() {
    const displayWidth = canvas.clientWidth || width;
    const displayHeight = canvas.clientHeight || height;
    const needResize =
      canvas.width !== displayWidth || canvas.height !== displayHeight;
    if (needResize) {
      renderer.setSize(displayWidth, displayHeight, false);
      camera.left = -1.4;
      camera.right = 1.4;
      camera.top = 1;
      camera.bottom = -1;
      camera.updateProjectionMatrix();
    }
  }

  function render() {
    if (isDisposed) return;
    rafId = requestAnimationFrame(render);
    resizeToDisplaySize();
    uniforms.uTime.value += clock.getDelta();
    renderer.render(scene, camera);
  }

  render();

  function dispose() {
    isDisposed = true;
    cancelAnimationFrame(rafId);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    texture.dispose();
    canvas.removeEventListener("mousemove", onMove);
    canvas.removeEventListener("mouseleave", onLeave);
  }

  return dispose;
}
