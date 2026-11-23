/* Камертон — интерактив лендинга. Без зависимостей. */
(() => {
  "use strict";

  const root = document.documentElement;
  const header = document.getElementById("header");
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  const themeToggle = document.getElementById("theme-toggle");
  const form = document.getElementById("signup-form");
  const status = document.getElementById("form-status");

  /* ---------- Тема ---------- */

  const THEME_KEY = "kamerton-theme";

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    themeToggle.setAttribute("aria-pressed", String(theme === "light"));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#fbfaf8" : "#0d0f14");
  };

  let stored = null;
  try { stored = localStorage.getItem(THEME_KEY); } catch { /* приватный режим */ }
  applyTheme(stored || "dark");

  themeToggle?.addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  });

  /* ---------- Мобильное меню ---------- */

  const closeNav = () => {
    nav.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  };

  burger?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
  });

  nav?.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeNav();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });

  /* ---------- Шапка при скролле ---------- */

  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Появление блоков ---------- */

  const revealables = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("visible"));
  }

  // Страховка: если IO не сработал (фоновая вкладка, старый браузер),
  // через 1,5 с показываем блоки, которые уже в зоне видимости.
  window.setTimeout(() => {
    const vh = window.innerHeight;
    revealables.forEach((el) => {
      if (el.classList.contains("visible")) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < vh && rect.bottom > 0) el.classList.add("visible");
    });
  }, 1500);

  /* ---------- Аккордеон: открыт один ---------- */

  const details = [...document.querySelectorAll(".faq details")];
  details.forEach((d) => {
    d.addEventListener("toggle", () => {
      if (!d.open) return;
      details.forEach((other) => { if (other !== d) other.open = false; });
    });
  });

  /* ---------- Год ---------- */

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Форма ---------- */

  const digits = (value) => value.replace(/\D/g, "");

  const normalizePhone = (value) => {
    let d = digits(value);
    if (d.startsWith("8")) d = "7" + d.slice(1);
    if (!d.startsWith("7")) d = "7" + d;
    d = d.slice(0, 11);
    const p = d.slice(1);
    let out = "+7";
    if (p.length) out += ` (${p.slice(0, 3)}`;
    if (p.length >= 3) out += ")";
    if (p.length > 3) out += ` ${p.slice(3, 6)}`;
    if (p.length > 6) out += `-${p.slice(6, 8)}`;
    if (p.length > 8) out += `-${p.slice(8, 10)}`;
    return out;
  };

  const phoneInput = document.getElementById("phone");
  phoneInput?.addEventListener("input", () => {
    const cursorAtEnd = phoneInput.selectionStart === phoneInput.value.length;
    phoneInput.value = normalizePhone(phoneInput.value);
    if (cursorAtEnd) phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length);
  });

  const setError = (field, message) => {
    const el = document.querySelector(`.error[data-for="${field}"]`);
    const input = document.getElementById(field === "consent" ? "consent" : field);
    if (el) el.textContent = message;
    if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
  };

  const validate = () => {
    const name = document.getElementById("name");
    const consent = document.getElementById("consent");
    let ok = true;

    if (name.value.trim().length < 2) {
      setError("name", "Напишите имя — хотя бы две буквы");
      ok = false;
    } else setError("name", "");

    if (digits(phoneInput.value).length !== 11) {
      setError("phone", "Нужен номер из 11 цифр");
      ok = false;
    } else setError("phone", "");

    if (!consent.checked) {
      setError("consent", "Без согласия не можем принять заявку");
      ok = false;
    } else setError("consent", "");

    return ok;
  };

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    status.className = "form-status";
    status.textContent = "";

    if (!validate()) {
      status.textContent = "Проверьте выделенные поля.";
      status.classList.add("bad");
      return;
    }

    const btn = document.getElementById("submit-btn");
    const payload = {
      name: document.getElementById("name").value.trim(),
      phone: phoneInput.value,
      program: document.getElementById("program").value,
      at: new Date().toISOString(),
    };

    btn.disabled = true;
    btn.textContent = "Отправляем…";

    // Демо-лендинг без бэкенда: заявка пишется в localStorage,
    // в реальном проекте здесь fetch('/api/signup', ...).
    try {
      const key = "kamerton-requests";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push(payload);
      localStorage.setItem(key, JSON.stringify(list));
    } catch { /* ignore */ }

    window.setTimeout(() => {
      btn.disabled = false;
      btn.textContent = "Записаться";
      form.reset();
      status.textContent = `Спасибо, ${payload.name}! Перезвоним в течение рабочего дня.`;
      status.classList.add("ok");
    }, 650);
  });

  // живые подсказки после первого касания
  ["name", "phone"].forEach((id) => {
    const input = document.getElementById(id);
    input?.addEventListener("blur", () => {
      if (!input.value) return;
      if (id === "name") setError("name", input.value.trim().length < 2 ? "Напишите имя — хотя бы две буквы" : "");
      if (id === "phone") setError("phone", digits(input.value).length === 11 ? "" : "Нужен номер из 11 цифр");
    });
  });
})();
