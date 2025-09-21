import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeftIcon,
  BookOpenIcon,
  MusicalNoteIcon,
  // MicrophoneIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

const Eksplorasi: React.FC = () => {
  const navigate = useNavigate();
  const [sapaan, setSapaan] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("Guest");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedGuestName = localStorage.getItem("guestName") || "Guest";

    if (!token) {
      setGuestName(storedGuestName);
      axios
        .get("http://localhost:5000/api/content?flag=true")
        .catch((err) => console.log(err));
      return;
    }

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
  }, []);

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="main-bg flex h-screen w-screen">
      {/* Centered Container like Chat Page */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="eksplorasi-container w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="eksplorasi-header flex justify-between items-center p-6">
            {/* Back Button */}
            <button
              onClick={handleBackClick}
              className="eksplorasi-back-btn flex items-center hover:opacity-70 transition-opacity"
              aria-label="Kembali"
            >
              <ChevronLeftIcon className="h-7 w-7 eksplorasi-back-icon text-gray-500" />
            </button>
            <h2 className="text-xl font-bold eksplorasi-title"> Hai, {sapaan || guestName} </h2>
            <div className="w-6"></div>
          </div>

          {/* Content Section */}
          <div className="flex-1 eksplorasi-section flex flex-col items-center justify-center p-8 overflow-x-auto space-y-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0.5 w-full max-w-6xl">
              {/* Card 1 - Tips Harian Kesehatan */}
              <div
                className="eksplorasi-card w-64 h-44 flex flex-col items-center justify-center cursor-pointer group border border-gray-200 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow px-4"
                onClick={() => handleCardClick("/tips-harian")}
              >
                <div className="text-center pb-2">
                  <div className="flex justify-center mb-4">
                    <div className="eksplorasi-icon-bg eksplorasi-icon-bg-yellow p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
                      <BookOpenIcon className="h-8 w-8 eksplorasi-icon" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold">Tips Harian Kesehatan</h3>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Langkah kecil setiap hari untuk hidup lebih sehat</p>
                </div>
              </div>

              {/* Card 2 - Panduan Pernapasan */}
              <div
                className="eksplorasi-card w-64 h-44 flex flex-col items-center justify-center cursor-pointer group border border-gray-200 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow px-4"
                onClick={() => handleCardClick("/panduan-pernapasan")}
              >
                <div className="text-center pb-2">
                  <div className="flex justify-center mb-4">
                    <div className="eksplorasi-icon-bg eksplorasi-icon-bg-pink p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
                      <HeartIcon className="h-8 w-8 eksplorasi-icon" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold">Panduan Pernapasan</h3>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Atur napasmu, tenangkan pikiranmu</p>
                </div>
              </div>

              {/* Card 3 - Musik Relaksasi */}
              <div
                className="eksplorasi-card w-64 h-44 flex flex-col items-center justify-center cursor-pointer group border border-gray-200 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow px-4"
                onClick={() => handleCardClick("/musik-relaksasi")}
              >
                <div className="text-center pb-2">
                  <div className="flex justify-center mb-4">
                    <div className="eksplorasi-icon-bg eksplorasi-icon-bg-red p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
                      <MusicalNoteIcon className="h-8 w-8 eksplorasi-icon" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold">Musik Relaksasi</h3>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Irama lembut untuk menenangkan jiwa</p>
                </div>
              </div>

              {/* Card 4 - Quotes */}
              <div
                className="eksplorasi-card w-64 h-44 flex flex-col items-center justify-center cursor-pointer group border border-gray-200 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow px-4"
                onClick={() => handleCardClick("/quotes")}
              >
                <div className="text-center pb-2">
                  <div className="flex justify-center mb-4">
                    <div className="eksplorasi-icon-bg eksplorasi-icon-bg-teal p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
                      <ChatBubbleLeftRightIcon className="h-8 w-8 eksplorasi-icon" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold">Quotes</h3>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Inspirasi sesuai suasana hatimu</p>
                </div>
              </div>
            </div>

            {/* Content Box */}
            <div className="w-full bg-white rounded-xl shadow-md p-6 eksplorasi-content-box">
              <h3 className="text-lg font-semibold mb-2 text-center">Tentang TETA</h3>
              <p className="text-sm text-gray-600 leading-relaxed text-center">
                TETA – Teman Cerita adalah ruang aman tempat setiap suara didengar tanpa rasa takut dihakimi. Seperti dari gelombang theta yang menenangkan, TETA hadir sebagai sahabat yang selalu siap mendampingi, memberi kehangatan, dan menghadirkan ketenangan di tengah riuh pikiran. Di sini, setiap cerita bernilai, setiap rasa dihargai, dan setiap hati berhak menemukan damai.
                {/* TETA (Teman Cerita) adalah aplikasi pendamping yang siap menemani kamu berbagi cerita kapan saja. TETA mendengarkan tanpa menghakimi agar kamu merasa lebih lega dengan beberapa fitur yang tersedia. */}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Eksplorasi;
