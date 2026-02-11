import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

const applyInitialTheme = () => {
  const raw = localStorage.getItem('dushow-pro-settings');
  const savedTheme = raw ? JSON.parse(raw)?.theme : 'system';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldUseDark = savedTheme === 'dark' || (savedTheme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', !!shouldUseDark);
};

applyInitialTheme();

createRoot(document.getElementById("root")!).render(<App />);
