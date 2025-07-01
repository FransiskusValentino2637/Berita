import { supabase } from "./config.js";

document.getElementById("loginForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const loginBtn = document.getElementById("loginBtn");
  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase
    .from("admins") // Asumsi tabel admin tetap 'admins'
    .select("*")
    .eq("email", email)
    .eq("password", password)
    .single();

  if (error || !data) {
    alert("Login gagal, cek email dan password!");
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  } else {
    localStorage.setItem("admin", JSON.stringify(data));
    window.location.href = "admin-berita.html"; // Arahkan ke halaman admin berita
  }
});