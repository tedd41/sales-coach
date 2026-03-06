import React from "react";

interface Props {
  message: string;
}

export function Spinner({ message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 mt-10">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-[#ede9fe]" />
        <div className="absolute inset-0 rounded-full border-4 border-t-[#7c3aed] animate-spin" />
        <img src="/icon-64.png" alt="" className="absolute inset-0 m-auto w-7 h-7" />
      </div>
      <p className="text-sm text-[#7c3aed] font-medium">{message}</p>
    </div>
  );
}
