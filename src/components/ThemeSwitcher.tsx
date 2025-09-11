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
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  React.useEffect(() => {
    if (!localStorage.getItem("theme")) {
      localStorage.setItem("theme", "netral");
      setCurrentTheme("netral");
      applyTheme("netral");
    } else {
      applyTheme(currentTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed bottom-3 right-3 z-50 flex gap-2 rounded-full shadow-lg px-2 py-1 backdrop-blur-md border"
      // Pakai CSS variables + fallback supaya adaptif di semua tema
      style={{
        background: "var(--surface, rgba(255,255,255,0.85))",
        borderColor: "var(--border, rgba(0,0,0,0.08))",
        color: "var(--text, #2d2d2d)",
      }}
    >
      {themes.map((t) => {
        const isActive = currentTheme === t.value;
        return (
          <button
            key={t.value}
            className={`text-xl rounded-full transition p-1`}
            onClick={() => handleThemeChange(t.value)}
            aria-label={`Tema ${t.name}`}
            // Selected state juga adaptif
            style={{
              background: isActive
                ? "var(--accent-bg, rgba(59,130,246,0.15))"
                : "transparent",
              boxShadow: isActive ? "0 0 0 2px var(--accent-ring, rgba(59,130,246,0.35)) inset" : "none",
              transform: isActive ? "scale(1.08)" : "none",
            }}
          >
            {t.icon}
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSwitcher;
