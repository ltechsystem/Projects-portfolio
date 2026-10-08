
  import { createRoot } from "react-dom/client";
  import App from "../app/App.tsx";
  import { GlassPaneIntro } from "./GlassPaneIntro";
  import "../styles/index.css";
  import "./cursor.css";
  import face from "../../media/face.png";

  function LegoPage() {
    return (
      <>
        <GlassPaneIntro />
        <App avatarSrc={face} legoColors hideAvatarRing />
      </>
    );
  }

  createRoot(document.getElementById("root")!).render(<LegoPage />);
