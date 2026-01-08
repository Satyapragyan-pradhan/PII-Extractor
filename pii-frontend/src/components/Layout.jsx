import { useNavigate, useLocation } from "react-router-dom";

export function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isUploadPage = location.pathname === "/";

  return (
    <div style={layoutStyle}>
      {/* Navbar */}
      <header
        style={headerStyle}
        onClick={() => navigate("/")}
      >
        PII Extractor
      </header>

      <main
        style={{
          ...mainStyle,
          flex: isUploadPage ? 1 : "unset",
          display: isUploadPage ? "flex" : "block",
          alignItems: isUploadPage ? "center" : "unset",
          justifyContent: isUploadPage ? "center" : "unset",
          padding: isUploadPage ? 0 : "32px 24px",
        }}
      >
        {children}
      </main>
    </div>
  );
}


const layoutStyle = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top, #0f1e3a, #050b18)",
  color: "#e5e7eb",
  display: "flex",
  flexDirection: "column",
  margin: 0,
  overflowX: "hidden", 
};

const headerStyle = {
  padding: "16px 24px",
  fontSize: 18,
  fontWeight: 600,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  cursor: "pointer",
  userSelect: "none",
};

const mainStyle = {
  width: "100%",
  maxWidth: "100vw",
};
