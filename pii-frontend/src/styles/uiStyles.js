export const plusStyle = {
width: 90,
height: 90,
borderRadius: "50%",
border: "2px dashed rgba(255,255,255,0.3)",
display: "flex",
alignItems: "center",
justifyContent: "center",
fontSize: 40,
margin: "0 auto 16px",
cursor: "pointer",
};


export const buttonRow = {
display: "flex",
gap: 12,
flexWrap: "wrap",
marginTop: 12,
};


export const buttonStyle = (active = false) => ({
flex: "1 1 140px",
padding: "12px 16px",
background: active ? "#3758ff" : "#1f3cff",
border: "none",
borderRadius: 10,
color: "white",
fontWeight: 500,
cursor: "pointer",
transition: "all 0.2s ease",
});


export const buttonHover = {
filter: "brightness(1.15)",
};


export const inputStyle = {
width: "100%",
padding: "12px 14px",
marginBottom: 12,
borderRadius: 8,
border: "1px solid rgba(255,255,255,0.15)",
background: "rgba(255,255,255,0.06)",
color: "white",
boxSizing: "border-box",
};


export const fileNameStyle = {
fontSize: 13,
opacity: 0.85,
marginTop: 8,
wordBreak: "break-word",
};