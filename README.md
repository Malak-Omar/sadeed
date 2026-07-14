# BestMatch 🎯

**AI-Powered Fair CV Screening** — bilingual (Arabic/English), bias-free, RAG-enhanced.

Built with **Claude AI** (claude-sonnet-4-6) · **Gemini Embeddings** (text-embedding-004) · **FAISS** · **Microsoft Presidio** · **FastAPI** · **React + Tailwind**

---

## Features

| Feature | Details |
|---|---|
| 📄 CV Upload | Drag-and-drop, up to 10 PDFs |
| 🔒 Anonymization | Microsoft Presidio removes names, emails, phones, addresses |
| 🤖 Auto Ranking | RAG + Claude ranks candidates by skills against job description |
| 💬 Smart Chat | Natural language HR queries answered with RAG context |
| 🌍 Bilingual | Full Arabic (RTL) / English (LTR) support |
| 🔓 Identity Reveal | PII locked until HR explicitly clicks Reveal |
| ⚖️ Bias Report | Fair Hiring Report shown after every analysis |

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 20+

### 1. Clone & configure environment

```bash
git clone <repo-url>
cd meritwatch
cp .env.example .env
# Edit .env and fill in your API keys
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_lg   # Required by Presidio

cd ..   # back to meritwatch/
uvicorn backend.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev        # Starts on http://localhost:5173  (proxies API to :8000)
```

Open **http://localhost:5173** in your browser.

---

## Environment Variables

| Variable | Description | Where to get |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API key | https://console.anthropic.com/ |
| `GEMINI_API_KEY` | Gemini Embeddings key | https://aistudio.google.com/app/apikey |

---

## Docker

### Build and run locally

```bash
# Copy and fill env file
cp .env.example .env

# Build image
docker build -t bestmatch .

# Run
docker run -p 8000:8000 --env-file .env bestmatch
```

App available at **http://localhost:8000**

### Docker Compose

```bash
docker-compose up --build
```

---

## Azure App Service Deployment

### Prerequisites
- Azure CLI installed: `az login`
- Azure Container Registry (ACR) or Docker Hub account

### Steps

```bash
# 1. Create resource group & App Service Plan
az group create --name bestmatch-rg --location eastus
az appservice plan create --name bestmatch-plan --resource-group bestmatch-rg \
  --is-linux --sku B2

# 2. Create Web App
az webapp create --name bestmatch-app --resource-group bestmatch-rg \
  --plan bestmatch-plan --deployment-container-image-name bestmatch:latest

# 3. Push image to ACR
az acr create --name bestmatchregistry --resource-group bestmatch-rg --sku Basic
az acr login --name bestmatchregistry
docker tag bestmatch bestmatchregistry.azurecr.io/bestmatch:latest
docker push bestmatchregistry.azurecr.io/bestmatch:latest

# 4. Configure Web App to use ACR
az webapp config container set --name bestmatch-app --resource-group bestmatch-rg \
  --docker-custom-image-name bestmatchregistry.azurecr.io/bestmatch:latest \
  --docker-registry-server-url https://bestmatchregistry.azurecr.io

# 5. Set environment variables
az webapp config appsettings set --name bestmatch-app --resource-group bestmatch-rg \
  --settings ANTHROPIC_API_KEY="sk-ant-..." GEMINI_API_KEY="AIza..."

# 6. Enable managed identity (recommended) & restart
az webapp identity assign --name bestmatch-app --resource-group bestmatch-rg
az webapp restart --name bestmatch-app --resource-group bestmatch-rg
```

App runs at: `https://bestmatch-app.azurewebsites.net`

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Upload CVs (multipart) + job description |
| `GET` | `/ranking` | Get AI-generated candidate rankings |
| `POST` | `/chat` | Ask HR question, get RAG answer |
| `POST` | `/reveal/{id}` | Reveal original PII for candidate |
| `GET` | `/health` | Health check |

---

## Architecture

```
HR uploads CVs + JD
        │
        ▼
┌──────────────────┐
│  PDF Extraction  │  pymupdf
│  (pdf_reader.py) │
└────────┬─────────┘
         │ raw text
         ▼
┌──────────────────┐
│  Anonymization   │  Microsoft Presidio
│  (anonymizer.py) │  Names → "Candidate A"
└────────┬─────────┘  Emails, phones → removed
         │ clean text
         ▼
┌──────────────────┐
│  Embedding &     │  Gemini text-embedding-004
│  Indexing        │  → FAISS vector store
│  (rag.py)        │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 Ranking    Chat
 (Claude)  (RAG → Claude)
```

---

## LinkedIn Caption Template

```
🚀 Excited to share BestMatch — an AI-powered CV screening tool that helps HR teams
hire fairly and efficiently!

✅ What it does:
• Anonymizes CVs with Microsoft Presidio (removes names, emails, phones)
• Ranks candidates using RAG + Google Gemini Embeddings + FAISS
• Lets HR chat naturally about candidates via Claude AI
• Supports Arabic 🇸🇦 and English 🌍 with full RTL layout
• Bias Detection report with every analysis

🛠️ Tech Stack:
Claude (claude-sonnet-4-6) · Gemini (text-embedding-004) · FAISS · Presidio
FastAPI · React · Tailwind CSS · Docker · Azure App Service

⚖️ Fair hiring is not a feature — it's a responsibility.

#AI #HRTech #FairHiring #RAG #Claude #Gemini #Azure #OpenSource #BiasDetection
```

---

## License

MIT — free to use, modify, and deploy.
