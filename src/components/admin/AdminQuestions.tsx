import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

/** ====== Tipe data ====== */
type QuestionDoc = {
  _id?: string;
  question: string;
  options: string[];
  enable: boolean;
  indicator?: string;
  order?: number; // hanya untuk display/urutan, bukan diedit
};

type ListResp = {
  status: boolean;
  page: number;
  limit: number;
  total: number;
  items: QuestionDoc[];
};

const INDICATORS = [
  "depresi",
  "kecemasan",
  "stres_akademik",
  "penarikan_sosial",
  "adhd",
  "kecanduan",
  "self_harm",
];

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const getAuth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
});

const defaultForm: QuestionDoc = {
  question: "",
  options: ["Tidak pernah", "Kadang-kadang", "Sering", "Hampir setiap hari"],
  enable: true,
  order: 0,
  indicator: "",
};

/** ===== Util: bersihkan opsi (trim, buang kosong, dedupe, max 6) ===== */
const cleanOptions = (arr: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of arr || []) {
    const s = String(raw ?? "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= 6) break;
  }
  return out;
};

/** ====== Editor opsi (tanpa nomor, kotak tidak terlalu panjang) ====== */
type OptionEditorProps = {
  value: string[];
  onChange: (opts: string[]) => void;
  label?: string;
};

const OptionEditor: React.FC<OptionEditorProps> = ({ value, onChange, label }) => {
  const opts = value?.length ? value : [];

  const update = (i: number, v: string) => {
    const next = [...opts];
    next[i] = v;
    onChange(next);
  };

  const add = () => {
    if (opts.length >= 6) {
      toast.warning("Maksimal 6 opsi jawaban");
      return;
    }
    onChange([...opts, ""]);
  };

  const removeAt = (i: number) => {
    const next = opts.filter((_, idx) => idx !== i);
    onChange(next);
  };

  return (
    <div className="max-w-[640px]"> {/* batasi lebar editor */}
      <label className="block font-semibold mb-2">
        {label || "Opsi Jawaban"}
        <span className="text-xs text-gray-500"> (min 2, max 6)</span>
      </label>

      <div className="space-y-2">
        {opts.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            {/* hilangkan penomoran */}
            <input
              className="border p-2 rounded w-full h-10 text-sm"
              value={o}
              onChange={(e) => update(i, e.target.value)}
              placeholder={`Opsi ${i + 1}`}
            />
            <button
              type="button"
              className="px-2 py-1 border rounded text-xs text-red-600 whitespace-nowrap"
              title="Hapus"
              onClick={() => removeAt(i)}
              disabled={opts.length <= 2}
            >
              Hapus
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          className="px-3 py-1.5 rounded bg-gray-100 border hover:bg-gray-200"
          onClick={add}
          disabled={opts.length >= 6}
        >
          + Tambah Opsi
        </button>
      </div>
    </div>
  );
};

const AdminQuestions: React.FC = () => {
  /** ====== List & filter ====== */
  const [items, setItems] = useState<QuestionDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search] = useState("");
  const [fEnable] = useState("");
  const [fIndicator] = useState("");
  const [total, setTotal] = useState(0);

  const params = useMemo(() => {
    const p: any = { page, limit, sort: "order" };
    if (search.trim()) p.search = search.trim();
    if (fEnable) p.enable = fEnable === "true";
    if (fIndicator) p.indicator = fIndicator;
    return p;
  }, [page, limit, search, fEnable, fIndicator]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get<ListResp>(`${API}/api/admin/questions`, {
        ...getAuth(),
        params,
      });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal memuat data");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  /** ====== Form tambah ====== */
  const [form, setForm] = useState<QuestionDoc>({
    ...defaultForm,
    options: [...defaultForm.options],
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleaned = cleanOptions(form.options || []);
    if (!form.question.trim()) return toast.warning("Pertanyaan wajib diisi");
    if (cleaned.length < 2) return toast.warning("Minimal 2 opsi jawaban");
    if (cleaned.length > 6) return toast.warning("Maksimal 6 opsi jawaban");

    try {
      await axios.post(
        `${API}/api/admin/questions`,
        {
          question: form.question.trim(),
          options: cleaned,
          enable: form.enable,
          indicator: form.indicator || undefined,
        },
        getAuth()
      );
      toast.success("Pertanyaan ditambahkan");
      setForm({ ...defaultForm, options: [...defaultForm.options] });
      setPage(1);
      fetchList();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal menambah pertanyaan");
    }
  };

  /** ====== Edit (modal) ====== */
  const [editing, setEditing] = useState<QuestionDoc | null>(null);

  const startEdit = (q: QuestionDoc) =>
    setEditing({
      ...q,
      options: q.options?.length >= 2 ? [...q.options] : [...defaultForm.options],
    });

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    const cleaned = cleanOptions(editing.options || []);
    if (cleaned.length < 2) return toast.warning("Minimal 2 opsi jawaban");
    if (cleaned.length > 6) return toast.warning("Maksimal 6 opsi jawaban");

    try {
      await axios.put(
        `${API}/api/admin/questions/${editing._id}`,
        {
          question: editing.question.trim(),
          options: cleaned,
          enable: editing.enable,
          indicator: editing.indicator || undefined,
        },
        getAuth()
      );
      toast.success("Perubahan disimpan");
      setEditing(null);
      fetchList();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal menyimpan perubahan");
    }
  };

  /** ====== Aksi baris ====== */
  const onToggle = async (id: string) => {
    try {
      await axios.patch(`${API}/api/admin/questions/${id}/toggle`, {}, getAuth());
    } catch {
      toast.error("Gagal toggle");
    } finally {
      fetchList();
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Hapus pertanyaan ini?")) return;
    try {
      await axios.delete(`${API}/api/admin/questions/${id}`, getAuth());
      toast.success("Berhasil dihapus");
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchList();
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  /** ====== UI ====== */
  return (
    <div
      className="p-0 bg-transparent w-full"
      style={{ fontFamily: "'Nunito', Arial, sans-serif" }}
    >
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="font-semibold mb-4 text-xl text-blue-700">
          Kelola Pertanyaan
        </h2>

        {/* Form tambah */}
        {!editing && (
          <form
            onSubmit={handleCreate}
            className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2">
              <label className="block font-semibold mb-1">Pertanyaan</label>
              <textarea
                className="border p-2 w-full rounded"
                rows={3}
                placeholder="Tulis pertanyaan..."
                value={form.question}
                onChange={(e) =>
                  setForm((f) => ({ ...f, question: e.target.value }))
                }
                required
              />
            </div>

            <div className="max-w-[640px]">
              <label className="block font-semibold mb-1">Indikator</label>
              <select
                className="border p-2 w-full rounded h-10 text-sm"
                value={form.indicator || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, indicator: e.target.value }))
                }
              >
                <option value="">(Tanpa indikator)</option>
                {INDICATORS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <OptionEditor
                value={form.options || []}
                onChange={(opts) => setForm((f) => ({ ...f, options: opts }))}
                label="Opsi Jawaban"
              />
            </div>

            <div className="flex items-center gap-6 max-w-[640px]">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.enable}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, enable: e.target.checked }))
                  }
                />
                <span className="font-semibold">Enable</span>
              </label>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded font-semibold hover:bg-blue-600 transition"
              >
                Tambah Pertanyaan
              </button>
            </div>
          </form>
        )}

        {/* Modal edit */}
        {editing && (
          <div className="fixed inset-0 bg-gradient-to-br from-black/40 to-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative flex flex-col max-h-[90vh]">
              <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-2xl flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Edit Pertanyaan</h3>
                <button
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all duration-200 hover:rotate-90"
                  onClick={() => setEditing(null)}
                  aria-label="Tutup"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto px-6 py-4 flex-1">
                <form onSubmit={submitEdit} className="space-y-4">
                  <div className="max-w-[640px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Pertanyaan
                    </label>
                    <textarea
                      className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 w-full rounded-xl transition-all duration-200 bg-gray-50 focus:bg-white"
                      rows={3}
                      value={editing.question}
                      onChange={(e) =>
                        setEditing({ ...editing, question: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="max-w-[640px]">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Indikator
                      </label>
                      <select
                        className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-2 w-full rounded-xl transition-all duration-200 bg-gray-50 h-10 text-sm"
                        value={editing.indicator || ""}
                        onChange={(e) =>
                          setEditing({ ...editing, indicator: e.target.value })
                        }
                      >
                        <option value="">(Tanpa indikator)</option>
                        {INDICATORS.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <OptionEditor
                    value={editing.options || []}
                    onChange={(opts) => setEditing({ ...editing, options: opts })}
                    label="Opsi Jawaban"
                  />

                  {/* Preview */}
                  <div className="max-w-[640px]">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      Preview
                    </label>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 overflow-hidden">
                      <div className="p-4 border-b border-blue-100 bg-blue-100/50">
                        <h4 className="font-semibold text-gray-800">
                          {editing.question || "—"}
                        </h4>
                        <div className="text-xs text-gray-500 mt-1">
                          Indikator: {editing.indicator || "-"} | Urutan:{" "}
                          {editing.order}
                        </div>
                      </div>
                      <div className="p-4 text-gray-700 text-sm space-y-1">
                        {(cleanOptions(editing.options || [])).map((o, i) => (
                          <div key={i}>• {o}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 pb-1 bg-white sticky bottom-0 z-10">
                    <button
                      type="button"
                      className="bg-gray-200 px-4 py-2 rounded"
                      onClick={() => setEditing(null)}
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

              <div className="px-6 py-2 text-xs text-gray-400 bg-white rounded-b-2xl border-t border-gray-100">
                Terakhir diubah: {new Date().toLocaleDateString("id-ID")}
              </div>
            </div>
          </div>
        )}

        {/* ====== Tabel ====== */}
        <h3 className="font-semibold mb-2 text-lg">Daftar Pertanyaan</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-blue-500 text-white font-semibold">
                <th className="py-3 px-4">Pertanyaan</th>
                <th className="py-3 px-4">Indikator</th>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4 w-56">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    Memuat…
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((q, idx) => (
                  <tr
                    key={q._id}
                    className={`transition ${idx % 2 === 0 ? "bg-white" : "bg-blue-50"}`}
                  >
                    <td className="py-2 px-4">
                      <div className="font-semibold line-clamp-3">{q.question}</div>
                      {q.options?.length ? (
                        <div className="text-xs text-gray-500 mt-1">
                          Opsi: {q.options.join(" | ")}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-2 px-4">{q.indicator || "-"}</td>
                    <td className="py-2 px-4">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-sm font-semibold">
                        {q.order ?? "-"}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex gap-2 items-center">
                          <button
                            className="p-2 rounded transition-colors hover:bg-yellow-50"
                            title="Edit"
                            onClick={() => startEdit(q)}
                          >
                            <svg width="20" height="20" fill="#F59E0B" viewBox="0 0 24 24">
                              <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                            </svg>
                          </button>
                          <button
                            className="p-2 rounded transition-colors hover:bg-red-50"
                            title="Hapus"
                            onClick={() => onDelete(q._id!)}
                          >
                            <svg width="22" height="22" fill="#EF4444" viewBox="0 0 24 24">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                          </button>
                        </div>

                        <button
                          onClick={() => onToggle(q._id!)}
                          className="relative w-16 h-8 rounded-full transition-colors duration-300 outline-none border-2 flex items-center"
                          style={{
                            minWidth: 64,
                            backgroundColor: q.enable ? "#22C55E" : "#EF4444",
                            borderColor: q.enable ? "#16A34A" : "#DC2626",
                          }}
                          aria-label={`Toggle ${q.enable ? "on" : "off"}`}
                          title="Aktif/Nonaktifkan"
                        >
                          <span
                            className={`absolute left-2 text-xs font-bold z-10 ${q.enable ? "text-white opacity-100" : "text-white opacity-50"
                              }`}
                          >
                            ON
                          </span>
                          <span
                            className={`absolute right-2 text-xs font-bold z-10 ${!q.enable ? "text-white opacity-100" : "text-white opacity-50"
                              }`}
                          >
                            OFF
                          </span>
                          <span
                            className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 z-20 ${q.enable ? "translate-x-8" : "translate-x-0"
                              }`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-2 mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Halaman <b>{page}</b> / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
          <span className="ml-auto text-sm text-gray-500">
            Total: <b>{total}</b> pertanyaan
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminQuestions;
