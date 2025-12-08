# Troubleshooting Guide - Task Management System

## If Tasks Still Don't Appear in Employee's MyBoard

### Debugging Steps:

1. **Check Browser Console** (F12):
   - Look for any error messages
   - Check Network tab to see API calls

2. **Verify Task Creation**:
   - In AddTask page, ensure you see "Task created successfully!" toast
   - Check that employees are shown in the form (if not, manager might not have assigned employees)

3. **Check Manager/Employee Assignment**:
   - Go to Admin → Assign Team Members
   - Verify employees are assigned to the current manager
   - If no employees, no tasks can be created

4. **Clear Browser Cache**:
   - Hard refresh: Ctrl+Shift+R (Windows)
   - Or go to DevTools Settings → Network → Disable cache

5. **Check Socket Connection**:
   - In Browser Console, type: `socket.connected`
   - Should return `true` if socket.io is connected
   - If false, may need to restart backend server

---

## If Carousel Images Don't Show

### Debugging Steps:

1. **Check Image Upload**:
   - Go to Admin → Company Settings
   - Upload images using the carousel upload section
   - Should see "X carousel image(s) uploaded successfully"

2. **Verify File System**:
   - Check if `backend/uploads/carousel/` folder exists
   - Images should be physically present there

3. **Check Image Paths**:
   - Open Network tab (F12)
   - Look at image requests
   - Should see requests to `/uploads/carousel/filename.jpg`
   - If 404 errors, images weren't uploaded properly

4. **Test API Response**:
   - In browser console, run:
   ```javascript
   fetch('http://localhost:4000/admin/company')
     .then(r => r.json())
     .then(d => console.log(d.carouselImages))
   ```
   - Should show array of image paths

---

## If Web Push Notifications Don't Work

### Checklist:

1. **Environment Variables Set** (.env file in backend):
   ```
   VAPID_PUBLIC_KEY=your_key_here
   VAPID_PRIVATE_KEY=your_key_here
   VAPID_CONTACT=mailto:your_email@example.com
   ```

2. **Backend Running**:
   - Restart backend: `npm run dev` in backend folder
   - Should show no errors on startup

3. **Browser Permission**:
   - Profile page should ask for notification permission
   - Must click "Allow" for notifications to work

4. **Test Push Endpoint**:
   - Create a task and assign it
   - Should see task in employee's MyBoard
   - Should receive browser notification (or in system if browser is closed)

5. **Check Service Worker**:
   - DevTools → Application → Service Workers
   - Should show active service worker for http://localhost:4000

---

## If Manager TaskBoard Sidebar Shows Wrong Employees

### Issue:
- Sidebar might still show all employees even after fix

### Solution:
1. Hard refresh the page (Ctrl+Shift+R)
2. Ensure employees have at least one task assignment
3. Check that tasks were created with proper employee IDs

### Manual Fix if Needed:
1. Clear browser storage:
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```
2. Reload page

---

## If Tasks Don't Update in Real-Time

### Socket.io Connection Issues:

1. **Check Backend Server**:
   - Terminal should show "Backend running on http://localhost:4000"
   - No error messages about socket initialization

2. **Check Frontend Socket**:
   - Browser Console: `socket.listeners('task_created')`
   - Should return array of listeners (not empty)

3. **Restart Both Servers**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend  
   cd frontend
   npm run dev
   ```

4. **Check CORS**:
   - Backend should have proper CORS configuration
   - Frontend URL should be in CORS whitelist

---

## If Employee Can't See MyBoard

### Possible Issues:

1. **Not Logged In as Employee**:
   - Go to /login
   - Use employee credentials (not manager)
   - Switch to "EMPLOYEE" tab on login form

2. **No Tasks Assigned**:
   - As a manager, create and assign tasks to this employee
   - Employee's board will be empty until tasks are assigned

3. **Wrong User ID Detected**:
   - Check browser console:
   ```javascript
   fetch('http://localhost:4000/auth/me').then(r => r.json()).then(console.log)
   ```
   - Verify user ID matches actual logged-in user

---

## Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Failed to load employees" | Manager has no employees assigned | Go to Admin → Assign Team, assign employees |
| "Failed to create task" | Validation errors | Check task title (3-100 chars), select employees |
| "GET /uploads/carousel/... 404" | Images not uploaded | Reupload carousel images in Company Settings |
| "No tasks here yet" | Normal state | Create tasks as manager and assign to employee |
| "No colleagues available" | Employee not in a team | Admin must assign employee to a manager |

---

## Quick Recovery Steps

If everything seems broken, follow this order:

1. **Restart Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Restart Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Hard Refresh Browser**:
   - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

4. **Clear Cache**:
   ```javascript
   // In browser console:
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

5. **Verify Backend is Running**:
   - Visit http://localhost:4000/health
   - Should see `{"status":"ok"}`

6. **Verify Frontend is Running**:
   - Visit http://localhost:5173
   - Should see login page

---

## Testing With Sample Data

To quickly test the system:

1. **Create Manager Account** (if not exists):
   - Admin → Add People → Create manager with username "manager1"

2. **Create Employee Account**:
   - Admin → Add People → Create employee with username "employee1"

3. **Assign Employee to Manager**:
   - Admin → Assign Team → Select manager1, assign employee1

4. **Upload Carousel Images**:
   - Admin → Company Settings → Upload images

5. **Create Task**:
   - Login as manager1 → Add Task → Create task, assign to employee1

6. **View Task as Employee**:
   - Logout, login as employee1 → My Progress Board
   - Should see the created task
