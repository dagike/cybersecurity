import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Routing and pages are added in later commits.
function App() {
  return <p>Notes — coming online.</p>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
