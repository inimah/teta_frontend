import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { applyTheme } from "../themes/applyTheme";
import TetaIcon from "./TetaIcon";

interface Message {
  id: string | number;
  text: string;
  isUser: boolean;
  timestamp: Date | null;
  chatId: string | null;
}

const HomeTamu: React.FC = (): React.ReactElement => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [currentCategory, setCurrentCategory] = useState<string>("Hari ini");
  const lastMessageRef = useRef<HTMLDivElement | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);

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
    const theme = localStorage.getItem("theme") || "netral";
    applyTheme(theme);
  }, []);

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

      const response = await axios.post("http://localhost:5006/chat", {
        messages: [
          ...messages.map((m) => ({ role: m.isUser ? "user" : "assistant", content: m.text })),
          { role: "user", content: messageToSend },
        ],
      });

      setIsBotTyping(false);

      const botMessage: Message = {
        id: Date.now().toString(),
        text: response.data.answer || "Maaf, aku tidak mengerti pertanyaanmu.",
        isUser: false,
        timestamp: new Date(),
        chatId: null,
      };

      setMessages((prev) => [...prev, botMessage]);
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

  const handleEmotionClick = async (emotion: string): Promise<void> => {
    await handleSendMessage(`Saya merasa ${emotion}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") handleSendMessage();
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
                  <h3 className="text-2xl font-semibold mb-4 mt-28 chat-title">
                    Bagaimana perasaanmu
                  </h3>
                  <div className="flex flex-wrap justify-center gap-4 mb-8 chat-emot">
                    <button onClick={() => handleEmotionClick("senang")} className="bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-gray-700 px-4 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md">😁 Senang</button>
                    <button onClick={() => handleEmotionClick("sedih")} className="bg-gradient-to-r from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 text-gray-700 px-4 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md">😔 Sedih</button>
                    <button onClick={() => handleEmotionClick("marah")} className="bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 text-gray-700 px-4 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md">😡 Marah</button>
                    <button onClick={() => handleEmotionClick("cemas")} className="bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 text-gray-700 px-4 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md">🥶 Cemas</button>
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
                      <div className="h-8 w-8 rounded-full bot-chat flex items-center justify-center text-white text-sm mr-2 mt-1 flex-shrink-0">C</div>
                    )}

                    <div
                      className={
                        (message.isUser
                          ? "bubble-user px-4 py-3 shadow-sm rounded-3xl rounded-br-none"
                          : "bubble-bot px-4 py-3 shadow-sm rounded-3xl rounded-br-none") + " max-w-[75%] break-words"
                      }
                    >
                      <div className="text-sm">{message.text}</div>
                      <div className="text-xs mt-1 text-right text-black">
                        {message.timestamp !== null &&
                          new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    {message.isUser && (
                      <div className="h-8 w-8 rounded-full bot-chat flex items-center justify-center text-white text-sm ml-2 mt-1 flex-shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))
              )}

              {isBotTyping && (
                <div className="flex justify-start w-full mb-4">
                  <div className="h-8 w-8 rounded-full bot-chat flex items-center justify-center text-white text-sm mr-2 mt-1 flex-shrink-0">C</div>
                  <div className="bubble-bot px-4 py-3 shadow-sm max-w-xs md:max-w-md lg:max-w-lg break-words">
                    <div className="text-sm animate-pulse text-gray-500">TETA sedang mengetik...</div>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="p-6 chat-section mt-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-full shadow-md border border-gray-300 bg-gray-100 overflow-hidden transition chat-input-pesan">
                    <input
                      type="text"
                      placeholder="Tulis pesan disini..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      autoComplete="off"
                      className="w-full py-2 px-5 bg-transparent focus:outline-none text-gray-600 placeholder-gray-400"
                    />
                  </div>
                  <button
                    onClick={() => handleSendMessage()}
                    className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full transition flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    disabled={inputMessage.trim() === ""}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
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
