import axios from "axios";
import React, { useEffect, useRef, useState } from "react";

const MODEL_OPTIONS = [
  { value: "gemma3", label: "Teta v2.0", disabled: false },
  { value: "gemma4", label: "Gemma 4", disabled: true },
  { value: "netmind", label: "Netmind", disabled: true },
];
import { useNavigate } from "react-router-dom";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { FaceSmileIcon } from "@heroicons/react/24/outline";
import { applyTheme } from "../themes/applyTheme";
import TetaIcon from "./TetaIcon";

interface Message {
  id: string | number;
  text: string;
  isUser: boolean;
  timestamp: Date | null;
  chatId: string | null;
}

const escapeHtml = (input: string): string =>
  input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatInline = (input: string): string =>
  input
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "$1");

const formatBotTextToHtml = (text: string): string => {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  let html = "";
  let inUl = false;
  let inOl = false;

  for (const line of lines) {
    const safe = formatInline(escapeHtml(line));

    if (safe.startsWith("* ") || safe.startsWith("- ")) {
      if (inOl) { html += "</ol>"; inOl = false; }
      if (!inUl) { html += '<ul class="list-disc pl-5 space-y-1">'; inUl = true; }
      html += `<li>${safe.slice(2)}</li>`;
      continue;
    }

    const numMatch = safe.match(/^(\d+)\.\s+([\s\S]+)/);
    if (numMatch) {
      if (inUl) { html += "</ul>"; inUl = false; }
      if (!inOl) { html += '<ol class="list-decimal pl-5 space-y-1">'; inOl = true; }
      html += `<li>${numMatch[2]}</li>`;
      continue;
    }

    if (inUl) { html += "</ul>"; inUl = false; }
    if (inOl) { html += "</ol>"; inOl = false; }
    html += `<p class="mb-2">${safe}</p>`;
  }

  if (inUl) html += "</ul>";
  if (inOl) html += "</ol>";

  return html;
};

const generateTamuSessionId = (): string => {
  const isTest = new URLSearchParams(window.location.search).get("test") === "1";
  const prefix = isTest ? "test-tamu-" : "tamu-";
  return prefix + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
};

const HomeTamu: React.FC = (): React.ReactElement => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [currentCategory, setCurrentCategory] = useState<string>("Hari ini");
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // Session ID dibuat sekali saat mount — setiap kunjungan tamu = sesi baru
  const [tamuSessionId] = useState<string>(() => {
    localStorage.removeItem("tamuSessionId");
    localStorage.removeItem("tamuSessionId_test");
    return generateTamuSessionId();
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<(typeof MODEL_OPTIONS)[number]["value"]>("gemma3");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement | null>(null);

  const name = localStorage.getItem("guestName") || "Tamu";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "Selamat pagi";
    if (hour >= 11 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 18) return "Selamat sore";
    return "Selamat malam";
  };

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
      resizeTextarea();
    }, [inputMessage]);

  useEffect(() => {
    const theme = localStorage.getItem("theme") || "netral";
    applyTheme(theme);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    }
    if (showModelDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModelDropdown]);

  const handleSendMessage = async (customMessage?: string): Promise<void> => {
    const messageToSend = customMessage ?? inputMessage;
    if (messageToSend.trim() === "") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageToSend,
      isUser: true,
      timestamp: new Date(),
      chatId: null,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    try {
      setIsBotTyping(true);

      const systemPrompt = { role: "system", content: `Kamu adalah Teta, chatbot pendamping kesehatan mental untuk remaja. Nama kamu adalah Teta, singkatan dari Teman Cerita. Jawab dengan hangat, empatik, dan gunakan bahasa yang mudah dipahami remaja.` };
      const allMessages = [
        systemPrompt,
        ...messages.map((m) => ({ role: m.isUser ? "user" : "assistant", content: m.text })),
        { role: "user", content: messageToSend },
      ];

      const response = selectedModel === "netmind"
        ? await axios.post(import.meta.env?.VITE_CHAT_URL + "chat/netmind", { messages: allMessages })
        : await axios.post(import.meta.env?.VITE_CHAT_URL + "chat/gpuhub", { messages: allMessages, model: selectedModel });

      setIsBotTyping(false);

      const botMessage: Message = {
        id: Date.now().toString(),
        text: response.data.answer || "Maaf, aku tidak mengerti pertanyaanmu.",
        isUser: false,
        timestamp: new Date(),
        chatId: null,
      };

      setMessages((prev) => [...prev, botMessage]);

      const botText = response.data.answer || "";
      if (botText) {
        const sid = tamuSessionId;
        axios.post(import.meta.env?.VITE_API_URL + "api/chat/save-chat", {
          sessionId: sid,
          question: messageToSend,
          answer: botText,
          timestamp: new Date().toISOString(),
          guestName: name,
        }).catch((e: unknown) => console.error("Gagal menyimpan chat tamu:", e));
      }
    } catch (error) {
      setIsBotTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: "Maaf, terjadi kesalahan server.",
          isUser: false,
          timestamp: new Date(),
          chatId: null,
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };
  
    const resizeTextarea = () => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-theme-background">
      <div className="w-full max-w-4xl mx-auto rounded-3xl shadow-2xl bg-white flex h-[90vh] overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup sidebar"
          />
        )}
        <div
          className={`
    z-30 h-full w-64 chat-sidebar flex flex-col
    transition-transform duration-300
    ${sidebarOpen ? "fixed top-0 left-0 translate-x-0" : "fixed -translate-x-full"}
    md:static md:translate-x-0 md:z-0
  `}
        >
          {/* Header */}
          <div className="px-4 pt-0 pb-0 chat-sidebar flex flex-col items-center justify-center h-20">
            <TetaIcon className="h-28 w-28 object-contain mb-1" alt="TETA" />
          </div>

          <div className="grid grid-cols-1 gap-0.25 mt-2">
            {/* Eksplorasi */}
            <div
              className={`group cursor-pointer py-1 px-4 rounded-2xl transition-all duration-300 flex items-center hover:scale-[1.02] ${currentCategory === "Eksplorasi" ? " shadow-md" : " hover:shadow-sm"}`}
              onClick={() => navigate("/eksplorasi")}
            >
              <div className="h-10 w-10 mr-3 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div className="text-sm font-medium text-gray-600">Eksplorasi</div>
            </div>

            {/* Cek Kondisi Hatimu */}
            <div
              className={`group cursor-pointer py-1 px-4 rounded-2xl transition-all duration-300 flex items-center hover:scale-[1.02] ${currentCategory === "Cek Kondisi Hatimu" ? " shadow-md" : " hover:shadow-sm"}`}
              onClick={() => navigate("/pertanyaan")}
            >
              <div className="h-10 w-10 mr-3 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
       2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
       C13.09 3.81 14.76 3 16.5 3
       19.58 3 22 5.42 22 8.5
       c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  />
                </svg>
              </div>
              <div className="text-sm font-medium text-gray-600">Cek Kondisi Hatimu</div>
            </div>

            {/* Chat Baru */}
            <div
              className={`group cursor-pointer py-1 px-4 rounded-2xl transition-all duration-300 flex items-center hover:scale-[1.02] ${currentCategory === "Chat baru" ? " shadow-md" : " hover:shadow-sm"}`}
              onClick={() => {
                setMessages([]);
                setCurrentCategory("Hari ini");
              }}
            >
              <div className="h-10 w-10 mr-3 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <PencilSquareIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-sm font-medium text-gray-600">Chat Baru</div>
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex flex-col flex-1 h-full min-h-0 ">
          {/* Header */}
          <div className="chat-header py-2 px-4 flex items-center justify-between border-b border-gray-300">
            <div className="flex items-center">
              <button
                className="mr-4 p-2 rounded-full burger transition md:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Buka menu"
              >
                <svg className="h-7 w-7 burger-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <span className="font-semibold text-sm">
                <span className="text-greeting">{getGreeting()}, </span>
                <span className="text-username">{name}</span>
              </span>
            </div>

            {/* Tombol kembali ke login */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center hover:bg-gray-100 rounded-full p-2 transition-all duration-300 mr-3 flex-shrink-0"
              aria-label="Kembali ke Login"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Chat Area & Input */}
          <div className="chat-messages-container flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center ">
              {messages.length === 0 ? (
                <>
                  <h3 className="text-2xl font-semibold mb-4 mt-28 chat-title flex items-center">
                    <FaceSmileIcon className="h-8 w-8 mr-2 text-yellow-500" />
                    Hai, aku Teta - Teman Ceritamu
                  </h3>
                  <div className="text-center text-gray-600 mb-8 max-w-md">
                    Ini adalah ruang aman untuk berbagi cerita, dan aku siap mendengarkan
                  </div>
                </>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${message.isUser ? "justify-end" : "justify-start"} w-full mb-4`}
                    ref={index === messages.length - 1 ? lastMessageRef : null}
                  >
                    {!message.isUser && (
                      <div className="h-8 w-8 rounded-full bot-chat flex items-center justify-center text-white text-sm mr-2 mt-1 flex-shrink-0">T</div>
                    )}

                    <div
                      className={
                        (message.isUser
                          ? "bubble-user px-4 py-3 shadow-sm rounded-3xl rounded-br-none"
                          : "bubble-bot px-4 py-3 shadow-sm rounded-3xl rounded-br-none") + " max-w-[75%] break-words"
                      }
                    >
                      {message.isUser ? (
                        <div className="text-sm">{message.text}</div>
                      ) : (
                        <div
                          dangerouslySetInnerHTML={{ __html: formatBotTextToHtml(message.text) }}
                          className="prose max-w-none text-sm prose-p:my-2 prose-li:my-1"
                        />
                      )}
                    </div>

                    {message.isUser && (
                      <div className="h-8 w-8 rounded-full bot-chat flex items-center justify-center text-white text-sm ml-2 mt-1 flex-shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                /*  */    )}
                  </div>
                ))
              )}

              {isBotTyping && (
                <div className="flex justify-start w-full mb-4">
                  <div className="h-8 w-8 rounded-full bot-chat flex items-center justify-center text-white text-sm mr-2 mt-1 flex-shrink-0">T</div>
                  <div className="bubble-bot px-4 py-3 shadow-sm max-w-xs md:max-w-md lg:max-w-lg break-words">
                    <div className="text-sm animate-pulse text-gray-500">TETA sedang mengetik...</div>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="p-6 chat-section mt-6">
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  <textarea
                    placeholder="Tulis ceritamu disini..."
                    value={inputMessage}
                    onChange={(e: { target: { value: any; }; }) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    rows={1}
                    ref={textareaRef}
                    className="w-full pt-4 pb-14 px-5 pr-16 rounded-3xl shadow-md border border-gray-300 bg-gray-100 focus:outline-none text-gray-600 placeholder-gray-400 text-sm leading-6 resize-none max-h-24 overflow-y-auto"
                  />
                  {/* Bottom-right controls: model selector + send button */}
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    {/* Model selector */}
                    <div className="relative" ref={modelDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowModelDropdown((v: boolean) => !v)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-medium transition-colors"
                      >
                        <span>{MODEL_OPTIONS.find((m) => m.value === selectedModel)?.label}</span>
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showModelDropdown && (
                        <div className="absolute bottom-full mb-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden min-w-[130px]">
                          {MODEL_OPTIONS.filter((opt) => !opt.disabled).map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                                selectedModel === opt.value
                                  ? "text-indigo-600 font-semibold bg-indigo-50"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                              onClick={() => { setSelectedModel(opt.value); setShowModelDropdown(false); }}
                            >
                              {opt.label}
                              {selectedModel === opt.value && (
                                <svg className="h-3 w-3 ml-auto text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Send button */}
                    <button
                      onClick={() => handleSendMessage()}
                      className={`p-2 rounded-2xl transition flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        inputMessage.trim()
                          ? "bg-gray-900 hover:bg-gray-800 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-600"
                      }`}
                      disabled={inputMessage.trim() === ""}
                      aria-label="Send message"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="19" x2="12" y2="7" />
                        <polyline points="6 13 12 7 18 13" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeTamu;
