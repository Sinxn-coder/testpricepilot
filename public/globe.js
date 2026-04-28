/**
 * PricePilot – Interactive 3D Globe
 * Three.js r134 · No external loaders required
 */
(function () {
  'use strict';

  /* ── wait for DOM + Three.js ─────────────────────────────── */
  function init() {
    if (typeof THREE === 'undefined') { setTimeout(init, 50); return; }

    const canvas = document.getElementById('globe-canvas');
    if (!canvas) return;

    /* ── Renderer ────────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    /* ── Responsive sizing ───────────────────────────────────── */
    function getSize() {
      const w = canvas.parentElement.clientWidth  || 700;
      const h = canvas.parentElement.clientHeight || 500;
      return { w, h };
    }
    function applySize() {
      const { w, h } = getSize();
      renderer.setSize(w, h, false);   // false = don't set CSS size
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    /* ── Camera ──────────────────────────────────────────────── */
    const { w, h } = getSize();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 1000);
    camera.position.set(0, 0, 3.2);

    /* ── Scene & main group ──────────────────────────────────── */
    const scene = new THREE.Scene();
    const globe = new THREE.Group();   // everything rotates with this
    scene.add(globe);

    /* ─────────────────────────────────────────────────────────── *
     *  EARTH SPHERE  (solid mesh + dot overlay)
     * ─────────────────────────────────────────────────────────── */
    const R = 1.0;

    /* --- Base sphere: dark ocean with equatorial glow --------- */
    const earthGeo = new THREE.SphereGeometry(R, 64, 64);

    // Create a canvas-based texture for a stylised Earth
    const texCanvas = document.createElement('canvas');
    texCanvas.width  = 1024;
    texCanvas.height = 512;
    const ctx = texCanvas.getContext('2d');

    // Deep ocean base
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGrad.addColorStop(0,   '#020818');
    oceanGrad.addColorStop(0.5, '#040d24');
    oceanGrad.addColorStop(1,   '#020818');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Function to draw hatching pattern onto the Earth texture
    function fillCountriesWithHatch(data, targetCtx) {
      // Create hatching pattern
      const pSize = 12;
      const pCanvas = document.createElement('canvas');
      pCanvas.width = pSize;
      pCanvas.height = pSize;
      const pCtx = pCanvas.getContext('2d');
      pCtx.strokeStyle = 'rgba(108, 99, 255, 0.25)';
      pCtx.lineWidth = 1.2;
      pCtx.beginPath();
      pCtx.moveTo(0, pSize);
      pCtx.lineTo(pSize, 0);
      pCtx.stroke();
      const pattern = targetCtx.createPattern(pCanvas, 'repeat');

      targetCtx.fillStyle = pattern;
      
      data.features.forEach(feature => {
        if (!feature.geometry) return;
        const type = feature.geometry.type;
        const coords = feature.geometry.coordinates;

        function drawPolygon(ring) {
          targetCtx.beginPath();
          ring.forEach((pt, i) => {
            const x = (pt[0] + 180) / 360 * 1024;
            const y = (90 - pt[1]) / 180 * 512;
            if (i === 0) targetCtx.moveTo(x, y);
            else targetCtx.lineTo(x, y);
          });
          targetCtx.closePath();
          targetCtx.fill();
        }

        if (type === 'Polygon') {
          coords.forEach(drawPolygon);
        } else if (type === 'MultiPolygon') {
          coords.forEach(poly => poly.forEach(drawPolygon));
        }
      });
    }

    // Subtle highlight dots scattered across land (moved inside the filler later or kept as general)
    function addRandomDots(targetCtx) {
      const dotCount = 350;
      for (let i = 0; i < dotCount; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 512;
        const a = 0.2 + Math.random() * 0.4;
        targetCtx.beginPath();
        targetCtx.arc(x, y, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
        targetCtx.fillStyle = `rgba(167, 139, 250, ${a})`;
        targetCtx.fill();
      }
    }

    const earthTex = new THREE.CanvasTexture(texCanvas);

    // --- CUSTOM SHADER FOR DIGITAL LIQUID OCEANS ---
    const earthShader = {
      uniforms: {
        uTime:    { value: 0 },
        uLandTex: { value: earthTex },
        uColorOcean: { value: new THREE.Color(0x0a0c12) },
        uColorGrid:  { value: new THREE.Color(0x6c63ff) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform sampler2D uLandTex;
        uniform vec3 uColorOcean;
        uniform vec3 uColorGrid;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vec4 land = texture2D(uLandTex, vUv);
          
          // Detect land based on hatching color (approximate)
          // The hatching is purple (0.42, 0.38, 1.0) on a dark base
          float isLand = smoothstep(0.1, 0.3, land.a + land.b * 0.5);

          // Create moving grid
          float gridFreq = 80.0;
          float gridShift = uTime * 0.05;
          float gx = abs(sin((vUv.x + gridShift) * gridFreq * 2.0));
          float gy = abs(sin((vUv.y + gridShift) * gridFreq));
          float grid = smoothstep(0.92, 0.98, gx) + smoothstep(0.92, 0.98, gy);
          
          // Subtle scanline
          float scanline = smoothstep(0.8, 1.0, sin(vUv.y * 300.0 - uTime * 2.0));
          
          // Mix colors
          vec3 ocean = mix(uColorOcean, uColorGrid, grid * 0.15 + scanline * 0.08);
          
          // Add rim lighting effect
          float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
          ocean += uColorGrid * pow(rim, 3.0) * 0.4;

          vec3 finalColor = mix(ocean, land.rgb, isLand);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    };

    const earthMat = new THREE.ShaderMaterial({
      uniforms: earthShader.uniforms,
      vertexShader: earthShader.vertexShader,
      fragmentShader: earthShader.fragmentShader,
      transparent: true,
    });

    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globe.add(earthMesh);

    /* --- Dot shell (points cloud on surface) ------------------- */
    function fibonacciSphere(n, r) {
      const pts = [];
      const phi = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < n; i++) {
        const y   = 1 - (i / (n - 1)) * 2;
        const rad = Math.sqrt(1 - y * y);
        const theta = phi * i;
        pts.push(r * rad * Math.cos(theta), r * y, r * rad * Math.sin(theta));
      }
      return pts;
    }

    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(fibonacciSphere(5000, R + 0.003), 3));
    const dotMat = new THREE.PointsMaterial({
      color: 0x8b5cf6,
      size:  0.014,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });
    const dots = new THREE.Points(dotGeo, dotMat);
    globe.add(dots);

    /* ─────────────────────────────────────────────────────────── *
     *  ATMOSPHERE GLOW
     * ─────────────────────────────────────────────────────────── */
    const atm1 = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.09, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x6c63ff, transparent: true, opacity: 0.055, side: THREE.BackSide })
    );
    const atm2 = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.18, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.03, side: THREE.BackSide })
    );
    globe.add(atm1, atm2);

    /* ─────────────────────────────────────────────────────────── *
     *  LAT / LON GRID LINES
     * ─────────────────────────────────────────────────────────── */
    function ll2v(lat, lon, r) {
      const phi   = (90 - lat)  * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
         r * Math.cos(phi),
         r * Math.sin(phi) * Math.sin(theta)
      );
    }

    const gridMat = new THREE.LineBasicMaterial({ color: 0x6c63ff, transparent: true, opacity: 0.13 });

    function addLatLine(lat) {
      const pts = [];
      for (let i = 0; i <= 80; i++) pts.push(ll2v(lat, (i / 80) * 360 - 180, R + 0.002));
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }
    function addLonLine(lon) {
      const pts = [];
      for (let i = 0; i <= 80; i++) pts.push(ll2v((i / 80) * 180 - 90, lon, R + 0.002));
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }

    [-60, -30, 0, 30, 60].forEach(addLatLine);
    [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].forEach(addLonLine);

    /* ─────────────────────────────────────────────────────────── *
     *  CONNECTION ARCS + SPARKS
     * ─────────────────────────────────────────────────────────── */
    const cities = {
      usa:    [37.8,  -122.4],
      europe: [48.85,   2.35],
      uk:     [51.5,   -0.12],
      japan:  [35.68, 139.65],
      india:  [20.59,  78.96],
      brazil: [-14.2, -51.9 ],
      aus:    [-25.3,  133.8],
      canada: [56.1,  -106.3],
    };

    const arcPairs = [
      ['usa',    'europe'],
      ['europe', 'uk'],
      ['uk',     'india'],
      ['india',  'japan'],
      ['japan',  'aus'],
      ['aus',    'brazil'],
      ['brazil', 'usa'],
      ['usa',    'india'],
      ['europe', 'japan'],
      ['canada', 'uk'],
    ];

    function buildArcPoints(latA, lonA, latB, lonB, segs = 64) {
      const vA = ll2v(latA, lonA, R);
      const vB = ll2v(latB, lonB, R);
      const mid = vA.clone().add(vB).multiplyScalar(0.5).normalize().multiplyScalar(R * 1.55);
      const curve = new THREE.QuadraticBezierCurve3(vA, mid, vB);
      return curve.getPoints(segs);
    }

    const arcLineMat = new THREE.LineBasicMaterial({ color: 0x9f7aea, transparent: true, opacity: 0.3 });
    const sparkMat   = new THREE.MeshBasicMaterial({ color: 0xc4b5fd });
    const sparkGeo   = new THREE.SphereGeometry(0.022, 8, 8);

    const arcs = arcPairs.map(([a, b]) => {
      const pts = buildArcPoints(...cities[a], ...cities[b]);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      globe.add(new THREE.Line(lineGeo, arcLineMat));

      const spark = new THREE.Mesh(sparkGeo, sparkMat.clone());
      spark.userData.progress = Math.random();
      spark.userData.pts = pts;
      globe.add(spark);
      return spark;
    });

    /* ─────────────────────────────────────────────────────────── *
     *  CITY MARKER DOTS
     * ─────────────────────────────────────────────────────────── */
    const markerGeo  = new THREE.SphereGeometry(0.026, 10, 10);
    const markerMat  = new THREE.MeshBasicMaterial({ color: 0xa78bfa });
    const ringGeoM   = new THREE.RingGeometry(0.032, 0.044, 20);
    const ringMatM   = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.6, side: THREE.DoubleSide });

    Object.values(cities).forEach(([lat, lon]) => {
      const pos = ll2v(lat, lon, R + 0.005);

      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.copy(pos);
      globe.add(marker);

      const ring = new THREE.Mesh(ringGeoM, ringMatM.clone());
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      globe.add(ring);
    });

    /* ─────────────────────────────────────────────────────────── *
     *  COUNTRY BORDERS
     * ─────────────────────────────────────────────────────────── */
    fetch('/countries.json')
      .then(res => res.json())
      .then(data => {
        // 1. Draw solid borders
        const borderMat = new THREE.LineBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.35 });
        const pts = [];
        data.features.forEach(feature => {
          if (!feature.geometry) return;
          const type = feature.geometry.type;
          const coords = feature.geometry.coordinates;

          function addPolygon(ring) {
            for (let i = 0; i < ring.length - 1; i++) {
               const p1 = ll2v(ring[i][1], ring[i][0], R + 0.004);
               const p2 = ll2v(ring[i+1][1], ring[i+1][0], R + 0.004);
               pts.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            }
          }

          if (type === 'Polygon') {
            coords.forEach(ring => addPolygon(ring));
          } else if (type === 'MultiPolygon') {
            coords.forEach(poly => poly.forEach(ring => addPolygon(ring)));
          }
        });
        const borderGeo = new THREE.BufferGeometry();
        borderGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        globe.add(new THREE.LineSegments(borderGeo, borderMat));

        // 2. Add hatching fill to the texture canvas
        fillCountriesWithHatch(data, ctx);
        addRandomDots(ctx); // Add some dots on top of the texture
        earthTex.needsUpdate = true; // Signal Three.js to re-upload texture
      })
      .catch(err => console.error("Could not load country borders:", err));

    /* ─────────────────────────────────────────────────────────── *
     *  LIGHTING
     * ─────────────────────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const dirLight = new THREE.DirectionalLight(0x9f7aea, 0.4); // Reduced from 1.4 to 0.4
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x6c63ff, 0.6);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    /* ─────────────────────────────────────────────────────────── *
     *  DRAG ROTATION & SCROLL PARALLAX
     * ─────────────────────────────────────────────────────────── */
    let dragging = false;
    let prev = { x: 0, y: 0 };
    let vel  = { x: 0, y: 0 };

    let targetScrollRotY = 0;
    let currentScrollRotY = 0;
    let baseRotationY = 0;

    function onDown(x, y) { dragging = true; prev = { x, y }; vel = { x: 0, y: 0 }; }
    function onMove(x, y) {
      if (!dragging) return;
      vel.y = (x - prev.x) * 0.004;
      vel.x = (y - prev.y) * 0.004;
      globe.rotation.x += vel.x;
      baseRotationY += vel.y;
      prev = { x, y };
    }
    function onUp() { dragging = false; }

    canvas.addEventListener('mousedown',  e => onDown(e.clientX, e.clientY));
    window.addEventListener('mousemove',  e => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup',    onUp);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); onDown(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    canvas.addEventListener('touchmove',  e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    canvas.addEventListener('touchend',   onUp);

    window.addEventListener('scroll', () => {
      // Globe rotation target based on scroll height
      // Reduced multiplier to make the rotation much slower during scroll
      targetScrollRotY = window.scrollY * 0.0005;
    });

    /* ─── Cards 3D Orbit anchors ─── */
    const cardElements = [
      document.getElementById('card-usd'),
      document.getElementById('card-eur'),
      document.getElementById('card-gbp'),
      document.getElementById('card-jpy'),
      document.getElementById('card-inr'),
      document.getElementById('card-aud'),
      document.getElementById('card-cad'),
      document.getElementById('card-brl')
    ];
    const cardAnchors = [];

    // Distribute them uniformly around the globe in 3D
    for (let i = 0; i < cardElements.length; i++) {
      const anchor = new THREE.Object3D();
      const angle = (i / cardElements.length) * Math.PI * 2;
      // Orbit radius is 1.4, with a slight vertical swagger 
      anchor.position.set(
        Math.cos(angle) * 1.35, 
        Math.sin(angle * 2) * 0.35, // Some vertical wobble so they aren't all perfectly flat
        Math.sin(angle) * 1.35
      );
      globe.add(anchor);
      cardAnchors.push(anchor);

      if (cardElements[i]) {
        // Reset legacy inline styles
        cardElements[i].style.margin = "0";
      }
    }

    /* ─────────────────────────────────────────────────────────── *
     *  RESIZE OBSERVER
     * ─────────────────────────────────────────────────────────── */
    applySize();

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(applySize).observe(canvas.parentElement);
    } else {
      window.addEventListener('resize', applySize);
    }

    /* ─────────────────────────────────────────────────────────── *
     *  ANIMATION LOOP
     * ─────────────────────────────────────────────────────────── */
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Update shader time
      if (earthMat.uniforms) {
        earthMat.uniforms.uTime.value = t;
      }

      /* handle smooth scroll rotation + momentum */
      if (!dragging) {
        vel.x *= 0.90;
        vel.y *= 0.90;
        globe.rotation.x += vel.x;
        baseRotationY += vel.y;
      }

      currentScrollRotY += (targetScrollRotY - currentScrollRotY) * 0.06;
      globe.rotation.y = baseRotationY + currentScrollRotY;

      /* pulsing dots */
      dotMat.opacity = 0.55 + Math.sin(t * 0.9) * 0.15;
      dotMat.size    = 0.012 + Math.sin(t * 1.2) * 0.002;

      /* atmosphere flicker */
      atm1.material.opacity = 0.045 + Math.sin(t * 0.5) * 0.012;

      /* move sparks */
      arcs.forEach(spark => {
        spark.userData.progress += 0.004;
        if (spark.userData.progress > 1) spark.userData.progress = 0;
        const pts = spark.userData.pts;
        const idx = Math.floor(spark.userData.progress * (pts.length - 1));
        spark.position.copy(pts[idx]);
      });

      /* pulse ring markers */
      globe.children.forEach(child => {
        if (child.isMesh && child.geometry.type === 'RingGeometry') {
          const s = 1 + Math.sin(t * 2.5 + child.id) * 0.15;
          child.scale.setScalar(s);
          child.material.opacity = 0.4 + Math.sin(t * 2.5 + child.id) * 0.3;
        }
      });

      renderer.render(scene, camera);

      /* Project 3D Anchors to 2D Screen for currency cards */
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const halfW = w / 2;
      const halfH = h / 2;

      cardAnchors.forEach((anchor, i) => {
        const el = cardElements[i];
        if (!el) return;

        // Position
        const pos = new THREE.Vector3();
        anchor.getWorldPosition(pos);
        const zWorld = pos.z; // globe center is at 0,0,0
        
        pos.project(camera);
        
        const x = (pos.x * halfW) + halfW;
        const y = -(pos.y * halfH) + halfH;
        
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;

        // Fixed size and depth-based opacity/blur
        if (zWorld < 0) {
          // Going behind the globe
          el.style.transform = `translate(-50%, -50%)`;
          el.style.opacity = '0.15';
          el.style.zIndex = '5';
          el.style.filter = 'blur(2px)';
        } else {
          // In front of the globe
          el.style.transform = `translate(-50%, -50%)`;
          el.style.opacity = '1';
          el.style.zIndex = '20';
          el.style.filter = 'blur(0px)';
        }
      });
    }

    animate();
  }

  // Start after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
