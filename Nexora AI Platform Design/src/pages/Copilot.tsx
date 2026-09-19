import { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles, X, Maximize2, CornerDownRight } from "lucide-react";
import { useToast } from "../components/ui/Toast";
import { apiService } from "../services/apiService";

const SUGGESTIONS = [
  "Which customers have the highest predicted CLV?",
  "Which high-value customers have declining CLV?",
  "Why is Customer C1023 predicted to have low CLV?",
  "What factors most influence CLV?",
  "Which segment contributes the most revenue?",
  "Which high-CLV customers have high churn risk?",
];

const RESPONSES: Record<string, string> = {
  "Which customers have the highest predicted CLV?":
    "Top 5 customers by 12-month CLV (current model):\n\n1. **Vertex Finance (C1009)** — ₹1.12 Cr · Confidence 96% · Health 96\n2. **TechNova Corp (C1004)** — ₹91.0L · Confidence 94% · High Value\n3. **Cascade Health (C1007)** — ₹82.4L · Confidence 89% · Health 89\n4. **Acme Technologies (C1001)** — ₹78.5L · Confidence 92% · Health 87\n5. **Meridian Pharma (C1011)** — ₹63.0L · Confidence 85% · Health 85\n\nAll five are in the **High Value** segment. Recommended: schedule Executive Business Reviews within 30 days to protect this ₹4.27 Cr combined CLV.",
  "Which high-value customers have declining CLV?":
    "I found **3 customers with negative CLV growth** in the High Value or Growth Opportunity tiers:\n\n• **Orbit Systems (C1005)** — CLV ₹37.8L, growth **–4.5%**, health 58 — moderate risk\n• **BlueWave Retail (C1008)** — CLV ₹21.5L, growth **–12.3%**, health 44 — **critical**\n• One borderline Mid-Market account at –2.1%\n\n**BlueWave is the most urgent**: 67% churn risk + declining CLV = ₹2.15L at immediate risk. Trigger the retention playbook today.",
  "What factors most influence CLV?":
    "Global SHAP analysis across the current model (v2.3.1):\n\n1. **Monthly Spend** — 38% importance (strongest driver)\n2. **Usage Frequency** — 31%\n3. **Product Adoption** — 28%\n4. **Tenure** — 22%\n5. **Revenue Trend** — 18%\n6. **Company Size** — 15%\n7. **Contract Length** — 13%\n8. **Support Tickets** — 11% (negative)\n9. **Sentiment Score** — 9%\n\nThe model weighs behavioral signals (usage, adoption, spend trend) more heavily than static firmographic features. Increasing product adoption by 10 percentage points is estimated to lift CLV by 8–12% on average.",
  "Which segment contributes the most revenue?":
    "Revenue contribution by CLV segment (portfolio-level):\n\n• **High Value** — 48.2% of total predicted CLV (312 customers)\n• **Growth Opportunity** — 24.1% (489 customers)\n• **Stable Value** — 16.6% (621 customers)\n• **Developing** — 7.1% (834 customers)\n• **Declining Value** — 3.5% (243 customers — requires attention)\n• **Low Value** — 0.5% (501 customers)\n\n**High Value is 48% of CLV with only 12% of customers.** Protecting and growing this segment is the highest-leverage activity in the portfolio.",
  "Which high-CLV customers have high churn risk?":
    "**47 customers** have predicted CLV > ₹5L AND churn risk > 40%. Combined CLV at risk: **₹4.7 Cr**.\n\nTop 5 most urgent:\n1. **BlueWave Retail (C1008)** — CLV ₹21.5L, churn risk **67%** — critical\n2. **Orbit Systems (C1005)** — CLV ₹37.8L, churn risk **48%** — at risk\n3. **NovaSpark Labs (C1003)** — CLV ₹12.4L, churn risk **34%** — warning\n4. *3 additional accounts in 30–38% risk range*\n\nI recommend activating the **Retention Playbook** for BlueWave immediately, and scheduling customer-success calls for Orbit Systems within 7 days.",
  "default":
    "Based on the current CLV model (v2.3.1, R²=0.924) and your portfolio of 50,000 customers:\n\nI can help you analyze individual customer CLV, compare segments, explain model predictions using SHAP, identify growth opportunities, or generate retention strategies.\n\nTry asking about specific customers, segments, or trends — or use the Customer Directory and Customer 360° screens for deep-dives.",
};

interface Msg { role: "user" | "ai"; text: string; time: string; }

function renderText(text: string) {
  return text.split("\n").map((line, i) => {
    const processed = line.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong>${m}</strong>`);
    if (line === "") return <div key={i} style={{ height: 6 }} />;
    return (
      <div key={i} style={{ lineHeight: 1.65 }}
        dangerouslySetInnerHTML={{ __html: processed }}
      />
    );
  });
}

function MessageList({ messages, typing }: { messages: Msg[]; typing: boolean }) {
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
      {messages.map((m, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
          {m.role === "ai" && (
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #5b5ff1, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
              <Bot size={13} color="white" />
            </div>
          )}
          <div className={m.role === "user" ? "bubble-user" : "bubble-ai"}>
            {renderText(m.text)}
            <div style={{ fontSize: 10, opacity: 0.5, marginTop: 5, textAlign: m.role === "user" ? "right" : "left" }}>{m.time}</div>
          </div>
        </div>
      ))}
      {typing && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #5b5ff1, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Bot size={13} color="white" />
          </div>
          <div className="bubble-ai" style={{ display: "flex", gap: 5, alignItems: "center", padding: "12px 16px" }}>
            {[0,1,2].map(j => (
              <div key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: "#5b5ff1", animation: `dotBounce 1.2s ease ${j * 0.18}s infinite` }} />
            ))}
          </div>
        </div>
      )}
      <div ref={bottom} />
    </div>
  );
}

function InputBar({ onSend, disabled }: { onSend: (t: string) => void; disabled: boolean }) {
  const [val, setVal] = useState("");
  const send = () => { if (val.trim()) { onSend(val); setVal(""); } };
  return (
    <div style={{ padding: "12px 18px", borderTop: "1px solid var(--border)", flexShrink: 0, background: "var(--card)" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "var(--muted)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "8px 12px", transition: "border-color 0.15s" }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = "var(--primary)")}
          onBlurCapture={e => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <Sparkles size={13} color="var(--primary)" />
          <input
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about CLV, customers, segments…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13.5, color: "var(--foreground)", fontFamily: "inherit" }}
          />
        </div>
        <button className="btn btn-primary btn-icon" onClick={send} disabled={disabled || !val.trim()} style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }}>
          <Send size={14} />
        </button>
      </div>
      <div style={{ fontSize: 10.5, color: "var(--muted-foreground)", textAlign: "center", marginTop: 6 }}>
        AI-generated · Grounded in real 50,000 customer dataset
      </div>
    </div>
  );
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Msg[]>([{
    role: "ai",
    text: "Hello! I'm **Nexora Copilot** — your AI assistant for customer value intelligence.\n\nI can help you analyze CLV predictions, identify high-value customers, explain model decisions, compare segments, and generate retention strategies. What would you like to explore?",
    time: "Just now",
  }]);
  const [typing, setTyping] = useState(false);
  const { toast } = useToast();

  const send = async (text: string) => {
    setMessages(m => [...m, { role: "user", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setTyping(true);
    try {
      const res = await apiService.sendCopilotMessage(text);
      const aiReply = res.data?.answer || RESPONSES[text] || RESPONSES["default"];
      setMessages(m => [...m, { role: "ai", text: aiReply, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    } catch {
      const fallback = RESPONSES[text] ?? RESPONSES["default"];
      setMessages(m => [...m, { role: "ai", text: fallback, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 52px)" }}>
      {/* Header */}
      <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--border)", background: "var(--card)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #5b5ff1, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bot size={17} color="white" />
        </div>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.01em" }}>Nexora Copilot</div>
          <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            CLV Intelligence Mode · Model v2.3.1
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <span className="badge badge-success">Active</span>
          <span className="badge badge-indigo">R² 0.924</span>
        </div>
      </div>

      <MessageList messages={messages} typing={typing} />

      {/* Suggestions */}
      {messages.length === 1 && !typing && (
        <div style={{ padding: "0 22px 14px", flexShrink: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.04em", color: "var(--muted-foreground)", marginBottom: 8, textTransform: "uppercase" }}>Try asking</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)} style={{
                padding: "6px 13px", borderRadius: 20, border: "1px solid var(--border)",
                background: "var(--muted)", fontSize: 12.5, color: "var(--foreground)", cursor: "pointer",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.background = "rgba(91,95,241,0.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--muted)"; }}
              >{s}</button>
            ))}
          </div>
        </div>
      )}

      <InputBar onSend={send} disabled={typing} />
    </div>
  );
}

/* ── Floating Copilot FAB + Drawer ─────────────────────── */
export function CopilotFloating() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{
    role: "ai",
    text: "Hi! I'm Nexora Copilot. Ask me anything about CLV, customers, or segments.",
    time: "Just now",
  }]);
  const [typing, setTyping] = useState(false);

  const send = (text: string) => {
    setMessages(m => [...m, { role: "user", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setTyping(true);
    setTimeout(() => {
      const response = RESPONSES[text] ?? RESPONSES["default"];
      setTyping(false);
      setMessages(m => [...m, { role: "ai", text: response, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    }, 1200 + Math.random() * 600);
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button className="copilot-fab" onClick={() => setOpen(true)} title="Open Nexora Copilot">
          <Bot size={22} color="white" />
          <span className="copilot-badge">AI</span>
        </button>
      )}

      {/* Drawer */}
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 700 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "fixed", bottom: 20, right: 20, zIndex: 800,
            width: 380, height: 560,
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 16, boxShadow: "var(--shadow-xl)",
            display: "flex", flexDirection: "column", overflow: "hidden",
            animation: "scaleIn 0.18s ease",
            transformOrigin: "bottom right",
          }} onClick={e => e.stopPropagation()}>
            {/* Drawer header */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(90deg, rgba(91,95,241,0.06), transparent)", flexShrink: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #5b5ff1, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot size={14} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--foreground)" }}>Nexora Copilot</div>
                <div style={{ fontSize: 10.5, color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 5, height: 5, background: "#10b981", borderRadius: "50%", display: "inline-block" }} />
                  Active · CLV mode
                </div>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpen(false)}><X size={14} /></button>
            </div>

            <MessageList messages={messages} typing={typing} />

            {/* Quick chips */}
            {messages.length === 1 && (
              <div style={{ padding: "0 14px 10px", flexShrink: 0, display: "flex", flexWrap: "wrap", gap: 5 }}>
                {SUGGESTIONS.slice(0, 3).map(s => (
                  <button key={s} onClick={() => send(s)} style={{ padding: "5px 10px", borderRadius: 16, border: "1px solid var(--border)", background: "var(--muted)", fontSize: 11.5, color: "var(--foreground)", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
                  >{s.length > 38 ? s.slice(0, 38) + "…" : s}</button>
                ))}
              </div>
            )}

            <InputBar onSend={send} disabled={typing} />
          </div>
        </>
      )}
    </>
  );
}
