function headerOffset(){
  return window.matchMedia("(max-width:800px)").matches ? 84 : 104;
}
const links=document.querySelectorAll('a[href^="#"]');
links.forEach(a=>a.addEventListener('click',e=>{
  const id=a.getAttribute('href');
  if(id&&id!=="#"){
    e.preventDefault();
    const target=document.querySelector(id);
    if(target){
      const top=target.getBoundingClientRect().top+window.scrollY-headerOffset();
      window.scrollTo({top,behavior:"smooth"});
    }
  }
}));

const menuBtn=document.querySelector(".menu");
const mobileNav=document.querySelector(".mobile-nav");
function closeMenu(){
  menuBtn?.classList.remove("is-open");
  mobileNav?.classList.remove("is-open");
  menuBtn?.setAttribute("aria-expanded","false");
}
menuBtn?.addEventListener("click",()=>{
  const isOpen=menuBtn.classList.toggle("is-open");
  mobileNav?.classList.toggle("is-open",isOpen);
  menuBtn.setAttribute("aria-expanded",String(isOpen));
});
mobileNav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",closeMenu));

const videoModal=document.querySelector("#videoModal");
const modalVideo=document.querySelector("#modalVideo");
const videoTriggers=document.querySelectorAll("[data-video-trigger]");
function openVideoModal(){
  if(!videoModal) return;
  videoModal.classList.add("is-open");
  videoModal.setAttribute("aria-hidden","false");
  document.body.classList.add("modal-open");
  if(modalVideo){
    modalVideo.currentTime=0;
    modalVideo.play();
  }
}
function closeVideoModal(){
  if(!videoModal) return;
  videoModal.classList.remove("is-open");
  videoModal.setAttribute("aria-hidden","true");
  document.body.classList.remove("modal-open");
  modalVideo?.pause();
}
videoTriggers.forEach(btn=>btn.addEventListener("click",openVideoModal));
videoModal?.querySelectorAll("[data-modal-close]").forEach(el=>el.addEventListener("click",closeVideoModal));
document.addEventListener("keydown",e=>{
  if(e.key==="Escape") closeVideoModal();
});

const slides=[...document.querySelectorAll(".hero-slide")];
const prevBtn=document.querySelector(".hero-prev");
const nextBtn=document.querySelector(".hero-next");
let current=0;
let timer=null;
const duration=4200;

function showSlide(index){
  slides.forEach((slide,i)=>slide.classList.toggle("slide-active",i===index));
}
function startTimer(){
  if(timer) clearInterval(timer);
  timer=setInterval(()=>{
    current=(current+1)%slides.length;
    showSlide(current);
  },duration);
}
function goTo(index){
  current=(index+slides.length)%slides.length;
  showSlide(current);
  startTimer();
}
if(slides.length>1){
  showSlide(0);
  startTimer();
  prevBtn?.addEventListener("click",()=>goTo(current-1));
  nextBtn?.addEventListener("click",()=>goTo(current+1));
}
