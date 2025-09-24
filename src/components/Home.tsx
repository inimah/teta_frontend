 import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { UserIcon } from "@heroicons/react/24/solid";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { applyTheme } from "../themes/applyTheme";
import { toast } from "react-toastify";
import TetaIcon from "./TetaIcon";
import * as XLSX from "xlsx";

interface Message {
  id: string | number;
  text: string;
  isUser: boolean;
  timestamp: Date | null;
  chatId: string | null;
}

// interface DialogData {
//   sessionId: string;
//   _id: string;
//   question?: string;
//   answer?: string;
//   createdAt?: string;
//   updatedAt?: string;
//   tajuk?: string;
// }

interface ChatSession {
  chatId: string | number | null;
  title: string;
  enabled?: boolean;
  messages: Message[];
  created: Date | null;
  lastUpdated: Date | null;
  sessionId: string;
}

const toMs = (v: unknown): number => {
  if (!v) return -Infinity;
  if (v instanceof Date) return isNaN(v.getTime()) ? -Infinity : v.getTime();
  const n = typeof v === "number" ? v : new Date(String(v)).getTime();
  return isNaN(n) ? -Infinity : n;
};

const sortSessions = <
  T extends { created?: any; createdAt?: any; lastUpdated?: any; updatedAt?: any }
>(
  arr: T[]
): T[] => {
  const stamp = (s: T) =>
    toMs(s.lastUpdated ?? s.updatedAt ?? s.created ?? s.createdAt);
  return [...arr].sort((a, b) => stamp(b) - stamp(a));
};

const Home: React.FC = (): React.ReactElement => {
  const navigate = useNavigate();
  const { logOut } = UserAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [currentCategory, setCurrentCategory] = useState<string>("Hari ini");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const [theme] = useState("netral");
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [showAllTodayChats, setShowAllTodayChats] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    _id: string;
    name: string;
    sapaan?: string;
    email?: string;
  } | null>(null);
  const [showPopup, setShowPopup] = useState<boolean>(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [, setIsLoggedIn] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isBotTyping, setIsBotTyping] = useState(false);

  // helper

  const handleExportToXLS = (sessionId: string) => {
    const session = chatHistory.find((chat) => chat.sessionId === sessionId);
    if (!session) {
      alert("Sesi chat tidak ditemukan.");
      return;
    }

    // Prepare data rows: pair user and bot messages
    const rows: Array<{ text_user: string; text_chatbot: string; koreksi: string; komentar: string }> = [];
    let userMsg = "";
    let botMsg = "";

    session.messages.forEach((msg) => {
      if (msg.isUser) {
        if (userMsg || botMsg) {
          rows.push({ text_user: userMsg, text_chatbot: botMsg, koreksi: "", komentar: "" });
          botMsg = "";
        }
        userMsg = msg.text;
      } else {
        botMsg = msg.text;
      }
    });
    // Push last pair
    if (userMsg || botMsg) {
      rows.push({ text_user: userMsg, text_chatbot: botMsg, koreksi: "", komentar: "" });
    }

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(rows);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chat");

    // Add table to the worksheet
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const tableRef = XLSX.utils.encode_range(range);
    ws['!autofilter'] = { ref: tableRef };
    ws['!tables'] = [{ name: 'ChatTable', ref: tableRef, headerRow: true }];

    // Save file
    XLSX.writeFile(wb, `${session.title || "chat-session"}.xlsx`);
  };
  const firstWord = (s?: string) => (s || "").trim().split(/\s+/)[0] || "";

  const getDisplayName = (user: { sapaan?: string; name?: string } | null) => {
    // Kalau sudah login, selalu ambil dari objek user terbaru
    if (user) {
      const s = (user.sapaan || "").trim();
      return s || firstWord(user.name || "") || "User";
    }

    // Hanya pakai localStorage kalau memang mode tamu
    if (localStorage.getItem("isGuest") === "true") {
      return localStorage.getItem("guestName") || "Tamu";
    }

    return "User";
  };

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
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    if (activeDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  // fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const response = await fetch(import.meta.env?.VITE_API_URL + "api/user", {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        if (response.status === 403) {
          localStorage.removeItem("authToken");
          return;
        }
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();            // { status, user }
        setCurrentUser(data.user);

        // simpan prefer sapaan; name disimpan sebagai "nama depan"
        if ((data.user?.sapaan || "").trim()) localStorage.setItem("sapaan", data.user.sapaan);
        localStorage.setItem("name", firstWord(data.user?.name || ""));
        // setName(getDisplayName(data.user)); // state cadangan
      } catch (error) {
        console.error("Error in fetchUser:", error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const refreshSapaan = () => {
      const s = (localStorage.getItem("sapaan") || "").trim();
      if (!s) return;
      // update objek currentUser agar getDisplayName(currentUser) ikut berubah
      setCurrentUser(u => (u ? { ...u, sapaan: s } : u));
    };

    // jalan sekali saat mount (ketika kembali dari EditProfile)
    refreshSapaan();

    // dengarkan event custom saat profil selesai di-update
    window.addEventListener("teta:profile-updated", refreshSapaan);

    // opsional: juga refresh saat tab fokus lagi
    window.addEventListener("focus", refreshSapaan);

    return () => {
      window.removeEventListener("teta:profile-updated", refreshSapaan);
      window.removeEventListener("focus", refreshSapaan);
    };
  }, []);


  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => setShowPopup(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    axios
      .get(import.meta.env?.VITE_API_URL + "api/auth/verify", {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      })
      .then((response) => {
        if (response.data.status) {
          const userFromResponse = response.data.user;
          setCurrentUser(userFromResponse);
          // setName(getDisplayName(userFromResponse));
          setIsLoggedIn(true);
          setShowPopup(true);

          localStorage.setItem("userId", userFromResponse._id);
          // localStorage.setItem("name", userFromResponse?.sapaan || userFromResponse?.name || "");
          if ((userFromResponse?.sapaan || "").trim()) {
            localStorage.setItem("sapaan", userFromResponse.sapaan);
          }
          // localStorage.setItem("name", firstWord(userFromResponse?.name || ""));

          setMessages([]);
          setCurrentChatId(null);
          setCurrentSessionId(null);
          setCurrentCategory("Hari ini");
          localStorage.removeItem("currentSessionId");
        } else {
          toast.error("Token expired. Silakan login kembali.");
          localStorage.removeItem("authToken");
          navigate("/");
        }
      })
      .catch((error) => {
        console.error("Error verifying authentication:", error);
        navigate("/");
      });
  }, [navigate]);

  // setelah user siap → buat sessionId di server, TAPI jangan push ke riwayat dulu
  // useEffect(() => {
  //   if (currentUser && currentUser._id) {
  //     handleNewChat();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [currentUser]);

  // non-guest: fetch history
  useEffect(() => {
    if (localStorage.getItem("isGuest") === "true") {
      // setName(localStorage.getItem("guestName") || "Tamu");
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/");
      return;
    }
    fetchChatHistory(userId);
  }, [navigate]);

  useEffect(() => {
    if (chatHistory.length > 0) {
      setCurrentCategory("Hari ini");
    }
  }, [chatHistory]);

  // useEffect(() => {
  //   const storedSapaan = localStorage.getItem("sapaan");
  //   const storedName = localStorage.getItem("guestName") || localStorage.getItem("name") || "User";
  //   setName(storedSapaan || storedName);
  // }, []);

  // A) ensureSession: return both sid and a stable cid for this session
  const ensureSession = async (): Promise<{ sid: string; cid: string }> => {
    if (currentSessionId && currentChatId) return { sid: currentSessionId, cid: currentChatId };

    if (!currentUser) throw new Error("User not authenticated");
    const { data } = await axios.post(import.meta.env?.VITE_API_URL + "api/chatbot/session", {
      userId: currentUser._id,
    });

    const sid: string = data.sessionId;
    const cid: string = Date.now().toString();

    setCurrentSessionId(sid);
    setCurrentChatId(cid);
    localStorage.setItem("currentSessionId", sid);

    return { sid, cid };
  };




  const fetchChatHistory = async (userId: string | null) => {
    if (!userId) {
      setChatHistory([]);
      return;
    }
    try {
      const response = await axios.get(import.meta.env?.VITE_API_URL + `api/chatbot/get-chat/${userId}`);
      if (response.data && Array.isArray(response.data.chatHistory)) {
        setChatHistory(sortSessions(response.data.chatHistory));
      } else {
        setChatHistory([]);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setChatHistory([]);
    }
  };

  useEffect(() => {
    if (currentUser?._id) {
      fetchChatHistory(currentUser._id);
      setMessages([]);
      setCurrentChatId(null);
      setCurrentSessionId(null);
      setCurrentCategory("Hari ini");
    }
  }, [currentUser]);

  const saveChatHistory = async (
    userId: string | null,
    sessionId: string,
    dialogData: { question: string; answer: string; timestamp: Date }
  ) => {
    if (!userId) return;
    try {
      await axios.post(import.meta.env?.VITE_API_URL + "api/chat/save-chat", {
        userId,
        sessionId,
        question: dialogData.question,
        answer: dialogData.answer,
        timestamp: dialogData.timestamp,
      });
    } catch (error) {
      console.error("Error saving chat history:", (error as any).response?.data || error);
    }
  };

  // === PERUBAHAN: reset state tanpa membuat sesi server ===
  const handleNewChat = async () => {
    // Reset state tanpa membuat sesi baru
    setCurrentSessionId(null);
    setCurrentChatId(null);
    setMessages([]);
    localStorage.removeItem("currentSessionId");
    setCurrentCategory("Hari ini");
    // Sesi akan dibuat hanya ketika user mengirim pesan pertama
  };

  // resort + update judul ketika pesan pertama user
  // B) updateChatHistory: accept sessionId + chatId explicitly
  const updateChatHistory = (sessionId: string, chatId: string | null, message: Message): void => {
    setChatHistory((prev) => {
      const idx = prev.findIndex((s) => s.sessionId === sessionId);
      let next = [...prev];

      if (idx === -1) {
        const firstTitle =
          message.isUser && message.text.trim()
            ? message.text.substring(0, 30)
            : "Percakapan Baru";

        const newSession: ChatSession = {
          chatId,
          sessionId,
          title: firstTitle,
          messages: [message],
          created: message.timestamp || new Date(),
          lastUpdated: message.timestamp || new Date(),
        };
        return sortSessions([newSession, ...next]);
      }

      const updated = { ...next[idx] };
      updated.messages = [...updated.messages, message];
      updated.lastUpdated = new Date();

      if (message.isUser && updated.messages.filter((m) => m.isUser).length === 1) {
        updated.title = message.text.substring(0, 30);
      }

      next[idx] = updated;
      return sortSessions(next);
    });
  };


  // C) handleSendMessage: remove the "!currentSessionId" guard, use sid/cid everywhere
  const handleSendMessage = async (customMessage?: string): Promise<void> => {
    const messageToSend = customMessage !== undefined ? customMessage : inputMessage;
    if (messageToSend.trim() === "") return; // <-- remove the `|| !currentSessionId`

    const { sid, cid } = await ensureSession();

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageToSend,
      isUser: true,
      timestamp: new Date(),
      chatId: cid,
    };

    setMessages((prev) => [...prev, userMessage]);
    updateChatHistory(sid, cid, userMessage);
    setInputMessage("");

    try {
      setIsBotTyping(true);

      const systemPrompt = { role: "system", content: `Kamu adalah chatbot pendamping kesehatan mental...` };
      const allMessages = [
        systemPrompt,
        ...messages.map((m) => ({ role: m.isUser ? "user" : "assistant", content: m.text })),
        { role: "user", content: messageToSend },
      ];

      // IMPORTANT: use `sid` here
      // const response = await axios.post(import.meta.env?.VITE_API_URL + "/api/openrouter/chat", {
      //   messages: allMessages,
      //   sessionId: sid,
      //   userId: localStorage.getItem("userId"),
      // });

      const response = await axios.post(import.meta.env?.VITE_CHAT_URL + "chat", {
        messages: allMessages,
        sessionId: sid,
        userId: localStorage.getItem("userId"),
      });

      // const response = await axios.post(import.meta.env?.VITE_API_URL + "/api/hf/chat", {
      // messages: allMessages,
      // // optional: you can include sid if you implemented ensureSession()
      // sessionId: sid,
      // });

      await new Promise((r) => setTimeout(r, 800));
      setIsBotTyping(false);

      const botText =
        response.data.answer && response.data.answer.trim() !== ""
          ? response.data.answer.trim()
          : "Maaf, aku tidak mengerti pertanyaanmu.";

      const botMessage: Message = {
        id: Date.now().toString(),
        text: botText,
        isUser: false,
        timestamp: new Date(),
        chatId: cid,
      };

      setMessages((prev) => [...prev, botMessage]);
      updateChatHistory(sid, cid, botMessage);

      const userId = localStorage.getItem("userId");
      if (userId) {
        await saveChatHistory(userId, sid, {
          question: messageToSend,
          answer: botText,
          timestamp: new Date(),
        });

        const sessionInList = chatHistory.find((c) => c.sessionId === sid);
        if (sessionInList && (!sessionInList.title || sessionInList.title === "Percakapan Baru")) {
          await axios.put(import.meta.env?.VITE_API_URL + `api/session/rename/${sid}`, {
            tajuk: messageToSend.substring(0, 30),
          });
          fetchChatHistory(userId);
        }
      }
    } catch (error) {
      setIsBotTyping(false);
      console.error("Error fetching bot answer:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Maaf, terjadi kesalahan saat menghubungi server.",
        isUser: false,
        timestamp: new Date(),
        chatId: cid,
      };
      setMessages((prev) => [...prev, errorMessage]);
      updateChatHistory(sid, cid, errorMessage);
    }
  };


  const handleEmotionClick = async (emotion: string): Promise<void> => {
    await handleSendMessage(`Saya merasa ${emotion}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") handleSendMessage();
  };

  const handleCategoryClick = (category: string): void => {
    if (category === "Chat baru") {
      handleNewChat();
      setCurrentCategory("Hari ini");
    } else {
      setCurrentCategory(category);
    }
  };

  // D) (Optional) categorizeChats: use same timestamp logic as sorter
  const categorizeChats = () => {
    const now = Date.now();
    const todayChats: typeof chatHistory = [];
    const sevenDaysChats: typeof chatHistory = [];
    const thirtyDaysChats: typeof chatHistory = [];

    const unique = new Set<string>();
    sortSessions(chatHistory).forEach((chat) => {
      if (unique.has(chat.sessionId)) return;
      unique.add(chat.sessionId);

      const ms = toMs(
        chat.lastUpdated ?? (chat as any).updatedAt ?? chat.created ?? (chat as any).createdAt
      );
      const diffDays = Math.floor(Math.abs(now - (ms === -Infinity ? 0 : ms)) / (1000 * 60 * 60 * 24));

      if (diffDays < 7) todayChats.push(chat);
      else if (diffDays < 30) sevenDaysChats.push(chat);
      else thirtyDaysChats.push(chat);
    });

    return { todayChats, sevenDaysChats, thirtyDaysChats };
  };


  const { sevenDaysChats, thirtyDaysChats } = categorizeChats();

  const loadChat = (sessionId: string) => {
    const selected = chatHistory.find((c) => c.sessionId === sessionId);
    if (!selected) return;
    setCurrentChatId(String(selected.chatId));
    setCurrentSessionId(selected.sessionId);
    setMessages([...selected.messages]);
    localStorage.setItem("currentSessionId", sessionId);
    setCurrentCategory("Hari ini");
  };

  const handleEditProfile = () => {
    if (currentUser) navigate("/edit-profile", { state: { email: currentUser.email } });
  };

  const handleRenameInline = async (sessionId: string, newTitle: string) => {
    if (!newTitle || !sessionId) return;
    try {
      const response = await axios.put(
        import.meta.env?.VITE_API_URL + `api/session/rename/${sessionId}`,
        { tajuk: newTitle }
      );
      if (response.status === 200) {
        setChatHistory((prevHistory) =>
          sortSessions(
            prevHistory.map((chat) =>
              chat.sessionId === sessionId ? { ...chat, title: newTitle } : chat
            )
          )
        );
      }
    } catch {
      toast.error("Gagal mengubah judul.");
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      const response = await axios.put(
        import.meta.env?.VITE_API_URL + `api/session/delete/${sessionId}`,
        { enabled: false }
      );
      if (response.status === 200) {
        setChatHistory((prev) => prev.filter((c) => c.sessionId !== sessionId));
        if (sessionId === currentSessionId) {
          setMessages([]);
          setCurrentSessionId(null);
        }
      } else {
        toast.error("Gagal menghapus sesi.");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Gagal menghapus sesi.");
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      localStorage.removeItem("authToken");
      localStorage.setItem("theme", theme);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const theme = localStorage.getItem("theme") || "netral";
    applyTheme(theme);
  }, []);

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
    z-30 h-full w-64 chat-sidebar  flex flex-col
    transition-transform duration-300
    ${sidebarOpen ? "fixed top-0 left-0 translate-x-0" : "fixed -translate-x-full"}
    md:static md:translate-x-0 md:z-0
  `}
        >
          {/* Header */}
          <div className="px-4 pt-0 pb-0 chat-sidebar flex flex-col items-center justify-center h-20">
            <TetaIcon
              className="h-28 w-28 object-contain mb-1"
              alt="TETA"
            />
          </div>

          <div className="flex h-screen overflow-y-auto">
            <div className="w-64 h-full flex flex-col chat-sidebar">
              <div className="grid grid-cols-1 gap-0.25 mt-2">
                {/* Eksplorasi */}
                <div
                  className={`group cursor-pointer py-1 px-4 rounded-2xl transition-all duration-300 flex items-center hover:scale-[1.02] ${currentCategory === "Eksplorasi" ? " shadow-md" : " hover:shadow-sm"
                    }`}
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
                  className={`group cursor-pointer py-1 px-4 rounded-2xl transition-all duration-300 flex items-center hover:scale-[1.02] ${currentCategory === "Cek Kondisi Hatimu" ? " shadow-md" : " hover:shadow-sm"
                    }`}
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
                  className={`group cursor-pointer py-1 px-4 rounded-2xl transition-all duration-300 flex items-center hover:scale-[1.02] ${currentCategory === "Chat baru" ? " shadow-md" : " hover:shadow-sm"
                    }`}
                  onClick={() => handleCategoryClick("Chat baru")}
                >
                  <div className="h-10 w-10 mr-3 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <PencilSquareIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="text-sm font-medium text-gray-600">Chat Baru</div>
                </div>
              </div>

              {/* Riwayat Chat */}
              <div className="flex items-center py-3">
                <h3 className="chat-riwayat-label flex items-center space-x-2 text-lg font-semibold">
                  <span>Riwayat Chat</span>
                </h3>
              </div>

              {/* Hanya sesi yang sudah berisi pesan yang tampil (karena kita tidak pernah push sesi kosong) */}
              <div className="space-y-1 max-h-[calc(90vh-200px)]" style={{ overflowY: activeDropdown ? 'visible' : 'auto' }}>


                {currentCategory === "Hari ini" && (
                  <div className="ml-4 mt-0.5 ">
                    {(showAllTodayChats ? chatHistory : chatHistory.slice(0, 5)).map((chat, index) => (
                      <div
                        key={`${chat.sessionId}-${index}`}
                        className="py-0 px-2 rounded-md transition-all duration-200 flex items-center justify-between hover:bg-gray-50 t text-gray-600 group"
                      >
                          <div className="flex items-center cursor-pointer overflow-hidden flex-1" onClick={() => loadChat(chat.sessionId)}>
                            <div className="h-4 w-4 mr-2 bg-transparent rounded flex items-center justify-center flex-shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                          <div
                            className="truncate text-xs flex-1"
                            onDoubleClick={() => {
                              setEditingSessionId(chat.sessionId);
                              setEditingTitle(chat.title || "");
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setActiveDropdown(chat.sessionId);
                            }}
                          >
                            {editingSessionId === chat.sessionId ? (
                              <input
                                type="text"
                                value={editingTitle}
                                autoFocus
                                className="w-full px-1 py-0.5 rounded border border-blue-300 text-xs"
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onBlur={async () => {
                                  await handleRenameInline(chat.sessionId, editingTitle);
                                  setEditingSessionId(null);
                                }}
                                onKeyDown={async (e) => {
                                  if (e.key === "Enter") {
                                    await handleRenameInline(chat.sessionId, editingTitle);
                                    setEditingSessionId(null);
                                  } else if (e.key === "Escape") {
                                    setEditingSessionId(null);
                                  }
                                }}
                              />
                            ) : (
                              chat.title
                            )}
                          </div>
                        </div>

                        {/* Dropdown mini */}
                        <div className="relative flex-shrink-0">
                          <div
                            className="p-1 text-gray-600 hover:text-gray-600 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                            onClick={() =>
                              setActiveDropdown(activeDropdown === chat.sessionId ? null : chat.sessionId)
                            }
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h.01M12 12h.01M12 18h.01" />
                            </svg>
                          </div>

                          {activeDropdown === chat.sessionId && (
                            <div ref={dropdownRef} className={`absolute right-0 ${index === (showAllTodayChats ? chatHistory : chatHistory.slice(0, 5)).length - 1 ? 'bottom-0 mb-1' : 'mt-1'} w-28 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden`}>
                              <div
                                className="px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors flex items-center"
                                onClick={() => {
                                  setActiveDropdown(null);
                                  setEditingSessionId(chat.sessionId);
                                  setEditingTitle(chat.title || "");
                                }}
                              >
                                <svg className="h-2.5 w-2.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Rename
                              </div>
                              <div
                                className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 cursor-pointer transition-colors flex items-center"
                                onClick={() => {
                                  setActiveDropdown(null);
                                  handleDelete(chat.sessionId);
                                }}
                              >
                                <svg className="h-2.5 w-2.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </div>
                              <div
                                className="px-2 py-1.5 text-xs text-green-600 hover:bg-green-50 cursor-pointer transition-colors flex items-center"
                                onClick={() => {
                                  setActiveDropdown(null);
                                  handleExportToXLS(chat.sessionId);
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 16V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2z" />
                                  <path d="M7 12h10M7 16h10M7 8h10" />
                                </svg>
                                Export XLS
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {chatHistory.length > 5 && !showAllTodayChats && (
                      <button
                        className="text-xs text-blue-500 mt-2 hover:underline"
                        onClick={() => setShowAllTodayChats(true)}
                      >
                        Lihat selengkapnya
                      </button>
                    )}
                  </div>
                )}

                {/* 7 hari & 30 hari (dipertahankan, list sudah terurut descending) */}
                {sevenDaysChats.length > 0 && (
                  <div
                    className={`cursor-pointer py-2 px-3 rounded-lg transition-all duration-300 flex items-center group hover:scale-[1.01] ${currentCategory === "7 hari yang lalu"
                      ? "bg-gradient-to-r from-orange-50 to-yellow-50 text-gray-700 border border-orange-100 shadow-sm"
                      : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-orange-50 text-gray-600"
                      }`}
                    onClick={() => handleCategoryClick("7 hari yang lalu")}
                  >
                    <div className="h-6 w-6 mr-2 bg-orange-100 rounded-md flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">7 hari lalu</span>
                    <div className="ml-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${currentCategory === "7 hari yang lalu" ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )}

                {currentCategory === "7 hari yang lalu" &&
                  sevenDaysChats.length > 0 && (
                    <div className="ml-4 mt-0.5 max-h-32 overflow-y-auto hide-scrollbar">
                      {sevenDaysChats.map((chat, index) => (
                        <div
                          key={`${chat.sessionId}-${index}`}
                          className="py-0 px-2 rounded-md transition-all duration-200 flex items-center justify-between hover:bg-gray-50 text-gray-600 group"
                        >
                          <div className="flex items-center cursor-pointer overflow-hidden flex-1" onClick={() => loadChat(chat.sessionId)}>
                            <div className="h-4 w-4 mr-2 bg-transparent rounded flex items-center justify-center flex-shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <div
                              className="truncate text-xs flex-1"
                              onDoubleClick={() => {
                                setEditingSessionId(chat.sessionId);
                                setEditingTitle(chat.title || "");
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setActiveDropdown(chat.sessionId);
                              }}
                            >
                              {editingSessionId === chat.sessionId ? (
                                <input
                                  type="text"
                                  value={editingTitle}
                                  autoFocus
                                  className="w-full px-1 py-0.5 rounded border border-blue-300 text-xs"
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onBlur={async () => {
                                    await handleRenameInline(chat.sessionId, editingTitle);
                                    setEditingSessionId(null);
                                  }}
                                  onKeyDown={async (e) => {
                                    if (e.key === "Enter") {
                                      await handleRenameInline(chat.sessionId, editingTitle);
                                      setEditingSessionId(null);
                                    } else if (e.key === "Escape") {
                                      setEditingSessionId(null);
                                    }
                                  }}
                                />
                              ) : (
                                chat.title
                              )}
                            </div>
                          </div>
                          {/* dropdown mini */}
                          <div className="relative flex-shrink-0">
                            <div
                              className="p-1 text-gray-600 hover:text-gray-600 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                              onClick={() =>
                                setActiveDropdown(activeDropdown === chat.sessionId ? null : chat.sessionId)
                              }
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h.01M12 12h.01M12 18h.01" />
                              </svg>
                            </div>
                            {activeDropdown === chat.sessionId && (
                              <div className={`absolute right-0 ${index === sevenDaysChats.length - 1 ? 'bottom-0 mb-1' : 'mt-1'} w-28 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden`}>
                                <div
                                  className="px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    setEditingSessionId(chat.sessionId);
                                    setEditingTitle(chat.title || "");
                                  }}
                                >
                                  Rename
                                </div>
                                <div
                                  className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    handleDelete(chat.sessionId);
                                  }}
                                >
                                  Delete
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                {thirtyDaysChats.length > 0 && (
                  <div
                    className={`cursor-pointer py-2 px-3 rounded-lg transition-all duration-300 flex items-center group hover:scale-[1.01] ${currentCategory === "30 hari yang lalu"
                      ? "bg-gradient-to-r from-purple-50 to-pink-50 text-gray-700 border border-purple-100 shadow-sm"
                      : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50 text-gray-600"
                      }`}
                    onClick={() => handleCategoryClick("30 hari yang lalu")}
                  >
                    <div className="h-6 w-6 mr-2 bg-purple-100 rounded-md flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">30 hari lalu</span>
                    <div className="ml-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${currentCategory === "30 hari yang lalu" ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )}
                {currentCategory === "30 hari yang lalu" &&
                  thirtyDaysChats.length > 0 && (
                    <div className="ml-4 mt-0.5  max-h-32 overflow-y-auto relative overflow-visible">
                      {thirtyDaysChats.map((chat, index) => (
                        <div
                          key={`${chat.sessionId}-${index}`}
                          className="py-0 px-2 rounded-md transition-all duration-200 flex items-center justify-between hover:bg-gray-50  group"
                        >
                          <div className="flex items-center cursor-pointer overflow-hidden flex-1" onClick={() => loadChat(chat.sessionId)}>
                            <div className="h-4 w-4 mr-2 bg-transparent rounded flex items-center justify-center flex-shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <div
                              className="truncate text-xs flex-1"
                              onDoubleClick={() => {
                                setEditingSessionId(chat.sessionId);
                                setEditingTitle(chat.title || "");
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setActiveDropdown(chat.sessionId);
                              }}
                            >
                              {editingSessionId === chat.sessionId ? (
                                <input
                                  type="text"
                                  value={editingTitle}
                                  autoFocus
                                  className="w-full px-1 py-0.5 rounded border border-blue-300 text-xs"
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onBlur={async () => {
                                    await handleRenameInline(chat.sessionId, editingTitle);
                                    setEditingSessionId(null);
                                  }}
                                  onKeyDown={async (e) => {
                                    if (e.key === "Enter") {
                                      await handleRenameInline(chat.sessionId, editingTitle);
                                      setEditingSessionId(null);
                                    } else if (e.key === "Escape") {
                                      setEditingSessionId(null);
                                    }
                                  }}
                                />
                              ) : (
                                chat.title
                              )}
                            </div>
                          </div>

                          <div className="relative flex-shrink-0">
                            <div
                              className="p-1 text-gray-600 hover:text-gray-600 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                              onClick={() =>
                                setActiveDropdown(activeDropdown === chat.sessionId ? null : chat.sessionId)
                              }
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h.01M12 12h.01M12 18h.01" />
                              </svg>
                            </div>

                            {activeDropdown === chat.sessionId && (
                              <div className={`absolute right-0 ${index === thirtyDaysChats.length - 1 ? 'bottom-0 mb-1' : 'mt-1'} w-28 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden`}>
                                <div
                                  className="px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors flex items-center"
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    setEditingSessionId(chat.sessionId);
                                    setEditingTitle(chat.title || "");
                                  }}
                                >
                                  <svg className="h-2.5 w-2.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Rename
                                </div>
                                <div
                                  className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 cursor-pointer transition-colors flex items-center"
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    handleDelete(chat.sessionId);
                                  }}
                                >
                                  <svg className="h-2.5 w-2.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex flex-col flex-1 h-full min-h-0 ">
          {/* Header */}
          <div className="chat-header py-2 px-4  flex items-center justify-between border-b border-gray-300 chat-header">
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
              <span className="font-semibold text-sm text chat-header">
                <span className="text-greeting">{getGreeting()}, </span>
                <span className="text-username">{getDisplayName(currentUser)}</span>
              </span>
            </div>

            {/* user menu (dipertahankan) */}
            <div className="relative" ref={userMenuRef}>
              {<div className="relative" ref={userMenuRef}>
                {/* Tombol avatar untuk toggle menu */}
                <button
                  type="button"
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center justify-center hover:bg-gray-100 rounded-full p-2 transition-all duration-300 mr-3 flex-shrink-0"
                  aria-haspopup="menu"
                  aria-expanded={showUserMenu}
                  aria-label="Buka menu profil"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-gray-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {showUserMenu && (
                  <div
                    role="menu"
                    className="user-profile-menu absolute right-0 mt-3 w-56 bg-white backdrop-blur-lg border border-gray-200/50 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200"
                  >
                    {/* Header */}
                    <div className="px-4 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          {/* pakai UserIcon agar import terpakai */}
                          <UserIcon className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">
                            Welcome back!
                          </p>
                          <p className="text-xs text-gray-500">Manage your account</p>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="py-1">
                      <button
                        role="menuitem"
                        className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 group"
                        onClick={() => {
                          setShowUserMenu(false);
                          handleEditProfile();
                        }}
                      >
                        <div className="h-6 w-6 rounded-lg bg-blue-100 flex items-center justify-center mr-2 group-hover:bg-indigo-200 transition-colors">
                          <svg className="h-3 w-3 text-blue-600 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <span className="font-medium text-sm">Edit Profile</span>
                      </button>

                      <button
                        role="menuitem"
                        className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-all duration-200 group"
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate("/change-password");
                        }}
                      >
                        <div className="h-6 w-6 rounded-lg bg-yellow-100 flex items-center justify-center mr-2 group-hover:bg-yellow-200 transition-colors">
                          <svg
                            className="h-3 w-3 text-yellow-600 group-hover:text-yellow-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 11c0-1.104.896-2 2-2s2 .896 2 2v2m-4 0v-2a2 2 0 114 0v2h-4zm0 0v4h4v-4m-2 8a9 9 0 110-18 9 9 0 010 18z"
                            />
                          </svg>
                        </div>
                        <span className="font-medium text-sm">Ubah Password</span>
                      </button>

                      <button
                        role="menuitem"
                        className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-all duration-200 group"
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate("/favorite-quotes");
                        }}
                      >
                        <div className="h-6 w-6 rounded-lg bg-pink-100 flex items-center justify-center mr-2 group-hover:bg-pink-200 transition-colors">
                          <svg className="h-3 w-3 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </div>
                        <span className="font-medium text-sm">Favorite Quotes</span>
                      </button>

                      <button
                        role="menuitem"
                        className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-all duration-200 group"
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate("/about-us");
                        }}
                      >
                        <div className="h-6 w-6 rounded-lg bg-green-100 flex items-center justify-center mr-2 group-hover:bg-green-200 transition-colors">
                          <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="font-medium text-sm">About Us</span>
                      </button>

                      <div className="mx-3 my-1 border-t border-gray-100" />

                      <button
                        role="menuitem"
                        className="flex items-center w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                      >
                        <div className="h-6 w-6 rounded-lg bg-red-100 flex items-center justify-center mr-2 group-hover:bg-red-200 transition-colors">
                          <svg className="h-3 w-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <span className="font-medium text-sm">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              }
              {/* singkat: kamu bisa tempel kembali isi dropdown di sini */}
            </div>
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
                    key={message.id || `${message.chatId}-${index}`}
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
                      <div className="text-sm">
                        {!message.isUser &&
                          /<\/?(table|ul|ol|li|tr|td|th|thead|tbody|div|h3|h4|strong)>/i.test(message.text) ? (
                          <div dangerouslySetInnerHTML={{ __html: message.text }} className="prose max-w-none" />
                        ) : (
                          message.text
                        )}
                      </div>
                      <div className="text-xs mt-1 text-right text-black">
                        {message.timestamp !== null &&
                          new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    {message.isUser && (
                      <div className="h-8 w-8 rounded-full bot-chat flex items-center justify-center text-white text-sm ml-2 mt-1 flex-shrink-0">
                        {getDisplayName(currentUser).charAt(0).toUpperCase()}
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

export default Home;