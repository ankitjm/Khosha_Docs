// RetailerOS — Lottie icon generator
// -----------------------------------------------------------------------------
// Every icon is authored here as code so the whole set shares one grid (96×96),
// one stroke weight, one easing curve and one timeline contract:
//
//   frames   0 → 60   "intro"  — the icon draws itself on (play once, in view)
//   frames  60 → 150  "hover"  — a micro-interaction that returns to rest pose
//
// Both segments are written into the JSON as Lottie `markers`, so any player
// (lottie-web, dotLottie, Lottie iOS/Android, Webflow, Framer) can use them.
//
// Layers carry a class (`cl`): `ink`, `accent`, `accent-fill`, `ink-fill`.
// With the SVG renderer you can recolour every icon from CSS — see
// ../css/retaileros.css — so the brand palette lives in one place.
//
// Run:  node retaileros/lottie/build.mjs
// -----------------------------------------------------------------------------
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));

// ---- palette baked into the JSON (CSS overrides it at runtime) --------------
const INK = '#16171B';
const ACCENT = '#E0602F';
const SW = 3; // stroke width on the 96 grid → 1.5px at 48px, 2px at 64px

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
};

// ---- keyframes --------------------------------------------------------------
// One signature curve for everything: a soft "expo-out" (fast start, long settle).
const EASE_OUT = { o: { x: [0.16], y: [1] }, i: { x: [0.3], y: [1] } };
const EASE_IO = { o: { x: [0.65], y: [0] }, i: { x: [0.35], y: [1] } };

const st = (k) => ({ a: 0, k });
/** keys: [[frame, value, ease?], ...] value may be number or array */
const an = (keys, ease = EASE_OUT) => ({
  a: 1,
  k: keys.map(([t, v, e], idx) => {
    const s = Array.isArray(v) ? v : [v];
    if (idx === keys.length - 1) return { t, s };
    const ez = e || ease;
    return { t, s, o: ez.o, i: ez.i };
  }),
});

// ---- geometry ---------------------------------------------------------------
const path = (pts, closed = false, tangents) => ({
  ty: 'sh',
  nm: 'path',
  ks: st({
    v: pts,
    i: tangents ? tangents.map((t) => t[0]) : pts.map(() => [0, 0]),
    o: tangents ? tangents.map((t) => t[1]) : pts.map(() => [0, 0]),
    c: closed,
  }),
});
const line = (...pts) => path(pts);
const rect = (cx, cy, w, h, r = 0) => ({ ty: 'rc', nm: 'rect', d: 1, p: st([cx, cy]), s: st([w, h]), r: st(r) });
const circle = (cx, cy, r) => ({ ty: 'el', nm: 'ellipse', d: 1, p: st([cx, cy]), s: st([r * 2, r * 2]) });

/** circular arc as cubic béziers; angles in degrees, screen space (y down, 90° = bottom) */
const arc = (cx, cy, r, a0, a1) => {
  const segs = Math.max(1, Math.ceil(Math.abs(a1 - a0) / 90));
  const step = (a1 - a0) / segs;
  const rad = (d) => (d * Math.PI) / 180;
  const k = (4 / 3) * Math.tan(rad(step) / 4) * r;
  const v = [];
  const t = [];
  for (let s = 0; s <= segs; s++) {
    const a = rad(a0 + step * s);
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    const tx = -Math.sin(a) * k;
    const ty = Math.cos(a) * k;
    v.push([x, y]);
    t.push([
      [-tx, -ty],
      [tx, ty],
    ]);
  }
  t[0][0] = [0, 0];
  t[t.length - 1][1] = [0, 0];
  return path(v, false, t);
};

/** chevron arrow head at the end of an arc */
const arcHead = (cx, cy, r, a, dir = 1, len = 8) => {
  const rad = (a * Math.PI) / 180;
  const px = cx + r * Math.cos(rad);
  const py = cy + r * Math.sin(rad);
  const tx = -Math.sin(rad) * dir;
  const ty = Math.cos(rad) * dir;
  const rot = (x, y, deg) => {
    const d = (deg * Math.PI) / 180;
    return [x * Math.cos(d) - y * Math.sin(d), x * Math.sin(d) + y * Math.cos(d)];
  };
  const [ax, ay] = rot(-tx, -ty, 35);
  const [bx, by] = rot(-tx, -ty, -35);
  return line([px + ax * len, py + ay * len], [px, py], [px + bx * len, py + by * len]);
};

/** four-point sparkle with concave sides */
const sparkle = (cx, cy, R, pull = 0.62) => {
  const p = R * pull;
  return path(
    [
      [cx, cy - R],
      [cx + R, cy],
      [cx, cy + R],
      [cx - R, cy],
    ],
    true,
    [
      [
        [0, p],
        [0, p],
      ],
      [
        [-p, 0],
        [-p, 0],
      ],
      [
        [0, -p],
        [0, -p],
      ],
      [
        [p, 0],
        [p, 0],
      ],
    ]
  );
};

// ---- styling / grouping -----------------------------------------------------
const stroke = (hex, w = SW, o = st(100)) => ({ ty: 'st', nm: 'stroke', c: st(rgb(hex)), o, w: st(w), lc: 2, lj: 2, ml: 4, bm: 0 });
const fill = (hex, o = st(100)) => ({ ty: 'fl', nm: 'fill', c: st(rgb(hex)), o, r: 1, bm: 0 });
const trim = ({ s = st(0), e = st(100), o = st(0) } = {}) => ({ ty: 'tm', nm: 'trim', s, e, o, m: 1 });
const xf = ({ p = [0, 0], a = [0, 0], s = [100, 100], r = 0, o = 100 } = {}) => ({
  ty: 'tr',
  p: p.a !== undefined ? p : st(p),
  a: st(a),
  s: s.a !== undefined ? s : st(s),
  r: r.a !== undefined ? r : st(r),
  o: o.a !== undefined ? o : st(o),
  sk: st(0),
  sa: st(0),
});

/** draw-on trim: end goes 0→100 starting at frame t over d frames */
const drawOn = (t, d = 34) => trim({ e: an(t > 0 ? [[0, 0], [t, 0], [t + d, 100]] : [[0, 0], [d, 100]]) });

/**
 * group(shapes, { color, width, fill, draw: [t, d], trim, transform })
 * order inside a Lottie group: shapes → modifiers (trim) → styles → transform
 */
const group = (shapes, opts = {}) => {
  const it = [...shapes];
  if (opts.trim) it.push(opts.trim);
  else if (opts.draw) it.push(drawOn(...opts.draw));
  if (opts.fill) it.push(fill(opts.fill, opts.fillOpacity));
  if (opts.color) it.push(stroke(opts.color, opts.width, opts.strokeOpacity));
  it.push(xf(opts.transform));
  return { ty: 'gr', nm: opts.nm || 'group', it };
};

let IND = 1;
const layer = (cls, groups, ks = {}, nm = cls) => ({
  ddd: 0,
  ind: IND++,
  ty: 4,
  nm,
  cl: cls,
  sr: 1,
  ks: {
    o: ks.o || st(100),
    r: ks.r || st(0),
    p: ks.p || st([48, 48, 0]),
    a: ks.a || st([48, 48, 0]),
    s: ks.s || st([100, 100, 100]),
  },
  ao: 0,
  shapes: groups,
  ip: 0,
  op: 9999,
  st: 0,
  bm: 0,
});

const INTRO = [0, 60];
const HOVER = [60, 150];
const anim = (nm, layers, { w = 96, h = 96, op = 150, markers } = {}) => {
  // Lottie draws layer[0] on top — we author bottom→top, so reverse.
  const ls = [...layers].reverse();
  ls.forEach((l) => (l.op = op));
  IND = 1;
  return {
    v: '5.7.4',
    fr: 60,
    ip: 0,
    op,
    w,
    h,
    nm: `RetailerOS / ${nm}`,
    ddd: 0,
    assets: [],
    layers: ls,
    markers: markers || [
      { tm: INTRO[0], cm: 'intro', dr: INTRO[1] - INTRO[0] },
      { tm: HOVER[0], cm: 'hover', dr: HOVER[1] - HOVER[0] },
    ],
  };
};

// handy: a 3-key "bump" used inside the hover window
const bump = (from, peak, t0 = 60, t1 = 84, t2 = 120) =>
  an([
    [0, from],
    [t0, from],
    [t1, peak],
    [t2, from],
  ]);

// =============================================================================
// ICONS
// =============================================================================
const icons = {};

// 1. POS / Billing — terminal with a receipt that prints on hover
icons['pos'] = anim('POS', [
  layer('accent', [
    group(
      [
        line([36, 34], [36, 18], [40, 14], [44, 18], [48, 14], [52, 18], [56, 14], [60, 18], [60, 34]),
        line([41, 24], [55, 24]),
        line([41, 30], [51, 30]),
      ],
      { color: ACCENT, draw: [22, 34] }
    ),
  ], {
    p: an([
      [0, [48, 56, 0]],
      [22, [48, 56, 0]],
      [52, [48, 48, 0]],
      [60, [48, 48, 0]],
      [72, [48, 52, 0]],
      [100, [48, 42, 0]],
      [130, [48, 48, 0]],
    ]),
  }),
  layer('ink', [
    group([rect(48, 58, 52, 44, 7)], { color: INK, draw: [0, 40] }),
    group([rect(48, 50, 34, 12, 3)], { color: INK, draw: [10, 34] }),
    group([circle(37, 67, 1.6), circle(48, 67, 1.6), circle(59, 67, 1.6), circle(37, 74, 1.6), circle(48, 74, 1.6), circle(59, 74, 1.6)], {
      color: INK,
      draw: [18, 26],
    }),
  ]),
]);

// 2. Inventory — boxes stack; the top box drops in with a soft squash
icons['inventory'] = anim('Inventory', [
  layer('ink', [
    group([line([16, 84], [80, 84])], { color: INK, draw: [0, 30], strokeOpacity: st(40) }),
    group([rect(33, 68, 28, 24, 3), line([33, 56], [33, 62])], { color: INK, draw: [4, 34] }),
    group([rect(63, 68, 28, 24, 3), line([63, 56], [63, 62])], { color: INK, draw: [10, 34] }),
  ]),
  layer(
    'accent',
    [group([rect(48, 40, 28, 24, 3), line([48, 28], [48, 34])], { color: ACCENT, draw: [18, 30] })],
    {
      a: st([48, 52, 0]),
      p: an([
        [0, [48, 34, 0]],
        [18, [48, 34, 0]],
        [44, [48, 52, 0]],
        [60, [48, 52, 0]],
        [76, [48, 36, 0], EASE_IO],
        [96, [48, 52, 0]],
        [150, [48, 52, 0]],
      ]),
      s: an([
        [0, [100, 100, 100]],
        [40, [100, 100, 100]],
        [46, [106, 92, 100]],
        [58, [100, 100, 100]],
        [92, [100, 100, 100]],
        [98, [107, 91, 100]],
        [116, [100, 100, 100]],
      ]),
    }
  ),
]);

// 3. Online store — storefront; awning breathes, door light comes on
const scallops = [0, 1, 2, 3].map((i) => arc(28.5 + i * 13, 34, 6.5, 180, 0));
icons['storefront'] = anim('Online store', [
  layer('ink', [
    group([line([18, 80], [78, 80])], { color: INK, draw: [0, 30] }),
    group([line([26, 42], [26, 80]), line([70, 42], [70, 80])], { color: INK, draw: [6, 30] }),
    group([rect(61, 59, 12, 10, 2)], { color: INK, draw: [16, 26] }),
  ]),
  layer(
    'ink',
    [group([line([22, 34], [22, 20], [74, 20], [74, 34]), ...scallops], { color: INK, draw: [4, 40] })],
    {
      a: st([48, 20, 0]),
      p: st([48, 20, 0]),
      s: an([
        [0, [100, 100, 100]],
        [60, [100, 100, 100]],
        [80, [102, 116, 100], EASE_IO],
        [104, [100, 96, 100], EASE_IO],
        [124, [100, 100, 100]],
      ]),
    },
    'awning'
  ),
  layer('accent', [
    group([path([[34, 80], [34, 58], [46, 58], [46, 80]])], { color: ACCENT, draw: [20, 30] }),
  ]),
  layer(
    'accent-fill',
    [group([circle(43, 70, 1.8)], { fill: ACCENT })],
    { o: an([[0, 0], [44, 0], [54, 100], [60, 100], [72, 15], [84, 100], [96, 15], [110, 100]]) },
    'door-light'
  ),
]);

// 4. Marketplaces — a hub syncing to channels; pulses travel the spokes
const hub = [48, 48];
const sats = [
  [20, 22],
  [78, 26],
  [24, 78],
  [76, 74],
];
const spoke = ([x, y]) => {
  const dx = x - hub[0];
  const dy = y - hub[1];
  const L = Math.hypot(dx, dy);
  const ux = dx / L;
  const uy = dy / L;
  return line([hub[0] + ux * 12, hub[1] + uy * 12], [x - ux * 8, y - uy * 8]);
};
const pulseLoop = (i) =>
  // intro pulse (frames 34–68) + hover pulse (frames 64–98), staggered per spoke
  trim({
    e: an([[0, 0], [22 + i * 3, 0], [44 + i * 3, 100], [60, 100], [61, 0], [64 + i * 5, 0], [92 + i * 5, 100], [150, 100]], EASE_IO),
    s: an([[0, 0], [28 + i * 3, 0], [50 + i * 3, 100], [60, 100], [61, 0], [72 + i * 5, 0], [100 + i * 5, 100], [150, 100]], EASE_IO),
  });
icons['marketplaces'] = anim('Marketplaces', [
  layer('ink', [
    group(sats.map(spoke), { color: INK, draw: [10, 30], strokeOpacity: st(45) }),
    group([circle(...hub, 10)], { color: INK, draw: [0, 34] }),
    group(sats.map(([x, y]) => circle(x, y, 6)), { color: INK, draw: [16, 30] }),
  ]),
  layer('accent', sats.map((s, i) => group([spoke(s)], { color: ACCENT, trim: pulseLoop(i) }))),
  layer('accent-fill', [group([circle(...hub, 3.5)], { fill: ACCENT })], {
    a: st([48, 48, 0]),
    s: an([[0, [0, 0, 100]], [22, [0, 0, 100]], [40, [100, 100, 100]], [60, [100, 100, 100]], [70, [150, 150, 100]], [96, [100, 100, 100]]]),
  }),
]);

// 5. CRM / Customers — two people and a heart that pops
const heart = (cx, cy, k = 1) =>
  path(
    [
      [cx, cy + 9 * k],
      [cx, cy - 3 * k],
    ],
    true,
    [
      [
        [12 * k, -8 * k],
        [-12 * k, -8 * k],
      ],
      [
        [-8 * k, -10 * k],
        [8 * k, -10 * k],
      ],
    ]
  );
icons['customers'] = anim('Customers', [
  layer('ink', [
    group([circle(63, 32, 7), arc(63, 62, 13, 255, 360)], { color: INK, draw: [10, 34], strokeOpacity: st(55) }),
    group([circle(38, 36, 9), arc(38, 74, 18, 180, 360)], { color: INK, draw: [0, 38] }),
  ]),
  layer(
    'accent-fill',
    [group([heart(68, 66)], { fill: ACCENT })],
    {
      a: st([68, 66, 0]),
      p: st([68, 66, 0]),
      o: an([[0, 0], [34, 0], [48, 100]]),
      s: an([
        [0, [60, 60, 100]],
        [34, [60, 60, 100]],
        [50, [100, 100, 100]],
        [60, [100, 100, 100]],
        [70, [126, 126, 100]],
        [80, [96, 96, 100]],
        [90, [114, 114, 100]],
        [112, [100, 100, 100]],
      ]),
    },
    'heart'
  ),
]);

// 6. Books & GST — invoice with a ₹ that redraws on hover
icons['books'] = anim('Books & GST', [
  layer(
    'ink',
    [
      group([path([[28, 16], [58, 16], [70, 28], [70, 82], [28, 82]], true)], { color: INK, draw: [0, 40] }),
      group([line([58, 16], [58, 28], [70, 28])], { color: INK, draw: [16, 20] }),
      group([line([36, 68], [62, 68]), line([36, 75], [52, 75])], { color: INK, draw: [22, 26], strokeOpacity: st(55) }),
    ],
    { p: an([[0, [48, 48, 0]], [60, [48, 48, 0]], [76, [48, 44, 0], EASE_IO], [104, [48, 48, 0]]]) }
  ),
  layer(
    'accent',
    [
      group(
        [
          line([40, 30], [58, 30]),
          line([40, 37], [58, 37]),
          path(
            [
              [43, 30],
              [43, 44],
              [56, 57],
            ],
            false,
            [
              [
                [0, 0],
                [12, 0],
              ],
              [
                [12, 0],
                [0, 0],
              ],
              [
                [0, 0],
                [0, 0],
              ],
            ]
          ),
        ],
        {
          color: ACCENT,
          trim: trim({ e: an([[0, 0], [24, 0], [56, 100], [60, 100], [72, 100], [73, 0], [104, 100]]) }),
        }
      ),
    ],
    { p: an([[0, [48, 48, 0]], [60, [48, 48, 0]], [76, [48, 44, 0], EASE_IO], [104, [48, 48, 0]]]) }
  ),
]);

// 7. Insights — bars grow, a trend line rises through them
const bar = (x, h, t) =>
  group([rect(x, 78 - h / 2, 8, h, 2)], {
    color: INK,
    transform: {
      a: [x, 78],
      p: [x, 78],
      s: an([
        [0, [100, 0]],
        [t, [100, 0]],
        [t + 30, [100, 100]],
        [60, [100, 100]],
        [64 + (t - 8) / 2, [100, 100]],
        [78 + (t - 8) / 2, [100, 55], EASE_IO],
        [104 + (t - 8) / 2, [100, 100]],
      ]),
    },
  });
icons['insights'] = anim('Insights', [
  layer('ink', [
    group([line([20, 18], [20, 80], [80, 80])], { color: INK, draw: [0, 34], strokeOpacity: st(45) }),
    bar(33, 18, 8),
    bar(47, 30, 12),
    bar(61, 24, 16),
    bar(75, 42, 20),
  ]),
  layer('accent', [
    group([line([28, 56], [44, 42], [58, 48], [76, 24]), line([67, 24], [76, 24], [76, 33])], {
      color: ACCENT,
      trim: trim({ e: an([[0, 0], [26, 0], [58, 100], [60, 100], [90, 100], [91, 0], [130, 100]]) }),
    }),
  ]),
]);

// 8. AI — a filled sparkle that turns and breathes; a companion star twinkles
icons['ai'] = anim('AI', [
  layer(
    'accent-fill',
    [group([sparkle(44, 52, 24)], { fill: ACCENT })],
    {
      a: st([44, 52, 0]),
      p: st([44, 52, 0]),
      o: an([[0, 0], [10, 0], [40, 100]]),
      r: an([[0, -45], [10, -45], [50, 0], [60, 0], [110, 90, EASE_IO], [150, 90]]),
      s: an([
        [0, [40, 40, 100]],
        [10, [40, 40, 100]],
        [50, [100, 100, 100]],
        [60, [100, 100, 100]],
        [84, [84, 84, 100], EASE_IO],
        [114, [100, 100, 100]],
      ]),
    },
    'sparkle'
  ),
  layer(
    'ink',
    [group([sparkle(72, 24, 9)], { color: INK, draw: [24, 26], width: 2.5 })],
    {
      a: st([72, 24, 0]),
      p: st([72, 24, 0]),
      s: an([[0, [100, 100, 100]], [66, [100, 100, 100]], [80, [0, 0, 100], EASE_IO], [100, [120, 120, 100]], [116, [100, 100, 100]]]),
    },
    'twinkle'
  ),
  layer(
    'ink-fill',
    [group([circle(74, 70, 2.6)], { fill: INK })],
    { o: an([[0, 0], [34, 0], [46, 100], [60, 100], [86, 100], [96, 20], [112, 100]]) },
    'dot'
  ),
]);

// 9. Sync — two arcs chase each other around a full turn
icons['sync'] = anim(
  'Sync',
  [
    layer(
      'ink',
      [group([arc(48, 48, 24, 200, 335), arcHead(48, 48, 24, 335)], { color: INK, draw: [0, 36] })],
      { r: an([[0, 0], [60, 0], [140, 360, EASE_IO]]) }
    ),
    layer(
      'accent',
      [group([arc(48, 48, 24, 20, 155), arcHead(48, 48, 24, 155)], { color: ACCENT, draw: [12, 36] })],
      { r: an([[0, 0], [60, 0], [140, 360, EASE_IO]]) }
    ),
  ]
);

// 10. Success — circle closes, check lands, a gentle bump
icons['success'] = anim('Success', [
  layer(
    'ink',
    [group([circle(48, 48, 30)], { color: INK, draw: [0, 40], strokeOpacity: st(35) })],
    { s: an([[0, [100, 100, 100]], [36, [100, 100, 100]], [48, [104, 104, 100]], [60, [100, 100, 100]], [66, [100, 100, 100]], [78, [94, 94, 100]], [96, [100, 100, 100]]]) }
  ),
  layer(
    'accent',
    [
      group([line([34, 49], [44, 59], [64, 38])], {
        color: ACCENT,
        width: 3.5,
        trim: trim({ e: an([[0, 0], [24, 0], [50, 100], [60, 100], [66, 100], [67, 0], [94, 100]]) }),
      }),
    ],
    { s: an([[0, [100, 100, 100]], [36, [100, 100, 100]], [48, [104, 104, 100]], [60, [100, 100, 100]], [66, [100, 100, 100]], [78, [94, 94, 100]], [96, [100, 100, 100]]]) }
  ),
]);

// 11. Delivery / Orders — a parcel with a route line and a location pin
icons['orders'] = anim('Orders', [
  layer('ink', [
    group([path([[20, 74], [36, 74]]), path([[44, 74], [56, 74]])], { color: INK, draw: [16, 24], strokeOpacity: st(45) }),
    group([rect(36, 42, 28, 24, 3), line([36, 30], [36, 37]), line([22, 42], [50, 42])], { color: INK, draw: [0, 36] }),
  ]),
  layer(
    'accent',
    [
      group(
        [
          path(
            [
              [70, 80],
              [60, 63],
              [70, 52],
              [80, 63],
            ],
            true,
            [
              [
                [0, 0],
                [0, 0],
              ],
              [
                [0, 0],
                [0, -7],
              ],
              [
                [-7, 0],
                [7, 0],
              ],
              [
                [0, -7],
                [0, 0],
              ],
            ]
          ),
          circle(70, 63, 3),
        ],
        { color: ACCENT, draw: [22, 34] }
      ),
    ],
    {
      p: an([
        [0, [48, 40, 0]],
        [22, [48, 40, 0]],
        [52, [48, 48, 0]],
        [60, [48, 48, 0]],
        [74, [48, 38, 0], EASE_IO],
        [90, [48, 48, 0]],
        [98, [48, 45, 0]],
        [108, [48, 48, 0]],
      ]),
    }
  ),
]);

// =============================================================================
// LOADER — loops 0 → 120 seamlessly (rounded square trace + comet)
// =============================================================================
// ---- shared shapes for the second wave of icons -----------------------------
/** map pin: round head centred at (cx, cy), radius s, tip below */
const pin = (cx, cy, s) => {
  const k = 0.56 * s;
  return path(
    [
      [cx, cy + 1.75 * s],
      [cx - s, cy],
      [cx, cy - s],
      [cx + s, cy],
    ],
    true,
    [
      [[0, 0], [0, 0]],
      [[0, 0], [0, -k]],
      [[-k, 0], [k, 0]],
      [[0, -k], [0, 0]],
    ]
  );
};
const P = (x, y) => [x, y, 0];
/** drop keyframes for a layer position (rest = 48,48) */
const dropIn = (t, from = 30) => an([[0, P(48, from)], [t, P(48, from)], [t + 26, P(48, 48)]]);
/** remove keyframes that share a frame with the previous one */
const uniq = (keys) => keys.filter((k, i, a) => i === 0 || k[0] > a[i - 1][0]);

// 12. Payments — card + contactless waves that pulse on hover
icons['payments'] = anim('Payments', [
  layer('ink', [
    group([rect(38, 58, 48, 32, 5)], { color: INK, draw: [0, 40] }),
    group([line([14, 50], [62, 50])], { color: INK, draw: [14, 24] }),
    group([line([22, 64], [34, 64])], { color: INK, draw: [20, 20], strokeOpacity: st(55) }),
  ]),
  ...[0, 1, 2].map((i) =>
    layer(
      'accent',
      [group([arc(64, 38, 7 + i * 6, 290, 380)], { color: ACCENT, draw: [24 + i * 6, 20] })],
      { o: an([[0, 100], [60, 100], [64 + i * 8, 15], [80 + i * 8, 100], [100 + i * 8, 15], [116 + i * 8, 100]]) },
      `wave-${i}`
    )
  ),
]);

// 13. Barcode scan — frame brackets, bars, a scan line that sweeps
icons['scan'] = anim('Scan', [
  layer('ink', [
    group(
      [
        line([18, 30], [18, 18], [30, 18]),
        line([66, 18], [78, 18], [78, 30]),
        line([78, 66], [78, 78], [66, 78]),
        line([30, 78], [18, 78], [18, 66]),
      ],
      { color: INK, draw: [0, 30] }
    ),
    group([32, 37, 41, 48, 53, 57, 64].map((x) => line([x, 34], [x, 62])), { color: INK, width: 2, draw: [10, 28], strokeOpacity: st(70) }),
  ]),
  layer('accent', [group([line([24, 48], [72, 48])], { color: ACCENT, draw: [20, 20] })], {
    p: an([
      [0, P(48, 34)],
      [24, P(48, 34)],
      [50, P(48, 48)],
      [60, P(48, 48)],
      [80, P(48, 32), EASE_IO],
      [110, P(48, 64), EASE_IO],
      [135, P(48, 48)],
    ]),
  }),
]);

// 14. Cart — basket on wheels; the item drops in and hops on hover
icons['cart'] = anim('Cart', [
  layer(
    'ink',
    [
      group([line([12, 22], [22, 22], [30, 60], [70, 60], [78, 32], [24, 32])], { color: INK, draw: [0, 40] }),
      group([circle(36, 72, 4.5), circle(64, 72, 4.5)], { color: INK, draw: [18, 24] }),
    ],
    { p: an([[0, P(48, 48)], [92, P(48, 48)], [96, P(48, 49.5)], [104, P(48, 48)]]) }
  ),
  layer('accent', [group([rect(52, 46, 16, 13, 2)], { color: ACCENT, draw: [24, 24] })], {
    p: an([
      [0, P(48, 30)],
      [24, P(48, 30)],
      [50, P(48, 48)],
      [60, P(48, 48)],
      [74, P(48, 36), EASE_IO],
      [92, P(48, 48)],
      [98, P(48, 46)],
      [106, P(48, 48)],
    ]),
  }),
]);

// 15. Offers — a price tag with %, swings from its hole
const swing = () => ({
  a: st(P(64, 32)),
  p: st(P(64, 32)),
  r: an([[0, 0], [60, 0], [72, -12, EASE_IO], [90, 8, EASE_IO], [106, -4, EASE_IO], [120, 0]]),
});
icons['discount'] = anim('Offers', [
  layer(
    'ink',
    [
      group([path([[18, 48], [46, 20], [76, 20], [76, 50], [48, 78]], true)], { color: INK, draw: [0, 40] }),
      group([circle(64, 32, 4)], { color: INK, draw: [16, 20] }),
    ],
    swing()
  ),
  layer('accent', [group([circle(40, 50, 3.2), circle(54, 62, 3.2), line([36, 66], [58, 46])], { color: ACCENT, draw: [24, 30] })], swing()),
]);

// 16. Notifications — a bell that rings, with a badge that pops
const ring = () => ({
  a: st(P(48, 26)),
  p: st(P(48, 26)),
  r: an([[0, 0], [60, 0], [70, 14, EASE_IO], [82, -12, EASE_IO], [94, 8, EASE_IO], [106, -4, EASE_IO], [118, 0]]),
});
icons['notify'] = anim('Notifications', [
  layer(
    'ink',
    [
      group([arc(48, 44, 14, 180, 360), line([34, 44], [34, 58], [27, 65]), line([62, 44], [62, 58], [69, 65])], { color: INK, draw: [0, 40] }),
      group([line([25, 65], [71, 65]), line([48, 26], [48, 30])], { color: INK, draw: [14, 24] }),
    ],
    ring()
  ),
  layer('accent', [group([arc(48, 68, 6, 0, 180)], { color: ACCENT, draw: [24, 20] })], ring()),
  layer('accent-fill', [group([circle(66, 28, 6)], { fill: ACCENT })], {
    a: st(P(66, 28)),
    p: st(P(66, 28)),
    s: an([
      [0, [0, 0, 100]],
      [30, [0, 0, 100]],
      [44, [115, 115, 100]],
      [52, [100, 100, 100]],
      [60, [100, 100, 100]],
      [70, [130, 130, 100]],
      [84, [100, 100, 100]],
    ]),
  }),
]);

// 17. Delivery — a truck with speed lines; bumps along on hover
const bumpy = () =>
  an([
    [0, P(48, 48)],
    [60, P(48, 48)],
    [68, P(48, 46)],
    [76, P(48, 48)],
    [84, P(48, 46.5)],
    [92, P(48, 48)],
    [100, P(48, 47)],
    [108, P(48, 48)],
  ]);
icons['delivery'] = anim('Delivery', [
  layer(
    'ink',
    [
      group([rect(36, 48, 40, 28, 3)], { color: INK, draw: [0, 38] }),
      group([line([56, 40], [68, 40], [78, 51], [78, 62], [56, 62])], { color: INK, draw: [10, 30] }),
      group([circle(28, 67, 5), circle(66, 67, 5)], { color: INK, draw: [18, 24] }),
    ],
    { p: bumpy() }
  ),
  layer('accent', [group([line([4, 42], [11, 42]), line([2, 52], [9, 52])], { color: ACCENT, draw: [28, 18] })], {
    p: an([[0, P(48, 48)], [60, P(48, 48)], [72, P(43, 48), EASE_IO], [96, P(48, 48)]]),
  }),
]);

// 18. Calendar — a date gets circled
icons['calendar'] = anim('Calendar', [
  layer('ink', [
    group([rect(48, 54, 56, 48, 6)], { color: INK, draw: [0, 40] }),
    group([line([20, 42], [76, 42]), line([36, 24], [36, 34]), line([60, 24], [60, 34])], { color: INK, draw: [12, 26] }),
  ]),
  layer('ink-fill', [group([circle(34, 56, 2.3), circle(48, 56, 2.3), circle(62, 56, 2.3), circle(34, 68, 2.3), circle(48, 68, 2.3)], { fill: INK })], {
    o: an([[0, 0], [24, 0], [40, 100]]),
  }),
  layer('accent', [
    group([circle(62, 68, 7)], { color: ACCENT, trim: trim({ e: an([[0, 0], [34, 0], [58, 100], [70, 100], [71, 0], [100, 100]]) }) }),
  ]),
]);

// 19. Multi-store — three pins drop onto the map, then hop in turn
const pinHop = (i, base) =>
  an(
    uniq([
      [0, P(48, base)],
      [i * 6, P(48, base)],
      [i * 6 + 28, P(48, 48)],
      [60 + i * 10, P(48, 48)],
      [72 + i * 10, P(48, 40), EASE_IO],
      [86 + i * 10, P(48, 48)],
    ])
  );
icons['stores'] = anim('Multi-store', [
  layer('ink', [group([line([14, 78], [82, 78])], { color: INK, draw: [0, 30], strokeOpacity: st(35) })]),
  layer('ink', [group([pin(22, 52, 7), circle(22, 52, 2.4)], { color: INK, draw: [0, 30] })], { p: pinHop(0, 36) }, 'pin-l'),
  layer('ink', [group([pin(74, 52, 7), circle(74, 52, 2.4)], { color: INK, draw: [12, 30] })], { p: pinHop(2, 36) }, 'pin-r'),
  layer('accent', [group([pin(48, 40, 12), circle(48, 40, 4)], { color: ACCENT, draw: [6, 34] })], { p: pinHop(1, 28) }, 'pin-main'),
]);

// 20. Staff — an ID badge on a lanyard that sways
const sway = () => ({
  a: st(P(48, 6)),
  p: st(P(48, 6)),
  r: an([[0, 0], [60, 0], [72, 8, EASE_IO], [88, -6, EASE_IO], [102, 3, EASE_IO], [116, 0]]),
});
icons['staff'] = anim('Staff', [
  layer(
    'ink',
    [
      group([rect(48, 56, 40, 50, 6)], { color: INK, draw: [6, 38] }),
      group([line([42, 38], [54, 38])], { color: INK, draw: [16, 16] }),
      group([circle(48, 52, 7), arc(48, 73, 12, 200, 340)], { color: INK, draw: [20, 30] }),
    ],
    sway()
  ),
  layer('accent', [group([line([36, 6], [48, 31], [60, 6])], { color: ACCENT, draw: [0, 30] })], sway()),
]);

// 21. Settings — three sliders whose knobs glide on hover
const knob = (cls, hex, cx, cy, dx, i) =>
  layer(
    cls,
    [
      group([circle(cx, cy, 6)], {
        fill: hex,
        transform: {
          a: [cx, cy],
          p: [cx, cy],
          s: an([[0, [0, 0]], [18 + i * 6, [0, 0]], [34 + i * 6, [112, 112]], [44 + i * 6, [100, 100]]]),
        },
      }),
    ],
    { p: an([[0, P(48, 48)], [60 + i * 6, P(48, 48)], [82 + i * 6, P(48 + dx, 48), EASE_IO], [112 + i * 6, P(48, 48), EASE_IO]]) },
    `knob-${i}`
  );
icons['controls'] = anim('Settings', [
  layer('ink', [
    group([line([18, 30], [78, 30])], { color: INK, draw: [0, 30], strokeOpacity: st(40) }),
    group([line([18, 48], [78, 48])], { color: INK, draw: [6, 30], strokeOpacity: st(40) }),
    group([line([18, 66], [78, 66])], { color: INK, draw: [12, 30], strokeOpacity: st(40) }),
  ]),
  knob('ink-fill', INK, 36, 30, 20, 0),
  knob('accent-fill', ACCENT, 60, 48, -22, 1),
  knob('ink-fill', INK, 42, 66, 18, 2),
]);

// 22. Search — a magnifier with a glint that scans in a small loop
const scanLoop = () =>
  an([
    [0, P(48, 48)],
    [60, P(48, 48)],
    [72, P(44, 44), EASE_IO],
    [84, P(52, 44), EASE_IO],
    [96, P(52, 52), EASE_IO],
    [108, P(44, 50), EASE_IO],
    [122, P(48, 48)],
  ]);
icons['search'] = anim('Search', [
  layer(
    'ink',
    [group([circle(42, 42, 16)], { color: INK, draw: [0, 36] }), group([line([54, 54], [72, 72])], { color: INK, width: 3.5, draw: [18, 20] })],
    { p: scanLoop() }
  ),
  layer('accent', [group([arc(42, 42, 9, 200, 270)], { color: ACCENT, draw: [28, 20] })], { p: scanLoop() }),
]);

// 23. Secure — a shield; the check re-draws as the shield pulses
const pulseS = () => ({
  s: an([[0, [100, 100, 100]], [60, [100, 100, 100]], [72, [107, 107, 100], EASE_IO], [92, [100, 100, 100]]]),
});
icons['secure'] = anim('Secure', [
  layer(
    'ink',
    [
      group(
        [
          path(
            [
              [48, 16],
              [72, 25],
              [72, 46],
              [48, 80],
              [24, 46],
              [24, 25],
            ],
            true,
            [
              [[0, 0], [0, 0]],
              [[0, 0], [0, 0]],
              [[0, 0], [0, 16]],
              [[14, -10], [-14, -10]],
              [[0, 16], [0, 0]],
              [[0, 0], [0, 0]],
            ]
          ),
        ],
        { color: INK, draw: [0, 42] }
      ),
    ],
    pulseS()
  ),
  layer(
    'accent',
    [
      group([line([37, 48], [45, 56], [60, 40])], {
        color: ACCENT,
        width: 3.5,
        trim: trim({ e: an([[0, 0], [26, 0], [52, 100], [62, 100], [63, 0], [90, 100]]) }),
      }),
    ],
    pulseS()
  ),
]);

// 24. Loyalty — a gift box whose lid lifts on hover
const lid = () => ({
  a: st(P(48, 40)),
  p: an([[0, P(48, 40)], [60, P(48, 40)], [74, P(48, 30), EASE_IO], [96, P(48, 30)], [112, P(48, 40), EASE_IO]]),
  r: an([[0, 0], [60, 0], [74, -8, EASE_IO], [96, -8], [112, 0, EASE_IO]]),
});
icons['loyalty'] = anim('Loyalty', [
  layer('ink', [group([rect(48, 62, 48, 30, 4)], { color: INK, draw: [0, 40] })]),
  layer('accent', [group([line([48, 47], [48, 77])], { color: ACCENT, draw: [22, 20] })]),
  layer('ink', [group([rect(48, 40, 56, 12, 3)], { color: INK, draw: [10, 34] })], lid(), 'lid'),
  layer('accent', [group([line([48, 34], [48, 46]), circle(41, 27, 6), circle(55, 27, 6)], { color: ACCENT, draw: [28, 26] })], lid(), 'bow'),
]);

// DOTS — typing / thinking loader, loops 0 → 90
icons['dots'] = anim(
  'Dots',
  [0, 1, 2].map((i) =>
    layer(
      i === 1 ? 'accent-fill' : 'ink-fill',
      [group([circle(30 + i * 18, 48, 5)], { fill: i === 1 ? ACCENT : INK })],
      {
        p: an(
          uniq([
            [0, P(48, 48)],
            [i * 10, P(48, 48)],
            [i * 10 + 15, P(48, 40), EASE_IO],
            [i * 10 + 30, P(48, 48), EASE_IO],
            [90, P(48, 48)],
          ])
        ),
      },
      `dot-${i}`
    )
  ),
  { op: 90, markers: [{ tm: 0, cm: 'loop', dr: 90 }] }
);

icons['loader'] = anim(
  'Loader',
  [
    layer('ink', [group([rect(48, 48, 46, 46, 13)], { color: INK, strokeOpacity: st(14) })]),
    layer('accent', [
      group([rect(48, 48, 46, 46, 13)], {
        color: ACCENT,
        trim: trim({
          s: an([[0, 0], [60, 10, EASE_IO], [120, 0]], EASE_IO),
          e: an([[0, 18], [60, 46, EASE_IO], [120, 18]], EASE_IO),
          o: an([[0, 0], [120, 360]], { o: { x: [0.4], y: [0] }, i: { x: [0.6], y: [1] } }),
        }),
      }),
    ]),
  ],
  { op: 120, markers: [{ tm: 0, cm: 'loop', dr: 120 }] }
);

// =============================================================================
// FLOW — "One sale, everywhere at once" (360 × 120, loops 0 → 240)
//   Sale ─────▶ Stock ─────▶ Books   a dot travels; each node lights as it lands
// =============================================================================
const flow = (() => {
  const W = 360;
  const H = 120;
  const nodes = [60, 180, 300];
  const cy = 60;
  const ls = [];
  const lp = (g, o = st(100), nm) =>
    ({ ...layer(g.cls, g.groups, { p: st([W / 2, H / 2, 0]), a: st([W / 2, H / 2, 0]), o }, nm) });

  // rails
  ls.push(
    lp({
      cls: 'ink',
      groups: [
        group([line([nodes[0] + 34, cy], [nodes[1] - 34, cy]), line([nodes[1] + 34, cy], [nodes[2] - 34, cy])], {
          color: INK,
          width: 2,
          strokeOpacity: st(25),
        }),
      ],
    })
  );
  // node frames
  ls.push(lp({ cls: 'ink', groups: nodes.map((x) => group([rect(x, cy, 56, 56, 16)], { color: INK, width: 2.5, strokeOpacity: st(30) })) }));

  // glyphs (receipt, box, ₹)
  const [a, b, c] = nodes;
  ls.push(
    lp({
      cls: 'ink',
      groups: [
        group([line([a - 9, cy + 12], [a - 9, cy - 12], [a + 9, cy - 12], [a + 9, cy + 12], [a + 4.5, cy + 9], [a, cy + 12], [a - 4.5, cy + 9], [a - 9, cy + 12]), line([a - 4, cy - 4], [a + 4, cy - 4]), line([a - 4, cy + 2], [a + 2, cy + 2])], { color: INK, width: 2.5 }),
        group([rect(b, cy + 2, 22, 18, 2.5), line([b - 11, cy - 7], [b - 6, cy - 13], [b + 6, cy - 13], [b + 11, cy - 7]), line([b, cy - 7], [b, cy - 1])], { color: INK, width: 2.5 }),
        group(
          [
            line([c - 8, cy - 12], [c + 8, cy - 12]),
            line([c - 8, cy - 6], [c + 8, cy - 6]),
            path(
              [
                [c - 5, cy - 12],
                [c - 5, cy],
                [c + 7, cy + 12],
              ],
              false,
              [
                [
                  [0, 0],
                  [10, 0],
                ],
                [
                  [10, 0],
                  [0, 0],
                ],
                [
                  [0, 0],
                  [0, 0],
                ],
              ]
            ),
          ],
          { color: INK, width: 2.5 }
        ),
      ],
    })
  );

  // node highlights (accent frames that flash as the dot arrives)
  const arrive = [20, 110, 200];
  nodes.forEach((x, i) => {
    const t = arrive[i];
    ls.push(
      lp(
        { cls: 'accent', groups: [group([rect(x, cy, 56, 56, 16)], { color: ACCENT, width: 2.5 })] },
        (() => {
          const hold = i === nodes.length - 1 ? 14 : 50; // last node must fade before the loop wraps
          const fade = i === nodes.length - 1 ? 22 : 30;
          return an([
            [0, 0],
            [t - 6, 0],
            [t + 4, 100],
            [t + hold, 100],
            [t + hold + fade, 0],
            [240, 0],
          ]);
        })()
      )
    );
  });

  // travelling comet on the rails
  const comet = (x0, x1, t0) =>
    group([line([x0, cy], [x1, cy])], {
      color: ACCENT,
      width: 2.5,
      trim: trim({
        e: an([[0, 0], [t0, 0], [t0 + 50, 100, EASE_IO], [240, 100]], EASE_IO),
        s: an([[0, 0], [t0 + 18, 0], [t0 + 68, 100, EASE_IO], [240, 100]], EASE_IO),
      }),
    });
  ls.push(lp({ cls: 'accent', groups: [comet(a + 34, b - 34, 40), comet(b + 34, c - 34, 130)] }));

  const out = anim('Flow — sale to stock to books', ls, { w: W, h: H, op: 240, markers: [{ tm: 0, cm: 'loop', dr: 240 }] });
  return out;
})();
icons['flow'] = flow;

// ---- write ------------------------------------------------------------------
const manifest = [];
for (const [name, data] of Object.entries(icons)) {
  const file = join(OUT, `${name}.json`);
  writeFileSync(file, JSON.stringify(data));
  manifest.push({ name, file: `${name}.json`, w: data.w, h: data.h, frames: data.op, markers: data.markers.map((m) => m.cm) });
}
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Wrote ${manifest.length} animations:`, manifest.map((m) => m.name).join(', '));
