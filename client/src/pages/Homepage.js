import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, MapPin, Users, Package } from 'lucide-react';
import Logo from '../components/Logo';
import { 
  RealTimeMatchingIcon, 
  LocationSearchIcon, 
  VerifiedNGOIcon, 
  EasyDonationIcon,
  FoodDonationIcon,
  CommunityIllustration,
  StatsIllustration,
  VolunteerIllustration,
  SafeImage 
} from '../components/ImageAssets';

const Homepage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isPostHero, setIsPostHero] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [counters, setCounters] = useState({
    meals: 0,
    ngos: 0,
    volunteers: 0
  });

  // Smooth scroll handler
  const handleSmoothScroll = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      // Get hero section height to detect when scrolling past it
      const heroSection = document.getElementById('home');
      const heroHeight = heroSection ? heroSection.offsetHeight : 800;
      const currentScrollY = window.scrollY;
      
      // Check if we've scrolled past the hero section (with 100px buffer)
      const isPastHero = currentScrollY > heroHeight - 100;
      setIsPostHero(isPastHero);
      setScrolled(currentScrollY > 50);

      // Update active section based on scroll position
      const sections = [
        { id: 'home', offset: 0 },
        { id: 'about', offset: document.getElementById('about')?.offsetTop || 0 },
        { id: 'how-it-works', offset: document.getElementById('how-it-works')?.offsetTop || 0 },
        { id: 'contact', offset: document.getElementById('contact')?.offsetTop || 0 }
      ];

      const scrollPosition = window.scrollY + 150;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        if (scrollPosition >= sections[i].offset) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const targetCounters = { meals: 15420, ngos: 156, volunteers: 892 };
    const duration = 2000;
    const steps = 60;
    const increment = {
      meals: targetCounters.meals / steps,
      ngos: targetCounters.ngos / steps,
      volunteers: targetCounters.volunteers / steps
    };

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setCounters({
        meals: Math.floor(increment.meals * currentStep),
        ngos: Math.floor(increment.ngos * currentStep),
        volunteers: Math.floor(increment.volunteers * currentStep)
      });
      if (currentStep >= steps) {
        clearInterval(interval);
        setCounters(targetCounters);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Real-Time Matching",
      description: "Instantly connect with nearby NGOs and volunteers who need your food donations.",
      image: <RealTimeMatchingIcon className="w-full h-full" />
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: "Location-Based Search",
      description: "Find donations and NGOs in your area with smart location matching.",
      image: <LocationSearchIcon className="w-full h-full" />
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "Verified NGOs",
      description: "All partner organizations are verified to ensure your donations reach the right hands.",
      image: <VerifiedNGOIcon className="w-full h-full" />
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      title: "Easy Donation Process",
      description: "List your food donations in minutes with our simple and intuitive interface.",
      image: <EasyDonationIcon className="w-full h-full" />
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Register",
      description: "Create your account as a donor, NGO, or volunteer",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    },
    {
      step: "2", 
      title: "Add Donation",
      description: "List your available food with details and pickup time",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    {
      step: "3",
      title: "Get Matched",
      description: "NGOs or volunteers claim and pick up your donation",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Restaurant Owner",
      content: "ANNASETU helped us reduce food waste by 60% while feeding hundreds of people in need. It's a win-win!",
      avatar: "👩‍🍳"
    },
    {
      name: "Bastu Rege",
      role: "NGO Founder",
      content: "The real-time matching feature has revolutionized how we collect food donations. We can now help more families efficiently.",
      avatar: "👨‍💼"
    },
    {
      name: "Anita Patel",
      role: "Volunteer",
      content: "As a volunteer, I love how easy it is to find and pick up donations. The app makes helping others so simple!",
      avatar: "👩‍🌾"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Premium Navbar with Advanced Glassmorphism & Scroll-Based Theme Switching */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isPostHero
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50' 
          : scrolled 
            ? 'bg-white/15 backdrop-blur-3xl shadow-2xl border-b border-white/20' 
            : 'bg-white/8 backdrop-blur-2xl border-b border-white/15'
      }`} style={{
        boxShadow: isPostHero ? '0 8px 30px rgba(0,0,0,0.08)' : undefined
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 py-3">
            {/* Enhanced Logo Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center group"
            >
              <Link to="/" className="flex items-center group cursor-pointer">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="relative"
                >
                  <Logo size="large" />
                </motion.div>
                <div className="ml-4">
                  <motion.span 
                    className={`text-2xl font-bold transition-all duration-300 ${
                      isPostHero
                        ? 'bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'
                        : 'bg-gradient-to-r from-blue-600 via-blue-700 to-green-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:to-green-500'
                    }`}
                  >
                    ANNASETU
                  </motion.span>
                  <motion.div 
                    initial={{ opacity: 0.6 }}
                    whileHover={{ opacity: 1 }}
                    className={`text-xs font-semibold tracking-widest transition-all duration-300 ${
                      isPostHero
                        ? 'bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent'
                        : 'bg-gradient-to-r from-blue-500/80 to-green-500/80 bg-clip-text text-transparent'
                    }`}
                  >
                    CONNECT • NOURISH • SUSTAIN
                  </motion.div>
                </div>
              </Link>
            </motion.div>

            {/* Desktop Navigation - Glassmorphic Container */}
            <div className="hidden lg:flex items-center gap-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`relative rounded-full px-3 py-2 border transition-all duration-300 shadow-xl ${
                  isPostHero
                    ? 'bg-white/50 backdrop-blur-md border-gray-200 hover:border-gray-300'
                    : 'bg-white/10 backdrop-blur-xl border-white/20 hover:border-white/30'
                }`}
              >
                {/* Navigation Links Inside Glass Container */}
                <div className="flex items-center gap-1">
                  {[
                    { name: 'Home', id: 'home', isScroll: true },
                    { name: 'About', id: 'about', isScroll: true },
                    { name: 'How It Works', id: 'how-it-works', isScroll: true },
                    { name: 'NGOs', href: '/ngos', isRoute: true },
                    { name: 'Contact', id: 'contact', isScroll: true }
                  ].map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 + index * 0.05 }}
                      className="relative group/nav"
                    >
                      {item.isRoute ? (
                        <Link
                          to={item.href}
                          className={`relative px-3 py-2.5 text-sm font-bold transition-all duration-300 rounded-lg ${
                            isPostHero
                              ? activeSection === item.name.toLowerCase()
                                ? 'text-gray-900 bg-gray-100'
                                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                              : activeSection === item.name.toLowerCase()
                                ? 'text-white bg-white/20 shadow-lg shadow-blue-500/50' 
                                : 'text-white/90 hover:text-white hover:bg-white/10 hover:shadow-md hover:shadow-blue-400/50'
                          }`}
                        >
                          {item.name}
                          <motion.span 
                            className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-5 h-0.5 rounded-full transition-all duration-300 ${
                              isPostHero
                                ? `bg-gradient-to-r from-gray-900 to-gray-600 ${
                                    activeSection === item.name.toLowerCase() ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0 group-hover/nav:scale-x-100 group-hover/nav:opacity-100'
                                  }`
                                : `bg-gradient-to-r from-blue-400 to-green-400 ${
                                    activeSection === item.name.toLowerCase() ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0 group-hover/nav:scale-x-100 group-hover/nav:opacity-100'
                                  }`
                            }`}
                          ></motion.span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleSmoothScroll(item.id)}
                          className={`relative px-3 py-2.5 text-sm font-bold transition-all duration-300 rounded-lg ${
                            isPostHero
                              ? activeSection === item.id
                                ? 'text-gray-900 bg-gray-100'
                                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                              : activeSection === item.id
                                ? 'text-white bg-white/20 shadow-lg shadow-blue-500/50' 
                                : 'text-white/90 hover:text-white hover:bg-white/10 hover:shadow-md hover:shadow-blue-400/50'
                          }`}
                        >
                          {item.name}
                          <motion.span 
                            className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-5 h-0.5 rounded-full transition-all duration-300 ${
                              isPostHero
                                ? `bg-gradient-to-r from-gray-900 to-gray-600 ${
                                    activeSection === item.id ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0 group-hover/nav:scale-x-100 group-hover/nav:opacity-100'
                                  }`
                                : `bg-gradient-to-r from-blue-400 to-green-400 ${
                                    activeSection === item.id ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0 group-hover/nav:scale-x-100 group-hover/nav:opacity-100'
                                  }`
                            }`}
                          ></motion.span>
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Glass Container Shine Effect */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 0.3 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-0 pointer-events-none"
                ></motion.div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center gap-3 ml-4"
              >
                {/* Login Button - Glassmorphic */}
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.08, y: -3 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className={`px-6 py-2.5 text-sm font-bold transition-all duration-300 rounded-lg ${
                      isPostHero
                        ? 'text-gray-900 bg-gray-100/80 backdrop-blur-md border border-gray-200 hover:bg-gray-200 shadow-sm hover:shadow-md'
                        : 'text-white/90 hover:text-white bg-white/30 backdrop-blur-xl border border-white/40 hover:bg-white/40 hover:border-white/60 shadow-lg hover:shadow-xl hover:shadow-blue-400/50'
                    }`}
                  >
                    Login
                  </motion.button>
                </Link>

                {/* Sign Up Button - Gradient */}
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.08, y: -3 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className={`px-6 py-2.5 text-sm font-bold text-white rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 border ${
                      isPostHero
                        ? 'bg-gradient-to-r from-blue-600 to-green-600 border-blue-600 hover:from-blue-700 hover:to-green-700'
                        : 'bg-gradient-to-r from-blue-600 via-blue-600 to-green-600 border-white/30 hover:from-blue-500 hover:to-green-500'
                    }`}
                  >
                    Sign Up
                  </motion.button>
                </Link>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`lg:hidden p-2.5 rounded-lg backdrop-blur-xl border transition-all duration-300 shadow-lg ${
                isPostHero
                  ? 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-900 hover:shadow-md'
                  : 'bg-white/20 hover:bg-white/30 border-white/20 text-white hover:shadow-blue-400/50'
              }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </motion.button>
          </div>

          {/* Premium Mobile Menu with Glassmorphism */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -30, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, y: 0, backdropFilter: "blur(20px)" }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className={`lg:hidden py-6 rounded-b-2xl transition-all duration-300 ${
                isPostHero
                  ? 'bg-white/98 backdrop-blur-md border-t border-gray-200 shadow-md'
                  : 'bg-white/15 backdrop-blur-3xl border-t border-white/20 shadow-2xl'
              }`}
            >
              <div className="flex flex-col space-y-2 px-2">
                {/* Mobile Navigation Links */}
                {[
                  { name: 'Home', id: 'home', isScroll: true },
                  { name: 'About', id: 'about', isScroll: true },
                  { name: 'How It Works', id: 'how-it-works', isScroll: true },
                  { name: 'NGOs', href: '/ngos', isRoute: true },
                  { name: 'Contact', id: 'contact', isScroll: true }
                ].map((item) => (
                  item.isRoute ? (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`px-4 py-3 text-base font-bold rounded-lg transition-all duration-300 ${
                        isPostHero
                          ? activeSection === item.name.toLowerCase()
                            ? 'text-gray-900 bg-gray-100 shadow-sm'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          : activeSection === item.name.toLowerCase()
                            ? 'text-white bg-white/20 shadow-md shadow-blue-400/50'
                            : 'text-white/90 hover:text-white hover:bg-white/10 hover:shadow-md hover:shadow-blue-400/50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <button
                      key={item.name}
                      onClick={() => {
                        handleSmoothScroll(item.id);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-base font-bold rounded-lg transition-all duration-300 ${
                        isPostHero
                          ? activeSection === item.id
                            ? 'text-gray-900 bg-gray-100 shadow-sm'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          : activeSection === item.id
                            ? 'text-white bg-white/20 shadow-md shadow-blue-400/50'
                            : 'text-white/90 hover:text-white hover:bg-white/10 hover:shadow-md hover:shadow-blue-400/50'
                      }`}
                    >
                      {item.name}
                    </button>
                  )
                ))}
                
                {/* Mobile Action Buttons */}
                <div className={`pt-4 space-y-3 border-t transition-all duration-300 ${
                  isPostHero ? 'border-gray-200' : 'border-white/20'
                }`}>
                  <Link to="/login" className="w-full" onClick={() => setIsMenuOpen(false)}>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full px-5 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${
                        isPostHero
                          ? 'text-gray-900 bg-gray-100/80 backdrop-blur-md border border-gray-200 hover:bg-gray-200 shadow-sm'
                          : 'text-white bg-white/30 backdrop-blur-xl border border-white/40 hover:bg-white/40 shadow-lg'
                      }`}
                    >
                      Login
                    </motion.button>
                  </Link>
                  <Link to="/register" className="w-full" onClick={() => setIsMenuOpen(false)}>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-green-600 rounded-lg hover:shadow-lg transition-all duration-300 shadow-md"
                    >
                      Sign Up
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section - Premium Blue Gradient with Glassmorphism */}
      <section id="home" className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Original Blue Gradient Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-blue-800/90 to-green-900/95"></div>
          <SafeImage 
            src="https://images.unsplash.com/photo-1598218892720-5d916c9eb6f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            alt="Food donation and volunteering"
            className="w-full h-full object-cover opacity-40"
            fallback={<div className="w-full h-full bg-gradient-to-br from-blue-600 to-green-600"></div>}
          />
        </div>

        {/* Premium Animated Background Patterns with Glassmorphism Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Enhanced Parallax Blobs */}
          <motion.div
            animate={{
              y: [0, -40, 0],
              x: [0, 20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-cyan-400/20 rounded-full opacity-50 blur-3xl backdrop-blur-sm border border-white/10"
          />
          <motion.div
            animate={{
              y: [0, 35, 0],
              x: [0, -25, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-br from-green-400/20 to-emerald-500/15 rounded-full opacity-40 blur-3xl backdrop-blur-sm border border-white/10"
          />
          <motion.div
            animate={{
              y: [0, -30, 0],
              x: [0, 18, 0],
              scale: [1, 1.12, 1],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute bottom-10 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-400/25 to-blue-500/15 rounded-full opacity-45 blur-3xl backdrop-blur-sm border border-white/10"
          />
          <motion.div
            animate={{
              y: [0, 40, 0],
              x: [0, -20, 0],
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5
            }}
            className="absolute -bottom-20 right-1/4 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-blue-500/10 rounded-full opacity-35 blur-3xl backdrop-blur-sm border border-white/10"
          />

          {/* Subtle Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-white/5"></div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-flex items-center bg-white/10 backdrop-blur-md rounded-full px-4 py-2.5 mb-8 border border-white/30 shadow-xl hover:bg-white/15 transition-all duration-300"
              >
                <motion.span 
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.8, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-green-400 w-2.5 h-2.5 rounded-full mr-3 shadow-lg shadow-green-400/50"
                ></motion.span>
                <span className="text-white text-sm font-bold tracking-wide">🌍 Reducing Food Waste, Fighting Hunger</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight drop-shadow-lg"
              >
                <span className="bg-gradient-to-r from-white via-blue-100 to-green-200 bg-clip-text text-transparent drop-shadow-md">Connecting Food Donors</span>
                <br />
                <span className="bg-gradient-to-r from-green-200 to-cyan-200 bg-clip-text text-transparent drop-shadow-md">with NGOs in Real-Time</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl text-white/90 mb-10 max-w-2xl leading-relaxed font-medium drop-shadow-md"
              >
                Reduce food waste while <span className="font-bold text-white drop-shadow-sm">feeding those in need</span>. Join thousands of donors, NGOs, and volunteers making a <span className="text-green-200 font-bold drop-shadow-sm">meaningful difference</span> in their communities.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
              >
                <Link to="/register">
                  <motion.div
                    whileHover={{ scale: 1.08, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm border border-white/50">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Donate Now
                    </div>
                  </motion.div>
                </Link>
                <Link to="/register">
                  <motion.div
                    whileHover={{ scale: 1.08, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div className="bg-white/10 backdrop-blur-md border-2 border-white/40 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/20 hover:border-white/60 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-xl">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Join as Volunteer
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
              
              {/* Enhanced Trust Text with Animated Icons */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-8 text-sm text-white/90 font-semibold"
              >
                <motion.div 
                  whileHover={{ scale: 1.08, y: -2 }}
                  className="flex items-center bg-white/10 backdrop-blur-md px-4 py-3 rounded-lg border border-white/30 shadow-lg hover:bg-white/15 transition-all"
                >
                  <motion.svg 
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-5 h-5 mr-2 text-green-300" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </motion.svg>
                  <span><strong className="text-white">100+</strong> trusted NGOs</span>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.08, y: -2 }}
                  className="flex items-center bg-white/10 backdrop-blur-md px-4 py-3 rounded-lg border border-white/30 shadow-lg hover:bg-white/15 transition-all"
                >
                  <motion.svg 
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    className="w-5 h-5 mr-2 text-blue-200" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </motion.svg>
                  <span><strong className="text-white">15,000+</strong> meals donated</span>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right Content - Premium UI Preview with Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              {/* Main Glassmorphic Card */}
              <motion.div
                animate={{
                  y: [0, -15, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative z-10"
              >
                <div className="bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/30 hover:border-white/50 transition-all duration-300">
                  {/* Mock Donation Card Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Logo size="small" className="bg-transparent" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Active Donation</h3>
                        <p className="text-sm text-gray-600">Just posted • 2 min ago</p>
                      </div>
                    </div>
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="px-4 py-2 bg-gradient-to-r from-green-400/30 to-emerald-400/20 text-green-700 rounded-full text-sm font-bold border border-green-300/50 shadow-sm"
                    >
                      🟢 Available
                    </motion.div>
                  </div>

                  {/* Mock Donation Content */}
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-3xl">🍝</span>
                        <span className="font-bold text-gray-900 text-lg">Pasta & Fresh Salad</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 font-medium">
                        <span>📦 15 servings</span>
                        <span>⏱️ Expires: 6 hours</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-5">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-gray-700">📍 Pickup Location</span>
                        <span className="text-sm font-semibold text-blue-600">Downtown Area</span>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50/60 to-green-50/60 backdrop-blur-sm rounded-lg p-4 border border-blue-200/50">
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-800">123 Main Street, City Center</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-5 border-t border-gray-200">
                      <div className="flex -space-x-3">
                        <motion.div 
                          whileHover={{ scale: 1.2, zIndex: 10 }}
                          className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white border-3 border-white shadow-lg cursor-pointer"
                        >NG</motion.div>
                        <motion.div 
                          whileHover={{ scale: 1.2, zIndex: 10 }}
                          className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-xs font-bold text-white border-3 border-white shadow-lg cursor-pointer"
                        >V</motion.div>
                        <motion.div 
                          whileHover={{ scale: 1.2, zIndex: 10 }}
                          className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-xs font-bold text-white border-3 border-white shadow-lg cursor-pointer"
                        >+3</motion.div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg text-sm font-bold hover:shadow-xl transition-all duration-300 shadow-lg"
                      >
                        Claim Donation
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Floating Stats Cards with Glassmorphism */}
              <motion.div
                animate={{
                  y: [0, -20, 0],
                  x: [0, 8, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
                className="absolute -bottom-8 -left-8 bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-5 z-20 hover:shadow-3xl transition-all duration-300 border border-white/40"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">15,420+</p>
                    <p className="text-sm text-gray-700 font-semibold">Meals Donated</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{
                  y: [0, -18, 0],
                  x: [0, -10, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute -top-8 -right-8 bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-5 z-20 hover:shadow-3xl transition-all duration-300 border border-white/40"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🤝</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">156+</p>
                    <p className="text-sm text-gray-700 font-semibold">NGOs Connected</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{
                  y: [0, -12, 0],
                  x: [0, 8, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5
                }}
                className="absolute top-1/3 -left-12 bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-xl rounded-xl shadow-2xl p-4 z-20 hover:shadow-3xl transition-all duration-300 border border-white/40"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-xl">⚡</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Real-time</p>
                    <p className="text-xs text-gray-700 font-semibold">Matching</p>
                  </div>
                </div>
              </motion.div>

              {/* Glow Effect Background */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/10 via-green-600/10 to-cyan-600/10 rounded-3xl blur-2xl -z-10"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Premium Features Section with Glassmorphism */}
      <section id="about" className="py-32 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        {/* Gradient Section Separator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-green-600 to-cyan-600"></div>
        
        <div className="absolute inset-0">
          <motion.div
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-200 to-blue-100 rounded-full opacity-20 blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, 25, 0],
              x: [0, -25, 0],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="absolute -bottom-32 left-20 w-80 h-80 bg-gradient-to-br from-green-200 to-emerald-100 rounded-full opacity-20 blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-24"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center bg-gradient-to-r from-blue-100 to-green-100 rounded-full px-4 py-2.5 mb-8 border border-blue-200/50 shadow-sm"
            >
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-blue-500 w-2 h-2 rounded-full mr-3"
              ></motion.span>
              <span className="text-gray-700 text-sm font-semibold">Why Choose ANNASETU</span>
            </motion.div>
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              Powerful Features
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">That Make a Difference</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
              Our platform makes food donation simple, efficient, and impactful for everyone involved.
            </p>
          </motion.div>

          {/* Premium Glassmorphic Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.12 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group h-full"
              >
                <motion.div
                  className="relative h-full bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-white/40 hover:border-white/60 overflow-hidden"
                  whileHover={{ boxShadow: "0 20px 40px rgba(59, 130, 246, 0.15)" }}
                >
                  {/* Gradient Border Accent on Hover */}
                  <motion.div 
                    initial={{ opacity: 0, scaleX: 0 }}
                    whileHover={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-green-600 to-cyan-600"
                  ></motion.div>

                  {/* Icon Section with Enhanced Animation */}
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="mb-8"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600/20 to-green-600/20 rounded-2xl flex items-center justify-center text-blue-600 mb-6 mx-auto group-hover:from-blue-600/30 group-hover:to-green-600/30 transition-all duration-300 shadow-lg">
                      {feature.icon}
                    </div>
                  </motion.div>
                  
                  {/* Content */}
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-green-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-sm font-medium">
                      {feature.description}
                    </p>
                  </div>

                  {/* Shimmer Effect on Hover */}
                  <motion.div
                    initial={{ opacity: 0, x: -100 }}
                    whileHover={{ opacity: 0.5, x: 100 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                  ></motion.div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium How It Works Section with Timeline */}
      <section id="how-it-works" className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-blue-50/30 to-green-50/30 relative overflow-hidden">
        {/* Gradient Section Separator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 via-blue-600 to-cyan-600"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              y: [0, -25, 0],
              x: [0, -15, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-40 -right-32 w-72 h-72 bg-gradient-to-br from-cyan-300 to-blue-200 rounded-full opacity-20 blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, 20, 0],
              x: [0, 18, 0],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.7
            }}
            className="absolute -top-20 -left-40 w-96 h-96 bg-gradient-to-br from-blue-300 to-green-200 rounded-full opacity-15 blur-3xl"
          />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-24"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center bg-gradient-to-r from-green-100 to-blue-100 rounded-full px-4 py-2.5 mb-8 border border-green-200/50 shadow-sm"
            >
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-green-500 w-2 h-2 rounded-full mr-3"
              ></motion.span>
              <span className="text-gray-700 text-sm font-semibold">Simple 3-Step Process</span>
            </motion.div>
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
              Start making a difference in just three simple steps. From registration to impact.
            </p>
          </motion.div>

          {/* Premium Timeline Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {/* Animated Connecting Line */}
            <div className="hidden md:block absolute top-32 left-1/4 right-1/4 h-1 bg-gradient-to-r from-blue-600 via-green-600 to-cyan-600">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-blue-600 via-green-600 to-cyan-600"
              />
            </div>

            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{ y: -8 }}
                className="group relative text-center"
              >
                {/* Premium Step Card */}
                <motion.div
                  className="relative z-10 bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl rounded-2xl p-8 border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-300"
                  whileHover={{ boxShadow: "0 20px 40px rgba(59, 130, 246, 0.15)" }}
                >
                  {/* Animated Icon Circle with Gradient */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="relative mb-8"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {step.icon}
                      </motion.div>
                    </div>
                    
                    {/* Step Number Badge with Pulse */}
                    <motion.div 
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                      className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg"
                    >
                      {step.step}
                    </motion.div>
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-green-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed font-medium">
                    {step.description}
                  </p>

                  {/* Shimmer Effect */}
                  <motion.div
                    initial={{ opacity: 0, x: -100 }}
                    whileHover={{ opacity: 0.5, x: 100 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent rounded-2xl"
                  ></motion.div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mt-16"
          >
            <p className="text-gray-600 text-lg mb-6 font-medium">Ready to start?</p>
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Get Started Now
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Premium Impact Statistics Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 relative overflow-hidden">
        {/* Gradient Section Separator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-600 via-green-600 to-blue-600"></div>
        
        {/* Animated Background Blobs */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-0 left-10 w-96 h-96 bg-gradient-to-br from-orange-300 to-orange-200 rounded-full opacity-30 blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, 25, 0],
              x: [0, -25, 0],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.7
            }}
            className="absolute -bottom-40 right-20 w-80 h-80 bg-gradient-to-br from-red-300 to-pink-200 rounded-full opacity-25 blur-3xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-24"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center bg-gradient-to-r from-orange-100 to-red-100 rounded-full px-4 py-2.5 mb-8 border border-orange-200/50 shadow-sm"
            >
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-orange-500 w-2 h-2 rounded-full mr-3"
              ></motion.span>
              <span className="text-gray-700 text-sm font-semibold">Making a Difference</span>
            </motion.div>
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8">
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">From Kitchen to Community</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
              See how your food donations are making a real impact in communities across the country
            </p>
          </motion.div>

          {/* Premium Statistics Cards with Glassmorphism */}
          <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { number: counters.meals, label: "Meals Donated", color: "from-orange-500 to-red-500", icon: <Package className="w-6 h-6" />, symbol: "🍽️", suffix: "+" },
                { number: counters.ngos, label: "NGOs Connected", color: "from-blue-500 to-cyan-500", icon: <MapPin className="w-6 h-6" />, symbol: "🤝", suffix: "+" },
                { number: counters.volunteers, label: "Active Volunteers", color: "from-green-500 to-emerald-500", icon: <Users className="w-6 h-6" />, symbol: "💪", suffix: "+" },
                { number: "24", label: "Real-time Matching", color: "from-purple-500 to-pink-500", icon: <Zap className="w-6 h-6" />, symbol: "⚡", suffix: "/7" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group text-center relative"
                >
                  {/* Icon Container */}
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className={`w-18 h-18 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300`}
                  >
                    <span className="text-3xl">{stat.symbol}</span>
                  </motion.div>
                  
                  {/* Animated Counter */}
                  <div className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                    {stat.number.toLocaleString()}{stat.suffix}
                  </div>
                  
                  {/* Label */}
                  <div className="text-gray-700 font-bold text-lg mb-1">{stat.label}</div>
                  <div className="text-gray-600 text-sm font-medium">Making a real difference</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Food Images Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { Component: FoodDonationIcon, title: "Fresh Meals" },
              { Component: CommunityIllustration, title: "Community Support" },
              { Component: StatsIllustration, title: "Real Impact" },
              { Component: VolunteerIllustration, title: "24/7 Help" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.12 }}
                whileHover={{ scale: 1.08, y: -8 }}
                className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="h-64">
                  <item.Component className="w-full h-full" />
                </div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                ></motion.div>
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileHover={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-0 left-0 right-0 p-6"
                >
                  <div className="text-center">
                    <h3 className="text-white font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-white/90 text-sm">Making a difference</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Impact Summary Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        {/* Gradient Section Separator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-green-600 to-cyan-600"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              y: [0, -25, 0],
              x: [0, 20, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 -right-32 w-80 h-80 bg-gradient-to-br from-green-200 to-green-100 rounded-full opacity-30 blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, 20, 0],
              x: [0, -20, 0],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.7
            }}
            className="absolute -bottom-32 left-10 w-72 h-72 bg-gradient-to-br from-blue-200 to-blue-100 rounded-full opacity-25 blur-3xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-24"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center bg-gradient-to-r from-green-100 to-blue-100 rounded-full px-4 py-2.5 mb-8 border border-green-200/50 shadow-sm"
            >
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-green-500 w-2 h-2 rounded-full mr-3"
              ></motion.span>
              <span className="text-gray-700 text-sm font-semibold">Our Impact So Far</span>
            </motion.div>
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8">
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Making a Real Difference</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
              Together, we're making a real difference in communities across the country
            </p>
          </motion.div>

          {/* Premium Impact Cards with Glassmorphism */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 40 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <motion.div
                className="relative bg-gradient-to-br from-green-100/70 to-green-50/40 backdrop-blur-xl rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 border border-green-200/50 h-full"
                whileHover={{ boxShadow: "0 20px 40px rgba(34, 197, 94, 0.15)" }}
              >
                <motion.div
                  whileHover={{ scale: 1.15, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300"
                >
                  <Package className="w-10 h-10 text-white" />
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4"
                >
                  {counters.meals.toLocaleString()}+
                </motion.div>
                <p className="text-xl text-gray-800 font-bold mb-2">Meals Donated</p>
                <p className="text-gray-700 font-medium">Feeding families in need</p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 40 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <motion.div
                className="relative bg-gradient-to-br from-blue-100/70 to-blue-50/40 backdrop-blur-xl rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 border border-blue-200/50 h-full"
                whileHover={{ boxShadow: "0 20px 40px rgba(59, 130, 246, 0.15)" }}
              >
                <motion.div
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300"
                >
                  <MapPin className="w-10 h-10 text-white" />
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4"
                >
                  {counters.ngos}+
                </motion.div>
                <p className="text-xl text-gray-800 font-bold mb-2">NGOs Connected</p>
                <p className="text-gray-700 font-medium">Partner organizations</p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 40 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <motion.div
                className="relative bg-gradient-to-br from-purple-100/70 to-purple-50/40 backdrop-blur-xl rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 border border-purple-200/50 h-full"
                whileHover={{ boxShadow: "0 20px 40px rgba(168, 85, 247, 0.15)" }}
              >
                <motion.div
                  whileHover={{ scale: 1.15, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300"
                >
                  <Users className="w-10 h-10 text-white" />
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4"
                >
                  {counters.volunteers}+
                </motion.div>
                <p className="text-xl text-gray-800 font-bold mb-2">Active Volunteers</p>
                <p className="text-gray-700 font-medium">Dedicated helpers</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Premium Testimonials Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 relative overflow-hidden">
        {/* Gradient Section Separator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-600 via-blue-600 to-green-600"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-blue-300 to-blue-200 rounded-full opacity-20 blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, 25, 0],
              x: [0, -25, 0],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.7
            }}
            className="absolute -bottom-32 right-10 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-200 rounded-full opacity-20 blur-3xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-24"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-4 py-2.5 mb-8 border border-blue-200/50 shadow-sm"
            >
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-blue-500 w-2 h-2 rounded-full mr-3"
              ></motion.span>
              <span className="text-gray-700 text-sm font-semibold">Success Stories</span>
            </motion.div>
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">What Our Users Say</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
              Real stories from people making a difference with ANNASETU
            </p>
          </motion.div>

          {/* Premium Testimonial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group h-full"
              >
                <motion.div
                  className="relative h-full bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-white/50 hover:border-white/70"
                  whileHover={{ boxShadow: "0 20px 40px rgba(59, 130, 246, 0.15)" }}
                >
                  {/* Gradient Border Accent */}
                  <motion.div 
                    initial={{ opacity: 0, scaleX: 0 }}
                    whileHover={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
                  ></motion.div>

                  <div className="pb-6 flex items-center gap-4 border-b border-gray-200/50">
                    {/* Avatar */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="text-5xl"
                    >
                      {testimonial.avatar}
                    </motion.div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{testimonial.name}</h4>
                      <p className="text-gray-600 text-sm font-medium">{testimonial.role}</p>
                    </div>
                  </div>

                  {/* Testimonial Content */}
                  <div className="flex-grow pt-6">
                    <motion.p 
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.15 + 0.2 }}
                      className="text-gray-700 italic leading-relaxed mb-6 font-medium text-lg"
                    >
                      "{testimonial.content}"
                    </motion.p>
                    
                    {/* Rating Stars with Animation */}
                    <div className="flex gap-1 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <motion.svg 
                          key={i}
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                          className="w-5 h-5 text-yellow-400 fill-current" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </motion.svg>
                      ))}
                    </div>
                    
                    {/* Verified Badge */}
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200/50"
                    >
                      <motion.svg 
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-4 h-4 text-green-600" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </motion.svg>
                      <span className="text-sm font-bold text-gray-700">Verified User</span>
                    </motion.div>
                  </div>

                  {/* Shimmer Effect */}
                  <motion.div
                    initial={{ opacity: 0, x: -100 }}
                    whileHover={{ opacity: 0.5, x: 100 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent rounded-2xl"
                  ></motion.div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium CTA Section with Glassmorphism */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Gradient Section Separator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600"></div>
        
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-green-600 to-purple-600"></div>
        
        {/* Animated Blobs Overlay */}
        <motion.div
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"
        />
        <motion.div
          animate={{
            y: [0, 25, 0],
            x: [0, -20, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute -bottom-20 right-10 w-56 h-56 bg-white/10 rounded-full blur-2xl"
        />

        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-2xl rounded-3xl p-12 md:p-16 text-center text-white border border-white/30 shadow-2xl hover:border-white/50 transition-all duration-300"
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-28 h-28 bg-gradient-to-r from-white/30 to-blue-200/30 rounded-full flex items-center justify-center text-6xl mx-auto mb-8 shadow-xl backdrop-blur-sm border border-white/20"
            >
              🌍
            </motion.div>
            
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              Start Making a<br />
              <span className="bg-gradient-to-r from-white via-blue-100 to-green-100 bg-clip-text text-transparent">Difference Today</span>
            </h2>
            
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl mb-10 text-white/95 leading-relaxed font-medium max-w-2xl mx-auto"
            >
              Join our community of donors, NGOs, and volunteers making a real impact.
              <br />
              Every donation counts, every meal matters, every life touched.
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-10"
            >
              <Link to="/register">
                <motion.div
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="bg-white text-blue-600 px-10 py-4 rounded-xl text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    Get Started Now
                  </div>
                </motion.div>
              </Link>
              <Link to="/login">
                <motion.div
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="bg-white/20 backdrop-blur-md border-2 border-white/50 text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-white/30 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Learn More
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/90 font-semibold"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-lg border border-white/20 backdrop-blur-sm"
              >
                <motion.svg 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-5 h-5 text-green-300" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </motion.svg>
                <span>Free to Join</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-lg border border-white/20 backdrop-blur-sm"
              >
                <motion.svg 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  className="w-5 h-5 text-blue-300" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </motion.svg>
                <span>24/7 Support</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-lg border border-white/20 backdrop-blur-sm"
              >
                <motion.svg 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                  className="w-5 h-5 text-purple-300" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </motion.svg>
                <span>Track Impact</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Premium Footer with Glassmorphism */}
      <footer id="contact" className="relative overflow-hidden">
        {/* Gradient Section Separator */}
        <div className="h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-green-600"></div>
        
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              y: [0, -20, 0],
              x: [0, 15, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-40 left-20 w-96 h-96 bg-gradient-to-br from-blue-600/20 to-green-600/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, 15, 0],
              x: [0, -20, 0],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="absolute -bottom-40 right-20 w-80 h-80 bg-gradient-to-br from-purple-600/20 to-pink-600/10 rounded-full blur-3xl"
          />
        </div>

        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              {/* Brand Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center mb-6">
                  <Logo size="small" />
                  <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">ANNASETU</span>
                </div>
                <p className="text-gray-400 leading-relaxed font-medium">
                  Connecting food donors with NGOs to reduce waste and feed those in need.
                </p>
              </motion.div>

              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <h4 className="font-bold mb-6 text-lg bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">Quick Links</h4>
                <ul className="space-y-3">
                  <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors duration-300 font-medium">About Us</Link></li>
                  <li><Link to="/how-it-works" className="text-gray-400 hover:text-white transition-colors duration-300 font-medium">How It Works</Link></li>
                  <li><Link to="/impact" className="text-gray-400 hover:text-white transition-colors duration-300 font-medium">Our Impact</Link></li>
                  <li><Link to="/blog" className="text-gray-400 hover:text-white transition-colors duration-300 font-medium">Blog</Link></li>
                </ul>
              </motion.div>

              {/* Support */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h4 className="font-bold mb-6 text-lg bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">Support</h4>
                <ul className="space-y-3">
                  <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors duration-300 font-medium">Contact Us</Link></li>
                  <li><Link to="/faq" className="text-gray-400 hover:text-white transition-colors duration-300 font-medium">FAQ</Link></li>
                  <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors duration-300 font-medium">Privacy Policy</Link></li>
                  <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors duration-300 font-medium">Terms of Service</Link></li>
                </ul>
              </motion.div>

              {/* Social Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h4 className="font-bold mb-6 text-lg bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">Connect With Us</h4>
                <div className="flex space-x-4">
                  <motion.button 
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center hover:from-blue-400 hover:to-blue-500 transition-all duration-300 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417a9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.15, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center hover:from-pink-600 hover:to-orange-500 transition-all duration-300 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                    </svg>
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Divider */}
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="border-t border-gradient-to-r from-gray-700 via-gray-600 to-gray-700 mb-8 origin-left"
            ></motion.div>

            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-center text-gray-400 font-medium"
            >
              <p>&copy; 2026 ANNASETU. All rights reserved. Made with ❤️ for a better world.</p>
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
