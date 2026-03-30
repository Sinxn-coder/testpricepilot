lucide.createIcons();

// --- Sticky Header ---
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// --- Mobile Menu Toggle ---
const menuBtn = document.getElementById('menu-btn');
const mobileNav = document.getElementById('mobile-nav');
const body = document.body;

if (menuBtn && mobileNav) {
  menuBtn.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    body.classList.toggle('no-scroll', isOpen);
    
    // Update icon
    const icon = menuBtn.querySelector('i');
    if (isOpen) {
      icon.setAttribute('data-lucide', 'x');
    } else {
      icon.setAttribute('data-lucide', 'menu');
    }
    lucide.createIcons();
  });

  // Close menu on link click
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      body.classList.remove('no-scroll');
      menuBtn.querySelector('i').setAttribute('data-lucide', 'menu');
      lucide.createIcons();
    });
  });
}

// --- Scroll Reveal ---
const observerOptions = {
  threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');

      // If the target contains counting elements, trigger them
      const counters = entry.target.querySelectorAll('.stat-count');
      counters.forEach(counter => {
        if (!counter.getAttribute('data-done')) {
          const target = parseFloat(counter.getAttribute('data-target'));
          animateValue(counter, 0, target, 1500);
          counter.setAttribute('data-done', 'true');
        }
      });
    }
  });
}, observerOptions);

function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = (progress * (end - start) + start).toFixed(2);
    obj.innerHTML = `$${value}`;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
