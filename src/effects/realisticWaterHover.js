import * as THREE from "three";

/**
 * Realistic water hover effect using 2-pass simulation (pressure/velocity + image distortion).
 * @param {HTMLCanvasElement} canvas
 * @param {{ imageUrl: string, width?: number, height?: number }} options
 * @returns {() => void} dispose
 */
export function realisticWaterHoverEffect(canvas, options = {}) {
  const {
    imageUrl,
    width = canvas.clientWidth || 512,
    height = canvas.clientHeight || 384,
    simulationSpeed = 1.0, // delta
    effectRadius = 20.0, // head radius
    headStrength = 1.0,
    tailStrength = 0.6,
    tailWidth = effectRadius,
  } = options;

  // Optimize resolution for smooth but fast performance
  const renderWidth = Math.min(width, 384);
  const renderHeight = Math.min(height, 288);
  if (!imageUrl) throw new Error("imageUrl is required");

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false, // Disable antialiasing for better performance
    alpha: true,
    powerPreference: "high-performance", // Use dedicated GPU if available
  });
  renderer.setPixelRatio(1); // Fixed pixel ratio for maximum performance
  renderer.setSize(renderWidth, renderHeight, false);
  renderer.setClearColor(0x000000, 0);

  // Render targets (ping-pong) - use optimized resolution
  const params = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    depthBuffer: false,
    stencilBuffer: false,
  };
  const rtA = new THREE.WebGLRenderTarget(renderWidth, renderHeight, params);
  const rtB = new THREE.WebGLRenderTarget(renderWidth, renderHeight, params);
  let ping = rtA,
    pong = rtB;

  // Load image texture
  const loader = new THREE.TextureLoader();
  const imageTex = loader.load(imageUrl);
  imageTex.colorSpace = THREE.SRGBColorSpace;
  imageTex.minFilter = THREE.LinearFilter;
  imageTex.magFilter = THREE.LinearFilter;
  imageTex.flipY = true;
  imageTex.generateMipmaps = false;

  // Mouse uniforms
  let mouse = new THREE.Vector4(-100, -100, 0, 0); // x, y, z=2.0 if hover, 0.0 if not
  const prevMouse = new THREE.Vector2(-100, -100);
  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    const renderWidth = canvas.width;
    const renderHeight = canvas.height;
    const x = ((e.clientX - rect.left) / rect.width) * renderWidth;
    const y =
      renderHeight - ((e.clientY - rect.top) / rect.height) * renderHeight;
    // update prev before setting current
    if (mouse.z > 1.0) {
      prevMouse.set(mouse.x, mouse.y);
    } else {
      prevMouse.set(x, y);
    }
    mouse.x = x;
    mouse.y = y;
    mouse.z = 2.0;
  }
  function onLeave() {
    mouse.x = -100;
    mouse.y = -100;
    mouse.z = 0.0;
  }
  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("mouseleave", onLeave);

  // Physics shader (pressure/velocity update)
  const physicsMaterial = new THREE.ShaderMaterial({
    uniforms: {
      iChannel0: { value: null },
      iMouse: { value: mouse },
      uPrevMouse: { value: prevMouse },
      iResolution: { value: new THREE.Vector2(renderWidth, renderHeight) },
      iFrame: { value: 0 },
      uDelta: { value: simulationSpeed },
      uRadius: { value: effectRadius },
      uHeadStrength: { value: headStrength },
      uTailStrength: { value: tailStrength },
      uTailWidth: { value: tailWidth },
    },
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
      uniform sampler2D iChannel0;
      uniform vec4 iMouse;
      uniform vec2 uPrevMouse;
      uniform vec2 iResolution;
      uniform int iFrame;
      uniform float uDelta;
      uniform float uRadius;
      uniform float uHeadStrength;
      uniform float uTailStrength;
      uniform float uTailWidth;

      float distanceToSegment(vec2 p, vec2 a, vec2 b) {
        vec2 ab = b - a;
        float denom = max(dot(ab, ab), 1e-6);
        float t = clamp(dot(p - a, ab) / denom, 0.0, 1.0);
        vec2 proj = a + t * ab;
        return distance(p, proj);
      }

      void main() {
        vec2 fragCoord = vUv * iResolution;
        if (iFrame == 0) { gl_FragColor = vec4(0.0); return; }

        vec4 prev = texture2D(iChannel0, vUv);
        float pressure = prev.x;
        float pVel = prev.y;

        vec2 texel = 1.0 / iResolution;
        float p_right = texture2D(iChannel0, vUv + vec2(texel.x, 0.0)).x;
        float p_left  = texture2D(iChannel0, vUv - vec2(texel.x, 0.0)).x;
        float p_up    = texture2D(iChannel0, vUv + vec2(0.0, texel.y)).x;
        float p_down  = texture2D(iChannel0, vUv - vec2(0.0, texel.y)).x;

        // Neumann-ish boundaries
        if (fragCoord.x <= 0.5) p_left = p_right;
        if (fragCoord.x >= iResolution.x - 0.5) p_right = p_left;
        if (fragCoord.y <= 0.5) p_down = p_up;
        if (fragCoord.y >= iResolution.y - 0.5) p_up = p_down;

        // Wave update
        pVel += uDelta * (-2.0 * pressure + p_right + p_left) * 0.25;
        pVel += uDelta * (-2.0 * pressure + p_up + p_down) * 0.25;
        pressure += uDelta * pVel;
        pVel -= 0.005 * uDelta * pressure;
        pVel *= 1.0 - 0.002 * uDelta;
        pressure *= 0.999;

        float gradX = (p_right - p_left) * 0.5;
        float gradY = (p_up - p_down) * 0.5;
        vec4 outCol = vec4(pressure, pVel, gradX, gradY);

        if (iMouse.z > 1.0) {
          // Head (current point) with smooth falloff
          float dist = distance(fragCoord, iMouse.xy);
          float headFall = smoothstep(uRadius, 0.0, dist);
          outCol.x += uHeadStrength * headFall;

          // Tail along movement segment with width and speed scaling
          float dseg = distanceToSegment(fragCoord, uPrevMouse, iMouse.xy);
          float tailFall = smoothstep(uTailWidth, 0.0, dseg);
          float speed = length(iMouse.xy - uPrevMouse); // pixels per frame
          float speedScale = clamp(speed * 0.02, 0.5, 3.0);
          outCol.x += uTailStrength * tailFall * speedScale;
        }

        gl_FragColor = outCol;
      }
    `,
  });

  // Display shader (image distortion)
  const displayMaterial = new THREE.ShaderMaterial({
    uniforms: {
      iChannel0: { value: null }, // physics buffer
      iChannel1: { value: imageTex }, // image
      iResolution: { value: new THREE.Vector2(renderWidth, renderHeight) },
    },
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
      uniform sampler2D iChannel0;
      uniform sampler2D iChannel1;
      uniform vec2 iResolution;
      void main() {
        vec2 uv = vUv;
        vec4 data = texture2D(iChannel0, uv);
        vec4 color = texture2D(iChannel1, uv + 0.2 * data.zw);
        
        // Add bright reflection without darkening
        vec3 normal = normalize(vec3(-data.z, 0.2, -data.w));
        float reflection = pow(max(0.0, dot(normal, normalize(vec3(-3.0, 10.0, 3.0)))), 60.0);
        
        // ADVANCED FILTER CUSTOMIZATION - Adjust these values:
        
        // 1. REFLECTION INTENSITY (0.0 = no reflection, 1.0 = full reflection)
        float reflectionIntensity = 0.5;
        
        // 2. REFLECTION COLOR (RGB values 0.0-1.0)
        vec3 reflectionColor = vec3(1.0, 1.0, 1.0); // White reflection
        
        // 3. CONTRAST CONTROL (1.0 = normal, 1.5 = high contrast, 0.5 = low contrast)
        float contrast = 1.0;
        
        // 4. SATURATION CONTROL (1.0 = normal, 1.5 = high saturation, 0.5 = low saturation)
        float saturation = 0.95;
        
        // 5. BRIGHTNESS CONTROL (1.0 = original, 1.5 = bright, 0.8 = dark)
        float brightness = 1.2;
        
        // 6. TINT CONTROL (RGB values 0.0-1.0)
        vec3 tint = vec3(1.0, 1.0, 1.0); // No tint
        
        // Apply reflection
        color.rgb += reflectionColor * reflectionIntensity * reflection;
        
        // Apply contrast
        color.rgb = (color.rgb - 0.5) * contrast + 0.5;
        
        // Apply saturation
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        color.rgb = mix(vec3(gray), color.rgb, saturation);
        
        // Apply brightness
        color.rgb *= brightness;
        
        // Apply tint
        color.rgb *= tint;
        
        // Clamp to prevent over-brightening
        color.rgb = min(color.rgb, vec3(1.0));
        
        gl_FragColor = color;
      }
    `,
  });

  // Fullscreen quad scene for both passes
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
  scene.add(quad);

  // Final output scene
  const finalScene = new THREE.Scene();
  const finalCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const finalQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    displayMaterial
  );
  finalScene.add(finalQuad);

  // Utility: resize canvas to display size (CSS * dpr)
  function resizeCanvasToDisplaySize(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(canvas.clientWidth * dpr);
    const height = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      return true;
    }
    return false;
  }

  let frame = 0;
  let disposed = false;
  function render() {
    if (disposed) return;
    // Resize logic
    if (resizeCanvasToDisplaySize(canvas)) {
      renderer.setSize(canvas.width, canvas.height, false);
      rtA.setSize(canvas.width, canvas.height);
      rtB.setSize(canvas.width, canvas.height);
      physicsMaterial.uniforms.iResolution.value.set(
        canvas.width,
        canvas.height
      );
      displayMaterial.uniforms.iResolution.value.set(
        canvas.width,
        canvas.height
      );
    }
    // Update uniforms for speed/radius/strengths (in case user changes them dynamically)
    physicsMaterial.uniforms.uDelta.value = simulationSpeed;
    physicsMaterial.uniforms.uRadius.value = effectRadius;
    physicsMaterial.uniforms.uHeadStrength.value = headStrength;
    physicsMaterial.uniforms.uTailStrength.value = tailStrength;
    physicsMaterial.uniforms.uTailWidth.value = tailWidth;
    physicsMaterial.uniforms.uPrevMouse.value.set(prevMouse.x, prevMouse.y);
    // Physics pass
    physicsMaterial.uniforms.iChannel0.value = ping.texture;
    physicsMaterial.uniforms.iMouse.value = mouse;
    physicsMaterial.uniforms.iFrame.value = frame;
    quad.material = physicsMaterial;
    renderer.setRenderTarget(pong);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    // Display pass
    displayMaterial.uniforms.iChannel0.value = pong.texture;
    renderer.render(finalScene, finalCamera);
    // Swap ping-pong
    let temp = ping;
    ping = pong;
    pong = temp;
    frame++;
    requestAnimationFrame(render);
  }
  render();

  function dispose() {
    disposed = true;
    canvas.removeEventListener("mousemove", onMove);
    canvas.removeEventListener("mouseleave", onLeave);
    rtA.dispose();
    rtB.dispose();
    imageTex.dispose();
    quad.geometry.dispose();
    finalQuad.geometry.dispose();
    physicsMaterial.dispose();
    displayMaterial.dispose();
    renderer.dispose();
  }
  return dispose;
}
