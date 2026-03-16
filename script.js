/* Volodymyrovych Design - Main Script */

/* --- Preloader --- */
(function () {
  var preloader = document.getElementById('preloader');
  if (!preloader) return;
  var startTime = Date.now();
  var minTime = 2000;
  function hidePreloader() {
    var elapsed = Date.now() - startTime;
    var delay = Math.max(minTime - elapsed, 0);
    setTimeout(function () {
      preloader.classList.add('is-hidden');
      preloader.addEventListener('transitionend', function () {
        preloader.remove();
        document.body.style.overflow = '';
      }, { once: true });
    }, delay);
  }
  document.body.style.overflow = 'hidden';
  if (document.readyState === 'complete') {
    hidePreloader();
  } else {
    window.addEventListener('load', hidePreloader, { once: true });
  }
}());

document.addEventListener("DOMContentLoaded", function () {

  /* --- Full-screen menu --- */
  var menu = document.getElementById("fullMenu");
  var openBtn = document.getElementById("openMenu");
  var closeBtn = document.getElementById("closeMenu");
  var menuNav = document.querySelector(".menu-nav");
  var menuTrack = document.getElementById("menuTrack");
  var menuItems = document.querySelectorAll(".menu-item");
  var menuLinks = document.querySelectorAll(".menu-item a");
  var baseProgress = 0;
  var hoveredItemIndex = -1;
  var menuProgress = 0;
  var targetMenuProgress = 0;
  var currentMenuProgress = 0;
  var targetTrackX = 0;
  var currentTrackX = 0;
  var menuRafId = null;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getTrackMaxShift() {
    if (!menuNav || !menuTrack) return 0;
    return Math.max(menuTrack.scrollWidth - menuNav.clientWidth, 0);
  }

  function getMenuItemIndex(itemEl) {
    for (var i = 0; i < menuItems.length; i++) {
      if (menuItems[i] === itemEl) return i;
    }
    return -1;
  }

  function getItemVisibilityBias(index) {
    if (index === 0) return -0.06;
    if (index === menuItems.length - 1) return 0.06;
    return 0;
  }

  function getProgressForItem(itemIndex) {
    if (!menuNav || !menuTrack || !menuItems.length) return 0;
    var maxShift = getTrackMaxShift();
    if (maxShift <= 0) return 0;

    var boundedIndex = clamp(itemIndex, 0, menuItems.length - 1);
    var item = menuItems[boundedIndex];
    var itemCenter = item.offsetLeft + item.offsetWidth / 2;
    var viewportCenter = menuNav.clientWidth / 2;
    var requiredShift = viewportCenter - itemCenter;

    return clamp((-requiredShift) / maxShift, 0, 1);
  }

  function updateActiveByPosition() {
    if (!menuNav || !menuItems.length) return;

    if (hoveredItemIndex >= 0 && hoveredItemIndex < menuItems.length) {
      menuItems.forEach(function (item, itemIndex) {
        item.classList.toggle("is-active", itemIndex === hoveredItemIndex);
      });
      return;
    }

    var viewportCenter = menuNav.clientWidth / 2;
    var bestIndex = 0;
    var bestDistance = Infinity;

    menuItems.forEach(function (item, itemIndex) {
      var itemCenter = item.offsetLeft + item.offsetWidth / 2 + currentTrackX;
      var distance = Math.abs(itemCenter - viewportCenter);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = itemIndex;
      }
    });

    menuItems.forEach(function (item, itemIndex) {
      item.classList.toggle("is-active", itemIndex === bestIndex);
    });
  }

  function pointerToProgress(pointerRatio) {
    var centeredRatio = clamp(pointerRatio, 0, 1) - 0.5;
    if (Math.abs(centeredRatio) < 0.03) {
      return baseProgress;
    }

    var direction = centeredRatio < 0 ? -1 : 1;
    var normalized = Math.min(Math.abs(centeredRatio) / 0.5, 1);
    var eased = Math.pow(normalized, 1.2);

    if (direction < 0) {
      return baseProgress - eased * baseProgress;
    }
    return baseProgress + eased * (1 - baseProgress);
  }

  function setMenuProgress(nextProgress) {
    targetMenuProgress = clamp(nextProgress, 0, 1);
  }

  function syncTrackInstant() {
    targetMenuProgress = clamp(menuProgress, 0, 1);
    currentMenuProgress = targetMenuProgress;
    targetTrackX = -getTrackMaxShift() * currentMenuProgress;
    currentTrackX = targetTrackX;
    if (menuTrack) {
      menuTrack.style.transform = "translate3d(" + currentTrackX.toFixed(2) + "px, 0, 0)";
    }
    updateActiveByPosition();
  }

  function renderTrack() {
    if (!menu || !menu.classList.contains("active") || !menuTrack) {
      menuRafId = null;
      return;
    }

    currentMenuProgress += (targetMenuProgress - currentMenuProgress) * 0.08;
    if (Math.abs(targetMenuProgress - currentMenuProgress) < 0.0004) {
      currentMenuProgress = targetMenuProgress;
    }

    targetTrackX = -getTrackMaxShift() * currentMenuProgress;
    currentTrackX += (targetTrackX - currentTrackX) * 0.11;
    if (Math.abs(targetTrackX - currentTrackX) < 0.08) {
      currentTrackX = targetTrackX;
    }
    menuTrack.style.transform = "translate3d(" + currentTrackX.toFixed(2) + "px, 0, 0)";
    updateActiveByPosition();
    menuRafId = requestAnimationFrame(renderTrack);
  }

  function startTrackRender() {
    if (menuRafId !== null) return;
    menuRafId = requestAnimationFrame(renderTrack);
  }

  function openMenu() {
    if (!menu) return;
    menu.classList.add("active");
    menu.setAttribute("aria-hidden", "false");
    document.body.classList.add("menu-open");
    if (openBtn) openBtn.setAttribute("aria-expanded", "true");
    hoveredItemIndex = -1;
    baseProgress = getProgressForItem(Math.min(2, Math.max(menuItems.length - 1, 0)));
    menuProgress = baseProgress;
    targetMenuProgress = baseProgress;
    currentMenuProgress = baseProgress;
    syncTrackInstant();
    startTrackRender();
  }

  function closeMenu() {
    if (!menu) return;
    menu.classList.remove("active");
    menu.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
    if (openBtn) openBtn.setAttribute("aria-expanded", "false");
    if (menuRafId !== null) {
      cancelAnimationFrame(menuRafId);
      menuRafId = null;
    }
    hoveredItemIndex = -1;
    menuProgress = 0;
    targetMenuProgress = 0;
    currentMenuProgress = 0;
    targetTrackX = 0;
    currentTrackX = 0;
    if (menuTrack) menuTrack.style.transform = "translate3d(0px, 0, 0)";
    menuItems.forEach(function (item) {
      item.classList.remove("is-active");
    });
  }

  if (openBtn) openBtn.addEventListener("click", openMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);

  menuLinks.forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  if (menuNav) {
    menuNav.addEventListener("mousemove", function (e) {
      if (!menu || !menu.classList.contains("active")) return;
      if (menuTrack) {
        var trackRect = menuTrack.getBoundingClientRect();
        if (e.clientY < trackRect.top || e.clientY > trackRect.bottom) return;
      }
      var rect = menuNav.getBoundingClientRect();
      var pointerProgress = pointerToProgress((e.clientX - rect.left) / Math.max(rect.width, 1));
      var hoveredItem = e.target.closest(".menu-item");

      if (hoveredItem && menuTrack && menuTrack.contains(hoveredItem)) {
        hoveredItemIndex = getMenuItemIndex(hoveredItem);
        var hoverProgress = getProgressForItem(hoveredItemIndex);
        var bias = getItemVisibilityBias(hoveredItemIndex);
        pointerProgress = pointerProgress * 0.55 + hoverProgress * 0.45 + bias;
      } else {
        hoveredItemIndex = -1;
      }

      setMenuProgress(pointerProgress);
    });

    menuNav.addEventListener("mouseleave", function () {
      hoveredItemIndex = -1;
    });

    menuNav.addEventListener("wheel", function (e) {
      if (!menu || !menu.classList.contains("active")) return;
      var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!delta) return;
      setMenuProgress(targetMenuProgress + delta * 0.00045);
      e.preventDefault();
    }, { passive: false });
  }

  window.addEventListener("resize", function () {
    if (menu && menu.classList.contains("active")) {
      syncTrackInstant();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu && menu.classList.contains("active")) closeMenu();
  });

  /* --- Language switch + i18n --- */
  var rotatingWord = document.getElementById("rotating-word");
  var langButtons = Array.prototype.slice.call(document.querySelectorAll(".lang-switch-btn"));
  var rotatingWordTimerId = null;
  var currentLanguage = "en";

  var i18n = {
    en: {
      "meta.title": "Volodymyrovych — Digital Agency",
      "meta.description": "Volodymyrovych is a digital design agency from Warsaw and New York creating websites, brands and digital products.",
      "menu.main": "main",
      "menu.about": "about",
      "menu.cases": "cases",
      "menu.contact": "contact",
      "menu.navAria": "Main menu",
      "menu.openAria": "Open menu",
      "menu.closeAria": "Close menu",
      "availability.aria": "Available for work. Send email",
      "availability.text": "Available for work",
      "lang.switchAria": "Switch language",
      "hero.tagline": "Independent Developer — Based in Ukraine — Available Worldwide",
      "hero.line1": "I build",
      "hero.line2": "for business",
      "hero.basedIn": "Based in",
      "clock.ukraine": "Ukraine",
      "works.heading.selected": "Selected",
      "works.heading.project": "Project",
      "works.card1.aria": "Chocomadebox — Custom Development",
      "works.card1.sub": "Custom Development",
      "works.card1.back": "Designed and developed chocolatebox.shop from the ground up, moving from custom CSS and styling to complex backend integrations. Successfully synchronized the platform with SalesDrive CRM and Nova Poshta API, while ensuring top-tier security through encrypted environment variables and secure payment processing.",
      "works.card2.aria": "Nite|lex — Custom Development / Clean Code",
      "works.card2.sub": "Custom Development / Clean Code",
      "works.card2.back": "Developed a custom education-focused platform from scratch. Engineered a seamless integration between the web frontend and a proprietary Telegram bot, automating lead generation and ensuring all course applications are processed in real time.",
      "works.card3.aria": "Secure Data Vault — advanced encryption for business-critical keys.",
      "works.card3.sub": "Advanced encryption for business-critical keys.",
      "works.card3.back": "Secure Data Vault. Server-side IP masking is implemented through secure backend requests to hide origin addresses and protect infrastructure. Advanced encryption protects business-critical API keys and sensitive credentials. All third-party integrations such as payments, CRM, and logistics are processed on the server so private data is never exposed to the browser.",
      "works.card4.aria": "Full Integration — Connect your favorite tools",
      "works.card4.sub": "Connect your favorite tools",
      "works.card4.back": "Advanced logistics with Nova Poshta API integration for real-time tracking, automated waybill generation, and dynamic branch selection. Seamless CRM connectivity with SalesDrive and other systems for lead management and order synchronization. Secure payment infrastructure with LiqPay, WayForPay, Stripe, or custom banking gateways. Flexible REST API integrations for marketing, accounting, and inventory automation.",
      "services.heading.static": "What we can",
      "services.heading.moving": "Do for you",
      "services.01.title": "Web Development & Replication",
      "services.01.description": "Tailored website creation from scratch or precise replication of existing solutions. I focus on adaptive structures, clean code, and seamless content migration to ensure your site looks and works perfectly.",
      "services.02.title": "E-commerce & Payment Solutions",
      "services.02.description": "Integration of secure payment gateways and checkout systems. From standard card payments to crypto-gateways, I ensure a smooth and reliable transaction flow for your customers.",
      "services.03.title": "Business Automation & CRM",
      "services.03.description": "Fast, reliable connection of CRM systems and third-party services. I automate your business processes by synchronizing data flows, ensuring no lead or customer interaction is ever lost.",
      "services.04.title": "Infrastructure & Security",
      "services.04.description": "Comprehensive server-side setup, including API key protection and IP-restricted access. I ensure your digital assets are shielded with robust security protocols and maintainable backend logic.",
      "services.05.title": "Branding & Visual Identity",
      "services.05.description": "Creation of distinct logos and visual systems. I align aesthetic design with your business goals to make your brand feel premium, memorable, and professional from the first click.",
      "footer.menu.title": "Menu",
      "footer.menu.work": "Work",
      "footer.menu.services": "Services",
      "footer.menu.contact": "Contact",
      "footer.social.title": "Social"
    },
    ua: {
      "meta.title": "Volodymyrovych — Діджитал Агенція",
      "meta.description": "Volodymyrovych — діджитал агенція, що створює сайти, бренди та цифрові продукти.",
      "menu.main": "головна",
      "menu.about": "послуги",
      "menu.cases": "кейси",
      "menu.contact": "контакт",
      "menu.navAria": "Головне меню",
      "menu.openAria": "Відкрити меню",
      "menu.closeAria": "Закрити меню",
      "availability.aria": "Доступний для роботи. Надіслати email",
      "availability.text": "Доступний для роботи",
      "lang.switchAria": "Перемикач мови",
      "hero.tagline": "Незалежний розробник — Базуюсь в Україні — Працюю по всьому світу",
      "hero.line1": "Я створюю",
      "hero.line2": "для бізнесу",
      "hero.basedIn": "Базуюсь в",
      "clock.ukraine": "Україна",
      "works.heading.selected": "Обрані",
      "works.heading.project": "Проєкти",
      "works.card1.aria": "Chocomadebox — Індивідуальна розробка",
      "works.card1.sub": "Індивідуальна розробка",
      "works.card1.back": "Спроєктував і розробив chocolatebox.shop з нуля: від кастомного CSS і стилізації до складних backend-інтеграцій. Успішно синхронізував платформу з SalesDrive CRM та API Нової Пошти, забезпечивши високий рівень безпеки через зашифровані змінні середовища та захищені платіжні процеси.",
      "works.card2.aria": "Nite|lex — Індивідуальна розробка / Чистий код",
      "works.card2.sub": "Індивідуальна розробка / Чистий код",
      "works.card2.back": "Розробив кастомну освітню платформу з нуля. Реалізував безшовну інтеграцію між вебфронтендом і власним Telegram-ботом, автоматизувавши генерацію лідів і обробку заявок на курси в реальному часі.",
      "works.card3.aria": "Secure Data Vault — розширене шифрування для критичних ключів.",
      "works.card3.sub": "Розширене шифрування для критичних ключів.",
      "works.card3.back": "Secure Data Vault. Реалізовано серверне маскування IP через захищені backend-запити для приховування джерела і захисту інфраструктури. Впроваджено розширене шифрування для API-ключів і чутливих даних. Усі інтеграції з платежами, CRM і логістикою виконуються на сервері, тому приватні дані не потрапляють у браузер.",
      "works.card4.aria": "Full Integration — Інтеграція ваших улюблених сервісів",
      "works.card4.sub": "Інтеграція ваших улюблених сервісів",
      "works.card4.back": "Поглиблена логістична інтеграція з API Нової Пошти: трекінг у реальному часі, автоматичне створення ТТН і динамічний вибір відділення. Синергія з CRM (SalesDrive та іншими) для автоматизації лідів і синхронізації замовлень. Безпечна платіжна інфраструктура з LiqPay, WayForPay, Stripe або кастомними банківськими шлюзами. Гнучкі REST API-інтеграції для автоматизації маркетингу, обліку та складу.",
      "services.heading.static": "Що ми можемо",
      "services.heading.moving": "зробити для вас",
      "services.01.title": "Веброзробка та Реплікація",
      "services.01.description": "Індивідуальне створення сайтів з нуля або точна реплікація існуючих рішень. Фокусуюсь на адаптивній структурі, чистому коді та безшовній міграції контенту, щоб ваш сайт виглядав і працював бездоганно.",
      "services.02.title": "E-commerce та Платіжні Рішення",
      "services.02.description": "Інтеграція захищених платіжних шлюзів і checkout-систем. Від стандартних карткових оплат до crypto-шлюзів — забезпечую стабільний і зручний платіжний флоу для ваших клієнтів.",
      "services.03.title": "Автоматизація Бізнесу та CRM",
      "services.03.description": "Швидке та надійне підключення CRM-систем і сторонніх сервісів. Автоматизую бізнес-процеси через синхронізацію потоків даних, щоб жоден лід або контакт не втрачався.",
      "services.04.title": "Інфраструктура та Безпека",
      "services.04.description": "Комплексне серверне налаштування, включно із захистом API-ключів і доступом за IP. Ваші цифрові активи захищені надійними протоколами безпеки та підтримуваною backend-логікою.",
      "services.05.title": "Брендинг та Візуальна Айдентика",
      "services.05.description": "Створення виразних логотипів і візуальних систем. Поєдную естетику дизайну з бізнес-цілями, щоб ваш бренд виглядав преміально, запам'ятовувався і працював з першого контакту.",
      "footer.menu.title": "Меню",
      "footer.menu.work": "Роботи",
      "footer.menu.services": "Послуги",
      "footer.menu.contact": "Контакт",
      "footer.social.title": "Соцмережі"
    }
  };

  var rotatingWords = {
    en: ["interfaces", "payment systems", "secure sites", "brands"],
    ua: ["інтерфейси", "платіжні системи", "безпечні сайти", "бренди"]
  };

  function getTranslation(lang, key) {
    if (i18n[lang] && Object.prototype.hasOwnProperty.call(i18n[lang], key)) {
      return i18n[lang][key];
    }
    if (i18n.en && Object.prototype.hasOwnProperty.call(i18n.en, key)) {
      return i18n.en[key];
    }
    return "";
  }

  function applyTextTranslations(lang) {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var translated = getTranslation(lang, key);
      if (translated) el.textContent = translated;
    });
  }

  function applyAttributeTranslations(lang) {
    var attrMappings = [
      { selector: "[data-i18n-attr-aria-label]", dataAttr: "data-i18n-attr-aria-label", attr: "aria-label" },
      { selector: "[data-i18n-attr-content]", dataAttr: "data-i18n-attr-content", attr: "content" },
      { selector: "[data-i18n-attr-data-clock-label]", dataAttr: "data-i18n-attr-data-clock-label", attr: "data-clock-label" }
    ];

    attrMappings.forEach(function (mapping) {
      document.querySelectorAll(mapping.selector).forEach(function (el) {
        var key = el.getAttribute(mapping.dataAttr);
        var translated = getTranslation(lang, key);
        if (translated) el.setAttribute(mapping.attr, translated);
      });
    });
  }

  function updateLanguageButtons(lang) {
    langButtons.forEach(function (btn) {
      var isActive = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function startRotatingWords(lang) {
    if (!rotatingWord) return;

    var words = rotatingWords[lang] || rotatingWords.en;
    var wordIndex = 0;

    if (rotatingWordTimerId) {
      clearInterval(rotatingWordTimerId);
      rotatingWordTimerId = null;
    }

    rotatingWord.textContent = words[0];

    rotatingWordTimerId = setInterval(function () {
      rotatingWord.classList.add("is-changing");
      setTimeout(function () {
        wordIndex = (wordIndex + 1) % words.length;
        rotatingWord.textContent = words[wordIndex];
        rotatingWord.classList.remove("is-changing");
      }, 260);
    }, 2400);
  }

  function applyLanguage(lang) {
    var normalizedLang = i18n[lang] ? lang : "en";
    currentLanguage = normalizedLang;

    document.documentElement.lang = normalizedLang === "ua" ? "uk" : "en";
    applyTextTranslations(normalizedLang);
    applyAttributeTranslations(normalizedLang);
    updateLanguageButtons(normalizedLang);
    startRotatingWords(normalizedLang);
    updateClocks();

    try {
      localStorage.setItem("site-language", normalizedLang);
    } catch (e) {
      /* Ignore localStorage access errors. */
    }
  }

  langButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var lang = btn.getAttribute("data-lang");
      applyLanguage(lang);
    });
  });

  var initialLanguage = "en";
  try {
    initialLanguage = localStorage.getItem("site-language") || "en";
  } catch (e) {
    initialLanguage = "en";
  }

  /* --- City clocks --- */
  var clockConfig = [
    {
      ids: ["clock-germany", "clock-warsaw", "menu-clock-germany", "menu-clock-warsaw"],
      label: "Germany",
      tz: "Europe/Berlin"
    },
    { ids: ["clock-newyork", "menu-clock-newyork"], label: "New York", tz: "America/New_York" },
    { ids: ["clock-kyiv",    "menu-clock-kyiv"],    label: "Kyiv",     tz: "Europe/Kyiv"      }
  ];

  function formatTime(tz) {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit", minute: "2-digit", timeZone: tz
      }).format(new Date());
    } catch (e) { return "--:--"; }
  }

  function updateClocks() {
    clockConfig.forEach(function (cfg) {
      var time = formatTime(cfg.tz);
      cfg.ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        if (id.indexOf("menu-") === 0) {
          el.textContent = time;
          return;
        }
        el.textContent = (el.getAttribute("data-clock-label") || cfg.label) + " " + time;
      });
    });
  }

  updateClocks();
  setInterval(updateClocks, 30000);

  applyLanguage(initialLanguage);

  /* --- Hero last update label --- */
  var lastUpdateEl = document.getElementById("last-update-date");

  function formatOrdinal(day) {
    if (day > 3 && day < 21) return day + "TH";
    switch (day % 10) {
      case 1: return day + "ST";
      case 2: return day + "ND";
      case 3: return day + "RD";
      default: return day + "TH";
    }
  }

  function formatLastUpdateDate() {
    var now = new Date();
    var month = now.toLocaleString("en-GB", { month: "long" }).toUpperCase();
    return formatOrdinal(now.getDate()) + " " + month;
  }

  if (lastUpdateEl) lastUpdateEl.textContent = formatLastUpdateDate();

  /* --- Service lines expand from center --- */
  var serviceLines = document.querySelectorAll('#services .line-div');
  if (serviceLines.length && 'IntersectionObserver' in window) {
    var serviceLineObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-expanded');
          serviceLineObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -12% 0px' });

    serviceLines.forEach(function (line) {
      serviceLineObserver.observe(line);
    });
  } else {
    serviceLines.forEach(function (line) {
      line.classList.add('is-expanded');
    });
  }

  /* --- Services heading moving line --- */
  var servicesSection = document.getElementById('services');
  var servicesHeadingMoving = document.getElementById('servicesHeadingMoving');
  if (servicesSection && servicesHeadingMoving) {
    var servicesMoveCurrent = 0;
    var servicesMoveTarget = 0;
    var servicesMoveRafId = null;
    var servicesMoveRange = 20;
    var servicesMobileQuery = window.matchMedia('(max-width: 767px)');

    function updateServicesMoveRange() {
      servicesMoveRange = servicesMobileQuery.matches ? 6 : 20;
    }

    function getServicesHeadingProgress() {
      var rect = servicesSection.getBoundingClientRect();
      var start = window.innerHeight * 0.9;
      var end = -rect.height * 0.15;
      return clamp((start - rect.top) / (start - end), 0, 1);
    }

    function renderServicesHeadingMove() {
      servicesMoveCurrent += (servicesMoveTarget - servicesMoveCurrent) * 0.08;
      if (Math.abs(servicesMoveTarget - servicesMoveCurrent) < 0.0005) {
        servicesMoveCurrent = servicesMoveTarget;
      }

      var moveX = servicesMoveCurrent * servicesMoveRange;
      servicesHeadingMoving.style.transform = 'translate3d(' + moveX.toFixed(3) + 'vw, 0, 0)';

      if (Math.abs(servicesMoveTarget - servicesMoveCurrent) > 0.0005) {
        servicesMoveRafId = requestAnimationFrame(renderServicesHeadingMove);
      } else {
        servicesMoveRafId = null;
      }
    }

    function updateServicesHeadingMove() {
      updateServicesMoveRange();
      servicesMoveTarget = getServicesHeadingProgress();
      if (servicesMoveRafId === null) {
        servicesMoveRafId = requestAnimationFrame(renderServicesHeadingMove);
      }
    }

    window.addEventListener('scroll', updateServicesHeadingMove, { passive: true });
    window.addEventListener('resize', updateServicesHeadingMove);
    if (servicesMobileQuery.addEventListener) {
      servicesMobileQuery.addEventListener('change', updateServicesHeadingMove);
    } else if (servicesMobileQuery.addListener) {
      servicesMobileQuery.addListener(updateServicesHeadingMove);
    }
    updateServicesMoveRange();
    updateServicesHeadingMove();
  }

  /* --- Scroll reveal --- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* --- Footer year --- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* --- Marquee: duplicate for seamless loop --- */
  var marqueeRow = document.querySelector(".main-sixth-div");
  if (marqueeRow) {
    var orig = marqueeRow.innerHTML;
    marqueeRow.innerHTML = orig + orig;
  }

  /* --- Works heading left-to-right progress --- */
  var worksOuter = document.querySelector('.works-sticky-outer');
  var worksInner = document.querySelector('.works-sticky-inner');
  var worksHeading = document.querySelector('.works-heading');
  var worksDesktopQuery = window.matchMedia('(min-width: 992px)');
  var worksHeadingRafId = null;

  function renderWorksHeadingProgress() {
    if (!worksOuter || !worksInner || !worksHeading || !worksDesktopQuery.matches) {
      if (worksHeading) worksHeading.style.transform = '';
      return;
    }

    var totalScroll = worksOuter.offsetHeight;
    if (totalScroll <= 0) {
      worksHeading.style.transform = 'translate3d(0px, 0, 0)';
      return;
    }

    var sectionScrolled = -worksOuter.getBoundingClientRect().top;
    var progress = clamp(sectionScrolled / totalScroll, 0, 1);

    var headingStartAt = 0.02;
    var headingFinishAt = 0.97;
    var normalizedProgress = clamp((progress - headingStartAt) / (headingFinishAt - headingStartAt), 0, 1);
    var delayedProgress = Math.pow(normalizedProgress, 1.75);

    var maxShiftX = Math.max(worksInner.clientWidth - worksHeading.offsetWidth, 0);
    var shiftX = maxShiftX * delayedProgress;

    worksHeading.style.transform = 'translate3d(' + shiftX.toFixed(2) + 'px, 0, 0)';
  }

  function requestWorksHeadingProgressRender() {
    if (worksHeadingRafId !== null) return;
    worksHeadingRafId = requestAnimationFrame(function () {
      worksHeadingRafId = null;
      renderWorksHeadingProgress();
    });
  }

  if (worksOuter && worksInner && worksHeading) {
    window.addEventListener('scroll', requestWorksHeadingProgressRender, { passive: true });
    window.addEventListener('resize', requestWorksHeadingProgressRender);

    if (typeof worksDesktopQuery.addEventListener === 'function') {
      worksDesktopQuery.addEventListener('change', requestWorksHeadingProgressRender);
    } else if (typeof worksDesktopQuery.addListener === 'function') {
      worksDesktopQuery.addListener(requestWorksHeadingProgressRender);
    }

    requestWorksHeadingProgressRender();
  }

  /* --- Works cards state --- */
  var workCards = Array.prototype.slice.call(document.querySelectorAll('.work-card'));

  /* --- Works card flip on click --- */
  if (workCards.length) {
    function setWorkCardFlipped(card, shouldFlip) {
      card.classList.toggle('is-flipped', shouldFlip);
      card.setAttribute('aria-expanded', shouldFlip ? 'true' : 'false');
    }

    workCards.forEach(function (card) {
      card.addEventListener('click', function (e) {
        e.preventDefault();
        var nextState = !card.classList.contains('is-flipped');

        workCards.forEach(function (otherCard) {
          if (otherCard !== card) setWorkCardFlipped(otherCard, false);
        });

        setWorkCardFlipped(card, nextState);
      });

      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.work-card')) {
        workCards.forEach(function (card) {
          setWorkCardFlipped(card, false);
        });
      }
    });
  }

  /* --- Magnetic hover --- */
  document.querySelectorAll(".magnetic").forEach(function (el) {
    el.addEventListener("mousemove", function (e) {
      var rect = el.getBoundingClientRect();
      var dx = (e.clientX - rect.left - rect.width  / 2) * 0.2;
      var dy = (e.clientY - rect.top  - rect.height / 2) * 0.2;
      el.style.transform = "translate(" + dx + "px, " + dy + "px)";
    });
    el.addEventListener("mouseleave", function () { el.style.transform = ""; });
  });


});
