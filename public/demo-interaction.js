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
      
      // Trigger reflow for transition
      demoExpanded.offsetHeight;
      
      demoExpanded.style.opacity = '1';
      demoExpanded.style.transform = 'translateY(0)';
      
      // Draw lines after layout is settled
      setTimeout(drawFlowLines, 100);
    }, 500);
  });

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

  function drawFlowLines() {
    svg.innerHTML = ''; // Clear
    const svgRect = svg.getBoundingClientRect();
    
    const sourceCard = document.getElementById('source-price');
    const markets = [1, 2, 3, 4, 5].map(i => document.getElementById(`market-${i}`));
    const opts = [1, 2, 3, 4, 5].map(i => document.getElementById(`opt-${i}`));

    const sRect = sourceCard.getBoundingClientRect();
    const startX = sRect.right - svgRect.left;
    const startY = sRect.top + (sRect.height / 2) - svgRect.top;

    markets.forEach((mCard, i) => {
      const mRect = mCard.getBoundingClientRect();
      const mLeftX = mRect.left - svgRect.left;
      const mRightX = mRect.right - svgRect.left;
      const mY = mRect.top + (mRect.height / 2) - svgRect.top;

      // Line 1: Source to Market
      createLine(startX, startY, mLeftX, mY);

      // Line 2: Market to Optimized
      const oCard = opts[i];
      const oRect = oCard.getBoundingClientRect();
      const oLeftX = oRect.left - svgRect.left;
      const oY = oRect.top + (oRect.height / 2) - svgRect.top;

      createLine(mRightX, mY, oLeftX, oY, true);
    });
  }

  function createLine(x1, y1, x2, y2, isActive = false) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Curved path: Cubic Bezier
    const cp1x = x1 + (x2 - x1) / 2;
    const cp2x = x1 + (x2 - x1) / 2;
    const d = `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;
    
    path.setAttribute('d', d);
    path.setAttribute('class', `flow-line ${isActive ? 'active' : ''}`);
    svg.appendChild(path);
  }

  window.addEventListener('resize', () => {
    if (!demoExpanded.classList.contains('hidden')) {
      drawFlowLines();
    }
  });
});
