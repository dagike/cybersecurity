// Mounted only by the vulnerable app. A fixed, high-contrast banner that makes
// it unmistakable that this instance is a deliberately insecure teaching demo.

const bannerStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 1000,
  background: "#b91c1c",
  color: "#fff",
  padding: "10px 16px",
  fontSize: 14,
  lineHeight: 1.4,
  textAlign: "center",
  fontWeight: 600,
  borderBottom: "3px solid #7f1d1d",
};

export function DemoBanner() {
  return (
    <div style={bannerStyle} role="alert">
      ⚠️ DELIBERATELY INSECURE DEMO — this app contains intentional vulnerabilities and only fake,
      seeded data. Never enter real credentials or personal data.
    </div>
  );
}
