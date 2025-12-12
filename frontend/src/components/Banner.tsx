import { useState, useEffect } from "react";
import api from "../api/api";
import { socket } from "../socket/socket";

interface User {
  id: number;
  name: string;
  dob?: string;
}

export default function Banner() {
  const [bannerText, setBannerText] = useState("Welcome to our company!");
  const [birthdayName, setBirthdayName] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async (retries = 3) => {
      try {
        await api.get("/auth/me");
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (err: any) {
        // Retry logic for network errors
        if (retries > 0 && err?.code === "ERR_NETWORK") {
          setTimeout(() => checkAuth(retries - 1), 1000);
          return;
        }
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const loadBannerData = async () => {
    try {
      // Fetch company banner text
      const companyRes = await api.get("/admin/company");
      // Set empty string if bannerText is not provided or is empty
      setBannerText(companyRes.data.bannerText || "");

      // Fetch all users to check for birthdays
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentDate = today.getDate();

      let foundBirthday = false;

      try {
        // Check employees for birthdays
        const usersRes = await api.get("/admin/employees");
        console.log("Employees data:", usersRes.data);
        
        const birthdayUser = usersRes.data.find((user: User) => {
          if (!user.dob) return false;
          const dob = new Date(user.dob);
          console.log(`Checking employee ${user.name}: DOB=${dob.toDateString()}, Today=${today.toDateString()}`);
          return dob.getMonth() === currentMonth && dob.getDate() === currentDate;
        });

        if (birthdayUser) {
          console.log("Found birthday user (employee):", birthdayUser.name);
          setBirthdayName(birthdayUser.name);
          foundBirthday = true;
        }
      } catch (empErr) {
        console.warn("Failed to load employees:", empErr);
      }

      // If no birthday found among employees, check managers
      if (!foundBirthday) {
        try {
          const managersRes = await api.get("/admin/managers");
          console.log("Managers data:", managersRes.data);
          
          const birthdayManager = managersRes.data.find((user: User) => {
            if (!user.dob) return false;
            const dob = new Date(user.dob);
            console.log(`Checking manager ${user.name}: DOB=${dob.toDateString()}, Today=${today.toDateString()}`);
            return dob.getMonth() === currentMonth && dob.getDate() === currentDate;
          });

          if (birthdayManager) {
            console.log("Found birthday user (manager):", birthdayManager.name);
            setBirthdayName(birthdayManager.name);
            foundBirthday = true;
          }
        } catch (mgrErr) {
          console.warn("Failed to load managers:", mgrErr);
        }
      }

      // Clear birthday if none found
      if (!foundBirthday) {
        setBirthdayName(null);
      }
    } catch (err) {
      console.error("Failed to load banner data:", err);
    }
  };

  useEffect(() => {
    // Only load banner data if authenticated
    if (!isAuthenticated || isLoading) return;

    // Initial load
    loadBannerData();

    // Connect to socket
    if (!socket.connected) {
      socket.connect();
    }

    // Listen for real-time company updates
    socket.on("company_updated", (data: any) => {
      console.log("Company updated via socket:", data);
      // Clear banner when admin sets it to empty
      setBannerText(data.bannerText || "");
    });

    // Listen for user creation and updates to refresh birthday detection
    socket.on("user_created", () => {
      console.log("User created - refreshing birthday detection");
      loadBannerData();
    });

    socket.on("user_updated", () => {
      console.log("User updated - refreshing birthday detection");
      loadBannerData();
    });

    // Refresh every hour to check for birthdays and updated banner text
    const interval = setInterval(loadBannerData, 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
      socket.off("company_updated");
      socket.off("user_created");
      socket.off("user_updated");
    };
  }, [isAuthenticated, isLoading]);

  // Don't show banner if not authenticated or still loading
  if (!isAuthenticated || isLoading) {
    return null;
  }

  const displayText = birthdayName
    ? `🎉 Happy Birthday ${birthdayName}! 🎉 • ${bannerText}`
    : bannerText;

  // Don't render banner if both bannerText is empty and no birthday
  if (!bannerText?.trim() && !birthdayName) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white overflow-hidden">
      <style>{`
        @keyframes scrollLeftToRight {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .banner-scroll {
          animation: scrollLeftToRight 50s linear infinite;
          white-space: nowrap;
          display: inline-block;
        }
        .banner-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          position: relative;
        }
      `}</style>
      <div className="py-3 px-4 flex items-center justify-center relative h-16 overflow-hidden">
        <div className="banner-container">
          <div className="banner-scroll text-center font-semibold text-lg md:text-xl tracking-wider">
            {displayText}
          </div>
        </div>
      </div>
    </div>
  );
}
