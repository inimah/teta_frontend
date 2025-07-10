import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../themes/flower.css";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
type Tip = {
  id: string;
  judul: string;
  kategori: string;
  tags: string;
  isi_konten: string;
  sumber: string;
  source_link?: string;
};

const TipsKesehatan: React.FC = () => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [_loading, setLoading] = useState(true);
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const navigate = useNavigate();
  const [_selectedTipIdx, setSelectedTipIdx] = useState<number | null>(null);
  const ICONS = ["🍎", "🏃", "💡", "🧘", "🌞", "🌙", "🚴", "🥗", "😄", "📚"];
  const [theme] = useState<"netral" | "girly">("netral");
  const CARD_COLORS_NETRAL = [
    "card-netral-0",
    "card-netral-1",
    "card-netral-2",
    "card-netral-3",
    "card-netral-4",
  ];
  const CARD_COLORS_GIRLY = [
    "card-flower-0",
    "card-flower-1",
    "card-flower-2",
    "card-flower-3",
    "card-flower-4",
  ];
  const CARD_COLORS =
    theme === "girly" ? CARD_COLORS_GIRLY : CARD_COLORS_NETRAL;
  // const CARD_COLORS = [
  //   "bg-yellow-100 border-yellow-300",
  //   "bg-pink-100 border-pink-300",
  //   "bg-lime-100 border-lime-300",
  //   "bg-blue-100 border-blue-300",
  //   "bg-purple-100 border-purple-300",
  //   "bg-orange-100 border-orange-300",
  //   "bg-fuchsia-100 border-fuchsia-300",
  //   "bg-cyan-100 border-cyan-300",
  //   "bg-lime-100 border-lime-300",
  //   "bg-rose-100 border-rose-300",
  // ];

  useEffect(() => {
    fetch("http://localhost:5000/api/contents")
      .then((res) => res.json())
      .then((data) => {
        // Filter hanya yang flag: true
        const filtered = data.filter((item: any) => item.flag === true);
        const mapped = filtered.map((item: any) => ({
          id: item._id,
          judul: item.title,
          kategori: item.category_id?.name || "-",
          tags: Array.isArray(item.tags)
            ? item.tags.join(",")
            : item.tags || "",
          isi_konten: item.content,
          sumber: item.source,
          source_link: item.source_link,
        }));
        setTips(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  function stripHtml(html: string) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }
  const handleBackClick = () => navigate(-1);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-theme-background">
      <div className="w-full max-w-4xl mx-auto rounded-3xl shadow-2xl tips-main-card flex flex-col h-[90vh] overflow-hidden">
        {/* Header dengan icon back di kiri judul */}
        {/* Header dengan icon back di tengah kiri dan judul di tengah */}
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
            Tips Harian Kesehatan
          </h2>
        </div>
        <hr className="border-t border-gray-200 mb-6" />

        {/* Konten grid scrollable dengan container yang lebih terpusat */}
        <div className="tips-scrollable-content px-6">
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 justify-items-center tips-grid-fade max-w-[700px]">
              {tips.length === 0 && (
                <div className="text-gray-500 text-center w-full text-xs col-span-full">
                  Belum ada tips.
                </div>
              )}
              {tips.map((tip, idx) => (
                <div
                  key={tip.id}
                  className={`
                  ${CARD_COLORS[idx % CARD_COLORS.length]}
                  rounded-xl shadow-lg p-3 w-full max-w-[200px] sm:max-w-[210px]
                  flex flex-col items-center tips-card cursor-pointer
                  mx-auto
                `}
                  onClick={() => {
                    setSelectedTip(tip);
                    setSelectedTipIdx(idx);
                  }}
                  style={{ minHeight: 170 }}
                >
                  {/* Icon besar */}
                  <span className="text-lg mb-1">
                    {ICONS[idx % ICONS.length]}
                  </span>
                  {/* Judul */}
                  <h4 className="text-xs font-medium tips-judul mb-1 text-center leading-snug">
                    {tip.judul}
                  </h4>
                  {/* Kategori & Sumber */}
                  <div className="text-xs text-gray-500 mb-1 flex justify-between w-full">
                    <span className="italic">{tip.kategori}</span>
                    <span className="italic">{tip.sumber}</span>
                  </div>
                  {/* Konten singkat */}
                  <div
                    className="text-gray-700 mb-2 overflow-hidden text-ellipsis text-center text-xs"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      whiteSpace: "normal",
                      minHeight: "2.5em",
                    }}
                  >
                    {stripHtml(tip.isi_konten).length > 60
                      ? stripHtml(tip.isi_konten).slice(0, 60) + "..."
                      : stripHtml(tip.isi_konten)}
                  </div>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-auto justify-center">
                    {tip.tags.split(",").map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className={`
                        px-1.5 py-0.5 rounded-full text-[10px] font-medium
                        tag-color-${(tIdx % 3) + 1}
                      `}
                      >
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedTip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-theme-background bg-opacity-70">
            <div
              className="tips-detail relative detail-bg rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl mx-auto my-8"
              style={{ minHeight: 420, maxHeight: "90vh" }}
            >
              <button
                className="absolute top-4 right-4 detail-close-btn text-sm"
                onClick={() => setSelectedTip(null)}
                aria-label="Tutup"
              >
                ❌
              </button>
              <div
                className="flex flex-col items-center px-8 py-8 overflow-y-auto"
                style={{ maxHeight: "80vh" }}
              >
                <span className="text-3xl mb-2 ">
                  {
                    ICONS[
                      tips.findIndex((tip) => tip.id === selectedTip?.id) %
                        ICONS.length
                    ]
                  }
                </span>

                <h4 className="text-xl font-bold detail-title tracking-tight text-center mb-2">
                  {selectedTip.judul}
                </h4>

                <div className="text-sm detail-kat-text mb-2 flex flex-col sm:flex-row justify-center gap-2 text-center">
                  <span className="italic">
                    Kategori: {selectedTip.kategori}
                  </span>
                  <span className="italic">
                    Sumber :
                    {selectedTip.source_link ? (
                      <a
                        href={selectedTip.source_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="detail-link underline"
                      >
                        {selectedTip.sumber}
                      </a>
                    ) : (
                      selectedTip.sumber
                    )}
                  </span>
                </div>

                <div
                  className="flower-content mb-3 whitespace-pre-line flex-1 leading-relaxed text-center"
                  dangerouslySetInnerHTML={{ __html: selectedTip.isi_konten }}
                />

                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {selectedTip.tags.split(",").map((tag, idx) => (
                    <span
                      key={idx}
                      className={`flower-tag flower-tag-${(idx % 5) + 1}`}
                    >
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TipsKesehatan;
