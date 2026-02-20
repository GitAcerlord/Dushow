import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Root element not found. Make sure index.html has <div id='root'></div>");
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

// Catch any rendering errors
try {
  root.render(<App />);
} catch (error) {
  console.error("React rendering error:", error);
  rootElement.innerHTML = "<h1>Error loading application</h1>";
}

