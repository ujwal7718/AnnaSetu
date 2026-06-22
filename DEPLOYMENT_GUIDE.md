# AnnaSetu Deployment Guide

## ✅ Deployment Preparation Complete

Your AnnaSetu MERN application is now ready for deployment to Vercel (frontend) and Render (backend).

---

## 📋 Summary of Changes

### **Files Created:**
1. `client/src/config/api.js` - Centralized API configuration
2. `client/.env.example` - Frontend environment variables template
3. `server/.env.example` - Backend environment variables template
4. `client/vercel.json` - Vercel deployment configuration

### **Files Modified:**

#### **Frontend Components (23 files):**
- `client/src/context/AuthContext.js`
- `client/src/components/AIInsights.jsx`
- `client/src/components/AdminMapEnhanced.jsx`
- `client/src/components/DonationForm.js`
- `client/src/components/FeedbackAnalytics.jsx`
- `client/src/components/FeedbackModal.jsx`
- `client/src/components/ForgotPassword.js`
- `client/src/components/LeafletDonationMap.js`
- `client/src/components/ProfileEdit.js`
- `client/src/components/Register.js`
- `client/src/components/RealTimeNotifications.js`
- `client/src/components/chatbot/ChatbotWindow.js`
- `client/src/pages/AdminDashboard.js`
- `client/src/pages/DonorDashboard.js`
- `client/src/pages/NGODashboard.js`
- `client/src/pages/NGOPage.js`
- `client/src/pages/ResetPassword.js`
- `client/src/pages/UrgentDonations.js`
- `client/src/pages/VerifyEmail.js`
- `client/src/pages/VolunteerDashboard.js`

#### **Backend Files (2 files):**
- `server/index.js` - Updated CORS configuration for production
- `server/socket.js` - Already uses CLIENT_URL environment variable

#### **Configuration:**
- `client/.env` - Updated with production API URL

---

## 🚀 Deployment Steps

### **Backend is Already Deployed ✅**
- URL: `https://annasetu-8a81.onrender.com`
- Status: Live and running

### **Frontend Deployment to Vercel**

#### **Step 1: Prepare Local Repository**

```bash
cd /Users/ujwal/Desktop/AnnaSetuTrial

# Stage all modified files
git add client/src/config/api.js
git add client/src/context/AuthContext.js
git add client/src/components/*.js client/src/components/*.jsx
git add client/src/pages/*.js
git add client/src/components/chatbot/ChatbotWindow.js
git add client/.env.example
git add client/vercel.json
git add server/.env.example
git add server/index.js

# Commit changes
git commit -m "feat: prepare frontend for Vercel deployment

- Add centralized API configuration
- Replace all hardcoded localhost URLs with environment variables
- Update CORS configuration for production
- Add .env.example files for both frontend and backend
- Configure Vercel deployment settings"

# Push to GitHub
git push origin main
```

#### **Step 2: Deploy to Vercel**

**Option A: Using Vercel CLI**

```bash
# Install Vercel CLI globally (if not already installed)
npm install -g vercel

# Navigate to client directory
cd client

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel --prod
```

**Option B: Using Vercel Dashboard (Recommended)**

1. Go to [https://vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

5. **Add Environment Variables**:
   ```
   REACT_APP_API_URL=https://annasetu-8a81.onrender.com
   REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_key_here
   ```

6. Click "Deploy"

---

## 🔧 Backend Configuration (Render)

Your backend needs to be updated with the frontend URL for CORS.

### **Update Environment Variables on Render:**

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Select your `annasetu` service
3. Go to "Environment" tab
4. Add/Update this variable:
   ```
   CLIENT_URL=https://your-vercel-app.vercel.app
   ```
   (Replace with your actual Vercel URL after deployment)

5. Click "Save Changes"
6. Render will automatically redeploy

---

## 🧪 Testing After Deployment

### **1. Test API Connection**
```bash
# Test backend health
curl https://annasetu-8a81.onrender.com/health

# Should return: {"status":"Server is running",...}
```

### **2. Test Frontend**
Visit your Vercel URL and verify:
- ✅ Homepage loads correctly
- ✅ Login/Register works
- ✅ Dashboard loads without errors
- ✅ API calls succeed (check Network tab in DevTools)
- ✅ Real-time notifications work (Socket.IO)
- ✅ Image uploads work
- ✅ Maps display correctly

### **3. Check Browser Console**
- Open DevTools → Console
- Should see no errors related to API calls
- Socket.IO should connect successfully

---

## 🔍 Troubleshooting

### **CORS Errors**
If you see CORS errors:
1. Verify `CLIENT_URL` on Render matches your Vercel URL exactly
2. Ensure no trailing slashes
3. Restart backend service on Render

### **404 on Page Refresh**
Already handled by `vercel.json` rewrites configuration.

### **API Calls Failing**
1. Check `REACT_APP_API_URL` in Vercel environment variables
2. Verify backend is running: `https://annasetu-8a81.onrender.com/health`
3. Check Network tab for actual API endpoint being called

### **Socket.IO Not Connecting**
1. Verify backend CORS allows your frontend origin
2. Check browser console for WebSocket errors
3. Ensure authentication token is valid

---

## 📝 Environment Variables Reference

### **Frontend (Vercel)**
```env
REACT_APP_API_URL=https://annasetu-8a81.onrender.com
REACT_APP_GOOGLE_MAPS_API_KEY=your_key
```

### **Backend (Render)**
```env
MONGODB_URI=mongodb+srv://...
PORT=5001
JWT_SECRET=your_secret
GEMINI_API_KEY=your_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=AnnaSetu <your_email@gmail.com>
CLIENT_URL=https://your-vercel-app.vercel.app
NODE_ENV=production
```

---

## 🎉 Deployment Checklist

- [x] Centralized API configuration created
- [x] All hardcoded URLs replaced with environment variables
- [x] CORS configured for production
- [x] `.env.example` files created
- [x] `.gitignore` configured (secrets not exposed)
- [x] Vercel configuration added
- [ ] Code committed and pushed to GitHub
- [ ] Frontend deployed to Vercel
- [ ] Backend `CLIENT_URL` updated on Render
- [ ] End-to-end testing completed

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check Vercel deployment logs
3. Check Render deployment logs
4. Verify all environment variables are set correctly

---

## 🔗 Quick Links

- **Frontend**: https://your-app.vercel.app (after deployment)
- **Backend**: https://annasetu-8a81.onrender.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com

---

**Deployment prepared successfully! 🚀**
