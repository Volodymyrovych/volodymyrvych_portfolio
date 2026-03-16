/* Ministry Design - Main Script */
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

  /* --- Rotating word --- */
  var rotatingWord = document.getElementById("rotating-word");
  if (rotatingWord) {
    var words = ["interfaces", "payment systems", "secure sites", "brands"];
    var wordIndex = 1;
    setInterval(function () {
      rotatingWord.classList.add("is-changing");
      setTimeout(function () {
        rotatingWord.textContent = words[wordIndex % words.length];
        wordIndex++;
        rotatingWord.classList.remove("is-changing");
      }, 260);
    }, 2400);
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

  /* --- Works sticky vertical reveal --- */
  var worksOuter = document.querySelector('.works-sticky-outer');
  var worksInner = document.querySelector('.works-sticky-inner');
  var worksHeading = document.querySelector('.works-heading');
  var worksSelectedWord = worksHeading ? worksHeading.querySelector('.works-word--selected') : null;
  var worksMovingWord = worksHeading ? worksHeading.querySelector('.works-word--works') : null;
  var workCards = Array.prototype.slice.call(document.querySelectorAll('.work-card'));

  if (worksOuter && worksInner && worksHeading && workCards.length) {
    var worksTrackStartVh = 96;
    var worksTrackEndVh = -152;
    var worksCurrent = 0;
    var worksTarget = 0;
    var worksRafId = null;
    var worksMobileQuery = window.matchMedia('(max-width: 767px)');

    function getWorksProgress() {
      var totalScroll = worksOuter.offsetHeight - window.innerHeight;
      if (totalScroll <= 0) return 0;
      var scrolled = -worksOuter.getBoundingClientRect().top;
      return Math.max(0, Math.min(1, scrolled / totalScroll));
    }

    function applyWorksMobileLayout() {
      worksHeading.style.transform = '';
      worksHeading.style.opacity = '';
      if (worksSelectedWord) worksSelectedWord.style.transform = '';
      if (worksMovingWord) worksMovingWord.style.transform = '';
      workCards.forEach(function (card) {
        card.style.transform = '';
        card.style.opacity = '';
      });
    }

    function renderWorks() {
      worksCurrent += (worksTarget - worksCurrent) * 0.11;
      if (Math.abs(worksTarget - worksCurrent) < 0.0005) {
        worksCurrent = worksTarget;
      }

      var headingShiftX = -26 + worksCurrent * 34;
      var headingShiftY = clamp((worksCurrent - 0.86) / 0.14, 0, 1) * 6;
      var headingFade = (1 - clamp((worksCurrent - 0.93) / 0.07, 0, 1)) * 0.62;
      worksHeading.style.transform = 'translate3d(calc(-50% + ' + headingShiftX.toFixed(3) + 'vw), calc(-50% + ' + headingShiftY.toFixed(3) + 'vh), 0)';
      worksHeading.style.opacity = headingFade.toFixed(3);
      if (worksSelectedWord) worksSelectedWord.style.transform = 'translate3d(0, 0, 0)';
      if (worksMovingWord) worksMovingWord.style.transform = 'translate3d(0, 0, 0)';

      var trackRaw = clamp((worksCurrent - 0.02) / 0.78, 0, 1);
      var trackProgress = trackRaw * trackRaw * (3 - 2 * trackRaw);
      var yShift = worksTrackStartVh + (worksTrackEndVh - worksTrackStartVh) * trackProgress;

      workCards.forEach(function (card) {
        card.style.opacity = '1';
        card.style.transform = 'translate3d(0, ' + yShift.toFixed(3) + 'vh, 0)';
      });

      if (Math.abs(worksTarget - worksCurrent) > 0.0005) {
        worksRafId = requestAnimationFrame(renderWorks);
      } else {
        worksRafId = null;
      }
    }

    function requestWorksRender() {
      if (worksMobileQuery.matches) {
        applyWorksMobileLayout();
        return;
      }
      worksTarget = getWorksProgress();
      if (worksRafId === null) worksRafId = requestAnimationFrame(renderWorks);
    }

    window.addEventListener('scroll', requestWorksRender, { passive: true });
    window.addEventListener('resize', requestWorksRender);

    if (typeof worksMobileQuery.addEventListener === 'function') {
      worksMobileQuery.addEventListener('change', requestWorksRender);
    } else if (typeof worksMobileQuery.addListener === 'function') {
      worksMobileQuery.addListener(requestWorksRender);
    }

    requestWorksRender();
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
