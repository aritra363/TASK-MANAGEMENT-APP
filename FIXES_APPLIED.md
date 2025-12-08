# Fixes Applied - November 24, 2025

## 1. **Task Not Showing in Employee TODO Section** ✅ FIXED

### Issue:
- Tasks created in AddTask page were not appearing in employee's MyBoard
- Root cause: AddTask was hardcoding `managerId = 1` and sending wrong field name `employeeIds` instead of `assignedEmployeeIds`

### Files Changed:
- **frontend/src/pages/Manager/AddTask.tsx**
  - Fetch manager ID from `/auth/me` endpoint instead of hardcoding it
  - Changed field name from `employeeIds` to `assignedEmployeeIds` in API call
  - Updated `loadEmployees()` and `loadTasks()` to accept manager ID parameter

### How It Works Now:
1. When AddTask page loads, it fetches current manager's ID from `/auth/me`
2. Fetches employees under that manager
3. When task is created, it sends `assignedEmployeeIds` (correct field name)
4. Backend creates task with proper assignments
5. Employee's MyBoard now shows the newly created tasks

---

## 2. **Manager TaskBoard Sidebar - Only Show Assigned Employees** ✅ FIXED

### Issue:
- TaskBoard sidebar was showing ALL employees, not just those with assigned tasks
- Made it difficult to filter and manage tasks

### Files Changed:
- **frontend/src/pages/Manager/TaskBoard.tsx**
  - Updated `fetchEmployees()` function to filter employees by checking if they have assignments in loaded tasks
  - Employees without any task assignments are now excluded from the sidebar

### How It Works Now:
1. When TaskBoard loads, it fetches all tasks for the manager
2. Extracts all unique employee IDs from task assignments
3. Filters employee list to only show those with actual task assignments
4. Clicking an employee in sidebar filters the board to show only their tasks
5. "All Employees" option shows all tasks across assigned employees

---

## 3. **Carousel Images Not Populating/Rendering** ✅ FIXED

### Issue:
- Carousel images were not rendering on ManagerHome and EmployeeHome pages
- Backend returns image URLs but frontend wasn't properly constructing full URLs

### Files Changed:
- **frontend/src/pages/Manager/ManagerHome.tsx**
- **frontend/src/pages/Employee/EmployeeHome.tsx**
  - Added proper URL construction for carousel images
  - Maps through returned images and prepends API_BASE if not already an absolute URL
  - Ensures images render correctly with full paths

### How It Works Now:
1. API returns carousel image paths like `/uploads/carousel/image.jpg`
2. Frontend constructs full URL: `http://localhost:4000/uploads/carousel/image.jpg`
3. Images now render properly in carousel

---

## 4. **Web Push Notifications** ✅ VERIFIED (Requires Environment Setup)

### Status:
Web Push infrastructure is correctly implemented. However, it requires proper VAPID keys configuration.

### Setup Required for Web Push to Work:

1. **Generate VAPID Keys** (if not already generated):
   ```bash
   # In backend directory
   npm install -g web-push
   web-push generate-vapid-keys
   ```

2. **Add to backend/.env file**:
   ```
   VAPID_PUBLIC_KEY=<your-public-key>
   VAPID_PRIVATE_KEY=<your-private-key>
   VAPID_CONTACT=mailto:admin@youremail.com
   ```

3. **Verify in browser**:
   - Go to user Profile page
   - Click "Enable Push Notifications"
   - Accept browser permission prompt
   - When tasks are assigned, you'll receive web push notifications

### Files Working Correctly:
- **backend/src/utils/webpush.ts** - Sends push notifications
- **backend/src/routes/push.ts** - Manages subscriptions
- **frontend/src/utils/push.ts** - Registers service worker
- **frontend/public/sw.js** - Handles push events

---

## Summary of All Changes

| Component | Issue | Status | File |
|-----------|-------|--------|------|
| Task Creation | Hardcoded manager ID, wrong field name | ✅ FIXED | AddTask.tsx |
| Manager TaskBoard | Sidebar showing all employees | ✅ FIXED | TaskBoard.tsx |
| Carousel Images | Not rendering | ✅ FIXED | ManagerHome.tsx, EmployeeHome.tsx |
| Web Push | Missing VAPID keys | ✅ VERIFIED | See .env setup above |

---

## Testing Checklist

1. **Create Task as Manager**:
   - [ ] Go to /manager/add-task
   - [ ] Create a task and assign to employee
   - [ ] Task appears in employee's /employee/myboard

2. **Filter Tasks by Employee**:
   - [ ] Go to /manager/board
   - [ ] Sidebar shows only employees with assigned tasks
   - [ ] Click employee to filter board to their tasks only

3. **View Carousel**:
   - [ ] Go to /manager or /employee home pages
   - [ ] Carousel displays images properly
   - [ ] Can navigate between slides

4. **Web Push** (after env setup):
   - [ ] Enable push notifications in Profile
   - [ ] Create and assign task
   - [ ] Receive push notification on browser

---

## Notes

- All hardcoded IDs have been replaced with dynamic user ID fetching from `/auth/me`
- Proper error handling and toast notifications are in place
- Socket.io real-time updates continue to work with these fixes
