import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import useToast from "../../hooks/useToast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface Props {
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  title: string;
  showBack?: boolean;
}

export default function Header({ role, title, showBack = true }: Props) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.user);
      } catch {}
      try {
        const res = await api.get("/admin/company");
        setCompany(res.data);
      } catch {}
    };
    loadData();
  }, []);

  const initials =
    user?.name
      ?.split(" ")
      .map((p: string) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const profileImage = user?.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `${API_BASE}${user.profileImage}`
    : null;

  return (
    <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Left: Back Button & Logo/Company */}
        <div className="flex items-center gap-4">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 transition text-slate-600"
              title="Go back"
            >
              ← 
            </button>
          )}
          
          {role !== "ADMIN" && company?.logo && (
            <img
              src={
                company.logo.startsWith("http")
                  ? company.logo
                  : `${API_BASE}${company.logo}`
              }
              alt={company.name}
              className="h-8 w-8 rounded object-cover"
            />
          )}
          
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            {role !== "ADMIN" && company?.name && (
              <p className="text-xs text-slate-500">{company.name}</p>
            )}
          </div>
        </div>

        {/* Right: Profile Icon */}
        <div className="relative">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-sm font-semibold cursor-pointer hover:shadow-md transition"
            onClick={() => setShowDropdown(!showDropdown)}
            title={user?.name || "Profile"}
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt={user?.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
              <button
                onClick={() => {
                  navigate("/profile");
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-200 transition"
              >
                👤 View Profile
              </button>
              <button
                onClick={async () => {
                  try {
                    await api.post("/auth/logout");
                    toast.success("Logged out successfully");
                    navigate("/login");
                  } catch {
                    toast.error("Failed to logout");
                  }
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition font-medium"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
