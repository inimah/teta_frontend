import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { firebaseApp } from "../firebase";
import "../App.css";
import { toast } from "react-toastify";
import { FaCheck, FaTimes } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [guestName, setGuestName] = useState("");

  const [, setFadeOut] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const checkEmailExists = async (email: string) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/check-email",
        { email }
      );
      if (!response.data.exists) {
        setErrors({
          email: "Alamat email belum terdaftar, silahkan lakukan registrasi",
        });
      } else {
        setErrors({});
      }
    } catch (err) {
      console.error("Error check email:", err);
    }
  };

  const handleGoogleSignIn = async () => {
    const auth = getAuth(firebaseApp);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account",
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const googleToken = credential?.idToken;

      console.log("Google Token:", googleToken);
      const response = await axios.post(
        "http://localhost:5000/api/auth/google-login",
        {
          googleToken,
          email: result.user.email,
          name: result.user.displayName,
        }
      );

      console.log("Response dari backend:", response.data);

      if (response.status === 200) {
        const token = response.data.token;
        const user = response.data.user;
        console.log("User object (raw):", user);
        console.log("User object keys:", Object.keys(user));
        console.log("Role user:", user.role);

        if (!user || !user.userId || user.id) {
          console.error(
            "User ID tidak ditemukan dalam respons backend:",
            response.data
          );
          toast.error("Terjadi kesalahan saat login. Silakan coba lagi.");
          return;
        }

        localStorage.setItem("authToken", token);
        localStorage.setItem("userId", user.userId);
        localStorage.setItem("name", user.name);
        localStorage.setItem("role", user.role);
        localStorage.setItem("isGuest", "false");

        console.log("Response dari backend:", response.data);
        console.log("User object:", response.data.user);
        console.log("Role user:", response.data.user.role);
        if (user?.role === "admin") {
          navigate("/admin/dashboard");
        } else if (user?.role === "user") {
          navigate("/chat");
        } else {
          toast.error("Role tidak dikenali. Silakan hubungi admin.");
        }
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      toast.error("Login gagal. Silakan coba lagi.");
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200) {
        const { token } = response.data;
        const userId = response.data.user._id;
        localStorage.setItem("userId", userId);
        localStorage.setItem("authToken", token);
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("name", response.data.user.name);
        localStorage.setItem("role", response.data.user.role);
        localStorage.setItem("isGuest", "false");
        localStorage.removeItem("guestName");

        if (response.data.user.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          setFadeOut(true);
          setTimeout(() => {
            navigate("/chat");
          }, 400);
        }
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 404) {
          setErrors({ email: error.response.data.message });
        } else if (error.response.status === 401) {
          setErrors({ password: error.response.data.message });
        } else {
          setErrors({
            password:
              error.response.data.message || "An error occurred during login.",
          });
        }
      }
    }
  };

  const handleGuestLogin = (guestName: string) => {
    if (guestName.trim() === "") {
      toast.info("Nama tidak boleh kosong!");
      return;
    }
    localStorage.setItem("guestName", guestName);
    localStorage.setItem("isGuest", "true");
    localStorage.removeItem("userId");
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentSessionId");

    navigate("/tamu");
  };
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowGuestPopup(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen min-w-full">
      <div className="absolute inset-0 -z-10" />

      {showGuestPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={handleBackdropClick}
        >
          <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
          <div
            className="login-guest-popup p-6 z-20 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* <p className="mb-2 text-center">Masuk tanpa login</p> */}

            <div className="mb-1 p-3 bg-yellow-50 rounded">
              <h2 className="text-sm ">
                ⚠️ <strong>Penting:</strong> Data Anda tidak akan tersimpan
                secara permanen.
                <br />
                Semua informasi akan hilang setelah menutup aplikasi.
              </h2>
            </div>

            <input
              type="text"
              placeholder="masukkan nama anda"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full tamu-form mb-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleGuestLogin(guestName);
                }
              }}
            />

            <div className="flex justify-between mt-2">
              <button
                onClick={() => setShowGuestPopup(false)}
                className="text-red-600 text-xl flex items-center justify-center gap-2"
              >
                <FaTimes />
              </button>

              <button
                onClick={() => handleGuestLogin(guestName)}
                className="text-green-500 text-xl flex items-center justify-center gap-2"
              >
                <FaCheck />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Left Panel - Login Form without background box */}
      <div className="w-full max-w-md rounded-3xl shadow-2xl p-10 login-card">
        <div className="flex flex-col items-center mb-4">
          <img
            src="/Teta_girl.png"
            alt="TETA Chatbot Logo"
            className="w-35 h-20 "
          />
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={(e) => checkEmailExists(e.target.value)}
            className="w-full px-4 py-2.5 rounded-md text-sm login-input shadow-sm "
          />
          {errors.email && (
            <p className="text-sm text-rose-500">{errors.email}</p>
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-md text-sm login-input shadow-sm"
          />
          {errors.password && (
            <p className="text-sm text-rose-500">{errors.password}</p>
          )}
          <div className="flex justify-between items-center text-xs">
            <button
              onClick={() => setShowGuestPopup(true)}
              type="button"
              className="text-login hover:underline font-medium bg-transparent"
            >
              Masuk tanpa login
            </button>
            <Link
              to="/forgotPassword"
              className="text-login hover:underline font-medium"
            >
              Lupa password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl font-medium shadow-md transition-all duration-300 border login-btn"
          >
            Login
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full  bg-white/90   login-google-btn  py-3 rounded-2xl flex items-center justify-center gap-2  shadow-sm"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-5 h-5"
              alt="Google Logo"
            />
            <span className="text-base font-medium text-gray-700 s">
              Login with Google
            </span>
          </button>

          <div className="text-center text-sm text-gray-700 mt-6">
            Belum punya akun?
            <Link
              to="/register"
              className="text-register font-semibold hover:underline ml-1"
            >
              Register disini
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
