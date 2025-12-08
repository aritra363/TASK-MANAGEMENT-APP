import multer from "multer";
import path from "path";
import fs from "fs";

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const baseUploadPath = path.join(__dirname, "..", "..", "uploads");

// Storage writes to uploads/<sub>
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let sub = "others";
    if (req.baseUrl.includes("/admin")) {
      if (req.path.includes("logo")) sub = "company";
      else if (req.path.includes("carousel")) sub = "carousel";
      else if (req.path.includes("profile")) sub = "profiles";
    }
    const dir = path.join(baseUploadPath, sub);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${safe}`);
  }
});

// Accept only JPEG/PNG images — fileFilter will allow only images.
const fileFilter = (req: any, file: any, cb: any) => {
  const allowed = ["image/jpeg", "image/png"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only .png and .jpg images are allowed"), false);
};

// Default limits: 10MB per file
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB default
});
