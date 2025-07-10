import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { UserIcon } from "@heroicons/react/24/solid";
import { applyTheme } from "../themes/applyTheme";
import { toast } from "react-toastify";

interface Message {
  id: string | number;
  text: string;
  isUser: boolean;
  timestamp: Date | null;
  chatId: string | null;
}

interface DialogData {
  sessionId: string;
  _id: string;
  question?: string;
  answer?: string;
  createdAt?: string;
  updatedAt?: string;
  tajuk?: string;
}

interface ChatSession {
  chatId: string | number | null;
  title: string;
  enabled?: boolean;
  messages: Message[];
  created: Date | null;
  lastUpdated: Date | null;
  sessionId: string;
}

const Home: React.FC = (): React.ReactElement => {
  const navigate = useNavigate();
  const { logOut } = UserAuth();
  const [name, setName] = useState<string>("");
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
    email?: string;
  } | null>(null);
  const [showPopup, setShowPopup] = useState<boolean>(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [, setIsLoggedIn] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "Selamat pagi";
    if (hour >= 11 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 18) return "Selamat sore";
    return "Selamat malam";
  };
  // function setIsLoggedIn(_isLoggedIn: boolean) {
  //   throw new Error("Function not implemented.");
  // }
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    }

    // Tambah listener saat dropdown aktif
    if (activeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Bersihkan listener saat dropdown hilang atau komponen unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdown]);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          return;
        }

        console.log("Sending request with token");
        const response = await fetch("http://localhost:5000/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("Response status:", response.status);

        if (response.status === 403) {
          console.log("Token likely expired - handling expiration");

          localStorage.removeItem("token");
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const user = await response.json();
        console.log("User data successfully retrieved");
        setCurrentUser(user);
      } catch (error) {
        console.error("Error in fetchUser:", error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showPopup]);
  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      console.error("Token tidak ditemukan di localStorage");
      return;
    }

    axios
      .get("http://localhost:5000/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })
      .then((response) => {
        if (response.data.status) {
          const userFromResponse = response.data.user;
          setCurrentUser(userFromResponse);
          setName(userFromResponse?.name || "");
          setIsLoggedIn(true);
          setShowPopup(true);
          localStorage.setItem("userId", userFromResponse._id);
          localStorage.setItem("name", userFromResponse.name || "");
          setMessages([]);
          setCurrentChatId(null);
          setCurrentSessionId(null);
          setCurrentCategory("Hari ini");
          localStorage.removeItem("currentSessionId");

          // handleNewChat();
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
  useEffect(() => {
    // Hanya buat sesi baru jika currentUser sudah ada dan punya _id
    if (currentUser && currentUser._id) {
      handleNewChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    const isGuest = localStorage.getItem("isGuest") === "true";
    const guestName = localStorage.getItem("guestName") || "Tamu";

    if (isGuest) {
      console.log("User is a guest. Using guest name:", guestName);
      setName(guestName);
      setChatHistory([]);
      setMessages([]);
      setCurrentChatId(null);
      setCurrentSessionId(null);
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("User ID not found in localStorage");
      navigate("/");
      return;
    }

    fetchChatHistory(userId);
  }, [navigate]);
  useEffect(() => {
    // const savedSessionId = localStorage.getItem("currentSessionId");

    if (chatHistory.length > 0) {
      // const selectedChat = chatHistory.find(
      //   (chat) => chat.sessionId === savedSessionId
      // );

      // if (selectedChat) {
      //   setCurrentChatId(
      //     selectedChat.chatId ? String(selectedChat.chatId) : null
      //   );
      //   setCurrentSessionId(selectedChat.sessionId);
      //   setMessages(selectedChat.messages);
      // } else {
      //   console.warn("Saved session ID not found in chat history");
      //   setMessages([]);
      //   setCurrentChatId(null);
      //   setCurrentSessionId(null);
      // }

      setCurrentCategory("Hari ini");
    }
  }, [chatHistory]);
  useEffect(() => {
    const storedName = localStorage.getItem("guestName") || "User";
    setName(storedName);
  }, []);
  const fetchChatHistory = async (userId: string | null) => {
    if (!userId) {
      console.warn("Cannot fetch chat history without a valid user ID.");
      setChatHistory([]);
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:5000/api/chat/get-chat/${userId}`
      );

      if (response.data && Array.isArray(response.data.chatHistory)) {
        setChatHistory(response.data.chatHistory);
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
    dialogData: {
      question: string;
      answer: string;
      timestamp: Date;
    }
  ) => {
    if (!userId) {
      console.warn("Cannot save chat history for guest users.");
      return;
    }
    try {
      console.log("Preparing to save chat history:", {
        userId,
        sessionId,
        dialogData,
      });

      const response = await axios.post(
        "http://localhost:5000/api/chat/save-chat",
        {
          userId,
          sessionId,
          question: dialogData.question,
          answer: dialogData.answer,
          timestamp: dialogData.timestamp,
        }
      );

      console.log("Chat history saved successfully:", response.data);
    } catch (error) {
      console.error(
        "Error saving chat history:",
        (error as any).response?.data || error
      );
    }
  };

  const handleSendMessage = async (customMessage?: string): Promise<void> => {
    const messageToSend =
      customMessage !== undefined ? customMessage : inputMessage;
    if (messageToSend.trim() !== "") {
      let sessionIdToUse = currentSessionId;
      let chatIdToUse = currentChatId;
      if (!currentSessionId) {
        const newSessionId = Date.now().toString();
        chatIdToUse = newSessionId;
        sessionIdToUse = newSessionId;

        const newSession = {
          chatId: chatIdToUse,
          title: "Percakapan Baru",
          messages: [],
          created: new Date(),
          lastUpdated: new Date(),
          sessionId: sessionIdToUse,
        };

        setChatHistory((prevHistory) => [newSession, ...prevHistory]);
      }
      const userMessage = {
        id: Date.now().toString(),
        text: messageToSend,
        isUser: true,
        timestamp: new Date(),
        chatId: chatIdToUse,
      };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      updateChatHistory(userMessage);
      setInputMessage("");
      setChatHistory((prevHistory) =>
        prevHistory.map((chat) => {
          if (
            chat.sessionId === sessionIdToUse &&
            (chat.title === "Percakapan Baru" ||
              chat.title === "" ||
              chat.title === undefined)
          ) {
            return { ...chat, title: messageToSend };
          }
          return chat;
        })
      );
      try {
        setIsBotTyping(true);

        const systemPrompt = {
          role: "system",
          content: `Kamu adalah chatbot pendamping kesehatan mental untuk remaja SMA di Indonesia. Berperan sebagai teman bicara yang ramah, penuh empati, dan bisa dipercaya. Kamu juga bisa membantu sebagai asisten guru BK (Bimbingan Konseling) yang memahami psikologi remaja, budaya lokal, dan konteks kehidupan sekolah di Indonesia.

          Jawablah tanpa reasoning atau penjelasan.

            Tugas utamamu adalah:
            - Mendengarkan curhatan dan keluhan remaja tanpa menghakimi.
            - Memberikan dukungan emosional dengan cara yang positif dan membangun.
            - Menjawab dengan bahasa yang mudah dimengerti, hangat, sopan, dan tidak menggurui.
            - Menyampaikan informasi psikologis dasar yang relevan secara ringan dan bijak.
            - Jika topik sangat serius (misalnya keinginan menyakiti diri sendiri, kekerasan, atau pelecehan), arahkan untuk segera bicara dengan guru BK, orang dewasa tepercaya, atau layanan profesional.

            PENTING - ATURAN FORMAT OUTPUT:
            1. Gunakan gaya bahasa santai, empatik, dan seperti teman seumuran yang bijak.
            2. Berikan respons yang panjangnya 20-50 kata untuk percakapan biasa.
            3. Jika user meminta contoh jadwal, tabel, atau struktur terorganisir, WAJIB gunakan format HTML berikut:
              - Gunakan tag <table>, <tr>, <td>, <th> untuk tabel
              - Gunakan tag <div>, <h3>, <h4> untuk struktur
              - Gunakan tag <ul>, <li> untuk daftar
              - Gunakan tag <strong> untuk penekanan
              - JANGAN tampilkan tag HTML mentah, langsung berikan konten HTML yang sudah diformat
            4. Untuk jadwal harian, gunakan format tabel dengan kolom: Waktu | Kegiatan | Keterangan
            5. Untuk tips atau panduan, gunakan format list yang rapi dengan HTML
            6. Pastikan output HTML mudah dibaca dan terstruktur dengan baik

            Contoh format yang BENAR untuk jadwal:
            <table class="w-full border-collapse border border-slate-400 rounded-lg overflow-hidden shadow-sm">
            <thead>
            <tr class="bg-blue-50">
            <th class="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">Waktu</th>
            <th class="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">Kegiatan</th>
            <th class="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">Keterangan</th>
            </tr>
            </thead>
            <tbody>
            <tr class="hover:bg-slate-50">
            <td class="border border-slate-300 px-4 py-2 text-slate-600">06:00-07:00</td>
            <td class="border border-slate-300 px-4 py-2 text-slate-800">Bangun & Persiapan</td>
            <td class="border border-slate-300 px-4 py-2 text-slate-600">Mandi, sarapan</td>
            </tr>
            </tbody>
            </table>




            Jika user meminta "struktur organisasi", tampilkan dalam bentuk diagram hirarki (bukan tabel), gunakan HTML <div> dan CSS flex/grid agar terlihat seperti bagan organisasi, misal:
            - Wali Kelas di atas, di bawahnya Ketua Kelas dan Wakil, dst.
            - Gunakan border, background, dan jarak antar box agar mudah dibaca.
            - Jangan tampilkan dalam bentuk tabel.
            Jangan memberikan diagnosa medis atau psikologis, dan jangan menggantikan peran profesional kesehatan mental.`,
        };

        const allMessages = [
          systemPrompt,
          ...messages.map((msg) => ({
            role: msg.isUser ? "user" : "assistant",
            content: msg.text,
          })),
          {
            role: "user",
            content: inputMessage,
          },
        ];

        const response = await axios.post(
          "http://localhost:5007/api/openrouter/chat",
          // "http://localhost:5006/generate-sealion",

          {
            messages: allMessages,
            sessionId: sessionIdToUse,
            userId: localStorage.getItem("userId"),
          }
        );
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setIsBotTyping(false);
        console.log("Bot response:", response.data);

        const botMessage = {
          id: Date.now().toString(),
          text:
            response.data.answer && response.data.answer.trim() !== ""
              ? response.data.answer.trim()
              : "Maaf, saya tidak mengerti pertanyaan Anda.",

          isUser: false,
          timestamp: new Date(),
          chatId: chatIdToUse,
        };

        setMessages((prevMessages) => [...prevMessages, botMessage]);
        updateChatHistory(botMessage);

        const userId = localStorage.getItem("userId");
        if (userId && sessionIdToUse) {
          await saveChatHistory(userId, sessionIdToUse, {
            question: inputMessage,
            answer: response.data.answer,
            timestamp: new Date(),
          });

          const currentChat = chatHistory.find(
            (chat) => chat.sessionId === sessionIdToUse
          );
          if (
            currentChat &&
            (currentChat.title === "Percakapan Baru" ||
              currentChat.title === "" ||
              currentChat.title === undefined) &&
            !/^Saya merasa/i.test(inputMessage.trim()) // hanya update jika bukan klik emot
          ) {
            await axios.put(
              `http://localhost:5000/api/session/rename/${sessionIdToUse}`,
              { tajuk: inputMessage.substring(0, 30) }
            );
            if (userId) {
              await fetchChatHistory(userId);
            }
          }
        }

        // setChatHistory((prevHistory) =>
        //   prevHistory.map((chat) => {
        //     if (chat.sessionId === sessionIdToUse) {
        //       if (
        //         chat.title === "Percakapan Baru" ||
        //         chat.title === "" ||
        //         chat.title === undefined
        //       ) {
        //         return { ...chat, title: inputMessage.substring(0, 30) };
        //       }

        //       return chat;
        //     }
        //     return chat;
        //   })
        // );
      } catch (error) {
        setIsBotTyping(false);
        console.error("Error fetching bot answer:", error);

        const errorMessage = {
          id: Date.now().toString(),
          text: "Maaf, terjadi kesalahan saat menghubungi server .",
          isUser: false,
          timestamp: new Date(),
          chatId: chatIdToUse,
        };

        setMessages((prevMessages) => [...prevMessages, errorMessage]);
        updateChatHistory(errorMessage);
      }
    }
  };

  const handleEmotionClick = async (emotion: string): Promise<void> => {
    await handleSendMessage(`Saya merasa ${emotion}`);
  };
  const updateChatHistory = (message: Message): void => {
    const existingSessionIndex = chatHistory.findIndex(
      (session) => session.chatId === currentChatId
    );

    if (existingSessionIndex !== -1) {
      const updatedHistory = [...chatHistory];
      updatedHistory[existingSessionIndex].messages.push(message);

      if (
        message.isUser &&
        updatedHistory[existingSessionIndex].messages.length === 1
      ) {
        updatedHistory[existingSessionIndex].title = message.text.substring(
          0,
          30
        );
      }

      updatedHistory[existingSessionIndex].lastUpdated = new Date();
      setChatHistory(updatedHistory);
    } else {
      console.error("Chat session not found");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleNewChat = async () => {
    try {
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      console.log("Current user ID:", currentUser._id);

      const response = await axios.post(
        "http://localhost:5000/api/chatbot/session",
        { userId: currentUser._id }
      );

      if (!response.data || !response.data.sessionId) {
        throw new Error("Failed to create new chat session");
      }
      const newSessionId = response.data.sessionId;
      const newChatId = Date.now().toString();
      const newSession = {
        chatId: newChatId,
        title: "Percakapan Baru",
        messages: [],
        created: new Date(),
        lastUpdated: new Date(),
        sessionId: newSessionId,
      };
      setCurrentSessionId(newSessionId);
      setCurrentChatId(newChatId);
      setMessages([]);
      setChatHistory((prevHistory) => [newSession, ...prevHistory]);
      localStorage.setItem("currentSessionId", newSessionId);
      setCurrentCategory("Hari ini");

      console.log("New chat session created:", newSession);
    } catch (error) {
      console.error("Error creating new chat session:", error);
      toast.error("Gagal membuat sesi chat baru. Silakan coba lagi.");
    }
  };

  const handleCategoryClick = (category: string): void => {
    if (category === "Chat baru") {
      const newChatId = Date.now().toString();
      setCurrentChatId(newChatId);
      setMessages([]);
      setCurrentCategory("Hari ini");
    } else {
      setCurrentCategory(category);
    }
  };

  const categorizeChats = () => {
    const now = new Date();
    const todayChats: typeof chatHistory = [];
    const sevenDaysChats: typeof chatHistory = [];
    const thirtyDaysChats: typeof chatHistory = [];

    const uniqueChats = new Set();

    chatHistory.forEach((chat) => {
      if (!uniqueChats.has(chat.chatId)) {
        uniqueChats.add(chat.chatId);

        const chatDate = new Date(chat.lastUpdated ?? 0);
        const diffTime = Math.abs(now.getTime() - chatDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 7) {
          todayChats.push(chat);
        } else if (diffDays >= 7 && diffDays < 30) {
          sevenDaysChats.push(chat);
        } else if (diffDays >= 30) {
          thirtyDaysChats.push(chat);
        }
      }
    });

    return { todayChats, sevenDaysChats, thirtyDaysChats };
  };

  const { sevenDaysChats, thirtyDaysChats } = categorizeChats();
  const loadChat = (sessionId: string) => {
    console.log("Loading chat with session ID:", sessionId);

    const selectedChat = chatHistory.find(
      (chat) => chat.sessionId === sessionId
    );
    if (selectedChat) {
      console.log("Selected chat found:", selectedChat);
      setCurrentChatId(String(selectedChat.chatId));
      setCurrentSessionId(selectedChat.sessionId);
      setMessages([...selectedChat.messages]);
      localStorage.setItem("currentSessionId", sessionId);
      setCurrentCategory("Hari ini");
    } else {
      console.error("Chat with session ID", sessionId, "not found");
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      localStorage.removeItem("authToken");
      console.log("User logged out");
      localStorage.setItem("theme", theme);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const isGuest = localStorage.getItem("isGuest") === "true";

    if (isGuest) {
      console.log("User is a guest. Skipping user ID check.");
      setChatHistory([]);
      setMessages([]);
      setCurrentChatId(null);
      setCurrentSessionId(null);
      return;
    }
    if (!userId) {
      console.error("User ID not found in localStorage");
      navigate("/");
      return;
    }

    const loadHistory = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/chat/get-chat/${userId}`
        );

        if (response.data && Array.isArray(response.data.dialog)) {
          console.log("Raw dialog data:", response.data.dialog);
          const processedChatHistory = processChatHistory(response.data.dialog);
          setChatHistory(processedChatHistory);

          const savedSessionId = localStorage.getItem("currentSessionId");
          if (savedSessionId && processedChatHistory.length > 0) {
            const selectedChat = processedChatHistory.find(
              (chat) => chat.sessionId === savedSessionId
            );
            if (selectedChat) {
              console.log("Restoring session:", selectedChat);
              setCurrentChatId(
                selectedChat.chatId ? String(selectedChat.chatId) : null
              );
              setCurrentSessionId(selectedChat.sessionId);
              setMessages([...selectedChat.messages]);
            } else {
              console.warn(
                "Saved session ID not found, selecting most recent chat"
              );
              if (processedChatHistory.length > 0) {
                const mostRecent = processedChatHistory[0];
                setCurrentChatId(
                  mostRecent.chatId ? String(mostRecent.chatId) : null
                );
                setCurrentSessionId(mostRecent.sessionId);
                setMessages([...mostRecent.messages]);
                localStorage.setItem("currentSessionId", mostRecent.sessionId);
              }
            }
          } else if (processedChatHistory.length > 0) {
            const mostRecent = processedChatHistory[0];
            setCurrentChatId(
              mostRecent.chatId ? String(mostRecent.chatId) : null
            );
            setCurrentSessionId(mostRecent.sessionId);
            setMessages([...mostRecent.messages]);
            localStorage.setItem("currentSessionId", mostRecent.sessionId);
          }
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    };

    loadHistory();
  }, [navigate]);

  const processChatHistory = (dialogData: DialogData[]): ChatSession[] => {
    const sessionMap = new Map();

    dialogData.forEach((chat) => {
      if (!chat.sessionId || !chat._id) {
        console.warn("Invalid chat data:", chat);
        return;
      }
      const sessionId = chat.sessionId;
      const chatId = String(chat._id);

      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          chatId: chatId,
          sessionId: sessionId,
          title:
            chat.tajuk && chat.tajuk.trim() !== ""
              ? chat.tajuk
              : chat.question?.substring(0, 30) || "Percakapan Baru",
          messages: [],
          created: chat.createdAt ? new Date(chat.createdAt) : new Date(0),
          lastUpdated: chat.updatedAt ? new Date(chat.updatedAt) : new Date(0),
        });
      }

      const session = sessionMap.get(sessionId);

      if (session) {
        // Tambahkan pesan user
        if (chat.question) {
          session.messages.push({
            id: `${chatId}-user`,
            text: chat.question,
            isUser: true,
            timestamp: chat.createdAt ? new Date(chat.createdAt) : new Date(0), // Gunakan waktu default (epoch) jika tidak tersedia
            chatId: chatId,
          });
        }

        // Tambahkan pesan bot
        if (chat.answer) {
          session.messages.push({
            id: `${chatId}-bot`,
            text: chat.answer,
            isUser: false,
            timestamp: chat.updatedAt ? new Date(chat.updatedAt) : new Date(0),
            chatId: chatId,
          });
        }

        if (chat.updatedAt && new Date(chat.updatedAt) > session.lastUpdated) {
          session.lastUpdated = new Date(chat.updatedAt);
        }
      }
    });

    for (const session of sessionMap.values()) {
      // Jika title masih kosong/"Percakapan Baru", dan ada pesan user pertama, pakai pesan user pertama
      if (
        (!session.title ||
          session.title === "Percakapan Baru" ||
          session.title === "" ||
          session.title === undefined) &&
        session.messages.length > 0
      ) {
        const firstUserMsg = session.messages.find(
          (msg: Message) => msg.isUser
        );
        if (firstUserMsg) {
          session.title = firstUserMsg.text.substring(0, 30);
        }
      }
      session.messages.sort(
        (a: Message, b: Message) =>
          (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0)
      );
    }

    return Array.from(sessionMap.values()).sort(
      (a, b) =>
        (b.lastUpdated?.getTime() || 0) - (a.lastUpdated?.getTime() || 0)
    );
  };

  useEffect(() => {
    console.log("Current chat ID:", currentChatId);
    console.log("Current session ID:", currentSessionId);
    console.log("Current messages:", messages);
  }, [currentChatId, currentSessionId, messages]);

  const handleEditProfile = () => {
    if (currentUser) {
      navigate("/edit-profile", { state: { email: currentUser.email } });
    } else {
      console.error("User data tidak ditemukan");
    }
  };

  const handleRenameInline = async (sessionId: string, newTitle: string) => {
    if (!newTitle || !sessionId) return;
    try {
      const response = await axios.put(
        `http://localhost:5000/api/session/rename/${sessionId}`,
        { tajuk: newTitle }
      );
      if (response.status === 200) {
        setChatHistory((prevHistory) =>
          prevHistory.map((chat) =>
            chat.sessionId === sessionId
              ? { ...chat, tajuk: newTitle, title: newTitle }
              : chat
          )
        );
      }
    } catch (error) {
      toast.error("Gagal mengubah judul.");
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/session/delete/${sessionId}`,
        { enabled: false }
      );

      if (response.status === 200) {
        setChatHistory((prevHistory) =>
          prevHistory.filter((chat) => chat.sessionId !== sessionId)
        );
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
    ${
      sidebarOpen
        ? "fixed top-0 left-0 translate-x-0"
        : "fixed -translate-x-full"
    }
    md:static md:translate-x-0 md:z-0
  `}
        >
          {/* Header */}
          <div className="px-4 py-3 chat-sidebar flex flex-col items-center justify-center">
            <img
              src="/Teta_girl.png"
              alt="TETA"
              className="h-24 w-24 object-contain mb-2"
              style={{ display: "block" }}
            />
          </div>

          <div className="flex h-screen overflow-y-auto">
            <div className="w-64 h-full flex flex-col chat-sidebar">
              <div className="grid grid-cols-1 gap-1 mt-2">
                {/* Eksplorasi */}
                <div
                  className={`group cursor-pointer py-1 px-3 rounded-xl transition-all duration-300 flex items-center hover:scale-[1.02] ${
                    currentCategory === "Eksplorasi"
                      ? " shadow-md"
                      : " hover:shadow-sm"
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

                {/* Cek Kondisi Hatimu */}
                <div
                  className="group cursor-pointer py-1 px-3 rounded-xl transition-all duration-300 flex items-center  hover:scale-[1.02] hover:shadow-sm"
                  onClick={() => navigate("/pertanyaan")}
                >
                  <div className="h-8 w-8 mr-3  rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
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
                  <div className="text-sm font-medium  text-gray-600">
                    Cek Kondisi Hatimu
                  </div>
                </div>

                {/* Chat Baru */}
                <div
                  className={`group cursor-pointer py-1 px-3 rounded-xl transition-all duration-300 flex items-center hover:scale-[1.02] ${
                    currentCategory === "Chat baru"
                      ? " shadow-md"
                      : " hover:shadow-sm"
                  }`}
                  onClick={() => handleNewChat()}
                >
                  <div className="h-8 w-8 mr-3  rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
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

              {/* Compact History Divider */}
              <div className="flex items-center py-3">
                <div className="chat-riwayat-text"></div>
                <h3 className="chat-riwayat-label">Riwayat Chat</h3>
                <div className="chat-riwayat-text"></div>
              </div>

              {/* History Categories - More Compact */}
              <div className="space-y-1">
                {/* Hari Ini */}
                <div
                  className={`cursor-pointer py-2 px-3 rounded-lg transition-all duration-300 flex items-center group hover:scale-[1.01] ${
                    currentCategory === "Hari ini"
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-700 border border-blue-100 shadow-sm"
                      : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 text-gray-600"
                  }`}
                  onClick={() => handleCategoryClick("Hari ini")}
                >
                  <div className="h-6 w-6 mr-2 bg-blue-100 rounded-md flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Hari ini</span>
                  <div className="ml-auto">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${
                        currentCategory === "Hari ini" ? "rotate-90" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Chat History Items - More Compact */}
                {currentCategory === "Hari ini" && (
                  <div className="ml-4 mt-0.5 ">
                    {(showAllTodayChats
                      ? chatHistory
                      : chatHistory.slice(0, 5)
                    ).map((chat, index) => (
                      <div
                        key={`${chat.sessionId}-${index}`}
                        className="py-0 px-2 rounded-md transition-all duration-200 flex items-center justify-between hover:bg-gray-50 t text-gray-600 group"
                      >
                        <div
                          className="flex items-center cursor-pointer overflow-hidden flex-1"
                          onClick={() => loadChat(chat.sessionId)}
                        >
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
                          <div
                            className="truncate text-xs flex-1"
                            onDoubleClick={() => {
                              setEditingSessionId(chat.sessionId);
                              setEditingTitle(chat.title || "");
                            }}
                          >
                            {editingSessionId === chat.sessionId ? (
                              <input
                                type="text"
                                value={editingTitle}
                                autoFocus
                                className="w-full px-1 py-0.5 rounded border border-blue-300 text-xs"
                                onChange={(e) =>
                                  setEditingTitle(e.target.value)
                                }
                                onBlur={async () => {
                                  await handleRenameInline(
                                    chat.sessionId,
                                    editingTitle
                                  );
                                  setEditingSessionId(null);
                                }}
                                onKeyDown={async (e) => {
                                  if (e.key === "Enter") {
                                    await handleRenameInline(
                                      chat.sessionId,
                                      editingTitle
                                    );
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

                        {/* Compact Dropdown Menu */}
                        <div className="relative flex-shrink-0">
                          <div
                            className="p-1 text-gray-600 hover:text-gray-600 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                            onClick={() =>
                              setActiveDropdown(
                                activeDropdown === chat.sessionId
                                  ? null
                                  : chat.sessionId
                              )
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6h.01M12 12h.01M12 18h.01"
                              />
                            </svg>
                          </div>

                          {activeDropdown === chat.sessionId && (
                            <div
                              ref={dropdownRef}
                              className="absolute right-0 mt-1 w-28 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
                            >
                              <div
                                className="px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors flex items-center"
                                onClick={() => {
                                  setActiveDropdown(null);
                                  setEditingSessionId(chat.sessionId);
                                  setEditingTitle(chat.title || "");
                                }}
                              >
                                <svg
                                  className="h-2.5 w-2.5 mr-1.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
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
                                <svg
                                  className="h-2.5 w-2.5 mr-1.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Delete
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

                {/* 7 Hari Yang Lalu - More Compact */}
                {sevenDaysChats.length > 0 && (
                  <div
                    className={`cursor-pointer py-2 px-3 rounded-lg transition-all duration-300 flex items-center group hover:scale-[1.01] ${
                      currentCategory === "7 hari yang lalu"
                        ? "bg-gradient-to-r from-orange-50 to-yellow-50 text-gray-700 border border-orange-100 shadow-sm"
                        : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-orange-50 text-gray-600"
                    }`}
                    onClick={() => handleCategoryClick("7 hari yang lalu")}
                  >
                    <div className="h-6 w-6 mr-2 bg-orange-100 rounded-md flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">7 hari lalu</span>
                    <div className="ml-auto">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${
                          currentCategory === "7 hari yang lalu"
                            ? "rotate-90"
                            : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
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
                          <div
                            className="flex items-center cursor-pointer overflow-hidden flex-1"
                            onClick={() => loadChat(chat.sessionId)}
                          >
                            <div className="h-4 w-4 mr-2 bg-transparent rounded flex items-center justify-center flex-shrink-0">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-2.5 w-2.5 text pesan-history"
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
                            <div
                              className="truncate text-xs flex-1"
                              onDoubleClick={() => {
                                setEditingSessionId(chat.sessionId);
                                setEditingTitle(chat.title || "");
                              }}
                            >
                              {editingSessionId === chat.sessionId ? (
                                <input
                                  type="text"
                                  value={editingTitle}
                                  autoFocus
                                  className="w-full px-1 py-0.5 rounded border border-blue-300 text-xs"
                                  onChange={(e) =>
                                    setEditingTitle(e.target.value)
                                  }
                                  onBlur={async () => {
                                    await handleRenameInline(
                                      chat.sessionId,
                                      editingTitle
                                    );
                                    setEditingSessionId(null);
                                  }}
                                  onKeyDown={async (e) => {
                                    if (e.key === "Enter") {
                                      await handleRenameInline(
                                        chat.sessionId,
                                        editingTitle
                                      );
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
                          {/* Similar compact dropdown for 7 days */}
                          <div className="relative flex-shrink-0">
                            <div
                              className="p-1 text-gray-600 hover:text-gray-600 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                              onClick={() =>
                                setActiveDropdown(
                                  activeDropdown === chat.sessionId
                                    ? null
                                    : chat.sessionId
                                )
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6h.01M12 12h.01M12 18h.01"
                                />
                              </svg>
                            </div>
                            {activeDropdown === chat.sessionId && (
                              <div className="absolute right-0 mt-1 w-28 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
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

                {/* 30 Hari Yang Lalu - More Compact */}
                {thirtyDaysChats.length > 0 && (
                  <div
                    className={`cursor-pointer py-2 px-3 rounded-lg transition-all duration-300 flex items-center group hover:scale-[1.01] ${
                      currentCategory === "30 hari yang lalu"
                        ? "bg-gradient-to-r from-purple-50 to-pink-50 text-gray-700 border border-purple-100 shadow-sm"
                        : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50 text-gray-600"
                    }`}
                    onClick={() => handleCategoryClick("30 hari yang lalu")}
                  >
                    <div className="h-6 w-6 mr-2 bg-purple-100 rounded-md flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">30 hari lalu</span>
                    <div className="ml-auto">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${
                          currentCategory === "30 hari yang lalu"
                            ? "rotate-90"
                            : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
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
                          <div
                            className="flex items-center cursor-pointer overflow-hidden flex-1"
                            onClick={() => loadChat(chat.sessionId)}
                          >
                            <div className="h-4 w-4 mr-2 bg-transparent rounded flex items-center justify-center flex-shrink-0">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-2.5 w-2.5 text pesan-history "
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
                            <div
                              className="truncate text-xs flex-1"
                              onDoubleClick={() => {
                                setEditingSessionId(chat.sessionId);
                                setEditingTitle(chat.title || "");
                              }}
                            >
                              {editingSessionId === chat.sessionId ? (
                                <input
                                  type="text"
                                  value={editingTitle}
                                  autoFocus
                                  className="w-full px-1 py-0.5 rounded border border-blue-300 text-xs"
                                  onChange={(e) =>
                                    setEditingTitle(e.target.value)
                                  }
                                  onBlur={async () => {
                                    await handleRenameInline(
                                      chat.sessionId,
                                      editingTitle
                                    );
                                    setEditingSessionId(null);
                                  }}
                                  onKeyDown={async (e) => {
                                    if (e.key === "Enter") {
                                      await handleRenameInline(
                                        chat.sessionId,
                                        editingTitle
                                      );
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

                          {/* Compact Dropdown Menu */}
                          <div className="relative flex-shrink-0">
                            <div
                              className="p-1 text-gray-600 hover:text-gray-600 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                              onClick={() =>
                                setActiveDropdown(
                                  activeDropdown === chat.sessionId
                                    ? null
                                    : chat.sessionId
                                )
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6h.01M12 12h.01M12 18h.01"
                                />
                              </svg>
                            </div>

                            {activeDropdown === chat.sessionId && (
                              <div className="absolute right-0 mt-1 w-28 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                                <div
                                  className="px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors flex items-center"
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    setEditingSessionId(chat.sessionId);
                                    setEditingTitle(chat.title || "");
                                  }}
                                >
                                  <svg
                                    className="h-2.5 w-2.5 mr-1.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
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
                                  <svg
                                    className="h-2.5 w-2.5 mr-1.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
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
          {/* Header: Full width */}
          <div className="chat-header py-2 px-4  flex items-center justify-between border-b border-gray-300 chat-header">
            <div className="flex items-center">
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
                <span className="text-username">{name || "User"}</span>
              </span>
            </div>
            <div className="relative" ref={userMenuRef}>
              <div
                className="flex items-center justify-center hover:bg-gray-100 rounded-full p-2 transition-all duration-300 mr-3 flex-shrink-0 cursor-pointer"
                onClick={() => setShowUserMenu((v) => !v)}
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
              </div>

              {showUserMenu && (
                <div className="user-profile-menu absolute right-0 mt-3 w-56 bg-white backdrop-blur-lg border border-gray-200/50 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  {/* Header dengan avatar */}
                  <div className="px-4 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <UserIcon className="h-3 w-3 text-white fill-current" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          Welcome back!
                        </p>
                        <p className="text-xs text-gray-500">
                          Manage your account
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 group"
                      onClick={() => {
                        setShowUserMenu(false);
                        handleEditProfile();
                      }}
                    >
                      <div className="h-6 w-6 rounded-lg bg-blue-100 flex items-center justify-center mr-2 group-hover:bg-indigo-200 transition-colors">
                        <svg
                          className="h-3 w-3 text-blue-600 group-hover:text-indigo-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Edit Profile</p>
                      </div>
                    </button>

                    <button
                      className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-all duration-200 group"
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate("/favorite-quotes");
                      }}
                    >
                      <div className="h-6 w-6 rounded-lg bg-pink-100 flex items-center justify-center mr-2 group-hover:bg-pink-200 transition-colors">
                        <svg
                          className="h-3 w-3 text-pink-600"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Favorite Quotes</p>
                      </div>
                    </button>

                    <button
                      className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-all duration-200 group"
                      onClick={() => {
                        setShowUserMenu(false);
                        setCurrentCategory("About Us");
                        navigate("/about-us");
                      }}
                    >
                      <div className="h-6 w-6 rounded-lg bg-green-100 flex items-center justify-center mr-2 group-hover:bg-green-200 transition-colors">
                        <svg
                          className="h-3 w-3 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-sm">About Us</p>
                      </div>
                    </button>

                    {/* Divider */}
                    <div className="mx-3 my-1 border-t border-gray-100"></div>

                    <button
                      className="flex items-center w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                    >
                      <div className="h-6 w-6 rounded-lg bg-red-100 flex items-center justify-center mr-2 group-hover:bg-red-200 transition-colors">
                        <svg
                          className="h-3 w-3 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Logout</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
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
                    <button
                      onClick={() => handleEmotionClick("bahagia")}
                      className="chat-icon text-gray-600 px-4 py-2 rounded-full"
                    >
                      😊 Bahagia
                    </button>
                    <button
                      onClick={() => handleEmotionClick("sedih")}
                      className="chat-icon  text-gray-600 px-4 py-2 rounded-full"
                    >
                      🥺 Sedih
                    </button>
                    <button
                      onClick={() => handleEmotionClick("marah")}
                      className="chat-icon text-gray-600 px-4 py-2 rounded-full"
                    >
                      😠 Marah
                    </button>
                    <button
                      onClick={() => handleEmotionClick("cemas")}
                      className="chat-icon text-gray-600 px-4 py-2 rounded-full"
                    >
                      😬 Cemas
                    </button>
                    {/* <button
                    onClick={() => handleEmotionClick("senang")}
                    className="bg-transparent text-gray-600 px-4 py-2 rounded-full"
                  >
                    😁 Senang
                  </button>
                  <button
                    onClick={() => handleEmotionClick("lucu")}
                    className="bg-transparent text-gray-600 px-4 py-2 rounded-full"
                  >
                    😂 Lucu
                  </button>
                  <button
                    onClick={() => handleEmotionClick("bersyukur")}
                    className="bg-transparent text-purple-600 px-4 py-2 rounded-full"
                  >
                    🙏 Bersyukur
                  </button>
                  <button
                    onClick={() => handleEmotionClick("insecure")}
                    className="bg-transparent text-yellow-600 px-4 py-2 rounded-full"
                  >
                    😟 Insecure
                  </button> */}
                  </div>
                </>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message.id || `${message.chatId}-${index}`}
                    className={`flex ${
                      message.isUser ? "justify-end" : "justify-start"
                    } w-full mb-4`}
                    ref={index === messages.length - 1 ? lastMessageRef : null}
                  >
                    {/* Avatar Bot */}
                    {!message.isUser && (
                      <div className="h-8 w-8 rounded-full bot-chat flex items-center justify-center text-white text-sm mr-2 mt-1 flex-shrink-0">
                        C
                      </div>
                    )}

                    <div
                      className={
                        (message.isUser
                          ? "bubble-user px-4 py-3 shadow-sm rounded-3xl rounded-br-none"
                          : "bubble-bot px-4 py-3 shadow-sm rounded-3xl rounded-br-none") +
                        " max-w-[75%] break-words"
                      }
                    >
                      <div className="text-sm">
                        {!message.isUser &&
                        /<\/?(table|ul|ol|li|tr|td|th|thead|tbody|div|h3|h4|strong)>/i.test(
                          message.text
                        ) ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: message.text }}
                            className="prose max-w-none"
                          />
                        ) : (
                          message.text
                        )}
                      </div>
                      <div className="text-xs mt-1 text-right text-black">
                        {message.timestamp !== null &&
                          new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </div>
                    </div>
                    {/* Avatar User */}
                    {message.isUser && (
                      <div className="h-8 w-8 rounded-full bot-chat flex items-center justify-center text-white text-sm ml-2 mt-1 flex-shrink-0">
                        {name && name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))
              )}
              {isBotTyping && (
                <div className="flex justify-start w-full mb-4">
                  {/* Avatar Bot */}
                  <div className="h-8 w-8 rounded-full bot-chat flex items-center justify-center text-white text-sm mr-2 mt-1 flex-shrink-0">
                    C
                  </div>
                  {/* Bubble Bot Typing */}
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

export default Home;
