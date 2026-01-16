// ===================================
// LiKO RISE - Interactive Features
// ===================================

// Smooth Scroll Navigation
// Smooth Scroll Navigation
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollAnimations();
  initMobileMenu();
  // Draw lines initially (fast load)
  requestAnimationFrame(drawOrgChartLines);
});

// Ensure lines are redrawn after all resources (images/fonts) are loaded
window.addEventListener('load', () => {
  requestAnimationFrame(drawOrgChartLines);
  // Double-check after a short delay for any final layout shifts
  setTimeout(drawOrgChartLines, 500);
});

// Resizing redraws lines
window.addEventListener('resize', debounce(() => {
  requestAnimationFrame(drawOrgChartLines);
}, 100));

// Re-draw when fonts are ready (critical for text flow affecting height)
if (document.fonts) {
  document.fonts.ready.then(() => requestAnimationFrame(drawOrgChartLines));
}

// ===================================
// Organization Chart Lines (SVG)
// ===================================
function drawOrgChartLines() {
  const svg = document.getElementById('org-lines');
  if (!svg) return;

  // Clear existing lines
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }

  // Get nodes by ID
  const nodes = {
    ceo: document.getElementById('node-ceo'),
    coo: document.getElementById('node-coo'),
    external: document.getElementById('node-external'),
    proj: document.getElementById('node-proj'),
    adminGroup: document.getElementById('node-admin-group'),
    admin: document.getElementById('node-admin'),
    inst: document.getElementById('node-inst'),
    sales: document.getElementById('node-sales'),
    acc: document.getElementById('node-acc'),
    gm: document.getElementById('node-gm'),
    members: document.getElementById('node-members')
  };

  // Ensure all nodes exist before trying to draw
  for (const key in nodes) {
    if (!nodes[key]) {
      console.warn(`Node ${key} not found`);
      return;
    }
  }

  // Helper to get connection points relative to SVG
  function getPoints(el) {
    const rect = el.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) return null;

    // Standard points
    const xCenter = (rect.left + rect.right) / 2 - svgRect.left;
    const yTop = rect.top - svgRect.top;
    const yBottom = rect.bottom - svgRect.top;
    const yCenter = (rect.top + rect.bottom) / 2 - svgRect.top;
    const xLeft = rect.left - svgRect.left;
    const xRight = rect.right - svgRect.left;

    return { xCenter, yTop, yBottom, yCenter, xLeft, xRight, rect };
  }

  function createPath(d) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#999');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('fill', 'none');
    return path;
  }

  const p = {};
  for (const key in nodes) {
    const points = getPoints(nodes[key]);
    if (!points) {
      console.warn(`Could not get points for ${key}`);
      return;
    }
    p[key] = points;
  }

  // --- DRAWING LOGIC (matching zu.png) ---

  // 1. CEO -> COO (vertical line down)
  svg.appendChild(createPath(`M ${p.ceo.xCenter} ${p.ceo.yBottom} L ${p.coo.xCenter} ${p.coo.yTop}`));

  // 2. COO -> External (horizontal line to the right)
  svg.appendChild(createPath(`M ${p.coo.xRight} ${p.coo.yCenter} L ${p.external.xLeft} ${p.external.yCenter}`));

  // 3. COO splits to three branches: Projects, Admin Group, Instructors
  const splitY = p.coo.yBottom + 20; // Y position for the horizontal split line

  // Vertical line from COO down to split point
  svg.appendChild(createPath(`M ${p.coo.xCenter} ${p.coo.yBottom} L ${p.coo.xCenter} ${splitY}`));

  // Horizontal split line connecting all three branches
  const leftX = p.proj.xCenter;
  const rightX = p.inst.xCenter;
  svg.appendChild(createPath(`M ${leftX} ${splitY} L ${rightX} ${splitY}`));

  // 4. Lines down to each department
  // Projects
  svg.appendChild(createPath(`M ${p.proj.xCenter} ${splitY} L ${p.proj.xCenter} ${p.proj.yTop}`));

  // Admin Group (to the top of the group box)
  svg.appendChild(createPath(`M ${p.adminGroup.xCenter} ${splitY} L ${p.adminGroup.xCenter} ${p.adminGroup.yTop}`));

  // Instructors
  svg.appendChild(createPath(`M ${p.inst.xCenter} ${splitY} L ${p.inst.xCenter} ${p.inst.yTop}`));

  // 5. Bottom connections to Members
  // The admin sub-items (sales, acc, gm) and instructors all connect to members
  const bottomSplitY = p.adminGroup.yBottom + 20;

  // Lines down from each admin sub-item
  svg.appendChild(createPath(`M ${p.sales.xCenter} ${p.sales.yBottom} L ${p.sales.xCenter} ${bottomSplitY}`));
  svg.appendChild(createPath(`M ${p.acc.xCenter} ${p.acc.yBottom} L ${p.acc.xCenter} ${bottomSplitY}`));
  svg.appendChild(createPath(`M ${p.gm.xCenter} ${p.gm.yBottom} L ${p.gm.xCenter} ${bottomSplitY}`));

  // Line down from instructors
  svg.appendChild(createPath(`M ${p.inst.xCenter} ${p.inst.yBottom} L ${p.inst.xCenter} ${bottomSplitY}`));

  // Horizontal line connecting all bottom branches
  const bottomLeftX = Math.min(p.sales.xCenter, p.acc.xCenter, p.gm.xCenter, p.inst.xCenter);
  const bottomRightX = Math.max(p.sales.xCenter, p.acc.xCenter, p.gm.xCenter, p.inst.xCenter);
  svg.appendChild(createPath(`M ${bottomLeftX} ${bottomSplitY} L ${bottomRightX} ${bottomSplitY}`));

  // Final line down to Members
  svg.appendChild(createPath(`M ${p.members.xCenter} ${bottomSplitY} L ${p.members.xCenter} ${p.members.yTop}`));
}



// ===================================
// Navigation
// ===================================
function initNavigation() {
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-link');

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Smooth scroll to sections
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        const offsetTop = targetSection.offsetTop - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });

        // Close mobile menu if open
        const navMenu = document.querySelector('.nav-menu');
        navMenu.classList.remove('active');
      }
    });
  });
}

// ===================================
// Mobile Menu
// ===================================
function initMobileMenu() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (navToggle) {
    // Handle both click and touchstart for better responsiveness
    const toggleMenu = (e) => {
      // Prevent double-firing if both events trigger
      if (e.type === 'touchstart') e.preventDefault();

      navMenu.classList.toggle('active');
      navToggle.classList.toggle('active');
    };

    navToggle.addEventListener('click', toggleMenu);
    navToggle.addEventListener('touchstart', toggleMenu, { passive: false });

    // Close menu when clicking a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
      });
    });
  }
}

// ===================================
// Scroll Animations
// ===================================
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all cards, mission items, and timeline items
  const animatedElements = document.querySelectorAll(
    '.card, .mission-item, .timeline-item, .contact-container'
  );

  animatedElements.forEach((el, index) => {
    el.style.opacity = '0';
    el.classList.add(`fade-in-delay-${Math.min(index % 4 + 1, 4)}`);
    observer.observe(el);
  });
}

// ===================================
// Utility Functions
// ===================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ===================================
// Image Modal Logic
// ===================================
function openModal(imageSrc) {
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-image');

  if (modal && modalImg) {
    modal.style.display = 'block';
    modalImg.src = imageSrc;
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  }
}

function closeModal() {
  const modal = document.getElementById('image-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
  }
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});
