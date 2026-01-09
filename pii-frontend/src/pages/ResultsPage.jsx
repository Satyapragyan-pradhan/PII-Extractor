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

    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) continue;
  
      worksheet[cellAddress].s = {
        font: { bold: true }
      };
    }
    // column width
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
      {/* PAGE */}
      <div style={page}>
        <h2 style={title}>Extracted PII – Preview</h2>

        {/* SHEET */}
        <div style={sheetWrapper}>
          <div style={sheetScroll}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>File Name</th>
                  <th style={th}>User Name</th>
                  <th style={thCenter}>Page</th>
                  <th style={thCenter}>Occ</th>
                  <th style={th}>Phone</th>
                  <th style={th}>Email</th>
                  <th style={th}>Aadhaar</th>
                  <th style={th}>PAN</th>
                  <th style={thWide}>Address</th>
                  <th style={th}>DL</th>
                  <th style={th}>Voter ID</th>
                  <th style={th}>DOB</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={i % 2 ? rowAlt : row}>
                    <td style={td}>{r.file_name}</td>
                    <td style={td}>{r.user_name || ""}</td>
                    <td style={tdCenter}>{r.page_number}</td>
                    <td style={tdCenter}>{r.occurrence}</td>
                    <td style={td}>{r.phone || ""}</td>
                    <td style={td}>{r.email || ""}</td>
                    <td style={td}>{r.aadhaar || ""}</td>
                    <td style={td}>{r.pan || ""}</td>
                    <td style={tdWide}>{r.address || ""}</td>
                    <td style={td}>{r.dl || ""}</td>
                    <td style={td}>{r.voter_id || ""}</td>
                    <td style={td}>{r.dob || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={downloadWrap}>
          <button style={downloadBtn} onClick={downloadExcel}>
            Download Excel
          </button>
        </div>
      </div>
    </Layout>
  );
}


const page = {
  maxWidth: 1600,               
  width: "100%",                
  minHeight: "calc(100vh - 70px)", 

  marginLeft: "auto",
  marginRight: "auto",

  paddingTop: 32,
  paddingBottom: 24,
  paddingLeft: 96,              
  paddingRight: 96,           

  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  boxSizing: "border-box",
};



const title = {
  fontSize: 22,
  fontWeight: 700,
  marginBottom: 20,
  color: "#e5e7eb",
  textAlign: "center",       
  width: "100%",
};


const sheetWrapper = {
  background: "#ffffff",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
  width: "100%",
  maxWidth: 1600,           
};


const sheetScroll = {
 maxHeight: "70vh",
  overflowX: "auto",
  overflowY: "auto",
};

const table = {
  borderCollapse: "collapse",
  minWidth: 1400,
  width: "100%",
  fontSize: 15,
  color: "#111827",
};

const th = {
  position: "sticky",
  top: 0,
  background: "#f3f4f6",
  padding: "14px 12px",
  borderBottom: "1px solid #d1d5db",
  borderRight: "1px solid #e5e7eb",
  textAlign: "left",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const thCenter = {
  ...th,
  textAlign: "center",
  width: 70,
};

const thWide = {
  ...th,
  minWidth: 420,
};

const td = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  borderRight: "1px solid #f3f4f6",
  whiteSpace: "nowrap",
};

const tdCenter = {
  ...td,
  textAlign: "center",
};

const tdWide = {
  ...td,
  minWidth: 420,
};

const row = {
  background: "#ffffff",
};

const rowAlt = {
  background: "#fafafa",
};



const downloadWrap = {
  display: "flex",
  justifyContent: "center",
  marginTop: 36,
  marginBottom: 48,
};

const downloadBtn = {
  padding: "14px 34px",
  borderRadius: 10,
  fontSize: 16,
  fontWeight: 700,
  border: "none",
  cursor: "pointer",
  background: "#22c55e",
  color: "#052e16",
};
