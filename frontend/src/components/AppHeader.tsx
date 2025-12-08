import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export default function AppHeader({ title, subtitle, showBack = true }: Props) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => {});
    api
      .get("/admin/company")
      .then((r) => setCompany(r.data))
      .catch(() => {});
  }, []);

  const initials =
    user?.name
      ?.split(" ")
      .map((p: string) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              className="btn-secondary text-xs px-2 py-1"
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
          )}
          <div>
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[11px] text-slate-500">
                {subtitle || "Task Management System"}
              </span>
              {company && (
                <div className="flex items-center gap-1">
                  {company.logo && (
                    <img
                      src={
                        company.logo.startsWith("http")
                          ? company.logo
                          : `${API_BASE}${company.logo}`
                      }
                      className="h-6 w-6 rounded object-cover"
                    />
                  )}
                  <span className="text-[11px] text-slate-600">
                    {company.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          className="flex items-center gap-2"
          onClick={() => navigate("/profile")}
        >
          <div className="flex flex-col items-end text-[11px]">
            <span className="font-medium text-slate-800">
              {user?.name || "Profile"}
            </span>
            {user?.role && (
              <span className="text-slate-500 capitalize">
                {user.role.toLowerCase()}
              </span>
            )}
          </div>
          {user?.profileImage ? (
            <img
              src={
                user.profileImage.startsWith("http")
                  ? user.profileImage
                  : `${API_BASE}${user.profileImage}`
              }
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
          )}
        </button>
      </div>
    </header>
  );
}
