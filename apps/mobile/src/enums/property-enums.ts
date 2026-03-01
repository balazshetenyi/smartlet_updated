export enum PropertyType {
  LongTerm = "long_term",
  ShortTerm = "short_term",
  Holiday = "holiday",
}

export const RentalType = new Map<string, string>([
  [PropertyType.Holiday, "Holiday"],
  [PropertyType.LongTerm, "Long-Term"],
  [PropertyType.ShortTerm, "Short-Term"],
]);
