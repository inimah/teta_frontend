import React from "react";
import { applyTheme } from "../themes/applyTheme";

const themes = [
  { name: "Netral", value: "netral", icon: "🌤️" },
  { name: "Flower", value: "flower", icon: "🌸" },
  { name: "Fresh", value: "fresh", icon: "🍃" },
];

const ThemeSwitcher: React.FC = () => {
  const [currentTheme, setCurrentTheme] = React.useState(
    localStorage.getItem("theme") || "netral"
  );

  const handleThemeChange = (theme: string) => {
    localStorage.setItem("theme", theme);
    setCurrentTheme(theme); // update state agar tombol langsung berubah
    applyTheme(theme);
  };

  React.useEffect(() => {
    // Set default theme to netral if not set
    if (!localStorage.getItem("theme")) {
      localStorage.setItem("theme", "netral");
      setCurrentTheme("netral");
      applyTheme("netral");
    } else {
      applyTheme(currentTheme);
    }
  }, []);

  return (
    <div className="fixed bottom-3 right-3 z-50 flex gap-2 bg-white rounded-full shadow-lg px-2 py-1">
      {themes.map((t) => (
        <button
          key={t.value}
          className={`text-xl  rounded-full transition ${
            currentTheme === t.value ? "bg-blue-100 scale-110 shadow" : ""
          }`}
          onClick={() => handleThemeChange(t.value)}
          aria-label={`Tema ${t.name}`}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
