import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, User, Sparkles } from "lucide-react";
import {ChevronLeftIcon} from "@heroicons/react/24/outline";

type Question = {
  _id: string;
  question: string;
  options: string[];
  enable: boolean;
};

const Pertanyaan: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [sapaan, setSapaan] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("Guest");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string; }>({});
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const totalQuestions = questions.length;

  // >>> mapping teks opsi → skor 0..3
  const SCORE_MAP: Record<string, number> = {
    "Tidak pernah": 0,
    "Kadang-kadang": 1,
    "Sering": 2,
    "Hampir setiap hari": 3,
  };

  // >>> state untuk kondisi khusus self-harm Q7
  const [isSelfHarmHigh, setIsSelfHarmHigh] = useState<boolean>(false);

  const goPrev = () => setCurrentQuestion((c) => Math.max(0, c - 1));
  const goNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((c) => c + 1);
    } else {
      // last question => submit
      handleSubmit();
    }
  };

  const hasAnswerForCurrent =
    selectedAnswers[currentQuestion] !== undefined &&
    selectedAnswers[currentQuestion] !== null &&
    selectedAnswers[currentQuestion] !== "";

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedGuestName = localStorage.getItem("guestName") || "Guest";

    if (!token) {
      setGuestName(storedGuestName);
    } else {
      axios
        .get("http://localhost:5000/api/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          if (response.data.status) {
            const userFromResponse = response.data.user;
            setSapaan(userFromResponse?.sapaan || "");
            localStorage.setItem("userId", userFromResponse._id);
          } else {
            navigate("/");
          }
        })
        .catch((err) => {
          console.log(err);
          navigate("/");
        });
    }

    axios
      .get("http://localhost:5000/api/questions")
      .then((response) => {
        if (response.data.status) {
          setQuestions(response.data.questions);
        } else {
          console.error("Failed to fetch questions");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, [navigate]);

  // >>> helper: hitung total skor & interpretasi
  const computeScoreAndFlags = () => {
    // total skor 0..21 (7 pertanyaan * 0..3)
    const totalScore = questions.reduce((sum, q, idx) => {
      const ans = selectedAnswers[idx];
      const s = SCORE_MAP[ans ?? ""] ?? 0;
      return sum + s;
    }, 0);

    let interpretation = "Kondisimu terlihat cukup stabil hari ini 😊"; // 0–4
    if (totalScore >= 5 && totalScore <= 9) {
      interpretation = "Ada beberapa hal yang bikin kamu kepikiran 🌥️";
    } else if (totalScore >= 10 && totalScore <= 14) {
      interpretation = "Sepertinya harimu cukup berat, yuk istirahat sejenak 🌀";
    } else if (totalScore >= 15) {
      interpretation = "Kamu nggak sendiri. Cerita yuk, aku siap bantu kapan aja 🤝";
    }

    // Q7 = index 6. Cek “Sering” (2) atau “Hampir setiap hari” (3).
    const q7Ans = selectedAnswers[6];
    const q7Score = SCORE_MAP[q7Ans ?? ""] ?? 0;
    const selfHarmHigh = q7Score >= 2;

    return { totalScore, interpretation, selfHarmHigh };
  };

  const handleSubmit = () => {
    const token = localStorage.getItem("authToken");

    // >>> evaluasi skor & flag khusus
    const { totalScore, interpretation, selfHarmHigh } = computeScoreAndFlags();
    setIsSelfHarmHigh(selfHarmHigh);

    // >>> simpan notice untuk halaman chat (bisa dipakai oleh chatbot)
    if (selfHarmHigh) {
      localStorage.setItem("notice:selfharm", "1");
    } else {
      localStorage.removeItem("notice:selfharm");
    }

    if (!token) {
      setShowSuccessPopup(true);
      return;
    }

    const session_id = localStorage.getItem("userId");
    const responses = questions.map((question, index) => ({
      question_id: question._id,
      answer: selectedAnswers[index] || null, // kirim teks jawaban seperti semula
      // >>> opsional: ikutkan skor numerik agar BE bisa pakai
      score: SCORE_MAP[selectedAnswers[index] || ""] ?? 0,
    }));

    axios
      .post(
        "http://localhost:5000/api/results/save",
        {
          session_id,
          responses,
          // >>> opsional: ringkasan
          totalScore,
          interpretation,
          selfHarmHigh,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        if (response.data.message === "Hasil berhasil disimpan") {
          setShowSuccessPopup(true);
        } else {
          console.error("Gagal menyimpan hasil");
          setShowSuccessPopup(true); // tetap tampilkan ringkasan FE
        }
      })
      .catch((err) => {
        console.error(err);
        setShowSuccessPopup(true); // tetap tampilkan ringkasan FE
      });
  };

  const handlePopupClose = () => {
    const isGuest = !localStorage.getItem("authToken");
    // >>> arahkan dengan query jika perlu ditangkap chatbot
    const target = isGuest ? "/tamu" : (isSelfHarmHigh ? "/chat?notice=selfharm" : "/chat");
    navigate(target);
  };

  const handleBackToMenu = () => {
    const isGuest = !localStorage.getItem("authToken");
    const target = isGuest ? "/tamu" : (isSelfHarmHigh ? "/chat?notice=selfharm" : "/chat");
    navigate(target);
  };

  // >>> tampilkan ringkasan skor & interpretasi di popup
  const { totalScore, interpretation } = (() => {
    if (questions.length === 0) return { totalScore: 0, interpretation: "" };
    return computeScoreAndFlags();
  })();

  return (
    <div className="pertanyaan min-h-screen w-full bg-theme-backgound relative overflow-hidden">
      {/* Fixed Content Container */}
      <div className="fixed inset-0 z-10 flex items-center justify-center p-2">
        <div className="w-full max-w-4xl mx-auto h-[90vh] flex flex-col ">
          <div className="bg-card rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col">
            {/* Greeting Section */}
            <div className="p-4 text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 ml-4 mt-4 z-20">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center hover:opacity-70 transition-opacity mr-4" aria-label="Kembali">
                  <ChevronLeftIcon className="h-7 w-7 text-gray-800" />
                </button>
              </div>
              <div className="absolute top-0 right-0 w-16 h-16 bg-header-gradient2 rounded-full -mr-8 -mt-8"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-header-gradient2 rounded-full -ml-12 -mb-12"></div>
              <div className="relative z-10 flex items-center gap-4 ml-16">
                <div>
                  <h2 className="text-xl font-bold text-gray-600">
                    Hai, {sapaan || guestName}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    Selamat datang di evaluasi kesehatan mental
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
              {/* Instructions */}
              <div className="mb-6 relative">
                <div className="bg-instruction-card rounded-xl p-6 border relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full -mr-5 -mt-5"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-1 mb-2">
                      <div className="p-2 icon-container-primary rounded-lg shadow-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-lg font-medium text-neutral-800">
                        Petunjuk
                      </h2>
                    </div>
                    <p className="text-sm leading-relaxed">
                      Baca setiap pertanyaan dengan cermat dan beri tanda (✓)
                      pada pilihan yang paling menggambarkan perasaanmu dalam 2
                      minggu terakhir. Jawablah dengan jujur.
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress + Single question */}
              <div className="mb-4">
                {/* Progress bar */}
                {totalQuestions > 0 && (
                  <div className="mb-4">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Pertanyaan {currentQuestion + 1} dari {totalQuestions}
                    </div>
                  </div>
                )}

                {totalQuestions > 0 && (
                  <div className="group">
                    <div className="bg-white rounded-xl border border-gray-100 transition-all duration-300 overflow-hidden">
                      <div className="bg-question-header px-3 py-1 border-b">
                        <h3 className="font-medium text-sm text-neutral-800 flex items-center gap-4">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                            {currentQuestion + 1}
                          </div>
                          <span className="inline-block">
                            {questions[currentQuestion].question}
                          </span>
                        </h3>
                      </div>

                      <div className="p-6">
                        <div className="flex flex-wrap gap-2">
                          {questions[currentQuestion].options.map((option, optionIndex) => {
                            const checked = selectedAnswers[currentQuestion] === option;
                            return (
                              <label
                                key={optionIndex}
                                className={`w-full sm:w-1/2 lg:w-1/3 group/option flex text-xs text-gray-600 items-center p-2 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${checked ? "option-selected shadow-lg" : "option-default"
                                  }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${currentQuestion}`}
                                  value={option}
                                  checked={checked}
                                  onChange={() => handleAnswerChange(currentQuestion, option)}
                                  className="sr-only"
                                />
                                <div
                                  className={`relative w-5 h-5 rounded-full border-2 mr-2 flex items-center justify-center transition-all duration-300 ${checked ? "radio-selected shadow-lg" : "radio-default"
                                    }`}
                                >
                                  {checked && (
                                    <div className="w-2 h-2 bg-white rounded-full animate-scale-in" />
                                  )}
                                  <div className={`absolute inset-0 rounded-full ${checked ? "radio-ring" : ""}`} />
                                </div>
                                <span className={`font-medium ${checked ? "text-accent" : "text-neutral"}`}>
                                  {option}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons (paged nav) */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">

                <div></div>
                {/* Prev / Next (right) */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={goPrev}
                    disabled={currentQuestion === 0}
                    className={`px-4 py-2 rounded-xl border transition ${currentQuestion === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                      }`}
                  >
                    Sebelumnya
                  </button>

                  <button
                    onClick={goNext}
                    disabled={!hasAnswerForCurrent}
                    className={`flex items-center gap-3 px-5 py-2.5 rounded-xl
    text-white text-sm md:text-base font-bold tracking-wide
    bg-blue-600 hover:bg-blue-700 active:bg-blue-800
    shadow-md hover:shadow-lg
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2
    ${!hasAnswerForCurrent ? "opacity-70 cursor-not-allowed bg-blue-400 hover:bg-blue-400 shadow-none" : ""}
  `}
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>{currentQuestion < totalQuestions - 1 ? "Berikutnya" : "Kirim Jawaban"}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full transform transition-all scale-100 border border-gray-100 overflow-hidden">
            <div className="success-popup-bg p-1">
              <div className="bg-white rounded-3xl">
                <div className="p-8 text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 success-icon-bg rounded-full flex items-center justify-center mx-auto shadow-2xl">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -inset-4 success-ping rounded-full animate-ping"></div>
                  </div>
                  <h2 className="text-3xl font-bold text-neutral-800 mb-2">
                    Berhasil!
                  </h2>

                  {/* >>> Ringkasan skor & interpretasi */}
                  <p className="text-neutral-700 mb-1 text-sm">
                    Skor kamu hari ini: <b>{totalScore}</b>
                  </p>
                  <p className="text-neutral-600 mb-4 text-sm">
                    {interpretation}
                  </p>

                  {/* >>> Pesan khusus jika Q7 = 2 atau 3 */}
                  {isSelfHarmHigh && (
                    <div className="text-left mb-6 p-3 rounded-xl border-2 border-rose-200 bg-rose-50">
                      <p className="text-sm text-rose-700">
                        <b>Kamu penting dan berharga.</b> Kalau kamu lagi merasa pengin nyakitin diri, coba tarik napas dulu. Aku sarankan untuk bicara dengan orang yang bisa dipercaya, atau hubungi bantuan profesional.
                      </p>
                    </div>
                  )}

                  <button
                    className="w-full bg-success-gradient hover:bg-success-gradient:hover text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    onClick={handlePopupClose}
                  >
                    Lanjutkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pertanyaan;
