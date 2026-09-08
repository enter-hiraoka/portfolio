document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  const count = document.getElementById("count");
  const menuButton = document.querySelector(".menu");
  const nav = document.getElementById("nav");
  const navFont = document.querySelector(".nav-font");
  const submenuButton = navFont ? navFont.querySelector("button") : null;
  const submenu = navFont ? navFont.querySelector("ul") : null;
  const pageTop = document.querySelector(".page-top");
  const floatMenu = document.querySelector(".float-menu");
  const hero = document.querySelector(".hero");
  // =========================
  // 初期表示をヒーローのみにする（ヘッダー分だけ下にスクロール）
  // ローディング画面で隠れている間に実行するので、切り替わりは見えない
  // =========================
  function scrollToHero() {
    if (window.location.hash) return; // #about などを指定して開いた場合は何もしない
    if (!hero) return; // ヒーローのないページ（フォント個別ページ等）では何もしない
    const header = document.querySelector("header");
    if (!header) return;
    const offset = header.getBoundingClientRect().height;
    document.documentElement.scrollTop = offset;
    document.body.scrollTop = offset;
  }
  scrollToHero();
  window.addEventListener("load", scrollToHero);
  // =========================
  // Loading
  // =========================
  const startHero = () => {
    if (!hero) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        hero.classList.add("is-gathered");
      });
    });
  };
  if (loader && count) {
    let num = 0;
    const timer = setInterval(() => {
      num += 2;
      if (num > 100) {
        num = 100;
      }
      count.textContent = String(num).padStart(2, "0");
      if (num >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          loader.classList.add("is-hidden");
          setTimeout(() => {
            startHero();
          }, 350);
        }, 300);
      }
    }, 20);
  } else {
    startHero();
  }
  // =========================
  // Hamburger menu
  // =========================
  function setNavOpen(open) {
    nav.classList.toggle("is-open", open);
    if (menuButton) menuButton.classList.toggle("is-active", open);
    if (floatMenu) floatMenu.classList.toggle("is-active", open);
    document.body.classList.toggle("nav-open", open);
  }
  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      setNavOpen(!nav.classList.contains("is-open"));
    });
    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        setNavOpen(false);
      });
    });
  }
  if (floatMenu && nav) {
    floatMenu.addEventListener("click", () => {
      setNavOpen(!nav.classList.contains("is-open"));
    });
  }
  // =========================
  // スクロール追随メニューボタンの表示切り替え
  // =========================
  if (floatMenu) {
    const toggleFloatMenu = () => {
      floatMenu.classList.toggle("is-visible", window.scrollY > 300);
    };
    toggleFloatMenu();
    window.addEventListener("scroll", toggleFloatMenu, { passive: true });
  }
  // =========================
  // Font submenu
  // =========================
  if (submenuButton && submenu) {
    submenuButton.addEventListener("click", event => {
      event.stopPropagation();
      const open = submenu.classList.toggle("is-open");
      submenuButton.classList.toggle("is-open", open);
    });
    document.addEventListener("click", event => {
      if (!navFont.contains(event.target)) {
        submenu.classList.remove("is-open");
        submenuButton.classList.remove("is-open");
      }
    });
  }
  // =========================
  // Page top
  // =========================
  if (pageTop) {
    const togglePageTop = () => {
      pageTop.classList.toggle("is-visible", window.scrollY > 500);
    };
    togglePageTop();
    window.addEventListener("scroll", togglePageTop, { passive: true });
  }
  // =========================
  // Hiragana -> Katakana
  // =========================
  function hiraganaToKatakana(text) {
    return text.replace(/[\u3041-\u3096]/g, char =>
      String.fromCharCode(char.charCodeAt(0) + 0x60)
    );
  }
  const fontInput = document.getElementById("fontInput");
  const fontPreview = document.getElementById("fontPreview");
  const fontPreviewText = fontPreview ? (fontPreview.querySelector(".font-try-preview-text") || fontPreview) : null;
  const fontWarning = document.getElementById("fontWarning");
  let warningTimer = null;
  let isComposing = false;

  if (fontInput && fontPreviewText) {
    const showWarning = (message) => {
      if (!fontWarning) return;
      fontWarning.textContent = message;
      fontWarning.classList.add("is-visible");
      clearTimeout(warningTimer);
      warningTimer = setTimeout(() => {
        fontWarning.classList.remove("is-visible");
      }, 2200);
    };

    const updatePreview = ({ validate = true } = {}) => {
      // 日本語IMEの変換途中は、ローマ字などの未確定文字を削除・警告しない。
      // 変換確定後だけ、ひらがな／カタカナ／長音符に絞ってプレビューする。
      const raw = fontInput.value;
      if (!validate) {
        fontPreviewText.textContent = hiraganaToKatakana(raw) || "レトロナフォント";
        return;
      }

      const japaneseOnly = raw.replace(/[^\u3041-\u3096\u30A1-\u30FA\u30FC]/g, "");
      if (japaneseOnly !== raw) {
        fontInput.value = japaneseOnly;
        showWarning("ひらがな・カタカナ以外の文字は、変換確定後に除外されます");
      }
      fontPreviewText.textContent = hiraganaToKatakana(japaneseOnly) || "レトロナフォント";
    };

    updatePreview();

    fontInput.addEventListener("compositionstart", () => {
      isComposing = true;
      if (fontWarning) fontWarning.classList.remove("is-visible");
    });

    fontInput.addEventListener("input", (event) => {
      if (isComposing || event.isComposing) {
        updatePreview({ validate: false });
        return;
      }
      updatePreview();
    });

    fontInput.addEventListener("compositionend", () => {
      isComposing = false;
      updatePreview();
    });
  }

  const heroBox = document.querySelector(".hero");
  const heroInner = document.querySelector(".hero-inner");
  function resizeHero() {
    const baseWidth = 1600;
    const baseHeight = 768;
    if (!heroBox || !heroInner) return;

    // 1600×768 のデザイン全体をひとまとまりで拡大・縮小する。
    // 画面が1600pxを超えても拡大を止めないため、
    // 画面サイズが変わってもモチーフ同士の位置関係は変わらない。
    const scale = heroBox.clientWidth / baseWidth;

    heroInner.style.transform = `translateX(-50%) scale(${scale})`;
    heroBox.style.height = `${baseHeight * scale}px`;
  }
  resizeHero();
  window.addEventListener("load", resizeHero);
  window.addEventListener("resize", resizeHero);

  // =========================
  // その他モチーフ：クリックで詳細パネルを画面中央に表示
  // =========================
  const motifItems = document.querySelectorAll(".motif");
  const motifBackdrop = document.querySelector(".motif-backdrop");

  // 詳細パネルは position:fixed で中央表示するため、
  // .motif（position:relative の子要素）の外＝body直下に移し、
  // 背景オーバーレイより確実に手前に表示されるようにする。
  const motifPairs = Array.from(motifItems).map((item) => {
    const reveal = item.querySelector(".motif-reveal");
    if (reveal) document.body.appendChild(reveal);
    return { item, reveal };
  });

  function closeAllMotifPanels() {
    motifPairs.forEach(({ item, reveal }) => {
      item.classList.remove("is-active");
      if (reveal) reveal.classList.remove("is-open");
    });
    if (motifBackdrop) motifBackdrop.classList.remove("is-open");
  }

  motifPairs.forEach(({ item, reveal }) => {
    if (!reveal) return;

    item.addEventListener("click", (e) => {
      if (e.target.closest(".motif-close")) return;
      const alreadyOpen = reveal.classList.contains("is-open");
      closeAllMotifPanels();
      if (!alreadyOpen) {
        item.classList.add("is-active");
        reveal.classList.add("is-open");
        if (motifBackdrop) motifBackdrop.classList.add("is-open");
      }
    });

    const closeBtn = reveal.querySelector(".motif-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeAllMotifPanels();
      });
    }
  });

  if (motifBackdrop) {
    motifBackdrop.addEventListener("click", closeAllMotifPanels);
  }

  // =========================
  // Gallery：ホーム最下部のボタンを押したときだけポスター表示
  // =========================
  const galleryOpen = document.querySelector(".gallery-open");
  const galleryModal = document.getElementById("galleryModal");
  const galleryCloseButtons = galleryModal ? galleryModal.querySelectorAll("[data-gallery-close]") : [];

  function setGalleryOpen(open) {
    if (!galleryModal || !galleryOpen) return;
    galleryModal.classList.toggle("is-open", open);
    galleryModal.setAttribute("aria-hidden", String(!open));
    galleryOpen.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("gallery-opened", open);
    if (!open) galleryOpen.focus();
  }

  if (galleryOpen && galleryModal) {
    galleryOpen.addEventListener("click", () => setGalleryOpen(true));
    galleryCloseButtons.forEach(button => {
      button.addEventListener("click", () => setGalleryOpen(false));
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllMotifPanels();
  
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && galleryModal && galleryModal.classList.contains("is-open")) {
      setGalleryOpen(false);
    }
  });
});
});