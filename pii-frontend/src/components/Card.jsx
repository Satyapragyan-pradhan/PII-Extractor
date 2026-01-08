export function Card({ children }) {
return <div style={cardStyle}>{children}</div>;
}


const cardStyle = {
width: "100%",
maxWidth: 440,
padding: "28px 32px",
background: "rgba(255,255,255,0.04)",
border: "1px solid rgba(255,255,255,0.08)",
borderRadius: 16,
backdropFilter: "blur(10px)",
boxSizing: "border-box",
};