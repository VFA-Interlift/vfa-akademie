import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const trainings = [
  {
    code: "A1-2603",
    title: "A1-2603",
    date: "2026-05-05",
    endDate: "2026-05-07",
    location: "ALGI Alfred Giehl GmbH&Co.KG, Werk, Kiedrich, Deutschland",
    instructor: "Robert Makarun, Nikolai Thoma",
  },
  {
    code: "A2-2603",
    title: "A2-2603",
    date: "2026-06-16",
    endDate: "2026-06-18",
    location:
      "Fermator Deutschland GmbH - Global1Partners Deutschland, Am Söldnermoos, Hallbergmoos, Deutschland",
    instructor: "Nikolai Thoma, Franz Watzke",
  },
  {
    code: "C-2601",
    title: "C-2601",
    date: "2026-06-23",
    endDate: "2026-06-24",
    location:
      "Schmitt + Sohn Aufzüge GmbH & Co. KG, Hadermühle, Nürnberg, Deutschland",
    instructor: null,
  },
  {
    code: "A1-2604",
    title: "A1-2604",
    date: "2026-07-07",
    endDate: "2026-07-09",
    location:
      "Kübler Group - Fritz Kübler GmbH, Schubertstraße, Villingen-Schwenningen, Deutschland",
    instructor: "Dennis Weiskamp, Sascha Göbel",
  },
  {
    code: "NuR-2603.1",
    title: "NuR-2603.1 (Normen und Richtlinien Teil 1)",
    date: "2026-07-13",
    endDate: "2026-07-13",
    location:
      "LiftEquip GmbH Elevator Components, Zeppelinstraße, Esslingen am Neckar, Deutschland",
    instructor: "Peipei Wang, Franz Watzke",
  },
  {
    code: "NuR-2603.2",
    title: "NuR-2603.2 (Normen und Richtlinien Teil 2)",
    date: "2026-07-14",
    endDate: "2026-07-14",
    location:
      "LiftEquip GmbH Elevator Components, Zeppelinstraße, Esslingen am Neckar, Deutschland",
    instructor: "Peipei Wang, Franz Watzke",
  },
  {
    code: "AZUBI-2602",
    title: "AZUBI-2602",
    date: "2026-09-03",
    endDate: "2026-09-03",
    location: null,
    instructor: null,
  },
  {
    code: "EINST-2602",
    title: "EINST-2602 (Aufzüge für Einsteiger)",
    date: "2026-09-08",
    endDate: "2026-09-09",
    location: null,
    instructor: null,
  },
  {
    code: "A2-2604",
    title: "A2-2604",
    date: "2026-09-15",
    endDate: "2026-09-17",
    location:
      "Telegärtner Elektronik GmbH, Hofäckerstraße, Crailsheim, Deutschland",
    instructor: null,
  },
  {
    code: "EFK1-2603",
    title: "EFK1-2603 (Elektrofachkraft für festgelegte Tätigkeiten)",
    date: "2026-09-08",
    endDate: "2026-09-11",
    location: "Meiller, Ambossstraße, München-Moosach, Deutschland",
    instructor: null,
  },
  {
    code: "IN/SER/TR-2601",
    title: "IN/SER/TR-2601 (Inbetriebnahme, Servicearbeiten, Troubleshooting)",
    date: "2026-09-22",
    endDate: "2026-09-25",
    location: "LUTZ Aufzüge, Gutenbergstraße, Reinbek, Deutschland",
    instructor: null,
  },
  {
    code: "DOK-2601",
    title: "DOK-2601 (Dokumentation im Aufzugbau)",
    date: "2026-10-06",
    endDate: "2026-10-06",
    location: "VFA, Süderstraße, Hamburg, Deutschland",
    instructor: null,
  },
  {
    code: "BETR-2602",
    title: "BETR-2602 (Informationen zum Betrieb von Aufzugsanlagen)",
    date: "2026-10-08",
    endDate: "2026-10-08",
    location: null,
    instructor: null,
  },
  {
    code: "FRQ-2602",
    title: "FRQ-2602 (Frequenzumrichter)",
    date: "2026-10-13",
    endDate: "2026-10-13",
    location: "FLP Lift Parts, Hofener Weg 11A, Remseck-Aldingen, Deutschland",
    instructor: null,
  },
  {
    code: "A1-2605",
    title: "A1-2605",
    date: "2026-10-13",
    endDate: "2026-10-15",
    location: "Lutz Aufzüge, Gutenbergstraße, Reinbek, Deutschland",
    instructor: null,
  },
  {
    code: "EFK2-2603",
    title: "EFK2-2603 (Elektrofachkraft für festgelegte Tätigkeiten)",
    date: "2026-10-13",
    endDate: "2026-10-15",
    location: "Meiller, Ambossstraße, München-Moosach, Deutschland",
    instructor: null,
  },
  {
    code: "GEF-2602",
    title: "GEF-2602 (Gefährdungsbeurteilung an Aufzuganlagen)",
    date: "2026-11-03",
    endDate: "2026-11-04",
    location:
      "Böhnke + Partner Steuerungssysteme, Heinz-Fröling-Straße, Bergisch Gladbach, Deutschland",
    instructor: null,
  },
  {
    code: "PLG-2601",
    title: "PLG-2601",
    date: "2026-11-10",
    endDate: "2026-11-11",
    location:
      "Kuhse Industrial Components GmbH, Max-Planck-Straße, Winsen (Luhe), Deutschland",
    instructor: null,
  },
  {
    code: "SCHALL-2601",
    title: "SCHALL-2601 (Schallschutz an Aufzugsanlagen)",
    date: "2026-11-17",
    endDate: "2026-11-18",
    location: "VFA, Süderstraße, Hamburg, Deutschland",
    instructor: null,
  },
  {
    code: "A2-2605",
    title: "A2-2605",
    date: "2026-11-17",
    endDate: "2026-11-19",
    location: "Lutz Aufzüge, Gutenbergstraße, Reinbek, Deutschland",
    instructor: null,
  },
  {
    code: "B-2602",
    title: "B-2602",
    date: "2026-11-24",
    endDate: "2026-11-25",
    location: "Windscheid und Wendel, Erkrather Straße, Düsseldorf, Deutschland",
    instructor: null,
  },
  {
    code: "SON-2601",
    title: "SON-2601 (Sonderanlagen: Feuerwehr-, Lasten-, Glasaufzüge)",
    date: "2026-11-24",
    endDate: "2026-11-25",
    location:
      "WITTUR Holding GmbH, Rohrbachstraße, Sulzemoos-Wiedenzhausen, Deutschland",
    instructor: null,
  },
  {
    code: "C-2602",
    title: "C-2602",
    date: "2026-12-02",
    endDate: "2026-12-03",
    location:
      "NEW LIFT Neue Elektronische Wege Steuerungsbau GmbH, Lochhamer Schlag, Gräfelfing, Deutschland",
    instructor: null,
  },
  {
    code: "NuR-2604.1",
    title: "NuR-2604.1",
    date: "2026-12-08",
    endDate: "2026-12-08",
    location: "orderbase consulting GmbH, Johann-Krane-Weg, Münster, Deutschland",
    instructor: null,
  },
  {
    code: "NuR-2604.2",
    title: "NuR-2604.2",
    date: "2026-12-09",
    endDate: "2026-12-09",
    location: "orderbase consulting GmbH, Johann-Krane-Weg, Münster, Deutschland",
    instructor: null,
  },
  {
    code: "A1-2701",
    title: "A1-2701",
    date: "2027-01-26",
    endDate: "2027-01-28",
    location: "Windscheid und Wendel, Erkrather Straße, Düsseldorf, Deutschland",
    instructor: null,
  },
  {
    code: "EINST-2701",
    title: "EINST-2701 (online: Aufzüge für Einsteiger)",
    date: "2027-02-02",
    endDate: "2027-02-03",
    location: null,
    instructor: null,
  },
  {
    code: "EFK1-2701",
    title: "EFK1-2701 (Elektrofachkraft für festgelegte Tätigkeiten im Aufzugbau)",
    date: "2027-02-02",
    endDate: "2027-02-05",
    location:
      "Aufzug- und Fördertechnik Niggemeier und Leurs GmbH, Im Blankenfeld, Bottrop, Deutschland",
    instructor: null,
  },
  {
    code: "A2-2701",
    title: "A2-2701",
    date: "2027-02-16",
    endDate: "2027-02-18",
    location: "Windscheid und Wendel, Erkrather Straße, Düsseldorf, Deutschland",
    instructor: null,
  },
  {
    code: "FRQ-2701",
    title: "FRQ-2701 (Frequenzumrichter)",
    date: "2027-03-02",
    endDate: "2027-03-02",
    location:
      "FLP Lift Parts GmbH, Erich-Herion-Straße, Fellbach, Deutschland",
    instructor: null,
  },
  {
    code: "A1-2702",
    title: "A1-2702",
    date: "2027-03-02",
    endDate: "2027-03-04",
    location: "LUTZ Aufzüge, Gutenbergstraße, Reinbek, Deutschland",
    instructor: null,
  },
  {
    code: "AZUBI-2701",
    title: "AZUBI-2701 (online: Aufzüge für Einsteiger - Welcome Azubis))",
    date: "2027-03-03",
    endDate: "2027-03-03",
    location: null,
    instructor: null,
  },
  {
    code: "EFK2-2701",
    title: "EFK2-2701 (Elektrofachkraft für festgelegte Tätigkeiten im Aufzugbau)",
    date: "2027-03-09",
    endDate: "2027-03-11",
    location:
      "Aufzug- und Fördertechnik Niggemeier und Leurs GmbH, Im Blankenfeld, Bottrop, Deutschland",
    instructor: null,
  },
  {
    code: "BETR-2701",
    title: "BETR-2701 (online: Informationen zum Betrieb von Aufzugsanlagen)",
    date: "2027-03-09",
    endDate: "2027-03-09",
    location: null,
    instructor: null,
  },
  {
    code: "MOD-2701",
    title: "MOD-2701 (Grundlagen der Modernisierung im Aufzugbau)",
    date: "2027-03-16",
    endDate: "2027-03-17",
    location:
      "Hübschmann Aufzüge GmbH & Co KG, Raiffeisenstraße, Korbach, Deutschland",
    instructor: null,
  },
  {
    code: "BRG-2701",
    title: "BRG-2701 (Berechnungen im Aufzugbau)",
    date: "2027-04-20",
    endDate: "2027-04-21",
    location: "Chr. Mayr GmbH + Co. KG, Eichenstraße, Mauerstetten, Deutschland",
    instructor: null,
  },
  {
    code: "A2-2702",
    title: "A2-2702",
    date: "2027-04-27",
    endDate: "2027-04-29",
    location: "LUTZ Aufzüge, Gutenbergstraße, Reinbek, Deutschland",
    instructor: null,
  },
  {
    code: "MVO-2701",
    title: "MVO-2701 (Aufzüge nach Maschinenverordnung)",
    date: "2027-04-27",
    endDate: "2027-04-27",
    location:
      "Fermator Deutschland GmbH - Global1Partners Deutschland, Am Söldnermoos, Hallbergmoos, Deutschland",
    instructor: null,
  },
  {
    code: "GEF-2701",
    title: "GEF-2701 (Gefährdungsbeurteilung an Aufzugsanlagen)",
    date: "2027-04-28",
    endDate: "2027-04-29",
    location:
      "Telegärtner Elektronik GmbH, Hofäckerstraße, Crailsheim, Deutschland",
    instructor: null,
  },
  {
    code: "A1-2703",
    title: "A1-2703",
    date: "2027-05-11",
    endDate: "2027-05-13",
    location: "ALGI Alfred Giehl GmbH&Co.KG, Werk, Kiedrich, Deutschland",
    instructor: null,
  },
  {
    code: "NuR-2702.1",
    title: "NuR-2702.1 (Aktuelles aus dem Regelwerk: Einführung)",
    date: "2027-05-11",
    endDate: "2027-05-11",
    location: "VFA, Süderstraße, Hamburg, Deutschland",
    instructor: null,
  },
  {
    code: "NuR-2702.2",
    title: "NuR-2702.2 (Aktuelles aus dem Regelwerk: Schwerpunkt ISO 8100/1-2)",
    date: "2027-05-12",
    endDate: "2027-05-12",
    location: "VFA, Süderstraße, Hamburg, Deutschland",
    instructor: null,
  },
  {
    code: "B-2701",
    title: "B-2701",
    date: "2027-05-25",
    endDate: "2027-05-26",
    location: "Windscheid und Wendel, Erkrather Straße, Düsseldorf, Deutschland",
    instructor: null,
  },
];

function toDate(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function getCertificateKind(code) {
  // Erstmal pragmatisch: alle importierten Schulungen bekommen eine Teilnahmebestätigung.
  // Die genaue Zertifikatslogik können wir später pro Kursart verfeinern.
  return "ATTENDANCE_CONFIRMATION";
}

async function main() {
  let created = 0;
  let updated = 0;

  for (const training of trainings) {
    const existing = await prisma.training.findFirst({
      where: {
        code: training.code,
        date: toDate(training.date),
      },
      select: {
        id: true,
      },
    });

    const data = {
      title: training.title,
      code: training.code,
      date: toDate(training.date),
      endDate: training.endDate ? toDate(training.endDate) : null,
      location: training.location,
      instructor: training.instructor,
      description: null,
      certificateKind: getCertificateKind(training.code),
      creditsAward: 0,
    };

    if (existing) {
      await prisma.training.update({
        where: {
          id: existing.id,
        },
        data,
      });

      updated += 1;
      console.log(`Aktualisiert: ${training.code}`);
    } else {
      await prisma.training.create({
        data,
      });

      created += 1;
      console.log(`Angelegt: ${training.code}`);
    }
  }

  console.log("");
  console.log("Import fertig.");
  console.log(`Neu angelegt: ${created}`);
  console.log(`Aktualisiert: ${updated}`);
  console.log(`Gesamt verarbeitet: ${trainings.length}`);
}

main()
  .catch((error) => {
    console.error("Import fehlgeschlagen:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });