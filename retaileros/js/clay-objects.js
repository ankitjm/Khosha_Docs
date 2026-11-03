// RetailerOS — Clay objects (Spline-style 3D, built in Three.js)
// -----------------------------------------------------------------------------
// Small, soft 3D objects for feature cards, empty states and section accents:
//
//   'coin'   — a ₹ coin that turns slowly and flips on hover        (payments)
//   'parcel' — a taped parcel that hops and squashes on landing      (orders)
//   'bag'    — a shopping bag that sways on its handles              (store)
//
// Usage:
//   <div class="clay" data-ros-clay="coin"></div>
//   import { mountClay } from './js/clay-objects.js';
//   document.querySelectorAll('[data-ros-clay]').forEach((el) => mountClay(el, el.dataset.rosClay));
//
// Transparent background (sits on any surface), themed from the CSS tokens,
// pauses off-screen, static pose for reduced motion.
// -----------------------------------------------------------------------------
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const css = (el, name, fallback) => getComputedStyle(el).getPropertyValue(name).trim() || fallback;

function rupeeTexture(face, mark) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = face;
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = mark;
  g.globalAlpha = 0.55;
  g.lineWidth = 10;
  g.beginPath();
  g.arc(256, 256, 206, 0, Math.PI * 2);
  g.stroke();
  g.globalAlpha = 1;
  g.fillStyle = mark;
  g.font = '600 280px "Inter Tight", "Noto Sans", system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('₹', 256, 272);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function softShadow() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.30)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.6),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

export function mountClay(container, kind = 'coin') {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(-2, 4, 3);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 30);
  camera.position.set(0, 1.1, 6.2);
  camera.lookAt(0, 0.1, 0);

  const rig = new THREE.Group();
  scene.add(rig);
  const shadow = softShadow();
  shadow.position.y = -1.05;
  scene.add(shadow);

  // materials, themed below
  const clay = new THREE.MeshPhysicalMaterial({ roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.35 });
  const stone = new THREE.MeshPhysicalMaterial({ roughness: 0.6, clearcoat: 0.25, clearcoatRoughness: 0.5 });
  const ink = new THREE.MeshStandardMaterial({ roughness: 0.5 });
  const face = new THREE.MeshPhysicalMaterial({ roughness: 0.4, clearcoat: 0.6 });

  // ---- build the object --------------------------------------------------------
  let update = () => {};
  let hoverKick = 0;

  if (kind === 'coin') {
    const geo = new THREE.CylinderGeometry(0.95, 0.95, 0.2, 96, 1);
    const coin = new THREE.Mesh(geo, clay);
    coin.rotation.x = Math.PI / 2; // face the camera
    // faces are separate discs: cylinder caps use radial UVs, which would turn the ₹ sideways
    const discGeo = new THREE.CircleGeometry(0.88, 96);
    const front = new THREE.Mesh(discGeo, face);
    front.position.z = 0.102;
    const back = new THREE.Mesh(discGeo, face);
    back.position.z = -0.102;
    back.rotation.y = Math.PI;
    const holder = new THREE.Group();
    holder.add(coin, front, back);
    rig.add(holder);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.06, 16, 96), clay);
    holder.add(rim);
    let flip = 0;
    update = (t, dt) => {
      flip += (hoverKick - flip) * Math.min(1, dt * 4);
      holder.rotation.y = Math.sin(t * 0.7) * 0.5 + flip * Math.PI * 2;
      holder.position.y = Math.sin(t * 1.3) * 0.08 + 0.1;
      shadow.scale.setScalar(0.85 - holder.position.y * 0.4);
    };
  }

  if (kind === 'parcel') {
    const box = new THREE.Mesh(new RoundedBoxGeometry(1.5, 1.0, 1.1, 5, 0.09), stone);
    const tapeTop = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.03, 1.14, 2, 0.012), clay);
    tapeTop.position.y = 0.5;
    const tapeFront = new THREE.Mesh(new RoundedBoxGeometry(0.3, 1.02, 0.03, 2, 0.012), clay);
    tapeFront.position.z = 0.555;
    const label = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.26, 0.02, 2, 0.01), face);
    label.position.set(0.45, -0.18, 0.56);
    box.add(tapeTop, tapeFront, label);
    const holder = new THREE.Group();
    holder.add(box);
    holder.rotation.y = -0.55;
    rig.add(holder);
    update = (t) => {
      const speed = 1.6 + hoverKick * 1.2;
      const ph = (t * speed) % Math.PI;
      const h = Math.sin(ph); // 0 → 1 → 0 hop
      const land = Math.max(0, 1 - ph / 0.35) + Math.max(0, 1 - (Math.PI - ph) / 0.35);
      box.position.y = h * (0.35 + hoverKick * 0.2) - 0.45;
      box.scale.set(1 + land * 0.06, 1 - land * 0.1, 1 + land * 0.06);
      box.rotation.z = Math.sin(ph * 2) * 0.03;
      holder.rotation.y = -0.55 + Math.sin(t * 0.4) * 0.15;
      shadow.scale.setScalar(1 - h * 0.25);
    };
  }

  if (kind === 'bag') {
    const body = new THREE.Mesh(new RoundedBoxGeometry(1.3, 1.45, 0.62, 5, 0.08), clay);
    const band = new THREE.Mesh(new RoundedBoxGeometry(1.32, 0.12, 0.64, 2, 0.04), face);
    band.position.y = 0.5;
    const handleGeo = new THREE.TorusGeometry(0.3, 0.045, 12, 40, Math.PI);
    const h1 = new THREE.Mesh(handleGeo, ink);
    const h2 = new THREE.Mesh(handleGeo, ink);
    h1.position.set(0, 0.72, 0.16);
    h2.position.set(0, 0.72, -0.16);
    const tag = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.3, 0.03, 2, 0.06), face);
    tag.position.set(0, -0.05, 0.325);
    body.add(band, h1, h2, tag);
    const pivot = new THREE.Group(); // swing from the handles
    pivot.position.y = 1.0;
    body.position.y = -1.0;
    pivot.add(body);
    const holder = new THREE.Group();
    holder.add(pivot);
    holder.position.y = -0.15;
    holder.rotation.y = -0.45;
    rig.add(holder);
    update = (t) => {
      const amp = 0.06 + hoverKick * 0.12;
      pivot.rotation.z = Math.sin(t * 1.6) * amp;
      pivot.rotation.x = Math.sin(t * 0.9) * 0.03;
      holder.rotation.y = -0.45 + Math.sin(t * 0.35) * 0.2;
      holder.position.y = -0.15 + Math.sin(t * 1.1) * 0.04;
    };
  }

  // ---- theme ----------------------------------------------------------------------
  const readTheme = () => {
    const paper = new THREE.Color(css(container, '--ros-paper', '#f5f2ec'));
    const paper2 = new THREE.Color(css(container, '--ros-paper-2', '#ebe6dc'));
    const accent = new THREE.Color(css(container, '--ros-accent', '#e0602f'));
    const inkC = new THREE.Color(css(container, '--ros-ink', '#16171b'));
    const dark = paper.getHSL({}).l < 0.3;
    clay.color.copy(accent);
    stone.color.copy(dark ? new THREE.Color('#3a3b40') : paper2.clone().lerp(new THREE.Color('#c9a77c'), 0.35));
    ink.color.copy(dark ? new THREE.Color('#e8e4dc') : inkC);
    face.color.copy(kind === 'coin' ? new THREE.Color('#ffffff') : paper);
    if (kind === 'coin') {
      face.map?.dispose();
      face.map = rupeeTexture('#' + accent.clone().lerp(new THREE.Color('#ffffff'), 0.08).getHexString(), '#' + accent.clone().lerp(new THREE.Color('#000000'), 0.35).getHexString());
      face.needsUpdate = true;
    }
    for (const m of [clay, stone, ink, face]) m.envMapIntensity = dark ? 0.6 : 1;
    if (!running) render(0);
  };

  // ---- interaction ----------------------------------------------------------------
  const tilt = new THREE.Vector2();
  const tiltTarget = new THREE.Vector2();
  let hovering = false;
  container.addEventListener('pointermove', (e) => {
    const r = container.getBoundingClientRect();
    tiltTarget.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
  });
  container.addEventListener('pointerenter', () => (hovering = true));
  container.addEventListener('pointerleave', () => {
    hovering = false;
    tiltTarget.set(0, 0);
  });

  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  // ---- loop -------------------------------------------------------------------------
  let t = 0;
  let running = false;
  let raf = 0;
  let prev = 0;
  const render = (dt) => {
    t += dt;
    hoverKick += ((hovering ? 1 : 0) - hoverKick) * Math.min(1, dt * 3); // coin: one full flip while hovered
    update(reduce ? 0.8 : t, dt);
    tilt.lerp(tiltTarget, Math.min(1, dt * 3));
    rig.rotation.y = tilt.x * 0.25;
    rig.rotation.x = tilt.y * 0.12;
    renderer.render(scene, camera);
  };
  const tick = (now) => {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    render(dt);
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

  const ro = new ResizeObserver(() => {
    resize();
    if (!running) render(0);
  });
  ro.observe(container);
  resize();
  readTheme();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', readTheme);
  new MutationObserver(readTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });

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
