// RetailerOS — Hero: "The Living Shelf"
// -----------------------------------------------------------------------------
// A calm field of rounded tiles (shelves / SKUs / counters) that breathes like
// a slow tide. Every few hundred milliseconds one tile lifts and warms to the
// accent colour — a sale, a restock, a payment — then settles back.
// Message: every counter, every shelf, live — in one system.
//
// Usage:
//   <div class="hero-canvas" data-ros-hero></div>
//   <script type="module">
//     import { mountHero } from './js/hero-shelf.js';
//     mountHero(document.querySelector('[data-ros-hero]'));
//   </script>
//
// Cost: one InstancedMesh (≈1.1k instances, 1 draw call), no shadows, no post.
// Pauses off-screen and in background tabs; static frame for reduced motion.
// -----------------------------------------------------------------------------
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const css = (el, name, fallback) => getComputedStyle(el).getPropertyValue(name).trim() || fallback;

export function mountHero(container, opts = {}) {
  const {
    cols = 42,
    rows = 30,
    pingEvery = 220, // ms between "sales"
    pingLife = 1.8, // seconds a ping lasts
  } = opts;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- renderer / scene ------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 120);
  const camBase = new THREE.Vector3(0, 8.5, 21);
  const lookAt = new THREE.Vector3(0, -0.6, -4);
  camera.position.copy(camBase);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1.6);
  const key = new THREE.DirectionalLight(0xfff3e6, 2.2);
  key.position.set(-8, 14, 6);
  const rim = new THREE.DirectionalLight(0xffffff, 0.6);
  rim.position.set(10, 4, -12);
  scene.add(hemi, key, rim);

  // ---- tiles -----------------------------------------------------------------
  const geo = new RoundedBoxGeometry(0.84, 0.2, 0.84, 3, 0.07);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0.02 });
  const count = cols * rows;
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);

  const pos = new Float32Array(count * 2); // x, z
  const shade = new Float32Array(count); // subtle per-tile variation
  const phase = new Float32Array(count).fill(-1); // ping phase 0..1, -1 = idle
  for (let r = 0, i = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++, i++) {
      pos[i * 2] = (c - (cols - 1) / 2) * 1.0;
      pos[i * 2 + 1] = (r - rows + 13) * 1.0; // runs from under the camera to the fog line
      shade[i] = (Math.random() - 0.5) * 0.06;
    }
  }

  // ---- theme -----------------------------------------------------------------
  const C = { paper: new THREE.Color(), tile: new THREE.Color(), accent: new THREE.Color(), tmp: new THREE.Color() };
  const readTheme = () => {
    C.paper.set(css(container, '--ros-paper', '#f5f2ec'));
    C.tile.set(css(container, '--ros-paper-2', '#ebe6dc'));
    C.accent.set(css(container, '--ros-accent', '#e0602f'));
    scene.background = C.paper.clone();
    scene.fog = new THREE.Fog(C.paper, 16, 44);
    const dark = C.paper.getHSL({}).l < 0.3;
    hemi.intensity = dark ? 0.7 : 1.6;
    key.intensity = dark ? 1.1 : 2.2;
  };
  readTheme();
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener?.('change', readTheme);
  new MutationObserver(readTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ---- interaction -----------------------------------------------------------
  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector2();
  const onMove = (e) => {
    const r = container.getBoundingClientRect();
    pointerTarget.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  // ---- sizing ----------------------------------------------------------------
  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the field filling narrow (mobile) screens
    camera.fov = w / h < 1 ? 40 : 28;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // ---- frame -----------------------------------------------------------------
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3(1, 1, 1);
  const p = new THREE.Vector3();
  let t = 0;
  let lastPing = 0;

  const ping = () => {
    // bias pings toward the visible front-centre of the field
    for (let tries = 0; tries < 6; tries++) {
      const c = Math.floor(cols / 2 + (Math.random() - 0.5) * cols * 0.8);
      const r = Math.floor(rows - 3 - Math.random() * rows * 0.65);
      const i = r * cols + c;
      if (i >= 0 && i < count && phase[i] < 0) {
        phase[i] = 0;
        return;
      }
    }
  };

  const update = (dt) => {
    t += dt;
    for (let i = 0; i < count; i++) {
      const x = pos[i * 2];
      const z = pos[i * 2 + 1];
      let y = Math.sin(x * 0.22 + t * 0.55) * Math.cos(z * 0.2 + t * 0.35) * 0.32 + Math.sin((x + z) * 0.1 - t * 0.3) * 0.12;

      let glow = 0;
      if (phase[i] >= 0) {
        phase[i] += dt / pingLife;
        if (phase[i] >= 1) phase[i] = -1;
        else {
          const k = Math.sin(Math.PI * phase[i]);
          y += k * k * 0.75;
          glow = Math.pow(k, 0.9);
        }
      }
      p.set(x, y, z);
      m4.compose(p, q, s);
      mesh.setMatrixAt(i, m4);

      C.tmp.copy(C.tile).offsetHSL(0, 0, shade[i]).lerp(C.accent, glow);
      mesh.setColorAt(i, C.tmp);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    pointer.lerp(pointerTarget, Math.min(1, dt * 2.5));
    camera.position.set(camBase.x + pointer.x * 1.4, camBase.y - pointer.y * 0.6, camBase.z);
    camera.lookAt(lookAt);
  };

  // ---- loop with visibility gating ------------------------------------------
  let running = false;
  let raf = 0;
  let prev = performance.now();
  const tick = (now) => {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    if (now - lastPing > pingEvery) {
      lastPing = now;
      ping();
    }
    update(dt);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (running || reduce) return;
    running = true;
    prev = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  if (reduce) {
    // a composed still: a handful of lit tiles, no motion
    for (let k = 0; k < 14; k++) ping();
    for (let i = 0; i < count; i++) if (phase[i] >= 0) phase[i] = 0.35 + Math.random() * 0.3;
    update(0);
    renderer.render(scene, camera);
    ro.disconnect();
    new ResizeObserver(() => {
      resize();
      renderer.render(scene, camera);
    }).observe(container);
  }

  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.01 });
  io.observe(container);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);

  return {
    renderer,
    dispose() {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
