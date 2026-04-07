/* ══════════════════════════════════════════════════════════════
   script.js  —  TechVault Tutorial Hub
   Sections:
     1. Tutorial Data
     2. Three.js Animated Background
     3. Live Clock
     4. Public IP Fetch
     5. Homepage GSAP Entrance Animations
     6. Category Cards — Click & Navigation
     7. Tutorial Page — Render & Animate
     8. Back Button — Return to Home
     9. Vanilla Tilt Init
    10. Tutorial Count (footer)
   ══════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════
   1.  TUTORIAL DATA
       Add / remove tutorials here — the rest is automatic.
       Each entry: { title: "...", pdf: "filename.pdf" }
   ══════════════════════════════════════════════════════════════ */
const TUTORIALS = {

  /* ── SYSTEM & NETWORK ─────────────────────────────────────── */
  sysnet: {
    label: 'System & Network',
    tutorials: [
      { title: 'LAMP (Debian)',              pdf: 'LAMP.pdf'     },
      { title: 'VMware Workstation Pro',     pdf: 'vmware.pdf'   },
      { title: 'Installer Debian dans VMware', pdf: 'debianvmware.pdf'      },
      { title: 'DHCP (Debian)',              pdf: 'DHCP -Debiaan.pdf'          },
      { title: 'VPN (Debian)',               pdf: 'TUTO-vpn.pdf'           },
      { title: 'Proxy (Debian)',             pdf: 'servproxy.pdf'         },
      { title: 'Affecter une IP Statique',   pdf: 'TUTO-ip-fixe.pdf'          },
      { title: 'Serveur Mail',               pdf: 'servmail.pdf'         },
    ]
  },

  /* ── DEVOPS ───────────────────────────────────────────────── */
  devops: {
    label: 'DevOps',
    tutorials: [
      { title: 'Traefik Reverse Proxy',                  pdf: 'Traefik as Reverse Proxy.pdf'         },
      { title: 'Ansible (PasswordAuth)',                  pdf: 'ansible.pdf'         },
      { title: 'Monitoring (Prometheus & Grafana)',       pdf: 'promgraf.pdf'      },
      { title: 'Installer Docker & Docker Compose',       pdf: 'docker.pdf'          },
      { title: 'GitHub (Débutant)',                       pdf: 'GitHub.pdf'          },
      { title: 'Synchronisation rsync & incron',          pdf: 'synchro.pdf'    },
      { title: 'Configurer Clé SSH',                      pdf: 'cle-ssh.pdf'         },
      { title: 'Configurer Nom de domaine & TLS',         pdf: 'nomdhttps.pdf'      },

    ]
  },

  /* ── CYBERSECURITY ────────────────────────────────────────── */
  cyber: {
    label: 'Cybersecurity',
    tutorials: [
      { title: 'Mise en place de Fail2ban', pdf: 'fail2ban.pdf' },
    ]
  }

};

/* ══════════════════════════════════════════════════════════════
   2.  THREE.JS — ANIMATED 3D PARTICLE GRID BACKGROUND
   ══════════════════════════════════════════════════════════════ */
(function initThreeBackground () {
  const canvas = document.getElementById('bg-canvas');

  // ── Scene, Camera, Renderer ──────────────────────────────────
  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 80;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));  // perf cap
  renderer.setClearColor(0x000000, 0);  // transparent — body bg shows through

  // ── PARTICLES ────────────────────────────────────────────────
  // We create a field of small dots arranged roughly in 3D space
  // with a slight drift animation for a "living network" feel.
  const PARTICLE_COUNT = 700;

  const positions  = new Float32Array(PARTICLE_COUNT * 3);
  const speeds     = new Float32Array(PARTICLE_COUNT);     // per-particle drift speed
  const amplitudes = new Float32Array(PARTICLE_COUNT);     // per-particle drift amplitude

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Random positions in a wide box
    positions[i * 3]     = (Math.random() - 0.5) * 200;   // x
    positions[i * 3 + 1] = (Math.random() - 0.5) * 120;   // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;    // z

    speeds[i]     = 0.2 + Math.random() * 0.5;
    amplitudes[i] = 1 + Math.random() * 3;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Crisp circular particle texture generated on a small canvas
  function makeParticleTexture () {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
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
    map:          makeParticleTexture(),
    size:         1.4,
    sizeAttenuation: true,
    transparent:  true,
    opacity:      0.75,
    depthWrite:   false,
    blending:     THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // ── GRID PLANE (subtle horizontal grid at bottom of scene) ───
  const gridHelper = new THREE.GridHelper(200, 30, 0x002244, 0x001122);
  gridHelper.position.y = -40;
  gridHelper.material.transparent = true;
  gridHelper.material.opacity     = 0.3;
  scene.add(gridHelper);

  // ── CONNECTION LINES between close particles ─────────────────
  // We pick a subset of particle pairs within a distance threshold
  // and draw lines between them for a "network graph" look.
  const linePositions = [];
  const threshold     = 28;                 // max distance to connect
  const maxLines      = 180;               // perf limit

  let lineCount = 0;
  outer:
  for (let i = 0; i < PARTICLE_COUNT && lineCount < maxLines; i++) {
    for (let j = i + 1; j < PARTICLE_COUNT && lineCount < maxLines; j++) {
      const dx = positions[i*3]   - positions[j*3];
      const dy = positions[i*3+1] - positions[j*3+1];
      const dz = positions[i*3+2] - positions[j*3+2];
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (dist < threshold) {
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

  const lineMat = new THREE.LineBasicMaterial({
    color:       0x004488,
    transparent: true,
    opacity:     0.25,
    blending:    THREE.AdditiveBlending,
  });

  const linesMesh = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(linesMesh);

  // ── MOUSE PARALLAX (subtle camera drift) ─────────────────────
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ── ANIMATION LOOP ───────────────────────────────────────────
  let clock = 0;
  function animate () {
    requestAnimationFrame(animate);
    clock += 0.005;

    // Slowly rotate the particle cloud
    particles.rotation.y  = clock * 0.08;
    particles.rotation.x  = clock * 0.02;
    linesMesh.rotation.y  = clock * 0.08;
    linesMesh.rotation.x  = clock * 0.02;

    // Drift each particle slightly on the Y axis (breathing effect)
    const pos = geometry.attributes.position;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos.array[i*3+1] += Math.sin(clock * speeds[i] + i) * 0.006 * amplitudes[i];
    }
    pos.needsUpdate = true;

    // Camera follows mouse gently
    camera.position.x += (mouseX * 8 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 4 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();

  // ── RESIZE HANDLER ───────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

/* ══════════════════════════════════════════════════════════════
   3.  LIVE CLOCK  — updates every second on both pages
   ══════════════════════════════════════════════════════════════ */
function updateClock () {
  const now   = new Date();
  const hh    = String(now.getHours()).padStart(2, '0');
  const mm    = String(now.getMinutes()).padStart(2, '0');
  const ss    = String(now.getSeconds()).padStart(2, '0');
  const str   = `${hh}:${mm}:${ss}`;

  // Update both clock elements (home page + tutorial page)
  const el1 = document.getElementById('live-clock');
  const el2 = document.getElementById('live-clock-2');
  if (el1) el1.textContent = str;
  if (el2) el2.textContent = str;
}

updateClock();                           // immediate first tick
setInterval(updateClock, 1000);          // then every second

/* ══════════════════════════════════════════════════════════════
   4.  PUBLIC IP — fetched from ipify API
   ══════════════════════════════════════════════════════════════ */
async function fetchPublicIP () {
  const el = document.getElementById('user-ip');
  try {
    const res  = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    el.textContent = data.ip;
    // Subtle flash animation when IP arrives
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6 });
  } catch (err) {
    // If the request fails (e.g. ad-blocker) show a friendly fallback
    el.textContent = 'N/A';
    console.warn('IP fetch failed:', err);
  }
}

fetchPublicIP();

/* ══════════════════════════════════════════════════════════════
   5.  HOME PAGE — GSAP ENTRANCE ANIMATIONS
       Staggered reveal: badge → title → subtitle → cards
   ══════════════════════════════════════════════════════════════ */
function playHomeEntrance () {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // Badge slides down & fades in
  tl.to('#hero-badge', { opacity: 1, y: 0, duration: 0.6 });

  // Title lines cascade in (each letter-group as one unit)
  tl.fromTo(
    '#hero-title',
    { opacity: 0, y: 60, skewY: 4 },
    { opacity: 1, y: 0, skewY: 0, duration: 0.9 },
    '-=0.2'
  );

  // Subtitle fades in
  tl.to('#hero-sub', { opacity: 1, y: 0, duration: 0.6 }, '-=0.3');

  // Cards stagger up from below
  tl.to('.card', {
    opacity: 1,
    y: 0,
    duration: 0.7,
    stagger: 0.15,
    ease: 'back.out(1.4)'
  }, '-=0.2');

  // Footer count line
  tl.from('.hud-footer', { opacity: 0, y: 8, duration: 0.5 }, '-=0.3');

  return tl;
}

/* ══════════════════════════════════════════════════════════════
   6.  CATEGORY CARDS — CLICK → NAVIGATE TO TUTORIALS
   ══════════════════════════════════════════════════════════════ */

// Track which category is currently open
let activeCategory = null;

// Grab all three category cards
const categoryCards = document.querySelectorAll('.card[data-category]');

categoryCards.forEach(card => {
  card.addEventListener('click', () => {
    const category = card.dataset.category;
    navigateToTutorials(category);
  });
});

/**
 * Transition from home page → tutorial page
 * @param {string} category  — key in the TUTORIALS object
 */
function navigateToTutorials (category) {
  activeCategory = category;

  const pageHome = document.getElementById('page-home');
  const pageTuts = document.getElementById('page-tutorials');

  // ── 1. Animate home out ──────────────────────────────────────
  gsap.to(pageHome, {
    opacity: 0,
    x: -60,
    duration: 0.45,
    ease: 'power2.in',
    onComplete: () => {
      pageHome.classList.remove('active');
      pageHome.style.transform = '';
      pageHome.style.opacity   = '';

      // ── 2. Prepare & animate tutorial page in ───────────────
      pageTuts.classList.add('active');
      renderTutorials(category);          // fill the grid

      gsap.fromTo(
        pageTuts,
        { opacity: 0, x: 60 },
        { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  });
}

/* ══════════════════════════════════════════════════════════════
   7.  TUTORIAL PAGE — RENDER CARDS & ANIMATE
   ══════════════════════════════════════════════════════════════ */

/**
 * Build the tutorial cards for the given category and animate them in.
 * @param {string} category — key in the TUTORIALS object
 */
function renderTutorials (category) {
  const data      = TUTORIALS[category];
  const grid      = document.getElementById('tut-grid');
  const label     = document.getElementById('tut-category-label');
  const introText = document.getElementById('tut-intro-text');

  // Update category label in the header
  label.textContent = data.label.toUpperCase();

  // Intro line
  introText.textContent = `${data.tutorials.length} MODULES — ${data.label.toUpperCase()}`;

  // Clear old cards
  grid.innerHTML = '';

  // Build each tutorial card from data
  data.tutorials.forEach((tut, index) => {
    const card = document.createElement('div');
    card.className = 'tut-card';

    // Format index as 01, 02 …
    const num = String(index + 1).padStart(2, '0');

    card.innerHTML = `
      <span class="tut-num">// MODULE_${num}</span>
      <h3 class="tut-title">${tut.title}</h3>
      <a
        class="btn-pdf"
        href="easycontent/${tut.pdf}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open PDF: ${tut.title}"
      >
        <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        OPEN PDF
      </a>
    `;

    grid.appendChild(card);
  });

  // ── GSAP stagger entrance for tutorial cards ─────────────────
  gsap.to('.tut-card', {
    opacity:  1,
    y:        0,
    duration: 0.55,
    stagger:  0.07,
    ease:     'back.out(1.2)',
    delay:    0.15          // slight delay so page slide-in finishes first
  });

  // ── Hover micro-animation on each card ───────────────────────
  document.querySelectorAll('.tut-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, { scale: 1.025, duration: 0.25, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { scale: 1, duration: 0.3, ease: 'power2.inOut' });
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   8.  BACK BUTTON — return from tutorials to home
   ══════════════════════════════════════════════════════════════ */
document.getElementById('btn-back').addEventListener('click', () => {
  const pageHome = document.getElementById('page-home');
  const pageTuts = document.getElementById('page-tutorials');

  // ── 1. Slide tutorial page out to the right ──────────────────
  gsap.to(pageTuts, {
    opacity: 0,
    x: 60,
    duration: 0.4,
    ease: 'power2.in',
    onComplete: () => {
      pageTuts.classList.remove('active');
      pageTuts.style.transform = '';
      pageTuts.style.opacity   = '';

      // ── 2. Slide home page back in from left ─────────────────
      pageHome.classList.add('active');

      gsap.fromTo(
        pageHome,
        { opacity: 0, x: -60 },
        { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }
      );

      // Reset category
      activeCategory = null;
    }
  });
});

/* ══════════════════════════════════════════════════════════════
   9.  VANILLA TILT — 3D hover effect on category cards
       (already initialised via data-tilt attributes in HTML,
        but we call the JS API here for dynamic options too)
   ══════════════════════════════════════════════════════════════ */
if (typeof VanillaTilt !== 'undefined') {
  VanillaTilt.init(document.querySelectorAll('[data-tilt]'), {
    max:           15,       // max tilt angle (degrees)
    speed:         400,      // transition speed (ms)
    glare:         true,     // enable light glare
    'max-glare':   0.25,     // glare opacity
    scale:         1.04,     // slight zoom on hover
    perspective:   800,      // depth effect
    gyroscope:     false,    // disable phone gyro (can be noisy)
  });
}

/* ══════════════════════════════════════════════════════════════
   10. TUTORIAL COUNT — footer badge on home page
   ══════════════════════════════════════════════════════════════ */
(function updateTutorialCount () {
  const total = Object.values(TUTORIALS)
    .reduce((sum, cat) => sum + cat.tutorials.length, 0);

  const el = document.getElementById('tutorial-count');
  if (el) el.textContent = `${total} MODULES AVAILABLE`;
})();

/* ══════════════════════════════════════════════════════════════
   KICK-OFF — run entrance animations on page load
   ══════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  playHomeEntrance();
});
