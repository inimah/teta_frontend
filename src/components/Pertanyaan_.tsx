import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, User, Sparkles } from "lucide-react";

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
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: string;
  }>({});
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [condition, setCondition] = useState<string>("");
  const [specialMessage, setSpecialMessage] = useState<string>("");
  const totalQuestions = questions.length;

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

  const calculateScore = () => {
    let score = 0;
    questions.forEach((question, index) => {
      const answer = selectedAnswers[index];
      if (answer) {
        const optionIndex = question.options.indexOf(answer);
        if (optionIndex !== -1) {
          score += optionIndex;
        }
      }
    });
    setTotalScore(score);

    let cond = "";
    if (score <= 4) {
      cond = "Kondisimu terlihat cukup stabil hari ini 😊";
    } else if (score <= 9) {
      cond = "Ada beberapa hal yang bikin kamu kepikiran 🌥️";
    } else if (score <= 14) {
      cond = "Sepertinya harimu cukup berat, yuk istirahat sejenak 🌀";
    } else {
      cond = "Kamu nggak sendiri. Cerita yuk, aku siap bantu kapan aja 🤝";
    }
    setCondition(cond);

    // Check last question
    const lastIndex = totalQuestions - 1;
    const lastAnswer = selectedAnswers[lastIndex];
    if (lastAnswer) {
      const lastOptionIndex = questions[lastIndex].options.indexOf(lastAnswer);
      if (lastOptionIndex >= 2) {
        setSpecialMessage("Kamu penting dan berharga. Kalau kamu lagi merasa pengin nyakitin diri, coba tarik napas dulu. Aku sarankan untuk bicara dengan orang yang bisa dipercaya, atau hubungi bantuan profesional.");
      } else {
        setSpecialMessage("");
      }
    }
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

  const handleSubmit = () => {
    calculateScore();

    const token = localStorage.getItem("authToken");

    if (!token) {
      setShowSuccessPopup(true);
      return;
    }

    const session_id = localStorage.getItem("userId");
    const responses = questions.map((question, index) => ({
      question_id: question._id,
      answer: selectedAnswers[index] || null,
    }));

    axios
      .post(
        "http://localhost:5000/api/results/save",
        { session_id, responses },
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
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handlePopupClose = () => {
    const isGuest = !localStorage.getItem("authToken");
    if (isGuest) {
      navigate("/tamu");
    } else {
      navigate("/chat");
    }
  };

  const handleBackToMenu = () => {
    const isGuest = !localStorage.getItem("authToken");
    if (isGuest) {
      navigate("/tamu");
    } else {
      navigate("/chat");
    }
  };

  return (
    <div className="pertanyaan min-h-screen w-full bg-theme-backgound relative overflow-hidden">
      {/* Fixed Content Container */}
      <div className="fixed inset-0 z-10 flex items-center justify-center p-2">
        <div className="w-full max-w-4xl mx-auto h-[90vh] flex flex-col ">
          <div className="bg-card rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col">
            {/* Greeting Section */}
            <div className="bg-header-gradient p-4 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-header-gradient"></div>
              <div className="absolute top-0 right-0 w-16 h-16 bg-header-gradient2 rounded-full -mr-8 -mt-8"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-header-gradient2 rounded-full -ml-12 -mb-12"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="p-3 icon-container-user rounded-full">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
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

              {/* Questions */}
              {/* <div className="space-y-2 mb-4">
                {questions.map((question, index) => (
                  <div key={index} className="group">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                      <div className="bg-question-header px-3 py-1 border-b">
                        <h3 className="font-medium text-sm text-neutral-800 flex items-center gap-4">
                          <div className="flex-shrink-0 w-6 h-6 icon-container-number text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                            {index + 1}
                          </div>
                          <span className="inline-block">
                            {question.question}
                          </span>
                        </h3>
                      </div>

                      <div className="p-6">
                        <div className="flex flex-col items-start gap-2">
                          {question.options.map((option, optionIndex) => (
                            <label
                              key={optionIndex}
                              className={`w-1/3 group/option flex text-xs text-gray-600 items-center p-2 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${selectedAnswers[index] === option
                                  ? "option-selected shadow-lg"
                                  : "option-default hover:option-default:hover"
                                }`}
                            >
                              <input
                                type="radio"
                                name={`question-${index}`}
                                value={option}
                                checked={selectedAnswers[index] === option}
                                onChange={() =>
                                  handleAnswerChange(index, option)
                                }
                                className="sr-only"
                              />
                              <div
                                className={`relative w-5 h-5 rounded-full border-2 mr-2 flex items-center justify-center transition-all duration-300 ${selectedAnswers[index] === option
                                    ? "radio-selected shadow-lg"
                                    : "radio-default group-hover/option:radio-default:hover"
                                  }`}
                              >
                                {selectedAnswers[index] === option && (
                                  <div className="w-2 h-2 bg-white rounded-full animate-scale-in"></div>
                                )}
                                <div
                                  className={`absolute inset-0 rounded-full transition-all duration-300 ${selectedAnswers[index] === option
                                      ? "radio-ring"
                                      : ""
                                    }`}
                                ></div>
                              </div>
                              <span
                                className={`font-medium transition-colors duration-200 ${selectedAnswers[index] === option
                                    ? "text-accent"
                                    : "text-neutral group-hover/option:text-accent"
                                  }`}
                              >
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div> */}

              {/* Questions (single, paged) */}
              <div className="mb-4">
                {/* Progress bar */}
                {totalQuestions > 0 && (
                  <div className="mb-4">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
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
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                      <div className="bg-question-header px-3 py-1 border-b">
                        <h3 className="font-medium text-sm text-neutral-800 flex items-center gap-4">
                          <div className="flex-shrink-0 w-6 h-6 icon-container-number text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
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


              {/* Action Buttons */}
              {/* <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <button onClick={handleBackToMenu}>
                  <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                </button>

                <button
                  className="group flex items-center gap-3 bg-button-primary-gradient hover:bg-button-primary-gradient:hover text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 relative overflow-hidden"
                  onClick={handleSubmit}
                >
                  <div className="absolute inset-0 bg-white translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                  <CheckCircle className="h-5 w-5 relative z-10" />
                  <span className="relative z-10">Submit Jawaban</span>
                </button>
              </div> */}

              {/* Action Buttons (paged nav) */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                {/* Back to menu (left) */}
                <button onClick={handleBackToMenu} className="p-2 rounded-xl hover:bg-gray-50">
                  <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                </button>

                {/* Prev / Next (right) */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={goPrev}
                    disabled={currentQuestion === 0}
                    className={`px-4 py-2 rounded-xl border transition ${currentQuestion === 0
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-50"
                      }`}
                  >
                    Sebelumnya
                  </button>

                  <button
                    onClick={goNext}
                    disabled={!hasAnswerForCurrent}
                    className={`group flex items-center gap-3 bg-button-primary-gradient hover:bg-button-primary-gradient:hover text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 relative overflow-hidden ${!hasAnswerForCurrent ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                  >
                    <div className="absolute inset-0 bg-white translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                    <CheckCircle className="h-5 w-5 relative z-10" />
                    <span className="relative z-10">
                      {currentQuestion < totalQuestions - 1 ? "Berikutnya" : "Kirim Jawaban"}
                    </span>
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
                  <h2 className="text-3xl font-bold text-neutral-800 mb-3">
                    Berhasil!
                  </h2>
                  <p className="text-neutral-light mb-4 text-lg">
                    Terima kasih telah mengisi kuesioner dengan jujur
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600 mb-2">
                        Skor Total: {totalScore}
                      </div>
                      <p className="text-neutral-700 mb-2">
                        {condition}
                      </p>
                      {specialMessage && (
                        <p className="text-red-600 text-sm mt-4 p-3 bg-red-50 rounded-lg">
                          {specialMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    className="w-full bg-success-gradient text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg"
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
