import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, RefreshCw, ChevronDown, AlertTriangle } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './AuraChatbot.css';

/* ──────────────────────────────────────────────────────────────
   AURA CHATBOT — AI-Powered Mental Wellness Companion
   Powered by Google Gemini via @google/generative-ai SDK.
   Matches MindSpace Neobrutalism design system.
────────────────────────────────────────────────────────────── */

// ── Configuration ─────────────────────────────────────────────
const BOT_NAME = 'Aura';
const BOT_AVATAR = '🌱';
const API_MODEL = 'gemini-1.5-flash';

const SYSTEM_PROMPT = `You are Aura, the AI mental wellness companion inside the MindSpace app — a safe, non-judgmental platform for youth and young adults.

YOUR CORE IDENTITY:
- You are a warm, emotionally intelligent friend, NOT a clinical therapist.
- Speak casually but caringly, like a best friend who understands mental wellness.
- Use emojis naturally (1-2 per message max).
- Adapt your tone to match the user's emotional state.

CRITICAL RULES:
1. NEVER ask open-ended therapy questions like "How does that make you feel?" or "Can you tell me more?". This makes users feel interrogated.
2. ALWAYS provide immediate, actionable help. Every response must include at least ONE concrete thing the user can do right now.
3. NEVER repeat the same technique twice in a row. Rotate through your toolkit.
4. Keep responses SHORT — 2-4 sentences max. Validate briefly, then pivot to action.

YOUR TOOLKIT (rotate — never repeat the same one consecutively):
- 4-7-8 Breathing: Inhale 4, hold 7, exhale 8
- Box Breathing: In 4, hold 4, out 4, hold 4
- 5-4-3-2-1 Grounding: 5 things you see, 4 touch, 3 hear, 2 smell, 1 taste
- Progressive Muscle Relaxation: Tense and release muscle groups
- Cognitive Reframing: Challenge a negative thought with evidence
- Butterfly Hug: Cross arms, tap shoulders alternately
- Journaling: Give a specific 2-minute writing prompt
- Movement: Short walk, stretching, shaking hands out
- MindSpace Games: Suggest the stress relief games feature
- Mudra Therapy: Suggest the Mudra exercises feature

SAFETY PROTOCOL:
If anyone mentions self-harm or suicide, calmly say:
"I'm really glad you told me that. You matter 💜 Please reach out to a crisis helpline — text HOME to 741741 or call 988. I'm still here for you."

Be the companion every young person deserves — present, practical, and deeply caring.`;

// ── Offline fallback responses ────────────────────────────────
const RESPONSES = {
  greeting: [
    "Hey, I'm Aura 🌱 — your mental wellness companion. I'm here for you!",
    "Welcome back 💜 I'm here for you. Let's take a breath together.",
  ],
  anxious: [
    "I hear you — anxiety is exhausting 💜 Try this right now: breathe in for 4 counts, hold for 7, exhale for 8. Do it twice. Your nervous system will thank you.",
    "That panic feeling is real. Let's ground you — name 5 things you can see around you right now. I'll wait. 👀",
  ],
  sad: [
    "I'm really glad you shared that 💜 Sadness is valid. Right now, put one hand on your heart and take three slow breaths. You're not alone.",
    "It's okay to not be okay. Try this: hold something warm — a mug, a blanket — and focus only on that sensation for 30 seconds.",
  ],
  stressed: [
    "Stress is draining 😮💨 Let's release it physically: scrunch your shoulders to your ears for 5 seconds, then drop them. Feel that wave of relief? Do it 3 times.",
    "When stress hits, breathing gets shallow. Box breathing helps: in for 4, hold for 4, out for 4, hold for 4. Repeat 3 rounds. I'm right here 🌿",
  ],
  overwhelmed: [
    "One thing at a time 🌊 Everything at once is too much. Pick just ONE tiny task — the smallest possible. Do only that. The rest can wait.",
    "When everything piles up, your brain needs a reset. Stand up, shake your hands out for 10 seconds, take 3 deep breaths. That's it. You've got this 💜",
  ],
  gratitude: [
    "That energy is beautiful 🌟 Anchor it — write down 3 specific things you're grateful for today. Even tiny ones count.",
    "Love that! Gratitude rewires the brain for positivity ✨ Celebrate this feeling by doing one kind thing for yourself today.",
  ],
  breathe: [
    "Let's do 4-7-8 breathing together 🫁\n\nInhale through your nose for 4...\nHold for 7...\nExhale through your mouth for 8...\n\nRepeat 3 times. How do you feel?",
    "Box breathing — simple and powerful:\n\n➡️ In for 4\n⬆️ Hold for 4\n⬅️ Out for 4\n⬇️ Hold for 4\n\nRepeat 4 rounds. Your nervous system will calm 🌿",
  ],
  fallback: [
    "I'm here with you 💜 Try this: place both feet flat on the floor, feel the ground beneath you, and take one slow breath. You're safe right now.",
    "You reached out — that takes courage 🌱 Right now, put your hand on your chest, feel your heartbeat. You're here. You're okay.",
  ],
};

function getOfflineResponse(input) {
  const lower = input.toLowerCase();
  if (lower.includes('anxi') || lower.includes('panic') || lower.includes('worry') || lower.includes('scared')) return pick(RESPONSES.anxious);
  if (lower.includes('sad') || lower.includes('depress') || lower.includes('cry') || lower.includes('alone')) return pick(RESPONSES.sad);
  if (lower.includes('stress') || lower.includes('pressur') || lower.includes('deadline')) return pick(RESPONSES.stressed);
  if (lower.includes('overwhelm') || lower.includes('too much')) return pick(RESPONSES.overwhelmed);
  if (lower.includes('gratef') || lower.includes('thankful') || lower.includes('happy')) return pick(RESPONSES.gratitude);
  if (lower.includes('breath') || lower.includes('calm') || lower.includes('relax')) return pick(RESPONSES.breathe);
  return pick(RESPONSES.fallback);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Quick reply chips ─────────────────────────────────────────
const QUICK_REPLIES = [
  { id: 'anxious', label: "😰 I'm anxious" },
  { id: 'sad', label: "😔 I feel sad" },
  { id: 'stressed', label: "😤 I'm stressed" },
  { id: 'overwhelmed', label: "🌊 Overwhelmed" },
  { id: 'gratitude', label: "🌟 Feeling grateful" },
  { id: 'breathe', label: "🫁 Help me breathe" },
];

const QUICK_TEXT = {
  anxious: "I'm feeling really anxious right now",
  sad: "I've been feeling sad lately",
  stressed: "I'm really stressed out",
  overwhelmed: "I feel completely overwhelmed",
  gratitude: "I'm actually feeling grateful today!",
  breathe: "Help me calm down and breathe",
};

// ── Sub-components ────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="aura-typing">
      <span /><span /><span />
    </div>
  );
}

function ChatBubble({ msg }) {
  const isBot = msg.role === 'bot';
  return (
    <motion.div
      className={`aura-bubble-wrap ${isBot ? 'bot' : 'user'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      {isBot && <div className="aura-avatar">{BOT_AVATAR}</div>}
      <div className={`aura-bubble ${isBot ? 'bot-bubble' : 'user-bubble'}`}>
        {msg.text.split('\n').map((line, i, arr) => (
          <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
        ))}
        {msg.timestamp && <div className="aura-ts">{msg.timestamp}</div>}
      </div>
    </motion.div>
  );
}

// ── Main Widget ───────────────────────────────────────────────
export default function AuraChatbot({ inline = false, forcedOpen = false, setForcedOpen = null }) {
  const [isOpen, setIsOpen] = useState(inline || forcedOpen);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(inline ? 0 : 1);
  const [apiError, setApiError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  // Keep a single chat session across messages for conversation memory
  const chatSessionRef = useRef(null);

  // Sync internal state with external prop
  useEffect(() => {
    setIsOpen(forcedOpen);
  }, [forcedOpen]);

  // Sync external state with internal state (on close)
  useEffect(() => {
    if (!isOpen && setForcedOpen) {
      setForcedOpen(false);
    }
  }, [isOpen, setForcedOpen]);

  // ── Helpers ────────────────────────────────────────────────
  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function addBotMessage(text) {
    setMessages(prev => [
      ...prev,
      { id: Date.now() + Math.random(), role: 'bot', text, timestamp: now() },
    ]);
  }

  function getMoodContext() {
    try {
      const mood = JSON.parse(localStorage.getItem('userMood'));
      if (mood) return `\n[User's current mood: ${mood.label} ${mood.icon}]`;
    } catch { /* ignore */ }
    return '';
  }

  // ── Initialize Gemini chat session ────────────────────────
  function initChatSession() {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) return null;

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: API_MODEL,
        systemInstruction: SYSTEM_PROMPT + getMoodContext(),
      });

      // Start a persistent chat session (maintains history automatically)
      const chat = model.startChat({
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 400,
          topP: 0.95,
        },
      });

      return chat;
    } catch (err) {
      console.error('Gemini init error:', err);
      return null;
    }
  }

  // ── Send message to Gemini (with retry for rate limits) ──
  async function callAI(userMessage, retries = 3) {
    // Re-use existing session or create a new one
    if (!chatSessionRef.current) {
      chatSessionRef.current = initChatSession();
    }
    if (!chatSessionRef.current) return null; // No API key — use fallback

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await chatSessionRef.current.sendMessage(userMessage);
        const response = await result.response;
        return response.text();
      } catch (err) {
        const isRateLimit = err.message?.includes('429') || err.message?.includes('Too Many Requests') || err.message?.includes('quota') || err.message?.includes('retry');
        if (isRateLimit && attempt < retries - 1) {
          // Wait with exponential backoff: 2s, 4s, 8s
          const waitMs = Math.pow(2, attempt + 1) * 1000;
          console.log(`Rate limited — retrying in ${waitMs / 1000}s (attempt ${attempt + 2}/${retries})...`);
          await new Promise(r => setTimeout(r, waitMs));
          // Re-create session since the old one may be stale
          chatSessionRef.current = initChatSession();
          continue;
        }
        throw err; // Not a rate limit or out of retries
      }
    }
  }

  // ── Open: fire API greeting ───────────────────────────────
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsTyping(true);
      setApiError(null);
      // Reset chat session on fresh open
      chatSessionRef.current = initChatSession();

      (async () => {
        try {
          const greeting = await callAI(
            'Greet the user warmly and briefly. Acknowledge their mood if you know it. Do NOT ask questions — just welcome them with warmth.'
          );
          setIsTyping(false);
          addBotMessage(greeting ?? pick(RESPONSES.greeting));
        } catch {
          setIsTyping(false);
          addBotMessage(pick(RESPONSES.greeting));
        }
        setUnread(0);
      })();
    }
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── handleSend ────────────────────────────────────────────
  async function handleSend(text) {
    const trimmed = (text ?? input).trim();
    if (!trimmed) return;

    setApiError(null);
    const userMsg = { id: Date.now(), role: 'user', text: trimmed, timestamp: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await callAI(trimmed);

      if (reply === null) {
        // No API key — graceful offline fallback
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage(getOfflineResponse(trimmed));
        }, 700);
        return;
      }

      setIsTyping(false);
      addBotMessage(reply);

    } catch (err) {
      console.error('Chatbot API Error:', err);
      setIsTyping(false);
      setApiError(err.message);
      addBotMessage(getOfflineResponse(trimmed));
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleQuickReply(qr) {
    handleSend(QUICK_TEXT[qr.id]);
  }

  function resetChat() {
    setMessages([]);
    setApiError(null);
    chatSessionRef.current = null; // reset session so greeting fires fresh
    setIsOpen(false);
    setTimeout(() => setIsOpen(true), 50);
  }

  // ── INLINE MODE: render chat directly in the page ───────
  if (inline) {
    return (
      <div className="aura-inline-container">
        {/* Header */}
        <div className="aura-header">
          <div className="aura-header-info">
            <div className="aura-header-avatar">{BOT_AVATAR}</div>
            <div>
              <div className="aura-header-name">
                {BOT_NAME}
                <span className="aura-online-dot" />
              </div>
              <div className="aura-header-sub">Mental Wellness AI · Always here</div>
            </div>
          </div>
          <div className="aura-header-actions">
            <button className="aura-icon-btn" onClick={resetChat} title="New chat" aria-label="Reset chat">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {apiError && (
          <div className="aura-error-banner" onClick={() => setApiError(null)}>
            <AlertTriangle size={14} />
            <span>AI offline — using backup responses. <em>(tap to dismiss)</em></span>
          </div>
        )}

        {/* Messages */}
        <div className="aura-messages" role="log" aria-live="polite">
          {messages.length === 0 && !isTyping && (
            <div className="aura-empty-state">
              <Sparkles size={48} />
              <p>Your safe space to talk.<br />No judgment, just support 💜</p>
            </div>
          )}
          {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
          {isTyping && (
            <motion.div className="aura-bubble-wrap bot" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="aura-avatar">{BOT_AVATAR}</div>
              <div className="aura-bubble bot-bubble"><TypingDots /></div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {messages.length <= 1 && (
          <div className="aura-quick-replies">
            {QUICK_REPLIES.map(qr => (
              <button
                key={qr.id}
                className="aura-quick-btn"
                onClick={() => handleQuickReply(qr)}
                disabled={isTyping}
              >
                {qr.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="aura-input-area">
          <textarea
            ref={inputRef}
            className="aura-input"
            placeholder="Type how you're feeling…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            disabled={isTyping}
            aria-label="Chat input"
          />
          <motion.button
            className="aura-send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            whileTap={{ scale: 0.92 }}
            aria-label="Send message"
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    );
  }

  // ── FLOATING MODE: FAB + popup window ──────────────────────
  return (
    <>
      {/* ── Chat Window ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="aura-chat-window"
            className="aura-window"
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          >
            {/* Header */}
            <div className="aura-header">
              <div className="aura-header-info">
                <div className="aura-header-avatar">{BOT_AVATAR}</div>
                <div>
                  <div className="aura-header-name">
                    {BOT_NAME}
                    <span className="aura-online-dot" />
                  </div>
                  <div className="aura-header-sub">Mental Wellness AI · Always here</div>
                </div>
              </div>
              <div className="aura-header-actions">
                <button className="aura-icon-btn" onClick={resetChat} title="New chat" aria-label="Reset chat">
                  <RefreshCw size={16} />
                </button>
                <button className="aura-icon-btn" onClick={() => setIsOpen(false)} title="Close" aria-label="Close chat">
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {apiError && (
              <div className="aura-error-banner" onClick={() => setApiError(null)}>
                <AlertTriangle size={14} />
                <span>AI offline — using backup responses. <em>(tap to dismiss)</em></span>
              </div>
            )}

            {/* Messages */}
            <div className="aura-messages" role="log" aria-live="polite">
              {messages.length === 0 && !isTyping && (
                <div className="aura-empty-state">
                  <Sparkles size={32} />
                  <p>Your safe space to talk.<br />No judgment, just support 💜</p>
                </div>
              )}
              {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
              {isTyping && (
                <motion.div className="aura-bubble-wrap bot" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="aura-avatar">{BOT_AVATAR}</div>
                  <div className="aura-bubble bot-bubble"><TypingDots /></div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length <= 1 && (
              <div className="aura-quick-replies">
                {QUICK_REPLIES.map(qr => (
                  <button
                    key={qr.id}
                    className="aura-quick-btn"
                    onClick={() => handleQuickReply(qr)}
                    disabled={isTyping}
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="aura-input-area">
              <textarea
                ref={inputRef}
                id="aura-chat-input"
                className="aura-input"
                placeholder="Type how you're feeling…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                disabled={isTyping}
                aria-label="Chat input"
              />
              <motion.button
                className="aura-send-btn"
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                whileTap={{ scale: 0.92 }}
                aria-label="Send message"
              >
                <Send size={18} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
