import React from "react";

const AboutUs: React.FC = () => {
  return (
    <div className="min-h-screen w-full main-bg flex items-center justify-center p-6">
      <div
        className="
          w-full max-w-3xl 
          rounded-2xl shadow-md p-8
          bg-purple-100 hover:bg-purple-200 transition
        "
      >
        <h1 className="text-3xl font-bold mb-4 text-gray-800 text-center">
          About Us
        </h1>
        <p className="text-gray-700 leading-relaxed">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
          nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
