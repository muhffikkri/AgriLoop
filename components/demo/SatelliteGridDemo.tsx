"use client";

import { useMemo, useState } from "react";
import { aoiBounds, projectPoint, ringToBounds, type Bounds, type LonLat } from "@/lib/domain/grid-extent.ts";
import { SimBadge, SimNotice } from "@/components/ui/badges.tsx";

const VIEW_W = 320;
const VIEW_H = 240;

export type GridPatch = {
  id: string;
  areaLabel: string;
  district?: string;
  ring: LonLat[];
  note?: string;
};

export type SampleMonth = {
  key: string;
  label: string;
  rgbAsset: string;
  ndviAsset: string;
  validPixelsPercent: number;
  noData: boolean;
  cloudMask: string;
};

export type Samples = {
  aoiLabel: string;
  aoiNote: string;
  dataset: string;
  dataStatus: string;
  provenance: string;
  crs: string;
  resolutionMeters: number;
  bands: string;
  compositeMethod: string;
  cloudMask: string;
  periodStart: string;
  periodEnd: string;
  months: SampleMonth[];
};

type Layer = "rgb" | "ndvi";

export function SatelliteGridDemo({
  grids,
  samples,
  compact = false,
}: {
  grids: GridPatch[];
  samples: Samples;
  compact?: boolean;
}) {
  const [monthKey, setMonthKey] = useState(samples.months[0].key);
  const [layer, setLayer] = useState<Layer>("rgb");
  const [selected, setSelected] = useState(grids[0]?.id ?? "");

  const month = samples.months.find((entry) => entry.key === monthKey) ?? samples.months[0];
  const bounds: Bounds = useMemo(() => aoiBounds(grids.map((grid) => grid.ring)), [grids]);

  const shapes = grids.map((grid) => ({
    grid,
    points: grid.ring
      .slice(0, -1)
      .map((corner) => {
        const { x, y } = projectPoint(corner, bounds, VIEW_W, VIEW_H);
        return `${x},${y}`;
      })
      .join(" "),
    centre: projectPoint(ringCentre(grid.ring), bounds, VIEW_W, VIEW_H),
  }));

  const activeGrid = grids.find((grid) => grid.id === selected);

  return (
    <div className="stack">
      <SimNotice>{samples.aoiNote}</SimNotice>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="card card-pad-0">
          <div style={{ position: "relative" }}>
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              role="img"
              aria-label={`Synthetic ${layer === "rgb" ? "true colour" : "vegetation index"} composite for ${month.label}, with ${grids.length} simulated selection cells drawn on top`}
              style={{ display: "block", width: "100%", height: "auto" }}
            >
              <image
                href={layer === "rgb" ? month.rgbAsset : month.ndviAsset}
                x="0"
                y="0"
                width={VIEW_W}
                height={VIEW_H}
                opacity={month.noData ? 0.45 : 1}
              />
              {shapes.map(({ grid, points, centre }) => (
                <g key={grid.id}>
                  <polygon
                    points={points}
                    fill={grid.id === selected ? "rgba(21,128,61,0.22)" : "rgba(255,255,255,0.06)"}
                    stroke={grid.id === selected ? "#a16207" : "#ffffff"}
                    strokeWidth={grid.id === selected ? 2.5 : 1.4}
                    strokeDasharray={grid.id === selected ? "0" : "5 3"}
                  />
                  <text
                    x={centre.x}
                    y={centre.y}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#1b2a21"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    paintOrder="stroke"
                  >
                    {grid.id}
                  </text>
                </g>
              ))}
            </svg>
            {month.noData ? (
              <p
                className="small"
                style={{
                  position: "absolute",
                  inset: "auto 12px 12px 12px",
                  margin: 0,
                  background: "var(--warn-tint)",
                  border: "1px solid var(--warn)",
                  color: "#7c3a04",
                  borderRadius: "var(--radius)",
                  padding: "6px 10px",
                  fontWeight: 600,
                }}
              >
                No usable composite this month: valid pixels {month.validPixelsPercent}% is below the threshold.
              </p>
            ) : null}
          </div>
        </div>

        <div className="stack">
          <div>
            <p className="field-label" id="month-label">
              Composite month
            </p>
            <div className="chips" role="group" aria-labelledby="month-label">
              {samples.months.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  className="chip"
                  aria-pressed={entry.key === monthKey}
                  onClick={() => setMonthKey(entry.key)}
                >
                  {entry.label}
                  {entry.noData ? " (no data)" : ""}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="field-label" id="layer-label">
              Layer
            </p>
            <div className="chips" role="group" aria-labelledby="layer-label">
              <button type="button" className="chip" aria-pressed={layer === "rgb"} onClick={() => setLayer("rgb")}>
                True colour
              </button>
              <button type="button" className="chip" aria-pressed={layer === "ndvi"} onClick={() => setLayer("ndvi")}>
                Vegetation index
              </button>
            </div>
          </div>

          <div>
            <p className="field-label" id="grid-label">
              Selection cell
            </p>
            <div className="chips" role="group" aria-labelledby="grid-label">
              {grids.map((grid) => (
                <button
                  key={grid.id}
                  type="button"
                  className="chip"
                  aria-pressed={grid.id === selected}
                  onClick={() => setSelected(grid.id)}
                >
                  {grid.id} · {grid.areaLabel}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <h3 style={{ margin: 0 }}>Image and cell metadata</h3>
          <SimBadge compact />
        </div>
        <dl className="dl">
          <dt>Cell</dt>
          <dd>
            {activeGrid ? `${activeGrid.id} · ${activeGrid.areaLabel}` : "none"}
            {activeGrid?.district ? ` · ${activeGrid.district} district` : ""}
          </dd>
          <dt>Dataset</dt>
          <dd>{samples.dataset}</dd>
          <dt>Period</dt>
          <dd>
            {samples.periodStart} to {samples.periodEnd}
          </dd>
          <dt>Month shown</dt>
          <dd>
            {month.label} · valid pixels {month.validPixelsPercent}%{month.noData ? " · no-data month" : ""}
          </dd>
          <dt>Bands</dt>
          <dd>{samples.bands}</dd>
          <dt>Resolution</dt>
          <dd>{samples.resolutionMeters} m</dd>
          <dt>CRS</dt>
          <dd>{samples.crs}</dd>
          <dt>Cloud mask</dt>
          <dd>{month.cloudMask}</dd>
          <dt>Composite</dt>
          <dd>{samples.compositeMethod}</dd>
          <dt>Data status</dt>
          <dd>{samples.dataStatus}</dd>
          <dt>Cell bounds</dt>
          <dd>
            {activeGrid
              ? formatBounds(ringToBounds(activeGrid.ring))
              : "none"}
          </dd>
        </dl>
        {activeGrid?.note ? <p className="small muted" style={{ marginTop: 10 }}>{activeGrid.note}</p> : null}
        {!compact ? (
          <p className="small muted" style={{ marginTop: 10 }}>
            {samples.provenance}
          </p>
        ) : (
          <p className="small muted" style={{ marginTop: 10 }}>
            Pixels here are a synthetic stand-in, not an Earth Engine export. The demo page lists the full
            provenance.
          </p>
        )}
        <p className="alert alert-warn small" style={{ marginTop: 10 }}>
          Imagery is an observation of the ground surface. It is not a measurement of residue volume and it
          cannot produce a quantity or a grade for a cell.
        </p>
      </div>
    </div>
  );
}

function ringCentre(ring: LonLat[]): LonLat {
  const lons = ring.map(([lon]) => lon);
  const lats = ring.map(([, lat]) => lat);
  return [(Math.min(...lons) + Math.max(...lons)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
}

function formatBounds(bounds: Bounds): string {
  return `${bounds.west.toFixed(2)}, ${bounds.south.toFixed(2)} to ${bounds.east.toFixed(2)}, ${bounds.north.toFixed(2)}`;
}
