/**
 * Geocoding utilities powered by the Nominatim OpenStreetMap API.
 * No API key required.
 * Usage policy: https://operations.osmfoundation.org/policies/nominatim/
 *   - Maximum 1 request per second
 *   - Must include a descriptive User-Agent header
 */

export type GeocodeResult = {
  lat: number;
  lng: number;
  /** Human-readable resolved place name, e.g. "Manchester, Greater Manchester, England" */
  displayName: string;
};

/**
 * Resolves a free-text location string to geographic coordinates via Nominatim.
 * Returns null if the query cannot be geocoded or the request fails.
 */
export async function geocodeLocation(
  query: string,
): Promise<GeocodeResult | null> {
  if (!query.trim()) return null;

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      format: "json",
      limit: "1",
      // Bias towards UK results — adjust or remove for international use
      countrycodes: "gb",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          "User-Agent": "Kiado/1.0 (property search)",
          "Accept-Language": "en",
        },
      },
    );

    if (!response.ok) return null;

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    const top = results[0];
    return {
      lat: parseFloat(top.lat),
      lng: parseFloat(top.lon),
      displayName: top.display_name as string,
    };
  } catch (error) {
    console.warn("[geocoding] Failed to geocode location:", error);
    return null;
  }
}
