import React, { useState, useEffect, useRef } from "react";
import GlassContainer from "../components/GlassContainer";
import { supabase } from "../supabaseClient";
import { API_BASE_URL } from "../config";
import {
  Clock,
  Heart,
  DollarSign,
  BookOpen,
  RefreshCw,
  Play,
  RotateCcw,
  Clock8,
  Tag,
  BarChart,
  Cpu,
  Bot,
  BrainCircuit,
} from "lucide-react";
import GlassButton from "../components/GlassButton";
import { useTimeTracking } from "../hooks/useTimeTracking";
import toast from "react-hot-toast";
import {
  preloadImage,
  getUserInitials,
  getFallbackAvatarUrl,
} from "../utils/avatarUtils";
import { useQuery } from "@tanstack/react-query";
import {
  useGetDailyQuoteQuery,
  useGetRandomFactQuery,
  useGetLocationWeatherQuery,
} from "../api/externalApiSlice";
import {
  useGetAgentOutputsQuery,
  useGetAgentLogsQuery,
} from "../api/coreApiSlice";
import gsap from "gsap";
import "../styles/dashboard.css";
import "../styles/agentDashboard.css";

// Format seconds into Hh Mm Ss
const formatDuration = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};

const LOCAL_QUOTES = [
  "Every day is a chance to learn something new!",
  "Small steps every day lead to big results.",
  "Consistency is the key to mastery.",
  "Your future is created by what you do today, not tomorrow.",
  "Learning never exhausts the mind.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "The expert in anything was once a beginner.",
  "Stay positive, work hard, make it happen.",
];

// Mock data for agent outputs (fallback when API fails)
const getMockAgentOutputs = () => [
  {
    id: 1,
    agent_type: "financial",
    query: "How should I invest my savings?",
    response:
      "Based on your risk profile, I recommend a mix of 60% index funds, 30% bonds, and 10% cash reserves.",
    confidence: 0.87,
    tags: ["risk", "investment"],
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 2,
    agent_type: "education",
    query: "Explain the Pythagorean theorem",
    response:
      "The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c².",
    confidence: 0.95,
    tags: ["math", "geometry"],
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 3,
    agent_type: "wellness",
    query: "What's a good morning routine for energy?",
    response:
      "Start with 5 minutes of stretching, drink a glass of water, have a protein-rich breakfast, and get 10 minutes of sunlight for optimal energy levels.",
    confidence: 0.82,
    tags: ["health", "routine"],
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

// Mock data for agent logs (fallback when API fails)
const getMockAgentLogs = () => [
  {
    id: 1,
    agent_type: "financial",
    action: "simulation_started",
    details: "Financial simulation initiated for user portfolio analysis",
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
  {
    id: 2,
    agent_type: "education",
    action: "query_processed",
    details: "Mathematics query processed successfully",
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: 3,
    agent_type: "wellness",
    action: "recommendation_generated",
    details: "Health recommendation generated based on user profile",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 4,
    agent_type: "financial",
    action: "risk_assessment",
    details: "Investment risk assessment completed",
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 5,
    agent_type: "education",
    action: "lesson_created",
    details: "Custom lesson plan created for advanced calculus",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
];

// Format relative time (e.g., "5 minutes ago")
function formatRelativeTime(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffSeconds = Math.floor((now - date) / 1000);

  if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
  return `${Math.floor(diffSeconds / 86400)} days ago`;
}

export default function Dashboard() {
  const { totalTimeToday, currentSessionTime, /* isLoading, */ timeHistory } =
    useTimeTracking();
  const [error, setError] = useState(null);
  const [dailyGoal, setDailyGoal] = useState(0);
  const [isSettingGoal, setIsSettingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState({ hours: 0, minutes: 0 });
  const [user, setUser] = useState(null);
  const subscriptionRef = useRef(null);
  const coords = useGeolocation();
  // Unused location and weather data
  useLocationWeather(coords); // Still call the hook but don't use the return value
  // Unused state variables
  const [, /* dateString */ setDateString] = useState("");
  // Fact for 'Did you know?'
  const [, /* randomFact */ setRandomFact] = useState("");
  // Avatar loading state
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);
  const [userInitials, setUserInitials] = useState("U");

  // Agent simulation state - all unused but kept for future implementation
  const [
    ,/* isSimulationActive */
    /* setIsSimulationActive */
  ] = useState(false);
  const [
    ,/* selectedAgentType */
    /* setSelectedAgentType */
  ] = useState(null);
  const [
    ,/* isPlayingSession */
    /* setIsPlayingSession */
  ] = useState(false);
  const [
    ,/* playbackSpeed */
    /* setPlaybackSpeed */
  ] = useState(1);
  const [
    ,/* sessionData */
    /* setSessionData */
  ] = useState(null);

  // Refs for animations
  const containerRef = useRef(null);

  // Animation for container entrance and elements
  useEffect(() => {
    // Main container animation
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );

    // Agent cards animation with stagger
    gsap.fromTo(
      ".agent-card",
      { opacity: 0, y: 20, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.1,
        delay: 0.3,
      }
    );

    // Insights animation
    gsap.fromTo(
      ".insight-card",
      { opacity: 0, y: 15 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
        stagger: 0.08,
        delay: 0.5,
      }
    );

    // Timeline animation
    gsap.fromTo(
      ".timeline-item",
      { opacity: 0, x: -10 },
      {
        opacity: 1,
        x: 0,
        duration: 0.3,
        ease: "power1.out",
        stagger: 0.06,
        delay: 0.6,
      }
    );
  }, []);

  // Fetch agent data using RTK Query
  const { data: agentOutputs, error: agentOutputsError } =
    useGetAgentOutputsQuery(undefined, {
      pollingInterval: 10000,
      refetchOnMountOrArgChange: true,
    });

  const { data: agentLogs, error: agentLogsError } = useGetAgentLogsQuery(
    undefined,
    {
      pollingInterval: 10000,
      refetchOnMountOrArgChange: true,
    }
  );

  // Use mock data as fallback when API fails
  const finalAgentOutputs = agentOutputsError
    ? getMockAgentOutputs()
    : agentOutputs || getMockAgentOutputs();
  const finalAgentLogs = agentLogsError
    ? getMockAgentLogs()
    : agentLogs || getMockAgentLogs();

  // Show subtle toast for API errors (only once per session)
  useEffect(() => {
    if (
      agentOutputsError &&
      !sessionStorage.getItem("agent-outputs-error-shown")
    ) {
      toast.error("Agent outputs unavailable, using demo data", {
        duration: 2000,
        position: "bottom-left",
      });
      sessionStorage.setItem("agent-outputs-error-shown", "true");
    }
    if (agentLogsError && !sessionStorage.getItem("agent-logs-error-shown")) {
      toast.error("Agent logs unavailable, using demo data", {
        duration: 2000,
        position: "bottom-left",
      });
      sessionStorage.setItem("agent-logs-error-shown", "true");
    }
  }, [agentOutputsError, agentLogsError]);

  // Fetch a daily motivational quote using RTK Query
  const { data: quoteData } = useGetDailyQuoteQuery(undefined, {
    refetchOnMountOrArgChange: false,
    refetchOnWindowFocus: false,
  });

  // Helper: Calculate stats from timeHistory
  const getStats = () => {
    if (!timeHistory || timeHistory.length === 0)
      return { week: 0, month: 0, daysActive: 0, bestStreak: 1 };
    const now = new Date();
    let week = 0,
      month = 0,
      daysActiveSet = new Set(),
      streak = 0,
      bestStreak = 0,
      prevDay = null;
    const sortedHistory = [...timeHistory].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    sortedHistory.forEach(({ date, total }) => {
      const d = new Date(date);
      if (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      )
        month += total;
      if (now - d < 8 * 24 * 3600 * 1000) week += total;
      daysActiveSet.add(date);
      // Streak calculation
      if (prevDay) {
        const diff = (d - prevDay) / (1000 * 3600 * 24);
        if (diff === 1) {
          streak++;
        } else {
          bestStreak = Math.max(bestStreak, streak);
          streak = 1;
        }
      } else {
        streak = 1;
      }
      prevDay = d;
    });
    bestStreak = Math.max(bestStreak, streak);
    const stats = {
      week,
      month,
      daysActive: daysActiveSet.size,
      bestStreak,
    };
    // Remove debug output
    // console.debug("timeHistory", timeHistory);
    // console.debug("stats", stats);
    return stats;
  };

  // Using utility functions from avatarUtils.js

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session)
          throw sessionError || new Error("No session");

        // Set user initials immediately
        const initials = getUserInitials(session.user);
        setUserInitials(initials);

        // Handle avatar loading
        setIsAvatarLoading(true);

        // Generate fallback avatar URL (not used directly but still call the function)
        getFallbackAvatarUrl(initials);

        // Check if user has a custom avatar
        if (session.user.user_metadata?.avatar_url) {
          try {
            // Preload the custom avatar
            const result = await preloadImage(
              session.user.user_metadata.avatar_url
            );

            // If preloadImage returns null, it means there was an issue loading the image
            if (result === null) {
              console.log(
                "Dashboard: Using fallback avatar due to preload failure"
              );
              // We'll use the fallback in the render - no need to do anything here
            }
          } catch (error) {
            console.error("Failed to preload avatar:", error);
            // If there's an error, we'll use the fallback in the render
          }
        }

        setIsAvatarLoading(false);

        setUser(session.user);
        const userId = session.user.id;

        // Fetch daily goal
        const { data: goalData, error: goalError } = await supabase
          .from("user_goals")
          .select("daily_goal_seconds")
          .eq("user_id", userId)
          .maybeSingle();

        if (goalError) {
          console.error("Error fetching goal:", goalError);
        } else if (goalData) {
          setDailyGoal(goalData.daily_goal_seconds);
          setGoalInput({
            hours: Math.floor(goalData.daily_goal_seconds / 3600),
            minutes: Math.floor((goalData.daily_goal_seconds % 3600) / 60),
          });
        }

        // Set up real-time subscription for user_goals
        subscriptionRef.current = supabase
          .channel("user_goals_changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "user_goals",
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              if (payload.new?.daily_goal_seconds) {
                setDailyGoal(payload.new.daily_goal_seconds);
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.error("Error initializing dashboard:", err);
        setError(err.message || "Error");
      }
    };

    initializeDashboard();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const handleSaveGoal = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const totalSeconds = goalInput.hours * 3600 + goalInput.minutes * 60;
      const { error } = await supabase.from("user_goals").upsert({
        user_id: session.user.id,
        daily_goal_seconds: totalSeconds,
      });

      if (error) throw error;

      setDailyGoal(totalSeconds);
      setIsSettingGoal(false);
      toast.success("Daily goal updated successfully!");
    } catch (err) {
      console.error("Error saving goal:", err);
      toast.error("Failed to save goal");
    }
  };

  const totalTimeWithSession = totalTimeToday + currentSessionTime;
  // Format time but don't use it directly
  formatDuration(totalTimeWithSession);
  const percentageComplete = dailyGoal
    ? Math.min((totalTimeWithSession / dailyGoal) * 100, 100)
    : 0;

  // Stats - not used directly but still call the function
  getStats();

  // Achievements section removed
  // Remove debug output for achievements
  // achievements.forEach((a) => console.debug(`${a.label}: ${a.unlocked}`));

  // Format goal time but don't store it
  if (percentageComplete < 100 && dailyGoal > 0) {
    formatDuration(dailyGoal - totalTimeWithSession);
  }

  // CircleProgress component removed

  // WeatherIcon component removed

  useEffect(() => {
    // Set current date string
    const now = new Date();
    setDateString(
      now.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  // Fetch random fact using RTK Query
  const { data: factData } = useGetRandomFactQuery(undefined, {
    refetchOnMountOrArgChange: false,
    refetchOnWindowFocus: false,
  });

  // Update randomFact when factData changes
  useEffect(() => {
    if (factData) {
      setRandomFact(factData);
    }
  }, [factData]);

  // Remove debug logs to clean up console
  // console.log("coords", coords);
  // console.log("location", location);
  // console.log("weather", weather);

  // Helper components for the agent dashboard
  const AgentCard = ({
    /* type, */ // Unused but kept for future implementation
    name,
    icon: Icon, // Used in JSX below
    color,
    description,
    isActive,
  }) => (
    <div
      className={`agent-card ${
        isActive ? "border-2" : ""
      } hover:shadow-lg transition-all duration-300`}
      style={{
        borderColor: isActive ? color : "rgba(255, 255, 255, 0.15)",
        transform: "translateZ(0)", // Force hardware acceleration for smoother animations
      }}
    >
      <div className="flex items-center mb-3">
        <div
          className="agent-icon mr-3 flex items-center justify-center"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}
        >
          <Icon size={24} color={color} />
        </div>
        <div>
          <h3 className="font-semibold" style={{ color }}>
            {name}
          </h3>
          <p className="text-xs text-white/70">{description}</p>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs px-2 py-1 rounded-full bg-white/10">
          {isActive ? "Active" : "Ready"}
        </span>
        <GlassButton
          className="text-xs py-1 px-3 transition-all duration-300 hover:bg-white/15"
          onClick={() => {
            // This would be connected to actual functionality in a real implementation
            toast.success(
              isActive ? `Viewing ${name} details` : `Activated ${name}`
            );
          }}
        >
          {isActive ? "View Details" : "Activate"}
        </GlassButton>
      </div>
    </div>
  );

  const InsightCard = ({
    agentType,
    query,
    response,
    confidence,
    tags,
    timestamp,
  }) => {
    const getConfidenceClass = () => {
      if (confidence >= 0.8) return "confidence-high";
      if (confidence >= 0.5) return "confidence-medium";
      return "confidence-low";
    };

    const getAgentColor = () => {
      switch (agentType) {
        case "financial":
          return "#3B82F6";
        case "education":
          return "#10B981";
        case "wellness":
          return "#F97316";
        default:
          return "#6B7280";
      }
    };

    const getAgentIcon = () => {
      switch (agentType) {
        case "financial":
          return DollarSign;
        case "education":
          return BookOpen;
        case "wellness":
          return Heart;
        default:
          return Bot;
      }
    };

    const AgentIcon = getAgentIcon();
    const agentColor = getAgentColor();

    return (
      <div className="insight-card hover:bg-white/15 transition-all duration-300">
        <div className="flex items-center mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
            style={{
              backgroundColor: `${agentColor}20`,
              boxShadow: `0 0 10px ${agentColor}30`,
            }}
          >
            <AgentIcon size={16} color={agentColor} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium" style={{ color: agentColor }}>
              {agentType === "financial"
                ? "FinancialCrew"
                : agentType === "education"
                ? "EduMentor"
                : agentType === "wellness"
                ? "WellnessBot"
                : "Agent"}
            </div>
            <div className="text-xs text-white/60">
              {formatRelativeTime(timestamp)}
            </div>
          </div>
        </div>

        <div className="mb-2 text-sm bg-black/20 p-2 rounded border border-white/5 hover:border-white/10 transition-colors duration-300">
          <span className="text-white/60">Query: </span>
          {query}
        </div>

        <div className="mb-3 text-sm bg-black/10 p-2 rounded">
          <span className="text-white/60">Response: </span>
          {response}
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Confidence</span>
            <span className="font-medium" style={{ color: agentColor }}>
              {Math.round(confidence * 100)}%
            </span>
          </div>
          <div className="confidence-bar">
            <div
              className={`confidence-progress ${getConfidenceClass()}`}
              style={{
                width: `${confidence * 100}%`,
                transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            ></div>
          </div>
        </div>

        <div className="flex flex-wrap">
          {tags.map((tag, index) => (
            <span
              key={index}
              className={`tag ${
                tag === "risk"
                  ? "tag-risk"
                  : tag === "health"
                  ? "tag-health"
                  : tag === "math"
                  ? "tag-math"
                  : ""
              } hover:opacity-90 transition-opacity duration-200`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const TimelineItem = ({ item }) => {
    const getItemClass = () => {
      switch (item.agent_type) {
        case "financial":
          return "financial";
        case "education":
          return "education";
        case "wellness":
          return "wellness";
        default:
          return "";
      }
    };

    const getItemColor = () => {
      switch (item.agent_type) {
        case "financial":
          return "#3B82F6";
        case "education":
          return "#10B981";
        case "wellness":
          return "#F97316";
        default:
          return "#6B7280";
      }
    };

    const getItemIcon = () => {
      switch (item.agent_type) {
        case "financial":
          return <DollarSign size={14} />;
        case "education":
          return <BookOpen size={14} />;
        case "wellness":
          return <Heart size={14} />;
        default:
          return <Bot size={14} />;
      }
    };

    const itemColor = getItemColor();
    const ItemIcon = getItemIcon();

    return (
      <div className={`timeline-item ${getItemClass()}`}>
        <div className="bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center mb-1">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center mr-2"
              style={{ backgroundColor: `${itemColor}20`, color: itemColor }}
            >
              {ItemIcon}
            </div>
            <div className="text-xs font-medium" style={{ color: itemColor }}>
              {item.agent_type === "financial"
                ? "FinancialCrew"
                : item.agent_type === "education"
                ? "EduMentor"
                : item.agent_type === "wellness"
                ? "WellnessBot"
                : "System"}
            </div>
          </div>
          <div className="text-sm">{item.details || item.action}</div>
          <div className="text-xs text-white/60 mt-1 flex items-center">
            <Clock size={12} className="mr-1" />
            {formatRelativeTime(item.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <GlassContainer>
      <div ref={containerRef} className="w-full max-w-[1500px] mx-auto">
        {/* Header with title and user info */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center">
            <Bot className="mr-3 text-[#FF9933]" />
            Agent Simulation Dashboard
          </h1>

          <div className="flex items-center">
            {/* Styled avatar container */}
            <div className="relative mr-3">
              <div className="dashboard-avatar-placeholder flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {userInitials}
                </span>
              </div>

              {!isAvatarLoading && user?.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  className="dashboard-avatar absolute top-0 left-0"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              )}
            </div>

            <div>
              <div className="font-semibold">
                {user?.user_metadata?.full_name || "User"}
              </div>
              <div className="text-xs text-white/70">
                {user?.email || "Not signed in"}
              </div>
            </div>
          </div>
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <AgentCard
            type="financial"
            name="FinancialCrew"
            icon={DollarSign}
            color="#3B82F6"
            description="Financial planning and advice"
            isActive={true}
          />

          <AgentCard
            type="education"
            name="EduMentor"
            icon={BookOpen}
            color="#10B981"
            description="Educational guidance and tutoring"
            isActive={false}
          />

          <AgentCard
            type="wellness"
            name="WellnessBot"
            icon={Heart}
            color="#F97316"
            description="Health and wellness recommendations"
            isActive={false}
          />

          <div className="md:col-span-3 mt-2">
            <GlassButton
              className="w-full py-2 flex items-center justify-center transition-all duration-300 hover:bg-white/15"
              onClick={() => toast.success("Starting new agent simulation")}
            >
              <BrainCircuit size={16} className="mr-2" />
              Start New Simulation
            </GlassButton>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Insights Column */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 mb-6 hover:border-white/20 transition-all duration-300">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BarChart className="mr-2 text-[#3B82F6]" size={20} />
                Agent Insights
              </h2>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {/* Sample insights - would be populated from agentOutputs */}
                <InsightCard
                  agentType="financial"
                  query="How should I invest my savings?"
                  response="Based on your risk profile, I recommend a mix of 60% index funds, 30% bonds, and 10% cash reserves."
                  confidence={0.87}
                  tags={["risk", "investment"]}
                  timestamp={new Date(Date.now() - 1000 * 60 * 5).toISOString()}
                />

                <InsightCard
                  agentType="education"
                  query="Explain the Pythagorean theorem"
                  response="The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c²."
                  confidence={0.95}
                  tags={["math", "geometry"]}
                  timestamp={new Date(
                    Date.now() - 1000 * 60 * 15
                  ).toISOString()}
                />

                <InsightCard
                  agentType="wellness"
                  query="What's a good morning routine for energy?"
                  response="Start with 5 minutes of stretching, drink a glass of water, have a protein-rich breakfast, and get 10 minutes of sunlight for optimal energy levels."
                  confidence={0.82}
                  tags={["health", "routine"]}
                  timestamp={new Date(
                    Date.now() - 1000 * 60 * 30
                  ).toISOString()}
                />
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between">
                <GlassButton
                  className="py-2 px-3 flex items-center justify-center transition-all duration-300 hover:bg-white/15"
                  onClick={() => toast.success("Filtering insights")}
                >
                  <Tag size={14} className="mr-2" />
                  Filter Insights
                </GlassButton>

                <GlassButton
                  className="py-2 px-3 flex items-center justify-center transition-all duration-300 hover:bg-white/15"
                  onClick={() => toast.success("Loading more insights")}
                >
                  <RefreshCw size={14} className="mr-2" />
                  Load More
                </GlassButton>
              </div>
            </div>

            {/* Stats and Controls */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all duration-300">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Cpu className="mr-2 text-[#10B981]" size={20} />
                Simulation Controls
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-lg p-3 border border-white/5 hover:border-white/15 transition-all duration-300 hover:shadow-lg">
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <Play size={14} className="mr-2 text-[#10B981]" />
                    Session Playback
                  </h3>
                  <div className="flex space-x-2">
                    <GlassButton
                      className="flex-1 py-2 transition-all duration-300 hover:bg-white/15"
                      onClick={() => toast.success("Starting session playback")}
                    >
                      <Play size={16} className="mr-2" />
                      Play Session
                    </GlassButton>
                    <GlassButton
                      className="py-2 transition-all duration-300 hover:bg-white/15"
                      onClick={() => toast.success("Session reset")}
                    >
                      <RotateCcw size={16} />
                    </GlassButton>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-3 border border-white/5 hover:border-white/15 transition-all duration-300 hover:shadow-lg">
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <RefreshCw size={14} className="mr-2 text-[#3B82F6]" />
                    Refresh Rate
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">10s</span>
                    <GlassButton
                      className="py-2 transition-all duration-300 hover:bg-white/15"
                      onClick={() => {
                        toast.success("Refreshing data");
                        // In a real implementation, this would call refetchOutputs() and refetchLogs()
                      }}
                    >
                      <RefreshCw size={16} className="mr-2" />
                      Refresh Now
                    </GlassButton>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Column */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 h-full hover:border-white/20 transition-all duration-300">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Clock8 className="mr-2 text-[#F97316]" size={20} />
                Activity Timeline
              </h2>

              <div className="timeline-container max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {/* Sample timeline items - would be populated from agentLogs */}
                <TimelineItem
                  item={{
                    agent_type: "financial",
                    action: "query_processed",
                    details: "Processed investment query with 87% confidence",
                    timestamp: new Date(
                      Date.now() - 1000 * 60 * 5
                    ).toISOString(),
                  }}
                />

                <TimelineItem
                  item={{
                    agent_type: "education",
                    action: "knowledge_retrieved",
                    details:
                      "Retrieved mathematical concept from knowledge base",
                    timestamp: new Date(
                      Date.now() - 1000 * 60 * 15
                    ).toISOString(),
                  }}
                />

                <TimelineItem
                  item={{
                    agent_type: "wellness",
                    action: "recommendation_generated",
                    details: "Generated personalized morning routine",
                    timestamp: new Date(
                      Date.now() - 1000 * 60 * 30
                    ).toISOString(),
                  }}
                />

                <TimelineItem
                  item={{
                    agent_type: "financial",
                    action: "feedback_received",
                    details: "Positive feedback received on investment advice",
                    timestamp: new Date(
                      Date.now() - 1000 * 60 * 45
                    ).toISOString(),
                  }}
                />

                <TimelineItem
                  item={{
                    agent_type: "education",
                    action: "session_started",
                    details: "New learning session started with EduMentor",
                    timestamp: new Date(
                      Date.now() - 1000 * 60 * 60
                    ).toISOString(),
                  }}
                />
              </div>

              <div className="mt-4 pt-3 border-t border-white/10">
                <GlassButton
                  className="w-full py-2 flex items-center justify-center transition-all duration-300 hover:bg-white/15"
                  onClick={() => toast.success("Loading more activity data")}
                >
                  <RefreshCw size={14} className="mr-2" />
                  Load More Activity
                </GlassButton>
              </div>
            </div>
          </div>
        </div>

        {/* Goal Setting Modal */}
        {isSettingGoal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1E1E28] p-6 rounded-xl border border-white/20 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">
                Set Daily Learning Goal
              </h3>
              <div className="flex gap-4 mb-6">
                <div>
                  <label className="block text-sm mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    value={goalInput.hours}
                    onChange={(e) =>
                      setGoalInput((prev) => ({
                        ...prev,
                        hours: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={goalInput.minutes}
                    onChange={(e) =>
                      setGoalInput((prev) => ({
                        ...prev,
                        minutes: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <GlassButton onClick={() => setIsSettingGoal(false)}>
                  Cancel
                </GlassButton>
                <GlassButton variant="primary" onClick={handleSaveGoal}>
                  Save Goal
                </GlassButton>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-red-500">{error}</p>}
      </div>
    </GlassContainer>
  );
}

function useGeolocation() {
  const [coords, setCoords] = useState(null);
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setCoords(null)
      );
    }
  }, []);
  return coords;
}

function useLocationWeather(coords) {
  // Use RTK Query for location and weather data
  const { data: locationWeatherData, isLoading } = useGetLocationWeatherQuery(
    coords ? { lat: coords.lat, lon: coords.lon } : undefined,
    {
      skip: !coords,
      refetchOnMountOrArgChange: false,
      refetchOnWindowFocus: false,
    }
  );

  return {
    location: locationWeatherData?.location || {
      city: "Location unavailable",
      country: "",
    },
    weather: locationWeatherData?.weather || null,
    isLoading,
  };
}
