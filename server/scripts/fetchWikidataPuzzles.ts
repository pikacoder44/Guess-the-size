import fs from "node:fs/promises";
import path from "node:path";
import type { PuzzleItem, ItemCategory, ItemAxis } from "../../src/types/puzzle";
import { generateAndNormalizeSilhouettes } from "./generateSilhouettes";

interface TargetConfig {
  id: string;
  qid: string;
  name: string;
  category: ItemCategory;
  axis: ItemAxis;
  svgUrl: string;
  source: string;
  wikidataAliases?: string[];
  canonicalMeasurementMeters: number;
}

const TARGETS: TargetConfig[] = [
  {
    id: "burj-khalifa",
    qid: "Q12495",
    name: "Burj Khalifa",
    category: "macro",
    axis: "height",
    svgUrl: "/silhouettes/burj_khalifa.svg",
    source: "Wikidata (Q12495)",
    canonicalMeasurementMeters: 828,
  },
  {
    id: "eiffel-tower",
    qid: "Q243",
    name: "Eiffel Tower",
    category: "macro",
    axis: "height",
    svgUrl: "/silhouettes/eiffel_tower.svg",
    source: "Wikidata (Q243)",
    canonicalMeasurementMeters: 330,
  },
  {
    id: "moon",
    qid: "Q405",
    name: "Moon",
    category: "cosmic",
    axis: "diameter",
    svgUrl: "/silhouettes/moon.svg",
    source: "Wikidata (Q405)",
    canonicalMeasurementMeters: 3476200,
  },
  {
    id: "saturn-v",
    qid: "Q22396",
    name: "Saturn V",
    category: "macro",
    axis: "height",
    svgUrl: "/silhouettes/saturn_v.svg",
    source: "Wikidata (Q22396)",
    wikidataAliases: ["Q54363"], // Saturn V rocket QID
    canonicalMeasurementMeters: 110.65,
  },
  {
    id: "blue-whale",
    qid: "Q42196",
    name: "Blue Whale",
    category: "macro",
    axis: "length",
    svgUrl: "/silhouettes/blue_whale.svg",
    source: "Wikidata (Q42196)",
    canonicalMeasurementMeters: 27.1,
  },
  {
    id: "human",
    qid: "Q180",
    name: "Human",
    category: "everyday",
    axis: "height",
    svgUrl: "/silhouettes/human.svg",
    source: "Wikidata (Q180)",
    wikidataAliases: ["Q5"], // Human species QID
    canonicalMeasurementMeters: 1.75,
  },
  {
    id: "dog",
    qid: "Q144",
    name: "Dog",
    category: "everyday",
    axis: "height",
    svgUrl: "/silhouettes/dog.svg",
    source: "Wikidata (Q144)",
    canonicalMeasurementMeters: 0.8,
  },
  {
    id: "car-sedan",
    qid: "Q1420", // Car / Sedan (resolves prompt typo where Q42196 was duplicated)
    name: "Sedan Car",
    category: "everyday",
    axis: "length",
    svgUrl: "/silhouettes/car_sedan.svg",
    source: "Wikidata (Q1420)",
    wikidataAliases: ["Q75783"],
    canonicalMeasurementMeters: 4.5,
  },
];

/**
 * Wikidata QID to SI unit multiplier (meters)
 */
const UNIT_FACTORS: Record<string, number> = {
  Q11573: 1, // metre
  Q828224: 1000, // kilometre
  Q174728: 0.01, // centimetre
  Q218593: 0.001, // millimetre
  Q3710: 0.3048, // foot
  Q218567: 0.0254, // inch
  Q482798: 0.9144, // yard
  Q253276: 1609.344, // mile
  Q12140: 149597870700, // astronomical unit
  Q531: 9.4607e15, // light-year
};

interface SparqlBinding {
  item: { value: string };
  property: { value: string };
  val: { value: string };
  unit?: { value: string };
}

/**
 * Executes SPARQL query against Wikidata query service
 */
async function queryWikidataDimensions(): Promise<Map<string, Map<string, number[]>>> {
  const allQids = new Set<string>();
  for (const t of TARGETS) {
    allQids.add(t.qid);
    if (t.wikidataAliases) {
      for (const a of t.wikidataAliases) {
        allQids.add(a);
      }
    }
  }

  const valuesClause = Array.from(allQids).map((q) => `wd:${q}`).join(" ");

  const sparql = `
SELECT ?item ?property ?val ?unit WHERE {
  VALUES ?item { ${valuesClause} }
  VALUES (?prop ?ps ?property) {
    (p:P2048 ps:P2048 "height")
    (p:P2049 ps:P2049 "length")
    (p:P2043 ps:P2043 "length")
    (p:P2386 ps:P2386 "diameter")
  }
  ?item ?prop ?stmt .
  ?stmt ?ps ?val .
  OPTIONAL {
    ?stmt psv:P2048|psv:P2049|psv:P2043|psv:P2386 ?valNode .
    ?valNode wikibase:quantityAmount ?val ;
             wikibase:quantityUnit ?unit .
  }
}
`.trim();

  const endpoint = "https://query.wikidata.org/sparql";
  const url = `${endpoint}?format=json&query=${encodeURIComponent(sparql)}`;

  const measurementMap = new Map<string, Map<string, number[]>>();

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "ScaleGuessContentPipeline/1.0 (https://github.com/pikacoder44/Guess-the-size; contact: data@scateguess.local)",
        Accept: "application/sparql-results+json",
      },
    });

    if (!res.ok) {
      console.warn(`[Wikidata SPARQL] Request failed with HTTP ${res.status}: ${res.statusText}. Using canonical fallbacks.`);
      return measurementMap;
    }

    const data = (await res.json()) as { results: { bindings: SparqlBinding[] } };
    const bindings = data.results?.bindings || [];

    for (const b of bindings) {
      const qid = b.item.value.split("/").pop();
      if (!qid) continue;

      const propName = b.property.value; // 'height' | 'length' | 'diameter'
      const rawVal = parseFloat(b.val.value);
      if (Number.isNaN(rawVal)) continue;

      const unitQid = b.unit?.value ? b.unit.value.split("/").pop() : "Q11573";
      const factor = (unitQid && UNIT_FACTORS[unitQid]) || 1;
      const measurementMeters = rawVal * factor;

      if (!measurementMap.has(qid)) {
        measurementMap.set(qid, new Map());
      }
      const propMap = measurementMap.get(qid)!;
      if (!propMap.has(propName)) {
        propMap.set(propName, []);
      }
      propMap.get(propName)!.push(measurementMeters);
    }
  } catch (err) {
    console.warn("[Wikidata SPARQL] Network error during query. Proceeding with canonical SI measurements.", err);
  }

  return measurementMap;
}

/**
 * Resolves measurement in SI meters from SPARQL results or canonical defaults
 */
function resolveMeasurement(target: TargetConfig, measurements: Map<string, Map<string, number[]>>): number {
  const candidateQids = [target.qid, ...(target.wikidataAliases || [])];

  for (const qid of candidateQids) {
    const propMap = measurements.get(qid);
    if (!propMap) continue;

    const values = propMap.get(target.axis);
    if (values && values.length > 0) {
      // Find the value closest to the canonical measurement (handles building spire vs roof height)
      let best = values[0]!;
      let minDiff = Math.abs(best - target.canonicalMeasurementMeters);
      for (const val of values) {
        const diff = Math.abs(val - target.canonicalMeasurementMeters);
        if (diff < minDiff) {
          best = val;
          minDiff = diff;
        }
      }
      return Math.round(best * 1000) / 1000;
    }
  }

  return target.canonicalMeasurementMeters;
}

export async function fetchAndBuildPuzzles(): Promise<PuzzleItem[]> {
  const rootDir = process.cwd();
  const silhouettesDir = path.resolve(rootDir, "public/silhouettes");
  const dataDir = path.resolve(rootDir, "src/data");
  const outputPath = path.join(dataDir, "puzzles.json");

  console.log("=== ScaleGuess Content Ingestion Pipeline ===");
  console.log("1. Ensuring SVG silhouettes exist and are normalized...");
  await generateAndNormalizeSilhouettes(silhouettesDir);

  console.log("\n2. Querying Wikidata SPARQL for physical dimensions...");
  const measurements = await queryWikidataDimensions();
  console.log(`[Wikidata SPARQL] Retrieved records for ${measurements.size} Wikidata entities.`);

  console.log("\n3. Building normalized PuzzleItem records...");
  const puzzleItems: PuzzleItem[] = [];

  for (const target of TARGETS) {
    const measurement = resolveMeasurement(target, measurements);
    console.log(
      ` -> [${target.id}] ${target.name} (${target.source}): ${measurement}m along ${target.axis} (${target.category})`
    );

    const item: PuzzleItem = {
      id: target.id,
      name: target.name,
      category: target.category,
      actualMeasurementMeters: measurement,
      axis: target.axis,
      svgUrl: target.svgUrl,
      source: target.source,
    };

    puzzleItems.push(item);
  }

  // Ensure output directory exists and write json
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(puzzleItems, null, 2) + "\n", "utf-8");
  console.log(`\n4. Successfully saved ${puzzleItems.length} normalized items to ${outputPath}`);

  return puzzleItems;
}

// CLI execution
if (process.argv[1]?.endsWith("fetchWikidataPuzzles.ts")) {
  fetchAndBuildPuzzles()
    .then(() => {
      console.log("Pipeline run complete.");
    })
    .catch((err) => {
      console.error("Pipeline run failed:", err);
      process.exit(1);
    });
}
