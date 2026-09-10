import type { RoomSpot } from "@/lib/types/firestore";

/** Builds a fresh, sequentially-numbered spot list from a "N beds per row" layout. */
export function buildSpotsFromRowSizes(rowSizes: number[]): RoomSpot[] {
  const spots: RoomSpot[] = [];
  let spotNumber = 0;
  rowSizes.forEach((count, row) => {
    for (let i = 0; i < count; i++) {
      spotNumber++;
      spots.push({ spotNumber, label: `Cama ${spotNumber}`, row });
    }
  });
  return spots;
}

/** Recovers the "N beds per row" shape from a room's existing spots, for editing.
 * Spots saved before this feature existed have no `row` — they all land in row 0. */
export function rowSizesFromSpots(spots: RoomSpot[]): number[] {
  if (spots.length === 0) return [];
  const maxRow = Math.max(...spots.map((s) => s.row ?? 0));
  const sizes = Array.from({ length: maxRow + 1 }, () => 0);
  for (const spot of spots) {
    const row = spot.row ?? 0;
    sizes[row] = (sizes[row] ?? 0) + 1;
  }
  return sizes;
}

/** Groups spots by row (in row order), for grid rendering. */
export function groupSpotsByRow(spots: RoomSpot[]): RoomSpot[][] {
  const maxRow = spots.reduce((max, s) => Math.max(max, s.row ?? 0), 0);
  const rows: RoomSpot[][] = Array.from({ length: maxRow + 1 }, () => []);
  for (const spot of spots) {
    rows[spot.row ?? 0]!.push(spot);
  }
  return rows.filter((row) => row.length > 0);
}
