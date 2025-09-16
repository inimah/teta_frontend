import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { applyTheme } from "../themes/applyTheme";
import { motion } from "framer-motion";

const ConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "email Anda";

  useEffect(() => {
    const theme = localStorage.getItem("theme") || "netral";
    applyTheme(theme);
  }, []);

  const handleLoginClick = () => {
    navigate("/");
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen min-w-full main-bg">
      <div className="absolute inset-0 -z-10 main-bg" />

      <motion.div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 register-card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center">
          {/* Icon Success */}
          <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-4 text-center">
            Registrasi Berhasil!
          </h1>

          <p className="text-gray-700 text-center mb-6 text-sm leading-relaxed">
            Kami telah mengirimkan email konfirmasi ke{" "}
            <strong className="text-blue-600">{email}</strong>.
            <br />
            Silakan periksa inbox Anda dan klik tautan untuk mengaktifkan akun
            Anda.
          </p>

          <div className="space-y-4">
            <button
              onClick={handleLoginClick}
              className="w-full py-3 rounded-xl font-medium shadow-md register-btn transition-all duration-300 hover:shadow-lg"
            >
              Login Sekarang
            </button>

            <div className="text-center text-sm text-login">
              Tidak menerima email?{" "}
              <button className="text-login font-semibold hover:underline">
                Kirim ulang
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmationPage;
