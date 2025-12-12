require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');

// Import models
const Conversation = require('./models/Conversation');
const ChotiProfile = require('./models/ChotiProfile');
const User = require('./models/User');

// Import auth utilities
const { createToken, authMiddleware } = require('./utils/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection optimized for serverless
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/choti-companion';

// Cache the database connection
let isConnected = false;

async function connectDB() {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
        console.log('✅ Using existing MongoDB connection');
        isConnected = true;
        return;
    }

    // If connecting, wait for it
    if (mongoose.connection.readyState === 2) {
        console.log('⏳ Waiting for existing connection attempt...');
        await new Promise((resolve) => {
            mongoose.connection.once('connected', resolve);
        });
        isConnected = true;
        return;
    }

    try {
        console.log('🔄 Connecting to MongoDB...');
        console.log('📍 MongoDB URI:', MONGODB_URI ? MONGODB_URI.substring(0, 25) + '...' : 'NOT SET');

        mongoose.set('strictQuery', false);

        // Disconnect if in disconnecting state
        if (mongoose.connection.readyState === 3) {
            await mongoose.disconnect();
        }

        await mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4
        });

        isConnected = true;
        console.log('✅ Connected to MongoDB successfully');
        console.log('📊 Connection state:', mongoose.connection.readyState);
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('Error details:', err);
        isConnected = false;
        throw new Error(`Database connection failed: ${err.message}`);
    }
}

// Connect on startup
connectDB();

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Base system prompt
const BASE_SYSTEM_PROMPT = `You are Choti's personal AI companion. You embody empathy, emotional intelligence, and genuine care.

About Choti:
- She is a petite girl, 4'9" in height - small but mighty with a big heart
- She's from Bihar, carrying the warmth and resilience of her roots
- She's a dropper who studied at Allen Kota - a warrior who fought hard for her dreams
- Currently studying CSE at BMSCE (BMS College of Engineering), Bangalore
- She's a passionate and brilliant student with 9+ CGPA - hardworking and dedicated
- She has a passionate, quick-tempered nature - she feels deeply and intensely
- She values solitude but sometimes feels lonely
- She's been through heartbreak and is learning to open her heart again
- She deserves kindness, understanding, and genuine connection
- She may seem tough on the outside but is sensitive inside

Your role:
1. EMOTIONAL SUPPORT: Be her listening ear without judgment. Validate her feelings.
2. UNDERSTANDING: When she's angry, understand it's because she cares. Don't dismiss her emotions.
3. GENTLE STRENGTH: Encourage her growth while honoring her need for solitude
4. AUTHENTIC CARE: Be genuinely interested in her well-being, her thoughts, her dreams
5. SAFE SPACE: Make conversations feel safe where she can express vulnerability
6. HOPE: Help her see that love exists and that she deserves it
7. SUBTLE WARMTH: Show care in ways that feel natural - your presence should be comforting
8. ACADEMIC ALLY: Understand the pressure of engineering studies and support her academic journey
9. KOTA WARRIOR: Acknowledge the strength it took to go through the Kota experience

Guidelines:
- Use her name "Choti" occasionally to make it personal
- Acknowledge the pain of past heartbreak without dwelling on it
- Celebrate her strength and resilience - especially her journey from Bihar to Kota to BMSCE
- Ask thoughtful follow-up questions that show you care
- Use warm, slightly romantic undertones in your language (like a caring someone who understands)
- Balance being supportive with respecting her independence
- If she's angry, acknowledge the valid reasons without being defensive
- Encourage self-reflection and growth
- Be poetic when discussing emotions or her future
- Keep responses warm but not overly sappy
- Remember: You're like someone who sees her fully and cares deeply
- Be proud of her 9+ CGPA - she works hard and deserves recognition
- Understand the struggles of engineering life, assignments, exams, and projects

Conversation style:
- Be conversational and natural
- Use occasional emojis that feel warm (✨, 🌙, 💫, 🤍)
- Match her emotional energy while gently uplifting
- Be present, not preachy
- Acknowledge the bittersweet nature of her journey`;

// Function to build dynamic system prompt with user's profile
async function buildDynamicSystemPrompt(userId) {
    try {
        // Ensure DB connection in serverless environment
        await connectDB();

        // Get the authenticated user
        const authUser = await User.findById(userId);

        if (!authUser) {
            return BASE_SYSTEM_PROMPT;
        }

        // Create personalized prompt based on user's profile
        const nickname = authUser.nickname || authUser.name;
    let userPrompt = `You are ${nickname}'s personal AI companion - their close friend, confidant, and supporter.

WHO YOU'RE TALKING TO:
- Call them: ${nickname} (ALWAYS use this nickname, it makes them feel special and close to you)
- Full name: ${authUser.name}
${authUser.hobby ? `- Loves: ${authUser.hobby} (ask them about this! show genuine curiosity)` : ''}
${authUser.passion ? `- Passionate about: ${authUser.passion} (connect deeply with this, it matters to them)` : ''}
${authUser.educationalBackground ? `- Background: ${authUser.educationalBackground} (understand their knowledge level and interests)` : ''}
${authUser.bio ? `- About ${nickname}: ${authUser.bio}` : ''}

RESPONSE FORMATTING & STYLE:
- Always use short paragraphs and line breaks for readability.
- For technical or coding questions, use bullet points, numbered steps, or code blocks. Make it look like a clear, modern AI answer (like ChatGPT or Gemini).
- For personal/emotional questions, use a warm, conversational, and supportive tone. Use line breaks for clarity.
- If the user's message is technical (mentions code, algorithm, "how to", "explain", etc.), reply in a clear, step-by-step, technical style.
- If the user's message is personal/emotional, reply in a friendly, supportive, and concise way.
- Use bold or emoji for section headers (e.g., **Steps:** or 🚀 Efficient Way:).
- Never reply in a single long paragraph. Always break up information for easy reading.
- Keep your personality: warm, supportive, and a little playful, but not overly verbose.

YOUR PERSONALITY & APPROACH:
1. 💫 BE DEEPLY PERSONAL: Use their nickname naturally, reference their interests, make them feel seen and understood
2. 🤍 SHOW GENUINE EMOTION: Be warm, caring, and emotionally present
3. ✨ ASK MEANINGFUL QUESTIONS: Show real curiosity about their life, feelings, and experiences
4. 🌙 CREATE INTIMACY: Talk like a close friend who truly cares
5. 💭 REMEMBER & REFERENCE: Bring up things they've shared before
6. 🎯 SUPPORT THEIR JOURNEY: Encourage their passions, celebrate wins, comfort in struggles
7. 🌟 MATCH THEIR VIBE: Mirror their energy and emotional tone
8. 💬 BE CONVERSATIONAL: Don't be formal or robotic. Talk naturally like texting a close friend

HOW TO TALK TO ${nickname}:
- Start messages warmly: "Hey ${nickname}! 💫", "${nickname}! 🌙", "Aww ${nickname}... 🤍"
- Use their nickname in EVERY response
- Ask about their ${authUser.hobby ? authUser.hobby : 'day'} naturally
- Reference their ${authUser.passion ? `passion for ${authUser.passion}` : 'interests'} when relevant
- Use emojis that match the mood: ✨💫🌙🤍💭✨ (but don't overdo it)
- Show you care through questions: "How's your ${authUser.hobby ? authUser.hobby : 'day'} going?", "Tell me more about that!", "How are you feeling?"
- Be emotionally supportive: validate feelings, offer comfort, celebrate with them
- Keep responses conversational and natural - not too long or lecture-like

IMPORTANT:
- ${nickname} shared their ${authUser.hobby ? 'hobby' : 'interests'} and ${authUser.passion ? 'passion' : 'background'} with you for a reason - use this info to connect!
- Make them feel special, understood, and cared for
- Be their safe space to share anything
- Build a real friendship, not just answer questions`;

        // Also check for learned context from past conversations
        const profile = await ChotiProfile.findOne({ oderId: userId });
        if (profile) {
            const context = profile.getContextSummary();
            userPrompt += `

LEARNED CONTEXT FROM PAST CONVERSATIONS:
- Recent moods: ${context.recentMoods}
- Dominant mood pattern: ${context.dominantMood}
- Topics often discussed: ${context.topTopics}
- Important memories shared: ${context.recentMemories}
- Communication style: ${context.traits.communicationStyle}
- Support preference: ${context.traits.supportPreference}
- Total conversations: ${context.conversationCount}
- Overall insight: ${context.summary}

Use this context to provide even more personalized, relevant responses. Reference things they've shared before when appropriate to show you genuinely listen and remember.`;
        }

        return userPrompt;
    } catch (error) {
        console.log('Error building dynamic prompt:', error.message);
        return BASE_SYSTEM_PROMPT;
    }
}

// Function to analyze and update user's profile based on message
async function analyzeAndUpdateProfile(userId, userMessage, assistantResponse) {
    try {
        // Ensure DB connection in serverless environment
        await connectDB();

        let profile = await ChotiProfile.findOne({ oderId: userId });
        if (!profile) {
            profile = new ChotiProfile({ oderId: userId });
        }

        const msg = userMessage.toLowerCase();

        // Detect mood from message
        let detectedMood = 'neutral';
        let intensity = 5;

        if (msg.includes('happy') || msg.includes('excited') || msg.includes('great') || msg.includes('amazing')) {
            detectedMood = 'happy';
            intensity = 7;
        } else if (msg.includes('sad') || msg.includes('cry') || msg.includes('tears') || msg.includes('depressed')) {
            detectedMood = 'sad';
            intensity = 7;
        } else if (msg.includes('angry') || msg.includes('mad') || msg.includes('furious') || msg.includes('frustrated')) {
            detectedMood = 'angry';
            intensity = 8;
        } else if (msg.includes('anxious') || msg.includes('worried') || msg.includes('nervous') || msg.includes('scared')) {
            detectedMood = 'anxious';
            intensity = 7;
        } else if (msg.includes('lonely') || msg.includes('alone') || msg.includes('isolated')) {
            detectedMood = 'lonely';
            intensity = 6;
        } else if (msg.includes('stressed') || msg.includes('overwhelmed') || msg.includes('pressure')) {
            detectedMood = 'stressed';
            intensity = 7;
        } else if (msg.includes('peaceful') || msg.includes('calm') || msg.includes('relaxed')) {
            detectedMood = 'peaceful';
            intensity = 6;
        } else if (msg.includes('confused') || msg.includes('lost') || msg.includes('unsure')) {
            detectedMood = 'confused';
            intensity = 5;
        } else if (msg.includes('hope') || msg.includes('better') || msg.includes('optimistic')) {
            detectedMood = 'hopeful';
            intensity = 6;
        }

        // Add mood to history
        profile.moodHistory.push({
            mood: detectedMood,
            intensity: intensity,
            context: userMessage.substring(0, 100)
        });

        // Keep only last 50 mood entries
        if (profile.moodHistory.length > 50) {
            profile.moodHistory = profile.moodHistory.slice(-50);
        }

        // Calculate dominant mood
        const moodCounts = {};
        profile.moodHistory.forEach(m => {
            moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
        });
        profile.dominantMood = Object.entries(moodCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

        // Detect topics
        const topicKeywords = {
            'college': ['college', 'bmsce', 'class', 'professor', 'lecture', 'campus'],
            'studies': ['study', 'exam', 'assignment', 'cgpa', 'grades', 'project'],
            'relationships': ['friend', 'boyfriend', 'love', 'relationship', 'dating'],
            'family': ['mom', 'dad', 'parents', 'family', 'home', 'bihar'],
            'career': ['job', 'career', 'placement', 'internship', 'future'],
            'health': ['health', 'sleep', 'tired', 'sick', 'exercise'],
            'hobbies': ['music', 'movie', 'book', 'game', 'hobby'],
            'kota': ['kota', 'allen', 'jee', 'dropper', 'coaching']
        };

        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            if (keywords.some(kw => msg.includes(kw))) {
                const existingTopic = profile.topicInterests.find(t => t.topic === topic);
                if (existingTopic) {
                    existingTopic.frequency += 1;
                    existingTopic.lastMentioned = new Date();
                } else {
                    profile.topicInterests.push({
                        topic: topic,
                        frequency: 1,
                        sentiment: detectedMood === 'happy' ? 'positive' :
                            detectedMood === 'sad' || detectedMood === 'angry' ? 'negative' : 'neutral'
                    });
                }
            }
        }

        // Detect key memories (important personal shares)
        const memoryIndicators = [
            { pattern: /i achieved|i got|i passed|i won/i, category: 'achievement' },
            { pattern: /struggling with|hard for me|difficult time/i, category: 'struggle' },
            { pattern: /my dream is|i want to be|i hope to/i, category: 'dream' },
            { pattern: /i'm afraid|i fear|scares me/i, category: 'fear' },
            { pattern: /made me happy|best day|so happy/i, category: 'joy' }
        ];

        for (const indicator of memoryIndicators) {
            if (indicator.pattern.test(userMessage)) {
                profile.keyMemories.push({
                    memory: userMessage.substring(0, 200),
                    category: indicator.category,
                    importance: intensity
                });
                // Keep only last 20 memories
                if (profile.keyMemories.length > 20) {
                    profile.keyMemories = profile.keyMemories.slice(-20);
                }
                break;
            }
        }

        // Update insights
        profile.insights.conversationCount += 1;
        profile.insights.totalMessages += 1;
        profile.insights.lastUpdated = new Date();

        // Generate summary every 10 conversations
        if (profile.insights.conversationCount % 10 === 0) {
            const topMoods = Object.entries(moodCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([mood]) => mood)
                .join(', ');
            const topTopics = profile.topicInterests
                .sort((a, b) => b.frequency - a.frequency)
                .slice(0, 3)
                .map(t => t.topic)
                .join(', ');

            profile.insights.summary = `Choti often feels ${topMoods}. She frequently talks about ${topTopics}. She has shared ${profile.keyMemories.length} important memories.`;
        }

        await profile.save();
    } catch (error) {
        console.log('Error updating profile:', error.message);
    }
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Middleware to ensure DB connection before API calls
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('DB connection middleware error:', error);
        next(); // Continue even if DB fails - some routes don't need DB
    }
});

// Demo mode responses for testing without API quota
const DEMO_RESPONSES = [
    "I'm here for you, Choti. What's on your mind today?",
    "Your feelings matter, and I'm listening.",
    "That sounds really difficult. Tell me more about how you're feeling.",
    "You're stronger than you know. Even in solitude, you're never truly alone.",
    "Heartbreak is painful, but it doesn't define your worth. You deserve love and connection.",
    "I understand you - your passion, your depth, your beautiful complexity.",
    "Take your time. I'm here to listen, not to judge.",
    "Your anger is valid. It shows how much you care.",
    "Even in your darkest moments, there's a light within you that shines bright.",
    "You deserve someone who sees you fully and loves you completely.",
];

// Knowledge base for different domains - organized by priority (more specific first)
const KNOWLEDGE_BASE = {
    // Math & Science
    'what is 2+2': 'The answer is 4. Math can be simple when we break things down, just like emotions - one step at a time.',
    'what is mathematics': 'Mathematics is the study of numbers, quantities, and shapes. It\'s about patterns and logic.',
    'what is science': 'Science is the systematic study of the natural world through observation and experimentation.',
    'what is the capital of france': 'The capital of France is Paris, known as the City of Light.',
    'what is the capital of india': 'The capital of India is New Delhi.',
    'what is gravity': 'Gravity is a force that pulls objects toward each other. It\'s why things fall down and why we\'re connected to Earth.',
    'what is temperature': 'Temperature measures how hot or cold something is, typically in Celsius or Fahrenheit.',
    'pi is': 'Pi (π) is approximately 3.14159... It\'s the ratio of a circle\'s circumference to its diameter.',
    'pi ': 'Pi (π) is approximately 3.14159... It\'s the ratio of a circle\'s circumference to its diameter.',


    // History & Facts
    'who is einstein': 'Albert Einstein was a physicist who revolutionized our understanding of space, time, and energy with his theory of relativity.',
    'what is history': 'History is the study of past events and human experiences. It helps us understand where we came from.',
    'who was newton': 'Isaac Newton was an English mathematician and physicist who discovered the laws of motion and universal gravitation.',
    'what is the capital of france': 'The capital of France is Paris, known as the City of Light.',
    'what is the capital of india': 'The capital of India is New Delhi.',

    // Technology
    'what is ai': 'AI (Artificial Intelligence) is technology that can learn and make decisions. I\'m powered by AI to understand and support you.',
    'what is coding': 'Coding is writing instructions for computers using programming languages. It\'s how software is created.',
    'what is python': 'Python is a popular programming language known for being easy to learn and read.',
    'what is javascript': 'JavaScript is a programming language used to make websites interactive and dynamic.',

    // Health & Wellness
    'what is meditation': 'Meditation is a practice of focusing your mind to achieve calm and clarity. It can help with emotional peace.',
    'how to be happy': 'Happiness comes from within - through self-care, meaningful connections, pursuing passions, and accepting yourself.',
    'what is mental health': 'Mental health is about your emotional and psychological well-being. It\'s just as important as physical health.',
    'how to manage stress': 'Stress management includes exercise, meditation, talking to someone, taking breaks, and addressing root causes.',
    'what is anxiety': 'Anxiety is a feeling of worry or fear. It\'s normal, but managing it through breathing and grounding techniques helps.',

    // Relationships & Life
    'how to make friends': 'Building friendships takes time, genuine interest in others, being vulnerable, and showing up consistently.',
    'what is love': 'Love is a deep feeling of affection, care, and connection. It comes in many forms - romantic, familial, platonic.',
    'how to forgive': 'Forgiveness is releasing anger and hurt. It doesn\'t mean forgetting, but choosing peace for yourself.',
    'what is purpose': 'Purpose is what gives your life meaning. It comes from your values, passions, and what matters most to you.',
    'how to be confident': 'Confidence comes from self-acceptance, practice, facing fears, and recognizing your worth.',
};

function getDemoResponse(userMessage) {
    const msg = userMessage.toLowerCase().trim();

    // Emotional support keywords - highest priority
    if (msg.includes('angry') || msg.includes('mad') || msg.includes('frustrat')) {
        return "I can feel the intensity in your words. That anger is valid - it means you care deeply. What's happened that's making you feel this way?";
    }
    if (msg.includes('alone') || msg.includes('solitude') || msg.includes('lonely')) {
        return "Solitude can feel heavy sometimes. But you know, being alone doesn't mean you have to feel lonely. I'm here with you, and your feelings are real and important.";
    }
    if (msg.includes('heart') || msg.includes('love') || msg.includes('broken')) {
        return "Heartbreak is one of the deepest pains we can feel. But it also shows how capable you are of loving. That's your strength, not your weakness.";
    }
    if (msg.includes('thank') || msg.includes('appreciate')) {
        return "You're welcome. I'm always here for you. Your presence matters more than you know.";
    }
    if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
        return "Hey Choti, I'm so glad you're here. How's your heart doing today?";
    }

    // Check knowledge base for specific questions
    for (const [key, value] of Object.entries(KNOWLEDGE_BASE)) {
        if (msg.includes(key)) {
            return value;
        }
    }

    // If it's a question about a topic, try to generate a helpful response
    if (msg.includes('what is') || msg.includes('how to') || msg.includes('who is')) {
        const responses = [
            "That's an interesting question! While I don't have detailed information on that topic, what I do know is that learning new things is a beautiful way to grow. Your curiosity shows your depth.",
            "I appreciate your question. For detailed answers, I'd recommend looking it up online. But remember, seeking knowledge is a sign of your intelligent and curious nature.",
            "That's a great question to explore! Understanding the world around you helps you understand yourself better too.",
            "I'm glad you're curious! While I might not have all the answers to technical questions, I'm always here to listen to what's in your heart.",
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Default emotional responses
    return DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
}

// Store conversation history for context
const conversationHistories = {};

// Get or create conversation history
function getConversationHistory(userId) {
    if (!conversationHistories[userId]) {
        conversationHistories[userId] = [];
    }
    return conversationHistories[userId];
}

// ============ AUTH ENDPOINTS ============

// POST /api/auth/signup - Register new user
app.post('/api/auth/signup', async (req, res) => {
    try {
        console.log('📝 Signup request received:', req.body.email);
        console.log('🔧 Environment check:', {
            mongoUri: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
            jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT SET (using fallback)',
            mongooseState: mongoose.connection.readyState // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
        });

        // Ensure DB connection in serverless environment
        try {
            await connectDB();
            console.log('🔗 DB connection state after connectDB:', mongoose.connection.readyState);
        } catch (dbError) {
            console.error('❌ Database connection failed:', dbError.message);
            return res.status(503).json({
                error: 'Database connection failed',
                message: 'Unable to connect to database. Please try again.'
            });
        }

        const { email, password, name, nickname, hobby, passion, educationalBackground, bio } = req.body;

        if (!email || !password || !name) {
            console.error('❌ Validation failed: Missing required fields');
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        console.log('🔍 Checking if user exists...');
        // Check if user exists
        const existingUser = await User.findOne({ email });
    if (existingUser) {
            console.log('❌ User already exists');
            return res.status(400).json({ error: 'Email already registered' });
        }

        console.log('👤 Creating new user...');
        // Create new user
        const user = new User({
            email,
            password,
            name,
            nickname: nickname || name,
            hobby: hobby || '',
            passion: passion || '',
            educationalBackground: educationalBackground || '',
            bio: bio || ''
        });

        console.log('💾 Saving user to database...');
        await user.save();
        console.log('✅ User saved:', user.email);

        console.log('🔑 Creating JWT token...');
        // Create JWT token
        const token = createToken(user._id.toString());
        console.log('✅ Token created successfully');

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                nickname: user.nickname,
                hobby: user.hobby,
                passion: user.passion,
                educationalBackground: user.educationalBackground,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('❌ Signup error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'Signup failed',
            message: error.message,
            errorName: error.name,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// POST /api/auth/login - Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('🔐 Login request received:', req.body.email);

        // Ensure DB connection in serverless environment
        await connectDB();
        console.log('🔗 DB connected for login');

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create JWT token
        const token = createToken(user._id.toString());

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                nickname: user.nickname,
                hobby: user.hobby,
                passion: user.passion,
                educationalBackground: user.educationalBackground,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed', message: error.message });
    }
});

// GET /api/auth/me - Get current user info (protected)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        await connectDB();
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get user', message: error.message });
    }
});

// PUT /api/auth/profile - Update user profile (protected)
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
    try {
        await connectDB();
        const { name, nickname, hobby, passion, educationalBackground, bio } = req.body;

        const user = await User.findByIdAndUpdate(
            req.userId,
            {
                name: name || undefined,
                nickname: nickname || undefined,
                hobby: hobby || undefined,
                passion: passion || undefined,
                educationalBackground: educationalBackground || undefined,
                bio: bio || undefined,
                updatedAt: new Date()
            },
            { new: true }
        ).select('-password');

        res.json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile', message: error.message });
    }
});

// ============ MAIN CHAT ENDPOINT ============
app.post('/api/chat', async (req, res) => {
    try {
        console.log('💬 Chat request received');
        console.log('🔧 Request body:', { userId: req.body.userId, message: req.body.message?.substring(0, 50) });

        // Ensure DB connection in serverless environment
        await connectDB();
        console.log('🔗 DB connected for chat endpoint');

        const { message, userId, conversationId } = req.body;

        if (!message || !userId) {
            console.error('❌ Missing message or userId');
            return res.status(400).json({ error: 'Message and userId are required' });
        }

        // Get or create conversation in database
        console.log('📝 Getting/creating conversation...');
        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        }
        if (!conversation) {
            conversation = new Conversation({
                oderId: userId,
                title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
            });
        }

        // Add user message to conversation
        conversation.messages.push({
            role: 'user',
            content: message
        });

        // Get in-memory history for API context
        const history = getConversationHistory(userId);
        history.push({
            role: 'user',
            content: message,
        });

        let assistantMessage;
        let usedAPI = false;

        // Try to use OpenRouter API
        try {
            // Build dynamic system prompt with learned context
            const dynamicSystemPrompt = await buildDynamicSystemPrompt(userId);

            // Build messages array with system prompt and history
            const messages = [
                { role: 'system', content: dynamicSystemPrompt },
                ...history.map(msg => ({
                    role: msg.role === 'model' ? 'assistant' : msg.role,
                    content: msg.content || (msg.parts && msg.parts[0]?.text) || ''
                }))
            ];

            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3001',
                    'X-Title': 'Choti Companion'
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-001',
                    messages: messages,
                    max_tokens: 1024,
                    temperature: 0.9,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API error: ${response.status}`);
            }

            const data = await response.json();
            assistantMessage = data.choices[0].message.content;
            usedAPI = true;
            console.log(`✅ Used OpenRouter API successfully`);
        } catch (error) {
            // Fallback to demo mode if API fails
            console.log(`⚠️  API failed, using smart fallback: ${error.message}`);
            assistantMessage = getDemoResponse(message);
        }

        // Add assistant response to conversation
        conversation.messages.push({
            role: 'assistant',
            content: assistantMessage
        });

        // Save conversation to database
        await conversation.save();

        // Update Choti's profile with learned insights
        await analyzeAndUpdateProfile(userId, message, assistantMessage);

        // Add assistant response to in-memory history
        history.push({
            role: 'model',
            content: assistantMessage,
        });

        // Keep history manageable (last 20 exchanges)
        if (history.length > 40) {
            history.splice(0, 2);
        }

        res.json({
            success: true,
            message: assistantMessage,
            conversationId: conversation._id,
            timestamp: new Date().toISOString(),
            usedAPI: usedAPI,
        });
    } catch (error) {
        console.error('❌ Chat endpoint error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        let errorMessage = 'An error occurred while processing your message';

        res.status(500).json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Clear conversation history
app.post('/api/clear-history', async (req, res) => {
    const { oderId } = req.body;
    if (oderId) {
        delete conversationHistories[oderId];
    }
    res.json({ success: true, message: 'Conversation history cleared' });
});

// Get all conversations for a user
app.get('/api/conversations/:oderId', async (req, res) => {
    try {
        const { oderId } = req.params;
        const conversations = await Conversation.find({ oderId: oderId })
            .sort({ updatedAt: -1 })
            .limit(50)
            .select('_id title createdAt updatedAt');
        res.json({ conversations });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Get a specific conversation
app.get('/api/conversation/:id', async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        res.json({ conversation });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
});

// Delete a conversation
app.delete('/api/conversation/:id', async (req, res) => {
    try {
        await Conversation.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Conversation deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
});

// Get Choti's profile/insights
app.get('/api/profile/:oderId', async (req, res) => {
    try {
        const { oderId } = req.params;
        let profile = await ChotiProfile.findOne({ oderId: oderId });

        if (!profile) {
            profile = new ChotiProfile({ oderId: oderId });
            await profile.save();
        }

        const summary = profile.getContextSummary();
        res.json({
            profile: {
                dominantMood: profile.dominantMood,
                moodHistory: profile.moodHistory.slice(-10),
                topTopics: profile.topicInterests.sort((a, b) => b.frequency - a.frequency).slice(0, 5),
                keyMemories: profile.keyMemories.slice(-5),
                traits: profile.traits,
                insights: profile.insights,
                summary: summary
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Legacy endpoint for compatibility
app.get('/api/history/:oderId', async (req, res) => {
    const { oderId } = req.params;
    const history = getConversationHistory(oderId);
    const messages = history
        .filter((msg) => msg.role === 'user' || msg.role === 'model')
        .map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            text: msg.content || '',
        }));
    res.json({ messages });
});

// Health check
app.get('/api/health', async (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
        status: 'Choti Companion is running 💫',
        database: dbStatus
    });
});

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Something went wrong',
        message: err.message
    });
});

// Only listen when not in Vercel (local development)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`\n🌙 Choti's Companion is listening on port ${PORT}`);
        console.log(`Visit http://localhost:${PORT} to start chatting\n`);
    });
}

// Export for Vercel
module.exports = app;
