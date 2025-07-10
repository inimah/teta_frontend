import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
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
    name: "", // Ganti "username" menjadi "name"
    email: "",
    // hp: "", // Tambahkan field untuk nomor HP
    password: "",
    birthdate: "",
    sex: "", // Ganti "gender" menjadi "sex"
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    // hp?: string;
    password?: string;
    general?: string;
    sex?: string;
  }>({});

  const [isCheckingName, setIsCheckingName] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isSubmitted] = useState(false);

  useEffect(() => {
    // Ambil tema dari localStorage, default ke "netral"
    const theme = localStorage.getItem("theme") || "netral";
    applyTheme(theme);
  }, []);

  // Check name availability
  useEffect(() => {
    const checkName = async () => {
      if (!formData.name || isCheckingName) return;

      setIsCheckingName(true);

      try {
        const response = await fetch(
          "http://localhost:5173/api/auth/check-name",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: formData.name }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to check name");
        }

        const data = await response.json();

        if (data.exists) {
          setErrors((prev) => ({
            ...prev,
            name: "Nama ini sudah terdaftar, silahkan gunakan nama lain",
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            name: undefined,
          }));
        }
      } catch (error) {
        console.error("Error checking name:", error);
      } finally {
        setIsCheckingName(false);
      }
    };

    const timeoutId = setTimeout(() => {
      checkName();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.name, isCheckingName]);

  // Check email availability
  useEffect(() => {
    const checkEmail = async () => {
      if (!formData.email || isCheckingEmail) return;

      setIsCheckingEmail(true);

      try {
        const response = await fetch(
          "http://localhost:5173/api/auth/check-email",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: formData.email }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to check email");
        }

        const data = await response.json();

        if (data.exists) {
          setErrors((prev) => ({
            ...prev,
            email: "Email ini sudah terdaftar, silahkan lakukan login",
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            email: undefined,
          }));
        }
      } catch (error) {
        console.error("Error checking email:", error);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const timeoutId = setTimeout(() => {
      checkEmail();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.email, isCheckingEmail]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === "password") {
      setErrors((prev) => ({
        ...prev,
        password:
          value.length < 8
            ? "Password harus memiliki minimal 8 karakter"
            : undefined,
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
    if (!formData.name || !formData.email || !formData.password) {
      setErrors((prev) => ({
        ...prev,
        general: "Name, email, dan password wajib diisi",
      }));
      return;
    }

    console.log("Data yang dikirim ke backend:", formData);
    setFormData({
      name: "",
      email: "",
      password: "",
      birthdate: "",
      sex: "",
    });

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
        navigate("/confirm", { state: { email: formData.email } });
      }, 200);
    } catch (error) {
      console.error("Error saat registrasi:", error);
      toast.error("Terjadi kesalahan saat registrasi");
    }
  };

  const today = new Date();
  const maxDate = new Date(
    today.getFullYear() - 12,
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .split("T")[0]; //
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
          <div className="relative">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 rounded-md text-sm register-form shadow-sm ${
                errors.name ? "border-red-300 bg-red-50" : ""
              }`}
              placeholder="Nama Lengkap"
              autoComplete="off"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-2 ml-1">{errors.name}</p>
            )}
          </div>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 border rounded-md text-sm  register-form shadow-sm ${
                errors.email ? "border-red-300 bg-red-50" : ""
              }`}
              placeholder="Email"
              autoComplete="off"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-2 ml-1">{errors.email}</p>
            )}
          </div>
          <div className="relative">
            <DatePicker
              selected={
                formData.birthdate ? new Date(formData.birthdate) : null
              }
              onChange={(date: Date | null) => {
                setFormData({
                  ...formData,
                  birthdate: date ? date.toISOString().split("T")[0] : "",
                });
              }}
              dateFormat="dd/MM/yyyy"
              maxDate={new Date(maxDate)}
              placeholderText="Pilih tanggal lahir"
              className={`w-full px-4 py-2.5 border rounded-md text-sm  register-form shadow-sm ${
                isSubmitted && !formData.birthdate
                  ? "border-red-300 bg-red-50"
                  : ""
              }`}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              wrapperClassName="w-full"
            />
            {formData.birthdate && (
              <p className="text-blue-500 text-sm mt-2 ml-1">
                Tanggal dipilih:{" "}
                {new Date(formData.birthdate).toLocaleDateString("id-ID")}
              </p>
            )}
            {isSubmitted && !formData.birthdate && (
              <p className="text-red-500 text-sm mt-2 ml-1">
                Tanggal lahir harus diisi
              </p>
            )}
          </div>
          <div className="relative">
            <select
              name="sex"
              value={formData.sex}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 border rounded-md text-sm  register-form shadow-sm ${
                isSubmitted && !formData.sex ? "border-red-300 bg-red-50" : ""
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
          <div className="relative">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 border rounded-md text-sm register-form shadow-sm ${
                errors.password ? "border-red-300 bg-red-50" : ""
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
