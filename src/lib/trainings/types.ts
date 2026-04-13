// src/lib/trainings/types.ts

export type TrainingCategory = "VDI" | "Elektrotechnik" | "Schwerpunkte" | "Praxis";

export type PublicTraining = {
  id: string;
  title: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  code: string;      // z.B. EFK2-2602
  category: TrainingCategory;
  websiteUrl: string; // WIX-Link
  isPublic: boolean;
};

export type PublicTrainingsGroupedResponse = {
  ok: true;
  updatedAt: string; // ISO
  prefix?: string;
  categories: Array<{
    name: TrainingCategory;
    trainings: PublicTraining[];
  }>;
};
