import React, { useEffect, useState } from "react";
import api from "../../api/api";
import GlassCard from "../../components/GlassCard";
import LoaderOverlay from "../../components/LoaderOverlay";
import Header from "../../components/layout/Header";
import useToast from "../../hooks/useToast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function CompanyEdit() {
  const [company, setCompany] = useState<any>({
    name: "",
    logo: "",
    carouselImages: [],
    bannerText: "Welcome to our company!"
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [carouselPreviews, setCarouselPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const load = async () => {
    try {
      setLoading(true);
      const r = await api.get("/admin/company");
      setCompany(r.data);
      if (r.data.logo) {
        setLogoPreview(
          r.data.logo.startsWith("http")
            ? r.data.logo
            : `${API_BASE}${r.data.logo}`
        );
      }
      if (r.data.carouselImages?.length > 0) {
        setCarouselPreviews(
          r.data.carouselImages.map((img: string) =>
            img.startsWith("http") ? img : `${API_BASE}${img}`
          )
        );
      }
    } catch {
      toast.error("Failed to load company details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const len = company.name?.trim().length || 0;
    if (len < 5) {
      newErrors.name = "Company name must be at least 5 characters";
    } else if (len > 50) {
      newErrors.name = "Company name must not exceed 50 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const save = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors");
      return;
    }
    try {
      setLoading(true);
      await api.put("/admin/company", company);
      toast.success("Company details saved successfully");
    } catch {
      toast.error("Failed to save company details");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = async (file: File | null) => {
    if (!file) return;

    // Validation
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be ≤ 5MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    const fd = new FormData();
    fd.append("logo", file);
    try {
      setLoading(true);
      const r = await api.post("/admin/upload/logo", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setCompany(r.data);
      toast.success("Logo uploaded successfully");
    } catch (e: any) {
      setLogoPreview(null);
      toast.error(e?.response?.data?.message || "Logo upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCarouselChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f.type.startsWith("image/")) {
        toast.warning(`${f.name} is not an image file, skipping`);
        continue;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.warning(`${f.name} exceeds 5MB limit, skipping`);
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length === 0) {
      toast.error("No valid image files selected");
      return;
    }

    // Show previews
    const newPreviews: string[] = [...carouselPreviews];
    const readers: Promise<void>[] = [];

    validFiles.forEach((file) => {
      readers.push(
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            newPreviews.push(e.target?.result as string);
            resolve();
          };
          reader.readAsDataURL(file);
        })
      );
    });

    await Promise.all(readers);
    setCarouselPreviews(newPreviews);

    // Upload
    const fd = new FormData();
    validFiles.forEach((f) => fd.append("images", f));
    try {
      setLoading(true);
      const r = await api.post("/admin/upload/carousel", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setCompany(r.data);
      toast.success(`${validFiles.length} carousel image(s) uploaded successfully`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Carousel upload failed");
    } finally {
      setLoading(false);
    }
  };

  const removeCarouselImage = async (index: number) => {
    const imageToRemove = company.carouselImages[index];
    
    try {
      setLoading(true);
      // Call API to delete the image
      await api.delete(`/admin/carousel/${encodeURIComponent(imageToRemove)}`);
      
      // Remove from state
      const newImages = company.carouselImages.filter(
        (_: string, i: number) => i !== index
      );
      const newPreviews = carouselPreviews.filter(
        (_: string, i: number) => i !== index
      );
      setCompany({ ...company, carouselImages: newImages });
      setCarouselPreviews(newPreviews);
      toast.success("Image removed from carousel");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to remove image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell flex flex-col min-h-screen">
      {loading && <LoaderOverlay message="Processing..." />}
      <Header role="ADMIN" title="Company Settings" showBack={true} />
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <GlassCard>
            <div className="space-y-6 text-sm">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-medium mb-2 text-slate-900">
                  Company Name *
                </label>
                <input
                  className={`input w-full ${errors.name ? "border-red-400" : ""}`}
                  value={company.name || ""}
                  onChange={(e) => {
                    setCompany({ ...company, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: "" });
                  }}
                  placeholder="Enter company name"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  5–50 characters recommended
                </p>
              </div>

              {/* Banner Text */}
              <div>
                <label className="block text-xs font-medium mb-2 text-slate-900">
                  Banner Text (Running Text)
                </label>
                <input
                  type="text"
                  className="input w-full"
                  value={company.bannerText || ""}
                  onChange={(e) => {
                    setCompany({ ...company, bannerText: e.target.value });
                  }}
                  placeholder="Enter text to display on running banner"
                  maxLength={200}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {(company.bannerText || "").length}/200 characters - This text will scroll continuously on the banner at the top
                </p>
              </div>

              {/* Company Logo */}
              <div>
                <label className="block text-xs font-medium mb-2 text-slate-900">
                  Company Logo (jpg/png ≤ 5MB)
                </label>
                <div className="flex items-end gap-4">
                  <label className="cursor-pointer flex-1">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-indigo-400 transition">
                      <div className="text-xs text-slate-600">
                        Click to upload or drag & drop
                      </div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) =>
                          handleLogoChange(e.target.files?.[0] ?? null)
                        }
                        className="hidden"
                      />
                    </div>
                  </label>
                  {logoPreview && (
                    <div className="flex flex-col items-center">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-16 w-16 rounded object-cover border border-slate-200 shadow-sm"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Preview</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Carousel Images */}
              <div>
                <label className="block text-xs font-medium mb-2 text-slate-900">
                  Carousel Images (multiple, jpg/png ≤ 5MB each)
                </label>
                <label className="cursor-pointer block mb-3">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-indigo-400 transition">
                    <div className="text-xs text-slate-600">
                      Click to upload or drag & drop
                      <br />
                      <span className="text-[10px] text-slate-500">
                        Add multiple images
                      </span>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg"
                      onChange={(e) => handleCarouselChange(e.target.files)}
                      className="hidden"
                    />
                  </div>
                </label>

                {carouselPreviews.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600">
                      {carouselPreviews.length} image(s) in carousel
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {carouselPreviews.map((preview, idx) => (
                        <div
                          key={idx}
                          className="relative group rounded-lg overflow-hidden border border-slate-200 shadow-sm"
                        >
                          <img
                            src={preview}
                            alt={`Carousel ${idx + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          <button
                            onClick={() => removeCarouselImage(idx)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={save}
                className="btn-primary w-full mt-6"
              >
                Save Company Settings
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
