"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export type WorkflowStep = {
  title: string;
  body: string;
  who: string;
};

export function WorkflowSteps({ steps }: { steps: WorkflowStep[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <ol
      ref={ref}
      style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}
    >
      {steps.map((step, index) => (
        <motion.li
          key={step.title}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={visible || reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.35, delay: reduceMotion ? 0 : index * 0.12 }}
          className="card"
          style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 14, alignItems: "start" }}
        >
          <span
            aria-hidden="true"
            className="mono"
            style={{
              display: "grid",
              placeItems: "center",
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "var(--green-tint)",
              color: "var(--green-dark)",
              fontWeight: 700,
              border: "1px solid var(--green)",
            }}
          >
            {index + 1}
          </span>
          <div>
            <h3 style={{ marginBottom: 4 }}>{step.title}</h3>
            <p style={{ margin: "0 0 6px" }}>{step.body}</p>
            <p className="small muted" style={{ margin: 0 }}>
              Who does it: {step.who}
            </p>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
