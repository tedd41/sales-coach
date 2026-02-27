# Sales Coach Intelligence Platform - Setup Guide

## Quick Start (5 Minutes)

### Prerequisites Check

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Azure OpenAI resource created
- [ ] GPT-4o model deployed in Azure

---

## Step-by-Step Setup

### 1️⃣ Install Dependencies

Open PowerShell and navigate to project:

```powershell
# Backend
cd "c:\Users\DevanshTanwar\OneDrive - Razor Technology, LLC\Sales Coach Agent\backend"
npm install

# Frontend (in new terminal)
cd "c:\Users\DevanshTanwar\OneDrive - Razor Technology, LLC\Sales Coach Agent\frontend"
npm install
```

**Expected time**: 2-3 minutes

---

### 2️⃣ Configure Azure OpenAI

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Azure OpenAI resource
3. Go to **Keys and Endpoint**
4. Copy:
   - Endpoint (e.g., `https://your-name.openai.azure.com/`)
   - Key 1 or Key 2
5. Go to **Model deployments** and note your deployment name

---

### 3️⃣ Setup Environment Variables

```powershell
cd backend
Copy-Item .env.example .env
notepad .env
```

**Edit these values in .env:**

```env
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE-NAME.openai.azure.com/
AZURE_OPENAI_API_KEY=YOUR-API-KEY-HERE
AZURE_OPENAI_DEPLOYMENT_NAME=YOUR-DEPLOYMENT-NAME
AZURE_OPENAI_API_VERSION=2024-02-15-preview
PORT=3001
DATABASE_URL="file:./dev.db"
```

⚠️ **Important**:

- Remove any trailing slashes from endpoint
- Use exact deployment name from Azure Portal
- Keep API key secret

---

### 4️⃣ Initialize Database

```powershell
# Make sure you're in backend folder
cd backend

# Generate Prisma client
npx prisma generate

# Create database
npx prisma migrate dev --name init

# Seed with demo data
npm run prisma:seed
```

**Expected output**: "✅ Seed complete!"

---

### 5️⃣ Start the Application

**Terminal 1 - Backend API:**

```powershell
cd backend
npm run dev
```

**Expected output**:

```
🚀 Sales Coach API running on http://localhost:3001
📊 Health check: http://localhost:3001/health
```

**Terminal 2 - Frontend:**

```powershell
cd frontend
npm run dev
```

**Expected output**:

```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
```

---

### 6️⃣ Test the Application

1. Open browser: http://localhost:5173
2. You should see the **Team Intelligence Dashboard**
3. Try these actions:
   - View team sentiment trends
   - Click on "Anjum" (declining rep)
   - Click "Generate" under AI Insights
   - Click "Generate" under Coaching Strategy
   - Click "Generate" under Draft Feedback

---

## ✅ Verification Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Dashboard loads with 4 sales reps
- [ ] Can navigate to rep detail page
- [ ] AI Insights generates successfully
- [ ] No console errors

---

## 🐛 Common Issues

### Issue: "Module not found"

**Solution**: Run `npm install` in both backend and frontend folders

### Issue: "Azure OpenAI Error"

**Solution**:

1. Verify endpoint URL is correct (no trailing slash)
2. Check API key is valid
3. Confirm deployment name matches Azure Portal
4. Check Azure OpenAI resource is not paused

### Issue: "Port already in use"

**Solution**:

- Change PORT in backend/.env to 3002 or another port
- Make sure no other process is using port 3001 or 5173

### Issue: "Prisma Client not generated"

**Solution**: Run `npx prisma generate` in backend folder

### Issue: Database errors

**Solution**:

```powershell
cd backend
npx prisma migrate reset
npm run prisma:seed
```

---

## 🎯 Demo Script

### For Stakeholders:

**"Watch this..."**

1. **Dashboard** - "This shows team health at a glance. See the declining sentiment?"

2. **Click Anjum** - "Here's a rep who's struggling. Notice the sentiment dropping?"

3. **Generate Insights** - "AI analyzes the patterns... it detected outreach challenges."

4. **Generate Strategy** - "Now it creates a personalized coaching plan."

5. **Generate Draft** - "And writes the actual feedback message. Editable, ready to send."

6. **Show History** - "System learns from past coaching. Scales manager expertise."

**Impact**: "This turns reactive coaching into proactive intelligence."

---

## 📊 Demo Data Overview

| Rep     | Profile       | Story                               |
| ------- | ------------- | ----------------------------------- |
| Anjum   | Declining     | Started strong, losing engagement   |
| Anushka | Top Performer | Consistent, personalized approach   |
| Rahul   | Burnout       | Fewer updates, declining metrics    |
| Priya   | Improving     | Applied coaching, results improving |

---

## 🚀 Next Steps

After basic setup works:

1. **Customize Data**: Edit `backend/prisma/seed.ts` with your team data
2. **Adjust Prompts**: Modify `backend/src/services/openaiService.ts`
3. **Add Features**: Refer to API documentation in main README
4. **Deploy**: Consider Azure App Service or similar platform

---

## 💡 Tips for Best Demo

1. **Start with Dashboard** - Show the "wow" factor immediately
2. **Pick Declining Rep** - Demonstrates AI's value (early warning)
3. **Generate ALL three** - Insights → Strategy → Draft (show full flow)
4. **Compare with Top Performer** - Click Anushka to show contrast
5. **Emphasize Learning** - Point out coaching history and memory

---

## 🔐 Security Reminders

- ✅ `.env` is in `.gitignore`
- ✅ Never commit API keys
- ✅ Use environment variables in production
- ✅ Add authentication before public deployment

---

## 📞 Quick Commands Reference

```powershell
# Backend
npm run dev          # Start development server
npm run prisma:studio # View database in browser
npm run prisma:seed  # Reset demo data

# Frontend
npm run dev          # Start development server
npm run build        # Build for production
```

---

**Ready? Let's go! 🚀**

Start both terminals and open http://localhost:5173
