export const metadata = {
  title: "Clearport KE - Polar Copilot",
  description: "Upload BL, Invoice, Packing List, verify with Digicust AI, download Filing Pack for KRA iCMS.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
