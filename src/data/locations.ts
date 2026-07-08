// Approximate [latitude, longitude] for each photo location, used by the map
// view at /photographymap. Keys are matched case-insensitively (and with extra
// spaces collapsed) against the location part of a roll folder — the bit before
// the "·", e.g. "Amsterdam, Netherlands".
//
// When a new location appears, add a line here. Anything without coordinates is
// simply skipped (with a build-time warning) — it just won't get a dot.
export const LOCATION_COORDS: Record<string, [number, number]> = {
  "Amsterdam, Netherlands": [52.37, 4.9],
  "Berlin, Germany": [52.52, 13.4],
  "Canberra, ACT": [-35.28, 149.13],
  "Chefchaouen, Morocco": [35.17, -5.27],
  "Darwin, NT": [-12.46, 130.84],
  "Istanbul, Turkiye": [41.01, 28.98],
  "Marrakech, Morocco": [31.63, -7.99],
  "Noosa, QLD": [-26.4, 153.09],
  "Saraha Desert, Morocco": [31.1, -4.01],
  "Somewhere, Morocco": [32.34, -6.35],
  "Sydney, NSW": [-33.87, 151.21],
  "Wānaka, New Zealand": [-44.7, 169.15],
};
