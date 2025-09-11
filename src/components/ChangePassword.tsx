// src/components/ChangePassword.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

const ChangePassword = () => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Captcha sederhana (a+b)
    const [a, setA] = useState(0);
    const [b, setB] = useState(0);
    const [captcha, setCaptcha] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const regenCaptcha = () => {
        setA(Math.floor(Math.random() * 10) + 1);
        setB(Math.floor(Math.random() * 10) + 1);
        setCaptcha("");
    };

    useEffect(() => {
        regenCaptcha();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!oldPassword || !newPassword || !confirmPassword) {
            toast.error("Semua field wajib diisi");
            return;
        }
        if (newPassword.length < 8) {
            toast.error("Password baru minimal 8 karakter");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Konfirmasi password tidak sama");
            return;
        }
        if (Number(captcha) !== a + b) {
            toast.error("Captcha salah");
            regenCaptcha();
            return;
        }

        const token = localStorage.getItem("authToken");
        if (!token) {
            toast.error("Sesi berakhir. Silakan login kembali.");
            navigate("/");
            return;
        }

        try {
            setSubmitting(true);
            const res = await axios.put(
                "http://localhost:5000/api/auth/change-password",
                { oldPassword, newPassword, confirmPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data?.status) {
                toast.success("Password berhasil diubah!");
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
                regenCaptcha();
                navigate(-1);
            } else {
                toast.error(res.data?.message || "Gagal ubah password");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Terjadi kesalahan server");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-screen bg-theme-background p-4 flex items-center justify-center">
            <div className="relative w-full max-w-lg mx-auto">
                <div className="backdrop-blur-lg shadow-2xl rounded-2xl border edit-card overflow-hidden">
                    <div className="profil-header px-6 py-4 text-center relative">
                        <button
                            onClick={() => navigate(-1)}
                            className="absolute left-4 top-4 flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100 transition"
                            aria-label="Kembali"
                        >
                            <ChevronLeftIcon className="h-6 w-6 text-gray-500" />
                        </button>
                        <h2 className="text-lg font-bold text-gray-600">Ubah Password</h2>
                        <p className="text-gray-500 text-xs">Masukkan password lama & baru</p>
                    </div>

                    {/* Form */}
                    <form className="p-6 space-y-4" onSubmit={handleSubmit}>
                        {/* Password Lama */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-700">
                                Password Lama
                            </label>
                            <input
                                type="password"
                                placeholder="Masukkan password lama"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 
                 focus:bg-white focus:border-blue-500 focus:ring-1 
                 focus:ring-blue-200 text-sm"
                            />
                        </div>

                        {/* Password Baru */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-700">
                                Password Baru (min. 8 karakter)
                            </label>
                            <input
                                type="password"
                                placeholder="Masukkan password baru"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 
                 focus:bg-white focus:border-blue-500 focus:ring-1 
                 focus:ring-blue-200 text-sm"
                            />
                        </div>

                        {/* Konfirmasi Password Baru */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-700">
                                Konfirmasi Password Baru
                            </label>
                            <input
                                type="password"
                                placeholder="Ulangi password baru"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 
                 focus:bg-white focus:border-blue-500 focus:ring-1 
                 focus:ring-blue-200 text-sm"
                            />
                        </div>

                        {/* Captcha */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-700">Captcha</label>
                            <div className="flex items-center gap-2">
                                <div className="px-3 py-2 rounded-lg bg-gray-100 text-sm text-gray-700 border">
                                    Berapa {a} + {b} ?
                                </div>
                                <input
                                    type="number"
                                    value={captcha}
                                    onChange={(e) => setCaptcha(e.target.value)}
                                    placeholder="Jawaban"
                                    required
                                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 
                   focus:bg-white focus:border-blue-500 focus:ring-1 
                   focus:ring-blue-200 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={regenCaptcha}
                                    className="px-3 py-2 text-xs rounded-md border hover:bg-gray-50"
                                >
                                    Refresh
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full profil-button font-semibold py-3 rounded-lg 
               transition-all duration-300 bg-blue-600 text-white 
               hover:bg-blue-700 disabled:opacity-60"
                        >
                            {submitting ? "Menyimpan..." : "Simpan Password Baru"}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
