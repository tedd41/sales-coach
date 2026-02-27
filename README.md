# Sales Coach Intelligence Platform

An AI-powered sales coaching platform that helps managers scale effective coaching across their teams using Azure OpenAI.

## 🚀 Features

- **Team Intelligence Dashboard**: Real-time team health monitoring, sentiment trends, and AI-powered alerts
- **Deep Rep Insights**: Individual performance analysis with sentiment tracking and behavioral patterns
- **AI Coaching Assistant**: Generate personalized coaching strategies based on historical data
- **Draft Feedback Generator**: Auto-generate motivating, specific feedback messages
- **Coaching Memory**: Build and reuse effective coaching knowledge across the team

## 🏗 Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn UI
- **Backend**: Express + TypeScript + Prisma ORM
- **Database**: SQLite (easily upgradeable to PostgreSQL/MySQL)
- **AI**: Azure OpenAI GPT-4o

## 📋 Prerequisites

- Node.js 18+ and npm
- Azure OpenAI account with GPT-4o deployment

## 🛠 Setup Instructions

### 1. Clone and Install

```powershell
# Navigate to project root
cd "c:\Users\DevanshTanwar\OneDrive - Razor Technology, LLC\Sales Coach Agent"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Azure OpenAI

1. Create an Azure OpenAI resource in Azure Portal
2. Deploy a GPT-4o model
3. Copy the endpoint and API key

### 3. Setup Environment Variables

```powershell
# In backend folder
cd backend
Copy-Item .env.example .env
```

Edit `backend\.env` and add your Azure OpenAI credentials:

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview
PORT=3001
NODE_ENV=development
DATABASE_URL="file:./dev.db"
```

### 4. Initialize Database

```powershell
# In backend folder
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

### 5. Start the Application

**Terminal 1 - Backend:**

```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```powershell
cd frontend
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Prisma Studio (optional): `npm run prisma:studio` in backend folder

## 📊 Demo Data

The seed script creates 4 sales reps with realistic data:

- **Anjum** - Declining performance (demonstrates early warning detection)
- **Anushka** - Top performer (pattern mining for best practices)
- **Rahul** - Burnout risk (sentiment analysis value)
- **Priya** - Improving rep (coaching impact demonstration)

## 🎯 API Endpoints

### Reps

- `GET /api/v1/reps` - List all reps with sentiment
- `GET /api/v1/reps/:id` - Get rep details
- `GET /api/v1/reps/:id/updates` - Get rep updates
- `GET /api/v1/reps/:id/feedback` - Get coaching history

### Intelligence (Azure OpenAI)

- `POST /api/v1/intelligence/insights` - Generate AI insights
- `POST /api/v1/intelligence/strategy` - Generate coaching strategy
- `POST /api/v1/intelligence/draft` - Generate feedback draft

### Dashboard

- `GET /api/v1/dashboard` - Get team overview

## 🎬 Demo Flow

1. **Dashboard View**: Shows team health index, sentiment trends, and at-risk reps
2. **Click Rep**: Navigate to detailed rep view
3. **Generate Insights**: AI analyzes patterns and identifies challenges
4. **Generate Strategy**: AI creates personalized coaching plan
5. **Generate Draft**: AI writes motivating, specific feedback message
6. **Review History**: See coaching memory and past interventions

## 🔧 Development

```powershell
# Backend development
cd backend
npm run dev          # Start dev server with hot reload
npm run build        # Compile TypeScript
npm run prisma:studio # Open database GUI

# Frontend development
cd frontend
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## 📦 Project Structure

```
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       │   └── openaiService.ts
│       └── index.ts
│
└── frontend/
    └── src/
        ├── components/
        │   └── ui/
        ├── pages/
        │   ├── Dashboard.tsx
        │   └── RepDetails.tsx
        ├── services/
        │   └── api.ts
        └── types/
            └── index.ts
```

## 🚀 Deployment Considerations

### Backend

- Use environment variables for all sensitive data
- Upgrade to PostgreSQL/MySQL for production
- Add authentication and authorization
- Implement rate limiting
- Add request validation and error handling

### Frontend

- Build with `npm run build`
- Serve static files from `dist/` folder
- Configure API proxy for production

### Azure OpenAI Best Practices

- Monitor token usage and costs
- Implement caching for similar queries
- Add retry logic with exponential backoff
- Log diagnostic information for performance tuning

## 🔒 Security Notes

⚠️ **Important**:

- Never commit `.env` files
- Rotate API keys regularly
- Implement proper authentication before production
- Add CORS configuration for production domains

## 📈 Future Enhancements

- Integration with email (Outlook) and Teams
- Real-time notifications
- Advanced analytics and predictions
- Multi-tenant support
- Mobile app
- Performance prediction models
- A/B testing for coaching strategies

## 🐛 Troubleshooting

**Prisma Issues:**

```powershell
npx prisma generate
npx prisma migrate reset
```

**Port Already in Use:**

```powershell
# Change PORT in backend/.env
```

**Azure OpenAI Errors:**

- Verify endpoint URL format
- Check API key is valid
- Confirm deployment name matches
- Review Azure OpenAI quota limits

## 📝 License

MIT

## 👥 Support

For issues or questions, please review the troubleshooting section or check Azure OpenAI documentation.

---

**Built with ❤️ using Azure OpenAI and modern web technologies**
