// RetailerOS — Lottie icon runtime
// -----------------------------------------------------------------------------
// Markup:
//   <span class="ros-lottie lg" data-lottie="pos"></span>
//   <a data-lottie-hover> … <span class="ros-lottie" data-lottie="ai"></span> … </a>
//   <span class="ros-lottie" data-lottie="loader" data-lottie-loop></span>
//
// Behaviour (driven by the markers baked into each JSON):
//   • "intro" plays once when the icon scrolls into view (40% visible)
//   • "hover" plays when the pointer enters the icon or its [data-lottie-hover]
//     ancestor, and on keyboard focus — it always returns to the rest pose
//   • "loop" animations (loader, flow) play continuously while on screen
//   • prefers-reduced-motion → icons render at their final rest frame, static
//
// Requires lottie-web (window.lottie). The light SVG build is enough:
//   https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js
// -----------------------------------------------------------------------------

const BASE = (document.currentScript && document.currentScript.dataset.base) || 'lottie/';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const cache = new Map();
const fetchJSON = (name) => {
  if (!cache.has(name)) cache.set(name, fetch(`${BASE}${name}.json`).then((r) => r.json()));
  // lottie mutates its data — hand every instance a fresh copy
  return cache.get(name).then((d) => structuredClone(d));
};

const markerRange = (data, name) => {
  const m = (data.markers || []).find((x) => x.cm === name);
  return m ? [m.tm, m.tm + m.dr] : null;
};

function mount(el) {
  const name = el.dataset.lottie;
  if (!name || el.__ros) return;
  el.__ros = true;

  fetchJSON(name).then((data) => {
    const intro = markerRange(data, 'intro');
    const hover = markerRange(data, 'hover');
    const loop = el.hasAttribute('data-lottie-loop') || !!markerRange(data, 'loop');

    const anim = window.lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      loop,
      autoplay: false,
      animationData: data,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: true },
    });
    el.__anim = anim;
    el.setAttribute('aria-hidden', el.getAttribute('aria-label') ? 'false' : 'true');

    const rest = intro ? intro[1] : anim.totalFrames - 1;
    let introDone = false;
    let busy = false;

    if (reduceMotion.matches) {
      anim.goToAndStop(loop ? Math.round(anim.totalFrames * 0.3) : rest, true);
      return;
    }

    anim.addEventListener('complete', () => {
      busy = false;
      introDone = true;
    });

    // in-view: intro once, loops play/pause with visibility
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (loop) {
            e.isIntersecting ? anim.play() : anim.pause();
          } else if (e.isIntersecting && !introDone && !busy) {
            busy = true;
            anim.playSegments(intro || [0, rest], true);
          }
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);

    if (!hover || loop) return;
    const trigger = el.closest('[data-lottie-hover]') || el;
    const play = () => {
      if (busy) return;
      busy = true;
      introDone = true;
      anim.playSegments(hover, true);
    };
    trigger.addEventListener('pointerenter', play);
    trigger.addEventListener('focusin', play);
  });
}

function init(root = document) {
  if (!window.lottie) {
    console.warn('[retaileros] lottie-web not found on window');
    return;
  }
  root.querySelectorAll('[data-lottie]').forEach(mount);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init());
else init();

window.RetailerOSLottie = { init, mount };
