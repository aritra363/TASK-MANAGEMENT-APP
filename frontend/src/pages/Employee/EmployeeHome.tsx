import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GlassCard from "../../components/GlassCard";
import NotificationStack from "../../components/NotificationStack";
import Header from "../../components/layout/Header";
import api from "../../api/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function EmployeeHome() {
  const [carousel, setCarousel] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/admin/company");
        const images = res.data.carouselImages || [];
        const processedImages = images.map((img: string) => {
          if (img.startsWith("http")) return img;
          const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
          return `${baseUrl}${img}`;
        });
        setCarousel(processedImages);
      } catch {
        // ignore
      }
    })();
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carousel.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carousel.length) % carousel.length);
  };

  return (
    <div className="app-shell flex flex-col min-h-screen">
      <Header role="EMPLOYEE" title="Dashboard" showBack={false} />
      <div className="flex-1 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Carousel */}
          {carousel.length > 0 && (
            <div className="relative bg-white rounded-xl shadow-md overflow-hidden">
              <div className="relative h-48 md:h-64 bg-slate-100">
                <img
                  src={carousel[currentSlide]}
                  alt={`slide-${currentSlide}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
              </div>
              
              {/* Navigation */}
              {carousel.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 transition"
                  >
                    ← 
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 transition"
                  >
                    →
                  </button>

                  {/* Indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                    {carousel.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-2 rounded-full transition ${
                          idx === currentSlide
                            ? "bg-white w-6"
                            : "bg-white/50 w-2"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/employee/myboard">
              <GlassCard className="cursor-pointer hover:shadow-lg transition">
                <div className="text-sm font-semibold mb-1">My Progress Board</div>
                <div className="text-xs text-slate-600">
                  View and manage your assigned tasks. Update status with drag & drop.
                </div>
              </GlassCard>
            </Link>

            <Link to="/employee/colleagues">
              <GlassCard className="cursor-pointer hover:shadow-lg transition">
                <div className="text-sm font-semibold mb-1">
                  Colleague Progress
                </div>
                <div className="text-xs text-slate-600">
                  View boards for other employees under your manager (read-only).
                </div>
              </GlassCard>
            </Link>
          </div>
        </div>
      </div>
      <NotificationStack />
    </div>
  );
}
