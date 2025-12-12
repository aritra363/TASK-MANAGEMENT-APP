import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import LoaderOverlay from "../components/LoaderOverlay";
import useToast from "../hooks/useToast";

type RoleTab = "MANAGER" | "EMPLOYEE";

export default function Login() {
  const navigate = useNavigate();
  const { login, user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<RoleTab>("MANAGER");

  const [mgrUser, setMgrUser] = useState("");
  const [mgrPass, setMgrPass] = useState("");
  const [mgrRemember, setMgrRemember] = useState(false);

  const [empUser, setEmpUser] = useState("");
  const [empPass, setEmpPass] = useState("");
  const [empRemember, setEmpRemember] = useState(false);

  const [adminVisible, setAdminVisible] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");

  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Redirect already logged-in users to their dashboard
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else if (user.role === "MANAGER") {
        navigate("/manager", { replace: true });
      } else {
        navigate("/employee", { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  const doLogin = async (username: string, password: string, remember: boolean) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password, remember });
      const userData = res.data.user;
      toast.success(`Logged in as ${userData.role.toLowerCase()}`);

      // Update auth context
      login(userData);

      // Navigate based on role
      if (userData.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else if (userData.role === "MANAGER") {
        navigate("/manager", { replace: true });
      } else {
        navigate("/employee", { replace: true });
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const validate = (u: string, p: string) => {
    if (!u.trim() || !p.trim()) {
      toast.error("Username and password are required");
      return false;
    }
    return true;
  };

  const handleManagerLogin = () => {
    if (!validate(mgrUser, mgrPass)) return;
    doLogin(mgrUser, mgrPass, mgrRemember);
  };

  const handleEmployeeLogin = () => {
    if (!validate(empUser, empPass)) return;
    doLogin(empUser, empPass, empRemember);
  };

  const handleAdminLogin = () => {
    if (!validate(adminUser, adminPass)) return;
    doLogin(adminUser, adminPass, false); // admin never remembers
  };
  return (
    <div className="app-shell flex flex-col">
      {(loading || isLoading) && <LoaderOverlay message="Signing you in..." />}

      <header className="w-full border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
              TM
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">
                Task Management System
              </span>
              <span className="text-xs text-slate-500">
                Manager · Employee · Admin
              </span>
            </div>
          </div>

          <button
            className="btn-secondary text-xs"
            onClick={() => setAdminVisible((v) => !v)}
          >
            {adminVisible ? "Close Admin Login" : "Admin Login"}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3">
            <div className="glass-strong p-6">
              <h2 className="text-xl font-semibold mb-4">Sign in</h2>

              <div className="flex mb-4 border-b border-slate-200">
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "MANAGER"
                      ? "border-b-2 border-indigo-600 text-indigo-600"
                      : "text-slate-500"
                  }`}
                  onClick={() => setActiveTab("MANAGER")}
                >
                  Manager
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "EMPLOYEE"
                      ? "border-b-2 border-indigo-600 text-indigo-600"
                      : "text-slate-500"
                  }`}
                  onClick={() => setActiveTab("EMPLOYEE")}
                >
                  Employee
                </button>
              </div>

              {activeTab === "MANAGER" ? (
                <div className="space-y-3">
                  <input
                    className="input"
                    placeholder="Manager username"
                    value={mgrUser}
                    onChange={(e) => setMgrUser(e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Password"
                    type="password"
                    value={mgrPass}
                    onChange={(e) => setMgrPass(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={mgrRemember}
                      onChange={(e) => setMgrRemember(e.target.checked)}
                    />
                    <span className="text-xs text-slate-600">
                      Remember me (30 days)
                    </span>
                  </div>
                  <button className="btn-primary w-full" onClick={handleManagerLogin}>
                    Login as Manager
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    className="input"
                    placeholder="Employee username"
                    value={empUser}
                    onChange={(e) => setEmpUser(e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Password"
                    type="password"
                    value={empPass}
                    onChange={(e) => setEmpPass(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={empRemember}
                      onChange={(e) => setEmpRemember(e.target.checked)}
                    />
                    <span className="text-xs text-slate-600">
                      Remember me (30 days)
                    </span>
                  </div>
                  <button className="btn-primary w-full" onClick={handleEmployeeLogin}>
                    Login as Employee
                  </button>
                </div>
              )}

              <div className="mt-4 text-[11px] text-slate-500">
                Admin default: <span className="font-mono">aritra363</span> /{" "}
                <span className="font-mono">Aritra@1234</span> (use Admin Login
                button in the top-right)
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="glass p-4">
              <h3 className="text-sm font-semibold mb-2">About this system</h3>
              <p className="text-xs text-slate-600">
                Real-time task management with Manager and Employee dashboards,
                drag-and-drop boards, and notifications. Built with React,
                Tailwind, Node, SQLite and WebSockets.
              </p>
            </div>

            {adminVisible && (
              <div className="glass p-4">
                <h3 className="text-sm font-semibold mb-3">Admin Login</h3>
                <input
                  className="input mb-2"
                  placeholder="Admin username"
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                />
                <input
                  className="input mb-3"
                  type="password"
                  placeholder="Password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                />
                <button className="btn-primary w-full" onClick={handleAdminLogin}>
                  Login as Admin
                </button>
                <div className="mt-2 text-[11px] text-slate-500">
                  Admin sessions do not persist. Closing the browser ends the
                  session.
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
