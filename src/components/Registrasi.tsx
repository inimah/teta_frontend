import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { applyTheme } from "../themes/applyTheme";
import { toast } from "react-toastify";

const Registrasi = () => {
  const navigate = useNavigate();

  // const imageVariants = {
  //   hidden: {
  //     opacity: 0,
  //     x: 100, // mulai dari kanan
  //     scale: 1.2, // sedikit besar dulu
  //   },
  //   visible: {
  //     opacity: 1,
  //     x: 0, // ke tengah
  //     scale: 1, // kembali ke ukuran normal
  //     transition: {
  //       duration: 0.8,
  //       ease: "easeOut" as const,
  //     },
  //   },
  //   exit: {
  //     opacity: 0,
  //     x: 100,
  //     scale: 1.2,
  //     transition: {
  //       duration: 0.5,
  //       ease: "easeIn" as const,
  //     },
  //   },
  // };

  // const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sapaan: "",
    email: "",
    // hp: "",
    password: "",
    confirmPassword: "",
    birthdate: "",
    sex: "",
  });

  const [sapaanTouched, setSapaanTouched] = useState(false); // <-- NEW

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    sapaan?: string;
    // hp?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
    sex?: string;
    birthdate?: string;
  }>({});

  // const [isCheckingName, setIsCheckingName] = useState(false);
  // const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isSubmitted] = useState(false);

  useEffect(() => {
    // Ambil tema dari localStorage, default ke "netral"
    const theme = localStorage.getItem("theme") || "netral";
    applyTheme(theme);
  }, []);

  // ===== Batas umur 12–25 tahun =====
  const getAge = (birthISO: string) => {
    const birth = new Date(birthISO);
    if (isNaN(birth.getTime())) return NaN;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const today = new Date();
  const minBirthDate = new Date( // paling tua (25 th)
    today.getFullYear() - 25,
    today.getMonth(),
    today.getDate()
  );
  const maxBirthDate = new Date( // paling muda (12 th)
    today.getFullYear() - 12,
    today.getMonth(),
    today.getDate()
  );

  // // Check name availability
  // useEffect(() => {
  //   const checkName = async () => {
  //     if (!formData.name || isCheckingName) return;

  //     setIsCheckingName(true);

  //     try {
  //       const response = await fetch(
  //         "http://localhost:5173/api/auth/check-name",
  //         {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({ name: formData.name }),
  //         }
  //       );

  //       if (!response.ok) {
  //         throw new Error("Failed to check name");
  //       }

  //       const data = await response.json();

  //       if (data.exists) {
  //         setErrors((prev) => ({
  //           ...prev,
  //           name: "Nama ini sudah terdaftar, silahkan gunakan nama lain",
  //         }));
  //       } else {
  //         setErrors((prev) => ({
  //           ...prev,
  //           name: undefined,
  //         }));
  //       }
  //     } catch (error) {
  //       console.error("Error checking name:", error);
  //     } finally {
  //       setIsCheckingName(false);
  //     }
  //   };

  //   const timeoutId = setTimeout(() => {
  //     checkName();
  //   }, 500);

  //   return () => clearTimeout(timeoutId);
  // }, [formData.name, isCheckingName]);

  // Check email availability
  // useEffect(() => {
  //   const checkEmail = async () => {
  //     if (!formData.email || isCheckingEmail) return;

  //     setIsCheckingEmail(true);

  //     try {
  //       const response = await fetch(
  //         "http://localhost:5173/api/auth/check-email",
  //         {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({ email: formData.email }),
  //         }
  //       );

  //       if (!response.ok) {
  //         throw new Error("Failed to check email");
  //       }

  //       const data = await response.json();

  //       if (data.exists) {
  //         setErrors((prev) => ({
  //           ...prev,
  //           email: "Email ini sudah terdaftar, silahkan lakukan login",
  //         }));
  //       } else {
  //         setErrors((prev) => ({
  //           ...prev,
  //           email: undefined,
  //         }));
  //       }
  //     } catch (error) {
  //       console.error("Error checking email:", error);
  //     } finally {
  //       setIsCheckingEmail(false);
  //     }
  //   };

  //   const timeoutId = setTimeout(() => {
  //     checkEmail();
  //   }, 500);

  //   return () => clearTimeout(timeoutId);
  // }, [formData.email, isCheckingEmail]);



  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // gunakan functional update supaya bisa lihat state sebelumnya
    setFormData(prev => {
      const next = { ...prev, [name]: value };

      // Auto-fill: kalau user mengubah "name" dan sapaan belum pernah disentuh (atau masih sama dengan name lama), salin ke sapaan
      if (name === "name" && !sapaanTouched) {
        if (!prev.sapaan || prev.sapaan === prev.name) {
          next.sapaan = value;
        }
      }

      return next;
    });

    if (name === "sapaan") setSapaanTouched(true); // sekali user sentuh, stop auto-fill

    if (name === "password") {
      setErrors((prev) => ({
        ...prev,
        password:
          value.length < 8
            ? "Password harus memiliki minimal 8 karakter"
            : undefined,
        // validasi konfirmasi juga setiap password berubah
        confirmPassword:
          formData.confirmPassword && formData.confirmPassword !== value
            ? "Konfirmasi password tidak sama"
            : undefined,
      }));
    }

    if (name === "confirmPassword") {
      setErrors((prev) => ({
        ...prev,
        confirmPassword:
          value !== formData.password ? "Konfirmasi password tidak sama" : undefined,
      }));
    }

    // if (name === "hp") {
    //   setErrors((prev) => ({
    //     ...prev,
    //     hp: /^[0-9]+$/.test(value) ? undefined : "Nomor HP harus berupa angka",
    //   }));
    // }
    if (name === "birthdate") {
      setErrors((prev) => ({
        ...prev,
        birthdate: value ? undefined : "Tanggal lahir harus diisi",
      }));
    }
    if (name === "sex") {
      setErrors((prev) => ({
        ...prev,
        sex: ["M", "F"].includes(value)
          ? undefined
          : "Jenis kelamin tidak valid",
      }));
    }

    if (errors.general) {
      setErrors({
        ...errors,
        general: undefined,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi data sebelum dikirim
    if (
      !formData.name ||
      !formData.sapaan ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.birthdate ||
      !formData.sex
    ) {
      setErrors((prev) => ({ ...prev, general: "Data registrasi wajib diisi" }));
      return;
    }

    // Validasi panjang password
    if (formData.password.length < 8) {
      setErrors((prev) => ({
        ...prev,
        password: "Password harus memiliki minimal 8 karakter",
      }));
      return;
    }

    // Validasi password & konfirmasi
    if (formData.password !== formData.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Konfirmasi password tidak sama",
      }));
      return;
    }

    // Validasi umur 12–25
    const age = getAge(formData.birthdate);
    if (isNaN(age) || age < 12 || age > 25) {
      setErrors((prev) => ({ ...prev, birthdate: "Maaf, Anda harus berumur 12–25 tahun" }));
      return;
    }

    // Log data sebelum kirim
    console.log("Data yang dikirim ke backend:", formData);

    try {
      const submittedEmail = formData.email; // simpan sebelum reset/navigate

      const response = await fetch(import.meta.env?.VITE_API_URL + "api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // kirimkan tanpa confirmPassword ke backend
        body: JSON.stringify({
          name: formData.name,
          sapaan: formData.sapaan,
          email: formData.email,
          password: formData.password,
          birthdate: formData.birthdate,
          sex: formData.sex,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error dari backend:", data);
        toast.error(data.message || "Registrasi gagal");
        return;
      }

      // Jika registrasi berhasil
      toast.success("Registrasi berhasil, Silahkan cek email untuk konfirmasi");

      setTimeout(() => {
        navigate("/confirm", { state: { email: submittedEmail } });
      }, 200);

      // Reset SETELAH sukses
      setFormData({
        name: "",
        sapaan: "",
        email: "",
        password: "",
        confirmPassword: "",
        birthdate: "",
        sex: "",
      });

    } catch (error) {
      console.error("Error saat registrasi:", error);
      toast.error("Terjadi kesalahan saat registrasi");
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen min-w-full main-bg">
      <div className="absolute inset-0 -z-10 main-bg" />
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 register-card ">
        <h1 className="text-2xl font-bold mb-4 text-center ">Registrasi</h1>
        {errors.general && (
          <div className="mb-4 p-3 text-center text-xs text-red-700 rounded-xl ">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Nama Lengkap */}
          <div className="relative">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 rounded-md text-sm register-form shadow-sm ${errors.name ? "border-red-300 bg-red-50" : ""
                }`}
              placeholder="Nama Lengkap"
              autoComplete="off"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-2 ml-1">{errors.name}</p>
            )}
          </div>

          {/* Nama Sapaan (wajib) */}
          <div className="relative">
            <input
              type="text"
              name="sapaan"
              value={formData.sapaan}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 rounded-md text-sm register-form shadow-sm ${errors.sapaan ? "border-red-300 bg-red-50" : ""}`}
              placeholder="Nama sapaan kamu"
              autoComplete="off"
              required
            />
            {errors.sapaan && <p className="text-red-500 text-sm mt-2 ml-1">{errors.sapaan}</p>}
          </div>

          {/* Email */}
          <div className="relative">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 border rounded-md text-sm  register-form shadow-sm ${errors.email ? "border-red-300 bg-red-50" : ""
                }`}
              placeholder="Email"
              autoComplete="off"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-2 ml-1">{errors.email}</p>
            )}
          </div>

          {/* Tanggal lahir */}
          <div className="relative">
            <DatePicker
              selected={
                formData.birthdate ? new Date(formData.birthdate) : null
              }
              onChange={(date: Date | null) => {
                const iso = date ? date.toISOString().split("T")[0] : "";
                setFormData({ ...formData, birthdate: iso });

                // Validasi realtime umur 12–25
                if (!iso) {
                  setErrors((prev) => ({ ...prev, birthdate: "Tanggal lahir harus diisi" }));
                } else {
                  const age = getAge(iso);
                  setErrors((prev) => ({
                    ...prev,
                    birthdate:
                      isNaN(age)
                        ? "Tanggal lahir tidak valid"
                        : age < 12 || age > 25
                          ? "Maaf, Anda harus berumur 12–25 tahun"
                          : undefined,
                  }));
                }
              }}

              dateFormat="dd/MM/yyyy"
              minDate={minBirthDate}
              maxDate={new Date(maxBirthDate)}
              placeholderText="Pilih tanggal lahir"
              className={`w-full px-4 py-2.5 border rounded-md text-sm  register-form shadow-sm ${isSubmitted && !formData.birthdate
                ? "border-red-300 bg-red-50"
                : ""
                }`}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              wrapperClassName="w-full"
            />
            {/* Info / error untuk birthdate */}
            {formData.birthdate && !errors.birthdate && (
              <p className="text-blue-500 text-sm mt-2 ml-1">
                Tanggal dipilih:{" "}
                {new Date(formData.birthdate).toLocaleDateString("id-ID")}
              </p>
            )}
            {errors.birthdate && (
              <p className="text-red-500 text-sm mt-2 ml-1">{errors.birthdate}</p>
            )}
          </div>

           {/* Jenis Kelamin */}
          <div className="relative">
            <select
              name="sex"
              value={formData.sex}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 border rounded-md text-sm  register-form shadow-sm ${isSubmitted && !formData.sex ? "border-red-300 bg-red-50" : ""
                } ${formData.sex === "" ? "text-gray-500" : "text-gray-700"}`}
            >
              <option value="">Pilih Jenis Kelamin</option>
              <option value="M">Laki-laki</option>
              <option value="F">Perempuan</option>
            </select>
            {isSubmitted && !formData.sex && (
              <p className="text-red-500 text-sm mt-2 ml-1 ">
                Jenis kelamin harus dipilih
              </p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 border rounded-md text-sm register-form shadow-sm ${errors.password ? "border-red-300 bg-red-50" : ""
                }`}
              placeholder="Password"
              autoComplete="off"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-2 ml-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Konfirmasi Password */}
          <div className="relative">
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 border rounded-md text-sm register-form shadow-sm ${errors.confirmPassword ? "border-red-300 bg-red-50" : ""
                }`}
              placeholder="Konfirmasi Password"
              autoComplete="off"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-2 ml-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-medium shadow-md register-btn "
          >
            Buat Akun
          </button>

          <div className="text-center text-sm text-login mt-6">
            Sudah punya akun?
            <Link
              to="/"
              className="text-login font-semibold hover:underline ml-1"
            >
              Login disini
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registrasi;
