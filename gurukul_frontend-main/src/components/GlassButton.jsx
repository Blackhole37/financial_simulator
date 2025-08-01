import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "../hooks/useGSAP";

/**
 * GlassButton - Modern glassmorphic button with GSAP animations
 * Props: icon, children, className, variant, ...props
 */
export default function GlassButton({
  icon: Icon,
  children,
  className = "",
  variant = "default", // default, primary, accent
  ...props
}) {
  // Refs for GSAP animations
  const buttonRef = useRef(null);
  const iconRef = useRef(null);
  const textRef = useRef(null);

  // Define variant-specific styles
  const getStyles = () => {
    const baseStyles = {
      background: "rgba(255, 255, 255, 0.15)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.25)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      color: "#fff",
    };

    switch (variant) {
      case "primary":
        return {
          ...baseStyles,
          background: "rgba(255, 153, 51, 0.25)",
          border: "1px solid rgba(255, 215, 0, 0.4)",
          color: "#FFD700",
          fontWeight: 600,
        };
      case "accent":
        return {
          ...baseStyles,
          background: "rgba(93, 0, 30, 0.25)",
          border: "1px solid rgba(93, 0, 30, 0.5)",
          color: "#fff",
          fontWeight: 600,
        };
      default:
        return baseStyles;
    }
  };

  // Initialize GSAP animations
  useGSAP(() => {
    // Enhanced entrance animation
    gsap.fromTo(
      buttonRef.current,
      {
        opacity: 0,
        y: 20,
        scale: 0.9,
        rotationX: -15,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotationX: 0,
        duration: 0.8,
        ease: "back.out(1.4)",
        delay: 0.1,
      }
    );
  }, []);

  // Handle disabled state animation
  useGSAP(() => {
    if (props.disabled) {
      gsap.to(buttonRef.current, {
        opacity: 0.6,
        scale: 0.98,
        duration: 0.3,
        ease: "power2.out",
      });
    } else {
      gsap.to(buttonRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }, [props.disabled]);

  // Handle hover animations
  const handleMouseEnter = () => {
    // Skip hover animation if disabled
    if (props.disabled) return;

    // Subtle button hover effect - reduced glow
    gsap.to(buttonRef.current, {
      scale: 1.02,
      boxShadow:
        variant === "primary"
          ? "0 6px 16px rgba(255, 153, 51, 0.15), 0 0 6px rgba(255, 215, 0, 0.1)"
          : variant === "accent"
          ? "0 6px 16px rgba(93, 0, 30, 0.15), 0 0 6px rgba(93, 0, 30, 0.1)"
          : "0 6px 16px rgba(255, 255, 255, 0.1), 0 0 6px rgba(255, 255, 255, 0.05)",
      duration: 0.4,
      ease: "power3.out",
    });

    // Smooth icon animation
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        scale: 1.05,
        rotate: 2,
        duration: 0.4,
        ease: "back.out(1.2)",
      });
    }

    // Gentle text animation
    gsap.to(textRef.current, {
      scale: 1.01,
      duration: 0.4,
      ease: "power3.out",
    });
  };

  // Handle mouse leave animations
  const handleMouseLeave = () => {
    // Skip if disabled
    if (props.disabled) return;

    // Smooth reset to original state
    gsap.to(buttonRef.current, {
      scale: 1,
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      duration: 0.5,
      ease: "power3.out",
    });

    // Smooth icon reset
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        scale: 1,
        rotate: 0,
        duration: 0.5,
        ease: "back.out(1.2)",
      });
    }

    // Smooth text reset
    gsap.to(textRef.current, {
      scale: 1,
      duration: 0.5,
      ease: "power3.out",
    });
  };

  // Handle click animation
  const handleClick = (e) => {
    // Skip animation if disabled
    if (props.disabled) return;

    // Improved click animation with ripple effect
    const timeline = gsap.timeline();

    timeline
      .to(buttonRef.current, {
        scale: 0.96,
        duration: 0.1,
        ease: "power2.in",
      })
      .to(buttonRef.current, {
        scale: 1.01,
        duration: 0.2,
        ease: "back.out(2)",
      })
      .to(buttonRef.current, {
        scale: 1,
        duration: 0.15,
        ease: "power2.out",
      });

    // Add a subtle pulse to the icon
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        scale: 1.1,
        duration: 0.1,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
      });
    }

    // If there's an onClick handler in props, call it
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <button
      ref={buttonRef}
      className={`
        flex items-center justify-center gap-2 rounded-xl
        px-6 py-3 font-semibold
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFD700]/30 focus:ring-offset-transparent
        ${className}
      `}
      style={{
        ...getStyles(),
        fontFamily: "Inter, Poppins, sans-serif",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      {...props}
    >
      {Icon && <Icon ref={iconRef} className="w-5 h-5" />}
      <span ref={textRef}>{children}</span>
    </button>
  );
}
