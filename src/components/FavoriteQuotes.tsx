import { useEffect, useState } from "react";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

type Quote = {
  _id: string;
  text: string;
  author: string;
};

type Favorite = {
  _id: string;
  quote_id: Quote;
  user_id: string;
};

const PAGE_SIZE = 4;

const FavoriteQuotes = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId") || "";

  useEffect(() => {
    if (!userId) return;
    fetch(import.meta.env?.VITE_API_URL +  `api/user-favs/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setFavorites(data);
      });
  }, [userId]);

  const totalPages = Math.ceil(favorites.length / PAGE_SIZE);

  useEffect(() => {
    if (page > 0 && page > Math.ceil(favorites.length / PAGE_SIZE) - 1) {
      setPage(0);
    }
  }, [favorites]);

  const startIdx = page * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const pagedFavorites = favorites.slice(startIdx, endIdx);
  const hasNext = page < totalPages - 1;
  const hasPrev = page > 0;

  return (
    <div className="fixed inset-0 bg-theme-background overflow-hidden">
      <div className="h-full flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[88vh] fav-bg rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="relative flex items-center justify-center px-6 pt-6 pb-10">
            <button
              onClick={() => navigate(-1)}
              className="absolute left-6 eksplorasi-back-btn flex items-center hover:opacity-70 transition-opacity"
              aria-label="Kembali"
            >
              <ChevronLeftIcon className="h-7 w-7 eksplorasi-back-icon" />
            </button>
            <h2 className="text-2xl font-bold text-center fav-header-title">
              <span className="fav-header-border">Favorite Quotes</span>
            </h2>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {favorites.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500 text-lg">
                  Belum ada quotes favorit.
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pagedFavorites
                    .filter((fav) => fav.quote_id)
                    .map((fav) => (
                      <div
                        key={fav._id}
                        className="relative fav-quote-card rounded-xl px-6 py-6 flex flex-col items-center hover:scale-105 transition-transform duration-200 min-h-[120px]"
                      >
                        <svg
                          className="absolute left-3 top-3 w-6 h-6 fav-quote-icon"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="..." />
                        </svg>
                        <div className="italic text-sm fav-quote-text text-center mb-2 px-2 leading-relaxed">
                          "{fav.quote_id.text}"
                        </div>
                        <div className="text-right w-full fav-quote-author font-semibold text-sm">
                          — {fav.quote_id.author}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center gap-3 pt-3">
                  <button
                    className="px-4 py-2 rounded fav-btn-prev font-medium text-base disabled:opacity-50"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={!hasPrev}
                  >
                    Prev
                  </button>
                  <span className="fav-pagination-text font-medium text-base">
                    {totalPages === 0 ? 0 : page + 1} / {totalPages}
                  </span>
                  <button
                    className="px-4 py-2 rounded fav-btn-next font-medium text-base disabled:opacity-50"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasNext}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavoriteQuotes;
