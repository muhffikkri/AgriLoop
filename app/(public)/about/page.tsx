import Link from "next/link";
import { SimBadge, SimNotice } from "@/components/ui/badges.tsx";

export const metadata = {
  title: "About the project, its sources and its limits",
  description:
    "What AgriLoop AI is in this prototype, where each kind of number is meant to come from, and what the platform deliberately does not claim.",
};

/** The three levels of evidence the whole product is built around. */
const EVIDENCE = [
  {
    title: "Estimate: a signal with a date",
    body: "Crop statistics, harvest calendars and permitted surface observations suggest where and when residue may appear. It is published as a range with a method and a period, never as a single figure.",
    tag: "Never a stock count",
  },
  {
    title: "Confirmed: a person said so",
    body: "A farmer, farmer group or field enumerator confirms the crop, the harvest date, a rough quantity and how the material is stored. That confirmation is what creates a lot a buyer can see.",
    tag: "Signed by a person",
  },
  {
    title: "Verified: what actually moved",
    body: "The weighed quantity, unit, pickup time and a hand-over reference are recorded at collection. The difference against the listing is kept, because that gap is the only honest ground truth in the system.",
    tag: "Weighed and referenced",
  },
];

const SOURCES = [
  {
    name: "District crop production statistics",
    role: "Broad area-level starting point for a residue range.",
    status: "Planned for a pilot. Not ingested in this prototype.",
  },
  {
    name: "Harvest calendars",
    role: "Tells the system which weeks a crop is usually cut in an area.",
    status: "Planned for a pilot. Not ingested in this prototype.",
  },
  {
    name: "Satellite surface observations",
    role: "An optional indicator of bare soil or ground cover after harvest, after its own validation.",
    status: "No Earth Engine asset is bundled here. The imagery on this site is a synthetic stand-in.",
  },
  {
    name: "Farmer or enumerator confirmation",
    role: "The record that turns a signal into a lot with a quantity, a date and a storage note.",
    status: "Entered by hand in the workspace and in the demo.",
  },
  {
    name: "Weighbridge slip or hand-over photo reference",
    role: "The verified actual quantity used to check the original listing.",
    status: "Entered by hand at pickup. The prototype stores the reference, not the file.",
  },
];

const NOT_BUILT = [
  "Payments, invoicing or escrow of any kind.",
  "Signed contracts or legally binding agreements.",
  "Live fleet or vehicle tracking.",
  "Automated quality grading or feed-safety certification.",
  "Weather, soil or yield forecasts.",
  "Route optimisation beyond a simple ordered list of stops.",
];

const LIMITS = [
  {
    title: "A satellite signal is not a stock figure",
    body: "A field that looks bare or covered in an image does not tell you how many tonnes sit at its edge. Only a confirmed lot and a weighed pickup produce a quantity.",
  },
  {
    title: "A condition note is not a certificate",
    body: "A review label helps a buyer decide whether to inspect. Moisture, contamination and feed safety need instruments and a protocol agreed with the buyer, not a photo.",
  },
  {
    title: "Availability still depends on people",
    body: "A lot exists when a farmer answers an offer. Weather, labour and transport move dates, which is why every flow in this product ends with a recorded hand-over rather than a promise.",
  },
  {
    title: "Location is deliberately coarse",
    body: "Cells on the map are wide extents, not field boundaries. Precise coordinates stay out of the public pages and are shared only as far as a transaction actually needs them.",
  },
];

export default function AboutPage() {
  return (
    <main id="main" className="container" style={{ paddingBlock: 40 }}>
      <p style={{ margin: 0 }}>
        <SimBadge />
      </p>
      <h1 style={{ marginTop: 12 }}>What this prototype does, and what it does not know</h1>
      <p className="lede">
        AgriLoop AI is a working prototype of a residue supply platform. This page explains the three levels of
        evidence it separates, where each kind of number is meant to come from, and the parts that are intentionally
        absent.
      </p>
      <p className="small muted" style={{ maxWidth: "72ch" }}>
        Nothing on this website is a real listing, a real buyer or a real price. The quantity, the organisations and
        the map pixels are all invented for the demo, and every surface that shows them carries the dummy badge.
      </p>

      <section className="section" style={{ paddingTop: 32 }}>
        <h2>Three levels of evidence, kept apart</h2>
        <p className="lede">
          Most residue data problems come from mixing an estimate with a fact. This product names the level every
          time it shows a number.
        </p>
        <div className="grid-3" style={{ marginTop: 20 }}>
          {EVIDENCE.map((item) => (
            <div className="card" key={item.title}>
              <p className="small" style={{ margin: 0 }}>
                <span className="badge b-slate badge-solid">{item.tag}</span>
              </p>
              <h3 style={{ marginTop: 10 }}>{item.title}</h3>
              <p style={{ margin: 0 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Where the numbers are meant to come from</h2>
        <p className="lede">
          The table separates what a pilot would ingest from what this repository actually ships with.
        </p>
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="table">
            <caption className="sr-only">Sources, their role in the system, and their status in this prototype</caption>
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col">What it is used for</th>
                <th scope="col">Status in this prototype</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.map((source) => (
                <tr key={source.name}>
                  <td style={{ fontWeight: 600 }}>{source.name}</td>
                  <td>{source.role}</td>
                  <td className="small">{source.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="split">
          <div>
            <h2>What the platform cannot do</h2>
            <p className="lede">
              These limits are part of the product. Each one is repeated on the screen where it matters, rather than
              buried here.
            </p>
            <div className="grid-2" style={{ marginTop: 20 }}>
              {LIMITS.map((limit) => (
                <div className="card" key={limit.title}>
                  <h3>{limit.title}</h3>
                  <p style={{ margin: 0 }}>{limit.body}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="stack">
            <div className="card">
              <h3>Not built yet</h3>
              <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                {NOT_BUILT.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h3>Privacy choices</h3>
              <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                <li>Location is stored at a coarse cell, not a field boundary.</li>
                <li>Photos need their own consent and are referenced, never uploaded by this prototype.</li>
                <li>Identity data is kept apart from any analysis dataset.</li>
                <li>No farmer point or individual price is published in the public pages.</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="section">
        <h2>How sources are cited</h2>
        <p style={{ maxWidth: "72ch" }}>
          Any real-world figure that appears on this site has to carry its original source and date. This prototype
          quotes no public statistic on any page: the numbers it shows are simulated, and it says so. When a pilot
          starts, district figures, residue ratios and satellite exports will be cited where they are displayed, with
          the method version that produced them.
        </p>
        <SimNotice>
          The map on this site is a synthetic stand-in generated by a local script. It is not an Earth Engine export,
          it covers no real parcel, and it cannot produce a quantity or a grade for any cell.
        </SimNotice>
        <div className="btn-row" style={{ marginTop: 16 }}>
          <Link className="btn btn-primary" href="/demo">
            Walk through the flow
          </Link>
          <Link className="btn btn-ghost" href="/#limits">
            Read the limits on the landing page
          </Link>
        </div>
      </section>
    </main>
  );
}
