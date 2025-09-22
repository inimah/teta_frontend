import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeftIcon,
  HeartIcon,
  BookOpenIcon,
  MusicalNoteIcon,
  BoltIcon,
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  ArrowPathIcon, // NEW: refresh icon for "Ulangi"
} from "@heroicons/react/24/outline";

/**
 * Relaksasi.tsx — Zen Glass UI + Playlist Musik
 * - Query: /relaksasi?tech=478|musik|mindfulness|pmr
 * - Persist: volume, teknik terakhir, dan track musik terakhir
 */

// ===== Config API =====
const API_BASE = window.location.origin;

// ---- Types ----
type Technique = {
  id: string;
  title: string;
  description: string;
  minutes: number;
  icon: "heart" | "book" | "note" | "bolt";
  track: string;
  pattern?: number[];
  stages?: string[];
  color: "yellow" | "pink" | "red" | "teal" | "green" | "blue";
};

type Track = { id: string; title: string; src: string };

// ---- Data ----
const TECHNIQUES: Technique[] = [
  {
    id: "musik",
    title: "Musik Relaksasi",
    description: "Dengarkan latar musik menenangkan saat jeda.",
    minutes: 5,
    icon: "note",
    // fallback jika playlist dari API kosong
    track: "/audio/Aylex - Sounds of Nature (freetouse.com).mp3",
    color: "red",
  },
];

// util: format detik → mm:ss
const toMMSS = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

// mapping kelas bg icon bulat seperti di Eksplorasi
const COLOR_MAP: Record<Technique["color"], string> = {
  yellow: "eksplorasi-icon-bg-yellow",
  pink: "eksplorasi-icon-bg-pink",
  red: "eksplorasi-icon-bg-red",
  teal: "eksplorasi-icon-bg-teal",
  green: "eksplorasi-icon-bg-green",
  blue: "eksplorasi-icon-bg-blue",
};

// warna ring per teknik
const RING_HEX: Record<Technique["color"], string> = {
  yellow: "#f59e0b",
  pink: "#ec4899",
  red: "#ef4444",
  teal: "#10b981",
  green: "#22c55e",
  blue: "#3b82f6",
};

const LS_VOLUME_KEY = "relax_volume";
const LS_LAST_TECH = "relax_last_tech";
const LS_LAST_TRACK = "relax_last_track";

export default function Relaksasi() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [selected, setSelected] = useState<Technique | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [length, setLength] = useState(0);
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem(LS_VOLUME_KEY);
    return saved ? Math.min(100, Math.max(0, Number(saved))) : 70;
  });
  const [stageLabel, setStageLabel] = useState<string | null>(null);

  // === State playlist dari API
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [tracksErr, setTracksErr] = useState<string | null>(null);

  // index track aktif
  const [trackIdx, setTrackIdx] = useState<number>(() => {
    const saved = localStorage.getItem(LS_LAST_TRACK);
    return saved ? Number(saved) : 0;
  });
  useEffect(() => {
    localStorage.setItem(LS_LAST_TRACK, String(trackIdx));
  }, [trackIdx]);

  // Fetch playlist dari backend
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingTracks(true);
        const r = await fetch(`${API_BASE}/api/relax-tracks`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = await r.json();
        const data: Track[] = Array.isArray(json?.tracks) ? json.tracks : [];
        if (!alive) return;
        setTracks(data);
        setTrackIdx((i) => Math.max(0, Math.min(i, Math.max(0, data.length - 1))));
        setTracksErr(null);
      } catch (e: any) {
        if (!alive) return;
        setTracks([]);
        setTracksErr(e?.message || "Gagal memuat playlist");
      } finally {
        if (alive) setLoadingTracks(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // pilih teknik dari query/last
  useEffect(() => {
    const q = params.get("tech");
    const fromQuery = q ? TECHNIQUES.find((t) => t.id === q) : null;
    if (fromQuery) {
      setSelected(fromQuery);
      return;
    }
    const lastId = localStorage.getItem(LS_LAST_TECH);
    setSelected(TECHNIQUES.find((t) => t.id === lastId) ?? TECHNIQUES[0]);
  }, [params]);

  // set panjang awal ketika teknik berubah
  useEffect(() => {
    if (!selected) return;
    setLength(Math.max(60, selected.minutes * 60));
    setElapsed(0);
    setPlaying(false);
    setStageLabel(null);
    localStorage.setItem(LS_LAST_TECH, selected.id);
    const a = audioRef.current;
    if (a) {
      a.currentTime = 0;
      a.pause();
    }
  }, [selected]);

  // timer sederhana
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setElapsed((e) => {
        const next = Math.min(e + 1, length);
        if (next >= length) setPlaying(false);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [playing, length]);

  // stage breathing guidance
  const totalStage = useMemo(
    () => (selected?.pattern ? selected.pattern.reduce((a, b) => a + b, 0) : 0),
    [selected?.pattern]
  );
  useEffect(() => {
    if (!playing || !selected?.pattern || totalStage === 0) return;
    const pos = elapsed % totalStage;
    let acc = 0;
    for (let i = 0; i < selected.pattern.length; i++) {
      acc += selected.pattern[i];
      if (pos < acc) {
        setStageLabel(selected.stages?.[i] ?? null);
        break;
      }
    }
  }, [elapsed, playing, selected?.pattern, selected?.stages, totalStage]);

  // ===== Audio source (pakai playlist API kalau mode musik)
  const isMusicMode = selected?.id === "musik";

  const audioSrc =
    isMusicMode
      ? (tracks[trackIdx]?.src
        ? `${API_BASE}${tracks[trackIdx].src}`
        : selected?.track
          ? `${API_BASE}${selected.track}`
          : "")
      : selected?.track
        ? (selected.track.startsWith("http")
          ? selected.track
          : `${API_BASE}${selected.track}`)
        : "";

  // ===== PERBAIKAN MINIMAL =====
  // 1) Encode agar aman untuk spasi/() dll
  const safeAudioSrc = audioSrc ? encodeURI(audioSrc) : "";

  // 2) Paksa reload saat sumber audio berubah (beberapa browser butuh ini)
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.load();
    if (playing) {
      a.play().catch((err) => {
        console.warn("Audio play failed:", err);
      });
    }
  }, [safeAudioSrc, playing]);
  // ===== END PERBAIKAN =====

  // audio control (volume + play/pause toggle)
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume / 100;
    if (playing) a.play().catch(() => { });
    else a.pause();
  }, [playing, volume, safeAudioSrc]);

  useEffect(() => {
    localStorage.setItem(LS_VOLUME_KEY, String(volume));
  }, [volume]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
      if (e.key === "Escape") {
        setPlaying(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleBackClick = () => navigate(-1);
  const percent = length ? Math.min(100, (elapsed / length) * 100) : 0;
  const remaining = Math.max(0, length - elapsed);

  if (!selected) return null;
  const ringColor = RING_HEX[selected.color];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-theme-background">
      <div className="w-full max-w-4xl mx-auto rounded-3xl shadow-2xl tips-main-card flex flex-col h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative flex items-center w-full" style={{ minHeight: 64 }}>
          <button
            onClick={handleBackClick}
            className="absolute left-0 top-1/2 -translate-y-1/2 eksplorasi-back-btn flex items-center hover:opacity-70 transition-opacity"
            aria-label="Kembali"
            style={{ padding: 8 }}
          >
            <ChevronLeftIcon className="h-7 w-7 eksplorasi-back-icon" />
          </button>
          <h2 className="w-full text-2xl font-bold text-center tips-title">Musik Relaksasi</h2>
        </div>

        {/* Glass card */}
        <div className="mt-4 rounded-3xl bg-white ring-1 ring-gray-200 shadow-2xl p-6 md:p-8">
          <div className="grid md:grid-cols-[1fr_320px] gap-8 items-start">
            {/* Left: ring + controls */}
            <div className="flex flex-col items-center">
              <div className="relative grid place-items-center">
                <div
                  className="h-48 w-48 md:h-56 md:w-56 rounded-full"
                  style={{
                    background: `conic-gradient(${ringColor} ${percent * 3.6}deg, rgba(255,255,255,0.6) 0deg)`,
                  }}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(percent)}
                />
                <div className="absolute h-40 w-40 md:h-48 md:w-48 rounded-full bg-white/80 ring-1 ring-white grid place-items-center">
                  <div className="text-center">
                    <div className="text-4xl md:text-5xl font-bold text-gray-800">{toMMSS(remaining)}</div>
                    <div className="text-[11px] text-gray-500">Sisa waktu</div>
                  </div>
                </div>
              </div>

              {/* cue */}
              {stageLabel && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-white">
                  {stageLabel}
                </div>
              )}

              {/* controls */}
              <div className="mt-5 flex items-center gap-3">
                {playing ? (
                  <button
                    className="px-4 py-2 rounded-xl bg-teal-900 text-white hover:bg-teal/90 text-sm font-medium inline-flex items-center gap-2"
                    onClick={() => setPlaying(false)}
                  >
                    <PauseIcon className="h-5 w-5" /> Jeda
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 rounded-xl bg-teal-900 text-white hover:bg-teal/90 text-sm font-medium inline-flex items-center gap-2"
                    onClick={() => setPlaying(true)}
                  >
                    <PlayIcon className="h-5 w-5" /> Mulai
                  </button>
                )}
                <button
                  className="px-4 py-2 rounded-xl bg-white/80 hover:bg-white text-sm font-medium ring-1 ring-white inline-flex items-center gap-2"
                  onClick={() => {
                    setElapsed(0);
                    setPlaying(false);
                    setStageLabel(null);
                    const a = audioRef.current;
                    if (a) a.currentTime = 0;
                  }}
                >
                  <ArrowPathIcon className="h-5 w-5" /> {/* NEW icon */}
                  Ulangi
                </button>
              </div>

              {/* volume & durasi */}
              <div className="mt-5 w-full max-w-sm">

                {/* Baris slider: icon + slider + angka persen di kanan */}
                <div className="flex items-center gap-3">
                  <SpeakerWaveIcon className="h-5 w-5 text-gray-600" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full"
                    aria-label="Volume musik"
                  />
                  <span className="text-xs text-gray-600 w-10 text-right">
                    {volume}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm text-gray-700">
                  <span>Durasi: {Math.round(length / 60)} menit</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="h-7 w-7 text-sm inline-flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 shadow-sm"
                      onClick={() => setLength((l) => Math.max(60, l - 60))}
                      aria-label="Kurangi 1 menit"
                    >
                      –
                    </button>
                    <button
                      className="h-7 w-7 text-sm inline-flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 shadow-sm"
                      onClick={() => setLength((l) => l + 60)}
                      aria-label="Tambah 1 menit"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: detail teknik + playlist (jika musik) */}
            <div className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={`${COLOR_MAP[selected.color]} p-3 rounded-full`}>
                  {selected.icon === "heart" && <HeartIcon className="h-6 w-6 eksplorasi-icon" />}
                  {selected.icon === "book" && <BookOpenIcon className="h-6 w-6 eksplorasi-icon" />}
                  {selected.icon === "note" && <MusicalNoteIcon className="h-6 w-6 eksplorasi-icon" />}
                  {selected.icon === "bolt" && <BoltIcon className="h-6 w-6 eksplorasi-icon" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selected.title}</h3>
                  <p className="text-sm text-gray-600">{selected.description}</p>
                </div>
              </div>

              {/* Playlist – LIST VERTIKAL (ala Spotify) */}
              {isMusicMode && (
                <div className="mt-5">
                  <div className="mb-2 text-sm font-medium text-gray-800">Pilih Musik</div>

                  {/* Loading / Error / Empty */}
                  {loadingTracks && <div className="text-sm text-gray-500">Memuat playlist…</div>}
                  {tracksErr && !loadingTracks && (
                    <div className="text-sm text-red-600">Gagal memuat: {tracksErr}</div>
                  )}
                  {!loadingTracks && !tracksErr && tracks.length === 0 && (
                    <div className="text-sm text-gray-500">
                      Belum ada lagu. Tambahkan via API <code>/api/relax-tracks</code>.
                    </div>
                  )}

                  {/* Daftar track */}
                  {tracks.length > 0 && (
                    <div className="max-h-64 overflow-y-auto rounded-xl ring-1 ring-gray-100 divide-y divide-gray-100 bg-white">
                      {tracks.map((t, i) => {
                        const active = i === trackIdx;
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              if (active) {
                                setPlaying((p) => !p);
                              } else {
                                setTrackIdx(i);
                                setElapsed(0);
                                if (audioRef.current) audioRef.current.currentTime = 0;
                                setPlaying(true);
                              }
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-3 text-left transition ${active ? "bg-teal-50" : "hover:bg-gray-50"
                              }`}
                            title={t.title}
                          >
                            {/* nomor urut */}
                            <div className="w-6 text-xs tabular-nums text-gray-500">
                              {String(i + 1).padStart(2, "0")}
                            </div>

                            {/* judul */}
                            <div className="flex-1 min-w-0">
                              <div
                                className={`text-sm font-medium truncate ${active ? "text-teal-900" : "text-gray-900"
                                  }`}
                              >
                                {t.title}
                              </div>
                            </div>

                            {/* status kanan: Play/Pause */}
                            <div className="shrink-0">
                              {active && playing ? (
                                <PauseIcon className="h-5 w-5 text-teal-900" />
                              ) : (
                                <PlayIcon className="h-5 w-5 text-gray-600" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Keterangan singkat */}
                  {tracks.length > 0 && (
                    <p className="mt-3 text-[11px] text-gray-500">
                      Memutar: <span className="font-medium">{tracks[trackIdx]?.title ?? "—"}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chips teknik disembunyikan di UI*/}
          <div className="hidden">
            {TECHNIQUES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={`shrink-0 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 transition ${selected.id === t.id
                  ? "bg-teal-900 text-white ring-gray-900"
                  : "bg-white/80 text-gray-700 ring-white hover:bg-white"
                  }`}
                aria-label={`Pilih ${t.title}`}
              >
                <span className={`${COLOR_MAP[t.color]} rounded-full p-1.5`}></span>
                {t.title}
              </button>
            ))}
          </div>
        </div>

        {/* audio element */}
        <audio
          ref={audioRef}
          loop
          src={safeAudioSrc}
          preload="auto"
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
}