import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  ChevronLeftIcon,
  BookOpenIcon,
  MusicalNoteIcon,
  MicrophoneIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

const Eksplorasi: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
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
          setName(userFromResponse?.name || "");
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
        <div className="eksplorasi-container w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
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
            <h2 className="text-xl font-bold eksplorasi-title">
              Hay, {name || guestName}
            </h2>
            <div className="w-6"></div>
          </div>

          {/* Content Section */}
          <div className="flex-1 eksplorasi-section flex items-center justify-center p-8">
            <div className="eksplorasi-grid grid grid-cols-3 grid-rows-2 gap-8">
              {/* Card 1 - Tips Harian Kesehatan */}
              <div
                className="eksplorasi-card w-36 h-36 flex flex-col items-center justify-center cursor-pointer group"
                onClick={() => handleCardClick("/tips-harian")}
                style={{ gridColumn: 1, gridRow: 1 }}
              >
                <div className="eksplorasi-icon-bg eksplorasi-icon-bg-yellow p-4 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                  <BookOpenIcon className="h-8 w-8 eksplorasi-icon" />
                </div>
                <span className="text-center font-medium text-xs eksplorasi-text leading-tight">
                  Tips harian kesehatan
                </span>
              </div>

              {/* Card 2 - Panduan Pernapasan */}
              <div
                className="eksplorasi-card w-36 h-36 flex flex-col items-center justify-center cursor-pointer group"
                onClick={() => handleCardClick("/panduan-pernapasan")}
                style={{ gridColumn: 3, gridRow: 1 }}
              >
                <div className="eksplorasi-icon-bg eksplorasi-icon-bg-pink p-4 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                  <HeartIcon className="h-8 w-8 eksplorasi-icon" />
                </div>
                <span className="text-center font-medium text-xs eksplorasi-text leading-tight">
                  Panduan Pernapasan
                </span>
              </div>

              {/* Card 3 - Musik Relaksasi */}
              <div
                className="eksplorasi-card w-36 h-36 flex flex-col items-center justify-center cursor-pointer group"
                onClick={() => handleCardClick("/musik-relaksasi")}
                style={{ gridColumn: 1, gridRow: 2 }}
              >
                <div className="eksplorasi-icon-bg eksplorasi-icon-bg-red p-4 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                  <MusicalNoteIcon className="h-8 w-8 eksplorasi-icon" />
                </div>
                <span className="text-center font-medium text-xs eksplorasi-text leading-tight">
                  Musik Relaksasi
                </span>
              </div>

              {/* Card 4 - Cek Kondisi Mental */}
              <div
                className="eksplorasi-card w-36 h-36 flex flex-col items-center justify-center cursor-pointer group"
                onClick={() => handleCardClick("/cek-kondisi-mental")}
                style={{ gridColumn: 3, gridRow: 2 }}
              >
                <div className="eksplorasi-icon-bg eksplorasi-icon-bg-green p-4 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                  <MicrophoneIcon className="h-8 w-8 eksplorasi-icon" />
                </div>
                <span className="text-center font-medium text-xs eksplorasi-text leading-tight">
                  Cek Kondisi Mental
                </span>
              </div>

              {/* Card 5 - Quotes (Center, taller) */}
              <div
                className="eksplorasi-card w-36 h-44 flex flex-col items-center justify-center cursor-pointer group"
                onClick={() => handleCardClick("/quotes")}
                style={{ gridColumn: 2, gridRow: "1 / 3" }}
              >
                <div className="eksplorasi-icon-bg eksplorasi-icon-bg-teal p-4 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 eksplorasi-icon" />
                </div>
                <span className="text-center font-medium text-xs eksplorasi-text leading-tight">
                  Quotes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Eksplorasi;
