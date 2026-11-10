"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleLogin = (e: any) => {
    e.preventDefault()
    // For now - simple check, we will make it secure next
    if (email === "admin@polarcopilot.co.ke" && password === "Clearport123") {
      localStorage.setItem("loggedIn", "true")
      router.push("/")
    } else {
      alert("Wrong email or password")
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 20 }}>
      <h1>Polar Copilot - Agent Login</h1>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Log In</button>
      </form>
    </div>
  )
}
