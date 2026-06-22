import { useState } from "react";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import Landing from "./pages/Landing";

function App() {
  const [entered, setEntered] = useState(false);
  const [demoStartup, setDemoStartup] = useState(null);

  const enterApp = () => {
    setEntered(true);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const enterDemo = () => {
    setDemoStartup("Airbnb");
    setEntered(true);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  return (
    <>
      {entered ? <Home initialSample={demoStartup} /> : <Landing onEnter={enterApp} onDemo={enterDemo} />}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1d2436",
            border: "0.5px solid #2c3447",
            color: "#f1f3f8",
          },
        }}
      />
    </>
  );
}

export default App;
