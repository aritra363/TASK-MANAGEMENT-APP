import React, { useEffect, useState } from "react";
import api from "../api/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function CompanyCarousel() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    api
      .get("/admin/company")
      .then((r) => setImages(r.data.carouselImages || []))
      .catch(() => {});
  }, []);

  if (!images || images.length === 0) return null;

  return (
    <div className="glass p-3 mt-4">
      <div className="text-xs font-semibold text-slate-700 mb-2">
        Company Highlights
      </div>
      <div className="flex gap-3 overflow-x-auto py-2">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="h-40 w-auto min-w-56 rounded-lg flex-shrink-0 bg-slate-100 flex items-center justify-center overflow-hidden"
          >
            <img
              src={img.startsWith("http") ? img : `${API_BASE}${img}`}
              alt={`Carousel ${idx + 1}`}
              className="h-full w-auto object-scale-down"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
