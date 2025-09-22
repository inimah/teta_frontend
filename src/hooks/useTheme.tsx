import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('theme') || 'netral';
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        setTheme(e.newValue || 'netral');
      }
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom theme change events
    const handleThemeChange = (e: CustomEvent) => {
      setTheme(e.detail.theme || 'netral');
    };

    window.addEventListener('themeChanged' as any, handleThemeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChanged' as any, handleThemeChange);
    };
  }, []);

  // Function to get theme-specific border color
  const getThemeBorderColor = (theme: string): string => {
    switch (theme) {
      case "fresh":
        return "border-[#97a97c]"; // Fresh theme green border
      case "flower":
        return "border-[#ffe0b2]"; // Flower theme warm border
      case "netral":
      default:
        return "border-[#c9d6e4]"; // Netral theme neutral border
    }
  };

  return {
    theme,
    borderColor: getThemeBorderColor(theme)
  };
};
