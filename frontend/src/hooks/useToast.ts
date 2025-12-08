import toast from "react-hot-toast";

export default function useToast() {
  return {
    success: (msg: string) => toast.success(msg, { duration: 3000 }),
    error: (msg: string) => toast.error(msg, { duration: 3000 }),
    info: (msg: string) => toast(msg, { duration: 3000, icon: "ℹ️" }),
    warning: (msg: string) => toast(msg, { duration: 3000, icon: "⚠️" })
  };
}
