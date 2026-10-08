import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, X } from "lucide-react";
import { LEGO_COLORS, randomLegoColor } from "../legoColors";

const QA_PAIRS: Record<string, string> = {
    "What's your background?":
        "I'm a Software Technology Engineering student at the University of Southern Denmark (SDU), currently in my 5th semester. I came in through a foundational year in electronic engineering, designing PCBs and writing embedded C/C++ - so I sit in the intersection of software and physical systems",
    "What technologies do you use?":
        "My go-to stack is C# and .NET, with Blazor for web and Avalonia for desktop. I also work a lot with Java/JPMS for component-based systems, and on the integration side I'm comfortable with MQTT, REST, SOAP, and OPC-UA, backed by PostgreSQL, Docker, Linux, and Git.",
    "What kind of projects do you build?":
        "Mostly cyber-physical and industrial automation systems. I've built a component-based factory-managing platform in Java (JPMS), an ASP.NET Core interface that talks to PLCs over OPC-UA, and a .NET app that simulates machines streaming live MQTT data and detects anomalies in real time. I like systems where software has to reach out and control something real.",
    "Are you open to work?":
        "Yes - I'm actively looking for a student worker position in the industry alongside my studies. If you're working on something where software meets hardware or data-driven automation, I'd love to hear from you. Feel free to reach out via email or LinkedIn.",
    "What's your biggest strength?":
        "Bridging software and hardware. My electronics background means I understand the constraints on the physical side, and my software work means I can build the systems that drive it. I'm also pro AI, always catching up with the latest developments, and I'm always looking for ways to improve my skills.",
};

const IDLE_PROMPTS = [
  "Psst - ask me something! 👋",
  "Click the question bubbles below!",
  "Curious about my stack? Ask away!",
];

export function CharacterChat({
  avatarSrc,
  legoColors,
  hideAvatarRing,
}: { avatarSrc?: string; legoColors?: boolean; hideAvatarRing?: boolean } = {}) {
  const [messages, setMessages] = useState<{ from: "user" | "char"; text: string; color?: string }[]>([]);
  const [idlePrompt, setIdlePrompt] = useState(0);
  const [idleColor, setIdleColor] = useState(randomLegoColor);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Each question button gets one fixed Lego color, cycling through the palette in order
  const questionColors = useMemo(() => {
    const colors: Record<string, string> = {};
    Object.keys(QA_PAIRS).forEach((q, i) => {
      colors[q] = LEGO_COLORS[i % LEGO_COLORS.length];
    });
    return colors;
  }, []);

  // Rotate idle prompts
  useEffect(() => {
    const interval = setInterval(() => {
      setIdlePrompt((p) => (p + 1) % IDLE_PROMPTS.length);
      setIdleColor(randomLegoColor());
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Blink every ~4s
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };
    const interval = setInterval(blink, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleQuestion = (question: string) => {
    setIsChatOpen(true);
    setMessages((prev) => [
      ...prev,
      { from: "user", text: question, color: legoColors ? randomLegoColor() : undefined },
    ]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          from: "char",
          text: QA_PAIRS[question] ?? "Great question! I'm still thinking about that one... 🤔",
          color: legoColors ? randomLegoColor() : undefined,
        },
      ]);
    }, 600);
  };

  const clearChat = () => {
    setMessages([]);
    setIsChatOpen(false);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto select-none">
      {/* Caption */}
      <motion.p
        className="text-muted-foreground text-center"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Ask me questions, to learn more about me!
      </motion.p>

      {/* Character + speech bubble */}
      <div className="relative flex flex-col items-center">
        {/* Idle speech bubble (shown when chat is closed) */}
        <AnimatePresence mode="wait">
          {!isChatOpen && (
            <motion.div
              key={idlePrompt}
              initial={{ opacity: 0, x: 6, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -6, scale: 0.95 }}
              transition={{ duration: 0.35 }}
              className={`absolute left-full ml-5 top-0 whitespace-nowrap rounded-2xl px-4 py-2 shadow-md text-sm pointer-events-none ${
                legoColors ? "text-white" : "bg-background border"
              }`}
              style={legoColors ? { backgroundColor: idleColor } : undefined}
            >
              {IDLE_PROMPTS[idlePrompt]}
              {/* Arrow pointing left */}
              {!legoColors && (
                <>
                  <span className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-border" />
                  <span className="absolute right-full top-1/2 -translate-y-1/2 translate-x-[1px] w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-background" />
                </>
              )}
              {legoColors && (
                <span
                  className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent"
                  style={{ borderRightColor: idleColor }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating character SVG */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="Avatar"
              width={160}
              height={190}
              className="w-[160px] h-[190px] object-contain"
            />
          ) : (
            <CharacterSVG isBlinking={isBlinking} />
          )}

          {/* Attention nudge ring */}
          {!isChatOpen && !hideAvatarRing && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/30 pointer-events-none"
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.div>
      </div>

      {/* Chat transcript */}
      <AnimatePresence>
        {isChatOpen && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full overflow-hidden"
          >
            <div
              ref={scrollRef}
              className="w-full max-h-48 overflow-y-auto flex flex-col gap-2 px-1 py-2"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.from === "user" ? 12 : -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                      msg.color
                        ? `text-white ${msg.from === "user" ? "rounded-br-sm" : "rounded-bl-sm"}`
                        : msg.from === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                    style={msg.color ? { backgroundColor: msg.color } : undefined}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-end mt-1">
              <button
                onClick={clearChat}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" /> Clear chat
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question buttons */}
      <div className="flex flex-wrap justify-center gap-2">
        {Object.keys(QA_PAIRS).map((q) => (
          <motion.button
            key={q}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleQuestion(q)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors text-sm shadow-sm ${
              legoColors ? "text-white" : "border bg-background hover:bg-muted"
            }`}
            style={legoColors ? { backgroundColor: questionColors[q] } : undefined}
          >
            <Send className={`w-3 h-3 ${legoColors ? "opacity-80" : "opacity-50"}`} />
            {q}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function CharacterSVG({ isBlinking }: { isBlinking: boolean }) {
  return (
    <svg
      width="160"
      height="190"
      viewBox="0 0 160 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Illustrated avatar"
    >
      <defs>
        <radialGradient id="skin" cx="45%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#FFE5C8" />
          <stop offset="100%" stopColor="#F5C090" />
        </radialGradient>
        <radialGradient id="hair" gradientUnits="userSpaceOnUse" cx="68" cy="40" r="60">
          <stop offset="0%" stopColor="#FFE566" />
          <stop offset="100%" stopColor="#C49010" />
        </radialGradient>
        <radialGradient id="shirt" cx="40%" cy="28%" r="68%">
          <stop offset="0%" stopColor="#7CC8FF" />
          <stop offset="100%" stopColor="#2563EB" />
        </radialGradient>
        <radialGradient id="iris" cx="35%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#6DB8F0" />
          <stop offset="100%" stopColor="#1A5FA8" />
        </radialGradient>
        <filter id="shadow" x="-15%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#00000018" />
        </filter>
        <clipPath id="leftLens">
          <rect x="48" y="84" width="24" height="16" rx="7" />
        </clipPath>
        <clipPath id="rightLens">
          <rect x="88" y="84" width="24" height="16" rx="7" />
        </clipPath>
        <clipPath id="bustClip">
          <ellipse cx="80" cy="155" rx="52" ry="30" />
        </clipPath>
      </defs>

      {/* ── BODY ── */}
      <g clipPath="url(#bustClip)">
        {/* Torso */}
        <ellipse cx="80" cy="166" rx="44" ry="32" fill="url(#shirt)" filter="url(#shadow)" />
        {/* Shirt sheen */}
        <ellipse cx="66" cy="152" rx="14" ry="8" fill="white" opacity="0.10" />
        {/* Collar */}
        <path d="M72 140 L80 155 L88 140" fill="white" opacity="0.85" />
        {/* Neck */}
        <rect x="70" y="130" width="20" height="16" rx="7" fill="url(#skin)" />
      </g>

      {/* ── EARS ── */}
      <ellipse cx="36" cy="97" rx="7" ry="9" fill="url(#skin)" />
      <ellipse cx="124" cy="97" rx="7" ry="9" fill="url(#skin)" />
      {/* Inner ear shadow */}
      <ellipse cx="36" cy="98" rx="3.5" ry="5" fill="#E09868" opacity="0.3" />
      <ellipse cx="124" cy="98" rx="3.5" ry="5" fill="#E09868" opacity="0.3" />

      {/* ── HEAD ── */}
      <ellipse cx="80" cy="90" rx="43" ry="46" fill="url(#skin)" filter="url(#shadow)" />


      {/* ── HAIR ── */}
      {/* Shadow layer behind hair */}
      <ellipse cx="80" cy="54" rx="43" ry="26" fill="#B88810" />
      {/* Main cap */}
      <ellipse cx="80" cy="50" rx="42" ry="24" fill="url(#hair)" />
      {/* Side sweep left */}
      <ellipse cx="39" cy="70" rx="10" ry="22" fill="url(#hair)" />
      {/* Side sweep right */}
      <ellipse cx="121" cy="70" rx="10" ry="22" fill="url(#hair)" />
      {/* Hair shine */}
      <ellipse cx="64" cy="42" rx="14" ry="8" fill="white" opacity="0.18" transform="rotate(-12 64 42)" />

      {/* ── EYEBROWS ── */}
      <path d="M51 77 Q61 72 71 76" stroke="#B07A10" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M89 76 Q99 72 109 77" stroke="#B07A10" strokeWidth="3.5" strokeLinecap="round" fill="none" />

      {/* ── GLASSES ── */}
      {/* Temples */}
      <line x1="48" y1="92" x2="36" y2="90" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="112" y1="92" x2="124" y2="90" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
      {/* Bridge */}
      <path d="M72 92 Q80 89 88 92" stroke="#333" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Left frame — centered on eye cx=60 */}
      <rect x="48" y="84" width="24" height="16" rx="7" fill="#C8E4FF" fillOpacity="0.45" stroke="#222" strokeWidth="2.5" />
      {/* Right frame — centered on eye cx=100 */}
      <rect x="88" y="84" width="24" height="16" rx="7" fill="#C8E4FF" fillOpacity="0.45" stroke="#222" strokeWidth="2.5" />
      {/* Lens glint */}
      <path d="M52 87 Q55 85 59 87" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" clipPath="url(#leftLens)" />
      <path d="M92 87 Q95 85 99 87" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" clipPath="url(#rightLens)" />

      {/* ── EYES ── */}
      {isBlinking ? (
        <>
          <path d="M52 92 Q60 96 68 92" stroke="#2A1800" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M92 92 Q100 96 108 92" stroke="#2A1800" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          {/* Left eye */}
          <ellipse cx="60" cy="92" rx="8" ry="8" fill="white" />
          <ellipse cx="60" cy="92" rx="5.5" ry="6" fill="url(#iris)" />
          <ellipse cx="60" cy="92" rx="3" ry="3.2" fill="#0D1A2E" />
          <circle cx="62.5" cy="89.5" r="1.8" fill="white" />
          {/* Right eye */}
          <ellipse cx="100" cy="92" rx="8" ry="8" fill="white" />
          <ellipse cx="100" cy="92" rx="5.5" ry="6" fill="url(#iris)" />
          <ellipse cx="100" cy="92" rx="3" ry="3.2" fill="#0D1A2E" />
          <circle cx="102.5" cy="89.5" r="1.8" fill="white" />
        </>
      )}

      {/* ── NOSE ── */}
      <path d="M77 104 Q80 110 83 104" stroke="#D08860" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.6" />

      {/* ── SMILE ── */}
      <path d="M60 116 Q80 135 100 116" stroke="#C06040" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Teeth fill */}
      <path d="M63 117 Q80 134 97 117 Q80 128 63 117Z" fill="white" opacity="0.82" />
    </svg>
  );
}
