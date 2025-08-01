import React, { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Loader2, Play, Pause, Square } from "lucide-react";
import { useGenerateTTSMutation } from "../api/ttsApiSlice";
import { ttsUtils } from "../api/ttsApiSlice";
import { toast } from "react-hot-toast";

const TTSButton = ({ 
  text, 
  section = "general", 
  size = "md", 
  variant = "primary",
  className = "",
  disabled = false 
}) => {
  const [generateTTS, { isLoading: isGenerating }] = useGenerateTTSMutation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null);

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle TTS generation and playback
  const handleTTSClick = async () => {
    if (!text || disabled) return;

    try {
      // If audio is already playing, pause it
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        setIsPaused(true);
        return;
      }

      // If audio is paused, resume it
      if (isPaused && audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
        setIsPaused(false);
        return;
      }

      // Generate new TTS if no audio exists
      if (!audioUrl) {
        toast.loading("🎵 Generating speech...", {
          id: `tts-${section}`,
          duration: 3000,
        });

        const formattedText = ttsUtils.formatTextForTTS(text, section);
        const result = await ttsUtils.generateLessonTTS(generateTTS, formattedText, section);
        
        setAudioUrl(result.full_audio_url);
        
        toast.dismiss(`tts-${section}`);
        toast.success("🎵 Speech generated! Playing...", {
          duration: 2000,
        });

        // Play the generated audio
        playAudio(result.full_audio_url);
      } else {
        // Play existing audio
        playAudio(audioUrl);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      toast.dismiss(`tts-${section}`);
      toast.error("❌ Failed to generate speech. Please try again.", {
        duration: 3000,
      });
    }
  };

  const playAudio = (url) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = new Audio(url);
      
      audioRef.current.onloadstart = () => {
        console.log("Audio loading started");
      };

      audioRef.current.oncanplay = () => {
        console.log("Audio can start playing");
        audioRef.current.play();
      };

      audioRef.current.onplay = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };

      audioRef.current.onpause = () => {
        setIsPlaying(false);
        setIsPaused(true);
      };

      audioRef.current.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      audioRef.current.onerror = (error) => {
        console.error("Audio playback error:", error);
        setIsPlaying(false);
        setIsPaused(false);
        toast.error("❌ Audio playback failed", { duration: 2000 });
      };

    } catch (error) {
      console.error("Error creating audio:", error);
      toast.error("❌ Audio playback failed", { duration: 2000 });
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  // Get button size classes
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-8 h-8 text-sm";
      case "lg":
        return "w-12 h-12 text-lg";
      default:
        return "w-10 h-10 text-base";
    }
  };

  // Get variant classes
  const getVariantClasses = () => {
    if (disabled) {
      return "bg-gray-500/20 text-gray-400 cursor-not-allowed";
    }

    switch (variant) {
      case "secondary":
        return "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/20";
      case "accent":
        return "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 hover:text-amber-200 border border-amber-500/30";
      default:
        return "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 border border-blue-500/30";
    }
  };

  // Get icon based on current state
  const getIcon = () => {
    if (isGenerating) {
      return <Loader2 className="animate-spin" />;
    }
    if (isPlaying) {
      return <Pause />;
    }
    if (isPaused) {
      return <Play />;
    }
    return <Volume2 />;
  };

  // Get tooltip text
  const getTooltipText = () => {
    if (disabled) return "Text-to-speech not available";
    if (isGenerating) return "Generating speech...";
    if (isPlaying) return "Pause speech";
    if (isPaused) return "Resume speech";
    return "Play text as speech";
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleTTSClick}
        disabled={disabled || isGenerating}
        className={`
          ${getSizeClasses()}
          ${getVariantClasses()}
          rounded-full flex items-center justify-center
          transition-all duration-200 ease-in-out
          shadow-lg hover:shadow-xl
          ${className}
        `}
        title={getTooltipText()}
        aria-label={getTooltipText()}
      >
        {getIcon()}
      </button>

      {/* Stop button (only show when playing or paused) */}
      {(isPlaying || isPaused) && (
        <button
          onClick={stopAudio}
          className={`
            ${getSizeClasses()}
            bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200
            border border-red-500/30 rounded-full flex items-center justify-center
            transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl
          `}
          title="Stop speech"
          aria-label="Stop speech"
        >
          <Square className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default TTSButton;
