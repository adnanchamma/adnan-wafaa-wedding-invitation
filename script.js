/* =========================================================
   ADNAN & WAFAA — Wedding Invitation
   Configure the values in CONFIG before publishing.
   ========================================================= */

const CONFIG = {
  // Google Apps Script Web App URL:
  // 1. Create a Google Sheet.
  // 2. Extensions > Apps Script.
  // 3. Deploy as Web App and paste the /exec URL below.
  googleSheetsEndpoint: "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL",

  // Countdown uses Istanbul time (+03:00 in July).
  weddingDate: "2027-07-10T19:00:00+03:00"
};

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("locked");

  const preloader = document.getElementById("preloader");
  setTimeout(() => preloader.classList.add("hidden"), 700);

  setupEnvelope();
  setupGuest();
  setupCountdown();
  setupMusic();
  setupRevealAnimations();
  setupRSVP();
});

function setupEnvelope() {
  const overlay = document.getElementById("envelopeOverlay");
  const envelope = overlay.querySelector(".envelope");
  const button = document.getElementById("openInvitation");

  button.addEventListener("click", () => {
    envelope.classList.remove("sealed");
    envelope.classList.add("open");

    setTimeout(() => {
      overlay.classList.add("opened");
      document.body.classList.remove("locked");
      document.querySelector(".hero")?.scrollIntoView({ behavior: "smooth" });
    }, 950);
  });
}

function setupGuest() {
  const params = new URLSearchParams(window.location.search);
  const guest = params.get("guest");

  if (!guest) return;

  const decoded = decodeURIComponent(guest.replace(/\+/g, " ")).trim();
  if (!decoded) return;

  const guestInput = document.getElementById("guestName");
  const hiddenInput = document.getElementById("guestFromUrl");

  guestInput.value = decoded;
  hiddenInput.value = decoded;

  // Personalize the page title without changing the invitation design.
  document.title = `${decoded} — Adnan & Wafaa`;
}

function setupCountdown() {
  const target = new Date(CONFIG.weddingDate).getTime();

  const update = () => {
    const now = Date.now();
    const distance = target - now;

    const days = document.getElementById("days");
    const hours = document.getElementById("hours");
    const minutes = document.getElementById("minutes");
    const seconds = document.getElementById("seconds");

    if (distance <= 0) {
      days.textContent = "000";
      hours.textContent = "00";
      minutes.textContent = "00";
      seconds.textContent = "00";
      return;
    }

    days.textContent = String(Math.floor(distance / 86400000)).padStart(3, "0");
    hours.textContent = String(Math.floor((distance / 3600000) % 24)).padStart(2, "0");
    minutes.textContent = String(Math.floor((distance / 60000) % 60)).padStart(2, "0");
    seconds.textContent = String(Math.floor((distance / 1000) % 60)).padStart(2, "0");
  };

  update();
  setInterval(update, 1000);
}

function setupMusic() {
  const audio = document.getElementById("weddingMusic");
  const control = document.getElementById("musicControl");
  const label = document.getElementById("musicLabel");

  control.addEventListener("click", async () => {
    try {
      if (audio.paused) {
        await audio.play();
        control.classList.add("playing");
        label.textContent = "Pause";
      } else {
        audio.pause();
        control.classList.remove("playing");
        label.textContent = "Music";
      }
    } catch (error) {
      label.textContent = "Add MP3";
      console.warn("Music could not be played:", error);
    }
  });
}

function setupRevealAnimations() {
  const items = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    items.forEach(item => item.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach(item => observer.observe(item));
}

function setupRSVP() {
  const form = document.getElementById("rsvpForm");
  const status = document.getElementById("formStatus");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector("button");
    const data = Object.fromEntries(new FormData(form).entries());

    if (CONFIG.googleSheetsEndpoint === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL") {
      status.textContent = "RSVP captured locally — connect your Google Sheets endpoint in script.js.";
      console.log("RSVP payload:", data);
      form.reset();

      // Preserve guest URL value after reset.
      const guest = new URLSearchParams(window.location.search).get("guest");
      if (guest) document.getElementById("guestName").value = decodeURIComponent(guest.replace(/\+/g, " "));
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    status.textContent = "";

    try {
      await fetch(CONFIG.googleSheetsEndpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          submittedAt: new Date().toISOString(),
          pageUrl: window.location.href
        })
      });

      status.textContent = "Thank you. Your RSVP has been received.";
      form.reset();
    } catch (error) {
      status.textContent = "Something went wrong. Please try again or contact us directly.";
      console.error(error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send RSVP";
    }
  });
}
