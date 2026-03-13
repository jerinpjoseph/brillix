/* ========================================
   Brillix Technologies — Subpage Init JS
   Lightweight: Lenis, GSAP reveals, navbar,
   mobile menu. No Three.js or custom cursor.
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ----- GSAP + ScrollTrigger ----- */
  gsap.registerPlugin(ScrollTrigger);

  /* ----- Lenis Smooth Scroll ----- */
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.8
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);


  /* ----- Navbar Scroll Effect ----- */
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (navbar) {
      if (y > 60) {
        navbar.classList.add('navbar-scrolled');
      } else {
        navbar.classList.remove('navbar-scrolled');
      }
      if (y > 300 && y > lastScroll) {
        gsap.to(navbar, { y: -100, duration: 0.4, ease: 'power3.out' });
      } else {
        gsap.to(navbar, { y: 0, duration: 0.4, ease: 'power3.out' });
      }
    }
    lastScroll = y;
  });


  /* ----- Mobile Menu Toggle ----- */
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = !mobileMenu.classList.contains('hidden');
      if (isOpen) {
        mobileMenu.classList.add('hidden');
        menuBtn.classList.remove('active');
      } else {
        mobileMenu.classList.remove('hidden');
        menuBtn.classList.add('active');
        gsap.from(mobileMenu.children, {
          y: -15, opacity: 0, duration: 0.4, stagger: 0.06, ease: 'power3.out'
        });
      }
    });
  }


  /* ----- Scroll Reveal Animations ----- */
  const revealTypes = [
    { selector: '.reveal', from: { y: 50, opacity: 0 } },
    { selector: '.reveal-left', from: { x: -60, opacity: 0 } },
    { selector: '.reveal-right', from: { x: 60, opacity: 0 } },
    { selector: '.reveal-scale', from: { scale: 0.9, opacity: 0 } }
  ];

  revealTypes.forEach(({ selector, from }) => {
    const els = document.querySelectorAll(selector);
    if (els.length === 0) return;

    ScrollTrigger.batch(els, {
      onEnter: (batch) => {
        gsap.fromTo(batch, from, {
          y: 0, x: 0, scale: 1, opacity: 1,
          duration: 1, stagger: 0.1, ease: 'power3.out'
        });
      },
      start: 'top 90%',
      once: true
    });
  });


  /* ----- Smooth Scroll for Anchor Links ----- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80, duration: 1.2 });
      }
    });
  });

});
