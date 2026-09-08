
// 初回訪問時、ブラウザが以前のスクロール位置を復元してしまうと
// 一番の見せ場であるヒーロー演出が正しい位置で見えなくなるため、
// できるだけ早い段階で自動復元を止めて先頭に固定する。
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', function () {
  // スクロールスナップ用: ヘッダーはブレークポイントで高さが変わり、
  // 文字の折り返し方次第でも微妙に変わるため、決め打ちせず実測して
  // --header-h に反映する。見出しへスナップした時にヘッダーと
  // セクション先頭が重ならないようにするための値。
  const siteHeader = document.querySelector('.site-header');
  function updateHeaderHeightVar() {
    if (!siteHeader) return;
    document.documentElement.style.setProperty('--header-h', siteHeader.offsetHeight + 'px');
  }
  updateHeaderHeightVar();
  window.addEventListener('resize', updateHeaderHeightVar);
  window.addEventListener('orientationchange', updateHeaderHeightVar);
  if ('ResizeObserver' in window && siteHeader) {
    new ResizeObserver(updateHeaderHeightVar).observe(siteHeader);
  }

  // スクロールスナップ(JS制御・CSSのscroll-snap-typeは不使用):
  // 下方向にスクロールした時だけ、次の見出しにきっちり揃える。
  // 上方向は自由に読み返せる状態にしたいため、あえてスナップ
  // させない。
  // 下方向はスクロール操作自体を止めるものではなく、また
  // 入力欄をタイプ中に下スクロールする状況は通常起きないため、
  // お問い合わせページも含め全ページで有効にする。
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const snapSections = Array.from(document.querySelectorAll('main > section, .site-footer'));
    if (snapSections.length) {
      let settleTimer = null;
      let downStreak = 0; // 直近の下方向スクロール量の積算(トラックパッドの慣性スクロール終盤に
                           // 混じる小さな逆方向ノイズで誤発火しないようにするため)

      function getOffset() {
        return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--snap-offset')) || 96;
      }
      function getBoundaries() {
        const offset = getOffset();
        return snapSections
          .map(function (sec) {
            // セクションごとに停止位置を個別指定できる。
            // data-snap-target: セクション内で画面上端の基準にしたい要素
            // data-snap-top:    その要素を画面上端から何pxの位置に置くか
            const selector = sec.dataset.snapTarget;
            const customTop = parseFloat(sec.dataset.snapTop);
            const anchor = selector ? sec.querySelector(selector) : null;
            if (anchor && Number.isFinite(customTop)) {
              return anchor.getBoundingClientRect().top + window.scrollY - customTop;
            }
            return sec.getBoundingClientRect().top + window.scrollY - offset;
          })
          .map(function (v) { return Math.max(0, v); })
          .sort(function (a, b) { return a - b; });
      }

      function cancelPendingSnap() {
        if (settleTimer) { window.clearTimeout(settleTimer); settleTimer = null; }
        downStreak = 0;
      }

      function settle() {
        settleTimer = null;
        if (downStreak <= 8) return; // 下方向の意図がはっきりしない(ノイズ)場合は何もしない
        const y = window.scrollY;
        const boundaries = getBoundaries();
        let target = null;
        for (let i = 0; i < boundaries.length; i++) {
          if (boundaries[i] > y + 4) { target = boundaries[i]; break; }
        }
        if (target !== null && Math.abs(target - y) > 2) {
          window.scrollTo({ top: target, behavior: 'smooth' });
        }
      }

      window.addEventListener('wheel', function (e) {
        if (e.deltaY <= 0) {
          // 上方向に転じたら、保留中の下スナップ予約は取り消す
          // (これを取り消さないと、下スクロール直後に上へ切り替えても
          //  古い下スナップが遅れて発火し、上方向の操作を邪魔していた)
          cancelPendingSnap();
          return;
        }
        downStreak += e.deltaY;
        if (settleTimer) window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(settle, 170);
      }, { passive: true });
    }
  }

  const loader = document.getElementById('site-loader');
  const heroFlash = document.querySelector('.hero-opening-flash');
  const heroCopy = document.getElementById('hero-copy-left');

  // ヒーロー演出(フラッシュ)があるページ(TOP)だけ、演出が終わるまで
  // 先頭に固定してスクロールをロックする。他ページでは一切ロックしない。
  if (heroFlash) {
    window.scrollTo(0, 0);
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function revealHero() {
    if (heroFlash) window.scrollTo(0, 0);
    if (loader) loader.classList.add('is-hidden');
    // ローダーが消えたタイミングでフラッシュ演出を開始する
    if (heroFlash) heroFlash.classList.add('is-armed');
    // フラッシュ演出(約1.6s)と文字が重ならないよう、終わってから表示する
    window.setTimeout(function () {
      if (heroCopy) heroCopy.classList.add('is-visible');
    }, 1650);
    // 演出が落ち着いたらスクロールを解放する(ロックしたページのみ)
    if (heroFlash) {
      window.setTimeout(function () {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }, 1700);
    }
  }

  // ロゴの塗りつぶしアニメーション(約1.15s+0.16s遅延)が終わるのを待ってから開ける。
  // 万一イベントが発火しない環境向けに、上限のフォールバックも用意する。
  let revealed = false;
  function revealOnce() {
    if (revealed) return;
    revealed = true;
    revealHero();
  }
  window.setTimeout(revealOnce, 2400); // フォールバック
  window.setTimeout(revealOnce, 2150); // 通常はこちらで発火

  const menuToggle = document.getElementById('menu-toggle');
  const mainNav = document.getElementById('main-nav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', function () {
      const isOpen = mainNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      menuToggle.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mainNav.querySelectorAll('a').forEach(function(link){
      link.addEventListener('click', function(){
        mainNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'メニューを開く');
        document.body.style.overflow = '';
      });
    });
  }

  const revealTargets = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealTargets.length) {
    const observer = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, {threshold: 0.14, rootMargin: '0px 0px -30px 0px'});
    revealTargets.forEach(function(el){ observer.observe(el); });
  } else {
    revealTargets.forEach(function(el){ el.classList.add('is-visible'); });
  }



  // 通常のセクション見出しだけ、画面に入った時に横から帯を伸ばす。
  // ヒーロー／CTAのキャッチコピーは対象外。
  const sweepHeadings = Array.from(document.querySelectorAll('.section-title')).filter(function(heading){
    return !heading.closest('.cta-box');
  });
  sweepHeadings.forEach(function(heading){ heading.classList.add('heading-sweep'); });
  if ('IntersectionObserver' in window && sweepHeadings.length) {
    const headingObserver = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-swept');
        obs.unobserve(entry.target);
      });
    }, { threshold:0.45, rootMargin:'0px 0px -8% 0px' });
    sweepHeadings.forEach(function(heading){ headingObserver.observe(heading); });
  } else {
    sweepHeadings.forEach(function(heading){ heading.classList.add('is-swept'); });
  }

  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    const footer = document.querySelector('.site-footer');
    function updateBackToTop(){
      backToTop.classList.toggle('is-visible', window.scrollY > 420);
      if (!footer) return;
      const footerTop = footer.getBoundingClientRect().top;
      const safeGap = 24;
      const overlap = Math.max(0, window.innerHeight - footerTop);
      backToTop.style.bottom = (safeGap + overlap) + 'px';
    }
    window.addEventListener('scroll', updateBackToTop, { passive:true });
    window.addEventListener('resize', updateBackToTop);
    updateBackToTop();
    backToTop.addEventListener('click', function(){
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  function scrollToTabs() {
    const tabsEl = document.querySelector('.product-tabs');
    if (tabsEl) {
      const headerOffset = 96;
      const top = tabsEl.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }
  function activateTab(targetKey) {
    tabButtons.forEach(function(btn){
      const isTarget = btn.dataset.tab === targetKey;
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      btn.tabIndex = isTarget ? 0 : -1;
    });
    tabPanels.forEach(function(panel){
      const isTarget = panel.id === 'tab-' + targetKey;
      panel.classList.toggle('is-active', isTarget);
      if (isTarget) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    });
  }
  if (tabButtons.length) {
    tabButtons.forEach(function(btn){
      // ボタンを押したら、その製品タブの位置までスクロールする
      btn.addEventListener('click', function(){
        activateTab(btn.dataset.tab);
        scrollToTabs();
      });
    });
    const hashKey = window.location.hash.replace('#','');
    const validKeys = Array.from(tabButtons).map(function(btn){ return btn.dataset.tab; });
    if (hashKey && validKeys.includes(hashKey)) {
      activateTab(hashKey);
      // 他ページから #headset などのリンクで来た場合、タブの位置までスクロールする
      // (スクロールしないと該当タブが画面外のままで、切り替わったことに気づきにくいため)
      window.requestAnimationFrame(scrollToTabs);
      window.setTimeout(scrollToTabs, 2200);
    }
  }

  // 「詳細はこちら」：技術仕様をポップアップ(モーダル)で表示
  let openModal = null;
  function closeSpecModal(){
    if (!openModal) return;
    openModal.classList.remove('is-open');
    document.body.style.overflow = '';
    openModal = null;
  }
  document.querySelectorAll('.spec-toggle').forEach(function(btn){
    const modal = document.getElementById(btn.dataset.modalTarget);
    if (!modal) return;
    btn.addEventListener('click', function(){
      modal.removeAttribute('hidden');
      requestAnimationFrame(function(){ modal.classList.add('is-open'); });
      document.body.style.overflow = 'hidden';
      openModal = modal;
    });
  });
  document.querySelectorAll('.spec-modal-overlay').forEach(function(overlay){
    const closeBtn = overlay.querySelector('.spec-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeSpecModal);
    overlay.addEventListener('click', function(event){
      if (event.target === overlay) closeSpecModal();
    });
    overlay.addEventListener('transitionend', function(event){
      if (event.target === overlay && !overlay.classList.contains('is-open')) {
        overlay.setAttribute('hidden', '');
      }
    });
  });
  document.addEventListener('keydown', function(event){
    if (event.key === 'Escape') closeSpecModal();
  });

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const formSuccess = document.getElementById('form-success');
    const validators = {
      name: value => value.trim().length > 0,
      email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
      subject: value => value !== '',
      message: value => value.trim().length > 0
    };
    function setFieldError(groupId, hasError){
      const group = document.getElementById(groupId);
      if(group) group.classList.toggle('has-error', hasError);
    }
    contactForm.addEventListener('submit', function(event){
      event.preventDefault();
      let isValid = true;
      Object.keys(validators).forEach(function(fieldName){
        const field = document.getElementById(fieldName);
        const ok = validators[fieldName](field.value);
        setFieldError('group-' + fieldName, !ok);
        if(!ok) isValid = false;
      });
      const agree = document.getElementById('agree');
      const agreeError = document.getElementById('agree-error');
      if (!agree.checked) { agreeError.style.display = 'block'; isValid = false; }
      else { agreeError.style.display = 'none'; }
      if (!isValid) {
        const formTop = document.getElementById('group-name');
        if (formTop) {
          const headerOffset = 100;
          const top = formTop.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
        if(formSuccess) formSuccess.classList.remove('is-visible');
        return;
      }
      if(formSuccess){ formSuccess.classList.add('is-visible'); formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      contactForm.reset();
    });
    Object.keys(validators).forEach(function(fieldName){
      const field = document.getElementById(fieldName);
      if (!field) return;
      const eventName = field.tagName === 'SELECT' ? 'change' : 'input';
      field.addEventListener(eventName, function(){
        if(validators[fieldName](field.value)) setFieldError('group-' + fieldName, false);
      });
    });
    const agreeField = document.getElementById('agree');
    if (agreeField) agreeField.addEventListener('change', function(){ if(agreeField.checked) document.getElementById('agree-error').style.display = 'none'; });
  }



  const carousel = document.getElementById('product-carousel');
  if (carousel) {
    const slides = Array.from(carousel.querySelectorAll('[data-carousel-slide]'));
    const dots = Array.from(carousel.querySelectorAll('[data-carousel-dot]'));
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');
    let activeIndex = slides.findIndex(function(slide){ return slide.classList.contains('is-active'); });
    if (activeIndex < 0) activeIndex = 0;
    let timerId = null;
    const autoDelay = 5200;

    function setSlide(index) {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach(function(slide, slideIndex){
        const isActive = slideIndex === activeIndex;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });
      dots.forEach(function(dot, dotIndex){
        const isActive = dotIndex === activeIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }

    function startAuto() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      stopAuto();
      timerId = window.setInterval(function(){
        setSlide(activeIndex + 1);
      }, autoDelay);
    }

    function stopAuto() {
      if (!timerId) return;
      window.clearInterval(timerId);
      timerId = null;
    }

    if (prevBtn) prevBtn.addEventListener('click', function(){ setSlide(activeIndex - 1); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', function(){ setSlide(activeIndex + 1); startAuto(); });
    dots.forEach(function(dot, dotIndex){
      dot.addEventListener('click', function(){
        setSlide(dotIndex);
        startAuto();
      });
    });

    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    carousel.addEventListener('focusin', stopAuto);
    carousel.addEventListener('focusout', function(event){
      if (!carousel.contains(event.relatedTarget)) startAuto();
    });

    let touchStartX = 0;
    let touchDeltaX = 0;
    carousel.addEventListener('touchstart', function(event){
      if (!event.touches || !event.touches.length) return;
      touchStartX = event.touches[0].clientX;
      touchDeltaX = 0;
      stopAuto();
    }, { passive:true });
    carousel.addEventListener('touchmove', function(event){
      if (!event.touches || !event.touches.length) return;
      touchDeltaX = event.touches[0].clientX - touchStartX;
    }, { passive:true });
    carousel.addEventListener('touchend', function(){
      if (Math.abs(touchDeltaX) > 42) {
        if (touchDeltaX < 0) setSlide(activeIndex + 1);
        else setSlide(activeIndex - 1);
      }
      startAuto();
    });
    carousel.setAttribute('tabindex', '0');
    carousel.addEventListener('keydown', function(event){
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setSlide(activeIndex - 1);
        startAuto();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setSlide(activeIndex + 1);
        startAuto();
      }
    });

    setSlide(activeIndex);
    startAuto();
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroProduct = document.getElementById('hero-product');
  const touchDevice = window.matchMedia('(hover: none)').matches;
  if (heroProduct && !prefersReducedMotion && !touchDevice) {
    const heroImgEl = document.getElementById('hero-product-img');
    let frame = null;

    heroProduct.addEventListener('mousemove', function(event){
      const rect = heroProduct.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) - 0.5;
      const ny = ((event.clientY - rect.top) / rect.height) - 0.5;

      // 製品写真そのものの矩形内にカーソルがあるかどうかで判定する
      const imgRect = heroImgEl ? heroImgEl.getBoundingClientRect() : rect;
      const overProduct = event.clientX >= imgRect.left && event.clientX <= imgRect.right &&
                           event.clientY >= imgRect.top && event.clientY <= imgRect.bottom;
      // マスクの位置指定(--mx-pct/--my-pct)は、hero-product-silhouette要素
      // (=hero-productと同じ大きさ)を基準にする必要があるため、
      // 画像そのものの矩形ではなく外側のboxを基準に計算する
      const mxPct = (nx + 0.5) * 100;
      const myPct = (ny + 0.5) * 100;

      if(frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function(){
        heroProduct.classList.toggle('is-hovering', overProduct);
        heroProduct.style.setProperty('--img-x', (nx * 6).toFixed(1) + 'px');
        heroProduct.style.setProperty('--img-y', (ny * 4).toFixed(1) + 'px');
        heroProduct.style.setProperty('--rotate-x', (ny * -3).toFixed(2) + 'deg');
        heroProduct.style.setProperty('--rotate-y', (nx * 4).toFixed(2) + 'deg');
        heroProduct.style.setProperty('--mx-pct', mxPct.toFixed(1) + '%');
        heroProduct.style.setProperty('--my-pct', myPct.toFixed(1) + '%');
      });
    });
    heroProduct.addEventListener('mouseleave', function(){
      if(frame) cancelAnimationFrame(frame);
      heroProduct.classList.remove('is-hovering');
      heroProduct.style.setProperty('--img-x', '0px');
      heroProduct.style.setProperty('--img-y', '0px');
      heroProduct.style.setProperty('--rotate-x', '0deg');
      heroProduct.style.setProperty('--rotate-y', '0deg');
    });
  }
});
