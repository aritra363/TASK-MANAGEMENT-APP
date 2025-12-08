import React, { useEffect, useState } from "react";
import api from "../../api/api";
import GlassCard from "../../components/GlassCard";
import LoaderOverlay from "../../components/LoaderOverlay";
import AppHeader from "../../components/AppHeader";
import useToast from "../../hooks/useToast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function AddPeople() {
  const [managers, setManagers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    name: "",
    password: "",
    role: "MANAGER",
    managerId: ""
  });

  const toast = useToast();

  const fetchLists = async () => {
    try {
      setLoading(true);
      const m = await api.get("/admin/managers");
      const e = await api.get("/admin/employees");
      setManagers(m.data);
      setEmployees(e.data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const validate = () => {
    if (!form.username.trim() || !form.name.trim() || !form.password.trim()) {
      toast.error("Username, name and password are required");
      return false;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const add = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      if (form.role === "MANAGER") {
        await api.post("/admin/managers", {
          username: form.username,
          name: form.name,
          password: form.password
        });
      } else {
        await api.post("/admin/employees", {
          username: form.username,
          name: form.name,
          password: form.password,
          managerId: form.managerId ? Number(form.managerId) : null
        });
      }
      toast.success(
        `${form.role === "MANAGER" ? "Manager" : "Employee"} created`
      );
      setForm({
        username: "",
        name: "",
        password: "",
        role: form.role,
        managerId: ""
      });
      fetchLists();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Error creating user");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: number) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      setLoading(true);
      await api.delete(`/admin/users/${id}`);
      toast.success("User deleted");
      fetchLists();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const uploadProfile = async (userId: number, file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile image max 5MB");
      return;
    }
    const fd = new FormData();
    fd.append("profile", file);
    try {
      setLoading(true);
      await api.post(`/admin/upload/profile/${userId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Profile image updated");
      fetchLists();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      {loading && <LoaderOverlay message="Updating users..." />}
      <AppHeader title="Managers & Employees" />
      <div className="p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard>
            <h3 className="text-sm font-semibold mb-3">
              Add Manager / Employee
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs mb-1">Role</label>
                <select
                  className="input"
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value, managerId: "" })
                  }
                >
                  <option value="MANAGER">Manager</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1">Username</label>
                <input
                  className="input"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Password</label>
                <input
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>
              {form.role === "EMPLOYEE" && (
                <div>
                  <label className="block text-xs mb-1">Manager</label>
                  <select
                    className="input"
                    value={form.managerId}
                    onChange={(e) =>
                      setForm({ ...form, managerId: e.target.value })
                    }
                  >
                    <option value="">Select manager</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.username})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button className="btn-primary" onClick={add}>
                Add
              </button>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-semibold mb-3">Users</h3>
            <div className="text-xs font-semibold mb-2">Managers</div>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-1 pr-3">Photo</th>
                    <th className="py-1 pr-3">Name</th>
                    <th className="py-1 pr-3">Username</th>
                    <th className="py-1 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {managers.map((m) => (
                    <tr key={m.id} className="border-t border-slate-200">
                      <td className="py-1 pr-3">
                        {m.profileImage ? (
                          <img
                            src={
                              m.profileImage.startsWith("http")
                                ? m.profileImage
                                : `${API_BASE}${m.profileImage}`
                            }
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-slate-400">–</span>
                        )}
                      </td>
                      <td className="py-1 pr-3">{m.name}</td>
                      <td className="py-1 pr-3">{m.username}</td>
                      <td className="py-1 pr-3">
                        <div className="flex gap-2 items-center">
                          <label className="text-[10px] cursor-pointer">
                            <span className="btn-secondary px-2 py-1 text-[10px]">
                              Upload photo
                            </span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg"
                              className="hidden"
                              onChange={(e) =>
                                uploadProfile(
                                  m.id,
                                  e.target.files?.[0] ?? null
                                )
                              }
                            />
                          </label>
                          <button
                            className="btn-secondary px-2 py-1 text-[10px]"
                            onClick={() => deleteUser(m.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {managers.length === 0 && (
                    <tr>
                      <td
                        className="py-2 text-slate-500"
                        colSpan={4}
                      >
                        No managers yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-xs font-semibold mb-2">Employees</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-1 pr-3">Photo</th>
                    <th className="py-1 pr-3">Name</th>
                    <th className="py-1 pr-3">Username</th>
                    <th className="py-1 pr-3">ManagerId</th>
                    <th className="py-1 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e) => (
                    <tr key={e.id} className="border-t border-slate-200">
                      <td className="py-1 pr-3">
                        {e.profileImage ? (
                          <img
                            src={
                              e.profileImage.startsWith("http")
                                ? e.profileImage
                                : `${API_BASE}${e.profileImage}`
                            }
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-slate-400">–</span>
                        )}
                      </td>
                      <td className="py-1 pr-3">{e.name}</td>
                      <td className="py-1 pr-3">{e.username}</td>
                      <td className="py-1 pr-3">
                        {e.managerId ? e.managerId : "–"}
                      </td>
                      <td className="py-1 pr-3">
                        <div className="flex gap-2 items-center">
                          <label className="text-[10px] cursor-pointer">
                            <span className="btn-secondary px-2 py-1 text-[10px]">
                              Upload photo
                            </span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg"
                              className="hidden"
                              onChange={(ev) =>
                                uploadProfile(
                                  e.id,
                                  ev.target.files?.[0] ?? null
                                )
                              }
                            />
                          </label>
                          <button
                            className="btn-secondary px-2 py-1 text-[10px]"
                            onClick={() => deleteUser(e.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td
                        className="py-2 text-slate-500"
                        colSpan={5}
                      >
                        No employees yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
