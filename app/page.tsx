"use client";
import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [ref, setRef] = useState("");
  const [message, setMessage] = useState("");

  const handleUpload = async (e: any) => {
  e.preventDefault();
  setMessage("Uploading to Polar Copilot Middleware... Please wait");
  const formData = new FormData(e.target);
  formData.append("email", email);
  try {
    const res = await fetch("https://polar-copilot-middleware.onrender.com/api/digicust/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.reference || data.ref) {
      const newRef = data.reference || data.ref;
      setRef(newRef);
      setMessage(`Files received! Your reference is ${newRef}. Digicust is classifying...`);
    } else {
      setMessage("Uploaded, but no reference returned. Check Render Logs.");
    }
  } catch (err) {
    setMessage("Upload failed - Middleware may be waking up. Wait 50 sec and try again.");
  }
};

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", padding: 20, fontFamily: "sans-serif" }}>
      <h1>Clearport KE - Polar Copilot</h1>
      <p>Upload Bill of Lading, Commercial Invoice & Packing List. Get your Filing Pack for KRA iCMS.</p>

      <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>Email</label>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agent@example.com" style={{ padding: 10 }} />

        <label>Bill of Lading (PDF)</label>
<input required type="file" name="billOfLading" accept=".pdf" />

<label>Commercial Invoice (PDF)</label>
<input required type="file" name="invoice" accept=".pdf" />

<label>Packing List (PDF)</label>
<input required type="file" name="packingList" accept=".pdf" />

<label>IDF - Import Declaration Form (PDF) - Optional</label>
<input type="file" name="idf" accept=".pdf" />

<label>Certificate of Origin (PDF) - Optional</label>
<input type="file" name="certificateOfOrigin" accept=".pdf" />

<label>Insurance Certificate (PDF) - Optional</label>
<input type="file" name="insurance" accept=".pdf" />
        <button type="submit" style={{ padding: 12, background: "black", color: "white", border: "none", cursor: "pointer" }}>
          Upload & Get Reference
        </button>
      </form>

      {message && <div style={{ marginTop: 20, padding: 12, background: "#e7f8e7", border: "1px solid green" }}>{message}</div>}

      <hr style={{ margin: "30px 0" }} />
      <h3>Already uploaded? Download Filing Pack</h3>
      <p>Enter your reference like FILE-101 and email to get download link.</p>
      <input placeholder="FILE-101" style={{ padding: 10, width: "100%", marginBottom: 10 }} />
      <button style={{ padding: 10, width: "100%" }}>Get Download Link</button>
    </main>
  );
}
