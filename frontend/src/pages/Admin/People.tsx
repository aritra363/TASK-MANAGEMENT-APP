import React, { useEffect, useState } from "react";
import api from "../../api/api";
import LoaderOverlay from "../../components/LoaderOverlay";
import Header from "../../components/layout/Header";
import useToast from "../../hooks/useToast";

interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  profileImage?: string;
  address?: string;
  dob?: string;
  password?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Validation functions
const validateName = (name: string): string | null => {
  if (!name?.trim()) return "Name is required";
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  if (name.length > 50) return "Name must be less than 50 characters";
  return null;
};

const validateUsername = (username: string): string | null => {
  if (!username?.trim()) return "Username is required";
  if (username.trim().length < 3) return "Username must be at least 3 characters";
  if (username.length > 20) return "Username must be less than 20 characters";
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) return "Username can only contain letters, numbers, hyphens and underscores";
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password?.trim()) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  if (password.length > 50) return "Password must be less than 50 characters";
  return null;
};

const validateAddress = (address?: string): string | null => {
  if (address && address.length > 100) return "Address must be less than 100 characters";
  return null;
};

const validateDOB = (dob?: string): string | null => {
  if (dob) {
    const date = new Date(dob);
    const today = new Date();
    if (date > today) return "Date of birth cannot be in the future";
    const age = today.getFullYear() - date.getFullYear();
    if (age < 18) return "Must be at least 18 years old";
    if (age > 100) return "Invalid date of birth";
  }
  return null;
};

const validateImage = (file?: any): string | null => {
  if (!file) return null;
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  
  if (file.size > maxSize) return "Image must be less than 5MB";
  if (!allowedTypes.includes(file.type)) return "Only JPEG, PNG, and GIF images are allowed";
  
  return null;
};

export default function People() {
  const [managers, setManagers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<"managers" | "employees">("managers");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<User> & { profileImage?: any }>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const toast = useToast();

  const loadManagers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/managers");
      setManagers(res.data);
    } catch {
      toast.error("Failed to load managers");
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/employees");
      setEmployees(res.data);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagers();
    loadEmployees();
  }, []);

  const handleDelete = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      setLoading(true);
      await api.delete(`/admin/users/${userId}`);
      toast.success("User deleted successfully");
      if (activeTab === "managers") {
        loadManagers();
      } else {
        loadEmployees();
      }
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      username: user.username,
      password: user.password,
      address: user.address,
      dob: user.dob,
      profileImage: user.profileImage,
    });
    if (user.profileImage) {
      setImagePreview(user.profileImage.startsWith("http") ? user.profileImage : `${API_BASE}${user.profileImage}`);
    }
  };

  const handleSave = async () => {
    // Validate all fields
    const nameError = validateName(formData.name || "");
    const passwordError = formData.password ? validatePassword(formData.password) : null;
    const addressError = validateAddress(formData.address);
    const dobError = validateDOB(formData.dob);
    const imageError = formData.profileImage && typeof formData.profileImage !== "string" ? validateImage(formData.profileImage) : null;

    if (nameError || passwordError || addressError || dobError || imageError) {
      toast.error(nameError || passwordError || addressError || dobError || imageError || "Validation failed");
      return;
    }

    try {
      setLoading(true);
      
      // Prepare update data
      const updateData: any = {
        name: formData.name,
        address: formData.address,
        dob: formData.dob,
      };
      
      // Only include password if it was changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      await api.put(`/admin/users/${editingId}`, updateData);
      
      // If there's a new profile image, upload it
      if (formData.profileImage && typeof formData.profileImage !== "string") {
        try {
          const imageData = new FormData();
          imageData.append("profile", formData.profileImage);
          await api.post(`/admin/upload/profile/${editingId}`, imageData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        } catch {
          toast.warning("User updated but profile image upload failed");
        }
      }
      
      toast.success("User updated successfully");
      setEditingId(null);
      setFormData({});
      setImagePreview(null);
      if (activeTab === "managers") {
        loadManagers();
      } else {
        loadEmployees();
      }
    } catch {
      toast.error("Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
    setImagePreview(null);
    setIsAddingNew(false);
  };

  const handleAddNew = async () => {
    // Validate all fields
    const nameError = validateName(formData.name || "");
    const usernameError = validateUsername(formData.username || "");
    const passwordError = validatePassword(formData.password || "");
    const addressError = validateAddress(formData.address);
    const dobError = validateDOB(formData.dob);
    const imageError = formData.profileImage ? validateImage(formData.profileImage) : null;

    if (nameError || usernameError || passwordError || addressError || dobError || imageError) {
      const error = nameError || usernameError || passwordError || addressError || dobError || imageError;
      toast.error(error || "Validation failed");
      return;
    }

    try {
      setLoading(true);
      
      // First, create the user with basic info
      let userId: number;
      try {
        const res = activeTab === "managers"
          ? await api.post("/admin/managers", {
              name: formData.name,
              username: formData.username,
              password: formData.password,
              address: formData.address || "",
              dob: formData.dob || "",
            })
          : await api.post("/admin/employees", {
              name: formData.name,
              username: formData.username,
              password: formData.password,
              address: formData.address || "",
              dob: formData.dob || "",
            });
        userId = res.data.id;
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || `Failed to create ${activeTab === "managers" ? "manager" : "employee"}`;
        toast.error(errorMsg);
        return;
      }
      
      // Then, upload profile image if provided
      if (formData.profileImage) {
        const imageData = new FormData();
        imageData.append("profile", formData.profileImage as any);
        try {
          await api.post(`/admin/upload/profile/${userId}`, imageData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        } catch (err: any) {
          const errorMsg = err?.response?.data?.message || "Profile image upload failed";
          toast.warning(`User created but ${errorMsg}`);
        }
      }
      
      toast.success(`${activeTab === "managers" ? "Manager" : "Employee"} created successfully`);
      setFormData({});
      setImagePreview(null);
      setIsAddingNew(false);
      if (activeTab === "managers") {
        loadManagers();
      } else {
        loadEmployees();
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Failed to create user";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const currentList = activeTab === "managers" ? managers : employees;

  return (
    <div className="app-shell flex flex-col min-h-screen">
      {loading && <LoaderOverlay message="Processing..." />}
      <Header role="ADMIN" title="Managers & Employees" showBack={true} />

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("managers")}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
                activeTab === "managers"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Managers ({managers.length})
            </button>
            <button
              onClick={() => setActiveTab("employees")}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
                activeTab === "employees"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Employees ({employees.length})
            </button>
          </div>

          {/* Add New Button */}
          {!isAddingNew && (
            <button
              onClick={() => {
                setIsAddingNew(true);
                setFormData({});
              }}
              className="btn-primary"
            >
              + Add New {activeTab === "managers" ? "Manager" : "Employee"}
            </button>
          )}

          {/* Add/Edit Form */}
          {(isAddingNew || editingId !== null) && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId !== null ? "Edit" : "Add New"} {activeTab === "managers" ? "Manager" : "Employee"}
              </h3>
              
              {/* Profile Image Preview */}
              {imagePreview && (
                <div className="flex justify-center">
                  <img src={imagePreview} alt="Preview" className="h-24 w-24 rounded-full object-cover border-2 border-indigo-200" />
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username - visible in edit mode too */}
                <input
                  type="text"
                  placeholder="Username"
                  value={formData.username || ""}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={editingId !== null}
                  className="input disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
                
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                />
                
                {/* Password - shown in plain text in edit mode */}
                <input
                  type="text"
                  placeholder="Password"
                  value={formData.password || ""}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                />
                
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                />
                
                <input
                  type="date"
                  value={formData.dob || ""}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="input"
                />
                
                {/* Profile Image Upload - available in both add and edit modes */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({ ...formData, profileImage: file as any });
                      // Show preview
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImagePreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="input"
                  placeholder="Profile Image"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={isAddingNew ? handleAddNew : handleSave}
                  className="btn-primary"
                >
                  {editingId !== null ? "Save Changes" : "Add"}
                </button>
                <button
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                      No {activeTab} found
                    </td>
                  </tr>
                ) : (
                  currentList.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.profileImage ? (
                            <img
                              src={
                                user.profileImage.startsWith("http")
                                  ? user.profileImage
                                  : `${API_BASE}${user.profileImage}`
                              }
                              alt={user.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-xs text-white font-medium">
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-medium text-slate-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{user.username}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{user.address || "—"}</td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          disabled={editingId !== null}
                          className="text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={editingId !== null}
                          className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
