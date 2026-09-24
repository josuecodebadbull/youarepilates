"use client";

import { useState, type FormEvent } from "react";

import { sheetInputClass } from "@/components/ui/FormField";
import { fieldLabelClass } from "@/components/admin/ui";

const MAX_PER_ROW = 12;

interface RoomLayoutEditorProps {
  /** The sheet's footer submits this form by id. */
  formId: string;
  initialName: string;
  initialRowSizes: number[];
  onSubmit: (name: string, rowSizes: number[]) => void;
}

/**
 * Shared builder for both creating and editing a room: name + a "beds per row" layout
 * instead of a bare capacity number, so the admin can arrange spots the way they're
 * actually laid out on the studio floor. Beds are numbered in row order.
 */
export function RoomLayoutEditor({ formId, initialName, initialRowSizes, onSubmit }: RoomLayoutEditorProps) {
  const [name, setName] = useState(initialName);
  const [rowSizes, setRowSizes] = useState<number[]>(initialRowSizes.length > 0 ? initialRowSizes : [4]);

  const totalCapacity = rowSizes.reduce((sum, n) => sum + n, 0);

  function changeRow(rowIndex: number, delta: number) {
    setRowSizes((rows) =>
      rows.map((n, i) => (i === rowIndex ? Math.min(MAX_PER_ROW, Math.max(1, n + delta)) : n)),
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (totalCapacity === 0) return;
    onSubmit(name.trim(), rowSizes);
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className={fieldLabelClass}>
        Nombre de la sala
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sala Reformer 1"
          className={sheetInputClass}
        />
      </label>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[13px]">
          <span className="font-semibold text-ink">Acomodo de camas</span>
          <span className="text-ink-soft">
            {totalCapacity} {totalCapacity === 1 ? "cama" : "camas"} en total
          </span>
        </div>
        <p className="text-xs text-ink-faint">Acomódalas en filas, igual que en tu sala. Se numeran solas.</p>

        {rowSizes.map((count, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-3 rounded-[14px] bg-[#F3F2EE] px-3 py-2.5">
            <span className="w-[52px] shrink-0 text-[13px] font-semibold text-ink">Fila {rowIndex + 1}</span>
            <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
              {Array.from({ length: count }, (_, i) => (
                <span
                  key={i}
                  className="h-6 w-3.5 shrink-0 rounded border-[1.5px] border-brand-500 bg-brand-500/[0.12]"
                />
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => changeRow(rowIndex, -1)}
                aria-label={`Quitar cama de la fila ${rowIndex + 1}`}
                className="h-9 w-9 rounded-[10px] bg-white text-base font-semibold text-ink"
              >
                −
              </button>
              <span className="min-w-6 text-center text-sm font-bold tabular-nums">{count}</span>
              <button
                type="button"
                onClick={() => changeRow(rowIndex, 1)}
                aria-label={`Agregar cama a la fila ${rowIndex + 1}`}
                className="h-9 w-9 rounded-[10px] bg-white text-base font-semibold text-ink"
              >
                +
              </button>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRowSizes((rows) => [...rows, 4])}
            className="h-11 flex-1 rounded-xl border-[1.5px] border-dashed border-ink/[0.18] text-[13px] font-semibold text-ink hover:border-ink/30"
          >
            Agregar fila
          </button>
          {rowSizes.length > 1 && (
            <button
              type="button"
              onClick={() => setRowSizes((rows) => rows.slice(0, -1))}
              className="h-11 px-3.5 text-[13px] font-semibold text-[#B42318]"
            >
              Quitar fila
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
