import React from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function GlassCard({ children, className = "" }: Props) {
  return <div className={`glass p-4 ${className}`}>{children}</div>;
}
