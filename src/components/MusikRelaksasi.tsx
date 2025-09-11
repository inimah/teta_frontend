import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../themes/flower.css";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  BookOpenIcon,
  MusicalNoteIcon,
  BoltIcon,
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/outline";
import { RELAX_PLAYLIST, } from "../data/relaxPlaylist";


/**
 * Relaksasi.tsx — Zen Glass UI + Playlist Musik
 * - Query: /relaksasi?tech=478|musik|mindfulness|pmr
 * - Persist: volume, teknik terakhir, dan track musik terakhir
 */

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

// ---- Data ----
const TECHNIQUES: Technique[] = [
  // {
  //   id: "478",
  //   title: "Pernapasan 4-7-8",
  //   description: "Teknik pernapasan sederhana untuk meredakan cemas.",
  //   minutes: 4,
  //   icon: "heart",
  //   track: "/audio/calm-air.mp3",
  //   pattern: [4, 7, 8],
  //   stages: ["Tarik", "Tahan", "Hembuskan"],
  //   color: "pink",
  // },
  // {
  //   id: "mindfulness",
  //   title: "Meditasi Mindfulness",
  //   description: "Fokus pada momen kini; amati napas & sensasi tubuh.",
  //   minutes: 5,
  //   icon: "book",
  //   track: "/audio/mindful-bell.mp3",
  //   color: "yellow",
  // },
  // {
  //   id: "pmr",
  //   title: "Relaksasi Otot Progresif",
  //   description: "Tegang-lepas otot bertahap dari kaki hingga wajah.",
  //   minutes: 10,
  //   icon: "bolt",
  //   track: "/audio/body-scan.mp3",
  //   color: "teal",
  // },
  {
    id: "musik",
    title: "Musik Relaksasi",
    description: "Dengarkan latar musik menenangkan saat jeda.",
    minutes: 5,
    icon: "note",
    track: "/audio/soft-piano.mp3", // fallback jika playlist kosong
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

  // === Playlist state (khusus teknik musik)
  const [trackIdx, setTrackIdx] = useState<number>(() => {
    const saved = localStorage.getItem(LS_LAST_TRACK);
    return saved ? Number(saved) : 0;
  });
  useEffect(() => {
    localStorage.setItem(LS_LAST_TRACK, String(trackIdx));
  }, [trackIdx]);

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
    if (a) { a.currentTime = 0; a.pause(); }
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
      if (pos < acc) { setStageLabel(selected.stages?.[i] ?? null); break; }
    }
  }, [elapsed, playing, selected?.pattern, selected?.stages, totalStage]);

  // ===== Audio source (pakai playlist kalau mode musik)
  const isMusicMode = selected?.id === "musik";
  const audioSrc = isMusicMode
    ? (RELAX_PLAYLIST[trackIdx]?.src ?? selected?.track ?? "")
    : (selected?.track ?? "");

  // --- playlist scroll nav ---
  const playlistRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updatePlaylistNav = () => {
    const el = playlistRef.current;
    if (!el) { setCanPrev(false); setCanNext(false); return; }
    setCanPrev(el.scrollLeft > 0);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updatePlaylistNav();
    const el = playlistRef.current;
    if (!el) return;
    const onScroll = () => updatePlaylistNav();
    el.addEventListener("scroll", onScroll);
    window.addEventListener("resize", updatePlaylistNav);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updatePlaylistNav);
    };
  }, [isMusicMode]);

  const scrollPlaylist = (dir: number) => {
    const el = playlistRef.current;
    if (!el) return;
    const step = Math.round(el.clientWidth * 0.8); // geser ±80% lebar view
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };


  // audio control
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume / 100;
    if (playing) a.play().catch(() => { }); // interaksi user dibutuhkan di iOS
    else a.pause();
  }, [playing, volume, audioSrc]);

  useEffect(() => { localStorage.setItem(LS_VOLUME_KEY, String(volume)); }, [volume]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
      if (e.key === "Escape") { setPlaying(false); }
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
          <h2 className="w-full text-2xl font-bold text-center tips-title">Relaksasi</h2>
        </div>

        {/* Glass card */}
        <div className="mt-4 rounded-3xl bg-white ring-1 ring-gray-200 shadow-2xl p-6 md:p-8">
          <div className="grid md:grid-cols-[1fr_320px] gap-8 items-center">
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
                  onClick={() => { setElapsed(0); setPlaying(false); setStageLabel(null); const a = audioRef.current; if (a) a.currentTime = 0; }}
                >
                  Ulangi
                </button>
              </div>

              {/* volume & durasi */}
              <div className="mt-5 w-full max-w-sm">
                <div className="mb-2 flex items-center gap-2 text-xs text-gray-700">
                  <SpeakerWaveIcon className="h-4 w-4" /> Volume musik
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full"
                />
                <div className="mt-3 flex items-center gap-3 text-sm text-gray-700">
                  <span>Durasi: {Math.round(length / 60)} menit</span>
                  <button className="px-2 py-1 rounded-full bg-white/80 ring-1 ring-white hover:bg-white" onClick={() => setLength((l) => Math.max(60, l - 60))}>-1</button>
                  <button className="px-2 py-1 rounded-full bg-white/80 ring-1 ring-white hover:bg-white" onClick={() => setLength((l) => l + 60)}>+1</button>
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

              {/* instructions */}
              {selected.id !== "478" ? (
                <div className="mt-3 text-[13px] leading-relaxed text-gray-700">
                  {selected.id === "mindfulness" ? (
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Perhatikan napas: udara masuk–keluar, sensasi di hidung atau perut.</li>
                      <li>Saat pikiran mengembara, sadari, lalu kembali ke napas dengan lembut.</li>
                      <li>Biarkan musik sebagai latar, bukan pusat perhatian.</li>
                    </ol>
                  ) : selected.id === "pmr" ? (
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Mulai dari kaki: tegangkan 3–5 detik, lalu lepaskan perlahan.</li>
                      <li>Lanjut ke betis, paha, perut, tangan, bahu, hingga wajah.</li>
                      <li>Rasakan perbedaan tegang vs. rileks di tiap bagian.</li>
                    </ol>
                  ) : (
                    <p>Dengarkan musik santai sambil bernapas alami dan mengistirahatkan mata sejenak.</p>
                  )}
                </div>
              ) : (
                <div className="mt-3 text-[13px] leading-relaxed text-gray-700">
                  <p>Ikuti ritme: <span className="font-medium">Tarik 4</span> • <span className="font-medium">Tahan 7</span> • <span className="font-medium">Hembuskan 8</span>.</p>
                </div>
              )}

              {/* Playlist selector & attribution (hanya mode musik) */}
              {isMusicMode && (
                <div className="mt-5">
                  <div className="mb-2 text-sm font-medium text-gray-800">Pilih Musik</div>

                  <div className="relative">
                    {/* tombol kiri */}
                    {canPrev && (
                      <button
                        onClick={() => scrollPlaylist(-1)}
                        aria-label="Geser kiri"
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white p-1 ring-1 ring-gray-200 shadow hover:bg-gray-50"
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                    )}

                    {/* list chip bisa digeser */}
                    <div
                      ref={playlistRef}
                      className="flex gap-2 overflow-x-auto pb-2 px-7 scroll-smooth"
                    >
                      {RELAX_PLAYLIST.map((t, i) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setTrackIdx(i);
                            setElapsed(0);
                            const a = audioRef.current;
                            if (a) a.currentTime = 0;
                          }}
                          className={`shrink-0 rounded-full px-3 py-1.5 text-sm ring-1 transition
            ${i === trackIdx
                              ? "bg-teal-900 text-white ring-gray-900"
                              : "bg-white/80 text-gray-700 ring-white hover:bg-white"}`}
                          aria-label={`Pilih lagu ${t.title}`}
                        >
                          {t.title}
                        </button>
                      ))}
                    </div>

                    {/* tombol kanan */}
                    {canNext && (
                      <button
                        onClick={() => scrollPlaylist(1)}
                        aria-label="Geser kanan"
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white p-1 ring-1 ring-gray-200 shadow hover:bg-gray-50"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    )}

                    {/* fade di tepi sebagai hint bisa digeser */}
                    <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white to-transparent" />
                    <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white to-transparent" />

                    {/* hint teks kecil (muncul saat hanya bisa ke kanan) */}
                    {!canPrev && canNext && (
                      <div className="absolute -bottom-5 right-0 text-[10px] text-gray-400">geser →</div>
                    )}
                  </div>

                  <p className="mt-3 text-[11px] text-gray-500">
                    Musik: <span className="font-medium">{RELAX_PLAYLIST[trackIdx].title}</span> — {RELAX_PLAYLIST[trackIdx].artist}. Sumber:{" "}
                    <a href={RELAX_PLAYLIST[trackIdx].sourceUrl} target="_blank" rel="noreferrer" className="underline">link</a>. {RELAX_PLAYLIST[trackIdx].attribution ?? ""}
                  </p>
                </div>

              )}
            </div>
          </div>

          {/* Chips teknik */}
          <div className="mt-6 flex gap-3 overflow-x-auto pb-1">
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
        <audio ref={audioRef} loop src={audioSrc} preload="auto" />
      </div>
    </div>
  );
}
