"use client";

import React, { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import {
  Bot,
  Send,
  Sparkles,
  User,
  ShieldCheck,
  Receipt,
  HelpCircle,
  ArrowRight
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  time: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am **Ask ReceiptIQ**, your personal purchase memory assistant. Ask me anything about your recorded expenses, stores, purchases, or upcoming warranty expirations.",
      time: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      role: "user",
      content: q,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.askAssistant(q);
      const assistantMsg: Message = {
        role: "assistant",
        content: res.reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        role: "assistant",
        content: "Sorry, I had trouble querying your purchase records. Please check that the server is active.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "How much did I spend this month?",
    "What was my most expensive purchase?",
    "Which warranties expire soon?",
    "How much did I pay for my headphones?",
    "Which merchant did I buy my clothes from?",
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center shadow-subtle">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-navy flex items-center gap-2">
                <span>Ask ReceiptIQ</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Grounded In Vault
                </span>
              </h1>
              <p className="text-xs text-brand-muted">
                Answers strictly derived from your authenticated purchase documents
              </p>
            </div>
          </div>
        </div>

        {/* Chat History Area */}
        <div className="flex-1 bg-white rounded-3xl border border-brand-border p-4 sm:p-6 overflow-y-auto space-y-4 shadow-subtle">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 text-sm ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-4 space-y-1 ${
                  m.role === "user"
                    ? "bg-brand-navy text-white rounded-tr-none"
                    : "bg-slate-50 border border-slate-200 text-brand-navy rounded-tl-none"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                  {m.content}
                </div>
                <div
                  className={`text-[10px] ${
                    m.role === "user" ? "text-slate-300 text-right" : "text-brand-muted"
                  }`}
                >
                  {m.time}
                </div>
              </div>

              {m.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 text-sm justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-4 text-xs text-brand-muted flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-blue animate-ping" />
                <span>Searching your purchase vault records...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-brand-muted uppercase flex-shrink-0">Try asking:</span>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white border border-brand-border text-slate-700 hover:border-brand-blue hover:text-brand-blue text-xs font-medium transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your purchases, items, store locations, or warranties..."
            className="w-full pl-5 pr-14 py-3.5 bg-white border border-brand-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 shadow-subtle"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 p-2 bg-brand-navy hover:bg-slate-800 text-white rounded-xl disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
