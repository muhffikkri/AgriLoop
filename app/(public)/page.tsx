import Link from "next/link";
import { FlowDiagram } from "@/components/landing/FlowDiagram.tsx";
import { WorkflowSteps } from "@/components/landing/WorkflowSteps.tsx";
import { SatelliteGridDemo } from "@/components/demo/SatelliteGridDemo.tsx";
import { SimBadge } from "@/components/ui/badges.tsx";
import { getDemoGrids, getSamples } from "@/lib/server/demo.ts";

export const metadata = {
  title: "Turn what the harvest leaves behind into a usable supply",
};

const WORKFLOW = [
  {
    title: "Estimate a window, not a stock figure",
    body: "Harvest calendars, published production statistics and permitted satellite observations point at areas and months where residue may show up. The output is a range with a date, and it is labelled as a signal.",
    who: "Analyst and the platform",
  },
  {
    title: "Ask the people who know the field",
    body: "A farmer or a field enumerator confirms crop, harvest date, rough quantity and how the material has been stored. Their confirmation is what turns a signal into a lot worth showing to a buyer.",
    who: "Farmer, farmer group or enumerator",
  },
  {
    title: "Look at the material before anyone commits",
    body: "Photos with a few extra facts, such as storage and time since harvest, support a tentative condition note. When the images or the data are too thin, the lot is marked for inspection instead of being given a confident label.",
    who: "Farmer, enumerator or a review queue",
  },
  {
    title: "Match demand with the people who move it",
    body: "Buyers state the material, volume, area and time window they need. Lots are ranked with the reasons visible, and a collector can group several stops into one trip.",
    who: "Buyer, farmer and collection operator",
  },
  {
    title: "Write down what actually happened",
    body: "Weighed quantity, unit, time and hand-over reference are recorded at pickup. The difference against the listing is kept, because that gap is what makes the next estimate better.",
    who: "Collection operator and buyer",
  },
];

const VALUE = [
  {
    title: "Farmers and farmer groups",
    body: "Describe a lot in a short form, decide what to share and when, and keep the exact location private until a real transaction needs it.",
  },
  {
    title: "Collection operators",
    body: "See which lots are ready in your working area, group nearby stops, and check the load against the vehicle capacity before leaving.",
  },
  {
    title: "Buyers and processors",
    body: "Filter for the material and quality you can actually process, and read why a lot was suggested instead of trusting a score.",
  },
  {
    title: "Programme operators",
    body: "Watch data gaps, unresolved disputes and the estimate-versus-actual difference so the weak spots are visible early.",
  },
];

const LIMITS = [
  {
    title: "A satellite estimate is not a stock count",
    body: "Surface observations can show that a field looks bare or covered. They cannot tell you how many tonnes are stacked at the edge of it. Only a confirmed lot and a weighed pickup do that.",
  },
  {
    title: "A condition note is not a certificate",
    body: "An image-based note helps a buyer decide whether to look closer. Feed safety, moisture content and contamination need proper instruments and a protocol agreed with the buyer.",
  },
  {
    title: "Availability still depends on people",
    body: "A lot exists when a farmer confirms it and answers an offer. Weather, labour and transport can move the date, which is why every flow ends with a recorded hand-over.",
  },
];

export default function HomePage() {
  const grids = getDemoGrids();
  const samples = getSamples();

  return (
    <main id="main">
      <section className="section container" style={{ paddingTop: 48 }}>
        <div className="grid-2" style={{ alignItems: "center" }}>
          <div className="stack">
            <p style={{ margin: 0 }}>
              <SimBadge compact />
            </p>
            <h1>Turn what the harvest leaves behind into a usable supply</h1>
            <p className="lede">
              AgriLoop AI estimates where and when crop residue may be available, helps check what condition
              it is in, and connects farmers with the buyers and collectors who can use it. Every number in
              this prototype is a simulation, and the site keeps saying so.
            </p>
            <div className="btn-row">
              <Link className="btn btn-primary" href="/#workflow">
                See how it works
              </Link>
              <Link className="btn btn-ghost" href="/demo">
                Explore the demo
              </Link>
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              No account needed for the walkthrough. No payments, contracts or fleet tracking in this
              prototype.
            </p>
          </div>
          <div className="card">
            <FlowDiagram />
            <p className="small muted" style={{ margin: "10px 0 0" }}>
              Residue moves from confirmed lots to a collection point and on to a buyer or processor. Each
              arrow is a step that a person signs off.
            </p>
          </div>
        </div>
      </section>

      <section id="problem" className="section container">
        <h2>Residue is rarely wasted because nobody cares</h2>
        <p className="lede">
          It is wasted because the two sides never meet at the right moment with the right information.
        </p>
        <div className="grid-2" style={{ marginTop: 20 }}>
          <div className="card">
            <h3>On the field side</h3>
            <p>
              After a combine passes, straw and stubble have to go somewhere. Burning it is fast and cheap
              when there is no buyer nearby, no transport arranged and no time before the next sowing. The
              farmer is not the problem here, the missing coordination is.
            </p>
          </div>
          <div className="card">
            <h3>On the demand side</h3>
            <p>
              Feed mills, composting sites and bioenergy units work on schedules. They cannot plan around
              material whose location, timing, volume and condition are unknown, so they buy from traders
              instead, at a price that leaves little for the farmer.
            </p>
          </div>
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <h3>What is missing between them</h3>
          <p style={{ margin: 0 }}>
            A shared, dated record of what exists, who confirmed it, what state it is in, and what actually
            moved in the end. AgriLoop AI is built around that record rather than around a model.
          </p>
        </div>
      </section>

      <section id="workflow" className="section container">
        <h2>How AgriLoop works</h2>
        <p className="lede">
          Five steps, in order. Each one names the person who signs it off, because a supply decision you
          cannot trace is a supply decision you cannot trust.
        </p>
        <div style={{ marginTop: 20 }}>
          <WorkflowSteps steps={WORKFLOW} />
        </div>
      </section>

      <section className="section container">
        <h2>The demo map</h2>
        <p className="lede">
          Five simulated cells over one Punjab extent, four monthly composites, two layers. Switch the month
          and watch the pixels and the metadata change. One month is deliberately below the usable pixel
          threshold, so you can see the no-data state instead of a filled-in guess.
        </p>
        <div style={{ marginTop: 20 }}>
          <SatelliteGridDemo grids={grids} samples={samples} compact />
        </div>
        <div className="btn-row" style={{ marginTop: 16 }}>
          <Link className="btn btn-primary" href="/demo">
            Open the full walkthrough
          </Link>
        </div>
      </section>

      <section className="section container">
        <h2>What each side gets out of it</h2>
        <div className="grid-4" style={{ marginTop: 20 }}>
          {VALUE.map((item) => (
            <div className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p style={{ margin: 0 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="limits" className="section container">
        <h2>What this platform cannot do</h2>
        <p className="lede">
          These limits are part of the product, not fine print. Every screen repeats the ones that matter for
          the decision in front of you.
        </p>
        <div className="grid-3" style={{ marginTop: 20 }}>
          {LIMITS.map((limit) => (
            <div className="card" key={limit.title}>
              <h3>{limit.title}</h3>
              <p style={{ margin: 0 }}>{limit.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="card" style={{ display: "grid", gap: 14 }}>
          <h2 style={{ margin: 0 }}>Start a pilot conversation</h2>
          <p style={{ margin: 0, maxWidth: "68ch" }}>
            The next step is field work: one district, one residue type, one buyer with a written material
            specification, and enumerators who can validate the condition labels. If that sounds like your
            programme, the walkthrough shows exactly what the software side already covers.
          </p>
          <div className="btn-row">
            <Link className="btn btn-accent" href="/demo">
              Walk through the flow
            </Link>
            <Link className="btn btn-ghost" href="/about">
              Read the sources and limits
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
