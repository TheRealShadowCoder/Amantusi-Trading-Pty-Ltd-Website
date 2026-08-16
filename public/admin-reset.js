document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#reset-form");
  const status = document.querySelector("#reset-status");
  const params = new URLSearchParams(location.search);
  const email = params.get("email") || "";
  const token = params.get("token") || "";

  if (!email || !token) {
    status.textContent = "This password reset link is invalid or incomplete.";
    form.querySelector("button").disabled = true;
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = document.querySelector("#new-password").value;
    const confirmPassword = document.querySelector("#confirm-password").value;

    if (password !== confirmPassword) {
      status.textContent = "The passwords do not match.";
      return;
    }

    if (password.length < 14) {
      status.textContent = "Use at least 14 characters.";
      return;
    }

    const button = event.submitter;
    button.disabled = true;
    status.textContent = "Updating password…";

    try {
      const response = await fetch("/api/admin/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword: password })
      });

      let payload = {};
      try { payload = await response.json(); } catch (_) {}

      if (!response.ok) {
        status.textContent = payload.error || "The password could not be updated.";
        button.disabled = false;
        return;
      }

      status.textContent = payload.message || "Password updated successfully.";
      form.reset();
      history.replaceState({}, document.title, "/admin-reset.html");

      setTimeout(() => {
        location.href = "/admin.html";
      }, 1800);
    } catch (_) {
      status.textContent = "The password reset service is not reachable.";
      button.disabled = false;
    }
  });
});
