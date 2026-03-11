import React from "react";

interface Props {
  message: string;
}

export function Spinner({ message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 mt-10">

      <div className="relative w-16 h-16 flex items-center justify-center">

        {/* very soft stationary glow — no spin, no multiple rings */}
        <div
          className="
            absolute inset-0
            rounded-full
            bg-purple-600/10
            blur-xl
            animate-pulse
            [animation-duration:2.8s]
          "
        />

        {/* single small centered star icon with gentle breathe */}
        <img
          src="/icon-64.png"
          alt="Loading"
          className="
            relative w-10 h-10
            animate-pulse
            [animation-duration:2.8s]
            drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]
          "
        />

      </div>

      <p className="text-sm text-purple-400/90 font-medium tracking-wide">
        {message}
      </p>

    </div>
  );
}