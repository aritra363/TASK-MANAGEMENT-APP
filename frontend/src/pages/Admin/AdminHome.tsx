import React from "react";
import { Link } from "react-router-dom";
import GlassCard from "../../components/GlassCard";
import NotificationStack from "../../components/NotificationStack";
import Header from "../../components/layout/Header";

export default function AdminHome() {
  return (
    <div className="app-shell flex flex-col min-h-screen">
      <Header role="ADMIN" title="Admin Dashboard" showBack={false} />
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/admin/company">
              <GlassCard className="cursor-pointer hover:shadow-lg transition">
                <div className="text-sm font-semibold mb-1">
                  Edit Company Details
                </div>
                <div className="text-xs text-slate-600">
                  Logo, name and branding images.
                </div>
              </GlassCard>
            </Link>

            <Link to="/admin/people">
              <GlassCard className="cursor-pointer hover:shadow-lg transition">
                <div className="text-sm font-semibold mb-1">
                  Managers & Employees
                </div>
                <div className="text-xs text-slate-600">
                  Add, edit or delete accounts.
                </div>
              </GlassCard>
            </Link>

            <Link to="/admin/assign">
              <GlassCard className="cursor-pointer hover:shadow-lg transition">
                <div className="text-sm font-semibold mb-1">
                  Assign Team Members
                </div>
                <div className="text-xs text-slate-600">
                  Attach employees to managers.
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
