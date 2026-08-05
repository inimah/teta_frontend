import React, { useEffect, useState } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { id as idLocale } from "date-fns/locale";
import { format } from "date-fns";

const AdminMonitoringChat: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [chatSearch, setChatSearch] = useState("");
  const [chatDateFrom, setChatDateFrom] = useState("");
  const [chatDateTo, setChatDateTo] = useState("");
  const [chatMinMessages, setChatMinMessages] = useState(0);
  const [hideTest, setHideTest] = useState(true);
  const [filterUserType, setFilterUserType] = useState<"semua" | "tamu" | "user">("semua");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    axios
      .get(import.meta.env?.VITE_API_URL + "api/admin/chats", config)
      .then((res: { data: any[] }) =>
        setChatSessions(Array.isArray(res.data) ? res.data : [])
      )
      .catch((err: unknown) => console.error("Gagal memuat chat:", err));
  }, []);

  const filteredChats = chatSessions.filter((s: any) => {
    const q = chatSearch.toLowerCase();
    const displayName = s.userId?.name ?? (s.guestName || "tamu");
    const matchSearch =
      !q ||
      displayName.toLowerCase().includes(q) ||
      s.userId?.email?.toLowerCase().includes(q) ||
      s.sessionId?.toLowerCase().includes(q);

    const sessionDate = s.updatedAt ? new Date(s.updatedAt) : null;
    const matchFrom =
      !chatDateFrom ||
      (sessionDate !== null && sessionDate >= new Date(chatDateFrom + "T00:00:00"));
    const matchTo =
      !chatDateTo ||
      (sessionDate !== null && sessionDate <= new Date(chatDateTo + "T23:59:59"));

    const matchMinMsg = (s.messages?.length ?? 0) > chatMinMessages;

    const isTestSession =
      s.isTest === true ||
      s.userId?.role === "admin" ||
      (s.sessionId && s.sessionId.startsWith("test-"));
    const matchTest = !hideTest || !isTestSession;

    const matchUserType =
      filterUserType === "semua" ||
      (filterUserType === "tamu" && !s.userId) ||
      (filterUserType === "user" && !!s.userId);

    return matchSearch && matchFrom && matchTo && matchMinMsg && matchTest && matchUserType;
  });

  const uniqueUsers = new Set(
    filteredChats.map((s: any) => s.userId?._id ?? s.sessionId).filter(Boolean)
  ).size;

  const totalMessages = filteredChats.reduce(
    (sum: number, s: any) => sum + (s.messages?.length ?? 0),
    0
  );

  const avgMessages =
    filteredChats.length > 0
      ? (totalMessages / filteredChats.length).toFixed(1)
      : "0";

  const userSessionCount: Record<string, number> = {};
  filteredChats.forEach((s: any) => {
    const uid = s.userId?._id ?? s.userId;
    if (uid) userSessionCount[uid] = (userSessionCount[uid] ?? 0) + 1;
  });
  const returningUsers = Object.values(userSessionCount).filter((c) => c > 1).length;

  const deepSessions = filteredChats.filter(
    (s: any) => (s.messages?.length ?? 0) >= 5
  ).length;

  const toggleTestFlag = (id: string) => {
    const token = localStorage.getItem("authToken");
    axios
      .patch(
        import.meta.env?.VITE_API_URL + `api/admin/chats/${id}/flag`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res: { data: { isTest: boolean } }) => {
        setChatSessions((prev: any[]) =>
          prev.map((s: any) => (s._id === id ? { ...s, isTest: res.data.isTest } : s))
        );
      })
      .catch((err: unknown) => console.error("Gagal toggle flag:", err));
  };

  const dumpToJson = () => {
    const payload = filteredChats.map((s: any) => {
      const dialogue: { speaker: string; text: string }[] = [];
      (s.messages ?? []).forEach((m: any) => {
        dialogue.push({ speaker: "usr", text: m.question });
        dialogue.push({ speaker: "sys", text: m.answer });
      });
      return {
        _id: { $oid: s._id?.toString() ?? "" },
        dialog_id: s.sessionId ?? "",
        system_id: "LLM-01",
        emotion_type: "",
        topic: "",
        situation_summary: "",
        dialogue,
      };
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-dump-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Kartu ringkasan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-600">Pengguna unik</span>
          <span className="text-2xl font-bold text-blue-600">{uniqueUsers}</span>
          <span className="text-xs text-gray-600">dari {filteredChats.length} sesi</span>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-600">Rata-rata pesan/sesi</span>
          <span className="text-2xl font-bold text-indigo-600">{avgMessages}</span>
          <span className="text-xs text-gray-600">{totalMessages} pesan total</span>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-600">Pengguna berulang</span>
          <span className="text-2xl font-bold text-violet-600">{returningUsers}</span>
          <span className="text-xs text-gray-600">dengan &gt;1 sesi</span>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-600">Sesi bermakna</span>
          <span className="text-2xl font-bold text-emerald-600">{deepSessions}</span>
          <span className="text-xs text-gray-600">≥5 pesan</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow mb-8 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Cari pengguna</label>
            <input
              type="text"
              placeholder="Nama atau email..."
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Dari tanggal</label>
            <DatePicker
              selected={chatDateFrom ? new Date(chatDateFrom + "T00:00:00") : null}
              onChange={(date: Date | null) =>
                setChatDateFrom(date ? format(date, "yyyy-MM-dd") : "")
              }
              maxDate={chatDateTo ? new Date(chatDateTo + "T00:00:00") : undefined}
              dateFormat="dd/MM/yyyy"
              placeholderText="dd/mm/yyyy"
              isClearable
              locale={idLocale}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Sampai tanggal</label>
            <DatePicker
              selected={chatDateTo ? new Date(chatDateTo + "T00:00:00") : null}
              onChange={(date: Date | null) =>
                setChatDateTo(date ? format(date, "yyyy-MM-dd") : "")
              }
              minDate={chatDateFrom ? new Date(chatDateFrom + "T00:00:00") : undefined}
              dateFormat="dd/MM/yyyy"
              placeholderText="dd/mm/yyyy"
              isClearable
              locale={idLocale}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Jenis pengguna</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={filterUserType}
              onChange={(e) => setFilterUserType(e.target.value as "semua" | "tamu" | "user")}
            >
              <option value="semua">Semua</option>
              <option value="tamu">Tamu saja</option>
              <option value="user">User terdaftar</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Min. pesan</label>
            <input
              type="number"
              min={0}
              value={chatMinMessages}
              onChange={(e) =>
                setChatMinMessages(Math.max(0, parseInt(e.target.value) || 0))
              }
              className="border rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          {(chatSearch || chatDateFrom || chatDateTo || chatMinMessages !== 0 || filterUserType !== "semua") && (
            <button
              onClick={() => {
                setChatSearch("");
                setChatDateFrom("");
                setChatDateTo("");
                setChatMinMessages(0);
                setFilterUserType("semua");
              }}
              className="self-end text-xs text-gray-600 hover:text-red-500 border border-gray-200 rounded-lg px-3 py-2 transition-colors"
            >
              Reset
            </button>
          )}
          <label className="self-end flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2">
            <input
              type="checkbox"
              checked={hideTest}
              onChange={(e) => setHideTest(e.target.checked)}
              className="accent-blue-500 w-4 h-4"
            />
            Sembunyikan sesi testing
          </label>

          <div className="ml-auto flex items-end gap-2">
            <span className="text-sm text-gray-600 self-end pb-2">
              {filteredChats.length} / {chatSessions.length} sesi
            </span>
            <button
              onClick={dumpToJson}
              disabled={filteredChats.length === 0}
              className="self-end flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              ⬇ Dump JSON
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-50 text-blue-700">
              <tr>
                <th className="px-4 py-3 text-left">Pengguna</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Session ID</th>
                <th className="px-4 py-3 text-center">Pesan</th>
                <th className="px-4 py-3 text-left">Terakhir</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredChats.map((s) => {
                const isTestRow =
                  s.isTest ||
                  s.userId?.role === "admin" ||
                  s.sessionId?.startsWith("test-");
                return (
                <tr
                  key={s._id}
                  className={`border-t transition-colors ${
                    isTestRow
                      ? "bg-red-50 hover:bg-red-100"
                      : "hover:bg-blue-50/40"
                  }`}
                >
                  <td className="px-4 py-3 font-medium">
                    <span className="flex items-center gap-2">
                      {s.userId?.name ?? (
                        <span className="flex items-center gap-1">
                          {s.guestName && (
                            <span className="text-gray-800">{s.guestName}</span>
                          )}
                          <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded font-semibold">
                            Tamu
                          </span>
                        </span>
                      )}
                      {isTestRow && (
                        <span className="bg-red-100 text-red-500 text-xs px-2 py-0.5 rounded font-semibold">
                          Testing
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.userId?.email ?? "-"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {s.sessionId?.slice(0, 16)}…
                  </td>
                  <td className="px-4 py-3 text-center">{s.messages?.length ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.updatedAt
                      ? new Date(s.updatedAt).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedChat(s)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Lihat
                      </button>
                      <button
                        onClick={() => toggleTestFlag(s._id)}
                        title={s.isTest ? "Hapus flag testing" : "Tandai sebagai testing"}
                        className={`text-xs px-2 py-1.5 rounded-lg border transition-colors ${
                          s.isTest
                            ? "bg-red-100 text-red-500 border-red-300 hover:bg-red-200"
                            : "bg-white text-slate-400 border-slate-200 hover:bg-red-50 hover:text-red-400 hover:border-red-200"
                        }`}
                      >
                        🚩
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
              {filteredChats.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-600">
                    {chatSessions.length === 0
                      ? "Belum ada data chat."
                      : "Tidak ada sesi yang cocok dengan filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal detail percakapan */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <p className="font-bold text-blue-700 text-base">
                  {selectedChat.userId?.name ?? "Anonim"}
                </p>
                <p className="text-xs text-gray-600">
                  {selectedChat.userId?.email ?? "-"}
                </p>
              </div>
              <button
                onClick={() => setSelectedChat(null)}
                className="text-gray-600 hover:text-red-500 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {(selectedChat.messages ?? []).map((msg: any, i: number) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-end">
                    <div className="bg-blue-100 text-blue-900 px-3 py-2 rounded-xl rounded-tr-sm max-w-[75%] text-sm">
                      {msg.question}
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-xl rounded-tl-sm max-w-[75%] text-sm">
                      {msg.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminMonitoringChat;
