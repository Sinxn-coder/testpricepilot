document.addEventListener('DOMContentLoaded', () => {
  const btnSeeMore = document.getElementById('btn-see-more');
  const btnBack = document.getElementById('btn-demo-back');
  const demoInitial = document.getElementById('demo-initial');
  const demoExpanded = document.getElementById('demo-expanded');
  const svg = document.getElementById('flow-svg');

  if (!btnSeeMore || !demoInitial || !demoExpanded || !svg) return;

  btnSeeMore.addEventListener('click', () => {
    // Fade out initial
    demoInitial.style.opacity = '0';
    demoInitial.style.transform = 'translateY(-20px)';
    demoInitial.style.transition = 'all 0.5s ease';

    setTimeout(() => {
      demoInitial.classList.add('hidden');
      demoExpanded.classList.remove('hidden');
      
      // Reset expanded state for animation
      demoExpanded.style.opacity = '1';
      demoExpanded.style.transform = 'translateY(0)';
      
      // Start sequenced animation
      runSequencedAnimation();
    }, 500);
  });

  async function runSequencedAnimation() {
    const sourceCard = document.getElementById('source-price');
    const markets = [1, 2, 3, 4, 5].map(i => document.getElementById(`market-${i}`));
    const opts = [1, 2, 3, 4, 5].map(i => document.getElementById(`opt-${i}`));
    const svg = document.getElementById('flow-svg');
    
    // 0. Force final transform state (invisible) to get ACCURATE final positions
    sourceCard.style.opacity = '0';
    sourceCard.style.transform = 'scale(1)';       // final scale
    markets.forEach(m => { m.style.opacity = '0'; m.style.transform = 'translateX(0)'; });   // final pos
    opts.forEach(o    => { o.style.opacity = '0';  o.style.transform = 'translateX(0)'; });   // final pos

    // Wait one frame so the browser recalculates layout with final transforms
    await new Promise(r => requestAnimationFrame(r));

    // Capture positions in their TRUE final positions
    const svgRect = svg.getBoundingClientRect();
    const sRect   = sourceCard.getBoundingClientRect();
    const marketRects = markets.map(m => m.getBoundingClientRect());
    const optRects    = opts.map(o    => o.getBoundingClientRect());

    // Now apply the "entrance" hidden state for animation
    svg.innerHTML = '';
    sourceCard.style.transform = 'scale(0.8)';
    markets.forEach(m => { m.style.transform = 'translateX(-20px)'; });
    opts.forEach(o    => { o.style.transform = 'translateX(-20px)'; });

    // 1. Show Source Card
    await wait(100);
    sourceCard.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
    sourceCard.style.opacity = '1';
    sourceCard.style.transform = 'scale(1)';

    await wait(800);

    // 2. Draw Lines to Markets
    const startX = sRect.right - svgRect.left;
    const startY = sRect.top + (sRect.height / 2) - svgRect.top;

    const firstLines = markets.map((mCard, i) => {
      const mRect = marketRects[i];
      const mLeftX = mRect.left - svgRect.left;
      const mY = mRect.top + (mRect.height / 2) - svgRect.top;
      return createLine(svg, startX, startY, mLeftX, mY, false);
    });

    // Animate lines to markets (Simultaneous start)
    await Promise.all(firstLines.map(line => {
      return new Promise(resolve => {
        setTimeout(() => {
          const length = line.getTotalLength() || 1000;
          line.style.strokeDasharray = length;
          line.style.strokeDashoffset = length;
          
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              line.style.transition = `stroke-dashoffset 1500ms ease-in-out`;
              line.style.strokeDashoffset = '0';
              setTimeout(() => {
                line.classList.add('marching');
                resolve();
              }, 1500);
            });
          });
        }, 10);
      });
    }));

    // 3. Show Market Cards
    markets.forEach((m, i) => {
      setTimeout(() => {
        m.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        m.style.opacity = '1';
        m.style.transform = 'translateX(0)';
      }, i * 50);
    });

    await wait(800);

    // 4. Draw Lines to Optimized
    const secondLines = markets.map((mCard, i) => {
      const mRect = marketRects[i];
      const mRightX = mRect.right - svgRect.left;
      const mY = mRect.top + (mRect.height / 2) - svgRect.top;

      const oRect = optRects[i];
      const oLeftX = oRect.left - svgRect.left;
      const oY = oRect.top + (oRect.height / 2) - svgRect.top;
      
      return createLine(svg, mRightX, mY, oLeftX, oY, true);
    });

    // Animate lines to optimized (Simultaneous start)
    await Promise.all(secondLines.map(line => {
      return new Promise(resolve => {
        setTimeout(() => {
          const length = line.getTotalLength() || 1000;
          line.style.strokeDasharray = length;
          line.style.strokeDashoffset = length;
          
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              line.style.transition = `stroke-dashoffset 1500ms ease-in-out`;
              line.style.strokeDashoffset = '0';
              setTimeout(() => {
                line.classList.add('marching');
                resolve();
              }, 1500);
            });
          });
        }, 10);
      });
    }));

    // 5. Show Optimized Cards
    opts.forEach((o, i) => {
      setTimeout(() => {
        o.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        o.style.opacity = '1';
        o.style.transform = 'translateX(0)';
        
        // Add a success glow pulse
        setTimeout(() => {
          o.style.boxShadow = '0 0 20px var(--green-glow)';
          setTimeout(() => o.style.boxShadow = '', 1000);
        }, 600);
      }, i * 50);
    });
  }

  function createLine(svg, x1, y1, x2, y2, isActive) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const cp1x = x1 + (x2 - x1) / 2;
    const cp2x = x1 + (x2 - x1) / 2;
    const d = `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;
    
    path.setAttribute('d', d);
    path.setAttribute('class', `flow-line ${isActive ? 'active' : ''}`);
    
    // Initial hidden state
    path.style.strokeDasharray = '2000';
    path.style.strokeDashoffset = '2000';
    
    svg.appendChild(path);
    return path;
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  btnBack.addEventListener('click', () => {
    demoExpanded.style.opacity = '0';
    demoExpanded.style.transform = 'translateY(20px)';

    setTimeout(() => {
      demoExpanded.classList.add('hidden');
      demoInitial.classList.remove('hidden');
      
      demoInitial.offsetHeight;
      demoInitial.style.opacity = '1';
      demoInitial.style.transform = 'translateY(0)';
    }, 500);
  });

  // Re-draw on resize if active (simplistic approach for now)
  window.addEventListener('resize', () => {
    if (!demoExpanded.classList.contains('hidden')) {
      runSequencedAnimation();
    }
  });
});
