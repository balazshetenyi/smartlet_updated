export enum PropertyType {
  Any = "any",
  LongTerm = "long_term",
  ShortTerm = "short_term",
  Holiday = "holiday",
}

export const RentalType = new Map<string, string>([
  ["any", "Any"],
  [PropertyType.Holiday, "Holiday"],
  [PropertyType.LongTerm, "Long-Term"],
  [PropertyType.ShortTerm, "Short-Term"],
]);
