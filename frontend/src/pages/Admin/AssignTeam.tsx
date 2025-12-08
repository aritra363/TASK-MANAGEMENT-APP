import React, { useEffect, useState } from "react";
import api from "../../api/api";
import GlassCard from "../../components/GlassCard";
import LoaderOverlay from "../../components/LoaderOverlay";
import Header from "../../components/layout/Header";
import useToast from "../../hooks/useToast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function AssignTeam() {
  const [managers, setManagers] = useState<any[]>([]);
  const [expandedManager, setExpandedManager] = useState<number | null>(null);
  const [unassignedEmployees, setUnassignedEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedManager, setSelectedManager] = useState<number | null>(null);
  const toast = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const m = await api.get("/admin/managers");
      const e = await api.get("/admin/employees");
      
      // Enhance managers with their employees
      const managersWithEmployees = m.data.map((manager: any) => ({
        ...manager,
        employees: e.data.filter((emp: any) => emp.managerId === manager.id)
      }));
      
      setManagers(managersWithEmployees);
      setUnassignedEmployees(e.data.filter((emp: any) => !emp.managerId));
    } catch {
      toast.error("Failed to load managers/employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const assignToManager = async (employeeId: number, managerId: number) => {
    try {
      setLoading(true);
      await api.put(`/admin/users/${employeeId}`, { managerId });
      toast.success("Employee assigned successfully");
      await fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Error assigning employee");
    } finally {
      setLoading(false);
    }
  };

  const unassignEmployee = async (employeeId: number) => {
    try {
      setLoading(true);
      await api.put(`/admin/users/${employeeId}`, { managerId: null });
      toast.success("Employee unassigned successfully");
      await fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Error unassigning employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell flex flex-col min-h-screen">
      {loading && <LoaderOverlay message="Updating assignments..." />}
      <Header role="ADMIN" title="Assign Team Members" showBack={true} />
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Managers with their employees */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Managers & Their Teams</h2>
            {managers.map((manager) => (
              <GlassCard key={manager.id}>
                <div 
                  className="cursor-pointer"
                  onClick={() => setExpandedManager(expandedManager === manager.id ? null : manager.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {manager.profileImage ? (
                        <img
                          src={
                            manager.profileImage.startsWith("http")
                              ? manager.profileImage
                              : `${API_BASE}${manager.profileImage}`
                          }
                          alt={manager.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {manager.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{manager.name}</h3>
                        <p className="text-xs text-slate-500">@{manager.username}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          <span className="font-medium">{manager.employees?.length || 0}</span> employees
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl">
                      {expandedManager === manager.id ? "▼" : "▶"}
                    </div>
                  </div>
                </div>

                {/* Expanded employees list */}
                {expandedManager === manager.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                    {manager.employees && manager.employees.length > 0 ? (
                      manager.employees.map((emp: any) => (
                        <div
                          key={emp.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {emp.profileImage ? (
                              <img
                                src={
                                  emp.profileImage.startsWith("http")
                                    ? emp.profileImage
                                    : `${API_BASE}${emp.profileImage}`
                                }
                                alt={emp.name}
                                className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                {emp.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-slate-900 truncate">
                                {emp.name}
                              </div>
                              <div className="text-xs text-slate-500">@{emp.username}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => unassignEmployee(emp.id)}
                            className="btn-secondary text-xs px-3 py-1 flex-shrink-0"
                          >
                            Unassign
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-3">No employees assigned</p>
                    )}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>

          {/* Unassigned employees */}
          {unassignedEmployees.length > 0 && (
            <GlassCard>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Unassigned Employees</h2>
              <div className="space-y-2">
                {unassignedEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {emp.profileImage ? (
                        <img
                          src={
                            emp.profileImage.startsWith("http")
                              ? emp.profileImage
                              : `${API_BASE}${emp.profileImage}`
                          }
                          alt={emp.name}
                          className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          {emp.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {emp.name}
                        </div>
                        <div className="text-xs text-slate-500">@{emp.username}</div>
                      </div>
                    </div>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          assignToManager(emp.id, Number(e.target.value));
                          e.target.value = "";
                        }
                      }}
                      className="input text-xs px-2 py-1 flex-shrink-0"
                    >
                      <option value="">Assign to...</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {managers.length === 0 && unassignedEmployees.length === 0 && (
            <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg">
              <p className="text-slate-500 text-sm">No managers or employees found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
