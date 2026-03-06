import React from "react";
import type { Length, Tone } from "../types";

interface Props {
  open: boolean;
  onToggle: () => void;
  length: Length;
  tone: Tone;
  customInstructions: string;
  onLengthChange: (v: Length) => void;
  onToneChange: (v: Tone) => void;
  onCustomChange: (v: string) => void;
  onApply: () => void;
}

export function RefinePanel({
  open, onToggle,
  length, tone, customInstructions,
  onLengthChange, onToneChange, onCustomChange,
  onApply,
}: Props) {
  return (
    <div className="rounded-none border border-purple-100 bg-white shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
      >
        <span className="text-[11px] font-bold text-[#7c3aed] uppercase tracking-widest">Refine Reply</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-4 h-4 text-[#7c3aed] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 flex flex-col gap-4 border-t border-purple-50 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Length</label>
              <select
                value={length}
                onChange={(e) => onLengthChange(e.target.value as Length)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 appearance-none cursor-pointer"
              >
                <option value="original">Original</option>
                <option value="short">Shorter</option>
                <option value="medium">Medium</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tone</label>
              <select
                value={tone}
                onChange={(e) => onToneChange(e.target.value as Tone)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 appearance-none cursor-pointer"
              >
                <option value="original">Keep Original</option>
                <option value="professional">Professional</option>
                <option value="enthusiastic">Enthusiastic</option>
                <option value="casual">Casual</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Manager Directives</label>
            <textarea
              value={customInstructions}
              onChange={(e) => onCustomChange(e.target.value)}
              placeholder="e.g. Mention the Q1 target, keep it under 3 sentences…"
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

        <button
            onClick={onApply}
            className="w-full py-2.5 rounded-none text-xs font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-[0.98] transition-all tracking-wide"
            >
            Apply &amp; Regenerate
        </button>
        </div>
      )}
    </div>
  );
}
