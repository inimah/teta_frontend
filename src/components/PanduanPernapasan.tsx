import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeftIcon,
  HeartIcon,
  BoltIcon,
  PauseIcon,
  PlayIcon,
  ArrowPathIcon,      // NEW: refresh icon
  SpeakerWaveIcon,    // NEW: speaker icon
} from "@heroicons/react/24/outline";
import "../themes/flower.css";

/** Tambahan base URL BE */
const API_BASE = import.meta.env?.VITE_API_URL ?? "http://localhost:5000";
/** Helper untuk membentuk URL */
const pernafasanAudio = (filename: string) =>
  `${API_BASE}/audio/pernafasan/${encodeURIComponent(filename)}`;

type Technique = {
  id: string;
  title: string;
  // description: string;
  minutes: number;            // durasi default sesi
  icon: "heart" | "bolt";
  pattern: number[];          // detik per tahap (mis. [4,7,8])
  stages: string[];           // label tiap tahap (mis. ["Tarik","Tahan","Hembuskan"])
  color: "pink" | "teal" | "yellow" | "blue";
};

const TECHNIQUES: Technique[] = [
  {
    id: "478",
    title: "pernafasan 4-7-8",
    // description: "Tarik 4 detik • Tahan 7 detik • Hembuskan 8 detik.",
    minutes: 4,
    icon: "heart",
    pattern: [4, 7, 8],
    stages: ["Tarik", "Tahan", "Hembuskan"], // CHANGED to English
    color: "pink",
  },
  {
    id: "box",
    title: "Box Breathing 4-4-4-4",
    // description: "Tarik 4 • Tahan 4 • Hembuskan 4 • Tahan 4.",
    minutes: 5,
    icon: "bolt",
    pattern: [4, 4, 4, 4],
    stages: ["Tarik", "Tahan", "Hembuskan", "Tahan"], // CHANGED to English
    color: "teal",
  },
  {
    id: "coherent",
    title: "Coherent 5-5",
    // description: "Tarik 5 detik • Hembuskan 5 detik.",
    minutes: 5,
    icon: "heart",
    pattern: [5, 5],
    stages: ["Tarik", "Hembuskan"], // CHANGED to English
    color: "yellow",
  },
  {
    id: "ex46",
    title: "Exhale-Extended 4-6",
    // description: "Tarik 4 • Hembuskan 6 .",
    minutes: 5,
    icon: "bolt",
    pattern: [4, 6],
    stages: ["Tarik", "Hembuskan"], // CHANGED to English
    color: "blue",
  },
];

const COLOR_BADGE: Record<Technique["color"], string> = {
  pink: "eksplorasi-icon-bg-pink",
  teal: "eksplorasi-icon-bg-teal",
  yellow: "eksplorasi-icon-bg-yellow",
  blue: "eksplorasi-icon-bg-blue",
};

const RING_HEX: Record<Technique["color"], string> = {
  pink: "#ec4899",
  teal: "#10b981",
  yellow: "#f59e0b",
  blue: "#3b82f6",
};

const LS_LAST_TECH = "breath_last_tech";

/** ---------- BACKSOUND (disesuaikan ke BE/public/audio/pernafasan) ---------- */
type BgTrack = { id: string; title: string; src: string };
const BG_PLAYLIST: BgTrack[] = [
  {
    id: "Ethos",
    title: "Ethos",
    src: pernafasanAudio("Epic Spectrum - Ethos (freetouse.com).mp3"),
  },
  {
    id: "Tranquility",
    title: "Tranquility",
    src: pernafasanAudio("Project Ex - Tranquility (freetouse.com).mp3"),
  },
  {
    id: "Meditation",
    title: "Meditation",
    src: pernafasanAudio("Aylex - Meditation (freetouse.com).mp3"),
  },
];
const LS_BG_ON = "breath_bg_on";
const LS_BG_VOL = "breath_bg_vol";
const LS_BG_TRACK = "breath_bg_track";
/** ------------------------------------------------------------------------- */

const toMMSS = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

export default function Panduanpernafasan() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [selected, setSelected] = useState<Technique | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0); // detik sesi berjalan
  const [length, setLength] = useState(0);   // total detik sesi
  const [stageLabel, setStageLabel] = useState<string | null>(null);

  // UX: countdown 3-2-1 sebelum mulai
  const [prestart, setPrestart] = useState<number | null>(null);
  // UX: voice coaching opsional
  const [voiceOn, setVoiceOn] = useState<boolean>(true);

  // === Voice English picker (minimal change)
  const enVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    const pickEnVoice = () => {
      const voices = window.speechSynthesis?.getVoices?.() || [];
      enVoiceRef.current =
        voices.find(v => v.lang?.toLowerCase() === "en-us" && /google|natural|premium/i.test(v.name)) ||
        voices.find(v => v.lang?.toLowerCase() === "en-us") ||
        voices.find(v => v.lang?.toLowerCase().startsWith("en")) ||
        null;
    };
    pickEnVoice();
    window.speechSynthesis?.addEventListener?.("voiceschanged", pickEnVoice);
    return () =>
      window.speechSynthesis?.removeEventListener?.("voiceschanged", pickEnVoice);
  }, []);

  /** ---------- STATE BACKSOUND ---------- */
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const [bgOn, setBgOn] = useState<boolean>(() => {
    const v = localStorage.getItem(LS_BG_ON);
    return v === null ? true : v === "true";
  });
  const [bgVolume, setBgVolume] = useState<number>(() => {
    const n = Number(localStorage.getItem(LS_BG_VOL));
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 40;
  });
  const [bgTrack, setBgTrack] = useState<number>(() => {
    const n = Number(localStorage.getItem(LS_BG_TRACK));
    return Number.isFinite(n) ? Math.min(BG_PLAYLIST.length - 1, Math.max(0, n)) : 0;
  });
  useEffect(() => localStorage.setItem(LS_BG_ON, String(bgOn)), [bgOn]);
  useEffect(() => localStorage.setItem(LS_BG_VOL, String(bgVolume)), [bgVolume]);
  useEffect(() => localStorage.setItem(LS_BG_TRACK, String(bgTrack)), [bgTrack]);

  // Sinkronkan audio backsound dengan status bermain
  useEffect(() => {
    const a = bgAudioRef.current;
    if (!a) return;
    a.volume = bgVolume / 100;
    if (playing && bgOn) a.play().catch(() => { });
    else a.pause();
  }, [playing, bgOn, bgVolume, bgTrack]);
  /** -------------------------------------------- */

  // ambil teknik dari query / localStorage
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

  // reset saat ganti teknik
  useEffect(() => {
    if (!selected) return;
    setLength(Math.max(60, selected.minutes * 60));
    setElapsed(0);
    setPlaying(false);
    setStageLabel(null);
    setPrestart(null);
    localStorage.setItem(LS_LAST_TECH, selected.id);

    // reset juga posisi backsound
    try { if (bgAudioRef.current) bgAudioRef.current.currentTime = 0; } catch { }
  }, [selected]);

  // timer sesi
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

  // perhitungan tahap napas (index tahap & progress tahap)
  const stageCalc = useMemo(() => {
    if (!selected) return { idx: 0, stageElapsed: 0, stagePct: 0, total: 0, pos: 0 };
    const cycle = selected.pattern;
    const total = cycle.reduce((a, b) => a + b, 0);
    if (total === 0) return { idx: 0, stageElapsed: 0, stagePct: 0, total: 0, pos: 0 };

    const pos = elapsed % total; // detik posisi dalam satu siklus
    let acc = 0;
    let idx = 0;
    for (let i = 0; i < cycle.length; i++) {
      acc += cycle[i];
      if (pos < acc) { idx = i; break; }
    }
    const stageDur = cycle[idx] || 1;
    const stageElapsed = pos - (acc - stageDur);
    const stagePct = Math.min(100, Math.max(0, (stageElapsed / stageDur) * 100));
    return { idx, stageElapsed, stagePct, total, pos };
  }, [elapsed, selected]);

  // update label tahap sesuai waktu (saat bermain)
  useEffect(() => {
    if (!selected || stageCalc.total === 0) return;
    setStageLabel(selected.stages[stageCalc.idx] ?? null);
  }, [stageCalc.idx, stageCalc.total, selected]);

  // haptik ringan saat pergantian tahap (mobile)
  const lastStageRef = useRef<number>(-1);
  useEffect(() => {
    if (!playing) return;
    if (stageCalc.idx !== lastStageRef.current) {
      lastStageRef.current = stageCalc.idx;
      (navigator as any).vibrate?.(40);
    }
  }, [stageCalc.idx, playing]);

  // jaga layar tetap menyala saat sesi berjalan (wake lock)
  const wakeRef = useRef<any>(null);
  useEffect(() => {
    let cancelled = false;
    async function lock() {
      try {
        const wl = await (navigator as any).wakeLock?.request?.("screen");
        if (!cancelled) wakeRef.current = wl;
      } catch { /* ignore */ }
    }
    if (playing) lock();
    return () => {
      cancelled = true;
      try { wakeRef.current?.release?.(); } catch { /* ignore */ }
      wakeRef.current = null;
    };
  }, [playing]);

  // voice coaching: ucapkan label tahap dalam Bahasa Inggris
  useEffect(() => {
    if (!playing || !voiceOn || !stageLabel || !selected) return;

    try {
      const phrase =
        stageLabel === "Tarik"   ? `Tarik`
      : stageLabel === "Hembuskan"   ? `Hembuskan`
      :                             `Tahan`;

      window.speechSynthesis?.cancel();

      // turunkan volume musik saat voice berbicara
      const a = bgAudioRef.current;
      const prevVol = a ? a.volume : undefined;
      if (a && bgOn) a.volume = Math.min(a.volume ?? (bgVolume / 100), 0.25);

      const u = new SpeechSynthesisUtterance(stageLabel);
      u.lang = "id-ID"; // Set Indonesian language accent
      u.rate = 0.9;
      window.speechSynthesis?.speak(u);


      /* const u = new SpeechSynthesisUtterance(phrase);
      //u.lang = "en-US";
      u.lang = "id-ID";
      if (enVoiceRef.current) u.voice = enVoiceRef.current;
      u.rate = 0.95;
      u.pitch = 1;
      u.onend = () => { if (a && prevVol !== undefined) a.volume = prevVol; };
      u.onerror = () => { if (a && prevVol !== undefined) a.volume = prevVol; };

      window.speechSynthesis?.speak(u); */
    } catch { /* ignore */ }
  }, [stageCalc.idx, playing, voiceOn, stageLabel, selected, bgOn, bgVolume]);

  // kontrol
  const handleBack = () => navigate(-1);
  const handleStart = () => {
    if (prestart !== null) return;
    setPrestart(3);
    const id = window.setInterval(() => {
      setPrestart((p) => {
        if (!p || p <= 1) {
          window.clearInterval(id);
          setPlaying(true); // <- backsound otomatis ikut jalan via useEffect
          return null;
        }
        return p - 1;
      });
    }, 1000);
  };

  const percent = length ? Math.min(100, (elapsed / length) * 100) : 0;
  const remaining = Math.max(0, length - elapsed);
  if (!selected) return null;
  const ringColor = RING_HEX[selected.color];

  // skala lingkaran untuk “bernapas”
  const phase = selected.stages[stageCalc.idx] ?? "";
  const scale =
    phase === "Tarik" ? 1 + 0.12 * (stageCalc.stagePct / 100)
      : phase === "Hembuskan" ? 1.12 - 0.12 * (stageCalc.stagePct / 100)
        : 1.12; // Tahan = puncak

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-theme-background">
      <div className="w-full max-w-4xl mx-auto rounded-3xl shadow-2xl tips-main-card flex flex-col h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative flex items-center w-full px-4" style={{ minHeight: 70 }}>
          <button
            onClick={handleBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 eksplorasi-back-btn flex items-center hover:opacity-70 transition-opacity"
            aria-label="Kembali"
            style={{ padding: 8 }}
          >
            <ChevronLeftIcon className="h-7 w-7 eksplorasi-back-icon" />
          </button>
          <h2 className="w-full text-2xl font-bold text-center tips-title py-4">
            Panduan pernafasan
          </h2>
        </div>
        <hr className="border-t border-gray-200 mb-6" />

        {/* Panel putih solid */}
        <div
          className="tips-scrollable-content px-6"
          style={{ overflow: "visible", maxHeight: "none" }}
        >
          <div className="w-full bg-white rounded-xl shadow-2xl ring-1 ring-gray-200 eksplorasi-content-box p-4 md:p-6">
            <div className="grid md:grid-cols-[1fr_320px] gap-8 items-center">
              {/* LEFT: ring + animasi + kontrol */}
              <div className="flex flex-col items-center">
                <div className="relative grid place-items-center">
                  <div
                    className="h-48 w-48 md:h-56 md:w-56 rounded-full"
                    style={{
                      background: `conic-gradient(${ringColor} ${percent * 3.6}deg, #f3f4f6 0deg)`,
                    }}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(percent)}
                  />
                  <div
                    className="absolute h-40 w-40 md:h-48 md:w-48 rounded-full bg-white/90 ring-1 ring-gray-200 grid place-items-center transition-transform duration-200"
                    style={{ transform: `scale(${scale})` }}
                  >
                    <div className="text-center">
                      <div className="text-4xl md:text-5xl font-bold text-gray-800">
                        {toMMSS(remaining)}
                      </div>
                      <div className="text-[11px] text-gray-500">Sisa waktu</div>
                    </div>

                    {/* Overlay countdown */}
                    {prestart !== null && (
                      <div className="absolute inset-0 grid place-items-center bg-white/70 rounded-full">
                        <span className="text-4xl font-bold text-gray-800">{prestart}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stage meter */}
                <div className="mt-2 w-40 md:w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${stageCalc.stagePct}%` }} />
                </div>

                {/* Label tahap */}
                {stageLabel && playing && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-green-200">
                    {stageLabel}
                  </div>
                )}

                {/* Kontrol */}
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
                      onClick={handleStart}
                    >
                      <PlayIcon className="h-5 w-5" /> {prestart ?? "Mulai"}
                    </button>
                  )}
                  <button
                    className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-sm font-medium inline-flex items-center gap-2 ring-1 ring-gray-200"
                    onClick={() => {
                      setElapsed(0);
                      setPlaying(false);
                      setStageLabel(null);
                      setPrestart(null);
                      try { if (bgAudioRef.current) bgAudioRef.current.currentTime = 0; } catch { }
                    }}
                  >
                    <ArrowPathIcon className="h-5 w-5" /> Ulangi
                  </button>
                </div>

                {/* Durasi, voice, dan BACKSOUND controls */}
                <div className="mt-5 w-full max-w-sm space-y-3">
                  {/* Durasi + tombol – / + sejajar */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">Durasi: {Math.round(length / 60)} menit</div>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 py-1 rounded-full bg-white ring-1 ring-gray-200 hover:bg-gray-50"
                        onClick={() => setLength((l) => Math.max(60, l - 60))}
                        aria-label="Kurangi 1 menit"
                      >
                        –
                      </button>
                      <button
                        className="px-2 py-1 rounded-full bg-white ring-1 ring-gray-200 hover:bg-gray-50"
                        onClick={() => setLength((l) => l + 60)}
                        aria-label="Tambah 1 menit"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Panduan suara (dipindah ke kiri, di atas musik latar) */}
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      id="voice-coach"
                      type="checkbox"
                      checked={voiceOn}
                      onChange={(e) => setVoiceOn(e.target.checked)}
                    />
                    <label htmlFor="voice-coach" className="select-none cursor-pointer">
                      Panduan suara
                    </label>
                  </div>

                  {/* BACKSOUND UI: Musik latar → Playlist → Volume */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={bgOn}
                          onChange={(e) => setBgOn(e.target.checked)}
                        />
                        Musik latar saat sesi
                      </label>
                    </div>

                    <div className={`mt-2 ${bgOn ? "" : "opacity-50 pointer-events-none"}`}>
                      {/* Playlist (dipindah ke atas volume) */}
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {BG_PLAYLIST.map((t, i) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setBgTrack(i);
                              try { if (bgAudioRef.current) bgAudioRef.current.currentTime = 0; } catch { }
                            }}
                            className={`shrink-0 rounded-full px-3 py-1.5 text-xs ring-1 transition
                              ${i === bgTrack ? "bg-teal-900 text-white ring-gray-900" : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50"}`}
                            aria-label={`Pilih musik ${t.title}`}
                          >
                            {t.title}
                          </button>
                        ))}
                      </div>

                      {/* Volume + icon speaker (slider di bawah playlist) */}
                      <div className="mt-2 flex items-center gap-3">
                        <SpeakerWaveIcon className="h-5 w-5 text-gray-600" />
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={bgVolume}
                          onChange={(e) => setBgVolume(Number(e.target.value))}
                          className="w-full"
                          aria-label="Volume musik"
                        />
                        <span className="text-xs text-gray-600 w-10 text-right">{bgVolume}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: detail & instruksi */}
              <div className="rounded-2xl detail-bg ring-1 ring-gray-100 p-5 self-start ">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`${COLOR_BADGE[selected.color]} p-3 rounded-full`}>
                    {selected.icon === "heart" && <HeartIcon className="h-6 w-6 eksplorasi-icon" />}
                    {selected.icon === "bolt" && <BoltIcon className="h-6 w-6 eksplorasi-icon" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold detail-title">{selected.title}</h3>
                    {/* <p className="text-sm detail-kat-text">{selected.description}</p> */}
                  </div>
                </div>

                {/* ——— Per-teknik: manfaat & cara ——— */}
                {selected.id === "478" && (
                  <div className="mt-3 text-[13px] leading-relaxed flower-content text-justify">
                    <p className="font-medium mb-1">Cara singkat</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Duduk nyaman. Tarik lewat hidung 4 detik.</li>
                      <li>Tahan napas 7 detik .</li>
                      <li>Hembuskan perlahan 8 detik .</li>
                      <li>Istirahat 1–2 napas biasa bila perlu, lalu ulangi.</li>
                    </ol>
                  </div>
                )}

                {selected.id === "box" && (
                  <div className="mt-3 text-[12px] md:text-[13px] leading-relaxed flower-content text-justify">
                    <p className="font-medium mb-1">Cara singkat</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Tarik 4 detik, <b>tahan</b> 4 detik.</li>
                      <li>Hembuskan 4 detik, <b>tahan</b> 4 detik .</li>
                      <li>Jaga ritme kotak: 4–4–4–4, bahu rileks, rahang santai.</li>
                      <li>Jika pusing, kurangi durasi jadi 3–3–3–3.</li>
                    </ol>
                  </div>
                )}

                {selected.id === "coherent" && (
                  <div className="mt-3 text-[13px] leading-relaxed flower-content text-justify">
                    <p className="font-medium mb-1">Cara singkat</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Tarik 5 detik lewat hidung, perut lembut mengembang.</li>
                      <li>Hembuskan 5 detik halus, tanpa menekan.</li>
                      <li>Biarkan napas mengalun secara konsisten.</li>
                      <li>Latihan 5–10 menit memberikan efek paling terasa.</li>
                    </ol>
                  </div>
                )}

                {selected.id === "ex46" && (
                  <div className="mt-3 text-[13px] leading-relaxed flower-content text-justify">
                    <p className="font-medium mb-1">Cara singkat</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Tarik 4 detik lewat hidung.</li>
                      <li>Hembuskan 6 detik perlahan (bibir sedikit meruncing membantu).</li>
                      <li>Jaga ritme lembut—jika masih tegang, tambah hembus ke 7–8 detik.</li>
                      <li>Ulangi 3–6 menit sesuai nyaman.</li>
                    </ol>
                  </div>
                )}

                {/* Chips teknik – pindah ke kanan (desktop) */}
                <div className="hidden md:block">
                  <hr className="my-4 border-gray-100" />
                  <div className="text-xs font-medium text-gray-500 mb-2">Pilih teknik</div>
                  <div className="flex flex-wrap gap-2">
                    {TECHNIQUES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelected(t)}
                        className={`w-full h-8 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ring-1 transition whitespace-nowrap overflow-hidden
   ${selected.id === t.id
                          ? "bg-teal-900 text-white ring-gray-900"
                          : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50"}`}
                        aria-label={`Pilih ${t.title}`}
                      >
                        <span className={`${COLOR_BADGE[t.color]} rounded-full p-1.5`} />
                        {t.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Chips teknik (mobile hidden section remains commented) */}
          </div>
        </div>

        {/* BACKSOUND audio element */}
        <audio
          ref={bgAudioRef}
          loop
          src={BG_PLAYLIST[bgTrack]?.src}
          preload="auto"
        />
      </div>
    </div>
  );
}
