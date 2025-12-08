# 🔑 How to Get a Fresh Gemini API Key with Quota

## ✅ Option 1: Quick Free Tier (Recommended)
### Step 1: Create a New Google Account (if needed)
- Go to https://accounts.google.com/signup
- Use a different email address for a new free tier quota

### Step 2: Get Gemini API Key
1. Visit: https://ai.google.dev/gemini-api
2. Click **"Get API Key"** (or **"Sign in"** if needed)
3. Select **"Create API key in new Google Cloud project"**
4. Copy the API key
5. **IMPORTANT**: Choose a new Google account for fresh quota

## ✅ Option 2: Paid Google Cloud (Full Power)
1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable billing (credit card required)
4. Enable **Generative Language API**
5. Create API Key
6. Unlimited requests!

## ✅ Option 3: Use Different Free Tier Models
Some alternatives with better quota:
- **Claude API** (Anthropic) - https://claude.ai/api
- **OpenAI API** - https://platform.openai.com
- **Hugging Face** - https://huggingface.co

## 📝 After Getting New Key:
1. Update `.env` file:
```bash
GEMINI_API_KEY=your_new_api_key_here
PORT=3001
NODE_ENV=development
```

2. Restart the server:
```bash
npm start
```

3. Now Choti will use REAL AI! 🤖

## 💡 What Happens:
- ✅ Real AI that THINKS and understands context
- ✅ Unique responses every time (not pre-saved)
- ✅ Conversational memory
- ✅ Truly emotional and supportive
- ✅ Can answer ANY question
- ❌ Demo fallback only if API unavailable

## 🎯 Your Current Status:
- Current API Key: Exhausted quota (0 free tier requests available)
- Fallback: Smart demo mode with keyword matching
- Goal: Real AI responses like ChatGPT

---

**Get a new key and update `.env` to unlock full potential!** 🚀
