import React, { useState } from "react";
import { MessageSquare, Send, Bot, User } from "lucide-react";
import { apiClient } from "@/lib/api";

interface ChatPanelProps {
  context?: Record<string, any>;
}

export function ChatPanel({ context }: ChatPanelProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "advisor"; text: string }>>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!query.trim() || loading) return;
    const userMsg = query.trim();
    setQuery("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await apiClient.chat(userMsg);
      setMessages((prev) => [...prev, { role: "advisor", text: res.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: "advisor", text: "Sorry, I could not process your query. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-antigravity-navy/10 rounded-xl shadow-subtle flex flex-col h-[500px]">
      <div className="p-4 border-b border-antigravity-navy/10 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-antigravity-orange" />
        <h2 className="font-serif text-lg font-bold text-antigravity-navy">AI Business Advisor Chat</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-10 h-10 text-antigravity-navy/20 mx-auto mb-3" />
            <p className="font-sans text-sm text-antigravity-navy/40">Ask about feasibility, schemes, financials, or timing.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-3 rounded-xl ${
              msg.role === "user"
                ? "bg-antigravity-navy text-white rounded-br-none"
                : "bg-antigravity-cream border border-antigravity-navy/10 text-antigravity-charcoal rounded-bl-none"
            }`}>
              <div className="flex items-start gap-1.5">
                {msg.role === "advisor" && <Bot className="w-4 h-4 text-antigravity-sage mt-0.5 shrink-0" />}
                <p className="font-sans text-xs leading-relaxed">{msg.text}</p>
                {msg.role === "user" && <User className="w-4 h-4 text-white/60 mt-0.5 shrink-0" />}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-antigravity-cream border border-antigravity-navy/10 p-3 rounded-xl rounded-bl-none">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-antigravity-navy/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-antigravity-navy/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-antigravity-navy/30 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-antigravity-navy/10">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about schemes, EMI, feasibility..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-antigravity-navy/15 focus:border-antigravity-orange outline-none font-sans text-sm text-antigravity-charcoal bg-antigravity-cream/40"
          />
          <button
            onClick={handleSend}
            disabled={loading || !query.trim()}
            className="w-10 h-10 rounded-lg bg-antigravity-orange text-white flex items-center justify-center hover:bg-[#c45e1f] transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
