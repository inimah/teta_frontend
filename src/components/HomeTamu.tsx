import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

type Message = {
  role: "user" | "bot";
  content: string;
  timestamp?: number;
};

type Chat = {
  id: number;
  title: string;
  messages: Message[];
};

const EMOTIONS = [
  { label: "😊 Bahagia", value: "bahagia" },
  { label: "🥺 Sedih", value: "sedih" },
  { label: "😠 Marah", value: "marah" },
  { label: "😬 Cemas", value: "cemas" },
];

const HomeTamu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [guestName, setGuestName] = useState<string>("Tamu");
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const name = localStorage.getItem("guestName") || "Tamu";
    setGuestName(name);
    // Otomatis buat chat baru saat pertama kali masuk
    if (chats.length === 0) {
      handleNewChat();
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chats, currentChatId, isBotTyping]);

  // const handleBackClick = () => navigate(-1);

  // Mirip Home: handleNewChat langsung buat sesi baru
  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now(),
      title: "Percakapan Baru",
      messages: [],
    };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setSidebarOpen(false);
  };

  // Icon emosi bisa diklik dan langsung kirim ke bot
  const handleEmotionClick = async (emotion: string): Promise<void> => {
    await handleSendMessage(`Saya merasa ${emotion}`);
  };

  const currentChat = chats.find((chat) => chat.id === currentChatId);

  // Fungsi kirim pesan ke bot (tidak simpan ke DB)
  const handleSendMessage = async (message: string) => {
    if (!currentChatId) return;
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [
                ...chat.messages,
                { role: "user", content: message, timestamp: Date.now() },
              ],
              title:
                chat.messages.length === 0 ? message.slice(0, 30) : chat.title,
            }
          : chat
      )
    );
    setIsBotTyping(true);

    try {
      const res = await fetch("http://localhost:5007/api/openrouter/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "Anda adalah asisten psikolog untuk remaja Indonesia usia 15-18 tahun. Jawab dengan empati dan singkat.",
            },
            {
              role: "user",
              content: message,
            },
          ],
        }),
      });
      const data = await res.json();
      const botReply = data.answer || "Maaf, saya tidak mengerti.";
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  { role: "bot", content: botReply, timestamp: Date.now() },
                ],
              }
            : chat
        )
      );
    } catch (err) {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  { role: "bot", content: "Bot error.", timestamp: Date.now() },
                ],
              }
            : chat
        )
      );
    }
    setIsBotTyping(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const pesan = newMessage.trim();
    setNewMessage("");
    await handleSendMessage(pesan);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  // Greeting function (mirip Home)
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "Selamat pagi";
    if (hour >= 11 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 18) return "Selamat sore";
    return "Selamat malam";
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
            ${
              sidebarOpen
                ? "fixed top-0 left-0 translate-x-0"
                : "fixed -translate-x-full"
            }
            md:static md:translate-x-0 md:z-0
          `}
        >
          <div className="flex items-center mt-4 ml-4 mb-2">
            <button
              onClick={() => navigate("/")}
              className="eksplorasi-back-btn flex items-center hover:opacity-70 transition-opacity"
              aria-label="Kembali"
            >
              <ChevronLeftIcon className="h-7 w-7 eksplorasi-back-icon text-gray-500" />
            </button>
          </div>
          {/* Header */}
          <div className="px-4 py-3 chat-sidebar flex flex-col items-center justify-center">
            <img
              src="/Teta_girl.png"
              alt="TETA"
              className="h-24 w-24 object-contain mb-2"
              style={{ display: "block" }}
            />
          </div>
          {/* Menu */}
          <div className="flex h-screen overflow-y-auto">
            <div className="w-64 h-full flex flex-col chat-sidebar">
              <div className="grid grid-cols-1 gap-1 mt-2">
                <div
                  className={`group cursor-pointer py-1 px-3 rounded-xl transition-all duration-300 flex items-center hover:scale-[1.02] ${
                    location.pathname === "/eksplorasi"
                      ? "shadow-md"
                      : "hover:shadow-sm"
                  }`}
                  onClick={() => navigate("/eksplorasi")}
                >
                  <div className="h-8 w-8 mr-3 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-gray-600">
                    Eksplorasi
                  </div>
                </div>
                <div
                  className="group cursor-pointer py-1 px-3 rounded-xl transition-all duration-300 flex items-center hover:scale-[1.02] hover:shadow-sm"
                  onClick={() => navigate("/pertanyaan")}
                >
                  <div className="h-8 w-8 mr-3 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
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
                  <div className="text-sm font-medium text-gray-600">
                    Cek Kondisi Hatimu
                  </div>
                </div>
                <div
                  className={`group cursor-pointer py-1 px-3 rounded-xl transition-all duration-300 flex items-center hover:scale-[1.02] ${
                    currentChatId === null ? "shadow-md" : "hover:shadow-sm"
                  }`}
                  onClick={handleNewChat}
                >
                  <div className="h-8 w-8 mr-3 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-gray-600">
                    Chat Baru
                  </div>
                </div>
              </div>
              {/* Riwayat Chat */}
              <div className="flex items-center py-3">
                <div className="chat-riwayat-text"></div>
                <h3 className="chat-riwayat-label">Riwayat Chat</h3>
                <div className="chat-riwayat-text"></div>
              </div>
              <div className="space-y-1">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`py-0 px-2 rounded-md transition-all duration-200 flex items-center justify-between hover:bg-gray-50 text-gray-600 group cursor-pointer ${
                      currentChatId === chat.id
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-700 border border-blue-100 shadow-sm"
                        : ""
                    }`}
                    onClick={() => {
                      setCurrentChatId(chat.id);
                      setSidebarOpen(false);
                    }}
                  >
                    <div className="flex items-center overflow-hidden flex-1">
                      <div className="h-4 w-4 mr-2 bg-transparent rounded flex items-center justify-center flex-shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-2.5 w-2.5 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                          />
                        </svg>
                      </div>
                      <div className="truncate text-xs flex-1">
                        {chat.title}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Logout button dihapus */}
            </div>
          </div>
        </div>
        {/* Main Area */}
        <div className="flex flex-col flex-1 h-full min-h-0">
          {/* Header */}
          <div className="chat-header py-2 px-4 flex items-center border-b border-gray-300">
            <button
              className="mr-4 p-2 rounded-full burger transition md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
            >
              <svg
                className="h-7 w-7 burger-icon"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <span className="font-semibold text-sm text chat-header">
              <span className="text-greeting">{getGreeting()}, </span>
              <span className="text-username">{guestName || "Tamu"}</span>
            </span>
          </div>
          {/* Chat Area & Input */}
          <div className="chat-messages-container flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
              {(currentChat?.messages.length ?? 0) === 0 ? (
                <>
                  <h3 className="text-2xl font-semibold mb-4 mt-28 chat-title">
                    Bagaimana perasaanmu
                  </h3>
                  <div className="flex flex-wrap justify-center gap-4 mb-8 chat-emot">
                    {EMOTIONS.map((emot) => (
                      <button
                        key={emot.value}
                        onClick={() => handleEmotionClick(emot.value)}
                        className="chat-icon text-gray-600 px-4 py-2 rounded-full"
                      >
                        {emot.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                currentChat?.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    } w-full mb-4`}
                    ref={
                      idx === (currentChat?.messages.length ?? 0) - 1
                        ? lastMessageRef
                        : null
                    }
                  >
                    {/* Avatar Bot */}
                    {msg.role === "bot" && (
                      <div className="h-8 w-8 rounded-full bot-chat flex items-center justify-center text-white text-sm mr-2 mt-1 flex-shrink-0">
                        C
                      </div>
                    )}
                    <div
                      className={
                        (msg.role === "user"
                          ? "bubble-user px-4 py-3 shadow-sm rounded-3xl rounded-br-none"
                          : "bubble-bot px-4 py-3 shadow-sm rounded-3xl rounded-br-none") +
                        " max-w-[75%] break-words"
                      }
                    >
                      <div className="text-sm">{msg.content}</div>
                      <div className="text-xs mt-1 text-right text-black">
                        {msg.timestamp &&
                          new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </div>
                    </div>
                    {/* Avatar User */}
                    {msg.role === "user" && (
                      <div className="h-8 w-8 rounded-full bot-chat flex items-center justify-center text-white text-sm ml-2 mt-1 flex-shrink-0">
                        {guestName && guestName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))
              )}
              {isBotTyping && (
                <div className="flex justify-start w-full mb-4">
                  <div className="h-8 w-8 rounded-full bot-chat flex items-center justify-center text-white text-sm mr-2 mt-1 flex-shrink-0">
                    C
                  </div>
                  <div className="bubble-bot px-4 py-3 shadow-sm max-w-xs md:max-w-md lg:max-w-lg break-words">
                    <div className="text-sm animate-pulse text-gray-500">
                      Bot sedang mengetik...
                    </div>
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
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      autoComplete="off"
                      className="w-full py-2 px-5 bg-transparent focus:outline-none text-gray-600 placeholder-gray-400"
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full transition flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    disabled={newMessage.trim() === ""}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 transform rotate-300"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
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
