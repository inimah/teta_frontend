import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";

/** ===== Types ===== */
type PretestRule = {
  _id?: string;
  basis?: "total";
  min?: number;
  max?: number;
  text: string;
  order?: number;
  active?: boolean;
};

type ListResp = {
  status: boolean;
  items: PretestRule[];
};

const getAuth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
});

/** Default form (tanpa toggle Active di form create & edit) */
const defaultForm: PretestRule = {
  min: undefined,
  max: undefined,
  text: "",
  order: undefined,
  basis: "total",
};

const toNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

// NEW: helper overlap lokal (inklusif)
const isOverlap = (a: {min:number; max:number}, b: {min:number; max:number}) =>
  Math.max(a.min, b.min) <= Math.min(a.max, b.max);

// NEW: validasi overlap terhadap items aktif lain
function hasOverlapLocal(
  items: PretestRule[],
  candidate: { min: number; max: number },
  ignoreId?: string
) {
  const actives = items.filter(it => it.active !== false); // treat undefined as active
  const bentrok = actives.find((r) => {
    if (ignoreId && r._id === ignoreId) return false;
    if (typeof r.min !== "number" || typeof r.max !== "number") return false;
    return isOverlap({min: r.min, max: r.max}, candidate);
  });
  return bentrok;
}

const AdminPretestRules: React.FC = () => {
  const [items, setItems] = useState<PretestRule[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get<ListResp>("/api/admin/pretest/rules", getAuth());
      const list = Array.isArray(data.items) ? data.items : [];
      // NEW: sort defensif (order asc, lalu min asc)
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.min ?? 0) - (b.min ?? 0));
      setItems(list);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal memuat rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  /** ===== Create ===== */
  const [form, setForm] = useState<PretestRule>({ ...defaultForm });
  const [submittingCreate, setSubmittingCreate] = useState(false); // NEW

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingCreate) return; // NEW: cegah double submit

    const min = toNum(form.min);
    const max = toNum(form.max);
    const text = String(form.text || "").trim();

    if (!text) return toast.warning("Teks interpretasi wajib diisi");
    if (min === undefined || max === undefined) return toast.warning("Min/Max wajib diisi");
    if (min > max) return toast.warning("Min tidak boleh > Max");

    // NEW: cek overlap lokal dulu (UX cepat)
    const bentrok = hasOverlapLocal(items, { min, max });
    if (bentrok) {
      return toast.error(`Range bentrok dengan [${bentrok.min}–${bentrok.max}]`);
    }

    try {
      setSubmittingCreate(true);
      await axios.post(
        "/api/admin/pretest/rules",
        { min, max, text, basis: "total" },
        getAuth()
      );
      toast.success("Rule ditambahkan");
      setForm({ ...defaultForm });
      fetchList();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal menambah rule");
    } finally {
      setSubmittingCreate(false);
    }
  };

  /** ===== Edit ===== */
  const [editing, setEditing] = useState<PretestRule | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false); // NEW
  const startEdit = (r: PretestRule) => setEditing({ ...r });

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || submittingEdit) return;

    const min = toNum(editing.min);
    const max = toNum(editing.max);
    const text = String(editing.text || "").trim();

    if (!text) return toast.warning("Teks interpretasi wajib diisi");
    if (min === undefined || max === undefined) return toast.warning("Min/Max wajib diisi");
    if (min > max) return toast.warning("Min tidak boleh > Max");

    // NEW: cek overlap lokal (abaikan diri sendiri)
    const bentrok = hasOverlapLocal(items, { min, max }, editing._id);
    if (bentrok) {
      return toast.error(`Range bentrok dengan [${bentrok.min}–${bentrok.max}]`);
    }

    try {
      setSubmittingEdit(true);
      await axios.patch(
        `/api/admin/pretest/rules/${editing._id}`,
        { min, max, text },
        getAuth()
      );
      toast.success("Perubahan disimpan");
      setEditing(null);
      fetchList();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal menyimpan perubahan");
    } finally {
      setSubmittingEdit(false);
    }
  };

  /** ===== Delete & Toggle ===== */
  const onDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Hapus rule ini?")) return;
    try {
      await axios.delete(`/api/admin/pretest/rules/${id}`, getAuth());
      toast.success("Berhasil dihapus");
      fetchList();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal menghapus");
    }
  };

  const onToggle = async (id?: string, current?: boolean) => {
    if (!id) return;
    try {
      await axios.patch(`/api/admin/pretest/rules/${id}`, { active: !current }, getAuth());
      fetchList();
    } catch {
      toast.error("Gagal toggle");
    }
  };

  // NEW: info apakah ada overlap antar item aktif (indikasi cepat untuk admin)
  const overlaps = useMemo(() => {
    const actives = items.filter(it => it.active !== false);
    const badPairs: Array<[PretestRule, PretestRule]> = [];
    for (let i = 0; i < actives.length; i++) {
      for (let j = i + 1; j < actives.length; j++) {
        const A = actives[i], B = actives[j];
        if (typeof A.min !== "number" || typeof A.max !== "number") continue;
        if (typeof B.min !== "number" || typeof B.max !== "number") continue;
        if (isOverlap({min: A.min, max: A.max}, {min: B.min, max: B.max})) {
          badPairs.push([A, B]);
        }
      }
    }
    return badPairs;
  }, [items]);

  return (
    <div className="p-0 bg-transparent w-full" style={{ fontFamily: "'Nunito', Arial, sans-serif" }}>
      <style>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-xl text-blue-700">Pretest Rules (Interpretasi Skor)</h2>
        </div>

        {/* Alert overlap (opsional) */}
        {overlaps.length > 0 && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
            Terdeteksi tumpang tindih rentang aktif. Mohon periksa kembali konfigurasi.
          </div>
        )}

        {/* Create form */}
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-1">Min</label>
            <input
              type="number"
              className="border p-2 w-full rounded"
              value={form.min !== undefined && form.min !== null ? String(form.min) : ""}
              onChange={(e) =>
                setForm({ ...form, min: e.target.value === "" ? undefined : Number(e.target.value) })
              }
              required
              placeholder="Min"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Max</label>
            <input
              type="number"
              className="border p-2 w-full rounded"
              value={form.max !== undefined && form.max !== null ? String(form.max) : ""}
              onChange={(e) =>
                setForm({ ...form, max: e.target.value === "" ? undefined : Number(e.target.value) })
              }
              required
              placeholder="Max"
              inputMode="numeric"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-semibold mb-1">Teks Interpretasi</label>
            <input
              type="text"
              className="border p-2 w-full rounded"
              placeholder="Isi interpretasi…"
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              required
            />
          </div>

          <div className="md:col-span-6 flex justify-end">
            <button
              type="submit"
              disabled={submittingCreate}
              className="bg-blue-500 text-white px-6 py-2 rounded font-semibold hover:bg-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submittingCreate ? "Menambah..." : "Tambah Rule"}
            </button>
          </div>
        </form>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-blue-500 text-white font-semibold">
                <th className="py-3 px-4">Min</th>
                <th className="py-3 px-4">Max</th>
                <th className="py-3 px-4">Interpretasi</th>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4 w-56">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 && (
                <tr>
                  <td className="py-6 text-center text-gray-500" colSpan={5}>Tidak ada data</td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="py-6 text-center text-gray-500" colSpan={5}>Memuat…</td>
                </tr>
              )}
              {!loading && items.map((r, idx) => (
                <tr key={r._id || idx} className={`transition ${idx % 2 === 0 ? "bg-white" : "bg-blue-50"}`}>
                  <td className="py-2 px-4">{r.min}</td>
                  <td className="py-2 px-4">{r.max}</td>
                  <td className="py-2 px-4">{r.text}</td>
                  <td className="py-2 px-4">{r.order ?? 0}</td>
                  <td className="py-2 px-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex gap-2 items-center">
                        <button
                          className="p-2 rounded transition-colors hover:bg-yellow-50"
                          title="Edit"
                          onClick={() => startEdit(r)}
                        >
                          <svg width="20" height="20" fill="#F59E0B" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                          </svg>
                        </button>
                        <button
                          className="p-2 rounded transition-colors hover:bg-red-50"
                          title="Hapus"
                          onClick={() => onDelete(r._id!)}
                        >
                          <svg width="22" height="22" fill="#EF4444" viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                          </svg>
                        </button>
                      </div>

                      {/* Toggle hanya di tabel */}
                      <button
                        onClick={() => onToggle(r._id!, r.active)}
                        className="relative w-16 h-8 rounded-full transition-colors duration-300 outline-none border-2 flex items-center"
                        style={{
                          minWidth: 64,
                          backgroundColor: r.active === false ? "#EF4444" : "#22C55E",
                          borderColor: r.active === false ? "#DC2626" : "#16A34A",
                        }}
                        aria-label={`Toggle ${r.active === false ? "off" : "on"}`}
                        title="Aktif/Nonaktifkan"
                      >
                        <span className={`absolute left-2 text-xs font-bold z-10 ${r.active === false ? "text-white opacity-50" : "text-white opacity-100"}`}>ON</span>
                        <span className={`absolute right-2 text-xs font-bold z-10 ${r.active === false ? "text-white opacity-100" : "text-white opacity-50"}`}>OFF</span>
                        <span className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 z-20 ${r.active === false ? "translate-x-0" : "translate-x-8"}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit modal — teks interpretasi DIPERPANJANG */}
        {editing && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
                <h3 className="text-lg font-bold">Edit Pretest Rule</h3>
                <button onClick={() => setEditing(null)} className="text-white/80 hover:text-white">✕</button>
              </div>

              {/* Perubahan di sini: grid 8 kolom, Interpretasi span 6 */}
              <form onSubmit={submitEdit} className="p-6 grid grid-cols-1 md:grid-cols-8 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold mb-1">Min</label>
                  <input
                    type="number"
                    className="border p-2 w-full rounded"
                    value={editing.min !== undefined && editing.min !== null ? String(editing.min) : ""}
                    onChange={(e) =>
                      setEditing({ ...editing, min: e.target.value === "" ? undefined : Number(e.target.value) })
                    }
                    required
                    inputMode="numeric"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold mb-1">Max</label>
                  <input
                    type="number"
                    className="border p-2 w-full rounded"
                    value={editing.max !== undefined && editing.max !== null ? String(editing.max) : ""}
                    onChange={(e) =>
                      setEditing({ ...editing, max: e.target.value === "" ? undefined : Number(e.target.value) })
                    }
                    required
                    inputMode="numeric"
                  />
                </div>
                <div className="md:col-span-6">
                  <label className="block text-sm font-semibold mb-1">Teks Interpretasi</label>
                  <input
                    type="text"
                    className="border p-2 w-full rounded"
                    value={editing.text}
                    onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                    required
                  />
                </div>

                <div className="md:col-span-8 flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded bg-gray-200">Batal</button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submittingEdit ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPretestRules;
