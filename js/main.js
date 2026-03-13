/* ========================================
   Brillix Technologies - Advanced Main JS
   Apple-style animations, custom cursor,
   magnetic buttons, split-text reveals,
   smooth spring physics
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ----- Register GSAP ----- */
  gsap.registerPlugin(ScrollTrigger);

  /* ----- Lenis Smooth Scroll ----- */
  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.8
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);


  /* =============================================
     CUSTOM CURSOR
     Smooth spring-physics cursor with hover states
     ============================================= */
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');

  if (cursorDot && cursorRing && window.matchMedia('(hover: hover)').matches) {
    let cx = 0, cy = 0;     // current position
    let tx = 0, ty = 0;     // target position
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
    });

    // Spring animation for ring
    function updateCursor() {
      // Dot follows immediately
      cx = tx;
      cy = ty;
      cursorDot.style.transform = `translate(${cx - 4}px, ${cy - 4}px)`;

      // Ring has spring lag
      ringX += (tx - ringX) * 0.12;
      ringY += (ty - ringY) * 0.12;
      cursorRing.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px)`;

      requestAnimationFrame(updateCursor);
    }
    updateCursor();

    // Hover state for interactive elements
    const hoverTargets = document.querySelectorAll(
      'a, button, .tilt-card, .tech-card, .project-card, .form-input, .social-icon, .nav-link'
    );
    hoverTargets.forEach(el => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovering'));
    });

    document.addEventListener('mousedown', () => cursorRing.classList.add('clicking'));
    document.addEventListener('mouseup', () => cursorRing.classList.remove('clicking'));
  }


  /* =============================================
     MAGNETIC BUTTONS
     Buttons pull toward mouse on hover
     ============================================= */
  document.querySelectorAll('.btn-primary, .btn-outline').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, {
        x: x * 0.25,
        y: y * 0.25,
        duration: 0.4,
        ease: 'power2.out'
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    });
  });


  /* =============================================
     LOADER — Cinematic Entry
     ============================================= */
  const loaderTl = gsap.timeline();

  window.addEventListener('load', () => {
    loaderTl
      .to('#loader-logo', {
        scale: 1.15,
        duration: 0.5,
        ease: 'power2.inOut'
      })
      .to('#loader-logo', {
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        ease: 'back.in(3)'
      })
      .to('#loader-text', {
        opacity: 0,
        y: -10,
        duration: 0.3
      }, '-=0.5')
      .to('#loader', {
        clipPath: 'circle(0% at 50% 50%)',
        duration: 1,
        ease: 'power4.inOut'
      }, '-=0.2')
      .set('#loader', { display: 'none' })
      // Navbar slides in
      .from('#navbar', {
        y: -100,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
      }, '-=0.5')
      // Hero content — staggered character reveal
      .from('.hero-badge', {
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        ease: 'back.out(2)'
      }, '-=0.4')
      .call(() => animateHeroText())
      .from('.hero-subtitle', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, '-=0.3')
      .from('.hero-desc', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, '-=0.5')
      .from('.hero-buttons > *', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out'
      }, '-=0.5')
      .from('.scroll-indicator', {
        opacity: 0,
        y: 20,
        duration: 0.6
      }, '-=0.3');
  });


  /* =============================================
     APPLE-STYLE TEXT ANIMATION
     Split heading into chars, reveal wave-style
     ============================================= */
  function animateHeroText() {
    const heading = document.querySelector('.hero-heading');
    if (!heading) return;

    // Already split by HTML — animate the .text-reveal-line spans
    const lines = heading.querySelectorAll('.text-reveal-line > span');
    gsap.fromTo(lines, {
      y: '110%',
      rotateX: 20
    }, {
      y: '0%',
      rotateX: 0,
      duration: 1.2,
      stagger: 0.08,
      ease: 'power4.out'
    });
  }

  // Split text for any .split-chars elements
  document.querySelectorAll('.split-chars').forEach(el => {
    const text = el.textContent;
    el.innerHTML = '';
    text.split('').forEach(char => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = char === ' ' ? '\u00A0' : char;
      el.appendChild(span);
    });
  });


  /* =============================================
     SCROLL PROGRESS
     ============================================= */
  const scrollProgress = document.getElementById('scroll-progress');
  window.addEventListener('scroll', () => {
    const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    scrollProgress.style.width = pct + '%';
  });


  /* =============================================
     NAVBAR — Scroll Effect
     ============================================= */
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 80) {
      navbar.classList.add('navbar-scrolled');
    } else {
      navbar.classList.remove('navbar-scrolled');
    }

    // Hide on scroll down, show on scroll up
    if (currentScroll > 400) {
      if (currentScroll > lastScroll + 5) {
        gsap.to(navbar, { y: -100, duration: 0.4, ease: 'power3.out' });
      } else if (currentScroll < lastScroll - 5) {
        gsap.to(navbar, { y: 0, duration: 0.4, ease: 'power3.out' });
      }
    } else {
      gsap.to(navbar, { y: 0, duration: 0.4 });
    }
    lastScroll = currentScroll;
  });


  /* =============================================
     ACTIVE NAV LINK TRACKING
     ============================================= */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 150;
      if (window.scrollY >= top) current = section.getAttribute('id');
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) link.classList.add('active');
    });
  });


  /* =============================================
     SMOOTH SCROLL NAVIGATION
     ============================================= */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        lenis.scrollTo(target, { offset: -80, duration: 1.5 });
        // Close mobile menu
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.add('hidden');
          document.getElementById('menu-btn').classList.remove('active');
        }
      }
    });
  });


  /* =============================================
     MOBILE MENU
     ============================================= */
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      menuBtn.classList.toggle('active');
      mobileMenu.classList.toggle('hidden');
      if (!mobileMenu.classList.contains('hidden')) {
        gsap.from('#mobile-menu a', {
          y: 30, opacity: 0, stagger: 0.06, duration: 0.5, ease: 'power3.out'
        });
      }
    });
  }


  /* =============================================
     SCROLL REVEAL — Apple-Style
     Fade up with scale, longer duration
     ============================================= */
  ScrollTrigger.batch('.reveal', {
    onEnter: (elements) => {
      gsap.to(elements, {
        opacity: 1, y: 0, duration: 1.2,
        stagger: 0.1, ease: 'power3.out'
      });
    },
    start: 'top 90%',
    once: true
  });

  ScrollTrigger.batch('.reveal-left', {
    onEnter: (elements) => {
      gsap.to(elements, {
        opacity: 1, x: 0, duration: 1.2,
        stagger: 0.1, ease: 'power3.out'
      });
    },
    start: 'top 90%',
    once: true
  });

  ScrollTrigger.batch('.reveal-right', {
    onEnter: (elements) => {
      gsap.to(elements, {
        opacity: 1, x: 0, duration: 1.2,
        stagger: 0.1, ease: 'power3.out'
      });
    },
    start: 'top 90%',
    once: true
  });

  ScrollTrigger.batch('.reveal-scale', {
    onEnter: (elements) => {
      gsap.to(elements, {
        opacity: 1, scale: 1, duration: 1,
        stagger: 0.08, ease: 'power3.out'
      });
    },
    start: 'top 90%',
    once: true
  });


  /* =============================================
     3D TILT CARDS — Enhanced with spotlight
     ============================================= */
  document.querySelectorAll('.tilt-card').forEach(card => {
    const spotlight = card.querySelector('.card-spotlight-effect');

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      gsap.to(card, {
        rotateX: rotateX,
        rotateY: rotateY,
        scale: 1.03,
        duration: 0.3,
        ease: 'power2.out',
        transformPerspective: 1000
      });

      // Move spotlight
      if (spotlight) {
        spotlight.style.left = x + 'px';
        spotlight.style.top = y + 'px';
        spotlight.style.opacity = '1';
      }
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0, rotateY: 0, scale: 1,
        duration: 0.6, ease: 'elastic.out(1, 0.5)',
        transformPerspective: 1000
      });
      if (spotlight) spotlight.style.opacity = '0';
    });
  });


  /* =============================================
     HERO PARALLAX — Multi-Layer Depth
     ============================================= */
  gsap.to('#hero-canvas', {
    y: 300,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 0.5
    }
  });

  gsap.to('.hero-content', {
    y: 150,
    opacity: 0,
    scale: 0.95,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: '50% top',
      scrub: 0.5
    }
  });


  /* =============================================
     ABOUT — Scrub-based Section Animation
     Text reveals as you scroll into view (Apple-style)
     ============================================= */
  // Animate about description words
  const aboutDesc = document.querySelectorAll('.about-text-animate');
  aboutDesc.forEach(el => {
    const words = el.querySelectorAll('.word-span');
    if (words.length) {
      gsap.fromTo(words, {
        opacity: 0.15
      }, {
        opacity: 1,
        stagger: 0.05,
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          end: 'bottom 60%',
          scrub: 1
        }
      });
    }
  });

  // Stats counter
  document.querySelectorAll('.stat-number').forEach(stat => {
    const target = parseInt(stat.getAttribute('data-target'));
    ScrollTrigger.create({
      trigger: stat,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to(stat, {
          innerText: target,
          duration: 2.5,
          ease: 'power2.out',
          snap: { innerText: 1 },
          onUpdate: function () {
            stat.textContent = Math.floor(stat.innerText) + '+';
          }
        });
      }
    });
  });


  /* =============================================
     SERVICE CARDS — Staggered 3D Entrance
     ============================================= */
  gsap.from('.service-card', {
    scrollTrigger: {
      trigger: '#services',
      start: 'top 65%',
      once: true
    },
    y: 80,
    opacity: 0,
    rotateX: 15,
    duration: 1,
    stagger: 0.12,
    ease: 'power3.out',
    transformPerspective: 1000
  });


  /* =============================================
     TECH ICONS — Scale + Bounce
     ============================================= */
  gsap.fromTo('.tech-card', {
    scale: 0,
    opacity: 0
  }, {
    scrollTrigger: {
      trigger: '#technologies',
      start: 'top 85%',
      once: true
    },
    scale: 1,
    opacity: 1,
    duration: 0.7,
    stagger: 0.07,
    ease: 'back.out(2)',
    immediateRender: false
  });


  /* =============================================
     PROJECT CARDS — Alternating Slide
     ============================================= */
  const projectCards = document.querySelectorAll('.project-card');
  projectCards.forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
        once: true
      },
      x: i % 2 === 0 ? -80 : 80,
      y: 40,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    });
  });


  /* =============================================
     COUNTRY CODE PICKER
     Searchable dropdown with flags from flagcdn.com
     ============================================= */
  const COUNTRIES = [
    {name:"Afghanistan",code:"af",dial:"+93"},{name:"Albania",code:"al",dial:"+355"},{name:"Algeria",code:"dz",dial:"+213"},
    {name:"American Samoa",code:"as",dial:"+1684"},{name:"Andorra",code:"ad",dial:"+376"},{name:"Angola",code:"ao",dial:"+244"},
    {name:"Anguilla",code:"ai",dial:"+1264"},{name:"Antarctica",code:"aq",dial:"+672"},{name:"Antigua & Barbuda",code:"ag",dial:"+1268"},
    {name:"Argentina",code:"ar",dial:"+54"},{name:"Armenia",code:"am",dial:"+374"},{name:"Aruba",code:"aw",dial:"+297"},
    {name:"Australia",code:"au",dial:"+61"},{name:"Austria",code:"at",dial:"+43"},{name:"Azerbaijan",code:"az",dial:"+994"},
    {name:"Bahamas",code:"bs",dial:"+1242"},{name:"Bahrain",code:"bh",dial:"+973"},{name:"Bangladesh",code:"bd",dial:"+880"},
    {name:"Barbados",code:"bb",dial:"+1246"},{name:"Belarus",code:"by",dial:"+375"},{name:"Belgium",code:"be",dial:"+32"},
    {name:"Belize",code:"bz",dial:"+501"},{name:"Benin",code:"bj",dial:"+229"},{name:"Bermuda",code:"bm",dial:"+1441"},
    {name:"Bhutan",code:"bt",dial:"+975"},{name:"Bolivia",code:"bo",dial:"+591"},{name:"Bosnia & Herzegovina",code:"ba",dial:"+387"},
    {name:"Botswana",code:"bw",dial:"+267"},{name:"Brazil",code:"br",dial:"+55"},{name:"Brunei",code:"bn",dial:"+673"},
    {name:"Bulgaria",code:"bg",dial:"+359"},{name:"Burkina Faso",code:"bf",dial:"+226"},{name:"Burundi",code:"bi",dial:"+257"},
    {name:"Cambodia",code:"kh",dial:"+855"},{name:"Cameroon",code:"cm",dial:"+237"},{name:"Canada",code:"ca",dial:"+1"},
    {name:"Cape Verde",code:"cv",dial:"+238"},{name:"Cayman Islands",code:"ky",dial:"+1345"},{name:"Central African Republic",code:"cf",dial:"+236"},
    {name:"Chad",code:"td",dial:"+235"},{name:"Chile",code:"cl",dial:"+56"},{name:"China",code:"cn",dial:"+86"},
    {name:"Colombia",code:"co",dial:"+57"},{name:"Comoros",code:"km",dial:"+269"},{name:"Congo",code:"cg",dial:"+242"},
    {name:"Congo (DRC)",code:"cd",dial:"+243"},{name:"Cook Islands",code:"ck",dial:"+682"},{name:"Costa Rica",code:"cr",dial:"+506"},
    {name:"Croatia",code:"hr",dial:"+385"},{name:"Cuba",code:"cu",dial:"+53"},{name:"Cyprus",code:"cy",dial:"+357"},
    {name:"Czech Republic",code:"cz",dial:"+420"},{name:"Denmark",code:"dk",dial:"+45"},{name:"Djibouti",code:"dj",dial:"+253"},
    {name:"Dominica",code:"dm",dial:"+1767"},{name:"Dominican Republic",code:"do",dial:"+1849"},{name:"Ecuador",code:"ec",dial:"+593"},
    {name:"Egypt",code:"eg",dial:"+20"},{name:"El Salvador",code:"sv",dial:"+503"},{name:"Equatorial Guinea",code:"gq",dial:"+240"},
    {name:"Eritrea",code:"er",dial:"+291"},{name:"Estonia",code:"ee",dial:"+372"},{name:"Ethiopia",code:"et",dial:"+251"},
    {name:"Falkland Islands",code:"fk",dial:"+500"},{name:"Faroe Islands",code:"fo",dial:"+298"},{name:"Fiji",code:"fj",dial:"+679"},
    {name:"Finland",code:"fi",dial:"+358"},{name:"France",code:"fr",dial:"+33"},{name:"French Guiana",code:"gf",dial:"+594"},
    {name:"French Polynesia",code:"pf",dial:"+689"},{name:"Gabon",code:"ga",dial:"+241"},{name:"Gambia",code:"gm",dial:"+220"},
    {name:"Georgia",code:"ge",dial:"+995"},{name:"Germany",code:"de",dial:"+49"},{name:"Ghana",code:"gh",dial:"+233"},
    {name:"Gibraltar",code:"gi",dial:"+350"},{name:"Greece",code:"gr",dial:"+30"},{name:"Greenland",code:"gl",dial:"+299"},
    {name:"Grenada",code:"gd",dial:"+1473"},{name:"Guadeloupe",code:"gp",dial:"+590"},{name:"Guam",code:"gu",dial:"+1671"},
    {name:"Guatemala",code:"gt",dial:"+502"},{name:"Guinea",code:"gn",dial:"+224"},{name:"Guinea-Bissau",code:"gw",dial:"+245"},
    {name:"Guyana",code:"gy",dial:"+592"},{name:"Haiti",code:"ht",dial:"+509"},{name:"Honduras",code:"hn",dial:"+504"},
    {name:"Hong Kong",code:"hk",dial:"+852"},{name:"Hungary",code:"hu",dial:"+36"},{name:"Iceland",code:"is",dial:"+354"},
    {name:"India",code:"in",dial:"+91"},{name:"Indonesia",code:"id",dial:"+62"},{name:"Iran",code:"ir",dial:"+98"},
    {name:"Iraq",code:"iq",dial:"+964"},{name:"Ireland",code:"ie",dial:"+353"},{name:"Israel",code:"il",dial:"+972"},
    {name:"Italy",code:"it",dial:"+39"},{name:"Ivory Coast",code:"ci",dial:"+225"},{name:"Jamaica",code:"jm",dial:"+1876"},
    {name:"Japan",code:"jp",dial:"+81"},{name:"Jordan",code:"jo",dial:"+962"},{name:"Kazakhstan",code:"kz",dial:"+7"},
    {name:"Kenya",code:"ke",dial:"+254"},{name:"Kiribati",code:"ki",dial:"+686"},{name:"Kuwait",code:"kw",dial:"+965"},
    {name:"Kyrgyzstan",code:"kg",dial:"+996"},{name:"Laos",code:"la",dial:"+856"},{name:"Latvia",code:"lv",dial:"+371"},
    {name:"Lebanon",code:"lb",dial:"+961"},{name:"Lesotho",code:"ls",dial:"+266"},{name:"Liberia",code:"lr",dial:"+231"},
    {name:"Libya",code:"ly",dial:"+218"},{name:"Liechtenstein",code:"li",dial:"+423"},{name:"Lithuania",code:"lt",dial:"+370"},
    {name:"Luxembourg",code:"lu",dial:"+352"},{name:"Macau",code:"mo",dial:"+853"},{name:"Madagascar",code:"mg",dial:"+261"},
    {name:"Malawi",code:"mw",dial:"+265"},{name:"Malaysia",code:"my",dial:"+60"},{name:"Maldives",code:"mv",dial:"+960"},
    {name:"Mali",code:"ml",dial:"+223"},{name:"Malta",code:"mt",dial:"+356"},{name:"Marshall Islands",code:"mh",dial:"+692"},
    {name:"Martinique",code:"mq",dial:"+596"},{name:"Mauritania",code:"mr",dial:"+222"},{name:"Mauritius",code:"mu",dial:"+230"},
    {name:"Mexico",code:"mx",dial:"+52"},{name:"Micronesia",code:"fm",dial:"+691"},{name:"Moldova",code:"md",dial:"+373"},
    {name:"Monaco",code:"mc",dial:"+377"},{name:"Mongolia",code:"mn",dial:"+976"},{name:"Montenegro",code:"me",dial:"+382"},
    {name:"Montserrat",code:"ms",dial:"+1664"},{name:"Morocco",code:"ma",dial:"+212"},{name:"Mozambique",code:"mz",dial:"+258"},
    {name:"Myanmar",code:"mm",dial:"+95"},{name:"Namibia",code:"na",dial:"+264"},{name:"Nauru",code:"nr",dial:"+674"},
    {name:"Nepal",code:"np",dial:"+977"},{name:"Netherlands",code:"nl",dial:"+31"},{name:"New Caledonia",code:"nc",dial:"+687"},
    {name:"New Zealand",code:"nz",dial:"+64"},{name:"Nicaragua",code:"ni",dial:"+505"},{name:"Niger",code:"ne",dial:"+227"},
    {name:"Nigeria",code:"ng",dial:"+234"},{name:"North Korea",code:"kp",dial:"+850"},{name:"North Macedonia",code:"mk",dial:"+389"},
    {name:"Norway",code:"no",dial:"+47"},{name:"Oman",code:"om",dial:"+968"},{name:"Pakistan",code:"pk",dial:"+92"},
    {name:"Palau",code:"pw",dial:"+680"},{name:"Palestine",code:"ps",dial:"+970"},{name:"Panama",code:"pa",dial:"+507"},
    {name:"Papua New Guinea",code:"pg",dial:"+675"},{name:"Paraguay",code:"py",dial:"+595"},{name:"Peru",code:"pe",dial:"+51"},
    {name:"Philippines",code:"ph",dial:"+63"},{name:"Poland",code:"pl",dial:"+48"},{name:"Portugal",code:"pt",dial:"+351"},
    {name:"Puerto Rico",code:"pr",dial:"+1939"},{name:"Qatar",code:"qa",dial:"+974"},{name:"Reunion",code:"re",dial:"+262"},
    {name:"Romania",code:"ro",dial:"+40"},{name:"Russia",code:"ru",dial:"+7"},{name:"Rwanda",code:"rw",dial:"+250"},
    {name:"Samoa",code:"ws",dial:"+685"},{name:"San Marino",code:"sm",dial:"+378"},{name:"Sao Tome & Principe",code:"st",dial:"+239"},
    {name:"Saudi Arabia",code:"sa",dial:"+966"},{name:"Senegal",code:"sn",dial:"+221"},{name:"Serbia",code:"rs",dial:"+381"},
    {name:"Seychelles",code:"sc",dial:"+248"},{name:"Sierra Leone",code:"sl",dial:"+232"},{name:"Singapore",code:"sg",dial:"+65"},
    {name:"Slovakia",code:"sk",dial:"+421"},{name:"Slovenia",code:"si",dial:"+386"},{name:"Solomon Islands",code:"sb",dial:"+677"},
    {name:"Somalia",code:"so",dial:"+252"},{name:"South Africa",code:"za",dial:"+27"},{name:"South Korea",code:"kr",dial:"+82"},
    {name:"South Sudan",code:"ss",dial:"+211"},{name:"Spain",code:"es",dial:"+34"},{name:"Sri Lanka",code:"lk",dial:"+94"},
    {name:"Sudan",code:"sd",dial:"+249"},{name:"Suriname",code:"sr",dial:"+597"},{name:"Eswatini",code:"sz",dial:"+268"},
    {name:"Sweden",code:"se",dial:"+46"},{name:"Switzerland",code:"ch",dial:"+41"},{name:"Syria",code:"sy",dial:"+963"},
    {name:"Taiwan",code:"tw",dial:"+886"},{name:"Tajikistan",code:"tj",dial:"+992"},{name:"Tanzania",code:"tz",dial:"+255"},
    {name:"Thailand",code:"th",dial:"+66"},{name:"Timor-Leste",code:"tl",dial:"+670"},{name:"Togo",code:"tg",dial:"+228"},
    {name:"Tokelau",code:"tk",dial:"+690"},{name:"Tonga",code:"to",dial:"+676"},{name:"Trinidad & Tobago",code:"tt",dial:"+1868"},
    {name:"Tunisia",code:"tn",dial:"+216"},{name:"Turkey",code:"tr",dial:"+90"},{name:"Turkmenistan",code:"tm",dial:"+993"},
    {name:"Turks & Caicos",code:"tc",dial:"+1649"},{name:"Tuvalu",code:"tv",dial:"+688"},{name:"Uganda",code:"ug",dial:"+256"},
    {name:"Ukraine",code:"ua",dial:"+380"},{name:"United Arab Emirates",code:"ae",dial:"+971"},{name:"United Kingdom",code:"gb",dial:"+44"},
    {name:"United States",code:"us",dial:"+1"},{name:"Uruguay",code:"uy",dial:"+598"},{name:"Uzbekistan",code:"uz",dial:"+998"},
    {name:"Vanuatu",code:"vu",dial:"+678"},{name:"Venezuela",code:"ve",dial:"+58"},{name:"Vietnam",code:"vn",dial:"+84"},
    {name:"Yemen",code:"ye",dial:"+967"},{name:"Zambia",code:"zm",dial:"+260"},{name:"Zimbabwe",code:"zw",dial:"+263"}
  ];

  (function initCountryPicker() {
    const picker = document.getElementById('country-picker');
    const btn = document.getElementById('country-picker-btn');
    const dropdown = document.getElementById('country-dropdown');
    const searchInput = document.getElementById('country-search');
    const listEl = document.getElementById('country-list');
    const hiddenInput = document.getElementById('country-code');
    const selectedFlag = document.getElementById('selected-flag');
    const selectedCode = document.getElementById('selected-code');
    if (!picker || !btn) return;

    function flagUrl(code) {
      return 'https://flagcdn.com/w40/' + code + '.png';
    }

    function renderList(filter) {
      const q = (filter || '').toLowerCase();
      listEl.innerHTML = '';
      const filtered = COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(q) || c.dial.includes(q)
      );
      filtered.forEach(c => {
        const li = document.createElement('li');
        li.className = 'country-item' + (c.dial === hiddenInput.value ? ' active' : '');
        li.innerHTML = '<img src="' + flagUrl(c.code) + '" alt="' + c.code + '" loading="lazy">' +
          '<span class="country-name">' + c.name + '</span>' +
          '<span class="country-dial">' + c.dial + '</span>';
        li.addEventListener('click', () => selectCountry(c));
        listEl.appendChild(li);
      });
    }

    function selectCountry(c) {
      hiddenInput.value = c.dial;
      selectedFlag.src = flagUrl(c.code);
      selectedFlag.alt = c.code.toUpperCase();
      selectedCode.textContent = c.dial;
      closeDropdown();
    }

    function openDropdown() {
      dropdown.classList.remove('hidden');
      picker.classList.add('open');
      searchInput.value = '';
      renderList('');
      setTimeout(() => searchInput.focus(), 50);
      // Scroll to active item
      const active = listEl.querySelector('.active');
      if (active) active.scrollIntoView({ block: 'center' });
    }

    function closeDropdown() {
      dropdown.classList.add('hidden');
      picker.classList.remove('open');
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (dropdown.classList.contains('hidden')) openDropdown();
      else closeDropdown();
    });

    searchInput.addEventListener('input', () => renderList(searchInput.value));

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!picker.contains(e.target)) closeDropdown();
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDropdown();
    });
  })();


  /* =============================================
     CONTACT FORM — EmailJS Integration
     ============================================= */
  emailjs.init('e7y3ZvlS6YFJY2pHv');

  const contactForm = document.getElementById('contact-form');
  const toast = document.getElementById('toast');

  function showToast(msg, isError) {
    if (!toast) return;
    toast.textContent = msg;
    if (isError) {
      toast.style.background = 'rgba(220, 38, 38, 0.9)';
    } else {
      toast.style.background = '';
    }
    toast.classList.remove('hidden');
    gsap.fromTo(toast,
      { y: 50, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)' }
    );
    setTimeout(() => {
      gsap.to(toast, {
        y: -20, opacity: 0, scale: 0.9, duration: 0.4, ease: 'power3.in',
        onComplete: () => toast.classList.add('hidden')
      });
    }, 3000);
  }

  if (contactForm) {
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const submitBtnText = submitBtn ? submitBtn.querySelector('span') : null;

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Disable button
      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitBtnText) submitBtnText.textContent = 'Sending...';
      }

      const countryCode = document.getElementById('country-code').value;
      const phoneNumber = document.getElementById('phone').value;

      const templateParams = {
        from_name: document.getElementById('name').value,
        from_email: document.getElementById('email').value,
        phone: countryCode + ' ' + phoneNumber,
        message: document.getElementById('message').value
      };

      emailjs.send('service_0i1t6a9', 'template_4x8lhjy', templateParams)
        .then(() => {
          showToast('Message sent successfully!', false);
          contactForm.reset();
        })
        .catch((err) => {
          console.error('EmailJS error:', err);
          showToast('Failed to send. Please try again.', true);
        })
        .finally(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            if (submitBtnText) submitBtnText.textContent = 'Send Message';
          }
        });
    });
  }


  /* =============================================
     PARALLAX FLOATING ELEMENTS
     Elements float at different speeds on scroll
     ============================================= */
  document.querySelectorAll('[data-parallax]').forEach(el => {
    const speed = parseFloat(el.dataset.parallax) || 0.1;
    gsap.to(el, {
      y: () => -speed * 200,
      ease: 'none',
      scrollTrigger: {
        trigger: el.closest('section') || el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });
  });


  /* =============================================
     SECTION HEADING ANIMATIONS
     Scrub-based heading scale + opacity
     ============================================= */
  document.querySelectorAll('.section-heading-animate').forEach(heading => {
    gsap.from(heading, {
      scrollTrigger: {
        trigger: heading,
        start: 'top 85%',
        end: 'top 50%',
        scrub: 1
      },
      y: 60,
      opacity: 0,
      scale: 0.92
    });
  });


  /* =============================================
     INITIALIZE THREE.JS SCENES
     ============================================= */
  // Global floating particles (full-page background)
  const globalCanvas = document.getElementById('global-canvas');
  if (globalCanvas) initGlobalParticles(globalCanvas);

  // Hero morphing particle sphere
  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas) initHeroScene(heroCanvas);

  // About holographic cube
  const aboutCanvas = document.getElementById('about-canvas');
  if (aboutCanvas) initAboutScene(aboutCanvas);

  // Services floating geometry
  const servicesCanvas = document.getElementById('services-canvas');
  if (servicesCanvas) initServicesScene(servicesCanvas);

  // Technologies orbital ring
  const techCanvas = document.getElementById('tech-canvas');
  if (techCanvas) initTechScene(techCanvas);

});
