import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { extractPII } from "../api/piiApi";
import { Card } from "../components/Card";

export default function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    if (!files.length) return;
    try {
      setLoading(true);
      const apiResponse = await extractPII(files);
      navigate("/results", { state: { apiResponse } });
    } catch (err) {
      console.error(err);
      alert("PII extraction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={containerStyle}>
        <Card style={glassCardStyle}>
          <div style={{ textAlign: "center" }}>
            <label 
              style={uploadAreaStyle}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = "#334155")}
            >
              <div style={plusCircleStyle}>+</div>
              <input
                type="file"
                multiple
                hidden
                onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files)])}
              />
              <p style={uploadTextStyle}>
                {files.length > 0 ? `${files.length} files selected` : "Upload your documents"}
              </p>
              
              <div style={formatBadge}>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>DOCX, XLSX, PDF, PNG, JPG</span>
              </div>
            </label>

            <div style={fileListContainer}>
              {files.map((f, i) => (
                <div key={i} style={fileChip}>
                  <span style={fileName}>{f.name}</span>
                  <button 
                    onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                    style={removeBtn}
                  >×</button>
                </div>
              ))}
            </div>

            <button
              onClick={handleExtract}
              disabled={loading || files.length === 0}
              style={{
                ...extractBtnStyle,
                opacity: loading || files.length === 0 ? 0.6 : 1,
              }}
            >
              {loading ? "Analyzing Documents..." : "Extract PII Data"}
            </button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}


const formatBadge = {
  marginTop: "12px",
  padding: "4px 12px",
  background: "rgba(59, 130, 246, 0.1)", // Light blue tint
  color: "#60a5fa",
  borderRadius: "100px",
  display: "inline-block",
  border: "1px solid rgba(96, 165, 250, 0.2)",
  letterSpacing: "0.5px"
};

const containerStyle = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "radial-gradient(circle at top, #1e293b, #0f172a)", 
  minHeight: "100vh"
};

const glassCardStyle = {
  width: 600,
  padding: "60px",
  background: "rgba(30, 41, 59, 0.7)",
  backdropFilter: "blur(12px)",
  borderRadius: "32px",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
};

const uploadAreaStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "40px",
  border: "2px dashed #334155",
  borderRadius: "24px",
  cursor: "pointer",
  transition: "all 0.3s ease",
  background: "rgba(255,255,255,0.02)"
};

const plusCircleStyle = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
  color: "white",
  fontSize: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 20,
  boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.4)"
};

const uploadTextStyle = {
  fontSize: 20,
  fontWeight: 600,
  color: "#f1f5f9",
  margin: "0"
};

const extractBtnStyle = {
  marginTop: 40,
  width: "100%",
  padding: "18px",
  fontSize: 18,
  background: "linear-gradient(135deg, #10b981, #059669)",
  color: "white",
  fontWeight: 700,
  borderRadius: "16px",
  border: "none",
  boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3)",
  cursor: "pointer",
  transition: "transform 0.2s ease"
};

const fileListContainer = {
  marginTop: 20,
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  justifyContent: "center"
};

const fileChip = {
  background: "#334155",
  padding: "6px 12px",
  borderRadius: "20px",
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "#e2e8f0"
};

const removeBtn = {
  background: "none",
  border: "none",
  color: "#94a3b8",
  cursor: "pointer",
  fontSize: 18,
  lineHeight: 1
};

const fileName = {
  maxWidth: "150px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};