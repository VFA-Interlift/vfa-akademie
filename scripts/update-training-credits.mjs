import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MANUAL_CODES = ["ARB", "DGUV", "FPFW", "SER", "SICH", "YLD"];

const FIXED_CREDITS_BY_CODE = {
  AZUBI: 20,
  EINST: 100,

  B: 200,
  C: 200,

  PLG: 150,
  NUR: 50,
  DOK: 100,
  SCHALL: 150,
  SON: 100,
  BETR: 50,
  MVO: 100,
  MOD: 100,
  BRG: 150,

  GEF: 150,
  FRQ: 100,
  "IN/SER/TR": 350,
};

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/Ä/g, "AE")
    .replace(/Ö/g, "OE")
    .replace(/Ü/g, "UE")
    .replace(/ß/g, "SS");
}

function compact(value) {
  return normalize(value).replace(/\s+/g, "");
}

function isLutzTraining(training) {
  const value = compact(
    `${training.title ?? ""} ${training.code ?? ""} ${training.location ?? ""}`
  );

  return value.includes("LUTZ");
}

function getCourseKey(training) {
  const rawValue = compact(`${training.code ?? ""} ${training.title ?? ""}`);

  const allCodes = [
    "IN/SER/TR",
    "SCHALL",
    "AZUBI",
    "EINST",
    "DGUV",
    "FPFW",
    "BETR",
    "ARB",
    "BRG",
    "DOK",
    "FRQ",
    "GEF",
    "MOD",
    "MVO",
    "NUR",
    "PLG",
    "SER",
    "SICH",
    "SON",
    "YLD",
    "EFK1",
    "EFK2",
    "EFK",
    "A1",
    "A2",
    "B",
    "C",
  ];

  const matchedCode = allCodes.find((code) => {
    const normalizedCode = compact(code);

    return (
      rawValue === normalizedCode ||
      rawValue.startsWith(`${normalizedCode}-`) ||
      rawValue.startsWith(`${normalizedCode}_`) ||
      rawValue.startsWith(`${normalizedCode}:`) ||
      rawValue.startsWith(`${normalizedCode}.`) ||
      rawValue.startsWith(`${normalizedCode}/`)
    );
  });

  return matchedCode ?? "";
}

function getCreditsForTraining(training) {
  const courseKey = getCourseKey(training);

  if (!courseKey) {
    return {
      shouldUpdate: false,
      credits: null,
      reason: "Kein passendes Kürzel erkannt",
      courseKey,
    };
  }

  if (MANUAL_CODES.includes(courseKey)) {
    return {
      shouldUpdate: false,
      credits: null,
      reason: "Manuelle/Inhouse-Schulung",
      courseKey,
    };
  }

  const isLutz = isLutzTraining(training);

  if (courseKey === "A1") {
    return {
      shouldUpdate: true,
      credits: isLutz ? 200 : 150,
      reason: isLutz ? "A1 bei Lutz" : "A1 Standard",
      courseKey,
    };
  }

  if (courseKey === "A2") {
    return {
      shouldUpdate: true,
      credits: isLutz ? 200 : 150,
      reason: isLutz ? "A2 bei Lutz" : "A2 Standard",
      courseKey,
    };
  }

  if (courseKey === "EFK" || courseKey === "EFK1" || courseKey === "EFK2") {
    return {
      shouldUpdate: true,
      credits: isLutz ? 300 : 250,
      reason: isLutz ? "EFK bei Lutz" : "EFK Standard",
      courseKey,
    };
  }

  const fixedCredits = FIXED_CREDITS_BY_CODE[courseKey];

  if (typeof fixedCredits === "number") {
    return {
      shouldUpdate: true,
      credits: fixedCredits,
      reason: "Fester Credit-Wert",
      courseKey,
    };
  }

  return {
    shouldUpdate: false,
    credits: null,
    reason: "Kein Credit-Wert definiert",
    courseKey,
  };
}

async function main() {
  const trainings = await prisma.training.findMany({
    orderBy: [
      {
        date: "asc",
      },
      {
        code: "asc",
      },
    ],
    select: {
      id: true,
      code: true,
      title: true,
      location: true,
      creditsAward: true,
      date: true,
    },
  });

  let updated = 0;
  let unchanged = 0;
  let skipped = 0;

  console.log(`Gefundene Schulungen: ${trainings.length}`);
  console.log("");

  for (const training of trainings) {
    const result = getCreditsForTraining(training);
    const label = `${training.code ?? "ohne Code"} | ${training.title}`;

    if (!result.shouldUpdate || typeof result.credits !== "number") {
      skipped += 1;
      console.log(
        `Übersprungen: ${label} -> ${result.reason}${
          result.courseKey ? ` (${result.courseKey})` : ""
        }`
      );
      continue;
    }

    if (training.creditsAward === result.credits) {
      unchanged += 1;
      console.log(
        `Unverändert: ${label} -> ${result.credits} Credits (${result.reason})`
      );
      continue;
    }

    await prisma.training.update({
      where: {
        id: training.id,
      },
      data: {
        creditsAward: result.credits,
      },
    });

    updated += 1;
    console.log(
      `Aktualisiert: ${label} -> ${training.creditsAward} auf ${result.credits} Credits (${result.reason})`
    );
  }

  console.log("");
  console.log("Credit-Update fertig.");
  console.log(`Aktualisiert: ${updated}`);
  console.log(`Unverändert: ${unchanged}`);
  console.log(`Übersprungen/manuell: ${skipped}`);
}

main()
  .catch((error) => {
    console.error("Credit-Update fehlgeschlagen:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });