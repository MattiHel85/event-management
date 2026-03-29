import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { EventsProvider } from "./context/EventsContext";
import { SessionProvider } from "./context/SessionContext";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <EventsProvider>
          <App />
        </EventsProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>
);
