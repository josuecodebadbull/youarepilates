import type { RoomSpot } from "@/lib/types/firestore";

interface SpotPickerProps {
  spots: RoomSpot[];
  blockedSpots: number[];
  takenSpots: number[];
  selected: number | null;
  onSelect: (spotNumber: number | null) => void;
}

export function SpotPicker({ spots, blockedSpots, takenSpots, selected, onSelect }: SpotPickerProps) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {spots.map((spot) => {
          const unavailable = blockedSpots.includes(spot.spotNumber) || takenSpots.includes(spot.spotNumber);
          const isSelected = selected === spot.spotNumber;
          return (
            <button
              key={spot.spotNumber}
              type="button"
              disabled={unavailable}
              onClick={() => onSelect(isSelected ? null : spot.spotNumber)}
              title={spot.label}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                unavailable
                  ? "cursor-not-allowed bg-gray-100 text-gray-300 line-through"
                  : isSelected
                    ? "text-white"
                    : "bg-gray-100 text-ink hover:bg-gray-200"
              }`}
              style={isSelected && !unavailable ? { backgroundColor: "var(--tenant-primary)" } : undefined}
            >
              {spot.spotNumber}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        {selected !== null
          ? `Elegiste ${spots.find((s) => s.spotNumber === selected)?.label ?? `cama ${selected}`}.`
          : "Elige tu cama o deja sin seleccionar para asignación automática."}
      </p>
    </div>
  );
}
