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
  const [name, setName] = useState<string>("");
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
    <div className="min-h-screen gradient-bg p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-start items-center mb-8 fade-in">
          <button
            onClick={handleBackClick}
            className="flex items-center hover:opacity-70 transition-opacity mr-4"
            aria-label="Kembali"
          >
            <ChevronLeftIcon className="h-7 w-7 text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-primary">
              Hai, {sapaan || guestName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Pilih fitur yang ingin kamu gunakan hari ini
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            className="card-hover cursor-pointer border-0 shadow-lg bg-yellow-50 hover:bg-yellow-100 fade-in p-6 rounded-lg"
            onClick={() => handleCardClick("/tips-harian")}
          >
            <div className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <BookOpenIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-base font-semibold">Tips harian kesehatan</h3>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Langkah kecil setiap hari untuk hidup lebih sehat</p>
            </div>
          </div>

          <div
            className="card-hover cursor-pointer border-0 shadow-lg bg-pink-50 hover:bg-pink-100 fade-in p-6 rounded-lg"
            onClick={() => handleCardClick("/panduan-pernapasan")}
          >
            <div className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <HeartIcon className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-base font-semibold">Panduan Pernapasan</h3>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Atur napasmu, tenangkan pikiranmu</p>
            </div>
          </div>

          <div
            className="card-hover cursor-pointer border-0 shadow-lg bg-red-50 hover:bg-red-100 fade-in p-6 rounded-lg"
            onClick={() => handleCardClick("/musik-relaksasi")}
          >
            <div className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <MusicalNoteIcon className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-base font-semibold">Musik Relaksasi</h3>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Irama lembut untuk menenangkan jiwa</p>
            </div>
          </div>

          <div
            className="card-hover cursor-pointer border-0 shadow-lg bg-teal-50 hover:bg-teal-100 fade-in p-6 rounded-lg"
            onClick={() => handleCardClick("/quotes")}
          >
            <div className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-base font-semibold">Quotes</h3>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Inspirasi sesuai suasana hatimu</p>
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div className="mt-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm fade-in p-6 rounded-lg">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4 text-primary">Tentang TETA</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              TETA – Teman Cerita adalah ruang aman tempat setiap suara didengar tanpa rasa takut dihakimi.
              Seperti gelombang theta yang menenangkan, TETA hadir sebagai sahabat yang selalu siap mendampingi, memberi kehangatan, dan menghadirkan ketenangan di tengah riuh pikiran.
              Di sini, setiap cerita bernilai, setiap rasa dihargai, dan setiap hati berhak menemukan damai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Eksplorasi;
