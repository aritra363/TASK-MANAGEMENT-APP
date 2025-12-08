import React from "react";

interface Props {
  message?: string;
}

export default function LoaderOverlay({ message = "Loading..." }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg px-6 py-4 flex items-center gap-3">
        <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm text-slate-800">{message}</div>
      </div>
    </div>
  );
}
