"use client";

import { motion, useReducedMotion } from "motion/react";

const NODES = [
  { id: "field", label: "Harvest plots", x: 20, y: 40 },
  { id: "point", label: "Collection point", x: 170, y: 20 },
  { id: "buyer", label: "Buyer or processor", x: 320, y: 46 },
];

/** Hero illustration: residue moving from plots to a buyer. Decorative, flat, no gradients. */
export function FlowDiagram() {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 420 120"
      role="img"
      aria-label="A flow from harvest plots to a collection point and on to a buyer"
      style={{ width: "100%", height: "auto", maxWidth: 520 }}
    >
      <path
        d="M40 44 C 90 10, 130 10, 180 26 S 270 70, 330 50"
        fill="none"
        stroke="var(--line-strong)"
        strokeWidth="2"
        strokeDasharray="6 6"
      />
      {!reduceMotion ? (
        <motion.circle
          r="4"
          fill="var(--gold)"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          style={{
            offsetPath: "path('M40 44 C 90 10, 130 10, 180 26 S 270 70, 330 50')",
          }}
        />
      ) : (
        <circle cx="180" cy="26" r="4" fill="var(--gold)" />
      )}

      {NODES.map((node) => (
        <g key={node.id}>
          <rect
            x={node.x}
            y={node.y}
            width="84"
            height="34"
            rx="6"
            fill="var(--surface)"
            stroke="var(--green)"
            strokeWidth="1.5"
          />
          <text x={node.x + 42} y={node.y + 21} textAnchor="middle" fontSize="11" fill="var(--ink)">
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
