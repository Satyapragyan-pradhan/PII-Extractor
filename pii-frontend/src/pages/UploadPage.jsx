import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import {
  plusStyle,
  fileNameStyle,
} from "../styles/uiStyles";
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
      navigate("/results", {
        state: { apiResponse },
      });
    } catch (err) {
      console.error(err);
      alert("PII extraction failed");
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Layout>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card
          style={{
            width: 920,
            padding: "48px 64px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            {/* Upload */}
            <label
              style={{
                ...plusStyle,
                width: 120,
                height: 120,
                fontSize: 48,
              }}
            >
              +
              <input
                type="file"
                multiple
                hidden
                onChange={(e) =>
                  setFiles((prev) => [
                    ...prev,
                    ...Array.from(e.target.files),
                  ])
                }
              />
            </label>

            <p
              style={{
                opacity: 0.85,
                marginBottom: 16,
                fontSize: 18,
              }}
            >
              Upload document(s)
            </p>

            {/* File List */}
            {files.map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    ...fileNameStyle,
                    fontSize: 15,
                    flex: 1,
                    textAlign: "left",
                  }}
                >
                  {f.name}
                </div>

                <button
                  onClick={() => removeFile(i)}
                  title="Remove file"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    border: "none",
                    background: "#dc2626",
                    color: "white",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                    lineHeight: "26px",
                  }}
                >
                  ×
                </button>
              </div>
            ))}

            <button
              onClick={handleExtract}
              disabled={loading || files.length === 0}
              style={{
                marginTop: 32,
                width: "100%",
                padding: "16px",
                fontSize: 17,
                background: "#16a34a",
                color: "white",
                fontWeight: 600,
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Extracting..." : "Extract"}
            </button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
