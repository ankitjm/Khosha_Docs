// RetailerOS — "The Stack" (Spline-style 3D object, built in Three.js)
// -----------------------------------------------------------------------------
// Three soft, rounded slabs float in a slow bob — a clay accent top, a glass
// middle with stock "bins" visible inside, and a solid base. As the section
// scrolls into the centre of the screen (or on hover) the stack unfolds and
// HTML labels track each layer. Reads as: one OS, three layers working together.
//
// Usage:
//   <div class="ros-stack" data-ros-stack>
//     <div class="ros-stack-label" data-layer="0">Sell — POS & online store</div>
//     <div class="ros-stack-label" data-layer="1">Stock — inventory & marketplaces</div>
//     <div class="ros-stack-label" data-layer="2">Books — accounting & GST</div>
//   </div>
//   import { mountStack } from './js/layers-stack.js'; mountStack(el);
//
// Why not Spline itself? A Spline runtime is ~600 KB+ and a scene export on top.
// This gets the same soft-clay/glass look for ~25 lines of materials, themed by
// the same CSS tokens, at a fraction of the weight.
// -----------------------------------------------------------------------------
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const css = (el, name, fallback) => getComputedStyle(el).getPropertyValue(name).trim() || fallback;

export function mountStack(container) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  camera.position.set(0, 4.2, 9.2);
  camera.lookAt(0, 0, 0);

  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(-3, 6, 4);
  scene.add(key);

  // ---- materials (themed) ------------------------------------------------------
  const clay = new THREE.MeshPhysicalMaterial({ roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.35 });
  const glass = new THREE.MeshPhysicalMaterial({
    roughness: 0.08,
    transmission: 1,
    thickness: 0.9,
    ior: 1.45,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    attenuationDistance: 2.5,
  });
  const base = new THREE.MeshPhysicalMaterial({ roughness: 0.7, clearcoat: 0.15, clearcoatRoughness: 0.5 });
  const chip = new THREE.MeshStandardMaterial({ roughness: 0.6 });
  const bin = new THREE.MeshStandardMaterial({ roughness: 0.5 });

  const readTheme = () => {
    const paper = new THREE.Color(css(container, '--ros-paper', '#f5f2ec'));
    const accent = new THREE.Color(css(container, '--ros-accent', '#e0602f'));
    const ink = new THREE.Color(css(container, '--ros-ink', '#16171b'));
    const dark = paper.getHSL({}).l < 0.3;
    clay.color.copy(accent);
    glass.color.copy(paper).lerp(new THREE.Color('#ffffff'), 0.6);
    glass.attenuationColor.copy(paper);
    // warm stone base in light mode (reads soft through the glass), graphite in dark
    base.color.copy(dark ? new THREE.Color('#2a2b30') : new THREE.Color(css(container, '--ros-paper-2', '#ebe6dc')).lerp(ink, 0.12));
    // transmission samples what's behind the glass, so give the scene the section colour
    scene.background = new THREE.Color(css(container, '--ros-paper-2', '#ebe6dc'));
    chip.color.copy(paper);
    bin.color.copy(accent).lerp(paper, 0.35);
    for (const m of [clay, glass, base, chip, bin]) m.envMapIntensity = dark ? 0.55 : 1;
  };
  readTheme();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', readTheme);
  new MutationObserver(readTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });

  // ---- geometry ----------------------------------------------------------------
  const W = 3.4;
  const D = 2.4;
  const H = 0.28;
  const slabGeo = new RoundedBoxGeometry(W, H, D, 6, 0.13);

  const rig = new THREE.Group();
  rig.rotation.set(0, -0.62, 0);
  scene.add(rig);

  const top = new THREE.Mesh(slabGeo, clay);
  const mid = new THREE.Mesh(slabGeo, glass);
  const bot = new THREE.Mesh(slabGeo, base);
  const slabs = [top, mid, bot];
  rig.add(top, mid, bot);

  // top: three UI "chips" — a till, a screen, a key
  const chipGeo = new RoundedBoxGeometry(0.62, 0.06, 0.62, 3, 0.03);
  [-0.95, 0, 0.95].forEach((x, i) => {
    const m = new THREE.Mesh(i === 1 ? new RoundedBoxGeometry(0.9, 0.06, 0.62, 3, 0.03) : chipGeo, chip);
    m.position.set(x, H / 2 + 0.03, -0.35);
    top.add(m);
  });
  const bar = new THREE.Mesh(new RoundedBoxGeometry(2.6, 0.05, 0.22, 3, 0.025), chip);
  bar.position.set(0, H / 2 + 0.025, 0.55);
  top.add(bar);

  // mid: stock bins inside the glass
  const binGeo = new RoundedBoxGeometry(0.42, 0.12, 0.42, 2, 0.04);
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 5; c++) {
      const b = new THREE.Mesh(binGeo, bin);
      b.position.set((c - 2) * 0.6, 0, (r - 0.5) * 0.9);
      mid.add(b);
    }

  // soft contact shadow (canvas radial gradient — no shadow maps)
  const sc = document.createElement('canvas');
  sc.width = sc.height = 128;
  const g = sc.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.32)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 3.4),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  // ---- labels ------------------------------------------------------------------
  const labels = [...container.querySelectorAll('[data-layer]')];
  const anchor = new THREE.Vector3();
  const corners = [[W / 2, D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [-W / 2, -D / 2]];

  // ---- interaction ---------------------------------------------------------------
  const tilt = new THREE.Vector2();
  const tiltTarget = new THREE.Vector2();
  let hover = false;
  container.addEventListener('pointermove', (e) => {
    const r = container.getBoundingClientRect();
    tiltTarget.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
  });
  container.addEventListener('pointerenter', () => (hover = true));
  container.addEventListener('pointerleave', () => {
    hover = false;
    tiltTarget.set(0, 0);
  });

  const scrollOpen = () => {
    const r = container.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const centre = r.top + r.height / 2;
    return THREE.MathUtils.clamp(1 - Math.abs(centre - vh / 2) / (vh * 0.55), 0, 1);
  };

  let narrow = false;
  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    narrow = w < 600;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 1 ? 14.5 : 9.6;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(() => {
    resize();
    if (!running) frame(0);
  });
  ro.observe(container);
  resize();

  // ---- frame -------------------------------------------------------------------
  let t = 0;
  let open = reduce ? 0.7 : 0;
  const frame = (dt) => {
    t += dt;
    const target = reduce ? 0.7 : Math.max(scrollOpen(), hover ? 1 : 0);
    open += (target - open) * Math.min(1, dt * 3);
    const gap = 0.42 + open * 0.62;
    const bob = reduce ? 0 : Math.sin(t * 0.9) * 0.07;

    top.position.y = gap + bob * 1.4;
    mid.position.y = 0 + bob;
    bot.position.y = -gap + bob * 0.6;
    rig.position.y = narrow ? -0.15 : 0.25;
    rig.position.x = narrow ? -0.7 : -0.45; // leave room on the right for labels

    tilt.lerp(tiltTarget, Math.min(1, dt * 3));
    rig.rotation.y = -0.62 + tilt.x * 0.18 + (reduce ? 0 : Math.sin(t * 0.25) * 0.04);
    rig.rotation.x = tilt.y * 0.08;

    shadow.position.set(rig.position.x, rig.position.y - gap - 0.55, 0);
    shadow.material.opacity = 0.75 - bob * 2;
    shadow.scale.setScalar(1 + open * 0.08);

    renderer.render(scene, camera);

    // labels follow the right edge of each slab
    const w = container.clientWidth;
    const h = container.clientHeight;
    // x: clear of the right-most corner of the whole stack; y: centre of each slab
    let maxX = -Infinity;
    for (const s of slabs)
      for (const [cx, cz] of corners) {
        anchor.set(cx, 0, cz);
        s.localToWorld(anchor).project(camera);
        maxX = Math.max(maxX, anchor.x);
      }
    const x0 = (maxX * 0.5 + 0.5) * w + 12;
    labels.forEach((el) => {
      const x = Math.min(x0, w - el.offsetWidth - 4);
      const s = slabs[+el.dataset.layer];
      if (!s) return;
      anchor.set(0, 0, 0);
      s.localToWorld(anchor).project(camera);
      const y = (-anchor.y * 0.5 + 0.5) * h;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(0, -50%)`;
      el.style.opacity = String(0.35 + open * 0.65);
    });
  };

  let running = false;
  let raf = 0;
  let prev = 0;
  const tick = (now) => {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    frame(dt);
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
  frame(0.016);
  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.01 });
  io.observe(container);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  return {
    dispose() {
      stop();
      io.disconnect();
      ro.disconnect();
      renderer.dispose();
      pmrem.dispose();
      renderer.domElement.remove();
    },
  };
}
