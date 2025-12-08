import React, { useEffect, useState } from "react";
import api from "../api/api";
import { registerServiceWorkerAndSubscribe } from "../utils/push";
import GlassCard from "../components/GlassCard";
import LoaderOverlay from "../components/LoaderOverlay";
import AppHeader from "../components/AppHeader";
import useToast from "../hooks/useToast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const r = await api.get("/auth/me");
      setUser(r.data.user);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Auto-enable push notifications
    registerServiceWorkerAndSubscribe().catch((e) => {
      console.warn("Failed to auto-enable push notifications:", e);
    });
  }, []);

  const uploadProfile = async (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB image size");
      return;
    }
    const fd = new FormData();
    fd.append("profile", file);
    try {
      setLoading(true);
      await api.post(`/admin/upload/profile/${user.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      await load();
      toast.success("Profile image updated");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async () => {
    try {
      await registerServiceWorkerAndSubscribe();
      toast.success("Push notifications enabled");
    } catch {
      toast.error("Failed to enable push notifications");
    }
  };

  return (
    <div className="app-shell">
      {loading && <LoaderOverlay message="Updating profile..." />}
      <AppHeader title="Profile" showBack />
      <div className="p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <GlassCard>
            {!user ? (
              <div className="text-sm text-slate-600">Loading user...</div>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold">Name:</span> {user.name}
                </div>
                <div>
                  <span className="font-semibold">Role:</span> {user.role}
                </div>
                <div>
                  <span className="font-semibold">Profile image:</span>{" "}
                  {user.profileImage ? (
                    <img
                      src={
                        user.profileImage.startsWith("http")
                          ? user.profileImage
                          : `${API_BASE}${user.profileImage}`
                      }
                      className="w-20 h-20 rounded-full object-cover mt-2"
                    />
                  ) : (
                    "None"
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-xs">
                    Upload profile image (jpg/png ≤ 5MB)
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => uploadProfile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
