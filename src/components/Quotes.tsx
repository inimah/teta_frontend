import React, { useState, useEffect } from "react";
import { FaHeart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { FaArrowAltCircleLeft, FaArrowAltCircleRight } from "react-icons/fa";

interface Mood {
  label: string;
  emoji: string;
  category_name: string;
}

interface Quote {
  _id: string;
  text: string;
  author: string;
}

interface FavoriteResponse {
  quote_id: string;
}

const moods: Mood[] = [
  { label: "Sedih", emoji: "😔", category_name: "sedih" },
  { label: "Marah", emoji: "😡", category_name: "marah" },
  { label: "Cemas", emoji: "🥶", category_name: "cemas" },
  {
    label: "Semangat",
    emoji: "😊",
    category_name: "motivasi",
  },
  { label: "Insecure", emoji: "😟", category_name: "insecure" },
  { label: "Self-love", emoji: "💖", category_name: "self-love" },
  { label: "Lucu", emoji: "😂", category_name: "lucu" },
  { label: "Bersyukur", emoji: "🙏", category_name: "bersyukur" },
  { label: "Senang", emoji: "😁", category_name: "senang" },
];

const Quotes: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasTried, setHasTried] = useState<boolean>(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const navigate = useNavigate();
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

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    const fetchFavorites = async (): Promise<void> => {
      if (!userId) return;

      try {
        const res = await fetch(`/api/quotes/user-favs/${userId}`);
        if (res.ok) {
          const data: FavoriteResponse[] = await res.json();
          console.log("Favorites data:", data);
          setFavoriteIds(data.map((fav: FavoriteResponse) => fav.quote_id));
        }
      } catch (err) {
        console.error("Error fetching favorites:", err);
      }
    };

    if (userId) {
      fetchFavorites();
    }
  }, [userId]);

  const fetchQuote = async (categoryName: string): Promise<void> => {
    if (!categoryName) return;
    setLoading(true);
    setHasTried(true);
    try {
      const res = await fetch(`/api/quotes?category_name=${categoryName}`);
      const data: Quote[] = await res.json();
      setQuotes(Array.isArray(data) ? data : [data].filter(Boolean));
      setCurrentIndex(0);
    } catch (err) {
      console.error("Error fetching quotes:", err);
      setQuotes([]);
    }
    setLoading(false);
  };

  const handleFavorite = async (quoteId: string): Promise<void> => {
    if (!userId) {
      // TAMU: hanya update state, tidak simpan ke database
      setFavoriteIds((prev: string[]) => [...prev, quoteId]);
      return;
    }

    try {
      await fetch("/api/user-favs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, quote_id: quoteId }),
      });

      setFavoriteIds((prev: string[]) => [...prev, quoteId]);
    } catch (err) {
      console.error("Error adding favorite:", err);
    }
  };

  const handleUnfavorite = async (quoteId: string): Promise<void> => {
    if (!userId) {
      setFavoriteIds((prev: string[]) => prev.filter((id) => id !== quoteId));
      return;
    }

    try {
      await fetch("/api/user-favs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, quote_id: quoteId }),
      });

      setFavoriteIds((prev: string[]) =>
        prev.filter((id: string) => id !== quoteId)
      );
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  const handlePrev = (): void => {
    setCurrentIndex((prev: number) =>
      prev === 0 ? quotes.length - 1 : prev - 1
    );
  };

  const handleNext = (): void => {
    setCurrentIndex((prev: number) =>
      prev === quotes.length - 1 ? 0 : prev + 1
    );
  };

  const handleHeartClick = (): void => {
    if (quotes.length === 0) return;

    const currentId = quotes[currentIndex]?._id;
    if (!currentId) return;

    if (favoriteIds.includes(currentId)) {
      handleUnfavorite(currentId);
    } else {
      handleFavorite(currentId);
    }
  };
  const handleMoodClick = (mood: Mood): void => {
    setSelectedMood(mood.label);
    setQuotes([]);
    setHasTried(false);
    setCurrentIndex(0);
    fetchQuote(mood.category_name);

    setTimeout(() => {
      if (quoteRef.current) {
        quoteRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    }, 500);
  };

  const currentQuote = quotes[currentIndex];
  const isCurrentQuoteFavorited = currentQuote
    ? favoriteIds.includes(currentQuote._id)
    : false;

  const handleBackClick = () => navigate(-1);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-theme-background">
      <div className="w-full max-w-4xl mx-auto rounded-3xl shadow-2xl bg-white flex flex-col h-[90vh] overflow-auto">
        <div className="sticky top-0 z-20 bg-white pt-6 pb-2 px-6 rounded-t-3xl">
          <div className="flex items-center w-full mb-2">
            <button
              onClick={handleBackClick}
              className="eksplorasi-back-btn flex items-center hover:bg-gray-100 rounded-full transition-all"
              aria-label="Kembali"
              style={{ minWidth: 40, justifyContent: "flex-start" }}
            >
              <ChevronLeftIcon className="h-7 w-7 eksplorasi-back-icon text-gray-400" />
            </button>
          </div>
        </div>
        <div className="flex flex-col w-full px-6">
          <div className="text-center mb-2 ">
            <h1 className="font-bold text-2xl sm:text-3xl quote-judul font-[Quicksand] text-[#c49e6c] leading-tight">
              Bagaimana perasaanmu hari ini?
            </h1>
          </div>
          <div className="flex justify-center w-full mb-16 mt-6">
            <div className="grid grid-cols-3 gap-6 w-full max-w-lg">
              {moods.map((m: Mood) => (
                <button
                  key={m.label}
                  className={`
          flex flex-col items-center justify-center 
          p-4 rounded-2xl border-2 transition-all duration-300
          hover:scale-105 hover:shadow-lg
          ${
            selectedMood === m.label
              ? "border-gray-300 bg-gray-100 shadow-md"
              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
          }
        `}
                  onClick={() => handleMoodClick(m)}
                  type="button"
                >
                  <span className="text-2xl sm:text-3xl mb-2">{m.emoji}</span>
                  <span
                    className={`
            text-xs sm:text-sm font-medium whitespace-nowrap
            ${selectedMood === m.label ? "text-gray-500" : "text-gray-600"}
          `}
                  >
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div
            ref={quoteRef}
            className="flex-1 flex flex-col items-center justify-center px-6 pb-8 mt-16"
          >
            {quotes.length > 0 && currentQuote && (
              <div className="w-full max-w-4xl">
                <div className="flex items-center justify-center gap-6">
                  {quotes.length > 1 && (
                    <button
                      className="
              flex items-center justify-center w-12 h-12 
              bg-white rounded-full shadow-lg border-2 border-gray-200
              hover:border-gray-300 hover:bg-gray-100
              transition-all duration-300 hover:scale-110
              text-gray-400 hover:text-gray-500
            "
                      onClick={handlePrev}
                      aria-label="Quote sebelumnya"
                    >
                      <FaArrowAltCircleLeft className="text-xl" />
                    </button>
                  )}

                  <div
                    className={`
                    flex-1 max-w-2xl min-h-[200px] sm:min-h-[240px]
                    ${cardColor} rounded-3xl shadow-xl border border-white
                    flex flex-col justify-between p-8 sm:p-10
                    transform transition-all duration-500 hover:scale-[1.02]
                  `}
                  >
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-700 text-center italic font-medium">
                        "{currentQuote.text}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4  border-opacity-30">
                      <button
                        onClick={handleHeartClick}
                        className="
                        flex items-center justify-center w-10 h-10 
                        rounded-full  transition-all duration-300
                        hover:scale-110 active:scale-95
                      "
                        aria-label={
                          isCurrentQuoteFavorited
                            ? "Hapus dari favorit"
                            : "Tambah ke favorit"
                        }
                      >
                        <FaHeart
                          className={`
                          text-lg transition-all duration-300
                          ${
                            isCurrentQuoteFavorited
                              ? "text-red-500 scale-110"
                              : "text-gray-400 hover:text-red-400"
                          }
                        `}
                        />
                      </button>

                      <div className="flex-1 text-right">
                        <span
                          className={`
                          text-sm sm:text-base font-semibold
                          ${cardTextColor} opacity-80
                        `}
                        >
                          — {currentQuote.author}
                        </span>
                      </div>
                    </div>
                  </div>

                  {quotes.length > 1 && (
                    <button
                      className="
              flex items-center justify-center w-12 h-12 
              bg-white rounded-full shadow-lg border-2 border-gray-200
              hover:border-gray-300 hover:bg-gray-100
              transition-all duration-300 hover:scale-110
              text-gray-400 hover:text-gray-500
            "
                      onClick={handleNext}
                      aria-label="Quote selanjutnya"
                    >
                      <FaArrowAltCircleRight className="text-xl" />
                    </button>
                  )}
                </div>

                {quotes.length > 1 && (
                  <div className="flex justify-center mt-6">
                    <div className="flex items-center gap-2 px-4 py-2  bg-opacity-80 rounded-full shadow-md">
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
                <p className="text-[#c49e6c] text-lg font-medium">
                  Memuat kutipan...
                </p>
              </div>
            )}
            {hasTried && quotes.length === 0 && !loading && selectedMood && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">😔</div>
                <p className="text-gray-500 text-lg text-center">
                  Tidak ada kutipan untuk mood ini.
                </p>
              </div>
            )}

            {/* Initial State */}
            {!selectedMood && !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-6xl mb-4">✨</div>
                <p className="text-gray-500 text-lg">
                  Pilih mood yang sesuai dengan perasaanmu
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quotes;
