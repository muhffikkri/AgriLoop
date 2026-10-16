/**
 * Generates the synthetic raster stand-ins used by the public demo.
 *
 * This script does NOT call Earth Engine. It draws flat vector fields so the website
 * has a stable, offline-safe asset next to each month's metadata. The exported files
 * are labelled simulated everywhere they are shown, and the metadata file records the
 * Sentinel-2 product a real export must come from.
 *
 * Run: node scripts/gen-satellite.mjs
 */
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "public", "satellite", "punjab-demo");
const WIDTH = 320;
const HEIGHT = 240;
const COLS = 7;
const ROWS = 5;

const MONTHS = [
  {
    key: "2025-08",
    label: "August 2025",
    validPixelsPercent: 94,
    cloudMask: "QA60 bands, no cloud flagged in the demo extent",
    palette: ["#3f7d4e", "#4b8b55", "#357046", "#548f5c", "#2f6b40"],
    haze: 0,
  },
  {
    key: "2025-09",
    label: "September 2025",
    validPixelsPercent: 71,
    cloudMask: "QA60 bands, thin cloud over the north-west corner",
    palette: ["#6d8f4e", "#7c9a52", "#5f8148", "#8aa059", "#577740"],
    haze: 0.35,
  },
  {
    key: "2025-10",
    label: "October 2025",
    validPixelsPercent: 88,
    cloudMask: "QA60 bands, clear over the demo extent",
    palette: ["#c8a44e", "#c9a45a", "#d2b06a", "#b8934a", "#dcbd7c"],
    haze: 0.08,
  },
  {
    key: "2025-11",
    label: "November 2025",
    validPixelsPercent: 34,
    cloudMask: "QA60 bands flag persistent cloud and shadow, composite below the usable threshold",
    palette: ["#8a7a5c", "#94845f", "#7d6f54", "#a08f6b", "#6f6450"],
    haze: 0.62,
  },
];

function mulberry32(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fields(random) {
  const cellW = WIDTH / COLS;
  const cellH = HEIGHT / ROWS;
  const polygons = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const jitter = () => (random() - 0.5) * cellW * 0.28;
      const x = col * cellW;
      const y = row * cellH;
      const points = [
        [x + 2 + jitter(), y + 3 + jitter() * 0.6],
        [x + cellW - 3 + jitter(), y + 2 + jitter() * 0.6],
        [x + cellW - 2 + jitter(), y + cellH - 3 + jitter() * 0.6],
        [x + 3 + jitter(), y + cellH - 2 + jitter() * 0.6],
      ];
      polygons.push(points.map((point) => point.map((value) => Math.round(value * 10) / 10).join(",")).join(" "));
    }
  }
  return polygons;
}

function fillFor(palette, random) {
  return palette[Math.floor(random() * palette.length)];
}

function rgbLayer(month, seed) {
  const random = mulberry32(seed);
  const shapes = fields(random)
    .map((points) => `    <polygon points="${points}" fill="${fillFor(month.palette, random)}" stroke="#2b3b30" stroke-opacity="0.18" stroke-width="0.7" />`)
    .join("\n");

  const haze = month.haze
    ? `  <rect width="${WIDTH}" height="${HEIGHT}" fill="#dfe6e3" opacity="${month.haze}" />\n`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="Synthetic field composite preview for ${month.label}">
  <title>Synthetic composite stand-in - ${month.label}</title>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#7c8a72" />
${shapes}
${haze}  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="none" stroke="#1b2a21" stroke-width="2" />
</svg>
`;
}

function ndviLayer(month, seed) {
  const random = mulberry32(seed + 977);
  const ramp = ["#f6f7ef", "#d9e7c4", "#bcae83", "#9e9b6a", "#7c8f63", "#5f7f52", "#426b43"];
  const shapes = fields(random)
    .map((points) => {
      const step = month.validPixelsPercent > 50 ? Math.floor(random() * ramp.length) : Math.floor(random() * 3);
      return `    <polygon points="${points}" fill="${ramp[step]}" stroke="#ffffff" stroke-opacity="0.25" stroke-width="0.6" />`;
    })
    .join("\n");

  const haze = month.haze
    ? `  <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff" opacity="${month.haze * 0.8}" />\n`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="Synthetic vegetation index preview for ${month.label}">
  <title>Synthetic vegetation index stand-in - ${month.label}</title>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#e8e5da" />
${shapes}
${haze}  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="none" stroke="#1b2a21" stroke-width="2" />
</svg>
`;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const monthMeta = MONTHS.map((month, index) => {
  fs.writeFileSync(path.join(OUT_DIR, `${month.key}-rgb.svg`), rgbLayer(month, index + 11));
  fs.writeFileSync(path.join(OUT_DIR, `${month.key}-ndvi.svg`), ndviLayer(month, index + 11));
  return {
    key: month.key,
    label: month.label,
    rgbAsset: `/satellite/punjab-demo/${month.key}-rgb.svg`,
    ndviAsset: `/satellite/punjab-demo/${month.key}-ndvi.svg`,
    validPixelsPercent: month.validPixelsPercent,
    noData: month.validPixelsPercent < 50,
    cloudMask: month.cloudMask,
    isSimulated: true,
  };
});

const samples = {
  aoiLabel: "Punjab demo extent (synthetic)",
  aoiNote:
    "The extent, the grids on top of it and the pixels below them are invented for this walkthrough. They are not field boundaries, they do not belong to any farmer, and they say nothing about how much residue exists.",
  dataset: "COPERNICUS/S2_SR_HARMONIZED (Sentinel-2 L2A Harmonized) - the collection a real export must use",
  dataStatus: "simulated-placeholder",
  provenance:
    "Files under public/satellite/punjab-demo were generated by scripts/gen-satellite.mjs. No Earth Engine asset is bundled with this repository and no Earth Engine credential exists in the client.",
  crs: "EPSG:4326 for display geometry; the upstream Sentinel-2 product is delivered in UTM zone 43N for this AOI",
  resolutionMeters: 10,
  bands: "B4 (red), B3 (green), B2 (blue) for the RGB view; B8 and B4 for the vegetation index view",
  compositeMethod: "Monthly median composite with cloud masking (planned upstream); synthetic fields used in this repository",
  cloudMask: "QA60 cloud and shadow bands, plus s2cloudless where available",
  periodStart: "2025-08-15",
  periodEnd: "2025-11-30",
  dataStatusNote:
    "One month is intentionally left below the usable pixel threshold to show the honest no-data state instead of a filled-in guess.",
  months: monthMeta,
};

fs.mkdirSync(path.join(process.cwd(), "data", "demo"), { recursive: true });
fs.writeFileSync(
  path.join(process.cwd(), "data", "demo", "satellite-samples.json"),
  `${JSON.stringify(samples, null, 2)}\n`,
  "utf8",
);

console.log(`wrote ${monthMeta.length * 2} svg assets to ${OUT_DIR}`);
