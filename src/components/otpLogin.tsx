// import { useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// const OtpLogin = () => {
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [otp, setOtp] = useState("");
//   const [isOtpSent, setIsOtpSent] = useState(false);
//   const navigate = useNavigate();

//   const sendOtp = async (phoneNumber: string, otp: string) => {
//     try {
//       await axios.post("http://localhost:5000/api/user/send-otp", {
//         phoneNumber,
//         otp,
//       });
//       setIsOtpSent(true);
//       alert("OTP berhasil dikirim ke WhatsApp Anda.");
//     } catch (error) {
//       console.error("Error sending OTP:", error);
//       alert("Gagal mengirim OTP. Silakan coba lagi.");
//     }
//   };

//   const verifyOtp = async () => {
//     try {
//       console.log("Mengirim data untuk verifikasi:", { phoneNumber, otp });
//       const response = await axios.post(
//         "http://localhost:5000/api/auth/verify-otp",
//         {
//           phoneNumber,
//           otp,
//         }
//       );
//       const { userId, token } = response.data;
//       localStorage.setItem("userId", userId); // Simpan userId di localStorage
//       localStorage.setItem("token", token);
//       alert("OTP berhasil diverifikasi!");
//       navigate("/chat"); // Arahkan ke halaman dashboard
//     } catch (error: any) {
//       console.error(
//         "Error verifying OTP:",
//         error.response?.data || error.message
//       );
//       alert("Gagal memverifikasi OTP. Pastikan kode OTP benar.");
//     }
//   };

//   return (
//     <div className="flex h-screen w-screen  items-center justify-center bg-blue-100">
//       <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
//         <h2 className="text-2xl font-semibold text-blue-600 mb-6 text-center">
//           {isOtpSent ? "Masukkan Kode OTP" : "Login dengan Nomor WA"}
//         </h2>
//         {!isOtpSent ? (
//           <>
//             <input
//               type="text"
//               placeholder="Masukkan nomor WA"
//               value={phoneNumber}
//               onChange={(e) => setPhoneNumber(e.target.value)}
//               className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-gray-700 mb-4"
//             />
//             <button
//               onClick={() => sendOtp(phoneNumber, otp)}
//               className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-md transition duration-300"
//             >
//               Kirim OTP
//             </button>
//           </>
//         ) : (
//           <>
//             <input
//               type="text"
//               placeholder="Masukkan OTP"
//               value={otp}
//               onChange={(e) => setOtp(e.target.value)}
//               className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-gray-700 mb-4"
//             />
//             <button
//               onClick={verifyOtp}
//               className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-md transition duration-300"
//             >
//               Verifikasi OTP
//             </button>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default OtpLogin;
