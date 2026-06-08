export type CreditStatusKey = "bronze" | "silber" | "gold" | "vfa-experte";

export type CreditStatus = {
  key: CreditStatusKey;
  label: string;
  minCredits: number;
  maxCredits: number | null;
  nextKey: CreditStatusKey | null;
  nextLabel: string | null;
  badgeSrc: string;
  description: string;
  benefit: string;
};

export type CreditStatusProgress = {
  status: CreditStatus;
  nextStatus: CreditStatus | null;
  credits: number;
  progressPercent: number;
  remainingCredits: number;
  currentRangeStart: number;
  nextRangeStart: number | null;
};

export const CREDIT_STATUSES: CreditStatus[] = [
  {
    key: "bronze",
    label: "Bronze",
    minCredits: 0,
    maxCredits: 499,
    nextKey: "silber",
    nextLabel: "Silber",
    badgeSrc: "/badges/bronze.png",
    description:
      "Du bist in das Credit-System der VFA-Akademie gestartet und baust deinen persönlichen Weiterbildungsstand auf.",
    benefit:
      "Bronze zeigt deinen Einstieg in die VFA-Weiterbildungsstufen und macht deine ersten Schulungen sichtbar.",
  },
  {
    key: "silber",
    label: "Silber",
    minCredits: 500,
    maxCredits: 1499,
    nextKey: "gold",
    nextLabel: "Gold",
    badgeSrc: "/badges/silber.png",
    description:
      "Du bildest dich regelmäßig weiter und hast bereits einen sichtbaren Fortbildungsstatus innerhalb der VFA-Akademie erreicht.",
    benefit:
      "Silber kann perspektivisch als digitales Badge für deinen persönlichen Weiterbildungsstand genutzt werden.",
  },
  {
    key: "gold",
    label: "Gold",
    minCredits: 1500,
    maxCredits: 3499,
    nextKey: "vfa-experte",
    nextLabel: "VFA-Experte",
    badgeSrc: "/badges/gold.png",
    description:
      "Du verfügst über umfangreiche Weiterbildungserfahrung und dokumentierst deinen Qualifikationsstand nachvollziehbar.",
    benefit:
      "Gold steht für einen erweiterten Akademie-Status und kann perspektivisch mit besonderen Fachinformationen oder Formaten verbunden werden.",
  },
  {
    key: "vfa-experte",
    label: "VFA-Experte",
    minCredits: 3500,
    maxCredits: null,
    nextKey: null,
    nextLabel: null,
    badgeSrc: "/badges/vfa-experte.png",
    description:
      "Du hast ein sehr hohes Weiterbildungsniveau innerhalb der VFA-Akademie erreicht.",
    benefit:
      "Der VFA-Expertenstatus kann perspektivisch als digitales Zertifikat, Badge oder Zugang zu besonderen Expertenformaten genutzt werden.",
  },
];

export function getCreditStatus(creditsInput: number): CreditStatus {
  const credits = normalizeCredits(creditsInput);

  return (
    CREDIT_STATUSES.find((status) => {
      if (status.maxCredits === null) {
        return credits >= status.minCredits;
      }

      return credits >= status.minCredits && credits <= status.maxCredits;
    }) ?? CREDIT_STATUSES[0]
  );
}

export function getNextCreditStatus(status: CreditStatus): CreditStatus | null {
  if (!status.nextKey) {
    return null;
  }

  return CREDIT_STATUSES.find((item) => item.key === status.nextKey) ?? null;
}

export function getCreditStatusProgress(
  creditsInput: number
): CreditStatusProgress {
  const credits = normalizeCredits(creditsInput);
  const status = getCreditStatus(credits);
  const nextStatus = getNextCreditStatus(status);

  if (!nextStatus) {
    return {
      status,
      nextStatus: null,
      credits,
      progressPercent: 100,
      remainingCredits: 0,
      currentRangeStart: status.minCredits,
      nextRangeStart: null,
    };
  }

  const currentRangeStart = status.minCredits;
  const nextRangeStart = nextStatus.minCredits;
  const rangeSize = Math.max(1, nextRangeStart - currentRangeStart);
  const creditsInsideRange = Math.max(0, credits - currentRangeStart);
  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round((creditsInsideRange / rangeSize) * 100))
  );

  return {
    status,
    nextStatus,
    credits,
    progressPercent,
    remainingCredits: Math.max(0, nextRangeStart - credits),
    currentRangeStart,
    nextRangeStart,
  };
}

function normalizeCredits(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}