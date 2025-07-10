import React, { useState } from "react";
import Axios from "axios";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  Axios.defaults.withCredentials = true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    Axios.post("http://localhost:5000/api/auth/forgot-password", {
      email,
    })
      .then((response) => {
        setIsSubmitting(false);
        if (response.data.status) {
          setSuccessMessage("Check your email for reset password link");
          setShowConfirmation(true);
        } else {
          setErrorMessage(response.data.message || "Failed to process request");
        }
      })
      .catch((err) => {
        setIsSubmitting(false);
        console.error("Error details:", err);
        if (err.response) {
          setErrorMessage(
            err.response.data.message || "Failed to process request"
          );
        } else if (err.code === "ERR_NETWORK") {
          setErrorMessage(
            "Cannot connect to server. Please ensure the backend is running."
          );
        } else {
          setErrorMessage("Network error. Please try again later.");
        }
      });
  };

  const handleResendEmail = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-theme-background p-4">
      {showConfirmation ? (
        <div className="w-full max-w-sm rounded-lg bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full ">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-gray-800">
            Periksa Email
          </h2>
          <p className="mb-2 text-gray-600">
            Periksa email-mu, dan ikuti instruksi untuk reset password.
          </p>
          <button
            onClick={handleResendEmail}
            className="w-full rounded-lg bg-blue-600 py-3 text-white transition hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Mengirim..." : "Kirim Ulang Email"}
          </button>
          <Link
            to="/"
            className="mt-2 block text-center text-blue-600 hover:underline"
          >
            Kembali ke Login
          </Link>
        </div>
      ) : (
        <form
          className="w-full max-w-md rounded-lg  bg-white p-8 shadow-xl border lupa-password"
          onSubmit={handleSubmit}
        >
          <h2 className="mb-2 text-center  text-xl text lupa-password-title">
            Lupa Password
          </h2>
          <div className="mb-3 text-center text-sm text-gray-500">
            Masukan email terdaftar untuk menerima link reset password
          </div>
          <div className="mb-4">
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Masukan email terdaftar"
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md lupa-password-input "
            />
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {errorMessage}
              {errorMessage.includes("Cannot connect") && (
                <div className="mt-1 text-xs">
                  Server mungkin tidak berjalan atau endpoint tidak tersedia.
                </div>
              )}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-md lupa-password-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="mr-2 h-5 w-5 animate-spin "
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Mengirim...
              </span>
            ) : (
              "Kirim Link Reset"
            )}
          </button>

          {/* <div className="mt-6 text-center">
            <Link to="/" className="text-sm font-medium lupa-password-title">
              Kembali ke Login
            </Link>
          </div> */}
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
