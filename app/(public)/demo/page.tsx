import { DemoWalkthrough, type DemoFixtures } from "@/components/demo/DemoWalkthrough.tsx";
import { SatelliteGridDemo } from "@/components/demo/SatelliteGridDemo.tsx";
import { SimNotice } from "@/components/ui/badges.tsx";
import { getDemoGrids, getSamples } from "@/lib/server/demo.ts";
import walkthrough from "@/data/demo/walkthrough.json";

export const metadata = {
  title: "Demo walkthrough",
  description:
    "A guided, no-account walkthrough of AgriLoop AI over simulated Punjab grids. Every record lives in your browser and never reaches the workspaces.",
};

export default function DemoPage() {
  const grids = getDemoGrids();
  const samples = getSamples();
  const fixtures = walkthrough as unknown as DemoFixtures;

  return (
    <main id="main" className="container" style={{ paddingBlock: 40 }}>
      <p style={{ margin: 0 }}>
        <span className="sim-badge">DATA DUMMY / SIMULASI</span>
      </p>
      <h1 style={{ marginTop: 12 }}>Walk through the flow without an account</h1>
      <p className="lede">
        Four personas, one shared chain: a farmer publishes a lot, a buyer reads the match reasons and sends an
        offer, a collector plans the pickup and records what moved, and a programme admin reviews the result.
        Every record you create here stays in this browser.
      </p>
      <p className="small muted" style={{ maxWidth: "72ch" }}>
        Nothing on this page signs you in, and nothing you do here reaches a workspace. The grid viewer below is
        a read-only look at the simulated Punjab extent; the walkthrough at the bottom is a separate, browser-only
        copy of the same rules the workspaces use.
      </p>

      <section className="section" style={{ paddingTop: 24 }}>
        <h2>The simulated Punjab extent</h2>
        <p className="lede">
          Five cells over one extent, four monthly composites and two layers. One month is deliberately below the
          usable pixel threshold so you can see an honest no-data state rather than a filled-in guess.
        </p>
        <div style={{ marginTop: 16 }}>
          <SatelliteGridDemo grids={grids} samples={samples} />
        </div>
      </section>

      <section className="section">
        <h2>The walkthrough</h2>
        <p className="lede">
          Pick a persona and complete its step. The next persona in the chain picks up where the last one left
          off, and you can reset everything at any time.
        </p>
        <div style={{ marginTop: 16 }}>
          <DemoWalkthrough fixtures={fixtures} grids={grids} />
        </div>
      </section>

      <section className="section">
        <SimNotice>
          Both halves of this page run on invented data. The imagery is a synthetic stand-in rather than an Earth
          Engine export, the cells are drawn extents rather than field boundaries, and the walkthrough records are
          stored in your browser rather than on any server.
        </SimNotice>
      </section>
    </main>
  );
}
