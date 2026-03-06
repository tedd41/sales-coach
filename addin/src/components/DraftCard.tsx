import React from "react";
import ReactMarkdown from "react-markdown";

interface Props {
  draft: string;
  editing: boolean;
  onToggleEdit: () => void;
  onDraftChange: (v: string) => void;
}

export function DraftCard({ draft, editing, onToggleEdit, onDraftChange }: Props) {
  return (
    <div className="rounded-2xl bg-white border border-purple-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-purple-50 flex items-center justify-between">
        <p className="text-[11px] font-bold text-[#7c3aed] uppercase tracking-widest">Coaching Reply</p>
        <button
          onClick={onToggleEdit}
          title={editing ? "Preview" : "Edit"}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#7c3aed] hover:bg-purple-50 transition-colors"
        >
          {editing ? <EyeIcon /> : <PencilIcon />}
        </button>
      </div>

      {editing ? (
        <textarea
          className="w-full px-5 pt-4 pb-5 text-sm text-gray-800 leading-relaxed resize-none focus:outline-none bg-transparent min-h-[220px] max-h-[320px]"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          autoFocus
        />
      ) : (
        <div className="px-5 pt-4 pb-5 min-h-[220px] max-h-[320px] overflow-y-auto">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="text-sm text-gray-800 leading-relaxed mb-3">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-sm text-gray-800 leading-relaxed">{children}</li>,
              h1: ({ children }) => <h1 className="text-base font-bold text-gray-900 mb-2 mt-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-sm font-bold text-gray-900 mb-2 mt-4">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-900 mb-1 mt-3">{children}</h3>,
            }}
          >
            {draft}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path
        fillRule="evenodd"
        d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
    </svg>
  );
}
