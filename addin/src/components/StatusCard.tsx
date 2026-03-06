import React from "react";

type Variant = "no_item" | "unknown_rep" | "error";

interface Props {
  variant: Variant;
  message?: string;
  onRetry?: () => void;
}

const CONFIG: Record<Variant, { icon: string; title: string; subtitle: string; border: string }> = {
  no_item: {
    icon: "📬",
    title: "No email selected",
    subtitle: "Open an email from a rep, then reopen Sales Coach.",
    border: "border-purple-100",
  },
  unknown_rep: {
    icon: "🔍",
    title: "Sender not on roster",
    subtitle: "Only registered reps have a coaching profile.",
    border: "border-amber-100",
  },
  error: {
    icon: "⚠️",
    title: "",
    subtitle: "",
    border: "border-red-100",
  },
};

export function StatusCard({ variant, message, onRetry }: Props) {
  const { icon, title, subtitle, border } = CONFIG[variant];
  const isError = variant === "error";

  return (
    <div className={`mt-6 rounded-2xl bg-white border ${border} shadow-sm p-5 text-center`}>
      <div className="text-3xl mb-2">{icon}</div>
      <p className={`text-sm font-semibold ${isError ? "text-red-700" : "text-gray-800"}`}>
        {isError ? message || "Something went wrong." : title}
      </p>
      {!isError && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      {isError && onRetry && (
        <button onClick={onRetry} className="mt-3 text-xs font-semibold text-[#7c3aed] hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}
