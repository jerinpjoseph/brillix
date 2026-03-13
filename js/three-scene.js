/* ========================================
   Brillix Technologies - Advanced Three.js
   Custom shaders, morphing geometry,
   mouse-reactive particles, full-page field
   ======================================== */

/* ----- Shared Utilities ----- */
const BrillixVFX = {
  mouse: { x: 0, y: 0, targetX: 0, targetY: 0 },
  scroll: 0,
  isMobile: window.innerWidth < 768,
  dpr: Math.min(window.devicePixelRatio, 2),
  scenes: {}
};

// Global mouse tracking with smooth interpolation
if (!BrillixVFX.isMobile) {
  window.addEventListener('mousemove', (e) => {
    BrillixVFX.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    BrillixVFX.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  });
}

window.addEventListener('scroll', () => {
  BrillixVFX.scroll = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
});


/* =====================================================
   SCENE 1 : Full-Page Particle Background
   Spans entire page, particles react to mouse + scroll
   ===================================================== */
function initGlobalParticles(canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(BrillixVFX.dpr);

  const count = BrillixVFX.isMobile ? 2000 : 5000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);   // velocity for drift
  const basePos = new Float32Array(count * 3); // original positions
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);     // phase offset per particle

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 60;
    const y = (Math.random() - 0.5) * 120; // tall spread for scrolling
    const z = (Math.random() - 0.5) * 30;
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
    basePos[i * 3] = x;
    basePos[i * 3 + 1] = y;
    basePos[i * 3 + 2] = z;
    vel[i * 3] = (Math.random() - 0.5) * 0.002;
    vel[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
    vel[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    sizes[i] = Math.random() * 2.0 + 0.5;
    phases[i] = Math.random() * Math.PI * 2;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  // Custom shader for glowing depth particles
  const vertexShader = `
    attribute float aSize;
    attribute float aPhase;
    uniform float uTime;
    uniform float uMouse;
    varying float vAlpha;
    varying float vDist;

    void main() {
      vec3 p = position;

      // Gentle wave motion
      p.x += sin(uTime * 0.3 + aPhase) * 0.15;
      p.y += cos(uTime * 0.2 + aPhase * 1.3) * 0.15;
      p.z += sin(uTime * 0.25 + aPhase * 0.7) * 0.1;

      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      float dist = length(mvPosition.xyz);

      // Size attenuation with depth
      gl_PointSize = aSize * (120.0 / dist) * (0.8 + sin(uTime + aPhase) * 0.2);
      gl_Position = projectionMatrix * mvPosition;

      // Fade with depth — keep subtle so text is readable
      vAlpha = smoothstep(50.0, 5.0, dist) * (0.2 + sin(uTime * 0.5 + aPhase) * 0.15);
      vDist = dist;
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform float uTime;
    varying float vAlpha;
    varying float vDist;

    void main() {
      // Soft circular particle
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;

      float glow = 1.0 - smoothstep(0.0, 0.5, d);
      glow = pow(glow, 1.5);

      // Color mix based on depth
      float mix1 = smoothstep(5.0, 40.0, vDist);
      vec3 color = mix(uColor2, uColor1, mix1);

      gl_FragColor = vec4(color, glow * vAlpha);
    }
  `;

  const mat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: 0 },
      uColor1: { value: new THREE.Color(0x6FA0BB) },
      uColor2: { value: new THREE.Color(0x00D4FF) }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  let animId;
  const clock = new THREE.Clock();

  function animate() {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Smooth mouse lerp
    BrillixVFX.mouse.x += (BrillixVFX.mouse.targetX - BrillixVFX.mouse.x) * 0.03;
    BrillixVFX.mouse.y += (BrillixVFX.mouse.targetY - BrillixVFX.mouse.y) * 0.03;

    mat.uniforms.uTime.value = t;

    // Camera follows mouse subtly
    camera.position.x += (BrillixVFX.mouse.x * 3 - camera.position.x) * 0.02;
    camera.position.y += (BrillixVFX.mouse.y * 2 - camera.position.y) * 0.02;

    // Scroll-based camera movement (parallax depth)
    camera.position.y += (-BrillixVFX.scroll * 40 - camera.position.y) * 0.05;

    camera.lookAt(0, camera.position.y * 0.5, 0);

    // Subtle rotation
    points.rotation.y = t * 0.01;

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(animId);
    else animate();
  });

  BrillixVFX.scenes.global = { scene, camera, renderer };
}


/* =====================================================
   SCENE 2 : Hero — Morphing Particle Sphere
   Particles morph between sphere → torus → helix
   Interactive mouse displacement & glow
   ===================================================== */
function initHeroScene(canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.z = 7;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(BrillixVFX.dpr);

  const count = BrillixVFX.isMobile ? 1500 : 4000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const spherePos = new Float32Array(count * 3);
  const torusPos = new Float32Array(count * 3);
  const helixPos = new Float32Array(count * 3);
  const aRand = new Float32Array(count);
  const aPhase = new Float32Array(count);

  // Generate 3 target shapes
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    aRand[i] = Math.random();
    aPhase[i] = Math.random() * Math.PI * 2;

    // Sphere
    const phi = Math.acos(1 - 2 * (i + 0.5) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const sR = 2.0 + (Math.random() - 0.5) * 0.15;
    spherePos[i * 3]     = sR * Math.sin(phi) * Math.cos(theta);
    spherePos[i * 3 + 1] = sR * Math.sin(phi) * Math.sin(theta);
    spherePos[i * 3 + 2] = sR * Math.cos(phi);

    // Torus
    const tTheta = (i / count) * Math.PI * 2 * 8;
    const tPhi = (i / count) * Math.PI * 2 * 40;
    const tR = 1.8;
    const tube = 0.7 + (Math.random() - 0.5) * 0.1;
    torusPos[i * 3]     = (tR + tube * Math.cos(tPhi)) * Math.cos(tTheta);
    torusPos[i * 3 + 1] = (tR + tube * Math.cos(tPhi)) * Math.sin(tTheta);
    torusPos[i * 3 + 2] = tube * Math.sin(tPhi);

    // DNA Double Helix
    const hT = (i / count) * Math.PI * 12 - Math.PI * 6;
    const strand = i % 2 === 0 ? 1 : -1;
    const hR = 1.2;
    helixPos[i * 3]     = Math.cos(hT) * hR * strand;
    helixPos[i * 3 + 1] = hT * 0.3;
    helixPos[i * 3 + 2] = Math.sin(hT) * hR * strand;

    // Start at sphere
    pos[i * 3]     = spherePos[i * 3];
    pos[i * 3 + 1] = spherePos[i * 3 + 1];
    pos[i * 3 + 2] = spherePos[i * 3 + 2];
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSpherePos', new THREE.BufferAttribute(spherePos, 3));
  geo.setAttribute('aTorusPos', new THREE.BufferAttribute(torusPos, 3));
  geo.setAttribute('aHelixPos', new THREE.BufferAttribute(helixPos, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(aRand, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));

  const vertexShader = `
    attribute vec3 aSpherePos;
    attribute vec3 aTorusPos;
    attribute vec3 aHelixPos;
    attribute float aRand;
    attribute float aPhase;

    uniform float uTime;
    uniform float uMorph;       // 0=sphere, 1=torus, 2=helix
    uniform vec2 uMouse;
    uniform float uMouseRadius;

    varying float vAlpha;
    varying float vColorMix;

    // Smooth interpolation between 3 shapes
    vec3 getTarget(float morph) {
      if (morph < 1.0) {
        return mix(aSpherePos, aTorusPos, morph);
      } else {
        return mix(aTorusPos, aHelixPos, morph - 1.0);
      }
    }

    void main() {
      float m = mod(uMorph, 3.0);
      vec3 target;
      if (m < 1.0) target = mix(aSpherePos, aTorusPos, m);
      else if (m < 2.0) target = mix(aTorusPos, aHelixPos, m - 1.0);
      else target = mix(aHelixPos, aSpherePos, m - 2.0);

      // Add noise displacement
      vec3 p = target;
      p += sin(uTime * 0.5 + aPhase * 6.28) * 0.04 * aRand;

      // Mouse displacement — push particles away from cursor ray
      vec4 worldPos = modelMatrix * vec4(p, 1.0);
      vec4 viewPos = viewMatrix * worldPos;
      vec2 screenPos = viewPos.xy / -viewPos.z;
      float mouseDist = length(screenPos - uMouse * 1.5);
      float mouseForce = smoothstep(uMouseRadius, 0.0, mouseDist) * 0.8;

      // Push away in view space
      vec2 pushDir = normalize(screenPos - uMouse * 1.5 + 0.001);
      p.x += pushDir.x * mouseForce * 0.5;
      p.y += pushDir.y * mouseForce * 0.5;
      p.z += mouseForce * 0.3;

      vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
      float dist = length(mvPos.xyz);

      gl_PointSize = (0.8 + aRand * 1.2) * (80.0 / dist);
      gl_PointSize *= 1.0 + mouseForce * 1.0;
      gl_Position = projectionMatrix * mvPos;

      vAlpha = (0.25 + aRand * 0.25) * smoothstep(15.0, 2.0, dist);
      vAlpha += mouseForce * 0.2;
      vColorMix = aRand + mouseForce;
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    varying float vAlpha;
    varying float vColorMix;

    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;

      // Glowing particle with soft edge
      float glow = 1.0 - smoothstep(0.0, 0.5, d);
      glow = pow(glow, 2.5);

      // Color blend — no white, stay in brand colors
      vec3 color = mix(uColor1, uColor2, vColorMix);

      gl_FragColor = vec4(color, glow * vAlpha * 0.7);
    }
  `;

  const mat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseRadius: { value: 0.6 },
      uColor1: { value: new THREE.Color(0x6FA0BB) },
      uColor2: { value: new THREE.Color(0x00D4FF) },
      uColor3: { value: new THREE.Color(0xFFFFFF) }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // Glowing wireframe rings
  for (let i = 0; i < 3; i++) {
    const ringGeo = new THREE.TorusGeometry(2.2 + i * 0.3, 0.005, 8, 128);
    const ringMat = new THREE.MeshBasicMaterial({
      color: i === 0 ? 0x00D4FF : 0x6FA0BB,
      transparent: true,
      opacity: 0.04 - i * 0.01,
      wireframe: true
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2 + i * 0.3;
    ring.rotation.z = i * 0.5;
    ring.userData = { speed: 0.1 + i * 0.05, axis: i };
    scene.add(ring);
  }

  // Central glow core
  const coreGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x00D4FF,
    transparent: true,
    opacity: 0.015
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  const clock = new THREE.Clock();
  let animId;
  let morphTarget = 0;
  let morphCurrent = 0;

  // Cycle morph target every 6 seconds
  setInterval(() => {
    morphTarget = (morphTarget + 1) % 3;
  }, 6000);

  function animate() {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Smooth morph transition
    morphCurrent += (morphTarget - morphCurrent) * 0.008;

    mat.uniforms.uTime.value = t;
    mat.uniforms.uMorph.value = morphCurrent;
    mat.uniforms.uMouse.value.set(BrillixVFX.mouse.x, BrillixVFX.mouse.y);

    // Slow base rotation
    points.rotation.y = t * 0.05;
    points.rotation.x = Math.sin(t * 0.1) * 0.1;

    // Mouse influence on rotation
    points.rotation.y += BrillixVFX.mouse.x * 0.15;
    points.rotation.x += BrillixVFX.mouse.y * 0.1;

    // Animate rings
    scene.children.forEach(child => {
      if (child.userData && child.userData.speed) {
        child.rotation.z += child.userData.speed * 0.01;
        child.rotation.x += child.userData.speed * 0.005;
      }
    });

    // Core pulse
    const pulse = 1 + Math.sin(t * 2) * 0.1;
    core.scale.setScalar(pulse);
    coreMat.opacity = 0.02 + Math.sin(t * 1.5) * 0.015;

    renderer.render(scene, camera);
  }

  animate();

  function onResize() {
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(animId);
    else animate();
  });

  BrillixVFX.scenes.hero = { scene, camera, renderer, mat, points };
}


/* =====================================================
   SCENE 3 : About — Holographic Cube Assembly
   Fragments assemble into cube, explode, reassemble
   ===================================================== */
function initAboutScene(canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.z = 6;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(BrillixVFX.dpr);

  const group = new THREE.Group();
  scene.add(group);

  // Outer wireframe cubes — nested with different sizes
  const cubeConfigs = [
    { size: 2.0, color: 0x6FA0BB, opacity: 0.5, speed: 1 },
    { size: 1.5, color: 0x00D4FF, opacity: 0.35, speed: -1.4 },
    { size: 1.0, color: 0x00D4FF, opacity: 0.2, speed: 0.8 },
    { size: 2.5, color: 0x4F7F9A, opacity: 0.12, speed: -0.5 }
  ];

  const cubes = cubeConfigs.map(cfg => {
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(cfg.size, cfg.size, cfg.size));
    const mat = new THREE.LineBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: cfg.opacity
    });
    const mesh = new THREE.LineSegments(edges, mat);
    mesh.userData = { speed: cfg.speed, baseMat: mat };
    group.add(mesh);
    return mesh;
  });

  // Floating data points around cube
  const dpCount = BrillixVFX.isMobile ? 300 : 600;
  const dpGeo = new THREE.BufferGeometry();
  const dpPos = new Float32Array(dpCount * 3);
  const dpSizes = new Float32Array(dpCount);
  const dpPhase = new Float32Array(dpCount);

  for (let i = 0; i < dpCount; i++) {
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.random() * Math.PI * 2;
    const r = 1.5 + Math.random() * 2.0;
    dpPos[i * 3]     = r * Math.sin(angle1) * Math.cos(angle2);
    dpPos[i * 3 + 1] = r * Math.sin(angle1) * Math.sin(angle2);
    dpPos[i * 3 + 2] = r * Math.cos(angle1);
    dpSizes[i] = Math.random() * 2 + 0.5;
    dpPhase[i] = Math.random() * Math.PI * 2;
  }

  dpGeo.setAttribute('position', new THREE.BufferAttribute(dpPos, 3));
  dpGeo.setAttribute('aSize', new THREE.BufferAttribute(dpSizes, 1));

  const dpVertShader = `
    attribute float aSize;
    uniform float uTime;
    varying float vAlpha;

    void main() {
      vec3 p = position;
      p.x += sin(uTime * 0.4 + position.y * 2.0) * 0.1;
      p.y += cos(uTime * 0.3 + position.x * 2.0) * 0.1;

      vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = aSize * (80.0 / length(mvPos.xyz));
      gl_Position = projectionMatrix * mvPos;

      vAlpha = smoothstep(12.0, 2.0, length(mvPos.xyz)) * 0.6;
    }
  `;

  const dpFragShader = `
    uniform vec3 uColor;
    varying float vAlpha;

    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      float glow = pow(1.0 - d * 2.0, 2.0);
      gl_FragColor = vec4(uColor, glow * vAlpha);
    }
  `;

  const dpMat = new THREE.ShaderMaterial({
    vertexShader: dpVertShader,
    fragmentShader: dpFragShader,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0x00D4FF) }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const dataPoints = new THREE.Points(dpGeo, dpMat);
  group.add(dataPoints);

  // Energy lines — orbital rings
  for (let i = 0; i < 3; i++) {
    const curve = new THREE.EllipseCurve(0, 0, 2.0 + i * 0.4, 1.8 + i * 0.3, 0, Math.PI * 2, false, 0);
    const pts = curve.getPoints(100);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(p.x, 0, p.y)));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00D4FF,
      transparent: true,
      opacity: 0.06 + i * 0.02,
      blending: THREE.AdditiveBlending
    });
    const line = new THREE.Line(lineGeo, lineMat);
    line.rotation.x = Math.PI * 0.3 * i;
    line.rotation.z = Math.PI * 0.2 * i;
    line.userData = { orbitSpeed: 0.2 + i * 0.1 };
    group.add(line);
  }

  const clock = new THREE.Clock();
  let animId;
  let isVisible = false;

  function animate() {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    dpMat.uniforms.uTime.value = t;

    // Rotate cubes at different speeds
    cubes.forEach((cube, i) => {
      const s = cube.userData.speed;
      cube.rotation.x += s * 0.003;
      cube.rotation.y += s * 0.004;
      cube.rotation.z += s * 0.001;

      // Pulse opacity
      cube.userData.baseMat.opacity = cubeConfigs[i].opacity * (0.7 + Math.sin(t * 0.8 + i) * 0.3);
    });

    // Mouse interaction
    group.rotation.y += (BrillixVFX.mouse.x * 0.5 - group.rotation.y) * 0.03;
    group.rotation.x += (BrillixVFX.mouse.y * 0.3 - group.rotation.x) * 0.03;

    // Data points orbit
    dataPoints.rotation.y += 0.001;
    dataPoints.rotation.x = Math.sin(t * 0.2) * 0.1;

    // Orbit rings
    group.children.forEach(child => {
      if (child.userData && child.userData.orbitSpeed) {
        child.rotation.y += child.userData.orbitSpeed * 0.005;
      }
    });

    renderer.render(scene, camera);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isVisible) {
        isVisible = true;
        animate();
      } else if (!entry.isIntersecting && isVisible) {
        isVisible = false;
        cancelAnimationFrame(animId);
      }
    });
  }, { threshold: 0.1 });

  observer.observe(canvas);

  window.addEventListener('resize', () => {
    const w = canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || 400;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  BrillixVFX.scenes.about = { scene, camera, renderer };
}


/* =====================================================
   SCENE 4 : Services — Floating Icosahedron Grid
   Shows behind service cards
   ===================================================== */
function initServicesScene(canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.z = 12;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(BrillixVFX.dpr);

  // Floating geometric shapes
  const shapes = [];
  const shapeCount = BrillixVFX.isMobile ? 8 : 15;

  for (let i = 0; i < shapeCount; i++) {
    const type = i % 3;
    let geom;
    if (type === 0) geom = new THREE.IcosahedronGeometry(0.4 + Math.random() * 0.3, 0);
    else if (type === 1) geom = new THREE.OctahedronGeometry(0.3 + Math.random() * 0.3, 0);
    else geom = new THREE.TetrahedronGeometry(0.3 + Math.random() * 0.2, 0);

    const edges = new THREE.EdgesGeometry(geom);
    const mat = new THREE.LineBasicMaterial({
      color: Math.random() > 0.5 ? 0x00D4FF : 0x6FA0BB,
      transparent: true,
      opacity: 0.12 + Math.random() * 0.08
    });

    const mesh = new THREE.LineSegments(edges, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 8
    );
    mesh.userData = {
      rotSpeed: { x: (Math.random() - 0.5) * 0.01, y: (Math.random() - 0.5) * 0.01 },
      floatSpeed: 0.3 + Math.random() * 0.5,
      floatOffset: Math.random() * Math.PI * 2,
      baseY: mesh.position.y
    };

    scene.add(mesh);
    shapes.push(mesh);
  }

  let animId;
  let isVisible = false;
  const clock = new THREE.Clock();

  function animate() {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    shapes.forEach(shape => {
      shape.rotation.x += shape.userData.rotSpeed.x;
      shape.rotation.y += shape.userData.rotSpeed.y;
      shape.position.y = shape.userData.baseY + Math.sin(t * shape.userData.floatSpeed + shape.userData.floatOffset) * 0.5;
    });

    // Mouse parallax
    camera.position.x += (BrillixVFX.mouse.x * 2 - camera.position.x) * 0.02;
    camera.position.y += (BrillixVFX.mouse.y * 1 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isVisible) { isVisible = true; animate(); }
      else if (!entry.isIntersecting && isVisible) { isVisible = false; cancelAnimationFrame(animId); }
    });
  }, { threshold: 0.05 });

  observer.observe(canvas);

  window.addEventListener('resize', () => {
    camera.aspect = canvas.parentElement.clientWidth / canvas.parentElement.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight);
  });
}


/* =====================================================
   SCENE 5 : Technologies — Orbital Particle Ring
   Particles orbit in a ring behind tech grid
   ===================================================== */
function initTechScene(canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.z = 8;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(BrillixVFX.dpr);

  // Particle ring
  const ringCount = BrillixVFX.isMobile ? 1000 : 3000;
  const ringGeo = new THREE.BufferGeometry();
  const ringPos = new Float32Array(ringCount * 3);
  const ringPhase = new Float32Array(ringCount);

  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * Math.PI * 2;
    const r = 3.5 + (Math.random() - 0.5) * 1.5;
    const y = (Math.random() - 0.5) * 0.8;
    ringPos[i * 3] = Math.cos(angle) * r;
    ringPos[i * 3 + 1] = y;
    ringPos[i * 3 + 2] = Math.sin(angle) * r;
    ringPhase[i] = Math.random() * Math.PI * 2;
  }

  ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
  ringGeo.setAttribute('aPhase', new THREE.BufferAttribute(ringPhase, 1));

  const ringVert = `
    attribute float aPhase;
    uniform float uTime;
    varying float vAlpha;

    void main() {
      vec3 p = position;
      float angle = atan(p.z, p.x) + uTime * 0.2;
      float r = length(p.xz);
      p.x = cos(angle) * r;
      p.z = sin(angle) * r;
      p.y += sin(uTime + aPhase * 6.28) * 0.15;

      vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = (1.0 + sin(uTime * 2.0 + aPhase * 6.28) * 0.5) * (60.0 / length(mvPos.xyz));
      gl_Position = projectionMatrix * mvPos;
      vAlpha = smoothstep(15.0, 3.0, length(mvPos.xyz)) * 0.5;
    }
  `;

  const ringFrag = `
    uniform vec3 uColor;
    varying float vAlpha;

    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      float glow = pow(1.0 - d * 2.0, 2.0);
      gl_FragColor = vec4(uColor, glow * vAlpha);
    }
  `;

  const ringMat = new THREE.ShaderMaterial({
    vertexShader: ringVert,
    fragmentShader: ringFrag,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0x00D4FF) }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  scene.add(new THREE.Points(ringGeo, ringMat));

  // Central wireframe sphere
  const centerEdges = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.2, 1));
  const centerMat = new THREE.LineBasicMaterial({ color: 0x6FA0BB, transparent: true, opacity: 0.1 });
  const centerMesh = new THREE.LineSegments(centerEdges, centerMat);
  scene.add(centerMesh);

  let animId;
  let isVisible = false;
  const clock = new THREE.Clock();

  function animate() {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    ringMat.uniforms.uTime.value = t;
    centerMesh.rotation.y += 0.003;
    centerMesh.rotation.x += 0.002;

    camera.position.x += (BrillixVFX.mouse.x * 1.5 - camera.position.x) * 0.015;
    camera.position.y += (BrillixVFX.mouse.y * 0.8 - camera.position.y) * 0.015;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isVisible) { isVisible = true; animate(); }
      else if (!entry.isIntersecting && isVisible) { isVisible = false; cancelAnimationFrame(animId); }
    });
  }, { threshold: 0.05 });

  observer.observe(canvas);

  window.addEventListener('resize', () => {
    camera.aspect = canvas.parentElement.clientWidth / canvas.parentElement.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight);
  });
}
