import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "../hooks/useGSAP";
import GlassButton from "../components/GlassButton";
import {
  FiBookOpen,
  FiMessageCircle,
  FiLayout,
  FiFileText,
  FiVideo,
  FiUsers,
  FiChevronDown,
  FiFile,
} from "react-icons/fi";

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Refs for GSAP animations
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const buttonsRef = useRef(null);
  const scrollIndicatorRef = useRef(null);
  const arrowsRef = useRef(null);

  // Initialize GSAP animations
  useGSAP(() => {
    // Create a timeline for sequential animations
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Title animation with text reveal effect
    const titleText = titleRef.current.textContent;
    titleRef.current.innerHTML = "";

    // Split text into characters for animation
    const chars = titleText.split("");
    chars.forEach((char) => {
      const span = document.createElement("span");
      span.textContent = char === " " ? "\u00A0" : char;
      span.style.display = "inline-block";
      span.style.opacity = 0;
      titleRef.current.appendChild(span);
    });

    // Animate the title characters
    tl.to(titleRef.current.children, {
      opacity: 1,
      y: 0,
      stagger: 0.05,
      duration: 0.8,
      ease: "power2.out",
    });

    // Animate subtitle
    tl.fromTo(
      subtitleRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6 },
      "-=0.3" // Start slightly before the title animation finishes
    );

    // Animate buttons
    tl.fromTo(
      buttonsRef.current.children,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.6 },
      "-=0.3"
    );

    // Animate scroll indicator with repeating bounce
    tl.fromTo(
      scrollIndicatorRef.current,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.6 },
      "-=0.2"
    );

    // Animate the scroll indicator icons with a staggered effect
    const chevrons = arrowsRef.current.querySelectorAll("svg");
    gsap.fromTo(
      chevrons,
      { opacity: 0, y: -10 },
      {
        opacity: (i) => 1 - i * 0.2, // First chevron fully opaque, others progressively more transparent
        y: 0,
        duration: 0.4,
        stagger: 0.1,
        delay: 0.3,
        ease: "power2.out",
      }
    );

    // Create a pulsing glow effect for the scroll indicator
    gsap.to(scrollIndicatorRef.current, {
      filter: "drop-shadow(0 0 12px rgba(255, 255, 255, 0.8))",
      scale: 1.05,
      duration: 1.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.deltaY > 0) {
        // Animate out before navigating
        const tl = gsap.timeline({
          onComplete: () => navigate("/chatbot"),
        });

        tl.to(
          [
            titleRef.current,
            subtitleRef.current,
            buttonsRef.current,
            scrollIndicatorRef.current,
            arrowsRef.current,
          ],
          {
            opacity: 0,
            y: -30,
            stagger: 0.05,
            duration: 0.4,
          }
        );
      }
    };
    window.addEventListener("wheel", handler);
    return () => window.removeEventListener("wheel", handler);
  }, [navigate]);

  const handleNavigate = (path) => {
    // Animate out before navigating
    const tl = gsap.timeline({
      onComplete: () => navigate(path),
    });

    tl.to(
      [
        titleRef.current,
        subtitleRef.current,
        buttonsRef.current,
        scrollIndicatorRef.current,
        arrowsRef.current,
      ],
      {
        opacity: 0,
        y: -30,
        stagger: 0.05,
        duration: 0.4,
      }
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative z-10 flex flex-col items-center justify-center h-screen w-full px-4"
    >
      <div className="text-center space-y-8">
        <h1
          ref={titleRef}
          className="text-5xl md:text-7xl font-extrabold drop-shadow-lg text-white"
          style={{ fontFamily: "Tiro Devanagari Hindi, serif" }}
        >
          {t("Welcome to Gurukul")}
        </h1>

        <p
          ref={subtitleRef}
          className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto"
        >
          Your personalized learning companion for academic excellence
        </p>

        <div
          ref={buttonsRef}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8 w-full max-w-4xl mx-auto"
        >
          {/* First row */}
          <GlassButton
            icon={FiLayout}
            variant="primary"
            className="h-16 text-lg"
            onClick={() => handleNavigate("/dashboard")}
          >
            Dashboard
          </GlassButton>

          <GlassButton
            icon={FiBookOpen}
            variant="primary"
            className="h-16 text-lg"
            onClick={() => handleNavigate("/subjects")}
          >
            Subjects
          </GlassButton>

          <GlassButton
            icon={FiFile}
            variant="primary"
            className="h-16 text-lg"
            onClick={() => handleNavigate("/learn")}
          >
            Summarizer
          </GlassButton>

          {/* Second row */}
          <GlassButton
            icon={FiMessageCircle}
            variant="primary"
            className="h-16 text-lg"
            onClick={() => handleNavigate("/chatbot")}
          >
            Chatbot
          </GlassButton>

          <GlassButton
            icon={FiFileText}
            variant="primary"
            className="h-16 text-lg"
            onClick={() => handleNavigate("/test")}
          >
            Tests
          </GlassButton>

          <GlassButton
            icon={FiVideo}
            variant="primary"
            className="h-16 text-lg"
            onClick={() => handleNavigate("/lectures")}
          >
            Lectures
          </GlassButton>

          {/* Third row */}
        </div>

        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white/80 flex flex-col items-center"
        >
          {/* Animated chevrons */}
          <div ref={arrowsRef} className="flex flex-col items-center">
            <FiChevronDown className="mx-auto w-10 h-10 animate-bounce-slow text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
