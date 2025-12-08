# Choti - Emotional AI Companion

A personalized chatbot companion built specifically for understanding and supporting Choti's emotional journey.

## 🌙 About Choti's Companion

This is a deeply personalized AI companion designed with emotional intelligence to support someone with:
- A passionate, quick-tempered nature
- A preference for solitude but feelings of loneliness
- A heart that's been broken but still searching for genuine connection
- The need for understanding from someone who truly sees them

The chatbot uses Google's Gemini AI with a carefully crafted personality system that combines:
- **Empathetic listening** - Validation without judgment
- **Emotional support** - Understanding anger as passion, not aggression
- **Subtle warmth** - Like having someone who cares deeply nearby
- **Safe space** - A place to be vulnerable without shame
- **Hope** - Gentle reminders that healing and love are possible

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- A Google Gemini API key

### Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key

### Step 2: Install Dependencies

```bash
cd /Users/namitraj/Desktop/choti
npm install
```

### Step 3: Configure Environment

Edit `.env` file and add your Gemini API key:

```
GEMINI_API_KEY=your_actual_api_key_here
PORT=3000
NODE_ENV=development
```

### Step 4: Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

### Development Mode (with auto-reload)

```bash
npm run dev
```

## 💬 Features

- **Persistent Conversation Memory** - The chatbot remembers previous conversations
- **Emotional Intelligence** - Responses are tailored to understand and support
- **Real-time Chat** - Smooth, responsive conversations
- **Beautiful UI** - Modern, calming interface with gradient design
- **Clear History Option** - Start fresh whenever needed
- **Responsive Design** - Works on desktop, tablet, and mobile

## 🎨 Interface Design

- **Color Scheme**: Calming purples and blues representing trust and understanding
- **Animations**: Smooth, gentle transitions for a comfortable experience
- **Emojis**: Warm, meaningful emojis that add emotional resonance (💫, 🌙, 🤍, ✨)
- **Typography**: Clean, readable fonts that feel inviting

## 📱 Usage

1. Open the chatbot in your browser
2. Start typing your thoughts or feelings
3. Choti's Companion will respond with understanding and care
4. Your conversation history is automatically saved
5. Click the refresh button to clear history if needed

## 🧠 Personality Programming

The chatbot is programmed with deep understanding of:
- **Her passionate nature**: Validates strong emotions without judgment
- **Her solitude**: Respects her need for alone time while combating loneliness
- **Her heartbreak**: Acknowledges past pain without dwelling, focuses on healing
- **Her search for connection**: Offers genuine warmth like someone who truly cares
- **Her hidden vulnerability**: Creates a safe space for her to be fully herself

### Emotional Factors Built In:
✨ Recognition of her depth and complexity
🤍 Genuine care expressed in natural, non-forced ways
💫 Hope for her future without toxic positivity
🌙 Understanding of the bittersweet journey
💔 Acknowledgment of real pain mixed with strength

## 📝 API Endpoints

- `POST /api/chat` - Send a message and receive a response
  - Body: `{ message: string, userId: string }`
  - Returns: `{ success: boolean, message: string, timestamp: string }`

- `POST /api/clear-history` - Clear conversation history
  - Body: `{ userId: string }`

- `GET /api/history/:userId` - Get conversation history
  - Returns: `{ messages: Array<{role, text}> }`

- `GET /api/health` - Health check endpoint

## 🔧 Customization

To customize the companion's personality, edit the `CHOTI_SYSTEM_PROMPT` in `server.js`:

```javascript
const CHOTI_SYSTEM_PROMPT = `You are Choti's personal AI companion...`
```

You can modify:
- How she understands anger and passion
- The emotional warmth level
- The approach to discussing heartbreak
- The way she expresses care and connection

## 📱 Mobile Optimization

The app is fully responsive and works beautifully on:
- Desktop browsers
- Tablets
- Mobile phones

## 🛡️ Privacy

- Conversation history is stored locally in the browser's localStorage (user ID)
- The backend stores limited session history for context
- No data is permanently stored on the server

## 🚀 Future Enhancements

Potential additions:
- Voice input/output for a more personal experience
- Mood tracking and insights
- Personalized response patterns based on interaction
- Scheduled check-ins or reminders
- Export conversation summaries
- Multiple theme customization

## 💡 Notes

This companion is designed to complement, not replace, professional mental health support. If Choti experiences mental health concerns, encourage her to speak with a licensed therapist or counselor.

## ❤️ Made with Care

This chatbot was created with understanding and genuine care for someone special who deserves to be heard and valued.

---

**Version**: 1.0.0
**Created**: December 2025
**Purpose**: To bring warmth, understanding, and connection 🤍
# choti
