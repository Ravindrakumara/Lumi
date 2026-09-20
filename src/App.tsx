import { useEffect } from "react";
import { useRoutes } from "react-router-dom";
import { routes } from "./routes/routes";
import { useSettingsStore } from "./store/settingsStore";

export default function App() {
  const darkMode = useSettingsStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return useRoutes(routes);
}
