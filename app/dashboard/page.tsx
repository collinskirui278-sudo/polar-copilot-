"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
        return;
      }
      setEmail(data.session.user.email || "");
      setLoading(false);
    }
    check();
  }, [router]);

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Clearport KE - Polar Copilot</h1>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", background: "white", cursor: "pointer" }}
        >
          Logout
        </button>
      </div>
      <p>Upload Bill of Lading, Commercial Invoice & Packing List. Get your Filing Pack for KRA iCMS.</p>
      <p style={{ fontSize: 13, color: "#555" }}>Logged in as: {email}</p>

      <label>Email</label>
      <input defaultValue={email} placeholder="agent@example.com" style={{ width: "100%", padding: 10, margin: "8px 0 16px", display: "block" }} />

      <label>Bill of Lading (PDF)</label>
      <input type="file" accept="application/pdf" style={{ display: "block", margin: "8px 0 16px" }} />

      <label>Commercial Invoice (PDF)</label>
      <input type="file" accept="application/pdf" style={{ display: "block", margin: "8px 0 16px" }} />

      <label>Packing List (PDF)</label>
      <input type="file" accept="application/pdf" style={{ display: "block", margin: "8px 0 16px" }} />

      <label>IDF - Import Declaration Form (PDF) - Optional</label>
      <input type="file" accept="application/pdf" style={{ display: "block", margin: "8px 0 16px" }} />

      <label>Certificate of Origin (PDF) - Optional</label>
      <input type="file" accept="application/pdf" style={{ display: "block", margin: "8px 0 16px" }} />

      <label>Insurance Certificate (PDF) - Optional</label>
      <input type="file" accept="application/pdf" style={{ display: "block", margin: "8px 0 16px" }} />

      <button style={{ width: "100%", padding: 14, background: "black", color: "white", border: "none", marginTop: 10 }}>
        Upload & Get Reference
      </button>

      <hr style={{ margin: "30px 0" }} />

      <h2>Already uploaded? Download Filing Pack</h2>
      <p>Enter your reference like FILE-101 and email to get download link.</p>
      <input value={ref} onChange={e => setRef(e.target.value)} placeholder="FILE-101" style={{ width: "100%", padding: 10, margin: "8px 0" }} />
      <button style={{ width: "100%", padding: 12, background: "white", border: "1px solid #ccc" }}>
        Get Download Link
      </button>
    </div>
  );
               }
