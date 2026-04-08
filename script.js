/* ══════════════════════════════════════════════════════════════
   script.js  —  TechVault Tutorial Hub  v2.0
   Sections:
     1.  Tutorial Data
     2.  Three.js Animated Background
     3.  Live Clock
     4.  Public IP Fetch
     5.  Homepage GSAP Entrance Animations
     6.  Search Bar (live, client-side)
     7.  Nuclear Launch Animation (PDF open interceptor)
     8.  Category Cards — Click & Navigation
     9.  Tutorial Page — Render & Animate
    10.  Back Button — Return to Home
    11.  Vanilla Tilt Init
    12.  Tutorial Count (footer)
   ══════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════
   1.  TUTORIAL DATA
   ══════════════════════════════════════════════════════════════ */
const TUTORIALS = {

  sysnet: {
    label: 'System & Network',
    tutorials: [
      { title: 'LAMP (Debian)',                pdf: 'LAMP.pdf'            },
      { title: 'VMware Workstation Pro',        pdf: 'vmware.pdf'         },
      { title: 'Installer Debian dans VMware',  pdf: 'debianvmware.pdf'   },
      { title: 'DHCP (Debian)',                 pdf: 'DHCP -Debiaan.pdf'  },
      { title: 'VPN (Debian)',                  pdf: 'TUTO-vpn.pdf'       },
      { title: 'Proxy (Debian)',                pdf: 'servproxy.pdf'      },
      { title: 'Affecter une IP Statique',      pdf: 'TUTO-ip-fixe.pdf'   },
      { title: 'Serveur Mail',                  pdf: 'servmail.pdf'       },
    ]
  },

  devops: {
    label: 'DevOps',
    tutorials: [
      { title: 'Traefik Reverse Proxy',                pdf: 'Traefik as Reverse Proxy.pdf' },
      { title: 'Ansible (PasswordAuth)',               pdf: 'ansible.pdf'                  },
      { title: 'Monitoring (Prometheus & Grafana)',    pdf: 'promgraf.pdf'                 },
      { title: 'Installer Docker & Docker Compose',    pdf: 'docker.pdf'                   },
      { title: 'GitHub (Débutant)',                    pdf: 'GitHub.pdf'                   },
      { title: 'Synchronisation rsync & incron',       pdf: 'synchro.pdf'                  },
      { title: 'Configurer Clé SSH',                   pdf: 'cle-ssh.pdf'                  },
      { title: 'Configurer Nom de domaine & TLS',      pdf: 'nomdhttps.pdf'                },
    ]
  },

  cyber: {
    label: 'Cybersecurity',
    tutorials: [
      { title: 'Mise en place de Fail2ban', pdf: 'fail2ban.pdf' },
    ]
  }

};

/* Flatten all tutorials for search */
const ALL_TUTORIALS = [];
Object.entries(TUTORIALS).forEach(([catKey, cat]) => {
  cat.tutorials.forEach(tut => {
    ALL_TUTORIALS.push({ ...tut, category: catKey, categoryLabel: cat.label });
  });
});

/* ══════════════════════════════════════════════════════════════
   2.  THREE.JS — ANIMATED 3D PARTICLE GRID BACKGROUND
   ══════════════════════════════════════════════════════════════ */
(function initThreeBackground() {
  const canvas = document.getElementById('bg-canvas');
  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 80;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);

  const PARTICLE_COUNT = 700;
  const positions  = new Float32Array(PARTICLE_COUNT * 3);
  const speeds     = new Float32Array(PARTICLE_COUNT);
  const amplitudes = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    speeds[i]     = 0.2 + Math.random() * 0.5;
    amplitudes[i] = 1   + Math.random() * 3;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  function makeParticleTexture() {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx  = c.getContext('2d');
    const half = size / 2;
    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0,   'rgba(0, 195, 255, 1)');
    grad.addColorStop(0.4, 'rgba(0, 140, 255, 0.6)');
    grad.addColorStop(1,   'rgba(0, 60, 120, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  const material = new THREE.PointsMaterial({
    map: makeParticleTexture(), size: 1.4, sizeAttenuation: true,
    transparent: true, opacity: 0.75, depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  const gridHelper = new THREE.GridHelper(200, 30, 0x002244, 0x001122);
  gridHelper.position.y = -40;
  gridHelper.material.transparent = true;
  gridHelper.material.opacity     = 0.3;
  scene.add(gridHelper);

  const linePositions = [];
  const threshold = 28, maxLines = 180;
  let lineCount = 0;
  for (let i = 0; i < PARTICLE_COUNT && lineCount < maxLines; i++) {
    for (let j = i + 1; j < PARTICLE_COUNT && lineCount < maxLines; j++) {
      const dx = positions[i*3]   - positions[j*3];
      const dy = positions[i*3+1] - positions[j*3+1];
      const dz = positions[i*3+2] - positions[j*3+2];
      if (Math.sqrt(dx*dx + dy*dy + dz*dz) < threshold) {
        linePositions.push(
          positions[i*3], positions[i*3+1], positions[i*3+2],
          positions[j*3], positions[j*3+1], positions[j*3+2]
        );
        lineCount++;
      }
    }
  }

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
  const lineMat  = new THREE.LineBasicMaterial({ color: 0x004488, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending });
  const linesMesh = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(linesMesh);

  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  let clock = 0;
  function animate() {
    requestAnimationFrame(animate);
    clock += 0.005;
    particles.rotation.y  = clock * 0.08;
    particles.rotation.x  = clock * 0.02;
    linesMesh.rotation.y  = clock * 0.08;
    linesMesh.rotation.x  = clock * 0.02;

    const pos = geometry.attributes.position;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos.array[i*3+1] += Math.sin(clock * speeds[i] + i) * 0.006 * amplitudes[i];
    }
    pos.needsUpdate = true;

    camera.position.x += (mouseX * 8 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 4 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

/* ══════════════════════════════════════════════════════════════
   3.  LIVE CLOCK
   ══════════════════════════════════════════════════════════════ */
function updateClock() {
  const now = new Date();
  const str = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':');
  const el1 = document.getElementById('live-clock');
  const el2 = document.getElementById('live-clock-2');
  if (el1) el1.textContent = str;
  if (el2) el2.textContent = str;
}
updateClock();
setInterval(updateClock, 1000);

/* ══════════════════════════════════════════════════════════════
   4.  PUBLIC IP
   ══════════════════════════════════════════════════════════════ */
async function fetchPublicIP() {
  const el = document.getElementById('user-ip');
  try {
    const res  = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    el.textContent = data.ip;
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6 });
  } catch {
    el.textContent = 'N/A';
  }
}
fetchPublicIP();

/* ══════════════════════════════════════════════════════════════
   5.  HOME PAGE — GSAP ENTRANCE ANIMATIONS
   ══════════════════════════════════════════════════════════════ */
function playHomeEntrance() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.to('#hero-badge', { opacity: 1, y: 0, duration: 0.6 });
  tl.fromTo('#hero-title', { opacity: 0, y: 60, skewY: 4 }, { opacity: 1, y: 0, skewY: 0, duration: 0.9 }, '-=0.2');
  tl.to('#hero-sub',   { opacity: 1, y: 0, duration: 0.6 }, '-=0.3');
  tl.to('.card',       { opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: 'back.out(1.4)' }, '-=0.2');
  tl.to('#search-zone', { opacity: 1, y: 0, duration: 0.5 }, '-=0.4');
  tl.from('.hud-footer', { opacity: 0, y: 8, duration: 0.5 }, '-=0.3');
  return tl;
}

/* ══════════════════════════════════════════════════════════════
   6.  SEARCH BAR — LIVE, CLIENT-SIDE ONLY
   ══════════════════════════════════════════════════════════════ */
const searchInput   = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const searchClear   = document.getElementById('search-clear');

let selectedIndex = -1;

/* Highlight matching fragment in text */
function highlight(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return text.slice(0, idx)
    + '<mark>' + text.slice(idx, idx + query.length) + '</mark>'
    + text.slice(idx + query.length);
}

/* Category badge colour map */
const CAT_COLOR = {
  devops:  '#008cff',
  sysnet:  '#00c3ff',
  cyber:   '#ff4f77',
};

function renderSearchResults(query) {
  selectedIndex = -1;

  if (!query || query.trim().length < 2) {
    closeSearchResults();
    return;
  }

  const q = query.trim().toLowerCase();
  const matches = ALL_TUTORIALS.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.categoryLabel.toLowerCase().includes(q)
  );

  if (matches.length === 0) {
    searchResults.innerHTML = `
      <div class="sr-empty">
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5"/>
          <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="9" y1="11" x2="13" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        NO MODULES FOUND
      </div>`;
    searchResults.classList.add('open');
    return;
  }

  searchResults.innerHTML = matches.map((t, i) => `
    <div class="sr-item" role="option" data-index="${i}" data-pdf="${t.pdf}" tabindex="-1">
      <div class="sr-item-left">
        <span class="sr-cat-badge" style="color:${CAT_COLOR[t.category] || '#008cff'}">${t.categoryLabel.toUpperCase()}</span>
        <span class="sr-title">${highlight(t.title, query.trim())}</span>
      </div>
      <div class="sr-item-right">
        <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        PDF
      </div>
    </div>
  `).join('');

  /* Click on result → launch animation */
  searchResults.querySelectorAll('.sr-item').forEach(item => {
    item.addEventListener('click', () => {
      const pdf = item.dataset.pdf;
      closeSearchResults();
      searchInput.value = '';
      triggerLaunchAnimation(`easycontent/${pdf}`);
    });
    item.addEventListener('mouseenter', () => {
      searchResults.querySelectorAll('.sr-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      selectedIndex = parseInt(item.dataset.index);
    });
  });

  searchResults.classList.add('open');
}

function closeSearchResults() {
  searchResults.classList.remove('open');
  setTimeout(() => { searchResults.innerHTML = ''; }, 300);
  selectedIndex = -1;
}

searchInput.addEventListener('input', () => {
  const q = searchInput.value;
  searchClear.style.opacity = q ? '1' : '0';
  renderSearchResults(q);
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.style.opacity = '0';
  closeSearchResults();
  searchInput.focus();
});

/* Keyboard navigation */
searchInput.addEventListener('keydown', e => {
  const items = searchResults.querySelectorAll('.sr-item');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
    items.forEach((el, i) => el.classList.toggle('active', i === selectedIndex));
    items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex = Math.max(selectedIndex - 1, 0);
    items.forEach((el, i) => el.classList.toggle('active', i === selectedIndex));
    items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    if (selectedIndex >= 0 && items[selectedIndex]) {
      items[selectedIndex].click();
    }
  } else if (e.key === 'Escape') {
    closeSearchResults();
    searchInput.blur();
  }
});

/* Close on outside click */
document.addEventListener('click', e => {
  if (!e.target.closest('#search-zone')) closeSearchResults();
});

/* ══════════════════════════════════════════════════════════════
   7.  NUCLEAR LAUNCH ANIMATION
       triggerLaunchAnimation(pdfUrl) — call instead of window.open
   ══════════════════════════════════════════════════════════════ */
const LAUNCH_LINES = [
  'INITIALIZING SECURE CHANNEL...',
  'AUTHENTICATING ACCESS CREDENTIALS...',
  'DECRYPTING VAULT ENTRY PROTOCOL...',
  'BYPASSING FIREWALL LAYER [3/3]...',
  'INJECTING PAYLOAD SEQUENCE...',
];

const HEX_CHARS = '0123456789ABCDEF';
function randomHex(len) {
  let s = '';
  for (let i = 0; i < len; i++) s += HEX_CHARS[Math.floor(Math.random() * 16)];
  return s;
}

let codeStreamInterval = null;

function triggerLaunchAnimation(pdfUrl) {
  const overlay    = document.getElementById('launch-overlay');
  const status     = document.getElementById('launch-status');
  const pct        = document.getElementById('launch-pct');
  const ready      = document.getElementById('launch-ready');
  const codeStream = document.getElementById('launch-code-stream');
  const ring       = document.getElementById('ring-progress');

  /* Reset state */
  overlay.querySelectorAll('.launch-line').forEach(el => {
    el.classList.remove('ll-visible', 'll-done');
  });
  ready.classList.remove('ready-visible');
  status.textContent = 'DECRYPTING...';
  pct.textContent    = '0%';
  codeStream.innerHTML = '';

  /* SVG ring circumference */
  const CIRC = 2 * Math.PI * 88; // r=88
  ring.style.strokeDasharray  = CIRC;
  ring.style.strokeDashoffset = CIRC;

  /* Show overlay */
  overlay.classList.add('active');
  gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.35 });

  /* Scrolling hex stream */
  function pushCodeLine() {
    const line = document.createElement('div');
    line.className = 'cs-line';
    line.textContent = Array.from({ length: 6 }, () =>
      `${randomHex(4)} ${randomHex(4)} ${randomHex(4)} ${randomHex(4)}`
    ).join('  ');
    codeStream.appendChild(line);
    if (codeStream.children.length > 12) codeStream.removeChild(codeStream.children[0]);
  }
  codeStreamInterval = setInterval(pushCodeLine, 80);

  /* Sequence: animate lines + ring + percentage */
  const totalDuration = 2800; // ms
  const startTime = performance.now();

  /* Show lines progressively */
  LAUNCH_LINES.forEach((_, idx) => {
    const el = document.getElementById(`ll-${idx + 1}`);
    setTimeout(() => {
      el.classList.add('ll-visible');
      setTimeout(() => el.classList.add('ll-done'), 400);
    }, idx * 480);
  });

  /* Animate ring + percentage */
  const statusPhrases = ['DECRYPTING...', 'BYPASSING...', 'INJECTING...', 'ACCESS VERIFIED'];
  let phraseIdx = 0;
  const statusInterval = setInterval(() => {
    phraseIdx = (phraseIdx + 1) % statusPhrases.length;
    status.textContent = statusPhrases[phraseIdx];
  }, 600);

  function animateProgress(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / totalDuration, 1);
    const p = Math.round(progress * 100);

    pct.textContent = `${p}%`;
    ring.style.strokeDashoffset = CIRC * (1 - progress);

    if (progress < 1) {
      requestAnimationFrame(animateProgress);
    } else {
      finishLaunch();
    }
  }
  requestAnimationFrame(animateProgress);

  function finishLaunch() {
    clearInterval(codeStreamInterval);
    clearInterval(statusInterval);

    /* Show READY state */
    status.style.opacity = '0';
    pct.style.opacity    = '0';
    ready.classList.add('ready-visible');

    gsap.fromTo(ready, { opacity: 0, scale: 0.8 }, {
      opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)'
    });

    /* Open PDF after short delay */
    setTimeout(() => {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      closeLaunchOverlay();
    }, 900);
  }
}

function closeLaunchOverlay() {
  const overlay = document.getElementById('launch-overlay');
  clearInterval(codeStreamInterval);
  gsap.to(overlay, {
    opacity: 0, duration: 0.45,
    onComplete: () => {
      overlay.classList.remove('active');
      /* Reset */
      const status = document.getElementById('launch-status');
      const pct    = document.getElementById('launch-pct');
      const ready  = document.getElementById('launch-ready');
      status.style.opacity = '';
      pct.style.opacity    = '';
      ready.classList.remove('ready-visible');
    }
  });
}

/* Allow clicking overlay to dismiss (after 1.5s) */
let canDismiss = false;
document.getElementById('launch-overlay').addEventListener('click', e => {
  if (canDismiss && e.target === document.getElementById('launch-overlay')) {
    closeLaunchOverlay();
  }
});

/* ══════════════════════════════════════════════════════════════
   8.  CATEGORY CARDS — CLICK & NAVIGATE
   ══════════════════════════════════════════════════════════════ */
let activeCategory = null;

const categoryCards = document.querySelectorAll('.card[data-category]');
categoryCards.forEach(card => {
  card.addEventListener('click', () => navigateToTutorials(card.dataset.category));
});

function navigateToTutorials(category) {
  activeCategory = category;
  const pageHome = document.getElementById('page-home');
  const pageTuts = document.getElementById('page-tutorials');

  gsap.to(pageHome, {
    opacity: 0, x: -60, duration: 0.45, ease: 'power2.in',
    onComplete: () => {
      pageHome.classList.remove('active');
      pageHome.style.transform = '';
      pageHome.style.opacity   = '';

      pageTuts.classList.add('active');
      renderTutorials(category);

      gsap.fromTo(pageTuts,
        { opacity: 0, x: 60 },
        { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  });
}

/* ══════════════════════════════════════════════════════════════
   9.  TUTORIAL PAGE — RENDER & ANIMATE
   ══════════════════════════════════════════════════════════════ */
function renderTutorials(category) {
  const data      = TUTORIALS[category];
  const grid      = document.getElementById('tut-grid');
  const label     = document.getElementById('tut-category-label');
  const introText = document.getElementById('tut-intro-text');

  label.textContent     = data.label.toUpperCase();
  introText.textContent = `${data.tutorials.length} MODULES — ${data.label.toUpperCase()}`;
  grid.innerHTML        = '';

  data.tutorials.forEach((tut, index) => {
    const card = document.createElement('div');
    card.className = 'tut-card';
    const num = String(index + 1).padStart(2, '0');

    card.innerHTML = `
      <span class="tut-num">// MODULE_${num}</span>
      <h3 class="tut-title">${tut.title}</h3>
      <button class="btn-pdf" aria-label="Open PDF: ${tut.title}" data-pdf="${tut.pdf}">
        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        OPEN PDF
      </button>
    `;
    grid.appendChild(card);
  });

  /* Intercept PDF opens with launch animation */
  grid.querySelectorAll('.btn-pdf').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerLaunchAnimation(`easycontent/${btn.dataset.pdf}`);
    });
  });

  gsap.to('.tut-card', {
    opacity: 1, y: 0, duration: 0.55, stagger: 0.07,
    ease: 'back.out(1.2)', delay: 0.15
  });

  document.querySelectorAll('.tut-card').forEach(card => {
    card.addEventListener('mouseenter', () => gsap.to(card, { scale: 1.025, duration: 0.25, ease: 'power2.out' }));
    card.addEventListener('mouseleave', () => gsap.to(card, { scale: 1,     duration: 0.3,  ease: 'power2.inOut' }));
  });
}

/* ══════════════════════════════════════════════════════════════
   10. BACK BUTTON
   ══════════════════════════════════════════════════════════════ */
document.getElementById('btn-back').addEventListener('click', () => {
  const pageHome = document.getElementById('page-home');
  const pageTuts = document.getElementById('page-tutorials');

  gsap.to(pageTuts, {
    opacity: 0, x: 60, duration: 0.4, ease: 'power2.in',
    onComplete: () => {
      pageTuts.classList.remove('active');
      pageTuts.style.transform = '';
      pageTuts.style.opacity   = '';

      pageHome.classList.add('active');
      gsap.fromTo(pageHome,
        { opacity: 0, x: -60 },
        { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }
      );
      activeCategory = null;
    }
  });
});

/* ══════════════════════════════════════════════════════════════
   11. VANILLA TILT
   ══════════════════════════════════════════════════════════════ */
if (typeof VanillaTilt !== 'undefined') {
  VanillaTilt.init(document.querySelectorAll('[data-tilt]'), {
    max: 15, speed: 400, glare: true,
    'max-glare': 0.25, scale: 1.04, perspective: 800, gyroscope: false,
  });
}

/* ══════════════════════════════════════════════════════════════
   12. TUTORIAL COUNT
   ══════════════════════════════════════════════════════════════ */
(function updateTutorialCount() {
  const total = Object.values(TUTORIALS).reduce((s, c) => s + c.tutorials.length, 0);
  const el = document.getElementById('tutorial-count');
  if (el) el.textContent = `${total} MODULES AVAILABLE`;
})();

/* ── KICK-OFF ─────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  playHomeEntrance();
});