# Git Commands for Deployment

## 📦 Files Modified Summary

### **New Files Created (4):**
1. `client/src/config/api.js`
2. `client/.env.example`
3. `server/.env.example`
4. `client/vercel.json`

### **Files Modified (25):**

**Frontend (23 files):**
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
- `client/.env` (DO NOT COMMIT - already in .gitignore)

**Backend (2 files):**
- `server/index.js`
- `server/.env` (DO NOT COMMIT - already in .gitignore)

---

## 🚀 Git Commands to Push Changes

```bash
# Navigate to project root
cd /Users/ujwal/Desktop/AnnaSetuTrial

# Check current status
git status

# Stage all new files
git add client/src/config/api.js
git add client/.env.example
git add client/vercel.json
git add server/.env.example
git add DEPLOYMENT_GUIDE.md
git add GIT_COMMANDS.md

# Stage all modified frontend files
git add client/src/context/AuthContext.js
git add client/src/components/AIInsights.jsx
git add client/src/components/AdminMapEnhanced.jsx
git add client/src/components/DonationForm.js
git add client/src/components/FeedbackAnalytics.jsx
git add client/src/components/FeedbackModal.jsx
git add client/src/components/ForgotPassword.js
git add client/src/components/LeafletDonationMap.js
git add client/src/components/ProfileEdit.js
git add client/src/components/Register.js
git add client/src/components/RealTimeNotifications.js
git add client/src/components/chatbot/ChatbotWindow.js

# Stage all modified pages
git add client/src/pages/AdminDashboard.js
git add client/src/pages/DonorDashboard.js
git add client/src/pages/NGODashboard.js
git add client/src/pages/NGOPage.js
git add client/src/pages/ResetPassword.js
git add client/src/pages/UrgentDonations.js
git add client/src/pages/VerifyEmail.js
git add client/src/pages/VolunteerDashboard.js

# Stage backend changes
git add server/index.js

# Verify what will be committed (IMPORTANT: Check .env files are NOT listed)
git status

# Commit with descriptive message
git commit -m "feat: prepare application for production deployment

Changes:
- Add centralized API configuration (client/src/config/api.js)
- Replace all hardcoded localhost URLs with environment variables
- Update all 23 frontend components to use API_BASE_URL
- Configure production CORS settings in backend
- Add .env.example files for frontend and backend
- Add Vercel deployment configuration
- Create deployment guide documentation

Breaking changes: None
Migration: Update environment variables as per .env.example files"

# Push to remote repository
git push origin main

# If this is your first push or you need to set upstream
git push -u origin main
```

---

## ⚠️ IMPORTANT: Verify Before Pushing

Before running `git push`, **VERIFY** that `.env` files are NOT staged:

```bash
# This should show NO .env files
git status | grep ".env$"

# If any .env files appear, unstage them:
git reset HEAD client/.env
git reset HEAD server/.env
```

---

## 🔍 Alternative: Stage All Changes at Once

If you prefer to stage all changes at once:

```bash
cd /Users/ujwal/Desktop/AnnaSetuTrial

# Stage all modified and new files (except ignored files)
git add -A

# Double-check .env files are NOT staged
git status | grep ".env$"

# If clean, commit
git commit -m "feat: prepare application for production deployment

- Add centralized API configuration
- Replace hardcoded localhost URLs with environment variables  
- Update CORS for production
- Add deployment configuration files"

# Push
git push origin main
```

---

## 📊 Verify Changes After Push

```bash
# Check your latest commit
git log -1 --stat

# Verify on GitHub
# Go to: https://github.com/YOUR_USERNAME/YOUR_REPO
# Check the latest commit
```

---

## 🔄 If You Need to Undo (Before Push)

```bash
# Unstage all changes
git reset HEAD

# Or unstage specific file
git reset HEAD client/src/config/api.js

# Discard all local changes (CAREFUL!)
git checkout .
```

---

## 🔄 If You Need to Undo (After Push)

```bash
# Revert the last commit (creates new commit)
git revert HEAD

# Or reset to previous commit (rewrites history - use with caution)
git reset --hard HEAD~1
git push --force origin main
```

---

## ✅ Verification Checklist

Before pushing:
- [ ] All files are staged
- [ ] `.env` files are NOT staged
- [ ] Commit message is descriptive
- [ ] No sensitive data in commit

After pushing:
- [ ] Verified on GitHub
- [ ] CI/CD pipeline passed (if applicable)
- [ ] Ready to deploy to Vercel

---

## 🎯 Next Steps After Git Push

1. **Deploy to Vercel**: Follow `DEPLOYMENT_GUIDE.md`
2. **Update Render**: Set `CLIENT_URL` to your Vercel URL
3. **Test**: Verify all functionality works in production

---

**Ready to deploy! 🚀**
