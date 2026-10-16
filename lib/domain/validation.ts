export const UNITS = ["ton", "kg", "bale"] as const;
export type Unit = (typeof UNITS)[number];

export type LotDraftInput = {
  residueType: string;
  quantity: string;
  unit: string;
  readyDate: string;
  areaLabel: string;
  harvestDate?: string;
  storage?: string;
  moisturePercent?: string;
  notes?: string;
};

export type FieldErrors = Record<string, string>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateQuantity(value: string): FieldErrors {
  const trimmed = value.trim();
  if (!trimmed) return { quantity: "Enter a quantity" };
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return { quantity: "Quantity has to be a number" };
  if (parsed <= 0) return { quantity: "Quantity has to be greater than zero" };
  if (parsed > 1_000_000) return { quantity: "Quantity looks unrealistically large" };
  return {};
}

/** Field-level validation shared by the farmer form and the server action. */
export function validateLotDraft(input: LotDraftInput, today: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.residueType.trim()) errors.residueType = "Choose the residue type";
  if (!input.areaLabel.trim()) errors.areaLabel = "Choose the area or grid";

  if (!UNITS.includes(input.unit as Unit)) errors.unit = "Choose a unit";

  Object.assign(errors, validateQuantity(input.quantity));

  if (!ISO_DATE.test(input.readyDate)) {
    errors.readyDate = "Enter the date the lot is ready";
  } else if (input.readyDate < today) {
    errors.readyDate = "Ready date cannot be earlier than today";
  }

  if (input.harvestDate) {
    if (!ISO_DATE.test(input.harvestDate)) {
      errors.harvestDate = "Enter the harvest date as YYYY-MM-DD";
    } else if (ISO_DATE.test(input.readyDate) && input.harvestDate > input.readyDate) {
      errors.harvestDate = "Harvest date cannot be after the ready date";
    }
  }

  if (input.moisturePercent && input.moisturePercent.trim()) {
    const moisture = Number(input.moisturePercent);
    if (!Number.isFinite(moisture) || moisture < 0 || moisture > 100) {
      errors.moisturePercent = "Moisture has to be between 0 and 100";
    }
  }

  if (input.notes && input.notes.length > 500) {
    errors.notes = "Notes can be at most 500 characters";
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
