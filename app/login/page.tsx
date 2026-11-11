"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    // Check role from profiles table
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    if (!profile) return alert("No profile found");
    router.push("/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", backgroundSize: "cover", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "rgba(255,255,255,0.95)", padding: 32, borderRadius: 20, width: "90%", maxWidth: 420, textAlign: "center" }}>
        <h1 style={{ color: "#2563EB" }}>🐻‍❄️ Polar Copilot</h1>
        <h2 style={{ fontSize: 28, margin: "16px 0" }}>Welcome Back</h2>
        <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <span>✉️</span>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ border: "none", outline: "none", marginLeft: 10, flex: 1 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <span>🔒</span>
          <input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={{ border: "none", outline: "none", marginLeft: 10, flex: 1 }} />
          <span onClick={() => setShow(!show)} style={{ cursor: "pointer" }}>👁️</span>
        </div>
        <button onClick={handleLogin} style={{ background: "#2563EB", color: "white", width: "100%", padding: 15, borderRadius: 10, fontSize: 18, border: "none" }}>Login</button>
        <p style={{ fontSize: 13, color: "#555", marginTop: 14 }}>User Login only</p>
      </div>
    </div>
  );
}"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    // Check role from profiles table
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    if (!profile) return alert("No profile found");
    router.push("/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", backgroundImage: "url('/mombasa-port.jpg')", backgroundSize: "cover", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "rgba(255,255,255,0.88)", padding: 32, borderRadius: 20, width: "90%", maxWidth: 420, textAlign: "center" }}>
        <h1 style={{ color: "#2563EB" }}>🐻‍❄️ Polar Copilot</h1>
        <h2 style={{ fontSize: 28, margin: "16px 0" }}>Welcome Back</h2>
        <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <span>✉️</span>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ border: "none", outline: "none", marginLeft: 10, flex: 1 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <span>🔒</span>
          <input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={{ border: "none", outline: "none", marginLeft: 10, flex: 1 }} />
          <span onClick={() => setShow(!show)} style={{ cursor: "pointer" }}>👁️</span>
        </div>
        <button onClick={handleLogin} style={{ background: "#2563EB", color: "white", width: "100%", padding: 15, borderRadius: 10, fontSize: 18, border: "none" }}>Login</button>
        <p style={{ fontSize: 13, color: "#555", marginTop: 14 }}>User Login only</p>
      </div>
    </div>
  );
}
