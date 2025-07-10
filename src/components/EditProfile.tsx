import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

const EditProfile = () => {
  const location = useLocation();
  const email = location.state?.email || localStorage.getItem("email") || "";
  const userId = localStorage.getItem("userId") || "";
  const [successMsg] = useState("");
  const [formData, setFormData] = useState({
    userId: userId,
    name: "",
    email: email,
    hp: "",
    birthdate: "",
    sex: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/auth/user/${userId}`
        );
        const user = res.data.user;
        setFormData({
          userId: user._id,
          name: user.name || "",
          email: user.email || "",
          hp: user.hp || "",
          birthdate: user.birthdate ? user.birthdate.slice(0, 10) : "",
          sex: user.sex || "",
        });
      } catch (err) {
        setFormData({
          userId: userId,
          name: localStorage.getItem("name") || "",
          email: email,
          hp: localStorage.getItem("hp") || "",
          birthdate: localStorage.getItem("birthdate") || "",
          sex: localStorage.getItem("sex") || "",
        });
      }
    };
    if (userId) fetchUser();
  }, [userId, email]);

  const today = new Date();
  const maxDate = new Date(
    today.getFullYear() - 12,
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .split("T")[0];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Token tidak ditemukan. Silakan login kembali.");
      return;
    }

    try {
      const response = await axios.put(
        "http://localhost:5000/api/auth/update-profile",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const updatedUser = response.data.user;
      localStorage.setItem("name", updatedUser.name);
      localStorage.setItem("hp", updatedUser.hp || "");
      localStorage.setItem("birthdate", updatedUser.birthdate || "");
      localStorage.setItem("sex", updatedUser.sex || "");
      toast.success("Profil berhasil diperbarui!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Terjadi kesalahan saat memperbarui profil");
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen w-screen bg-theme-background p-4 flex items-center justify-center">
      <div className="relative w-full max-w-lg mx-auto">
        <div className="backdrop-blur-lg shadow-2xl rounded-2xl border edit-card overflow-hidden">
          <div className="profil-header px-6 py-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative flex items-center justify-center">
              <button
                onClick={handleCancel}
                className="absolute left-0 flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100 transition"
                aria-label="Kembali"
                style={{ top: "50%", transform: "translateY(-50%)" }}
                type="button"
              >
                <ChevronLeftIcon className="h-6 w-6 text-gray-500" />
              </button>
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center backdrop-blur-sm border border-gray-400 mr-3">
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-gray-500">Edit Profil</h2>
                <p className="text-gray-600 text-xs">
                  Perbarui informasi pribadi
                </p>
              </div>
            </div>
          </div>
          {successMsg && (
            <div className="mx-6 mt-4 mb-2 text-center">
              <span className="text-green-600 font-medium text-sm">
                {successMsg}
              </span>
            </div>
          )}
          <form className="p-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="flex items-center text-xs font-semibold text-gray-700">
                    <svg
                      className="w-3 h-3 mr-1 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Masukkan nama lengkap"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-800 placeholder-gray-400 text-sm"
                  />
                </div>
                {/* Email */}
                <div className="space-y-1">
                  <label className="flex items-center text-xs font-semibold text-gray-700">
                    <svg
                      className="w-3 h-3 mr-1 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      disabled
                      className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed text-sm pr-10"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Phone */}
                <div className="space-y-1">
                  <label className="flex items-center text-xs font-semibold text-gray-700">
                    <svg
                      className="w-3 h-3 mr-1 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    No. WhatsApp
                  </label>
                  <input
                    type="text"
                    name="hp"
                    placeholder="08123456789"
                    value={formData.hp}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-800 placeholder-gray-400 text-sm"
                  />
                </div>
                {/* Birthdate & Gender */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="flex items-center text-xs font-semibold text-gray-700">
                      <svg
                        className="w-3 h-3 mr-1 text-purple-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      name="birthdate"
                      value={formData.birthdate}
                      onChange={handleInputChange}
                      max={maxDate}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-800 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center text-xs font-semibold text-gray-700">
                      <svg
                        className="w-3 h-3 mr-1 text-pink-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Jenis Kelamin
                    </label>
                    <select
                      name="sex"
                      value={formData.sex}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-800 appearance-none cursor-pointer text-sm"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: "right 0.75rem center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "1em 1em",
                      }}
                    >
                      <option value="">Pilih</option>
                      <option value="M">Laki-laki</option>
                      <option value="F">Perempuan</option>
                    </select>
                  </div>
                </div>
              </div>
              {/* Tombol Simpan & Batal */}
              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  className="w-full profil-button text-gray-700 font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-200 relative overflow-hidden group text-sm"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200"
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
                    Simpan Perubahan
                  </span>
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full profil-button text-gray-700 font-semibold py-3 rounded-lg transition-all duration-300 hover:bg-gray-300 text-sm"
                >
                  Batal
                </button>
              </div>
              <div className="mt-4 text-center">
                <p className="text-gray-500 text-xs">
                  Data Anda aman dan terlindungi 🔒
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
