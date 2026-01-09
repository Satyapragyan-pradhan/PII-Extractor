import { useLocation } from "react-router-dom";
import { Layout } from "../components/Layout";
import * as XLSX from "xlsx";

export default function ResultsPage() {
  const { state } = useLocation();
  const rows = state?.apiResponse?.rows || [];

  const downloadExcel = () => {
    if (!rows.length) return;
    const formattedRows = rows.map(r => ({
      "File Name": r.file_name || "",
      "User Name": r.user_name || "",
      "Page": r.page_number ?? "",
      "Occ": r.occurrence ?? "",
      "Phone": r.phone || "",
      "Email": r.email || "",
      "Aadhaar": r.aadhaar || "",
      "PAN": r.pan || "",
      "Address": r.address || "",
      "DL": r.dl || "",
      "Voter ID": r.voter_id || "",
      "DOB": r.dob || ""
    }));
    const worksheet = XLSX.utils.json_to_sheet(formattedRows);
  
    //Auto-Width Logic
    const colWidths = Object.keys(formattedRows[0]).map((key) => {
      let maxLen = key.length; 
  
      formattedRows.forEach(row => {
        const val = row[key] ? row[key].toString() : "";
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.min(maxLen + 2, 60) }; 
    });
  
    worksheet["!cols"] = colWidths;
  
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PII Extracted");
  
    XLSX.writeFile(workbook, "pii_extracted_preview.xlsx");
  };

  return (
    <Layout>
      <div style={pageContainer}>
        <div style={headerSection}>
          <h2 style={titleStyle}>Extraction Results</h2>
          <p style={subtitleStyle}>{rows.length} PII entities detected across your documents</p>
        </div>

        <div style={tableWrapper}>
          <div style={scrollContainer}>
            <table style={Table}>
              <thead>
                <tr>
                  {["File Name", "User Name", "Page","Occ", "Phone", "Email", "Aadhaar","PAN", "Address","VoterID","DL","DOB"].map(h => (
                    <th key={h} style={Th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={rowStyle}>
                    <td style={Td}>{r.file_name}</td>
                    <td style={{...Td, color: "#3b82f6", fontWeight: 600}}>{r.user_name}</td>
                    <td style={TdCenter}>{r.page_number}</td>
                    <td style={TdCenter}>{r.occurrence}</td>
                    <td style={Td}>{r.phone}</td>
                    <td style={Td}>{r.email}</td>
                    <td style={Td}>{r.aadhaar}</td>
                    <td style={Td}>{r.pan}</td>
                    <td style={addressTd}>{r.address}</td>
                    <td style={Td}>{r.voter_id}</td>
                    <td style={Td}>{r.dl}</td>
                    <td style={Td}>{r.dob}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={actionArea}>
          <button style={DownloadBtn} onClick={downloadExcel}>
            <span style={{ marginRight: 8 }}>↓</span> Download Excel
          </button>
        </div>
      </div>
    </Layout>
  );
}

const pageContainer = {
  padding: "40px 24px",
  background: "#0f172a",
  minHeight: "100vh",
  color: "#f8fafc",
  display: "flex",           
  flexDirection: "column",
  alignItems: "center",      
  width: "100%",
  boxSizing: "border-box"
};

const headerSection = {
  textAlign: "left",          
  marginBottom: "30px",
  width: "100%",              
  maxWidth: "1400px",         
  borderLeft: "4px solid #10b981", 
  paddingLeft: "20px"
};

const titleStyle = { fontSize: "28px", fontWeight: 800, margin: 0 };
const subtitleStyle = { color: "#94a3b8", marginTop: "5px" };

const tableWrapper = {
  background: "rgba(30, 41, 59, 0.5)",
  borderRadius: "20px",
  border: "1px solid #334155",
  overflow: "hidden",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
  width: "100%",              
  maxWidth: "1400px",         
};

const scrollContainer = {
  maxHeight: "65vh",
  overflow: "auto"
};

const Table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px"
};

const Th = {
  background: "#1e293b",
  padding: "18px 20px",
  textAlign: "left",
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "1px",
  fontSize: "12px",
  position: "sticky",
  top: 0
};

const rowStyle = {
  borderBottom: "1px solid #334155",
  transition: "background 0.2s",
};

const Td = {
  padding: "16px 20px",
  color: "#cbd5e1",
  whiteSpace: "nowrap"
};

const TdCenter = { ...Td, textAlign: "center" };

const addressTd = {
  ...Td,
  minWidth: "300px",
  whiteSpace: "normal",
  lineHeight: "1.4"
};

const actionArea = {
  display: "flex",
  justifyContent: "center",
  marginTop: "40px"
};

const DownloadBtn = {
  padding: "16px 40px",
  borderRadius: "12px",
  background: "#10b981",
  color: "#fff",
  border: "none",
  fontWeight: 700,
  fontSize: "16px",
  cursor: "pointer",
  boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.4)",
  transition: "transform 0.2s"
};