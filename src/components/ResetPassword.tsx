import React, { useState } from "react";
import Axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    Axios.post(`http://localhost:5000/api/auth/resetPassword/${token}`, {
      password,
    })
      .then((response) => {
        if (response.data.status) {
          alert("Password has been successfully updated!");
          navigate("/");
        } else {
          setErrorMessage(response.data.message || "Failed to reset password");
        }
      })
      .catch((err) => {
        console.log(err);
        setErrorMessage("An error occurred. Please try again.");
      });
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-blue-200 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-blue-600">Reset Password</h2>
          <div className="mt-2 text-sm text-gray-500">
            Masukan kata sandi baru Anda
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            {/* <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password baru
            </label> */}
            <input
              type="password"
              id="password"
              placeholder="Masukan kata sandi baru"
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-gray-300 p-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            {/* <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Konfirmasi Password baru
            </label> */}
            <input
              type="password"
              id="confirmPassword"
              placeholder="Konfirmasi kata sandi baru"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-gray-300 p-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>

          {errorMessage && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 py-3 text-white transition duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Reset Password
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          sudah ingat kata sandi?
          <a href="/" className="font-medium text-blue-600 hover:text-blue-500">
            {" "}
            Log in
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
