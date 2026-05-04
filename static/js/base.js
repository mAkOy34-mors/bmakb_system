// Wait for DOM to be fully loaded before running
document.addEventListener('DOMContentLoaded', function() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const sidebarEl = document.getElementById('sidebar');
  const overlayEl = document.getElementById('sidebar-overlay');
  const closeBtn = document.getElementById('sidebar-close-btn');

  function openSidebar() {
    if (sidebarEl) {
      sidebarEl.classList.add('sidebar--open');
      console.log('Sidebar opened'); // Debug
    }
    if (overlayEl) {
      overlayEl.classList.add('sidebar-overlay--visible');
    }
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    if (sidebarEl) {
      sidebarEl.classList.remove('sidebar--open');
    }
    if (overlayEl) {
      overlayEl.classList.remove('sidebar-overlay--visible');
    }
    document.body.style.overflow = '';
  }

  // Add event listeners
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', openSidebar);
    console.log('Hamburger button found and listener added');
  } else {
    console.error('Hamburger button not found!');
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeSidebar);
  }

  if (overlayEl) {
    overlayEl.addEventListener('click', closeSidebar);
  }

  // Close sidebar when a nav link is clicked on mobile
  document.querySelectorAll('.sidebar .nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });
});