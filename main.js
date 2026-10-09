(() => {
  const cfg = window.FTB_CONFIG || {};
  const isUrl = (s) => typeof s === "string" && /^https:\/\/\S+$/.test(s.trim());

  // ---- Contract address + copy ----
  const ca = (cfg.contractAddress || "").trim();
  const caValue = document.getElementById("ca-value");
  const caCopy = document.getElementById("ca-copy");
  const caStatus = document.getElementById("ca-status");
  if (ca) {
    caValue.textContent = ca;
    caValue.classList.add("has-ca");
    caCopy.disabled = false;
    caStatus.textContent = "Always double-check this matches our official socials.";
    caCopy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(ca);
      } catch {
        const r = document.createRange();
        r.selectNodeContents(caValue);
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        document.execCommand("copy");
        sel.removeAllRanges();
      }
      caCopy.textContent = "Copied!";
      caStatus.textContent = "Address copied. Solidarity, comrade.";
      setTimeout(() => (caCopy.textContent = "Copy"), 2000);
    });
  }

  // ---- Pump.fun link ----
  const pump = document.getElementById("pump-link");
  if (isUrl(cfg.pumpFunUrl)) {
    pump.href = cfg.pumpFunUrl.trim();
    pump.target = "_blank";
    pump.rel = "noopener noreferrer";
    pump.classList.remove("is-disabled");
    pump.removeAttribute("aria-disabled");
    pump.querySelector(".soon")?.remove();
  } else {
    pump.addEventListener("click", (e) => e.preventDefault());
  }

  // ---- Socials ----
  document.querySelectorAll("[data-social]").forEach((a) => {
    const url = (cfg.socials || {})[a.dataset.social];
    if (isUrl(url)) {
      a.href = url.trim();
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.classList.remove("is-disabled");
      a.removeAttribute("aria-disabled");
      a.querySelector(".soon")?.remove();
    } else {
      a.addEventListener("click", (e) => e.preventDefault());
    }
  });

  // ---- Scroll reveals ----
  const targets = document.querySelectorAll(".reveal, .stamp");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      }),
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((t) => io.observe(t));
  } else {
    targets.forEach((t) => t.classList.add("is-visible"));
  }

  document.getElementById("year").textContent = new Date().getFullYear();
})();
