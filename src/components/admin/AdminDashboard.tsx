import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast } from "react-toastify";

import {
  FiHome,
  FiUsers,
  FiBarChart2,
  FiFileText,
  FiSettings,
  FiSearch,
  FiUser,
  FiMessageSquare,
} from "react-icons/fi";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
Chart.register(
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend
);
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const menus = [
  { key: "dashboard", label: "Dashboard", icon: <FiHome /> },
  { key: "pengguna", label: "Pengguna", icon: <FiUsers /> },
  { key: "statistik", label: "Statistik", icon: <FiBarChart2 /> },
  { key: "kategori", label: "Kategori", icon: <FiFileText /> },
  { key: "konten", label: "Konten", icon: <FiFileText /> },
  { key: "quotes", label: "Quotes", icon: <FiMessageSquare /> },
  { key: "settings", label: "Settings", icon: <FiSettings /> },
  { key: "search", label: "Search", icon: <FiSearch /> },
  { key: "profile", label: "Profile", icon: <FiUser /> },
];

const AdminDashboard: React.FC = () => {
  const [, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterAge, setFilterAge] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [contents, setContents] = useState<any[]>([]);
  const [contentValue, setContentValue] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [editingContent, setEditingContent] = useState<any | null>(null);
  const [editingQuote, setEditingQuote] = useState<any | null>(null);
  const [dailyVisitors, setDailyVisitors] = useState<{
    labels: string[];
    data: number[];
  }>({ labels: [], data: [] });
  const [visitorStart, setVisitorStart] = useState<Date | null>(null);
  const [visitorEnd, setVisitorEnd] = useState<Date | null>(null);

  const fetchDailyVisitors = async (start?: Date, end?: Date) => {
    const token = localStorage.getItem("authToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    let url = "/api/admin/daily-visitors";
    if (start && end) {
      url += `?start=${start.toISOString().slice(0, 10)}&end=${end
        .toISOString()
        .slice(0, 10)}`;
    }
    const res = await axios.get(url, config);
    setDailyVisitors(res.data);
  };

  useEffect(() => {
    if (activeMenu === "statistik") {
      // Default: 7 hari terakhir
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 6);
      setVisitorStart(weekAgo);
      setVisitorEnd(today);
      fetchDailyVisitors(weekAgo, today);
    }
  }, [activeMenu]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const config = token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {};
        const statsRes = await axios.get("/api/admin/stats", config);
        const usersRes = await axios.get("/api/admin/users", config);
        setStats(statsRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        console.error("Gagal fetch data admin:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  // useEffect(() => {
  //   if (editingContent) {
  //     setContentValue(editingContent.content || "");
  //   }
  // }, [editingContent]);
  useEffect(() => {
    const fetchCategories = async () => {
      const token = localStorage.getItem("authToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      try {
        const cats = await axios.get("/api/admin/categories", config);
        setCategories(cats.data);
      } catch (err) {
        console.error("Gagal fetch kategori:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchContents = async () => {
      const token = localStorage.getItem("authToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      try {
        const res = await axios.get("/api/admin/contents", config);

        setContents(res.data);
      } catch (err) {
        console.error("Gagal fetch konten:", err);
      }
    };
    fetchContents();
  }, []);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    type: "content",
  });
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // const handleLogout = () => {
  //   localStorage.removeItem("authToken");
  //   window.location.href = "/";
  // };

  const handleLogout = async () => {
  try {
    // (Opsional) panggil endpoint logout di backend jika ada revoke/blacklist
    // await axios.post("/auth/logout", {}, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } });

    // Bersihkan local/session storage
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser"); // kalau lib/auth menyimpan user di key ini
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("authUser");

    // Bersihkan default header Authorization axios (kalau pernah diset global)
    if (axios.defaults?.headers?.common) {
      delete axios.defaults.headers.common["Authorization"];
    }

    // Matikan auto-select Google One Tap biar tidak auto-login lagi sebagai user
    if (window.google?.accounts?.id?.disableAutoSelect) {
      window.google.accounts.id.disableAutoSelect();
    }

    // Arahkan ke halaman login admin, bukan root
    window.location.replace("/admin/login");
    // atau kalau mau pakai react-router:
    // nav("/admin/login", { replace: true });
  } catch (e) {
    // fallback kalau ada error saat logout: tetap paksa ke admin login
    window.location.replace("/admin/login");
  }
};


  const toggleFlag = async (id: string, newFlag: boolean) => {
    const token = localStorage.getItem("authToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    await axios.patch(`/api/admin/contents/${id}`, { flag: newFlag }, config);
    // refresh data konten
    const conts = await axios.get("/api/admin/contents", config);
    setContents(conts.data);
  };
  // ...existing code...
  const filteredUsers = Array.isArray(users)
    ? users.filter((u) => {
        const matchSearch =
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u._id?.toLowerCase().includes(search.toLowerCase());

        const matchGender = filterGender
          ? (u.sex || u.gender) === filterGender
          : true;

        // Ubah filter usia sesuai opsi baru
        let userAge = u.age ?? (u.birthdate ? getAge(u.birthdate) : null);
        let matchAge = true;
        if (filterAge === "12-15") matchAge = userAge >= 12 && userAge <= 15;
        else if (filterAge === "16-20")
          matchAge = userAge >= 16 && userAge <= 20;
        else if (filterAge === "21-25")
          matchAge = userAge >= 21 && userAge <= 25;
        else if (filterAge === ">25") matchAge = userAge > 25;

        return matchSearch && matchGender && matchAge;
      })
    : [];
  // ...existing code...

  const handleDelete = (id: string) => {
    toast.success("Data berhasil dihapus");
    {
      // TODO: request hapus ke backend
      setUsers(users.filter((u) => u._id !== id));
    }
  };

  // const fetchUsers = async () => {
  //   try {
  //     const res = await axios.get("http://localhost:5000/api/admin/users", {
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem("authToken")}`,
  //       },
  //     });
  //     console.log("Users from API:", res.data.users);
  //     setUsers(res.data.users);
  //   } catch (error) {
  //     console.error("Error fetching users:", error);
  //   }
  // };

  const handleBan = async (id: string) => {
    try {
      await axios.post(
        `http://localhost:5000/api/admin/users/${id}/ban`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === id ? { ...user, status: "nonaktif" } : user
        )
      );
      toast.success("User berhasil dibanned!");
    } catch (err) {
      console.error("Error banning user:", err);
      toast.error("Gagal ban user!");
    }
  };

  function getMonthlyVisitors(dailyVisitors: {
    labels: string[];
    data: number[];
  }) {
    const monthly: { [month: string]: number } = {};
    dailyVisitors.labels.forEach((date, i) => {
      // Ambil "YYYY-MM" dari tanggal
      const month = date.slice(0, 7);
      monthly[month] = (monthly[month] || 0) + (dailyVisitors.data[i] || 0);
    });
    // Return format untuk chart.js
    const labels = Object.keys(monthly);
    const data = labels.map((m) => monthly[m]);
    return { labels, data };
  }
  const [monthlyVisitors, setMonthlyVisitors] = useState<{
    labels: string[];
    data: number[];
  }>({ labels: [], data: [] });

  useEffect(() => {
    // Ambil data harian (seperti statistik)
    const fetchMonthly = async () => {
      const token = localStorage.getItem("authToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Ambil data 1 tahun terakhir (atau sesuai kebutuhan)
      const now = new Date();
      const yearAgo = new Date();
      yearAgo.setFullYear(now.getFullYear() - 1);
      const url = `/api/admin/daily-visitors?start=${yearAgo
        .toISOString()
        .slice(0, 10)}&end=${now.toISOString().slice(0, 10)}`;
      const res = await axios.get(url, config);
      setMonthlyVisitors(getMonthlyVisitors(res.data));
    };
    fetchMonthly();
  }, []);

  function getAge(birthdate: string): number {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
  function getUserAgeGroups(users: any[]) {
    const groups = [0, 0, 0, 0]; // 12-15, 16-20, 21-25, >25
    users.forEach((u) => {
      const age = u.age ?? (u.birthdate ? getAge(u.birthdate) : null);
      if (age === null || isNaN(age)) return;
      if (age >= 12 && age <= 15) groups[0]++;
      else if (age >= 16 && age <= 20) groups[1]++;
      else if (age >= 21 && age <= 25) groups[2]++;
      else if (age > 25) groups[3]++;
    });
    return groups;
  }
  function getUserByAgeGender(users: any[]) {
    // [12-15, 16-20, 21-25, >25]
    const laki = [0, 0, 0, 0];
    const perempuan = [0, 0, 0, 0];
    users.forEach((u) => {
      const age = u.age ?? (u.birthdate ? getAge(u.birthdate) : null);
      if (age === null || isNaN(age)) return;
      const gender = (u.sex || u.gender || "").toLowerCase();
      let idx = -1;
      if (age >= 12 && age <= 15) idx = 0;
      else if (age >= 16 && age <= 20) idx = 1;
      else if (age >= 21 && age <= 25) idx = 2;
      else if (age > 25) idx = 3;
      if (idx === -1) return;
      if (gender === "m" || gender === "male" || gender === "laki-laki")
        laki[idx]++;
      else if (gender === "f" || gender === "female" || gender === "perempuan")
        perempuan[idx]++;
    });
    return {
      labels: ["12-15 tahun", "16-20 tahun", "21-25 tahun", "> 25 tahun"],
      laki,
      perempuan,
    };
  }
  // State untuk Quotes
  const [quotes, setQuotes] = useState<any[]>([]);
  const [quoteForm, setQuoteForm] = useState({
    text: "",
    category_id: "",
    author: "",
    tags: "",
    language: "id",
    flag: true,
  });

  // Fetch quotes
  useEffect(() => {
    if (activeMenu === "quotes") {
      const fetchQuotes = async () => {
        const token = localStorage.getItem("authToken");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
          const res = await axios.get("/api/admin/quotes", config);
          setQuotes(res.data);
        } catch (err) {
          setQuotes([]);
        }
      };
      fetchQuotes();
    }
  }, [activeMenu]);
  // Handler tambah quote
  const handleQuoteFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setQuoteForm((prev) => ({
      ...prev,
      [name]: name === "flag" ? value === "true" : value,
    }));
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    await axios.post(
      "/api/admin/quotes",
      {
        ...quoteForm,
        tags: quoteForm.tags.split(",").map((t) => t.trim()),
      },
      config
    );
    setQuoteForm({
      text: "",
      category_id: "",
      author: "",
      tags: "",
      language: "id",
      flag: true,
    });
    // Refresh quotes
    const res = await axios.get("/api/admin/quotes", config);
    setQuotes(res.data);
  };

  // Handler hapus quote
  const handleDeleteQuote = async (id: string) => {
    const token = localStorage.getItem("authToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    await axios.delete(`/api/admin/quotes/${id}`, config);
    setQuotes(quotes.filter((q) => q._id !== id));
  };
  // Handler toggle flag quote
  const handleToggleQuoteFlag = async (id: string, newFlag: boolean) => {
    const token = localStorage.getItem("authToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    await axios.patch(`/api/admin/quotes/${id}`, { flag: newFlag }, config);
    // Refresh quotes
    const res = await axios.get("/api/admin/quotes", config);
    setQuotes(res.data);
  };
  if (loading) return <div className="p-10">Loading...</div>;
  const usersOnly = users?.filter((u) => u.role !== "admin") || [];

  return (
    <div
      className="flex h-screen w-screen bg-gray-50 relative text-gray-700"
      style={{ fontFamily: "'Nunito', Arial, sans-serif" }}
    >
      {/* Sidebar */}

      <div
        className={`
    fixed top-0 left-0 h-screen z-20
    bg-gradient-to-br from-white via-blue-50/30 to-slate-50
    backdrop-blur-sm shadow-2xl flex flex-col
    w-20 md:w-80
    transition-all duration-500 ease-out
    border-r-2 border-blue-200/50
    before:absolute before:inset-0 before:bg-gradient-to-b before:from-blue-500/5 before:to-transparent before:pointer-events-none
    overflow-hidden
  `}
      >
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>

        {/* Avatar/logo section */}
        <div className="flex flex-col items-center py-4 relative flex-shrink-0">
          <div className="flex flex-row items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-blue-400 flex items-center justify-center shadow-xl shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/40">
                <FiUser size={26} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <div className="hidden md:block">
              <div className="font-bold text-xl text-slate-800 mb-1">
                Admin Panel
              </div>
              <div className="text-sm text-blue-600 font-medium">
                Dashboard Control
              </div>
            </div>
          </div>

          {/* Subtle separator */}
          <div className="hidden md:block w-48 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent mt-3"></div>
        </div>

        {/* Menu section */}
        <nav className="flex-1 px-3 md:px-6 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
          <ul className="space-y-1 pb-4">
            {menus.map((menu, index) => {
              // Icon mapping berdasarkan nama menu
              const getMenuIcon = (menuKey: string) => {
                const iconMap: { [key: string]: string } = {
                  dashboard: "🏠",
                  pengguna: "👥",
                  statistik: "📊",
                  kategori: "📁",
                  konten: "📝",
                  quotes: "💬",
                  settings: "⚙️",
                  laporan: "📋",
                  analytics: "📈",
                  profile: "👤",
                  search: "🔍",
                };
                return iconMap[menuKey.toLowerCase()] || menu.icon || "📋";
              };

              return (
                <div key={menu.key}>
                  <li
                    className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 ease-out transform hover:scale-[1.02]
                ${
                  activeMenu === menu.key
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/25 border border-blue-400/50"
                    : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/50 text-slate-700 hover:text-blue-700 hover:shadow-md hover:shadow-blue-100/50 border border-transparent hover:border-blue-200/50"
                }
                ${"justify-center md:justify-start"}
              `}
                    onClick={() => setActiveMenu(menu.key)}
                    title={menu.label}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Active indicator */}
                    {activeMenu === menu.key && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-sm"></div>
                    )}

                    {/* Icon container */}
                    <div
                      className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300 ${
                        activeMenu === menu.key
                          ? "bg-white/20 text-white"
                          : "group-hover:bg-blue-100 group-hover:text-blue-600"
                      }`}
                    >
                      <span className="text-lg">{getMenuIcon(menu.key)}</span>
                    </div>

                    {/* Label */}
                    <span className="hidden md:inline text-sm font-medium group-hover:translate-x-1 transition-all duration-300">
                      {menu.label}
                    </span>

                    {/* Hover effect arrow */}
                    <div
                      className={`hidden md:block ml-auto transition-all duration-300 ${
                        activeMenu === menu.key
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <div className="w-1.5 h-1.5 border-r-2 border-t-2 border-current transform rotate-45"></div>
                    </div>
                  </li>

                  {/* Separator line after each menu item */}
                  {index < menus.length - 1 && (
                    <div className="mx-4 my-1">
                      <div className="h-px bg-gradient-to-r from-transparent via-blue-200/50 to-transparent"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section with logout */}
        <div className="mt-auto p-3 md:p-4 flex-shrink-0 border-t border-blue-100/50 bg-gradient-to-r from-blue-50/30 to-white/50">
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full group relative flex items-center gap-3 justify-center md:justify-start text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 px-3 py-3 rounded-xl transition-all duration-300 font-medium border-2 border-red-200 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/30 transform hover:scale-[1.02]"
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
              <svg
                className="w-5 h-5 text-red-600 group-hover:text-white transition-colors duration-300"
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
            <span className="hidden md:inline text-sm font-semibold relative group-hover:translate-x-1 transition-transform duration-300">
              Logout
            </span>

            {/* Arrow indicator */}
            <div className="hidden md:block ml-auto relative">
              <div className="w-1.5 h-1.5 border-r-2 border-t-2 border-current transform rotate-45 opacity-60 group-hover:opacity-100 transition-all duration-300"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="transition-all duration-300 ml-20 md:ml-72"></div>
      <div className="p-10 bg-gradient-to-br bg-blue-50 min-h-screen w-full max-w-full overflow-x-hidden">
        <h1 className="text-4xl font-bold mb-10 text-blue-700 text-left w-full">
          Dashboard
        </h1>
        {/* Dashboard Statistik */}
        {activeMenu === "dashboard" && (
          <div className="grid grid-cols-2 grid-rows-2 gap-6 mb-6 h-[32rem]">
            <div className="bg-white p-4 rounded-xl shadow flex flex-col h-full min-h-0">
              <h2 className=" mb-2 text-base text-black text-center w-full">
                Statistik Kunjungan Per Bulan
              </h2>

              <div className="flex-1 flex items-center justify-center min-h-0">
                <Bar
                  data={{
                    // Ambil bulan tahun 2025 sampai bulan sekarang
                    labels: (() => {
                      const now = new Date();
                      const currentMonth = now.getMonth() + 1; // 1-12
                      const months = [];
                      for (let m = 1; m <= currentMonth; m++) {
                        const mm = m.toString().padStart(2, "0");
                        months.push(`2025-${mm}`);
                      }
                      const bulan = [
                        "",
                        "Januari",
                        "Februari",
                        "Maret",
                        "April",
                        "Mei",
                        "Juni",
                        "Juli",
                        "Agustus",
                        "September",
                        "Oktober",
                        "November",
                        "Desember",
                      ];
                      return months.map((m) => {
                        const [y, mo] = m.split("-");
                        return `${bulan[parseInt(mo, 10)]} ${y}`;
                      });
                    })(),
                    datasets: [
                      {
                        label: "Jumlah Kunjungan",
                        data: (() => {
                          const now = new Date();
                          const currentMonth = now.getMonth() + 1;
                          const months = [];
                          for (let m = 1; m <= currentMonth; m++) {
                            const mm = m.toString().padStart(2, "0");
                            months.push(`2025-${mm}`);
                          }
                          return months.map((m) =>
                            monthlyVisitors.labels.indexOf(m) !== -1
                              ? monthlyVisitors.data[
                                  monthlyVisitors.labels.indexOf(m)
                                ]
                              : 0
                          );
                        })(),
                        backgroundColor: "#60a5fa",
                        borderRadius: 8,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } },
                  }}
                  height={180}
                />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow flex flex-col h-full min-h-0">
              <h2 className=" mb-2 text-base text-black text-center w-full">
                Pengguna Berdasarkan Usia & Gender
              </h2>
              <div className="flex-1 flex items-center justify-center min-h-0">
                <Bar
                  data={{
                    labels: getUserByAgeGender(usersOnly).labels,
                    datasets: [
                      {
                        label: "Laki-laki",
                        data: getUserByAgeGender(usersOnly).laki,
                        backgroundColor: "#3498DB",
                        borderRadius: 8,
                      },
                      {
                        label: "Perempuan",
                        data: getUserByAgeGender(usersOnly).perempuan,
                        backgroundColor: "#FF00FF",
                        borderRadius: 8,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "top" } },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 10,
                          precision: 0,
                        },
                      },
                    },
                  }}
                  height={180}
                />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow flex flex-col items-center justify-center h-full min-h-0">
              <h2 className=" mb-2 text-base text-black">
                Total Jumlah Pengguna
              </h2>
              <div className="text-6xl font-bold text-blue-500">
                {usersOnly.length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow flex flex-col h-full min-h-0">
              <h2 className="mb-2 text-base text-black text-center w-full">
                Usia Pengguna
              </h2>
              <div className="flex-1 flex items-center justify-center min-h-0">
                <Pie
                  data={{
                    labels: [
                      "12-15 tahun",
                      "16-20 tahun",
                      "21-25 tahun",
                      "> 25 tahun",
                    ],
                    datasets: [
                      {
                        data: getUserAgeGroups(usersOnly),
                        backgroundColor: [
                          "#E74C3C",
                          "#3498DB",

                          "#9B59B6",
                          "#2ECC71",
                        ],
                        borderColor: "#fff",
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "right" },
                    },
                  }}
                  height={180}
                />
              </div>
            </div>
          </div>
        )}
        {/* Daftar Pengguna */}
        {activeMenu === "pengguna" && (
          <div className="bg-white p-6 rounded-xl shadow mb-8 ">
            <h2 className="font-semibold mb-4 text-xl text-blue-700 ">
              Daftar Pengguna
            </h2>
            {/* Search & Filter */}
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <input
                type="text"
                placeholder="Cari nama, email, atau ID..."
                className="border rounded px-3 py-2 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="border rounded px-3 py-2 text-sm"
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
              >
                <option value="">Semua Gender</option>
                <option value="M">Laki-laki</option>
                <option value="F">Perempuan</option>
              </select>
              <select
                className="border rounded px-3 py-2 text-sm"
                value={filterAge}
                onChange={(e) => setFilterAge(e.target.value)}
              >
                <option value="">Semua Usia</option>
                <option value="12-15">12-15 tahun</option>
                <option value="16-20">16-20 tahun</option>
                <option value="21-25">21-25 tahun</option>
                <option value=">25">&gt; 25 tahun</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-blue-500 text-white font-semibold">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Nama</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Usia</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, idx) => (
                    <tr
                      key={u._id}
                      className={`transition ${
                        idx % 2 === 0 ? "bg-white" : "bg-blue-50"
                      }`}
                    >
                      <td className="py-2 px-4">{u._id}</td>
                      <td className="py-2 px-4 whitespace-nowrap truncate max-w-[160px]">
                        {u.name}
                      </td>
                      <td className="py-2 px-4">{u.email}</td>
                      <td className="py-2 px-4">{u.sex || u.gender}</td>
                      <td className="py-2 px-4">
                        {u.age ?? (u.birthdate ? getAge(u.birthdate) : "-")}
                      </td>
                      <td className="py-2 px-4">
                        {u.status === "nonaktif" ? (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                            Nonaktif
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        {u.role === "admin" ? (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">
                            Admin
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
                            User
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-4 flex gap-2">
                        <button
                          className="p-2 rounded transition-colors hover:bg-blue-50"
                          title="Lihat"
                          onClick={() => setSelectedUser(u)}
                        >
                          <svg
                            width="20"
                            height="20"
                            fill="#3B82F6"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                          </svg>
                        </button>
                        <button
                          className="p-2 rounded transition-colors hover:bg-red-50"
                          title="Hapus"
                          onClick={() => handleDelete(u._id)}
                        >
                          <svg
                            width="20"
                            height="20"
                            fill="#EF4444"
                            viewBox="0 0 24 24"
                          >
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                          </svg>
                        </button>
                        <button
                          className="p-2 rounded transition-colors hover:bg-orange-50"
                          title="Ban"
                          onClick={() => handleBan(u._id)}
                        >
                          <svg
                            width="20"
                            height="20"
                            fill="#F59E0B"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeMenu === "statistik" && (
          <div className="bg-white p-6 rounded-xl shadow mb-8">
            <h2 className="font-semibold mb-4 text-xl text-blue-700">
              Statistik Pengunjung Per Hari
            </h2>
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <span className="text-sm">Tanggal:</span>
              <DatePicker
                selected={visitorStart}
                onChange={(date) => setVisitorStart(date)}
                selectsStart
                startDate={visitorStart ?? undefined}
                endDate={visitorEnd ?? undefined}
                dateFormat="yyyy-MM-dd"
                className="border rounded px-3 py-2 text-sm"
                placeholderText="Mulai"
              />
              <span>-</span>
              <DatePicker
                selected={visitorEnd}
                onChange={(date) => setVisitorEnd(date)}
                selectsEnd
                startDate={visitorStart ?? undefined}
                endDate={visitorEnd ?? undefined}
                minDate={visitorStart ?? undefined}
                dateFormat="yyyy-MM-dd"
                className="border rounded px-3 py-2 text-sm"
                placeholderText="Selesai"
              />
              <button
                className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() =>
                  fetchDailyVisitors(
                    visitorStart ?? undefined,
                    visitorEnd ?? undefined
                  )
                }
              >
                Tampilkan
              </button>
            </div>
            <div className="w-full h-96">
              <Bar
                data={{
                  labels: dailyVisitors.labels,
                  datasets: [
                    {
                      label: "Jumlah Pengunjung",
                      data: dailyVisitors.data,
                      backgroundColor: "#60a5fa",
                      borderRadius: 8,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                        precision: 0,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        )}
        {activeMenu === "kategori" && (
          <div className="bg-white p-6 rounded-xl shadow mb-8">
            <h2 className="font-semibold mb-4 text-xl text-blue-700">
              Kelola Kategori
            </h2>
            {/* Form tambah/edit kategori */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const token = localStorage.getItem("authToken");
                const config = {
                  headers: { Authorization: `Bearer ${token}` },
                };
                if (editingCategory) {
                  // Edit kategori
                  await axios.patch(
                    `/api/admin/categories/${editingCategory._id}`,
                    categoryForm,
                    config
                  );
                } else {
                  // Tambah kategori
                  await axios.post(
                    "/api/admin/categories",
                    categoryForm,
                    config
                  );
                }
                setCategoryForm({ name: "", description: "", type: "content" });
                setEditingCategory(null);
                // Refresh kategori
                const cats = await axios.get("/api/admin/categories", config);
                setCategories(cats.data);
              }}
              className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div>
                <label className="block font-semibold mb-1">
                  Nama Kategori
                </label>
                <input
                  name="name"
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Nama kategori"
                  className="border p-2 w-full rounded"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Deskripsi</label>
                <input
                  name="description"
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Deskripsi"
                  className="border p-2 w-full rounded"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Tipe</label>
                <select
                  name="type"
                  value={categoryForm.type}
                  onChange={(e) =>
                    setCategoryForm((f) => ({ ...f, type: e.target.value }))
                  }
                  className="border p-2 w-full rounded"
                  required
                >
                  <option value="content">Content</option>
                  <option value="quote">Quote</option>
                </select>
              </div>
              <div className="md:col-span-3 flex gap-2 justify-end mt-2">
                {editingCategory && (
                  <button
                    type="button"
                    className="bg-gray-200 px-4 py-2 rounded"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({
                        name: "",
                        description: "",
                        type: "content",
                      });
                    }}
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded font-semibold hover:bg-blue-600 transition"
                >
                  {editingCategory ? "Simpan Perubahan" : "Tambah Kategori"}
                </button>
              </div>
            </form>
            {/* Daftar kategori */}
            <h3 className="font-semibold mb-2 text-lg">Daftar Kategori</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-blue-500 text-white font-semibold">
                    <th className="py-3 px-4">Nama</th>
                    <th className="py-3 px-4">Deskripsi</th>
                    <th className="py-3 px-4">Tipe</th>
                    <th className="py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat: any, idx: number) => (
                    <tr
                      key={cat._id}
                      className={`transition ${
                        idx % 2 === 0 ? "bg-white" : "bg-blue-50"
                      }`}
                    >
                      <td className="py-2 px-4">{cat.name}</td>
                      <td className="py-2 px-4">{cat.description}</td>
                      <td className="py-2 px-4">{cat.type}</td>
                      <td className="py-2 px-4 flex gap-2 items-center">
                        <button
                          className="p-2 rounded transition-colors hover:bg-yellow-50"
                          title="Edit"
                          onClick={() => {
                            setEditingCategory(cat);
                            setCategoryForm({
                              name: cat.name,
                              description: cat.description || "",
                              type: cat.type,
                            });
                          }}
                        >
                          <svg
                            width="20"
                            height="20"
                            fill="#F59E0B"
                            viewBox="0 0 24 24"
                          >
                            <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                          </svg>
                        </button>
                        <button
                          className="p-2 rounded transition-colors hover:bg-red-50"
                          title="Hapus"
                          onClick={async () => {
                            if (toast.success("Kategori berhasil dihapus")) {
                              const token = localStorage.getItem("authToken");
                              const config = {
                                headers: { Authorization: `Bearer ${token}` },
                              };
                              await axios.delete(
                                `/api/admin/categories/${cat._id}`,
                                config
                              );
                              // Refresh kategori
                              const cats = await axios.get(
                                "/api/admin/categories",
                                config
                              );
                              setCategories(cats.data);
                            }
                          }}
                        >
                          <svg
                            width="22"
                            height="22"
                            fill="#EF4444"
                            viewBox="0 0 24 24"
                          >
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Konten */}
        {activeMenu === "konten" && (
          <div className="bg-white p-6 rounded-xl shadow mb-8">
            <h2 className="font-semibold mb-4 text-xl text-blue-700">
              Kelola Konten Tips
            </h2>
            {/* Form tambah konten */}
            {!editingContent && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget as HTMLFormElement;
                  const title = (
                    form.querySelector('[name="title"]') as HTMLInputElement
                  ).value;
                  const category_id = (
                    form.querySelector(
                      '[name="category_id"]'
                    ) as HTMLSelectElement
                  ).value;
                  const tags = (
                    form.querySelector('[name="tags"]') as HTMLInputElement
                  ).value;
                  const content = contentValue;
                  const source = (
                    form.querySelector('[name="source"]') as HTMLInputElement
                  ).value;
                  const source_link = (
                    form.querySelector(
                      '[name="source_link"]'
                    ) as HTMLInputElement
                  ).value;

                  const token = localStorage.getItem("authToken");
                  const config = {
                    headers: { Authorization: `Bearer ${token}` },
                  };
                  await axios.post(
                    "/api/admin/contents",
                    {
                      title,
                      category_id,
                      tags: tags.split(",").map((t: string) => t.trim()),
                      content,
                      source,
                      source_link,
                      language: "id",
                    },
                    config
                  );
                  form.reset();
                  setContentValue("");
                  // Refresh konten
                  const conts = await axios.get("/api/admin/contents", config);
                  setContents(conts.data);
                }}
                className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block font-semibold mb-1">Judul</label>
                  <input
                    name="title"
                    type="text"
                    placeholder="Judul"
                    className="border p-2 w-full rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Kategori</label>
                  <select
                    name="category_id"
                    className="border p-2 w-full rounded"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {categories
                      .filter((cat) => cat.type === "content")
                      .map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tags</label>
                  <input
                    name="tags"
                    type="text"
                    placeholder="Tags (pisahkan dengan koma)"
                    className="border p-2 w-full rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Sumber</label>
                  <input
                    name="source"
                    type="text"
                    placeholder="Sumber"
                    className="border p-2 w-full rounded"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Link Sumber
                  </label>
                  <input
                    name="source_link"
                    type="text"
                    placeholder="https://..."
                    className="border p-2 w-full rounded"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold mb-1">Isi Konten</label>
                  <ReactQuill
                    value={contentValue}
                    onChange={setContentValue}
                    className="bg-white"
                    theme="snow"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-6 py-2 rounded font-semibold hover:bg-blue-600 transition"
                  >
                    Tambah Konten
                  </button>
                </div>
              </form>
            )}
            {editingContent && (
              <div className="fixed inset-0 bg-gradient-to-br from-black/40 to-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative flex flex-col max-h-[90vh]">
                  {/* Header sticky */}
                  <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <svg
                          className="w-6 h-6 text-white"
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
                      <h3 className="text-2xl font-bold text-white">
                        Edit Konten
                      </h3>
                    </div>
                    <button
                      className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all duration-200 hover:rotate-90"
                      onClick={() => setEditingContent(null)}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  {/* Scrollable form & preview */}
                  <div className="overflow-y-auto px-6 py-4 flex-1">
                    {/* Form */}
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const token = localStorage.getItem("authToken");
                        const config = {
                          headers: { Authorization: `Bearer ${token}` },
                        };
                        try {
                          await axios.patch(
                            `/api/admin/contents/${editingContent._id}`,
                            editingContent,
                            config
                          );
                          setEditingContent(null);
                          const conts = await axios.get(
                            "/api/admin/contents",
                            config
                          );
                          setContents(conts.data);
                        } catch (error) {
                          console.error("Error updating content:", error);
                        }
                      }}
                      className="space-y-4"
                    >
                      {/* Judul */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Judul Konten
                        </label>
                        <input
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 w-full rounded-xl transition-all duration-200 text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white"
                          value={editingContent.title}
                          onChange={(e) =>
                            setEditingContent({
                              ...editingContent,
                              title: e.target.value,
                            })
                          }
                          placeholder="Masukkan judul yang menarik..."
                          required
                        />
                      </div>
                      {/* Kategori */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Kategori
                        </label>
                        <select
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 w-full rounded-xl transition-all duration-200 bg-gray-50"
                          value={
                            editingContent.category_id?._id ||
                            editingContent.category_id ||
                            ""
                          }
                          onChange={(e) =>
                            setEditingContent({
                              ...editingContent,
                              category_id: e.target.value,
                            })
                          }
                          required
                        >
                          <option value="">Pilih Kategori</option>
                          {categories
                            .filter((cat) => cat.type === "content")
                            .map((cat) => (
                              <option key={cat._id} value={cat._id}>
                                {cat.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      {/* Tags */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Tags
                        </label>
                        <input
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 w-full rounded-xl transition-all duration-200 text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white"
                          value={
                            Array.isArray(editingContent.tags)
                              ? editingContent.tags.join(", ")
                              : editingContent.tags || ""
                          }
                          onChange={(e) =>
                            setEditingContent({
                              ...editingContent,
                              tags: e.target.value
                                .split(",")
                                .map((t: string) => t.trim()),
                            })
                          }
                          placeholder="Tags (pisahkan dengan koma)"
                        />
                      </div>
                      {/* Sumber */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Sumber
                        </label>
                        <input
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 w-full rounded-xl transition-all duration-200 text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white"
                          value={editingContent.source || ""}
                          onChange={(e) =>
                            setEditingContent({
                              ...editingContent,
                              source: e.target.value,
                            })
                          }
                          placeholder="Sumber"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Link Sumber
                        </label>
                        <input
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 w-full rounded-xl transition-all duration-200 text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white"
                          value={editingContent.source_link || ""}
                          onChange={(e) =>
                            setEditingContent({
                              ...editingContent,
                              source_link: e.target.value,
                            })
                          }
                          placeholder="https://..."
                        />
                      </div>
                      {/* Isi Konten */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Isi Konten
                        </label>
                        <ReactQuill
                          value={editingContent.content}
                          onChange={(val) =>
                            setEditingContent({
                              ...editingContent,
                              content: val,
                            })
                          }
                          className="bg-white"
                          theme="snow"
                        />
                        <div className="text-xs text-gray-400 text-right mt-1">
                          {editingContent.content?.length || 0} karakter
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                          <svg
                            className="w-4 h-4 mr-2 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Preview
                        </label>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 overflow-hidden">
                          <div className="p-4 border-b border-blue-100 bg-blue-100/50">
                            <h4 className="font-semibold text-gray-800">
                              {editingContent.title}
                            </h4>
                            <div className="text-xs text-gray-500 mt-1">
                              Kategori:{" "}
                              {categories.find(
                                (cat) =>
                                  cat._id ===
                                  (editingContent.category_id?._id ||
                                    editingContent.category_id)
                              )?.name || "-"}
                              {" | "}Tags:{" "}
                              {Array.isArray(editingContent.tags)
                                ? editingContent.tags.join(", ")
                                : editingContent.tags}
                              {" | "}Sumber: {editingContent.source || "-"}
                            </div>
                          </div>
                          <div
                            className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: editingContent.content || "",
                            }}
                          />
                        </div>
                      </div>
                      {/* Tombol aksi di bawah */}
                      <div className="flex justify-end gap-2 pt-2 pb-1 bg-white sticky bottom-0 z-10">
                        <button
                          type="button"
                          className="bg-gray-200 px-4 py-2 rounded"
                          onClick={() => setEditingContent(null)}
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="bg-blue-500 text-white px-6 py-2 rounded font-semibold hover:bg-blue-600 transition"
                        >
                          Simpan Perubahan
                        </button>
                      </div>
                    </form>
                  </div>
                  {/* Footer info */}
                  <div className="px-6 py-2 text-xs text-gray-400 bg-white rounded-b-2xl border-t border-gray-100">
                    Terakhir diubah: {new Date().toLocaleDateString("id-ID")}
                  </div>
                </div>
              </div>
            )}
            {/* Daftar konten */}
            <h3 className="font-semibold mb-2 text-lg">Daftar Konten</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-blue-500 text-white font-semibold">
                    <th className="py-3 px-4">Judul</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Tags</th>
                    <th className="py-3 px-4 w-40 max-w-xs">Isi Konten</th>
                    <th className="py-3 px-4">Sumber</th>
                    {/* <th className="py-3 px-4">Link Sumber</th> */}
                    <th className="py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {contents.map((c: any, idx: number) => (
                    <tr
                      key={c._id}
                      className={`transition ${
                        idx % 2 === 0 ? "bg-white" : "bg-blue-50"
                      }`}
                    >
                      <td className="py-2 px-4 font-semibold">{c.title}</td>
                      <td className="py-2 px-4">
                        {c.category_id?.name || "-"}
                      </td>
                      <td className="py-2 px-4 text-xs">
                        {c.tags?.join(", ")}
                      </td>
                      <td className="py-2 px-4 text-sm max-w-xs truncate">
                        <div
                          style={{
                            maxWidth: 300,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          dangerouslySetInnerHTML={{ __html: c.content || "" }}
                        />
                      </td>
                      <td className="py-2 px-4 text-xs">
                        {c.source_link ? (
                          <a
                            href={c.source_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                            title={c.source_link}
                          >
                            {c.source_link}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-2 px-4 flex gap-2 items-center">
                        {/* Delete Button with Icon */}
                        <button
                          className="p-2 rounded transition-colors hover:bg-red-50"
                          title="Hapus"
                          onClick={async () => {
                            const token = localStorage.getItem("authToken");
                            const config = {
                              headers: { Authorization: `Bearer ${token}` },
                            };
                            await axios.delete(
                              `/api/admin/contents/${c._id}`,
                              config
                            );
                            setContents(
                              contents.filter((x: any) => x._id !== c._id)
                            );
                            toast.success("Konten berhasil dihapus");
                          }}
                        >
                          <svg
                            width="22"
                            height="22"
                            fill="#EF4444"
                            viewBox="0 0 24 24"
                          >
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                          </svg>
                        </button>
                        <button
                          className="p-2 rounded transition-colors hover:bg-yellow-50"
                          title="Edit"
                          onClick={() => setEditingContent(c)}
                        >
                          <svg
                            width="20"
                            height="20"
                            fill="#F59E0B"
                            viewBox="0 0 24 24"
                          >
                            <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                          </svg>
                        </button>

                        {/* ON/OFF Toggle Switch */}
                        <button
                          onClick={() => toggleFlag(c._id, !c.flag)}
                          className="relative w-16 h-8 rounded-full transition-colors duration-300 outline-none border-2 flex items-center"
                          style={{
                            minWidth: 64,
                            backgroundColor: c.flag ? "#22C55E" : "#EF4444",
                            borderColor: c.flag ? "#16A34A" : "#DC2626",
                          }}
                        >
                          {/* Label ON */}
                          <span
                            className={`absolute left-2 text-xs font-bold transition-opacity duration-300 z-10
                  ${
                    c.flag ? "text-white opacity-100" : "text-white opacity-50"
                  }`}
                          >
                            ON
                          </span>

                          {/* Label OFF */}
                          <span
                            className={`absolute right-2 text-xs font-bold transition-opacity duration-300 z-10
                  ${
                    !c.flag ? "text-white opacity-100" : "text-white opacity-50"
                  }`}
                          >
                            OFF
                          </span>

                          {/* Knob */}
                          <span
                            className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 z-20
                  ${c.flag ? "translate-x-8" : "translate-x-0"}`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* quotes */}
        {activeMenu === "quotes" && (
          <div className="bg-white p-6 rounded-xl shadow mb-8">
            <h2 className="font-semibold mb-4 text-xl text-blue-700">
              Kelola Quotes
            </h2>
            {/* Form tambah quote */}
            <form
              onSubmit={handleQuoteSubmit}
              className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block font-semibold mb-1">Text Quote</label>
                <textarea
                  name="text"
                  value={quoteForm.text}
                  onChange={handleQuoteFormChange}
                  placeholder="Isi quote"
                  className="border p-2 w-full rounded"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Kategori</label>
                <select
                  name="category_id"
                  value={quoteForm.category_id}
                  onChange={handleQuoteFormChange}
                  className="border p-2 w-full rounded"
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {/* {categories
                    .filter((cat) => cat.type === "content")
                    .map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))} */}
                  {/* Untuk quotes */}
                  {categories
                    .filter((cat) => cat.type === "quote")
                    .map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Author</label>
                <input
                  name="author"
                  value={quoteForm.author}
                  onChange={handleQuoteFormChange}
                  type="text"
                  placeholder="Penulis"
                  className="border p-2 w-full rounded"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Tags</label>
                <input
                  name="tags"
                  value={quoteForm.tags}
                  onChange={handleQuoteFormChange}
                  type="text"
                  placeholder="Tags (pisahkan dengan koma)"
                  className="border p-2 w-full rounded"
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded font-semibold hover:bg-blue-600 transition"
                >
                  Tambah Quote
                </button>
              </div>
            </form>
            {/* Daftar Quotes */}
            <h3 className="font-semibold mb-2 text-lg">Daftar Quotes</h3>
            {editingQuote && (
              <div className="fixed inset-0 bg-gradient-to-br from-black/40 to-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative flex flex-col max-h-[90vh]">
                  {/* Header sticky */}
                  <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className=" p-2 rounded-lg">
                        <svg
                          className="w-6 h-6 text-white"
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
                      <h3 className="text-2xl font-bold text-white">
                        Edit Quote
                      </h3>
                    </div>
                    <button
                      className="text-red-500 p-1 rounded-full transition-all duration-200 absolute top-6 right-6 z-20 hover:bg-red-100"
                      onClick={() => setEditingQuote(null)}
                      aria-label="Tutup"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  {/* Scrollable form & preview */}
                  <div className="overflow-y-auto px-6 py-4 flex-1">
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const token = localStorage.getItem("authToken");
                        const config = {
                          headers: { Authorization: `Bearer ${token}` },
                        };
                        await axios.patch(
                          `/api/admin/quotes/${editingQuote._id}`,
                          {
                            ...editingQuote,
                            tags: Array.isArray(editingQuote.tags)
                              ? editingQuote.tags
                              : (editingQuote.tags || "")
                                  .split(",")
                                  .map((t: string) => t.trim()),
                          },
                          config
                        );
                        setEditingQuote(null);
                        // Refresh quotes
                        const res = await axios.get(
                          "/api/admin/quotes",
                          config
                        );
                        setQuotes(res.data);
                      }}
                      className="space-y-4"
                    >
                      {/* Text Quote */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Isi Quote
                        </label>
                        <textarea
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 w-full rounded-xl transition-all duration-200 text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white resize-none"
                          value={editingQuote.text}
                          onChange={(e) =>
                            setEditingQuote({
                              ...editingQuote,
                              text: e.target.value,
                            })
                          }
                          placeholder="Isi Quote"
                          rows={4}
                          required
                        />
                      </div>
                      {/* Kategori */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Kategori
                        </label>
                        <select
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 w-full rounded-xl transition-all duration-200 bg-gray-50"
                          value={
                            editingQuote.category_id?._id ||
                            editingQuote.category_id ||
                            ""
                          }
                          onChange={(e) =>
                            setEditingQuote({
                              ...editingQuote,
                              category_id: e.target.value,
                            })
                          }
                          required
                        >
                          <option value="">Pilih Kategori</option>
                          {categories
                            .filter((cat) => cat.type === "quote")
                            .map((cat) => (
                              <option key={cat._id} value={cat._id}>
                                {cat.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      {/* Author */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Author
                        </label>
                        <input
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 w-full rounded-xl transition-all duration-200 text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white"
                          value={editingQuote.author || ""}
                          onChange={(e) =>
                            setEditingQuote({
                              ...editingQuote,
                              author: e.target.value,
                            })
                          }
                          placeholder="Penulis"
                          required
                        />
                      </div>
                      {/* Tags */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Tags
                        </label>
                        <input
                          className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 w-full rounded-xl transition-all duration-200 text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white"
                          value={
                            Array.isArray(editingQuote.tags)
                              ? editingQuote.tags.join(", ")
                              : editingQuote.tags || ""
                          }
                          onChange={(e) =>
                            setEditingQuote({
                              ...editingQuote,
                              tags: e.target.value
                                .split(",")
                                .map((t: string) => t.trim()),
                            })
                          }
                          placeholder="Tags (pisahkan dengan koma)"
                        />
                      </div>
                      {/* Preview di bawah form */}
                      <div className="mb-4">
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                          <svg
                            className="w-4 h-4 mr-2 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Preview
                        </label>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 overflow-hidden">
                          <div className="p-4 border-b border-blue-100 bg-blue-100/50">
                            <h4 className="font-semibold text-gray-800">
                              {editingQuote.text}
                            </h4>
                            <div className="text-xs text-gray-500 mt-1">
                              Kategori:{" "}
                              {categories.find(
                                (cat) =>
                                  cat._id ===
                                  (editingQuote.category_id?._id ||
                                    editingQuote.category_id)
                              )?.name || "-"}
                              {" | "}Tags:{" "}
                              {Array.isArray(editingQuote.tags)
                                ? editingQuote.tags.join(", ")
                                : editingQuote.tags}
                              {" | "}Author: {editingQuote.author || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Tombol aksi di bawah */}
                      <div className="flex justify-end gap-2 pt-2 pb-1 bg-white sticky bottom-0 z-10">
                        <button
                          type="button"
                          className="bg-gray-200 px-4 py-2 rounded"
                          onClick={() => setEditingQuote(null)}
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="bg-blue-500 text-white px-6 py-2 rounded font-semibold hover:bg-blue-600 transition"
                        >
                          Simpan Perubahan
                        </button>
                      </div>
                    </form>
                  </div>
                  {/* Footer info */}
                  <div className="px-6 py-2 text-xs text-gray-400 bg-white rounded-b-2xl border-t border-gray-100">
                    Terakhir diubah: {new Date().toLocaleDateString("id-ID")}
                  </div>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-blue-500 text-white font-semibold">
                    <th className="py-3 px-4">Text</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Author</th>
                    <th className="py-3 px-4">Tags</th>
                    <th className="py-3 px-4">Language</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q: any, idx: number) => (
                    <tr
                      key={q._id}
                      className={`transition ${
                        idx % 2 === 0 ? "bg-white" : "bg-blue-50"
                      }`}
                    >
                      <td className="py-2 px-4">{q.text}</td>
                      <td className="py-2 px-4">
                        {q.category_id && typeof q.category_id === "object"
                          ? q.category_id.name
                          : "-"}
                      </td>
                      <td className="py-2 px-4">{q.author}</td>
                      <td className="py-2 px-4 text-xs">
                        {Array.isArray(q.tags) ? q.tags.join(", ") : q.tags}
                      </td>
                      <td className="py-2 px-4">{q.language}</td>
                      <td className="py-2 px-4">
                        {q.flag ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                            Aktif
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-4 flex gap-2 items-center">
                        {/* Delete Button */}
                        <button
                          className="p-2 rounded transition-colors hover:bg-red-50"
                          title="Hapus"
                          onClick={() => handleDeleteQuote(q._id)}
                        >
                          <svg
                            width="22"
                            height="22"
                            fill="#EF4444"
                            viewBox="0 0 24 24"
                          >
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                          </svg>
                        </button>
                        <button
                          className="p-2 rounded transition-colors hover:bg-yellow-50"
                          title="Edit"
                          onClick={() => setEditingQuote(q)}
                        >
                          <svg
                            width="20"
                            height="20"
                            fill="#F59E0B"
                            viewBox="0 0 24 24"
                          >
                            <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                          </svg>
                        </button>
                        {/* ON/OFF Toggle */}
                        <button
                          onClick={() => handleToggleQuoteFlag(q._id, !q.flag)}
                          className="relative w-16 h-8 rounded-full transition-colors duration-300 outline-none border-2 flex items-center"
                          style={{
                            minWidth: 64,
                            backgroundColor: q.flag ? "#22C55E" : "#EF4444",
                            borderColor: q.flag ? "#16A34A" : "#DC2626",
                          }}
                        >
                          <span
                            className={`absolute left-2 text-xs font-bold transition-opacity duration-300 z-10
                      ${
                        q.flag
                          ? "text-white opacity-100"
                          : "text-white opacity-50"
                      }`}
                          >
                            ON
                          </span>
                          <span
                            className={`absolute right-2 text-xs font-bold transition-opacity duration-300 z-10
                      ${
                        !q.flag
                          ? "text-white opacity-100"
                          : "text-white opacity-50"
                      }`}
                          >
                            OFF
                          </span>
                          <span
                            className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 z-20
                      ${q.flag ? "translate-x-8" : "translate-x-0"}`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Menu lain bisa ditambahkan di sini */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                onClick={() => setSelectedUser(null)}
              >
                ×
              </button>
              <h3 className="text-xl font-bold mb-4 text-blue-700">
                Detail Pengguna
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">ID:</span> {selectedUser._id}
                </div>
                <div>
                  <span className="font-semibold">Nama:</span>
                  {selectedUser.name}
                </div>
                <div>
                  <span className="font-semibold">Email:</span>
                  {selectedUser.email}
                </div>
                <div>
                  <span className="font-semibold">Gender:</span>
                  {selectedUser.sex || selectedUser.gender}
                </div>
                <div>
                  <span className="font-semibold">Usia:</span>
                  {selectedUser.age ??
                    (selectedUser.birthdate
                      ? getAge(selectedUser.birthdate)
                      : "-")}
                </div>
                <div>
                  <span className="font-semibold">Status:</span>
                  {selectedUser.active || selectedUser.isVerified
                    ? "Aktif"
                    : "Nonaktif"}
                </div>
                <div>
                  <span className="font-semibold">Role:</span>
                  {selectedUser.role}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
