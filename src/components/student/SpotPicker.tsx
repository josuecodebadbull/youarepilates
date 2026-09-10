import { groupSpotsByRow } from "@/lib/roomLayout";
import type { RoomSpot } from "@/lib/types/firestore";
import { PilatesBedIcon } from "@/components/ui/PilatesBedIcon";

interface SpotPickerProps {
  spots: RoomSpot[];
  blockedSpots: number[];
  takenSpots: number[];
  selected: number | null;
  onSelect: (spotNumber: number | null) => void;
}

export function SpotPicker({ spots, blockedSpots, takenSpots, selected, onSelect }: SpotPickerProps) {
  const rows = groupSpotsByRow(spots);

  return (
    <div>
      <div className="space-y-2">
        {rows.map((rowSpots, rowIndex) => (
          <div key={rowIndex} className="flex flex-wrap gap-2">
            {rowSpots.map((spot) => {
              const unavailable = blockedSpots.includes(spot.spotNumber) || takenSpots.includes(spot.spotNumber);
              const isSelected = selected === spot.spotNumber;
              return (
                <button
                  key={spot.spotNumber}
                  type="button"
                  disabled={unavailable}
                  onClick={() => onSelect(isSelected ? null : spot.spotNumber)}
                  title={spot.label}
                  className={`relative flex h-12 w-8 items-center justify-center transition-colors ${
                    unavailable ? "cursor-not-allowed text-gray-200" : "text-gray-400 hover:text-gray-600"
                  }`}
                  style={isSelected && !unavailable ? { color: "var(--tenant-primary)" } : undefined}
                >
                  <PilatesBedIcon className="h-full w-full" filled={isSelected && !unavailable} />
                  <span
                    className={`absolute text-[10px] font-semibold ${
                      unavailable ? "text-gray-300 line-through" : isSelected ? "" : "text-ink"
                    }`}
                    style={isSelected && !unavailable ? { color: "var(--tenant-primary)" } : undefined}
                  >
                    {spot.spotNumber}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        {selected !== null
          ? `Elegiste ${spots.find((s) => s.spotNumber === selected)?.label ?? `cama ${selected}`}.`
          : "Elige tu cama o deja sin seleccionar para asignación automática."}
      </p>
    </div>
  );
}
