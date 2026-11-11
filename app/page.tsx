import Link from "next/link";

export default function Home() {
  return (
    <div style={{ padding: 40, fontFamily: "sans-serif", textAlign: "center" }}>
      <h1>Polar Copilot</h1>
      <p>Your AI copilot is ready.</p>
      <Link href="/login" style={{ padding: 10, background: "black", color: "white", borderRadius: 8, textDecoration: "none" }}>
        Go to Login
      </Link>
    </div>
  );
}
