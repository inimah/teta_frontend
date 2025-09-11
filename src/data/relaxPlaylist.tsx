export type RelaxTrack = {
  id: string;
  title: string;
  artist: string;
  src: string;        // path lokal ke /public/audio atau URL langsung
  sourceUrl: string;  // link halaman sumber
  attribution?: string; // teks kredit (jika perlu)
};

export const RELAX_PLAYLIST: RelaxTrack[] = [
  {
    id: "heritage",
    title: "Heritage",
    artist: "Pufino",
    src: "/audio/Pufino - Heritage (freetouse.com).mp3",
    sourceUrl: "https://freetouse.com/music/pufino/heritage",
    // Free To Use/CC-BY style: butuh kredit
    attribution:
      'Music: "Heritage" by Pufino — Free To Use Music (credit required).',
  },
  {
    id: "imbolc",
    title: "Imbolc",
    artist: "Zambolino",
    src: "/audio/Zambolino - Imbolc (freetouse.com).mp3",
    sourceUrl: "https://freetouse.com/music/zambolino/imbolc",
    attribution:
      'Music: "Imbolc" by Zambolino — Free To Use Music (credit required).',
  },
  {
    id: "meditation-spiritual",
    title: "Meditation Spiritual Music",
    artist: "lkoliks",
    src: "/audio/meditation-spiritual-music-330169.mp3",
    sourceUrl:
      "https://pixabay.com/music/ambient-meditation-spiritual-music-330169/",
    // Pixabay License: attribution tidak wajib, tetap boleh dicantumkan
    attribution: 'Music: "Meditation Spiritual Music" by lkoliks — Pixabay.',
  },
   {
    id: "sounds of nature",
    title: "sounds of nature",
    artist: "aylex",
    src: "/audio/Aylex - Sounds of Nature (freetouse.com).mp3",
    sourceUrl: "https://freetouse.com/music/aylex/sounds-of-nature",
    // Free To Use/CC-BY style: butuh kredit
    attribution:
      'Music: "Sounds of Nature" by aylex — Free To Use Music (credit required).',
  },
  {
    id: "Libellule",
    title: "Libellule",
    artist: "Guillermo Guareschi",
    src: "/audio/Guillermo Guareschi - Libellule (freetouse.com).mp3",
    sourceUrl: "https://freetouse.com/music/guillermo-guareschi/libellule",
    // Free To Use/CC-BY style: butuh kredit
    attribution:
      'Music: "Libellule" by Guillermo Guareschi — Free To Use Music (credit required).',
  },
  {
    id: "Wallflower",
    title: "Wallflower",
    artist: "Epic Spectrum",
    src: "/audio/Epic Spectrum - Wallflower (freetouse.com).mp3",
    sourceUrl: "https://freetouse.com/music/epic-spectrum/wallflower",
    // Free To Use/CC-BY style: butuh kredit
    attribution:
      'Music: "Wallflower" by Epic Spectrum — Free To Use Music (credit required).',
  },
];
