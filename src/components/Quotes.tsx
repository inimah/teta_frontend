import React, { useState, useEffect } from "react";
import { FaHeart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { FaArrowAltCircleLeft, FaArrowAltCircleRight } from "react-icons/fa";

interface Mood {
  label: string;
  emoji: string;
  category_name: string;
  description?: string;
  color?: string;
}

interface Quote {
  _id: string;
  text: string;
  author: string;
}

interface FavoriteResponse {
  _id: string;
  user_id: string;
  quote_id: {
    _id: string;
    text: string;
    author: string;
  } | null;
}

const Quotes: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasTried, setHasTried] = useState<boolean>(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const quoteRef = React.useRef<HTMLDivElement>(null);

  const cardColors: string[] = [
    "bg-gradient-to-br from-purple-100 to-purple-200",
    "bg-gradient-to-br from-green-100 to-green-200",
    "bg-gradient-to-br from-yellow-100 to-yellow-200",
    "bg-gradient-to-br from-pink-100 to-pink-200",
    "bg-gradient-to-br from-blue-100 to-blue-200",
    "bg-gradient-to-br from-indigo-100 to-indigo-200",
  ];

  const cardTextColors: string[] = [
    "text-purple-700",
    "text-green-700",
    "text-yellow-700",
    "text-pink-700",
    "text-blue-700",
    "text-indigo-700",
  ];

  const cardTextColor = cardTextColors[currentIndex % cardTextColors.length];
  const cardColor = cardColors[currentIndex % cardColors.length];

  const handleBackClick = () => navigate(-1);

  const handlePrev = (): void => {
    setCurrentIndex((prev: number) => (prev === 0 ? quotes.length - 1 : prev - 1));
  };

  const handleNext = (): void => {
    setCurrentIndex((prev: number) => (prev === quotes.length - 1 ? 0 : prev + 1));
  };

  const handleMoodClick = (mood: Mood): void => {
    setSelectedMood(mood);
    setQuotes([]);
    setHasTried(false);
    setCurrentIndex(0);
    fetchQuote(mood.category_name);

    setTimeout(() => {
      quoteRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 500);
  };

  const handleHeartClick = (): void => {
    if (!quotes.length) return;
    const currentId = quotes[currentIndex]?._id;
    if (!currentId) return;
    if (favoriteIds.includes(currentId)) handleUnfavorite(currentId);
    else handleFavorite(currentId);
  };

  const currentQuote = quotes[currentIndex];
  const isCurrentQuoteFavorited = currentQuote ? favoriteIds.includes(currentQuote._id) : false;

const moods = [
  {
    label: "Sedih",
    emoji: "😔",
    category_name: "sedih",
    color: "bg-blue-50 hover:bg-blue-100"
  },
  {
    label: "Marah",
    emoji: "😡",
    category_name: "marah",
    color: "bg-red-50 hover:bg-red-100"
  },
  {
    label: "Cemas",
    emoji: "🥶",
    category_name: "cemas",
    color: "bg-purple-50 hover:bg-purple-100"
  },
  {
    label: "Semangat",
    emoji: "😊",
    category_name: "motivasi",
    color: "bg-yellow-50 hover:bg-yellow-100"
  },
  {
    label: "Insecure",
    emoji: "😟",
    category_name: "insecure",
    color: "bg-green-50 hover:bg-green-100"
  },
  {
    label: "Self-love",
    emoji: "💖",
    category_name: "self-love",
    color: "bg-pink-50 hover:bg-pink-100"
  },
  {
    label: "Lucu",
    emoji: "😂",
    category_name: "lucu",
    color: "bg-orange-50 hover:bg-orange-100"
  },
  {
    label: "Bersyukur",
    emoji: "🙏",
    category_name: "bersyukur",
    color: "bg-teal-50 hover:bg-teal-100"
  },
  {
    label: "Senang",
    emoji: "😁",
    category_name: "senang",
    color: "bg-indigo-50 hover:bg-indigo-100"
  },
];

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let aborted = false;

    (async () => {
      try {
        const res = await fetch(`/api/user-favs/${userId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const ids = data
          .filter((fav: FavoriteResponse) => fav.quote_id && fav.quote_id._id)
          .map((fav: FavoriteResponse) => fav.quote_id!._id);

        if (!aborted) {
          setFavoriteIds(Array.from(new Set(ids)));
        }
      } catch (err) {
        if (!aborted) console.error("Error fetching favorites:", err);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [userId]);

  const fetchQuote = async (categoryName: string) => {
    if (!categoryName) return;
    setLoading(true);
    setHasTried(true);
    try {
      const res = await fetch(`/api/quotes?category_name=${categoryName}`);
      const data = await res.json();
      setQuotes(Array.isArray(data) ? data : [data].filter(Boolean));
      setCurrentIndex(0);
    } catch (err) {
      console.error("Error fetching quotes:", err);
      setQuotes([]);
    }
    setLoading(false);
  };

  const addFavLocal = (id: string) =>
    setFavoriteIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const removeFavLocal = (id: string) =>
    setFavoriteIds((prev) => prev.filter((x) => x !== id));

  const handleFavorite = async (quoteId: string) => {
    if (!quoteId) return;
    if (!userId) {
      addFavLocal(quoteId);
      return;
    }
    try {
      const res = await fetch("/api/user-favs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, quote_id: quoteId }),
      });
      if (res.ok) addFavLocal(quoteId);
    } catch (err) {
      console.error("Error adding favorite:", err);
    }
  };

const handleUnfavorite = async (quoteId: string) => {
    if (!quoteId) return;
    if (!userId) {
      removeFavLocal(quoteId);
      return;
    }
    try {
      const res = await fetch("/api/user-favs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, quote_id: quoteId }),
      });
      if (res.ok) removeFavLocal(quoteId);
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };



  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-theme-background">
      <div className="w-full max-w-4xl mx-auto rounded-3xl shadow-2xl tips-main-card flex flex-col h-[90vh] overflow-hidden">
        {/* Header */}
        <div
          className="relative flex items-center w-full px-4"
          style={{ minHeight: 70 }}
        >
          <button
            onClick={handleBackClick}
            className="absolute left-0 top-1/2 -translate-y-1/2 eksplorasi-back-btn flex items-center hover:opacity-70 transition-opacity"
            aria-label="Kembali"
            style={{ padding: 8 }}
          >
            <ChevronLeftIcon className="h-7 w-7 eksplorasi-back-icon" />
          </button>
          <h2 className="w-full text-2xl font-bold text-center tips-title py-4">
            Quotes
          </h2>
        </div>
        <hr className="border-t border-gray-200 mb-6" />

        {/* Scrollable Content */}
        <div className="tips-scrollable-content px-6">
          {/* Header Text */}
          <div className="flex justify-center items-center mb-8 fade-in">
            <div>
              <h1 className="text-2sm font-bold text-primary text-center">
                Bagaimana perasaanmu hari ini?
              </h1>
              <p className="text-muted-foreground text-2sm text-center">
                Pilih mood untuk mendapatkan inspirasi yang sesuai
              </p>
            </div>
          </div>

          {/* Mood Selection Grid */}
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-8 mt-4">
            {moods.map((m: Mood) => (
              <div
                key={m.label}
                className={`
                  card-hover cursor-pointer border-0 shadow-lg fade-in p-3 rounded-lg
                  ${m.color}
                  ${selectedMood?.label === m.label ? "ring-2 ring-primary" : ""}
                `}
                onClick={() => handleMoodClick(m)}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-1">
                    <span className="text-xl">{m.emoji}</span>
                  </div>
                  <h3 className="text-sm font-semibold">{m.label}</h3>
                </div>
              </div>
            ))}
          </div>

          <div ref={quoteRef} className="flex-1 flex flex-col items-center justify-center px-6 pb-8 mt-16">
            {quotes.length > 0 && currentQuote && (
              <div className="w-full max-w-4xl">
                <div className="flex items-center justify-center gap-6">
                  {quotes.length > 1 && (
                    <button
                      className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-all duration-300 hover:scale-110 text-gray-400 hover:text-gray-500"
                      onClick={handlePrev}
                      aria-label="Quote sebelumnya"
                    >
                      <FaArrowAltCircleLeft className="text-xl"   />
                    </button>
                  )}

                  <div className="flex-1 max-w-2xl">
                    <div className="border-0 shadow-lg bg-blue-50/80 backdrop-blur-sm fade-in p-3 rounded-lg">
                      <div className="text-center">
                        <p className="text- muted-foreground leading-relaxed max-w-3xl mx-auto italic">
                          "{currentQuote.text}"
                        </p>
                        <div className="flex items-center justify-between mt-3 pt-1">
                          <button
                            onClick={handleHeartClick}
                            type="button"
                            aria-pressed={isCurrentQuoteFavorited}
                            aria-label={isCurrentQuoteFavorited ? "Hapus dari favorit" : "Tambah ke favorit"}
                            className="
                              flex items-center justify-center
                              w-12 h-12
                              bg-white
                              rounded-full
                              shadow-lg border-2 border-gray-200
                              hover:border-gray-300 hover:bg-gray-50
                              transition-all duration-300
                              hover:scale-110 active:scale-95
                              focus:outline-none focus:ring-2 focus:ring-rose-200
                            "
                          >
                            <FaHeart
                              className={`
                                text-lg transition-all duration-300
                                ${isCurrentQuoteFavorited ? "text-red-500 scale-110" : "text-gray-400 hover:text-red-400"}
                              `}
                            />
                          </button>
                          <div className="flex-1 text-right">
                            <span className="text-sm font-semibold text-primary opacity-80">
                              — {currentQuote.author}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {quotes.length > 1 && (
                    <button
                      className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-all duration-300 hover:scale-110 text-gray-400 hover:text-gray-500"
                      onClick={handleNext}
                      aria-label="Quote selanjutnya"
                    >
                      <FaArrowAltCircleRight className="text-xl" />
                    </button>
                  )}
                </div>

                {quotes.length > 1 && (
                  <div className="flex justify-center mt-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-opacity-80 rounded-full shadow-md">
                      <span className="text-sm text-gray-600 font-medium">
                        {currentIndex + 1} dari {quotes.length}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c49e6c] mb-4"></div>
                <p className="text-[#c49e6c] text-lg font-medium">Memuat kutipan...</p>
              </div>
            )}

            {hasTried && quotes.length === 0 && !loading && selectedMood && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">😔</div>
                <p className="text-gray-500 text-lg text-center">Tidak ada kutipan untuk mood ini.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quotes;
