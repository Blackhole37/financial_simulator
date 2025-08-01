import React, { useState, useEffect, useRef } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import gsap from "gsap";
import { useGSAP } from "../hooks/useGSAP";
import { toast } from "react-hot-toast";
import "../styles/header.css";
import {
  preloadImage,
  getUserInitials,
  getFallbackAvatarUrl,
  handleAvatarError,
} from "../utils/avatarUtils";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);
  const [userInitials, setUserInitials] = useState("U");

  // Refs for GSAP animations
  const headerRef = useRef(null);
  const logoRef = useRef(null);
  const aboutLinkRef = useRef(null);
  const logoutBtnRef = useRef(null);

  // We'll use CSS hover effects instead of GSAP for better reliability

  // Initial animation when component mounts
  useGSAP(() => {
    // Initial animation for header
    gsap.fromTo(
      headerRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    );

    // Staggered animation for header elements
    gsap.fromTo(
      [logoRef.current, aboutLinkRef.current, logoutBtnRef.current],
      { y: -20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.3,
      }
    );
  }, []);

  // Setup Sign Out button hover animation in a separate useEffect
  useEffect(() => {
    const logoutBtn = logoutBtnRef.current;
    if (!logoutBtn) return;

    // Set initial state with simple styling
    gsap.set(logoutBtn, {
      border: "2px solid transparent",
      borderRadius: "24px",
      boxSizing: "border-box",
      position: "relative",
      overflow: "visible",
    });

    // Simple hover handlers using GSAP for smooth transitions
    const handleMouseEnter = () => {
      // Border color and background change to orange
      gsap.to(logoutBtn, {
        borderColor: "#FF9933", // Orange border
        backgroundColor: "rgba(255, 153, 51, 0.3)", // More vibrant orange background
        duration: 0.15,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.killTweensOf(logoutBtn);

      // Simple fade out
      gsap.to(logoutBtn, {
        borderColor: "transparent",
        backgroundColor: "rgba(255, 255, 255, 0.12)", // Reset to original background
        duration: 0.15,
        ease: "power2.out",
      });
    };

    // Add event listeners
    logoutBtn.addEventListener("mouseenter", handleMouseEnter);
    logoutBtn.addEventListener("mouseleave", handleMouseLeave);

    // Return cleanup function
    return () => {
      if (logoutBtn) {
        logoutBtn.removeEventListener("mouseenter", handleMouseEnter);
        logoutBtn.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  // Border animation for active link
  useEffect(() => {
    // Capture current refs to use in cleanup function
    const aboutLink = aboutLinkRef.current;

    // Reset border animation
    if (aboutLink) {
      gsap.set(aboutLink, {
        borderColor: "transparent",
        borderWidth: "2px",
        borderStyle: "solid",
        boxSizing: "border-box",
      });
    }

    // Apply border animation if about page is active
    if (location.pathname === "/about" && aboutLink) {
      const tl = gsap.timeline();

      // Start from bottom
      tl.to(aboutLink, {
        borderBottomColor: "#FFA94D",
        duration: 0.15,
        ease: "power2.inOut",
      })
        // Then left side
        .to(aboutLink, {
          borderLeftColor: "#FFA94D",
          duration: 0.15,
          ease: "power2.inOut",
        })
        // Then top
        .to(aboutLink, {
          borderTopColor: "#FFA94D",
          duration: 0.15,
          ease: "power2.inOut",
        })
        // Then right side
        .to(aboutLink, {
          borderRightColor: "#FFA94D",
          duration: 0.15,
          ease: "power2.inOut",
        });

      // No text glow effect as requested
    }

    // Cleanup function
    return () => {
      if (aboutLink) {
        // Kill all animations
        gsap.killTweensOf(aboutLink);

        // Reset border
        gsap.set(aboutLink, {
          borderColor: "transparent",
          borderWidth: "2px",
          borderStyle: "solid",
          boxSizing: "border-box",
        });

        // No text glow to reset
      }
    };
  }, [location.pathname]);

  // Using utility functions from avatarUtils.js

  useEffect(() => {
    // Simple function to fetch avatar data
    const fetchAvatar = async (session) => {
      setIsAvatarLoading(true);

      const user = session?.user;
      if (!user) {
        setAvatarUrl("");
        setUserInitials("U");
        setIsAvatarLoading(false);
        return;
      }

      // Set user initials immediately for the placeholder
      const initials = getUserInitials(user);
      setUserInitials(initials);

      // Generate fallback avatar URL
      const fallbackAvatarUrl = getFallbackAvatarUrl(initials);

      // Check if user has a custom avatar
      if (user.user_metadata?.avatar_url) {
        // Just set the avatar URL directly without preloading
        setAvatarUrl(user.user_metadata.avatar_url);
      } else {
        // No custom avatar, use fallback immediately
        setAvatarUrl(fallbackAvatarUrl);
      }

      setIsAvatarLoading(false);
    };

    // Get current session using the newer API and fetch avatar immediately
    const getSessionAndFetchAvatar = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          fetchAvatar(data.session);
        } else {
          setIsAvatarLoading(false);
        }
      } catch (error) {
        console.error("Failed to get session:", error);
        setIsAvatarLoading(false);
      }
    };

    // Call immediately
    getSessionAndFetchAvatar();

    // Use the newer auth state change API
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only fetch avatar on sign in or sign out events
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          fetchAvatar(session);
        }
      }
    );

    return () => {
      if (listener && listener.unsubscribe) listener.unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    // Click animation - faster and smoother
    if (logoutBtnRef.current) {
      gsap.to(logoutBtnRef.current, {
        scale: 0.97,
        duration: 0.07,
        ease: "power2.in",
        onComplete: () => {
          if (logoutBtnRef.current) {
            gsap.to(logoutBtnRef.current, {
              scale: 1,
              duration: 0.1,
              ease: "power2.out",
            });
          }

          // Show toast notification
          toast.success("Signing out...", {
            icon: "👋",
            position: "bottom-right",
          });

          // Sign out using Supabase
          supabase.auth
            .signOut()
            .then(() => {
              // Navigate to sign-in page
              window.location.href = "/signin";
            })
            .catch((error) => {
              console.error("Error signing out:", error);
              // Fallback to manual sign out
              try {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = "/signin";
              } catch (e) {
                console.error("Error clearing storage:", e);
                window.location.href = "/signin";
              }
            });
        },
      });
    } else {
      // If button ref is not available, use direct approach
      // Show toast notification
      toast.success("Signing out...", {
        icon: "👋",
        position: "bottom-right",
      });

      // Sign out using Supabase
      supabase.auth
        .signOut()
        .then(() => {
          // Navigate to sign-in page
          window.location.href = "/signin";
        })
        .catch((error) => {
          console.error("Error signing out:", error);
          // Fallback to manual sign out
          try {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/signin";
          } catch (e) {
            console.error("Error clearing storage:", e);
            window.location.href = "/signin";
          }
        });
    }
  };

  const handleLogoClick = () => {
    // Click animation - faster and smoother
    if (logoRef.current) {
      gsap.to(logoRef.current, {
        scale: 0.97,
        duration: 0.07,
        ease: "power2.in",
        onComplete: () => {
          if (logoRef.current) {
            gsap.to(logoRef.current, {
              scale: 1,
              duration: 0.1,
              ease: "power2.out",
            });
          }
          navigate("/home");
        },
      });
    } else {
      // If logo ref is not available, just navigate
      navigate("/home");
    }
  };

  return (
    <header ref={headerRef} className="header glassy-header">
      <div className="header-left">
        <span
          ref={logoRef}
          className="logo hover-effect"
          onClick={handleLogoClick}
        >
          Gurukul
        </span>
      </div>
      <div className="header-right">
        <NavLink
          ref={aboutLinkRef}
          to="/about"
          className={({ isActive }) =>
            isActive
              ? "about-link hover-effect active"
              : "about-link hover-effect"
          }
        >
          <span>About</span>
        </NavLink>
        <button
          ref={logoutBtnRef}
          className="logout-btn hover-effect"
          onClick={handleLogout}
        >
          <span className="logout-text">
            <span>Sign Out</span>
          </span>
          {/* Simple avatar implementation */}
          <div className="relative ml-2">
            {/* Always show the initials as a fallback */}
            <div className="avatar-placeholder">{userInitials}</div>

            {/* Conditionally render the image on top if we have a URL and not loading */}
            {!isAvatarLoading && avatarUrl && (
              <img
                src={avatarUrl}
                alt=""
                className="avatar absolute top-0 left-0"
                onError={(e) => {
                  // On error, hide the image to show the initials underneath
                  e.target.style.display = "none";
                }}
              />
            )}
          </div>
        </button>
      </div>
    </header>
  );
}
