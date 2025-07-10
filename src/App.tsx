import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Registrasi from "./components/Registrasi";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Home from "./components/Home";
import EditProfile from "./components/EditProfile";
import Pertanyaan from "./components/Pertanyaan";
import ConfirmationPage from "./components/ConfirmationPage";
import HomeTamu from "./components/HomeTamu";
import Eksplorasi from "./components/Eksplorasi";
import AdminDashboard from "./components/admin/AdminDashboard";
import TipsKesehatan from "./components/TipsKesehatan";
import Quotes from "./components/Quotes";
import FavoriteQuotes from "./components/FavoriteQuotes";
import { ToastContainer } from "react-toastify";
import ThemeSwitcher from "./components/ThemeSwitcher";

function App() {
  return (
    <Router>
      <ThemeSwitcher />
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Registrasi />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/chat" element={<Home />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/pertanyaan" element={<Pertanyaan />} />
        <Route path="/confirm" element={<ConfirmationPage />} />
        <Route path="/tamu" element={<HomeTamu />} />
        <Route path="/eksplorasi" element={<Eksplorasi />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/tips-harian" element={<TipsKesehatan />} />
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/favorite-quotes" element={<FavoriteQuotes />} />
      </Routes>
    </Router>
  );
}

export default App;
