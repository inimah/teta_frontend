import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

/** ====== Types ====== */
type Kategori = "relaksasi" | "panduan_pernapasan";

type TrackDoc = {
  _id?: string;
  id?: string;
  judul_mp3: string;   // path relatif, contoh: "relaksasi/xxx.mp3" atau "pernafasan/xxx.mp3"
  judul_lagu: string;
  enabled: boolean;
  kategori?: Kategori;
  createdAt?: string;
  updatedAt?: string;

  // dari API admin
  relPath?: string;
  fileExists?: boolean;
  publicSrc?: string | null;
};

type ListResp = {
  status: boolean;
  page: number;
  limit: number;
  total: number;
  items: TrackDoc[];
};

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const getAuth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
});

const defaultForm: TrackDoc = {
  judul_mp3: "",
  judul_lagu: "",
  enabled: true,
  kategori: "relaksasi",
};

const AdminRelaxTracks: React.FC = () => {
  /** ====== State list ====== */
  const [items, setItems] = useState<TrackDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);                  // read-only, tombol pilihan halaman dihilangkan
  const [total, setTotal] = useState(0);

  /** ====== Filters ====== */
  const [search, setSearch] = useState("");
  const [fEnabled] = useState("");               // read-only (filter status dihilangkan)
  const [fKategori] = useState<"" | Kategori>(""); // read-only (filter kategori dihilangkan)

  /** === Debounce untuk search agar UI tidak bergeser saat mengetik === */
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const params = useMemo(() => {
    const p: any = { page, limit, sort: "-updatedAt" };
    if (debouncedSearch) p.search = debouncedSearch;
    if (fEnabled) p.enabled = fEnabled === "true";
    if (fKategori) p.kategori = fKategori;
    return p;
  }, [page, limit, debouncedSearch, fEnabled, fKategori]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get<ListResp>(`${API}/api/admin/relax-tracks`, {
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
  }, [page, limit, debouncedSearch, fEnabled, fKategori]);

  /** ====== Form create & edit ====== */
  const [form, setForm] = useState<TrackDoc>(defaultForm);
  const [editing, setEditing] = useState<TrackDoc | null>(null);

  /** ====== Tambahan untuk Edit: simpan kategori awal & map subfolder ====== */
  const [editingOrigKategori, setEditingOrigKategori] = useState<Kategori | null>(null);
  const SUBDIRS: Record<Kategori, string> = {
    relaksasi: "relaksasi",
    panduan_pernapasan: "pernafasan",
  };

  /** ====== Upload state & helpers (UI) ====== */
  const [uploading, setUploading] = useState(false);
  const [pickedName, setPickedName] = useState<string>("");
  const [pickedSize, setPickedSize] = useState<number | null>(null);

  const formatBytes = (n?: number | null) => {
    if (!n && n !== 0) return "";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    let size = n!;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(size < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
  };

  // Upload -> kembalikan path relatif, simpan ke subfolder berdasar kategori
  const handleUpload = async (
    file: File,
    kategori: Kategori = "relaksasi"
  ): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const { data } = await axios.post(
        `${API}/api/admin/relax-tracks/upload?kategori=${encodeURIComponent(kategori)}`,
        fd,
        { ...getAuth() }
      );
      if (data?.status && data?.filename) {
        toast.success("Upload berhasil");
        return data.filename as string;
      }
      toast.error("Upload gagal");
      return null;
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Upload gagal");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.judul_mp3.trim())
      return toast.warning("Silakan upload berkas MP3 terlebih dahulu");
    if (!form.judul_lagu.trim())
      return toast.warning("Judul audio wajib diisi");

    try {
      await axios.post(
        `${API}/api/admin/relax-tracks`,
        {
          judul_lagu: form.judul_lagu.trim(),
          judul_mp3: form.judul_mp3.trim(),
          enabled: form.enabled,
          kategori: form.kategori || "relaksasi",
        },
        getAuth()
      );
      toast.success("Audio ditambahkan");
      setForm(defaultForm);
      setPickedName("");
      setPickedSize(null);
      setPage(1);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal menambah audio");
    }
  };

  const startEdit = (t: TrackDoc) => {
    setPickedName("");
    setPickedSize(null);
    const kat = (t.kategori as Kategori) || "relaksasi";
    setEditing({
      ...t,
      judul_mp3: t.relPath || t.judul_mp3,
      kategori: kat,
    });
    setEditingOrigKategori(kat); // simpan kategori awal untuk validasi
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    // VALIDASI: jika kategori diubah, pastikan path sudah sesuai subfolder kategori baru
    const kategoriBaru: Kategori = editing.kategori || "relaksasi";
    const subdirBaru = SUBDIRS[kategoriBaru];
    const kategoriBerubah = editingOrigKategori && kategoriBaru !== editingOrigKategori;

    if (kategoriBerubah) {
      const pathOk =
        typeof editing.judul_mp3 === "string" &&
        editing.judul_mp3.startsWith(`${subdirBaru}/`);
      if (!pathOk) {
        toast.warning(
          "Kategori diubah. Silakan upload ulang MP3 agar disimpan ke folder yang sesuai."
        );
        return;
      }
    }

    try {
      await axios.put(
        `${API}/api/admin/relax-tracks/${editing._id || editing.id}`,
        {
          judul_mp3: editing.judul_mp3.trim(),
          judul_lagu: editing.judul_lagu.trim(),
          enabled: Boolean(editing.enabled),
          kategori: kategoriBaru,
        },
        getAuth()
      );
      toast.success("Perubahan disimpan");
      setEditing(null);
      setEditingOrigKategori(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Gagal menyimpan perubahan");
    }
  };

  /** ====== Row actions ====== */

  // state untuk menandai toggle yang sedang diproses (disable tombol)
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  const onToggle = async (id: string) => {
    if (!id) return;

    // Cari index item yang akan diubah
    const idx = items.findIndex((it) => it._id === id || it.id === id);
    if (idx === -1) return;

    // Optimistic update: flip di UI dulu, kunci tombol (tanpa refetch → anti flicker)
    setToggling((m) => ({ ...m, [id]: true }));
    setItems((prev) => {
      const next = [...prev];
      const target = { ...next[idx] };
      target.enabled = !target.enabled;
      next[idx] = target;
      return next;
    });

    try {
      const { data } = await axios.patch(
        `${API}/api/admin/relax-tracks/${id}/toggle`,
        {},
        getAuth()
      );
      // Sinkronkan dengan respons server (kalau mau lebih pasti)
      if (data?.status && data?.track) {
        setItems((prev) => {
          const next = [...prev];
          const i = next.findIndex((it) => it._id === id || it.id === id);
          if (i !== -1) {
            // gunakan enabled & updatedAt dari server; properti lain tetap
            next[i] = {
              ...next[i],
              enabled: !!data.track.enabled,
              updatedAt: data.track.updatedAt ?? next[i].updatedAt,
            };
          }
          return next;
        });
      }
    } catch (e) {
      // Revert bila gagal
      setItems((prev) => {
        const next = [...prev];
        const target = { ...next[idx] };
        target.enabled = !target.enabled;
        next[idx] = target;
        return next;
      });
      toast.error("Gagal toggle");
    } finally {
      setToggling((m) => {
        const n = { ...m };
        delete n[id];
        return n;
      });
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Hapus audio ini secara permanen?")) return;
    try {
      await axios.delete(`${API}/api/admin/relax-tracks/${id}`, getAuth());
      toast.success("Berhasil dihapus");
      if (items.length === 1 && page > 1) setPage((p) => Math.max(1, p - 1));
      else fetchList();
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  /** ====== UI ====== */
  return (
    <div className="p-0 bg-transparent w-full">
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="font-semibold mb-4 text-xl text-blue-700">Kelola Audio</h2>

        {/* Form tambah: upload dulu baru judul */}
        {!editing && (
          <form onSubmit={handleCreate} className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload MP3 */}
            <div className="md:col-span-2">
              <label className="block font-semibold mb-2">Upload MP3</label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M16 12l-4-4m0 0l-4 4m4-4v12" />
                  </svg>
                  <span>Pilih file</span>
                  <input
                    type="file"
                    accept=".mp3,audio/mpeg"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0]; if (!f) return;
                      setPickedName(f.name); setPickedSize(f.size);
                      const uploaded = await handleUpload(f, form.kategori || "relaksasi");
                      if (uploaded) setForm((prev) => ({ ...prev, judul_mp3: uploaded }));
                    }}
                  />
                </label>

                {(pickedName || uploading) && (
                  <div className="text-sm text-gray-700 truncate max-w-[46ch]">
                    {pickedName ? <strong className="font-medium">{pickedName}</strong> : "—"}
                    {pickedSize !== null && <span className="text-gray-500"> ({formatBytes(pickedSize)})</span>}
                    {uploading && <span className="ml-2 text-xs text-gray-500 animate-pulse">mengunggah…</span>}
                  </div>
                )}

                {form.judul_mp3 && !uploading && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Tersimpan: {form.judul_mp3}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">Format MP3, maks 50 MB. Setelah upload, path terisi otomatis.</p>
            </div>

            {/* Audio (judul) – disabled sampai file ada */}
            <div>
              <label className="block font-semibold mb-1">Audio</label>
              <input
                type="text"
                className="border p-2 w-full rounded disabled:bg-gray-100"
                placeholder="Contoh: Hujan Malam"
                value={form.judul_lagu}
                onChange={(e) => setForm((f) => ({ ...f, judul_lagu: e.target.value }))}
                disabled={!form.judul_mp3}
                required
              />
              {/* {!form.judul_mp3 && (
                <p className="text-xs text-amber-600 mt-1">Upload MP3 terlebih dahulu untuk mengisi judul.</p>
              )} */}
            </div>

            {/* Kategori */}
            <div>
              <label className="block font-semibold mb-1">Kategori</label>
              <select
                className="border p-2 w-full rounded"
                value={form.kategori || "relaksasi"}
                onChange={(e) => {
                  const next = e.target.value as Kategori;
                  setForm((f) => {
                    if (f.judul_mp3) {
                      toast.info("Kategori diubah. Silakan upload ulang file agar disimpan ke folder yang sesuai.");
                    }
                    return { ...f, kategori: next, judul_mp3: "" };
                  });
                  setPickedName("");
                  setPickedSize(null);
                }}
              >
                <option value="relaksasi">Relaksasi</option>
                <option value="panduan_pernapasan">Panduan Pernapasan</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                />
                <span className="font-semibold">Enable</span>
              </label>
              <button type="submit" className="ml-auto bg-blue-500 text-white px-6 py-2 rounded font-semibold hover:bg-blue-600 transition">
                Tambah Audio
              </button>
            </div>
          </form>
        )}

        {/* Modal edit */}
        {editing && (
          <div className="fixed inset-0 bg-gradient-to-br from-black/40 to-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-2xl flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Edit Audio</h3>
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

              {/* Body */}
              <div className="overflow-y-auto px-6 py-4 flex-1">
                <form onSubmit={submitEdit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Judul Audio
                    </label>
                    <input
                      className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 w-full rounded-xl bg-gray-50 focus:bg-white"
                      value={editing.judul_lagu}
                      onChange={(e) => setEditing({ ...editing, judul_lagu: e.target.value })}
                      required
                    />
                  </div>

                  {/* Kategori (Edit) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Kategori
                    </label>
                    <select
                      className="border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 w-full rounded-xl bg-gray-50 focus:bg-white"
                      value={editing.kategori || "relaksasi"}
                      onChange={(e) => {
                        const next = e.target.value as Kategori;
                        setEditing((prev) =>
                          prev ? { ...prev, kategori: next, judul_mp3: "" } : prev
                        );
                        setPickedName("");
                        setPickedSize(null);
                        toast.info("Kategori diubah. Silakan upload ulang MP3 agar disimpan ke folder yang sesuai.");
                      }}
                    >
                      <option value="relaksasi">Relaksasi</option>
                      <option value="panduan_pernapasan">Panduan Pernapasan</option>
                    </select>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Mengubah kategori memerlukan upload ulang agar file berpindah ke folder <code>{`/audio/${SUBDIRS[editing.kategori || "relaksasi"]}/`}</code>.
                    </p>
                  </div>

                  {/* Tampilkan path aktif saat ini */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      File MP3 saat ini
                    </label>
                    <div className="text-xs text-gray-700 break-all border rounded-lg px-3 py-2 bg-gray-50">
                      {editing.judul_mp3 || "—"}
                    </div>

                    {/* Upload pengganti file di modal edit */}
                    <div className="mt-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Upload MP3 (ganti file)
                      </label>

                      <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M16 12l-4-4m0 0l-4 4m4-4v12" />
                          </svg>
                          <span>Pilih file</span>
                          <input
                            type="file"
                            accept=".mp3,audio/mpeg"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              setPickedName(f.name);
                              setPickedSize(f.size);
                              const uploaded = await handleUpload(f, editing.kategori || "relaksasi");
                              if (uploaded) {
                                setEditing((prev) => (prev ? { ...prev, judul_mp3: uploaded } : prev));
                              }
                            }}
                          />
                        </label>

                        {(pickedName || uploading) && (
                          <div className="text-xs text-gray-700 truncate max-w-[46ch]">
                            {pickedName ? <strong>{pickedName}</strong> : "—"}
                            {pickedSize !== null && <span className="text-gray-500"> ({formatBytes(pickedSize)})</span>}
                            {uploading && <span className="ml-2 text-[11px] text-gray-500 animate-pulse">mengunggah…</span>}
                          </div>
                        )}

                        {editing?.judul_mp3 && !uploading && (
                          <span className="text-[11px] bg-green-100 text-green-700 px-2 py-1 rounded">
                            Tersimpan: {editing.judul_mp3}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-500 mt-2">
                        File baru akan mengganti path MP3 saat kamu menekan <b>Simpan Perubahan</b>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!editing.enabled}
                        onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
                      />
                      <span className="font-semibold">Enable</span>
                    </label>
                  </div>

                  {/* Preview ringkas */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 overflow-hidden">
                    <div className="p-4 border-b border-blue-100 bg-blue-100/50">
                      <h4 className="font-semibold text-gray-800">{editing.judul_lagu || "—"}</h4>
                      <div className="text-xs text-gray-500 mt-1">
                        File: {editing.judul_mp3 || "-"}
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

        {/* Filter & Search */}
        <h3 className="font-semibold mb-2 text-lg">Daftar Audio</h3>
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <input
            type="text"
            placeholder="Cari audio atau nama file…"
            className="border rounded px-3 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setPage(1); } }}
          />

          <button
            onClick={() => { setPage(1); }}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
          >
            Search
          </button>

          {/* Kembali ke semua audio */}
          <button
            onClick={() => { setSearch(""); setPage(1); }}
            className="bg-gray-200 px-4 py-2 rounded text-sm"
          >
            Tampilkan Semua
          </button>

          <button onClick={() => fetchList()} className="ml-auto bg-gray-100 px-4 py-2 rounded">
            Refresh
          </button>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto">
          <table className="w-full text-left rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-blue-500 text-white font-semibold">
                <th className="py-3 px-4">Audio</th>
                <th className="py-3 px-4">File</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Updated</th>
                <th className="py-3 px-4 w-56">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-gray-500">Tidak ada data</td></tr>
              )}
              {loading && (
                <tr><td colSpan={5} className="py-6 text-center text-gray-500">Memuat…</td></tr>
              )}
              {!loading && items.map((t, idx) => {
                const id = t._id || t.id || "";
                const toggleBusy = toggling[id] === true;
                return (
                  <tr key={id} className={`transition ${idx % 2 === 0 ? "bg-white" : "bg-blue-50"}`}>
                    <td className="py-2 px-4 font-semibold">{t.judul_lagu}</td>
                    <td className="py-2 px-4">
                      <div className="text-xs break-all">{t.relPath || t.judul_mp3}</div>
                      {t.publicSrc && (
                        <a href={t.publicSrc} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">
                          Buka
                        </a>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                        {t.kategori === "panduan_pernapasan" ? "Panduan Pernapasan" : "Relaksasi"}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-xs">
                      {t.updatedAt ? new Date(t.updatedAt).toLocaleString("id-ID") : "-"}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex gap-2 items-center">
                          <button className="p-2 rounded transition-colors hover:bg-yellow-50" title="Edit" onClick={() => startEdit(t)}>
                            <svg width="20" height="20" fill="#F59E0B" viewBox="0 0 24 24">
                              <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                            </svg>
                          </button>
                          <button className="p-2 rounded transition-colors hover:bg-red-50" title="Hapus" onClick={() => onDelete(id)}>
                            <svg width="22" height="22" fill="#EF4444" viewBox="0 0 24 24">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                          </button>
                        </div>
                        {/* Toggle */}
                        <button
                          onClick={() => onToggle(id)}
                          disabled={toggleBusy}
                          className={`relative w-16 h-8 rounded-full outline-none border-2 flex items-center transition-colors duration-300 ${toggleBusy ? "opacity-60 cursor-not-allowed" : ""}`}
                          style={{
                            minWidth: 64,
                            backgroundColor: t.enabled ? "#22C55E" : "#EF4444",
                            borderColor: t.enabled ? "#16A34A" : "#DC2626",
                          }}
                          title={toggleBusy ? "Memproses..." : "Aktif/Nonaktifkan"}
                          aria-label={`Toggle ${t.enabled ? "on" : "off"}`}
                          aria-disabled={toggleBusy}
                        >
                          <span className={`absolute left-2 text-xs font-bold z-10 ${t.enabled ? "text-white opacity-100" : "text-white opacity-50"}`}>ON</span>
                          <span className={`absolute right-2 text-xs font-bold z-10 ${!t.enabled ? "text-white opacity-100" : "text-white opacity-50"}`}>OFF</span>
                          <span className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 z-20 ${t.enabled ? "translate-x-8" : "translate-x-0"}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <span>Halaman <b>{page}</b> / {Math.max(1, Math.ceil(total / limit))}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          <span className="ml-auto text-sm text-gray-500">Total: <b>{total}</b> audio</span>
        </div>
      </div>
    </div>
  );
};

export default AdminRelaxTracks;
