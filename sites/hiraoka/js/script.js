const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('.global-nav');
if(menuBtn && nav){menuBtn.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');menuBtn.setAttribute('aria-expanded',open);menuBtn.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('is-open');menuBtn.setAttribute('aria-expanded','false');}));}

const pageTop=document.querySelector('.page-top');
if(pageTop){window.addEventListener('scroll',()=>pageTop.classList.toggle('is-show',window.scrollY>500));pageTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));}

const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add('is-visible');}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));

const filters=document.querySelectorAll('[data-filter]');
const works=document.querySelectorAll('.works-page-grid .work-card');
filters.forEach(btn=>btn.addEventListener('click',()=>{filters.forEach(b=>b.classList.remove('is-active'));btn.classList.add('is-active');const f=btn.dataset.filter;works.forEach(card=>card.classList.toggle('is-hidden',f!=='all'&&card.dataset.category!==f));}));

const modal=document.querySelector('.modal');
if(modal){const title=modal.querySelector('.modal-title');const photo=modal.querySelector('.modal-photo');const close=()=>{modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';};document.querySelectorAll('.modal-trigger').forEach(card=>card.addEventListener('click',()=>{title.textContent=card.dataset.title||'施工事例';if(photo&&card.dataset.image)photo.style.backgroundImage=`url(\"${card.dataset.image}\")`;modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}));modal.querySelector('.modal-close').addEventListener('click',close);modal.querySelector('.modal-backdrop').addEventListener('click',close);document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});}

const form=document.querySelector('#contactForm');
if(form){form.addEventListener('submit',e=>{e.preventDefault();let valid=true;const name=form.querySelector('#name'),email=form.querySelector('#email'),message=form.querySelector('#message'),agree=form.querySelector('#privacyAgree');const setError=(field,msg)=>{const error=field.parentElement.querySelector('.error');if(error)error.textContent=msg;field.setAttribute('aria-invalid',msg?'true':'false');if(msg)valid=false;};setError(name,name.value.trim()?'':'お名前を入力してください。');setError(email,/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)?'':'正しいメールアドレスを入力してください。');setError(message,message.value.trim()?'':'お問い合わせ内容を入力してください。');const pe=form.querySelector('.privacy-error');pe.textContent=agree.checked?'':'プライバシーポリシーへの同意が必要です。';if(!agree.checked)valid=false;const result=form.querySelector('.form-result');result.textContent=valid?'入力内容を確認しました。※現在このフォームは送信機能未接続です。お急ぎの場合はお電話ください。':'';});}


// Fixed-header anchor scrolling: CSS transform on reveal elements does not affect the landing position.
const getDocumentTop = element => {
  let top = 0;
  let current = element;
  while (current) {
    top += current.offsetTop || 0;
    current = current.offsetParent;
  }
  return top;
};

const scrollToAnchor = (hash, behavior = 'smooth') => {
  if (!hash || hash === '#') return;
  const target = document.querySelector(hash);
  if (!target) return;

  // If this section has not revealed yet, freeze it at its final visual position
  // before calculating the anchor destination. This keeps the first and later
  // clicks landing at exactly the same place.
  if (target.classList.contains('reveal')) {
    target.classList.add('anchor-jump', 'is-visible');
    void target.offsetHeight;
  }

  const header = document.querySelector('.site-header');
  const offset = header ? header.getBoundingClientRect().height : 0;
  const top = getDocumentTop(target) - offset;
  window.scrollTo({ top: Math.max(0, top), behavior });

  if (target.classList.contains('anchor-jump')) {
    requestAnimationFrame(() => target.classList.remove('anchor-jump'));
  }
};

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const hash = link.getAttribute('href');
    if (!hash || hash === '#' || !document.querySelector(hash)) return;
    event.preventDefault();
    history.replaceState(null, '', hash);
    scrollToAnchor(hash);
  });
});

window.addEventListener('load', () => {
  if (location.hash && document.querySelector(location.hash)) {
    requestAnimationFrame(() => scrollToAnchor(location.hash, 'auto'));
  }
});
