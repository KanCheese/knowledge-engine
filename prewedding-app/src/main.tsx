import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import Landing from "./Landing";
import "./index.css";

const isAppRoute =
  window.location.pathname === "/app" ||
  window.location.pathname.startsWith("/app/");

createRoot(document.getElementById("root")!).render(
  <StrictMode>{isAppRoute ? <App /> : <Landing />}</StrictMode>,
);
