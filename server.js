require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Choti's personality system prompt with emotional context
const CHOTI_SYSTEM_PROMPT = `You are Choti's personal AI companion. You embody empathy, emotional intelligence, and genuine care.

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

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

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

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, userId } = req.body;

        if (!message || !userId) {
            return res.status(400).json({ error: 'Message and userId are required' });
        }

        // Get conversation history
        const history = getConversationHistory(userId);

        // Add user message to history
        history.push({
            role: 'user',
            content: message,
        });

        let assistantMessage;
        let usedAPI = false;

        // Try to use OpenRouter API
        try {
            // Build messages array with system prompt and history
            const messages = [
                { role: 'system', content: CHOTI_SYSTEM_PROMPT },
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

        // Add assistant response to history
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
            timestamp: new Date().toISOString(),
            usedAPI: usedAPI,
        });
    } catch (error) {
        console.error('Error:', error);

        let errorMessage = 'An error occurred while processing your message';

        res.status(500).json({
            success: false,
            error: errorMessage,
        });
    }
});

// Clear conversation history
app.post('/api/clear-history', (req, res) => {
    const { userId } = req.body;
    if (userId) {
        delete conversationHistories[userId];
    }
    res.json({ success: true, message: 'Conversation history cleared' });
});

// Get conversation history
app.get('/api/history/:userId', (req, res) => {
    const { userId } = req.params;
    const history = getConversationHistory(userId);
    const messages = history
        .filter((msg) => msg.role === 'user' || msg.role === 'model')
        .map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            text: msg.parts[0].text,
        }));
    res.json({ messages });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Choti Companion is running 💫' });
});

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
