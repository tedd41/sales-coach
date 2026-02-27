# 🚀 Quick Start - Sales Coach Intelligence Platform

## ✅ Current Status

- ✅ Backend installed and configured
- ✅ Frontend installed
- ✅ Database created and seeded with demo data
- ⚠️ Azure OpenAI credentials needed

---

## 🔑 Next Steps

### 1. Configure Azure OpenAI (Required)

Edit `backend\.env` with your Azure OpenAI credentials:

```powershell
notepad backend\.env
```

**Update these values:**

```env
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com/
AZURE_OPENAI_API_KEY=YOUR-API-KEY
AZURE_OPENAI_DEPLOYMENT_NAME=YOUR-DEPLOYMENT-NAME
```

> **Get these from**: [Azure Portal](https://portal.azure.com) → Azure OpenAI → Keys and Endpoint

---

### 2. Start the Application

**Terminal 1 - Backend API:**

```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```powershell
cd frontend
npm run dev
```

---

### 3. Access the App

Open browser: **http://localhost:5173**

---

## 🎯 Demo Flow

1. **Dashboard** → View team health and sentiment trends
2. **Click "Anjum"** → See declining performance
3. **Generate Insights** → AI analyzes patterns
4. **Generate Strategy** → Get coaching recommendations
5. **Generate Draft** → Create personalized feedback

---

## 🐛 Troubleshooting

### "Azure OpenAI Error"

- Verify endpoint URL (no trailing slash)
- Check API key is correct
- Confirm deployment name matches Azure Portal

### Database reset needed:

```powershell
cd backend
npx prisma migrate reset
npm run prisma:seed
```

---

## 📊 Demo Data

4 sales reps with realistic patterns:

- **Anjum** - Declining (demonstrates early warning)
- **Anushka** - Top performer (pattern mining)
- **Rahul** - Burnout risk (sentiment detection)
- **Priya** - Improving (coaching impact)

---

## 💡 Pro Tips

- Use **Generate All Three** (Insights → Strategy → Draft) for full demo
- Point out **Coaching Memory** feature (learns from past feedback)
- Show **Sentiment Trends** graph for visual impact
- Compare **Anushka vs Anjum** to demonstrate contrast

---

**Ready to launch! 🎉**

Just add your Azure OpenAI credentials and start the servers!
