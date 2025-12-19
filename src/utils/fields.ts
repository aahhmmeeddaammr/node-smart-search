export function extractSearchFields(doc: any) {
  return Object.entries(doc)
    .filter(
      ([k, v]) => k.startsWith("s__") && typeof v === "string"
    )
    .map(([field, value]) => ({ field, value }));
}

