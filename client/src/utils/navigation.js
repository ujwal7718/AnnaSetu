// Smooth scroll utility for anchor links
export const smoothScroll = (elementId) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};

// Handle navigation based on link type
export const handleNavigation = (href, navigate) => {
  if (href.startsWith('/#')) {
    // Handle hash navigation on current page
    const elementId = href.replace('/#', '');
    smoothScroll(elementId);
  } else if (href.startsWith('#')) {
    // Handle hash navigation
    smoothScroll(href.replace('#', ''));
  } else {
    // Handle route navigation
    navigate(href);
  }
};
