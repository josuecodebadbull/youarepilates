"use client";

import { useState, type FormEvent } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { FormField, inputClass } from "@/components/ui/FormField";
import { PilatesBedIcon } from "@/components/ui/PilatesBedIcon";

interface RoomLayoutEditorProps {
  initialName: string;
  initialRowSizes: number[];
  submitLabel: string;
  submitting: boolean;
  onSubmit: (name: string, rowSizes: number[]) => void;
  onCancel: () => void;
}

/**
 * Shared builder for both creating and editing a room: name + a visual "beds per row"
 * layout instead of a bare capacity number, so the admin can arrange spots the way
 * they're actually laid out on the studio floor and see the result immediately.
 */
export function RoomLayoutEditor({
  initialName,
  initialRowSizes,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: RoomLayoutEditorProps) {
  const [name, setName] = useState(initialName);
  const [rowSizes, setRowSizes] = useState<number[]>(initialRowSizes.length > 0 ? initialRowSizes : [4]);

  const totalCapacity = rowSizes.reduce((sum, n) => sum + n, 0);

  function addRow() {
    setRowSizes((rows) => [...rows, 1]);
  }
  function removeRow(rowIndex: number) {
    setRowSizes((rows) => rows.filter((_, i) => i !== rowIndex));
  }
  function addSpot(rowIndex: number) {
    setRowSizes((rows) => rows.map((n, i) => (i === rowIndex ? n + 1 : n)));
  }
  function removeSpot(rowIndex: number) {
    setRowSizes((rows) => rows.map((n, i) => (i === rowIndex ? Math.max(1, n - 1) : n)));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (totalCapacity === 0) return;
    onSubmit(name, rowSizes);
  }

  let spotCounter = 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField
        label="Nombre de la sala"
        htmlFor="room-name"
        hint='Como la verán tus alumnos, ej. "Sala Reformer 1"'
        required
      >
        <input
          id="room-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sala Reformer 1"
          className={inputClass}
        />
      </FormField>

      <div>
        <div className="flex items-baseline justify-between">
          <span className="block text-sm font-medium text-ink">Distribución de camas</span>
          <span className="text-xs text-ink-soft">
            {totalCapacity} {totalCapacity === 1 ? "cama" : "camas"}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-ink-soft">
          Acomódalas en filas, igual que en tu sala real. Se numeran solas.
        </p>

        <div className="mt-3 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
          {rowSizes.map((count, rowIndex) => {
            const startNumber = spotCounter + 1;
            spotCounter += count;
            return (
              <div key={rowIndex} className="flex flex-wrap items-center gap-3">
                <span className="w-14 shrink-0 text-[11px] font-medium uppercase text-gray-400">
                  Fila {rowIndex + 1}
                </span>
                <div className="flex flex-1 flex-wrap items-end gap-1.5">
                  {Array.from({ length: count }, (_, i) => (
                    <div key={i} className="relative flex h-11 w-7 items-center justify-center text-gray-400">
                      <PilatesBedIcon className="h-full w-full" />
                      <span className="absolute text-[10px] font-semibold text-gray-600">
                        {startNumber + i}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => removeSpot(rowIndex)}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-200"
                    aria-label={`Quitar cama de la fila ${rowIndex + 1}`}
                  >
                    <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => addSpot(rowIndex)}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-200"
                    aria-label={`Agregar cama a la fila ${rowIndex + 1}`}
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(rowIndex)}
                    className="rounded p-1.5 text-red-500 hover:bg-red-50"
                    aria-label={`Eliminar fila ${rowIndex + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}

          <Button type="button" variant="secondary" onClick={addRow} className="px-3 py-1.5 text-xs">
            + Agregar fila
          </Button>
        </div>
        {totalCapacity === 0 && (
          <p className="mt-1.5 text-xs text-red-600">Agrega al menos una cama para poder guardar.</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting || totalCapacity === 0}>
          {submitting ? "Guardando..." : submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
