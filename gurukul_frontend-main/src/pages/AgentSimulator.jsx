import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import GlassContainer from "../components/GlassContainer";
import { toast } from "react-hot-toast";
import gsap from "gsap";
import "../styles/agentDashboard.css";
import "../styles/skewFill.css";
import "../styles/pdfUpload.css";
import {
  useSendAgentMessageMutation,
  useStartAgentSimulationMutation,
  useStopAgentSimulationMutation,
  useResetAgentSimulationMutation,
} from "../api/agentApiSlice";
import {
  useSendLearningDataMutation,
  useLazyGetLearningTaskStatusQuery,
  useUploadPdfForChatMutation,
  useNotifyPdfRemovedMutation,
} from "../api/learningApiSlice";
import {
  useStartFinancialSimulationMutation,
  useLazyGetFinancialSimulationResultsQuery,
  useLazyGetSimulationStatusQuery,
  useLazyGetSimulationResultsByTaskIdQuery,
} from "../api/financialApiSlice";
import { selectUser } from "../store/authSlice";
import { selectAudioEnabled, selectAudioVolume } from "../store/settingsSlice";
import agentLogsService from "../services/agentLogsService";
import {
  Play,
  Pause,
  RotateCcw,
  Cpu,
  BrainCircuit,
  Bot,
  Sparkles,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  DollarSign,
  Heart,
  Target,
  Clock,
  Plus,
  Minus,
  Wallet,
  AlertTriangle,
  User,
  ShoppingBag,
  FileText,
  Pin,
  X,
  Activity,
} from "lucide-react";

export default function AgentSimulator() {
  const user = useSelector(selectUser);
  const audioEnabled = useSelector(selectAudioEnabled);
  const audioVolumeFromStore = useSelector(selectAudioVolume);

  // API mutations
  const [sendAgentMessage] = useSendAgentMessageMutation();
  const [startAgentSimulation] = useStartAgentSimulationMutation();
  const [stopAgentSimulation] = useStopAgentSimulationMutation();
  const [resetAgentSimulation] = useResetAgentSimulationMutation();

  // Learning API mutations and queries
  const [sendLearningData] = useSendLearningDataMutation();
  const [getLearningTaskStatus] = useLazyGetLearningTaskStatusQuery();
  const [uploadPdfForChat] = useUploadPdfForChatMutation();
  const [notifyPdfRemoved] = useNotifyPdfRemovedMutation();

  // Financial API mutations and queries
  const [startFinancialSimulation] = useStartFinancialSimulationMutation();
  const [getFinancialSimulationResults] =
    useLazyGetFinancialSimulationResultsQuery();
  const [getSimulationStatus] = useLazyGetSimulationStatusQuery();
  const [getSimulationResultsByTaskId] =
    useLazyGetSimulationResultsByTaskIdQuery();

  // Custom audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioVolume] = useState(audioVolumeFromStore);
  const [isMuted] = useState(!audioEnabled);
  const audioRef = useRef(null);

  const [agents, setAgents] = useState([
    {
      id: 1,
      name: "EduMentor",
      type: "education",
      status: "idle",
      color: "#10B981", // Green
      icon: BookOpen,
      confidence: 0.85,
      goal: "Knowledge transfer",
      description: "Specialized in educational content and academic guidance",
    },
    {
      id: 2,
      name: "FinancialCrew",
      type: "financial",
      status: "idle",
      color: "#3B82F6", // Blue
      icon: DollarSign,
      confidence: 0.78,
      goal: "Financial literacy",
      description: "Expert in financial planning and investment strategies",
    },
    {
      id: 3,
      name: "WellnessBot",
      type: "wellness",
      status: "idle",
      color: "#F97316", // Orange
      icon: Heart,
      confidence: 0.92,
      goal: "Health optimization",
      description: "Focused on mental and physical wellbeing advice",
    },
  ]);

  // Financial simulation form state
  const [financialProfile, setFinancialProfile] = useState({
    name: "",
    monthlyIncome: "",
    expenses: [{ id: 1, name: "", amount: "" }],
    financialGoal: "",
    financialType: "Conservative", // Can be "Conservative", "Moderate", or "Aggressive"
    riskLevel: "Low", // Can be "Low", "Medium", or "High"
  });

  // Financial simulation processing state
  const [isProcessingSimulation, setIsProcessingSimulation] = useState(false);
  const [simulationTaskId, setSimulationTaskId] = useState(null);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const refreshIntervalRef = useRef(null);

  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [selectedPdfs, setSelectedPdfs] = useState([]);
  const [activePdfId, setActivePdfId] = useState(null);
  const fileInputRef = useRef(null);

  const [isTimelineOpen, setIsTimelineOpen] = useState(true);
  const [agentInsights, setAgentInsights] = useState({
    mood: "Analytical",
    sentiment: "Positive",
    confidenceTrend: "increasing",
  });

  // State for financial simulation results
  const [simulationResults, setSimulationResults] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(1); // Track which month to display

  const containerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const timelineRef = useRef(null);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Add an initial welcome message on component mount
  useEffect(() => {
    // Add a welcome message to introduce the Learning Assistant
    setMessages([
      {
        id: Date.now(),
        sender: "learning-agent",
        agentName: "Learning Assistant",
        agentColor: "#8B5CF6",
        agentType: "learning",
        content:
          "Welcome to the Agent Simulator! I'm your Learning Assistant, ready to answer your questions and provide personalized learning experiences.",
        isLoading: false,
        timestamp: new Date().toISOString(),
      },
    ]);

    console.log("ADDED WELCOME MESSAGE TO UI");
  }, []);

  // Handle PDF file selection
  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading(`Uploading ${file.name}...`);

    try {
      // Get the user ID from Redux store
      let userId = "guest-user";
      if (user && user.id) {
        userId = user.id;
      }

      // Upload the PDF using RTK Query
      const response = await uploadPdfForChat({
        user_id: userId,
        pdf_file: file,
      }).unwrap();

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(`${file.name} uploaded successfully`, {
        icon: "📄",
        duration: 3000,
      });

      // Add the PDF to the selected PDFs list
      const newPdf = {
        id: response.pdf_id,
        name: file.name,
        size: file.size,
      };

      setSelectedPdfs((prev) => [...prev, newPdf]);

      // Set as active PDF if it's the first one
      if (!activePdfId) {
        setActivePdfId(response.pdf_id);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(
        "Error uploading PDF: " + (error.data?.error || error.message)
      );
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle removing a PDF
  const handleRemovePdf = async (pdfId) => {
    // Get the user ID from Redux store
    let userId = "guest-user";
    if (user && user.id) {
      userId = user.id;
    }

    // Show loading toast
    const loadingToast = toast.loading("Removing PDF...");

    try {
      // Notify the server about PDF removal using RTK Query
      await notifyPdfRemoved({
        user_id: userId,
        pdf_id: pdfId,
      }).unwrap();

      // Update local state
      setSelectedPdfs((prev) => prev.filter((pdf) => pdf.id !== pdfId));

      // If the removed PDF was active, set the first remaining PDF as active
      if (activePdfId === pdfId) {
        const remainingPdfs = selectedPdfs.filter((pdf) => pdf.id !== pdfId);
        setActivePdfId(remainingPdfs.length > 0 ? remainingPdfs[0].id : null);
      }

      // Show success toast
      toast.dismiss(loadingToast);
      toast.success("PDF removed successfully", {
        icon: "🗑️",
        duration: 2000,
      });
    } catch (error) {
      // Still remove the PDF locally even if the server notification fails
      setSelectedPdfs((prev) => prev.filter((pdf) => pdf.id !== pdfId));

      // If the removed PDF was active, set the first remaining PDF as active
      if (activePdfId === pdfId) {
        const remainingPdfs = selectedPdfs.filter((pdf) => pdf.id !== pdfId);
        setActivePdfId(remainingPdfs.length > 0 ? remainingPdfs[0].id : null);
      }

      // Show error toast
      toast.dismiss(loadingToast);
      console.error("Error notifying PDF removal:", error);
      toast.success("PDF removed from chat");
    }
  };

  // Cleanup interval on component unmount
  useEffect(() => {
    // Cleanup function to clear the interval when component unmounts
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []);

  // Animation for container entrance and skew fill setup
  useEffect(() => {
    // Container entrance animation
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );

    // Set up GSAP animations for skew fill effect
    const agentCards = document.querySelectorAll(".agent-card");

    // Function to create skew fill animation
    const createSkewAnimation = (element) => {
      // Create a pseudo-element for the skew animation
      const skewElement = document.createElement("div");
      skewElement.className = "gsap-skew-element";

      // Add the skew element to the parent
      element.style.position = "relative";
      element.style.overflow = "hidden";
      element.appendChild(skewElement);

      // Check if this is an agent card
      const isAgentCard = element.classList.contains("agent-card");

      // Create a subtle hover effect
      element.addEventListener("mouseenter", () => {
        // Skip animation if this is a selected agent card
        if (isAgentCard && element.classList.contains("selected-agent")) {
          return;
        }

        // First, subtle shadow effect (unless it's already selected)
        // Don't use y transform for insight panels to avoid layout shifts
        if (
          element.classList.contains("insight-panel") ||
          element.classList.contains("insight-card")
        ) {
          gsap.to(element, {
            boxShadow: "0 3px 10px rgba(0, 0, 0, 0.08)",
            duration: 0.3,
            ease: "power2.out",
          });
        } else {
          gsap.to(element, {
            y: isAgentCard ? -2 : -1,
            boxShadow: isAgentCard
              ? "0 5px 15px rgba(0, 0, 0, 0.1)"
              : "0 3px 10px rgba(0, 0, 0, 0.08)",
            duration: 0.3,
            ease: "power2.out",
          });
        }

        // Then, the skew animation
        gsap.fromTo(
          skewElement,
          { left: "-120%", opacity: 0.8, width: "80%" },
          {
            left: "120%",
            opacity: 1,
            width: "80%",
            duration: 0.7,
            ease: "power1.inOut",
          }
        );
      });

      // Reset on mouse leave
      element.addEventListener("mouseleave", () => {
        // Skip animation if this is a selected agent card
        if (isAgentCard && element.classList.contains("selected-agent")) {
          return;
        }

        // Reset position and shadow
        if (
          element.classList.contains("insight-panel") ||
          element.classList.contains("insight-card")
        ) {
          gsap.to(element, {
            boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
            duration: 0.3,
            ease: "power2.out",
          });
        } else {
          gsap.to(element, {
            y: 0,
            boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
            duration: 0.3,
            ease: "power2.out",
          });
        }

        // Reset skew element
        gsap.set(skewElement, { left: "-120%", opacity: 0.8, width: "80%" });
      });

      // Special animation for selected agent cards
      if (isAgentCard) {
        // Create a periodic subtle glow animation for selected cards
        const createSelectedAnimation = () => {
          if (element.classList.contains("selected-agent")) {
            // Subtle pulsing glow effect
            gsap.fromTo(
              skewElement,
              { left: "-120%", opacity: 0.7, width: "80%" },
              {
                left: "120%",
                opacity: 1,
                width: "80%",
                duration: 1.5,
                ease: "power1.inOut",
                onComplete: () => {
                  // Reset and repeat after a delay
                  gsap.set(skewElement, {
                    left: "-120%",
                    opacity: 0.7,
                    width: "80%",
                  });
                  gsap.delayedCall(3, createSelectedAnimation);
                },
              }
            );
          }
        };

        // Set up a mutation observer to watch for class changes
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === "class") {
              // Check if the selected-agent class was added
              if (element.classList.contains("selected-agent")) {
                createSelectedAnimation();
              }
            }
          });
        });

        // Start observing the element
        observer.observe(element, { attributes: true });
      }
    };

    // Apply to timeline items - we need to target the actual card divs
    document
      .querySelectorAll(".timeline-item > div")
      .forEach(createSkewAnimation);

    // Apply to agent insight panel cards
    document.querySelectorAll(".insight-card").forEach(createSkewAnimation);

    // Apply to the entire insight panel
    document.querySelectorAll(".insight-panel").forEach(createSkewAnimation);

    // Apply to agent cards
    agentCards.forEach(createSkewAnimation);
  }, []);

  // Handle financial profile changes
  const handleFinancialProfileChange = (field, value) => {
    setFinancialProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle expense changes
  const handleExpenseChange = (id, field, value) => {
    setFinancialProfile((prev) => ({
      ...prev,
      expenses: prev.expenses.map((expense) =>
        expense.id === id ? { ...expense, [field]: value } : expense
      ),
    }));
  };

  // Add new expense
  const addExpense = () => {
    setFinancialProfile((prev) => ({
      ...prev,
      expenses: [
        ...prev.expenses,
        {
          id: prev.expenses.length + 1,
          name: "",
          amount: "",
        },
      ],
    }));
  };

  // Remove expense
  const removeExpense = (id) => {
    setFinancialProfile((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((expense) => expense.id !== id),
    }));
  };

  // Fetch simulation results from the API (by task ID, new backend structure)
  const fetchSimulationResultsByTaskId = async (taskId, isInitialFetch = false) => {
    try {
      setIsLoadingResults(true);
      const response = await getSimulationResultsByTaskId(taskId).unwrap();
      // response: { status, ready, message, data, ... }
      if (response.status === "error") {
        toast.error(response.message || "Error fetching simulation results");
        setSimulationResults(null);
        setIsProcessingSimulation(false); // Ensure processing stops on explicit error
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
        return null;
      }
      if (response.ready && response.data) {
        setSimulationResults(response.data);
        // Add a system message about the completed simulation only once
        if (isInitialFetch) {
          const hasResultsLoadedMessage = (prev) =>
            prev.some(
              (msg) =>
                msg.sender === "system" &&
                msg.content === "Financial simulation results have been loaded."
            );
          setMessages((prev) => {
            if (!hasResultsLoadedMessage(prev)) {
              return [
                ...prev,
                {
                  id: Date.now(),
                  sender: "system",
                  content: "Financial simulation results have been loaded.",
                  timestamp: new Date().toISOString(),
                },
              ];
            }
            return prev;
          });
        }
        setIsProcessingSimulation(false);
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
        return response.data;
      } else if (response.status === "completed") { // New condition for completed status even if not 'ready'
        setSimulationResults(response.data || null); // Display whatever data is available
        toast.success("Financial simulation completed (results may be partial).");
        setIsProcessingSimulation(false);
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
        return response.data || null;
      } else {
        // Not ready yet, keep polling
        setIsProcessingSimulation(true);
        if (!refreshIntervalRef.current) {
          startRefreshInterval();
        }
        if (isInitialFetch) {
          const hasProcessingMessage = (prev) =>
            prev.some(
              (msg) =>
                msg.sender === "system" &&
                msg.content ===
                  "Financial simulation is processing. Results will update automatically."
            );
          setMessages((prev) => {
            if (!hasProcessingMessage(prev)) {
              return [
                ...prev,
                {
                  id: Date.now(),
                  sender: "system",
                  content:
                    "Financial simulation is processing. Results will update automatically.",
                  timestamp: new Date().toISOString(),
                },
              ];
            }
            return prev;
          });
        }
        return null;
      }
    } catch (error) {
        toast.error("Could not load simulation results. Please try again.");
      setSimulationResults(null);
      return null;
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Start the interval to refresh simulation results
  const startRefreshInterval = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    refreshIntervalRef.current = setInterval(async () => {
      if (isProcessingSimulation && simulationTaskId) {
        await fetchSimulationResultsByTaskId(simulationTaskId, false);
      } else {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }, 2000);
  };

  // Send financial simulation data to the API
  const sendFinancialSimulationData = async () => {
    try {
      setIsLoadingResults(true);
      const total_expenses = financialProfile.expenses.reduce(
        (total, expense) => total + (parseFloat(expense.amount) || 0),
        0
      );
      const user_inputs = {
        user_id: user?.id || "anonymous-user",
        user_name: financialProfile.name || "User",
        income: parseFloat(financialProfile.monthlyIncome) || 0,
        expenses: financialProfile.expenses.map((expense) => ({
          name: expense.name,
          amount: parseFloat(expense.amount) || 0,
        })),
        total_expenses: total_expenses,
        goal: financialProfile.financialGoal,
        financial_type: financialProfile.financialType.toLowerCase(),
        risk_level: financialProfile.riskLevel.toLowerCase(),
      };
      const data = await startFinancialSimulation(user_inputs).unwrap();
      if (data && data.task_id) {
        setSimulationTaskId(data.task_id);
        setSimulationProgress(0);
        toast.success("Financial simulation started successfully");
        setIsProcessingSimulation(true);
        startRefreshInterval();
        setMessages((prev) => {
          const hasStartedMessage = prev.some(
            (msg) =>
              msg.sender === "system" &&
              msg.content ===
                "Financial simulation is processing. Results will update automatically."
          );
          if (!hasStartedMessage) {
            return [
              ...prev,
              {
                id: Date.now(),
                sender: "system",
                content:
                  "Financial simulation is processing. Results will update automatically.",
                timestamp: new Date().toISOString(),
              },
            ];
          }
          return prev;
        });
        // Immediately fetch results (will show 'processing' message if not ready)
        await fetchSimulationResultsByTaskId(data.task_id, true);
      } else {
        toast.success("Financial simulation data sent successfully");
        setIsProcessingSimulation(true);
        await fetchSimulationResultsByTaskId(simulationTaskId, true);
        startRefreshInterval();
      }
      return data;
    } catch (error) {
      toast.error("Financial simulation error: " + error.message);
      return null;
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Start simulation
  const startSimulation = async () => {
    if (agents.length === 0) {
      toast.error("Add at least one agent to start simulation");
      return;
    }

    setIsSimulating(true);

    // Determine which agent to activate
    let activeAgentId;

    if (selectedAgent) {
      // If an agent is selected, activate only that agent
      activeAgentId = selectedAgent;
    } else {
      // If no agent is selected, activate the first agent
      activeAgentId = agents[0].id;
      // Also set it as selected
      setSelectedAgent(activeAgentId);
    }

    // Update agent statuses - only activate the selected agent
    setAgents(
      agents.map((agent) => ({
        ...agent,
        status: agent.id === activeAgentId ? "active" : "idle",
      }))
    );

    // Add initial system message - clear previous messages
    const startMessage = {
      id: Date.now(),
      sender: "system",
      content: `Agent simulation started. ${
        agents.find((a) => a.id === activeAgentId).name
      } is active and ready to assist.`,
      timestamp: new Date().toISOString(),
    };

    // Reset messages to just the start message
    setMessages([startMessage]);

    // Get the active agent
    const activeAgent = agents.find((a) => a.id === activeAgentId);

    // Log agent start in Supabase
    try {
      const userId = user?.id || "guest-user";
      await agentLogsService.logAgentStart({
        userId,
        agentId: activeAgent.id,
        agentName: activeAgent.name,
        agentType: activeAgent.type,
      });
      console.log(
        `Logged agent start: ${activeAgent.name} (${activeAgent.id})`
      );
    } catch (error) {
      console.error("Error logging agent start:", error);
      // Continue with simulation even if logging fails
    }

    // Call the appropriate API to start the simulation based on agent type
    if (activeAgent && activeAgent.type === "financial") {
      try {
        await sendFinancialSimulationData();
        // sendFinancialSimulationData already sets the task_id and starts polling.
      } catch (error) {
        console.error("Error in financial simulation during startup:", error);
        toast.error("Financial simulation failed to start.");
      }
    } else {
      // For non-financial agents, use startAgentSimulation
    try {
      const payload = {
        agentId: activeAgentId,
          userId: user?.id || "anonymous-user",
        };
      await startAgentSimulation(payload).unwrap();
      toast.success("Simulation started");
    } catch (error) {
        console.error("Failed to start agent simulation:", error);
      if (error?.status === 404) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "system",
            content:
                "The agent server is currently unavailable. Running in local mode.",
            timestamp: new Date().toISOString(),
          },
        ]);
        toast.error("Simulation server unavailable. Running in local mode.");
      } else {
        toast.success("Simulation started in local mode");
      }
      }
    }
  };

  // Stop simulation
  const stopSimulation = async () => {
    setIsSimulating(false);

    // Find the active agent before updating statuses
    const activeAgent = agents.find((a) => a.status === "active");

    // Update agent statuses
    setAgents(
      agents.map((agent) => ({
        ...agent,
        status: "idle",
      }))
    );

    // Add system message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "system",
        content: "Simulation paused.",
        timestamp: new Date().toISOString(),
      },
    ]);

    // Log agent stop in Supabase
    if (activeAgent) {
      try {
        const userId = user?.id || "guest-user";
        await agentLogsService.logAgentStop({
          userId,
          agentId: activeAgent.id,
        });
        console.log(
          `Logged agent stop: ${activeAgent.name} (${activeAgent.id})`
        );
      } catch (error) {
        console.error("Error logging agent stop:", error);
        // Continue with simulation even if logging fails
      }
    }

    // Call the API to stop the simulation
    try {
      if (activeAgent) {
        await stopAgentSimulation({
          agentId: activeAgent.id,
          userId: user?.id || "anonymous-user", // Use Supabase user ID or fallback to anonymous user
        }).unwrap();
      }
      toast.success("Simulation paused");
    } catch (error) {
      console.error("Failed to stop simulation:", error);

      // Check for 404 error
      if (error?.status === 404) {
        // Just log the error, no need to show a message to the user since we're already in local mode
        console.log(
          "Simulation server unavailable. Already running in local mode."
        );
      } else {
        // For other errors, just show a toast
        toast.success("Simulation paused in local mode");
      }

      // Continue with local simulation even if API call fails
    }
  };

  // Reset simulation
  const resetSimulation = async () => {
    setIsSimulating(false);
    setMessages([]);

    // Reset agent statuses
    setAgents(
      agents.map((agent) => ({
        ...agent,
        status: "idle",
      }))
    );

    // Log agent reset in Supabase
    try {
      const userId = user?.id || "anonymous-user";
      await agentLogsService.logAgentReset({ userId });
      console.log(`Logged agent reset for user: ${userId}`);
    } catch (error) {
      console.error("Error logging agent reset:", error);
      // Continue with simulation even if logging fails
    }

    // Call the API to reset the simulation
    try {
      await resetAgentSimulation({
        userId: user?.id || "anonymous-user", // Use Supabase user ID or fallback to anonymous user
      }).unwrap();
      toast.success("Simulation reset");
    } catch (error) {
      console.error("Failed to reset simulation:", error);

      // Check for 404 error
      if (error?.status === 404) {
        // Just log the error, no need to show a message to the user since we're already in local mode
        console.log(
          "Simulation server unavailable. Already running in local mode."
        );
        toast.success("Simulation reset in local mode");
      } else {
        // For other errors, just show a toast
        toast.success("Simulation reset in local mode");
      }

      // Continue with local simulation even if API call fails
    }
  };

  // Function to fetch learning response from a task ID using RTK Query
  const fetchLearningResponse = async (taskId) => {
    try {
      console.log("FETCHING LEARNING RESPONSE FOR TASK:", taskId);

      // Log the current messages state before fetching
      console.log("MESSAGES BEFORE FETCH:", messages);

      console.log("STARTING RTK QUERY OPERATION...");
      const data = await getLearningTaskStatus(taskId).unwrap();
      console.log("RTK QUERY RESPONSE:", data);
      console.log("RESPONSE FIELD:", data.response);

      // Check the status of the response
      if (data && data.status) {
        console.log("RESPONSE STATUS:", data.status);

        // If the status is "completed", show the final response
        if (data.status === "completed" && data.response) {
          console.log("TASK COMPLETED! Showing final response");

          // FORCE ADD a new message with the final response
          console.log("FORCE ADDING FINAL RESPONSE TO UI");

          // First, remove any loading messages
          setMessages((prev) =>
            prev.filter(
              (msg) => !(msg.sender === "learning-agent" && msg.isLoading)
            )
          );

          // Then add the new response message
          setTimeout(() => {
            const finalMessage = {
              id: Date.now(),
              sender: "learning-agent",
              agentName: "Learning Assistant",
              agentColor: "#8B5CF6",
              agentType: "learning",
              content: data.response,
              isLoading: false,
              timestamp: new Date().toISOString(),
            };

            console.log("ADDING FINAL MESSAGE:", finalMessage);

            setMessages((prev) => [...prev, finalMessage]);

            // Force a re-render
            setTimeout(() => {
              console.log("FORCING RE-RENDER");
              setMessages((prev) => [...prev]);
            }, 100);
          }, 100);

          console.log("ADDED FINAL RESPONSE TO UI:", data.response);
          return data;
        }
        // If the status is "running" or "queued", poll again after a delay
        else if (data.status === "running" || data.status === "queued") {
          console.log("TASK STILL RUNNING. Will check again in 2 seconds");

          // Update any existing loading message or add a new one
          setMessages((prev) => {
            // Find any existing loading message
            const loadingMessageIndex = prev.findIndex(
              (msg) => msg.sender === "learning-agent" && msg.isLoading
            );

            if (loadingMessageIndex >= 0) {
              // Update the existing loading message
              console.log("Updating existing loading message");
              const updatedMessages = [...prev];
              updatedMessages[loadingMessageIndex] = {
                ...updatedMessages[loadingMessageIndex],
                content: data.response || "Still processing your request...",
                timestamp: new Date().toISOString(),
              };
              return updatedMessages;
            } else {
              // Add a new loading message
              console.log("Adding new loading message");
              return [
                ...prev,
                {
                  id: Date.now(),
                  sender: "learning-agent",
                  agentName: "Learning Assistant",
                  agentColor: "#8B5CF6",
                  agentType: "learning",
                  content: data.response || "Processing your request... ⏳",
                  isLoading: true,
                  timestamp: new Date().toISOString(),
                },
              ];
            }
          });

          // Poll again after 1 second
          setTimeout(() => {
            console.log("Polling again for task:", taskId);
            fetchLearningResponse(taskId);
          }, 1000);

          return data;
        }
      } else if (data && data.response) {
        // Fallback for when status is not provided but response is
        console.log(
          "NO STATUS FIELD BUT RESPONSE FOUND. Showing response directly."
        );

        // FORCE ADD a new message with the direct response
        console.log("FORCE ADDING DIRECT RESPONSE TO UI");

        // First, remove any loading messages
        setMessages((prev) =>
          prev.filter(
            (msg) => !(msg.sender === "learning-agent" && msg.isLoading)
          )
        );

        // Then add the new response message
        setTimeout(() => {
          const finalMessage = {
            id: Date.now(),
            sender: "learning-agent",
            agentName: "Learning Assistant",
            agentColor: "#8B5CF6",
            agentType: "learning",
            content: data.response,
            isLoading: false,
            timestamp: new Date().toISOString(),
          };

          console.log("ADDING DIRECT MESSAGE:", finalMessage);

          setMessages((prev) => [...prev, finalMessage]);

          // Force a re-render
          setTimeout(() => {
            console.log("FORCING RE-RENDER");
            setMessages((prev) => [...prev]);
          }, 100);
        }, 100);

        console.log("ADDED RESPONSE TO UI:", data.response);
        return data;
      } else {
        console.error("NO RESPONSE OR STATUS FIELD FOUND IN DATA:", data);

        // Add an error message
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "system",
            content: "No response received from the server.",
            timestamp: new Date().toISOString(),
          },
        ]);

        return null;
      }
    } catch (error) {
      console.error("ERROR FETCHING RESPONSE:", error);

      // Add an error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "system",
          content: "Error connecting to the learning service.",
          timestamp: new Date().toISOString(),
        },
      ]);

      return null;
    }
  };

  // Function to poll for task status - kept for backward compatibility
  // eslint-disable-next-line no-unused-vars
  const pollTaskStatus = async (
    taskId,
    userId,
    maxAttempts = 60, // Increased max attempts since we're polling more frequently
    interval = 1500 // 1.5 seconds between polls as recommended (1-2 seconds)
  ) => {
    let attempts = 0;

    // Add a loading message
    const loadingMessageId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      {
        id: loadingMessageId,
        sender: "learning-agent",
        agentName: "Learning Assistant",
        agentColor: "#8B5CF6", // Purple color for learning agent
        agentType: "learning",
        content: "Your question is being processed...",
        isLoading: true,
        timestamp: new Date().toISOString(),
      },
    ]);

    // Start polling
    const poll = async () => {
      if (attempts >= maxAttempts) {
        // Replace loading message with timeout message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingMessageId
              ? {
                  ...msg,
                  content:
                    "Sorry, it's taking longer than expected to process your request. Please try again later.",
                  isLoading: false,
                }
              : msg
          )
        );
        return null;
      }

      attempts++;

      try {
        // Try direct fetch first using the dynamic API base URL
        // Example: ${API_BASE_URL}/user/learning/af3c9b32-48ff-4ca3-afbd-4e88e475c0d6
        const directUrl = `${API_BASE_URL}/user/learning/${taskId}`;
        console.log(`Polling attempt ${attempts} - Direct URL:`, directUrl);

        let statusResponse;

        try {
          // Use RTK Query to get learning task status
          statusResponse = await getLearningTaskStatus(taskId).unwrap();
          console.log(`RTK Query response:`, statusResponse);
        } catch (rtkError) {
          console.error("Error with RTK Query:", rtkError);
          statusResponse = null;
        }

        console.log(`Polling attempt ${attempts} - Response:`, statusResponse);

        // Check if we have a valid response
        if (statusResponse) {
          // Check if the task is complete based on the status field
          // Handle both the API function response format and the direct URL response format
          const isCompleted =
            statusResponse.status === "completed" ||
            (statusResponse.response && !statusResponse.isLoading);

          if (isCompleted) {
            // Extract the response content - handle both formats
            // Format 1: From API function with response field
            // Format 2: From direct URL with response field
            let responseContent = null;

            if (statusResponse.response) {
              responseContent = statusResponse.response;
            } else if (
              statusResponse.chat_history &&
              statusResponse.chat_history.length > 0
            ) {
              // Get the last assistant message from chat history
              const assistantMessages = statusResponse.chat_history.filter(
                (msg) => msg.role === "assistant"
              );
              if (assistantMessages.length > 0) {
                responseContent =
                  assistantMessages[assistantMessages.length - 1].content;
              }
            }

            if (responseContent) {
              console.log(
                "Found response content to display:",
                responseContent
              );

              // Replace loading message with actual response
              setMessages((prev) => {
                const updatedMessages = prev.map((msg) =>
                  msg.id === loadingMessageId
                    ? {
                        ...msg,
                        content: responseContent,
                        isLoading: false,
                      }
                    : msg
                );
                console.log("Updated messages:", updatedMessages);
                return updatedMessages;
              });

              // Log the updated state after a short delay to ensure state has been updated
              setTimeout(() => {
                console.log("Current messages state after update:", messages);
              }, 100);

              // Show a toast notification to confirm the response was received
              toast.success("Learning task completed successfully!", {
                icon: "🎓",
                duration: 3000,
              });

              return statusResponse;
            } else {
              // No valid response content found
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === loadingMessageId
                    ? {
                        ...msg,
                        content:
                          "Sorry, I couldn't generate a proper response. Please try again.",
                        isLoading: false,
                      }
                    : msg
                )
              );
              return null;
            }
          } else if (statusResponse.status === "failed") {
            // Replace loading message with error message
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === loadingMessageId
                  ? {
                      ...msg,
                      content:
                        statusResponse.error ||
                        "Sorry, there was an error processing your request.",
                      isLoading: false,
                    }
                  : msg
              )
            );
            return null;
          } else if (
            statusResponse.status === "queued" ||
            statusResponse.status === "running" ||
            statusResponse.status === "processing"
          ) {
            // Task is still in progress, continue polling
            // Update the loading message with appropriate text based on status
            const statusText =
              statusResponse.status === "queued"
                ? "Your question is in queue..."
                : "Processing your request...";

            if (attempts % 3 === 0) {
              // Update the message every 3 attempts
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === loadingMessageId
                    ? {
                        ...msg,
                        content: statusText,
                      }
                    : msg
                )
              );
            }
          }

          // Wait for the specified interval
          await new Promise((resolve) => setTimeout(resolve, interval));

          // Continue polling
          return poll();
        } else {
          // Replace loading message with error message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === loadingMessageId
                ? {
                    ...msg,
                    content:
                      "Sorry, there was an error checking the status of your request.",
                    isLoading: false,
                  }
                : msg
            )
          );
          return null;
        }
      } catch (error) {
        console.error("Error polling task status:", error);

        // Replace loading message with error message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingMessageId
              ? {
                  ...msg,
                  content:
                    "Sorry, there was an error checking the status of your request.",
                  isLoading: false,
                }
              : msg
          )
        );
        return null;
      }
    };

    return poll();
  };

  // Handle user input submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!userInput.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: "user",
      content: userInput,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = userInput;
    setUserInput("");

    // Get the user ID from Supabase auth - define it at the beginning of the function
    // so it's available throughout the entire function scope
    let userId = "anonymous-user";

    // Use the user ID from Redux store if available
    if (user && user.id) {
      userId = user.id;
      console.log("Using authenticated user ID:", userId);
    } else {
      console.log("No authenticated user found, using anonymous-user");
    }

    // Always send the user message to the learning endpoint
    try {
      console.log("Sending user message to learning endpoint:", messageText);

      // Only use PDF ID if there's an active PDF
      let documentId = null;

      // If there's an active PDF, use its ID
      if (activePdfId) {
        documentId = activePdfId;
      }
      // If simulation is running, use agent type as context
      else if (isSimulating) {
        const activeAgent = agents.find((a) => a.status === "active");
        if (activeAgent) {
          // Don't set documentId here - we'll let the backend handle it
          // Just log the agent type for debugging
          console.log("Active agent type:", activeAgent.type);
        }
      }

      // For simulation mode, use synchronous processing (wait=true)
      // For learning mode, use asynchronous processing (wait=false)
      const wait = isSimulating;

      // Prepare the learning data payload
      const learningPayload = {
        user_id: userId,
        query: messageText,
        ...(documentId && { pdf_id: documentId }),
      };

      const learningResponse = await sendLearningData(learningPayload).unwrap();

      // If simulation is not running, display the learning API response
      if (!isSimulating) {
        // Check if this is an asynchronous response with a task_id
        // Check if we have a learning_task_id in the response (primary method)
        if (learningResponse && learningResponse.learning_task_id) {
          const taskId = learningResponse.learning_task_id;
          console.log("TASK ID RECEIVED:", taskId);

          // Add an initial loading message
          const loadingMessageId = Date.now();
          setMessages((prev) => [
            ...prev,
            {
              id: loadingMessageId,
              sender: "learning-agent",
              agentName: "Learning Assistant",
              agentColor: "#8B5CF6",
              agentType: "learning",
              content: "Processing your request... ⏳",
              isLoading: true,
              timestamp: new Date().toISOString(),
            },
          ]);

          // Fetch the response using the dynamic learning_task_id
          fetchLearningResponse(taskId);
        }
        // Fallback to the old format if learning_task_id is not available
        else if (
          learningResponse &&
          learningResponse.success &&
          learningResponse.isAsync &&
          learningResponse.task_id
        ) {
          const taskId = learningResponse.task_id;
          console.log("FALLBACK TASK ID RECEIVED:", taskId);

          // Add an initial loading message
          const loadingMessageId = Date.now();
          setMessages((prev) => [
            ...prev,
            {
              id: loadingMessageId,
              sender: "learning-agent",
              agentName: "Learning Assistant",
              agentColor: "#8B5CF6",
              agentType: "learning",
              content: "Processing your request... ⏳",
              isLoading: true,
              timestamp: new Date().toISOString(),
            },
          ]);

          // Fetch the response using the dynamic task_id
          fetchLearningResponse(taskId);
        }
        // Handle synchronous response or immediate result
        else if (learningResponse && learningResponse.response) {
          // Extract the response content from the API response
          const responseContent = learningResponse.response;

          console.log("Displaying learning API response:", responseContent);

          // Add the learning API response as a message from the "learning" agent
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: "learning-agent",
              agentName: "Learning Assistant",
              agentColor: "#8B5CF6", // Purple color for learning agent
              agentType: "learning",
              content: responseContent,
              timestamp: new Date().toISOString(),
            },
          ]);
        } else if (learningResponse && learningResponse.error) {
          // If there was an error, show an error message
          console.warn(
            "Warning: Learning endpoint returned an error:",
            learningResponse.error
          );

          // Add an error message
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: "system",
              content: `Sorry, I couldn't process your request. ${learningResponse.error}`,
              timestamp: new Date().toISOString(),
            },
          ]);
        } else {
          // If no valid response, show a generic message
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: "system",
              content:
                "Your message has been received, but I couldn't generate a response. Please try again.",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
        return;
      }

      // Log success/error for debugging (when simulation is running)
      if (learningResponse.success || learningResponse.response) {
        console.log(
          "Successfully sent message to learning endpoint:",
          learningResponse
        );
      } else {
        console.warn(
          "Warning: Learning endpoint returned an error:",
          learningResponse.error || "Unknown error"
        );
      }
    } catch (error) {
      console.error("Error sending message to learning endpoint:", error);

      // If simulation is not running, show an error message
      if (!isSimulating) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "system",
            content:
              "Sorry, there was an error processing your message. Please try again later.",
            timestamp: new Date().toISOString(),
          },
        ]);
        return;
      }
    }

    // Get the active agent (should be the selected one)
    const activeAgent = agents.find((a) => a.status === "active");

    if (!activeAgent) {
      // If no active agent is found, show an error
      toast.error("No active agent found. Please restart the simulation.");
      return;
    }

    // Use the active agent as the responding agent
    const respondingAgent = activeAgent;

    // Generate a confidence score with slight variation
    const baseConfidence = respondingAgent.confidence;
    const confidenceVariation = Math.random() * 0.1 - 0.05; // -0.05 to +0.05
    const newConfidence = Math.min(
      0.99,
      Math.max(0.5, baseConfidence + confidenceVariation)
    );

    // Update the agent's confidence score
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === respondingAgent.id
          ? { ...agent, confidence: newConfidence }
          : agent
      )
    );

    // Handle message submission based on agent type
      if (respondingAgent.type === "financial") {
      try {
        // For financial agent, send financial simulation data
          await sendFinancialSimulationData();
        // The sendFinancialSimulationData function already handles setting taskId and polling.
        // No further action (like calling sendAgentMessage or fetchSimulationResultsByTaskId) is needed here.
        } catch (error) {
          console.error(
            "Error in financial simulation during message submission:",
            error
          );
        toast.error("Financial simulation message failed.");
      }
    } else {
      // For non-financial agents, send the message to the general agent API
      try {
        // Prepare payload
        const payload = {
          message: messageText,
          agentId: respondingAgent.id,
          userId: userId,
        };

      // Call the API to send the message
      const response = await sendAgentMessage(payload).unwrap();

      // If we get a response from the API, use it
      if (response && response.content) {
        // Create the agent message with the API response
        const agentMessage = {
          id: Date.now() + 1,
          sender: respondingAgent.id,
          agentName: respondingAgent.name,
          agentColor: respondingAgent.color,
          agentType: respondingAgent.type,
          content: response.content,
          timestamp: new Date().toISOString(),
          confidence: response.confidence || newConfidence,
          audioUrl: response.audioUrl || null,
        };

        // Update messages
        setMessages((prev) => [...prev, agentMessage]);

        // Update agent insights based on the response
        setAgentInsights({
          mood: response.mood || "Analytical",
          sentiment: response.sentiment || "Positive",
          confidenceTrend:
            response.confidenceTrend ||
            (newConfidence > respondingAgent.confidence
              ? "increasing"
              : "decreasing"),
        });

        return;
      }
    } catch (error) {
      console.error("Failed to send message to API:", error);

      // Check for 404 error
      if (error?.status === 404) {
        // Add a system message about the error (only once per session)
        if (!sessionStorage.getItem("api_404_shown")) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              sender: "system",
              content:
                "The agent server is currently unavailable. Running in local mode.",
              timestamp: new Date().toISOString(),
            },
          ]);
          sessionStorage.setItem("api_404_shown", "true");
        }

        console.log("Agent server unavailable. Running in local mode.");
      }
      // Continue with local simulation if API call fails
    }

    // Fallback to local simulation if API call fails or returns invalid data
    setTimeout(() => {
      // Create the agent message with audio URL (simulated)
      const agentMessage = {
        id: Date.now() + 1,
        sender: respondingAgent.id,
        agentName: respondingAgent.name,
        agentColor: respondingAgent.color,
        agentType: respondingAgent.type,
        content: generateAgentResponse(messageText, respondingAgent),
        timestamp: new Date().toISOString(),
        confidence: newConfidence,
        // In a real app, this would be a real audio URL from the API
        audioUrl:
          Math.random() > 0.3
            ? `${API_BASE_URL}/simulated-audio-${respondingAgent.id}.mp3`
            : null,
      };

      // Update messages
      setMessages((prev) => [...prev, agentMessage]);

      // Update agent insights based on the response
      setAgentInsights({
        mood: ["Analytical", "Helpful", "Inquisitive", "Supportive"][
          Math.floor(Math.random() * 4)
        ],
        sentiment: ["Positive", "Neutral", "Enthusiastic"][
          Math.floor(Math.random() * 3)
        ],
        confidenceTrend:
          newConfidence > respondingAgent.confidence
            ? "increasing"
            : "decreasing",
      });
    }, 1000);
    }
    // No more code here after the if/else block for agent types
  };

  // Generate a simulated agent response based on agent type
  const generateAgentResponse = (input, agent) => {
    // Different response templates based on agent type
    const responsesByType = {
      education: [
        `From an educational perspective, I can help with "${input}". Let me break this down into key learning concepts.`,
        `I've analyzed your question about "${input}" and can provide a structured learning path.`,
        `This is an interesting educational topic. For "${input}", I recommend starting with fundamental concepts first.`,
        `I can create a learning module about "${input}" with practice exercises and assessments.`,
        `Let me connect this query "${input}" to our existing educational resources and curriculum.`,
      ],
      financial: [
        `From a financial analysis standpoint, "${input}" involves several key considerations.`,
        `I've run the numbers on "${input}" and can provide a detailed financial projection.`,
        `For your query about "${input}", I recommend the following financial strategy...`,
        `Let me break down the cost-benefit analysis of "${input}" with both short and long-term projections.`,
        `I can help optimize your financial approach to "${input}" while minimizing potential risks.`,
      ],
      wellness: [
        `From a wellness perspective, "${input}" can be approached with these balanced lifestyle adjustments.`,
        `I've analyzed your wellness query about "${input}" and have some holistic recommendations.`,
        `For optimal wellbeing regarding "${input}", consider these evidence-based practices...`,
        `Let me suggest a personalized wellness plan for "${input}" that fits your lifestyle.`,
        `I can recommend mindfulness techniques specifically tailored to address "${input}".`,
      ],
      custom: [
        `I've analyzed your request: "${input}" and I'm working on a solution.`,
        `Based on my understanding of "${input}", I recommend the following approach...`,
        `I'm processing your input: "${input}". This will require further analysis.`,
        `I've identified several ways to address your request: "${input}".`,
        `Let me collaborate with other agents to solve: "${input}".`,
      ],
    };

    // Get responses for the agent type or use default responses
    const agentType = agent?.type || "custom";
    const typeResponses = responsesByType[agentType] || responsesByType.custom;

    return typeResponses[Math.floor(Math.random() * typeResponses.length)];
  };

  // Audio player functions
  const playAudio = (audioUrl) => {
    if (!audioUrl) return;

    // If audio is disabled in settings, show a toast and return
    if (!audioEnabled) {
      toast.info(
        "Audio is disabled in settings. Enable it to play audio responses."
      );
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    // Create new audio element
    const audio = new Audio(audioUrl);
    audio.volume = audioVolume;
    audio.muted = isMuted;

    // Set current audio and play
    audioRef.current = audio;
    setCurrentAudio(audioUrl);
    setIsPlaying(true);

    // Play the audio
    audio.play().catch((err) => {
      console.error("Error playing audio:", err);
      toast.error("Could not play audio");
    });

    // Add event listeners
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentAudio(null);
    });
  };

  const toggleAudioPlay = (audioUrl) => {
    if (isPlaying && currentAudio === audioUrl) {
      // Pause current audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else if (audioUrl) {
      // Play new audio
      playAudio(audioUrl);
    }
  };

  // Format confidence score as percentage
  const formatConfidence = (confidence) => {
    return `${Math.round(confidence * 100)}%`;
  };

  // Get available months from simulation results
  const getAvailableMonths = (results) => {
    if (!results) return [];

    // Collect all months from different data sections
    const months = new Set();

    // Helper function to process each data section
    const processSection = (section) => {
      if (Array.isArray(section)) {
        section.forEach((item) => {
          if (item.month && !isNaN(Number(item.month))) {
            months.add(Number(item.month)); // Convert to number to ensure proper sorting
          }
        });
      }
    };

    // Process all data sections
    processSection(results.simulated_cashflow);
    processSection(results.discipline_report);
    processSection(results.goal_status);
    processSection(results.financial_strategy);
    processSection(results.karmic_tracker);
    processSection(results.behavior_tracker);
    processSection(results.reflections);
    // Keep these for backward compatibility
    processSection(results.persona_history);
    processSection(results.reflection_month);

    // If no months found, default to month 1
    if (months.size === 0) {
      months.add(1);
    }

    // Convert to array and sort numerically
    const sortedMonths = Array.from(months).sort((a, b) => a - b);

    // Ensure we have at least one month
    return sortedMonths.length > 0 ? sortedMonths : [1];
  };

  // Filter simulation results for a specific month
  const getMonthData = (results, month) => {
    if (!results) return null;

    const filteredData = {
      simulated_cashflow: Array.isArray(results.simulated_cashflow)
        ? results.simulated_cashflow.filter((item) => item.month === month)
        : [],
      discipline_report: Array.isArray(results.discipline_report)
        ? results.discipline_report.filter((item) => item.month === month)
        : [],
      goal_status: Array.isArray(results.goal_status)
        ? results.goal_status.filter((item) => item.month === month)
        : [],
      financial_strategy: Array.isArray(results.financial_strategy)
        ? results.financial_strategy.filter((item) => item.month === month)
        : [],
      karmic_tracker: Array.isArray(results.karmic_tracker)
        ? results.karmic_tracker.filter((item) => item.month === month)
        : [],
      behavior_tracker: Array.isArray(results.behavior_tracker)
        ? results.behavior_tracker.filter((item) => item.month === month)
        : [],
      reflections: Array.isArray(results.reflections)
        ? results.reflections.filter((item) => item.month === month)
        : [],
      // Keep these for backward compatibility
      persona_history: Array.isArray(results.persona_history)
        ? results.persona_history.filter((item) => item.month === month)
        : [],
      reflection_month: Array.isArray(results.reflection_month)
        ? results.reflection_month.filter((item) => item.month === month)
        : [],
    };

    return filteredData;
  };

  // Helper to render all sections for a month (reuse the body of renderSimulationResults)
  const renderMonthSections = (monthData, monthNumber) => {
    if (!monthData) return null;

    const hasData =
      monthData.simulated_cashflow.length > 0 ||
      monthData.discipline_report.length > 0 ||
      monthData.goal_status.length > 0 ||
      monthData.financial_strategy.length > 0 ||
      monthData.karmic_tracker.length > 0 ||
      monthData.persona_history.length > 0 ||
      monthData.behavior_tracker.length > 0 ||
      monthData.reflections.length > 0 ||
      monthData.reflection_month.length > 0;

    if (!hasData) {
      return (
        <div key={`month-${monthNumber}`} className="bg-blue-900/20 rounded-lg p-4 my-4 border border-blue-500/30">
          <h3 className="text-lg font-semibold text-white flex items-center mb-3">
            <DollarSign size={18} className="mr-2 text-blue-400" />
            Month {monthNumber} Details
          </h3>
          <div className="text-center py-4 text-white/70">
            <p>No simulation results available for Month {monthNumber}.</p>
          </div>
        </div>
      );
    }

    return (
      <div key={`month-${monthNumber}`} className="bg-blue-900/20 rounded-lg p-4 my-4 border border-blue-500/30">
        <h3 className="text-lg font-semibold text-white flex items-center mb-3">
              <DollarSign size={18} className="mr-2 text-blue-400" />
          Month {monthNumber} Details
            </h3>

        {/* Cashflow Summary */}
        {monthData.simulated_cashflow.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white/90 mb-2 flex items-center">
              <Wallet size={14} className="mr-1.5 text-blue-400" />
              Cashflow Summary
            </h4>
            <div className="bg-black/20 rounded-md p-3 border border-white/10">
              {monthData.simulated_cashflow.map((cashflow, index) => (
                <div key={`cashflow-${index}`} className="mb-3 last:mb-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-xs text-white/60 mb-1">
                        Total Income
                      </div>
                      <div className="text-sm font-medium text-green-400">
                        ₹{cashflow.income?.total || 0}
                      </div>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-xs text-white/60 mb-1">
                        Total Expenses
                      </div>
                      <div className="text-sm font-medium text-red-400">
                        ₹{cashflow.expenses?.total || 0}
                      </div>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-xs text-white/60 mb-1">Savings</div>
                      <div className="text-sm font-medium text-blue-400">
                        ₹
                        {typeof cashflow.savings === "object" &&
                        cashflow.savings !== null
                          ? cashflow.savings.amount || 0
                          : cashflow.savings || 0}
                      </div>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-xs text-white/60 mb-1">Debt</div>
                      <div className="text-sm font-medium text-orange-400">
                        ₹{cashflow.debt_taken || 0}
                      </div>
                    </div>
                  </div>

                  {/* Income Breakdown */}
                  <div className="mt-3">
                    <div className="text-xs font-medium text-white/80 mb-1">
                      Income Breakdown
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {cashflow.income?.salary > 0 && (
                        <div className="flex justify-between items-center bg-black/20 rounded px-2 py-1">
                          <span className="text-xs text-white/70">Salary</span>
                          <span className="text-xs text-green-400">
                            ₹{cashflow.income.salary}
                          </span>
                        </div>
                      )}
                      {cashflow.income?.freelance > 0 && (
                        <div className="flex justify-between items-center bg-black/20 rounded px-2 py-1">
                          <span className="text-xs text-white/70">
                            Freelance
                          </span>
                          <span className="text-xs text-green-400">
                            ₹{cashflow.income.freelance}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expense Breakdown */}
                  <div className="mt-3">
                    <div className="text-xs font-medium text-white/80 mb-1">
                      Expense Breakdown
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {cashflow.expenses?.needs > 0 && (
                        <div className="flex justify-between items-center bg-black/20 rounded px-2 py-1">
                          <span className="text-xs text-white/70">Needs</span>
                          <span className="text-xs text-red-400">
                            ₹{cashflow.expenses.needs}
                          </span>
                        </div>
                      )}
                      {cashflow.expenses?.wants > 0 && (
                        <div className="flex justify-between items-center bg-black/20 rounded px-2 py-1">
                          <span className="text-xs text-white/70">Wants</span>
                          <span className="text-xs text-red-400">
                            ₹{cashflow.expenses.wants}
                          </span>
                        </div>
                      )}
                      {cashflow.expenses?.luxury > 0 && (
                        <div className="flex justify-between items-center bg-black/20 rounded px-2 py-1">
                          <span className="text-xs text-white/70">Luxury</span>
                          <span className="text-xs text-red-400">
                            ₹{cashflow.expenses.luxury}
                          </span>
                        </div>
                      )}
                      {cashflow.expenses?.emergency > 0 && (
                        <div className="flex justify-between items-center bg-black/20 rounded px-2 py-1">
                          <span className="text-xs text-white/70">
                            Emergency
                          </span>
                          <span className="text-xs text-red-400">
                            ₹{cashflow.expenses.emergency}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Simulation Output */}
                  {cashflow.simulation_output && (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-white/80 mb-1">
                        Simulation Output
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {cashflow.simulation_output.balance && (
                          <div className="flex justify-between items-center bg-black/20 rounded px-2 py-1">
                            <span className="text-xs text-white/70">
                              Balance
                            </span>
                            <span className="text-xs text-green-400">
                              ₹
                              {typeof cashflow.simulation_output.balance ===
                              "number"
                                ? cashflow.simulation_output.balance
                                : JSON.stringify(
                                    cashflow.simulation_output.balance
                                  )}
                            </span>
                          </div>
                        )}
                        {cashflow.simulation_output.savings_rate && (
                          <div className="flex justify-between items-center bg-black/20 rounded px-2 py-1">
                            <span className="text-xs text-white/70">
                              Savings Rate
                            </span>
                            <span className="text-xs text-blue-400">
                              {typeof cashflow.simulation_output
                                .savings_rate === "number"
                                ? `${(
                                    cashflow.simulation_output.savings_rate *
                                    100
                                  ).toFixed(0)}%`
                                : JSON.stringify(
                                    cashflow.simulation_output.savings_rate
                                  )}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {cashflow.simulation_output.notes && (
                        <div className="mt-2 text-xs text-white/70 bg-black/20 p-2 rounded border-l-2 border-blue-400/50">
                          <div className="font-medium text-white/80 mb-1">
                            Notes:
                          </div>
                          {typeof cashflow.simulation_output.notes === "string"
                            ? cashflow.simulation_output.notes
                            : JSON.stringify(cashflow.simulation_output.notes)}
                        </div>
                      )}

                      {/* Investment Recommendation */}
                      {cashflow.simulation_output.investment_recommendation && (
                        <div className="mt-2 text-xs text-white/70 bg-black/20 p-2 rounded border-l-2 border-green-400/50">
                          <div className="font-medium text-white/80 mb-1">
                            Investment Recommendation:
                          </div>
                          {typeof cashflow.simulation_output
                            .investment_recommendation === "string"
                            ? cashflow.simulation_output
                                .investment_recommendation
                            : JSON.stringify(
                                cashflow.simulation_output
                                  .investment_recommendation
                              )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes (fallback for old format) */}
                  {!cashflow.simulation_output && cashflow.notes && (
                    <div className="mt-3 text-xs text-white/70 bg-black/20 p-2 rounded border-l-2 border-blue-400/50">
                      <div className="font-medium text-white/80 mb-1">
                        Notes:
                      </div>
                      {cashflow.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discipline Report */}
        {monthData.discipline_report.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white/90 mb-2 flex items-center">
              <Target size={14} className="mr-1.5 text-blue-400" />
              Discipline Report
            </h4>
            <div className="bg-black/20 rounded-md p-3 border border-white/10">
              {monthData.discipline_report.map((report, index) => (
                <div key={`discipline-${index}`} className="mb-2 last:mb-0">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <div className="mb-2 md:mb-0">
                      <div className="flex items-center">
                        <span
                          className={`inline-block w-3 h-3 rounded-full mr-2 ${
                            (report.discipline_score ||
                              report.financial_discipline_score) >= 0.8
                              ? "bg-green-500"
                              : (report.discipline_score ||
                                  report.financial_discipline_score) >= 0.5
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        ></span>
                        <span className="text-sm font-medium text-white/90">
                          Discipline Score
                        </span>
                      </div>
                      <div className="mt-1 ml-5">
                        <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (report.discipline_score ||
                                report.financial_discipline_score) >= 0.8
                                ? "bg-green-500"
                                : (report.discipline_score ||
                                    report.financial_discipline_score) >= 0.5
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${
                                (report.discipline_score ||
                                  report.financial_discipline_score) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-white/60 mt-1">
                          <span>0</span>
                          <span
                            className={
                              (report.discipline_score ||
                                report.financial_discipline_score) >= 0.8
                                ? "text-green-400"
                                : (report.discipline_score ||
                                    report.financial_discipline_score) >= 0.5
                                ? "text-yellow-400"
                                : "text-red-400"
                            }
                          >
                            {report.discipline_score
                              ? `${report.discipline_score}/10`
                              : report.financial_discipline_score
                              ? `${(
                                  report.financial_discipline_score * 100
                                ).toFixed(0)}%`
                              : "0/10"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rules checked */}
                    {report.rules_checked && (
                      <div className="bg-black/30 rounded p-2 md:w-1/3">
                        <div className="text-xs font-medium text-white/80 mb-1">
                          Rules Checked
                        </div>
                        <div className="space-y-1">
                          {Object.entries(report.rules_checked).map(
                            ([rule, passed], ruleIndex) => (
                              <div
                                key={`rule-${index}-${ruleIndex}`}
                                className="flex items-center"
                              >
                                {passed ? (
                                  <span className="text-green-400 mr-1.5">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-red-400 mr-1.5">✗</span>
                                )}
                                <span className="text-xs text-white/70">
                                  {rule
                                    .split("_")
                                    .map(
                                      (word) =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1)
                                    )
                                    .join(" ")}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Improvement Areas */}
                  {Array.isArray(report.improvement_areas) &&
                    report.improvement_areas.length > 0 && (
                      <div className="mt-3 bg-yellow-900/20 p-2 rounded border-l-2 border-yellow-500/50">
                        <div className="text-xs font-medium text-white/80 mb-1">
                          Improvement Areas:
                        </div>
                        <ul className="list-disc list-inside pl-1 text-xs text-white/70">
                          {report.improvement_areas.map((area, areaIndex) => (
                            <li key={`area-${index}-${areaIndex}`}>
                              {typeof area === "string"
                                ? area
                                : typeof area === "object" && area !== null
                                ? area.title
                                  ? `${area.title}: ${area.description || ""}`
                                  : JSON.stringify(area)
                                : "No improvement area available"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Violations */}
                  {Array.isArray(report.violations) &&
                    report.violations.length > 0 && (
                      <div className="mt-3 bg-red-900/20 p-2 rounded border-l-2 border-red-500/50">
                        <div className="text-xs font-medium text-white/80 mb-1">
                          Violations:
                        </div>
                        <ul className="list-disc list-inside pl-1 text-xs text-white/70">
                          {report.violations.map(
                            (violation, violationIndex) => (
                              <li key={`violation-${index}-${violationIndex}`}>
                                {typeof violation === "string"
                                  ? violation
                                  : typeof violation === "object" &&
                                    violation !== null
                                  ? violation.title
                                    ? `${violation.title}: ${
                                        violation.description || ""
                                      }`
                                    : JSON.stringify(violation)
                                  : "No violation available"}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {/* Discipline Metrics */}
                  {report.discipline_metrics && (
                    <div className="mt-3 bg-blue-900/20 p-2 rounded border-l-2 border-blue-500/50">
                      <div className="text-xs font-medium text-white/80 mb-1">
                        Discipline Metrics:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                        {Object.entries(report.discipline_metrics).map(
                          ([metric, value], metricIndex) => (
                            <div
                              key={`metric-${index}-${metricIndex}`}
                              className="bg-black/20 rounded p-2"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-white/70">
                                  {metric
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </span>
                                <span
                                  className={`text-xs font-medium ${
                                    value >= 0.8
                                      ? "text-green-400"
                                      : value >= 0.5
                                      ? "text-blue-400"
                                      : "text-yellow-400"
                                  }`}
                                >
                                  {(value * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {Array.isArray(report.recommendations) &&
                    report.recommendations.length > 0 && (
                      <div className="mt-3 bg-blue-900/20 p-2 rounded border-l-2 border-blue-500/50">
                        <div className="text-xs font-medium text-white/80 mb-1">
                          Recommendations:
                        </div>
                        <ul className="list-disc list-inside pl-1 text-xs text-white/70">
                          {report.recommendations.map((rec, recIndex) => (
                            <li key={`rec-${index}-${recIndex}`}>
                              {typeof rec === "string"
                                ? rec
                                : typeof rec === "object" && rec !== null
                                ? rec.title
                                  ? `${rec.title}: ${rec.description || ""}`
                                  : JSON.stringify(rec)
                                : "No recommendation available"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goal Status */}
        {monthData.goal_status.length > 0 && monthData.goal_status[0]?.goals && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-white/90 mb-2 flex items-center">
                <Target size={14} className="mr-1.5 text-blue-400" />
                Goal Status
              </h4>
              <div className="bg-black/20 rounded-md p-3 border border-white/10">
                {Array.isArray(monthData.goal_status[0].goals) ? (
                  // Handle array format (old format)
                  monthData.goal_status[0].goals.map((goal, index) => (
                    <div
                      key={`goal-${index}`}
                      className="mb-4 last:mb-0 bg-black/20 rounded-lg p-3"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
                        <div>
                          <div className="flex items-center">
                            <span
                              className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                goal.status === "on_track"
                                  ? "bg-green-500"
                                  : "bg-yellow-500"
                              }`}
                            ></span>
                            <span className="text-sm font-medium text-white/90">
                              {goal.name}
                            </span>
                          </div>
                          <div className="text-xs text-white/60 mt-1 ml-5">
                            Priority: {goal.priority}
                          </div>
                        </div>
                        <span
                          className={`text-xs px-3 py-1 rounded-full mt-2 md:mt-0 ${
                            goal.status === "on_track"
                              ? "bg-green-500/30 text-green-300 border border-green-500/50"
                              : "bg-yellow-500/30 text-yellow-300 border border-yellow-500/50"
                          }`}
                        >
                          {goal.status === "on_track" ? "On Track" : "Behind"}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-white/70 mb-1">
                          <span>
                            Progress: ₹{goal.saved_so_far} / ₹
                            {goal.target_amount}
                          </span>
                          <span>
                            {Math.round(
                              (goal.saved_so_far / goal.target_amount) * 100
                            )}
                            %
                          </span>
                        </div>
                        <div className="h-2.5 bg-black/30 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${
                                (goal.saved_so_far / goal.target_amount) * 100
                              }%`,
                              backgroundColor:
                                goal.status === "on_track"
                                  ? "#10B981"
                                  : "#FBBF24",
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="bg-black/30 rounded p-2">
                          <div className="text-xs text-white/60 mb-1">
                            Expected by now
                          </div>
                          <div className="text-sm font-medium text-blue-400">
                            ₹{goal.expected_by_now}
                          </div>
                        </div>
                        <div className="bg-black/30 rounded p-2">
                          <div className="text-xs text-white/60 mb-1">
                            Saved so far
                          </div>
                          <div
                            className={`text-sm font-medium ${
                              goal.saved_so_far >= goal.expected_by_now
                                ? "text-green-400"
                                : "text-yellow-400"
                            }`}
                          >
                            ₹{goal.saved_so_far}
                          </div>
                        </div>
                      </div>

                      {/* Adjustment suggestion */}
                      {goal.adjustment_suggestion && (
                        <div className="mt-3 bg-blue-900/20 p-2 rounded border-l-2 border-blue-500/50">
                          <div className="text-xs font-medium text-white/80 mb-1">
                            Suggestion:
                          </div>
                          <div className="text-xs text-white/70">
                            {goal.adjustment_suggestion}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : typeof monthData.goal_status[0].goals === "object" ? (
                  // Handle object format (new format)
                  Object.entries(monthData.goal_status[0].goals).map(
                    ([goalName, goalData], index) => (
                      <div
                        key={`goal-${index}`}
                        className="mb-4 last:mb-0 bg-black/20 rounded-lg p-3"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
                          <div>
                            <div className="flex items-center">
                              <span
                                className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                  goalData.status === "on_track"
                                    ? "bg-green-500"
                                    : "bg-yellow-500"
                                }`}
                              ></span>
                              <span className="text-sm font-medium text-white/90">
                                {goalName
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </span>
                            </div>
                            {goalData.monthly_contribution && (
                              <div className="text-xs text-white/60 mt-1 ml-5">
                                Monthly: ₹{goalData.monthly_contribution}
                              </div>
                            )}
                          </div>
                          <span
                            className={`text-xs px-3 py-1 rounded-full mt-2 md:mt-0 ${
                              goalData.status === "on_track"
                                ? "bg-green-500/30 text-green-300 border border-green-500/50"
                                : "bg-yellow-500/30 text-yellow-300 border border-yellow-500/50"
                            }`}
                          >
                            {goalData.status === "on_track"
                              ? "On Track"
                              : goalData.status === "ahead"
                              ? "Ahead"
                              : "Behind"}
                          </span>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-white/70 mb-1">
                            <span>
                              Progress: ₹{goalData.current} / ₹{goalData.target}
                            </span>
                            <span>
                              {goalData.progress_percentage ||
                                Math.round(
                                  (goalData.current / goalData.target) * 100
                                )}
                              %
                            </span>
                          </div>
                          <div className="h-2.5 bg-black/30 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${
                                  goalData.progress_percentage ||
                                  Math.round(
                                    (goalData.current / goalData.target) * 100
                                  )
                                }%`,
                                backgroundColor:
                                  goalData.status === "on_track"
                                    ? "#10B981"
                                    : goalData.status === "ahead"
                                    ? "#3B82F6"
                                    : "#FBBF24",
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="bg-black/30 rounded p-2">
                            <div className="text-xs text-white/60 mb-1">
                              Target Amount
                            </div>
                            <div className="text-sm font-medium text-blue-400">
                              ₹{goalData.target}
                            </div>
                          </div>
                          <div className="bg-black/30 rounded p-2">
                            <div className="text-xs text-white/60 mb-1">
                              Current Amount
                            </div>
                            <div
                              className={`text-sm font-medium ${
                                goalData.status === "ahead"
                                  ? "text-green-400"
                                  : goalData.status === "on_track"
                                  ? "text-blue-400"
                                  : "text-yellow-400"
                              }`}
                            >
                              ₹{goalData.current}
                            </div>
                          </div>
                        </div>

                        {/* Estimated completion */}
                        {goalData.estimated_completion && (
                          <div className="mt-3 bg-blue-900/20 p-2 rounded border-l-2 border-blue-500/50">
                            <div className="text-xs font-medium text-white/80 mb-1">
                              Estimated Completion:
                            </div>
                            <div className="text-xs text-white/70">
                              {goalData.estimated_completion}
                            </div>
                          </div>
                        )}

                        {/* Adjustment suggestion */}
                        {goalData.adjustment && (
                          <div className="mt-3 bg-blue-900/20 p-2 rounded border-l-2 border-blue-500/50">
                            <div className="text-xs font-medium text-white/80 mb-1">
                              Suggestion:
                            </div>
                            <div className="text-xs text-white/70">
                              {goalData.adjustment}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )
                ) : (
                  <div className="text-center py-4 text-white/70">
                    <p>No goal data available for this month.</p>
                  </div>
                )}

                {/* Summary */}
                {monthData.goal_status[0].summary && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="text-xs font-medium text-white/80 mb-2">
                      Summary
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-black/30 rounded p-2">
                        <div className="text-xs text-white/60 mb-1">
                          On Track Goals
                        </div>
                        <div className="text-sm font-medium text-green-400">
                          {monthData.goal_status[0].summary.on_track_goals}
                        </div>
                      </div>
                      <div className="bg-black/30 rounded p-2">
                        <div className="text-xs text-white/60 mb-1">
                          Behind Goals
                        </div>
                        <div className="text-sm font-medium text-yellow-400">
                          {monthData.goal_status[0].summary.behind_goals}
                        </div>
                      </div>
                      <div className="bg-black/30 rounded p-2">
                        <div className="text-xs text-white/60 mb-1">
                          Total Saved
                        </div>
                        <div className="text-sm font-medium text-blue-400">
                          ₹{monthData.goal_status[0].summary.total_saved}
                        </div>
                      </div>
                      <div className="bg-black/30 rounded p-2">
                        <div className="text-xs text-white/60 mb-1">
                          Required by Now
                        </div>
                        <div className="text-sm font-medium text-purple-400">
                          ₹
                          {
                            monthData.goal_status[0].summary
                              .total_required_by_now
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Financial Strategy */}
        {monthData.financial_strategy.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white/90 mb-2 flex items-center">
              <BrainCircuit size={14} className="mr-1.5 text-blue-400" />
              Financial Strategy
            </h4>
            <div className="bg-black/20 rounded-md p-3 border border-white/10">
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-3 mb-3">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center mr-2">
                    <BrainCircuit size={18} className="text-blue-400" />
                  </div>
                  <h5 className="text-sm font-medium text-white/90">
                    Strategic Recommendations
                  </h5>
                </div>

                <div className="space-y-2">
                  {/* Check for old format (traits.recommendations) */}
                  {monthData.financial_strategy[0]?.traits?.recommendations ? (
                    Array.isArray(
                      monthData.financial_strategy[0].traits.recommendations
                    ) ? (
                      monthData.financial_strategy[0].traits.recommendations.map(
                        (rec, index) => (
                          <div
                            key={`strategy-${index}`}
                            className="bg-black/30 rounded-md p-2 flex items-start"
                          >
                            <span className="w-5 h-5 rounded-full bg-blue-500/30 flex-shrink-0 flex items-center justify-center mr-2 mt-0.5">
                              <span className="text-xs text-blue-400 font-medium">
                                {index + 1}
                              </span>
                            </span>
                            <span className="text-sm text-white/80">{rec}</span>
                          </div>
                        )
                      )
                    ) : (
                      <div className="bg-black/30 rounded-md p-2">
                        <span className="text-sm text-white/80">
                          No recommendations available
                        </span>
                      </div>
                    )
                  ) : /* Check for new format (recommendations array) */
                  monthData.financial_strategy[0]?.recommendations ? (
                    Array.isArray(
                      monthData.financial_strategy[0].recommendations
                    ) ? (
                      monthData.financial_strategy[0].recommendations.map(
                        (rec, index) => (
                          <div
                            key={`strategy-${index}`}
                            className="bg-black/30 rounded-md p-2 flex items-start"
                          >
                            <span className="w-5 h-5 rounded-full bg-blue-500/30 flex-shrink-0 flex items-center justify-center mr-2 mt-0.5">
                              <span className="text-xs text-blue-400 font-medium">
                                {index + 1}
                              </span>
                            </span>
                            <span className="text-sm text-white/80">
                              {typeof rec === "string"
                                ? rec
                                : rec.type
                                ? `${rec.type
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (l) =>
                                      l.toUpperCase()
                                    )}: ${rec.reason || rec.amount || ""}`
                                : JSON.stringify(rec)}
                            </span>
                          </div>
                        )
                      )
                    ) : (
                      <div className="bg-black/30 rounded-md p-2">
                        <span className="text-sm text-white/80">
                          No recommendations available
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="bg-black/30 rounded-md p-2">
                      <span className="text-sm text-white/80">
                        No recommendations available
                      </span>
                    </div>
                  )}
                </div>

                {/* Reasoning */}
                {(monthData.financial_strategy[0]?.traits?.reasoning ||
                  monthData.financial_strategy[0]?.reasoning) && (
                  <div className="mt-3 bg-black/30 p-2 rounded border-l-2 border-blue-500/50">
                    <div className="text-xs font-medium text-white/80 mb-1">
                      Reasoning:
                    </div>
                    <div className="text-xs text-white/70">
                      {monthData.financial_strategy[0]?.traits?.reasoning ||
                        monthData.financial_strategy[0]?.reasoning}
                    </div>
                  </div>
                )}
              </div>

              {/* Karmic Tracker */}
              {monthData.karmic_tracker.length > 0 && (
                <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center mr-2">
                      <Target size={18} className="text-purple-400" />
                    </div>
                    <h5 className="text-sm font-medium text-white/90">
                      Karmic Analysis
                    </h5>
                  </div>

                  {/* Karma Score */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-white/70">Karma Score</span>
                      <span className="text-xs font-medium text-purple-400">
                        {monthData.karmic_tracker[0]?.traits?.karma_score ||
                          monthData.karmic_tracker[0]?.karma_score ||
                          0}
                        /100
                      </span>
                    </div>
                    <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                        style={{
                          width: `${
                            monthData.karmic_tracker[0]?.traits?.karma_score ||
                            monthData.karmic_tracker[0]?.karma_score ||
                            0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-white/50 mt-1">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                  </div>

                  {/* Traits */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {((monthData.karmic_tracker[0]?.traits?.sattvic_traits &&
                      monthData.karmic_tracker[0]?.traits?.sattvic_traits
                        .length > 0) ||
                      (monthData.karmic_tracker[0]?.sattvic_traits &&
                        monthData.karmic_tracker[0]?.sattvic_traits > 0)) && (
                      <div className="bg-green-900/20 rounded p-2">
                        <div className="text-xs font-medium text-green-400 mb-1">
                          Sattvic Traits
                        </div>
                        <ul className="list-disc list-inside pl-1 text-xs text-white/70">
                          {Array.isArray(
                            monthData.karmic_tracker[0]?.traits?.sattvic_traits
                          ) ? (
                            monthData.karmic_tracker[0].traits.sattvic_traits.map(
                              (trait, idx) => (
                                <li key={`sattvic-${idx}`}>{trait}</li>
                              )
                            )
                          ) : monthData.karmic_tracker[0]?.sattvic_traits ? (
                            <li>
                              {monthData.karmic_tracker[0].sattvic_traits}
                            </li>
                          ) : (
                            <li>No sattvic traits available</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {((monthData.karmic_tracker[0]?.traits?.rajasic_traits &&
                      monthData.karmic_tracker[0]?.traits?.rajasic_traits
                        .length > 0) ||
                      (monthData.karmic_tracker[0]?.rajasic_traits &&
                        monthData.karmic_tracker[0]?.rajasic_traits > 0)) && (
                      <div className="bg-yellow-900/20 rounded p-2">
                        <div className="text-xs font-medium text-yellow-400 mb-1">
                          Rajasic Traits
                        </div>
                        <ul className="list-disc list-inside pl-1 text-xs text-white/70">
                          {Array.isArray(
                            monthData.karmic_tracker[0]?.traits?.rajasic_traits
                          ) ? (
                            monthData.karmic_tracker[0].traits.rajasic_traits.map(
                              (trait, idx) => (
                                <li key={`rajasic-${idx}`}>{trait}</li>
                              )
                            )
                          ) : monthData.karmic_tracker[0]?.rajasic_traits ? (
                            <li>
                              {monthData.karmic_tracker[0].rajasic_traits}
                            </li>
                          ) : (
                            <li>No rajasic traits available</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {((monthData.karmic_tracker[0]?.traits?.tamasic_traits &&
                      monthData.karmic_tracker[0]?.traits?.tamasic_traits
                        .length > 0) ||
                      (monthData.karmic_tracker[0]?.tamasic_traits &&
                        monthData.karmic_tracker[0]?.tamasic_traits > 0)) && (
                      <div className="bg-red-900/20 rounded p-2">
                        <div className="text-xs font-medium text-red-400 mb-1">
                          Tamasic Traits
                        </div>
                        <ul className="list-disc list-inside pl-1 text-xs text-white/70">
                          {Array.isArray(
                            monthData.karmic_tracker[0]?.traits?.tamasic_traits
                          ) ? (
                            monthData.karmic_tracker[0].traits.tamasic_traits.map(
                              (trait, idx) => (
                                <li key={`tamasic-${idx}`}>{trait}</li>
                              )
                            )
                          ) : monthData.karmic_tracker[0]?.tamasic_traits ? (
                            <li>
                              {monthData.karmic_tracker[0].tamasic_traits}
                            </li>
                          ) : (
                            <li>No tamasic traits available</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Trend */}
                  {(monthData.karmic_tracker[0]?.traits?.trend ||
                    monthData.karmic_tracker[0]?.karma_trend) && (
                    <div className="mt-3 flex items-center">
                      <span className="text-xs text-white/70 mr-2">Trend:</span>
                      <span
                        className={`text-xs font-medium ${
                          monthData.karmic_tracker[0]?.traits?.trend ===
                            "Positive" ||
                          monthData.karmic_tracker[0]?.karma_trend ===
                            "Positive" ||
                          monthData.karmic_tracker[0]?.karma_trend ===
                            "Improving"
                            ? "text-green-400"
                            : monthData.karmic_tracker[0]?.traits?.trend ===
                                "Negative" ||
                              monthData.karmic_tracker[0]?.karma_trend ===
                                "Negative" ||
                              monthData.karmic_tracker[0]?.karma_trend ===
                                "Declining"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {monthData.karmic_tracker[0]?.traits?.trend ||
                          monthData.karmic_tracker[0]?.karma_trend}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Persona History */}
        {monthData.persona_history.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white/90 mb-2 flex items-center">
              <User size={14} className="mr-1.5 text-blue-400" />
              Financial Persona
            </h4>
            <div className="bg-black/20 rounded-md p-3 border border-white/10">
              {monthData.persona_history.map((persona, index) => (
                <div
                  key={`persona-${index}`}
                  className="bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-lg p-3"
                >
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500/30 flex items-center justify-center mr-3">
                      <User size={20} className="text-orange-400" />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-white/90">
                        {persona.persona_title}
                      </h5>
                      <div className="text-xs text-white/70">
                        {persona.behavior_pattern}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-xs text-white/60 mb-1">
                        Karmic Score
                      </div>
                      <div className="text-sm font-medium text-purple-400">
                        {persona.avg_karmic_score}/100
                      </div>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <div className="text-xs text-white/60 mb-1">Change</div>
                      <div className="text-sm font-medium">
                        {persona.change_flag ? (
                          <span className="text-green-400">Improving</span>
                        ) : (
                          <span className="text-yellow-400">Stable</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reflection Month */}
        {monthData.reflection_month.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-white/90 mb-2 flex items-center">
              <BrainCircuit size={14} className="mr-1.5 text-blue-400" />
              Monthly Reflection
            </h4>
            <div className="bg-black/20 rounded-md p-3 border border-white/10">
              {monthData.reflection_month.map((reflection, index) => (
                <div
                  key={`reflection-${index}`}
                  className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg p-3"
                >
                  {reflection.summary_message && (
                    <div className="bg-black/30 p-3 rounded-lg mb-3 border-l-2 border-blue-500/50">
                      <div className="text-sm text-white/90">
                        {reflection.summary_message}
                      </div>
                    </div>
                  )}

                  {reflection.transition_note &&
                    reflection.transition_note !== "No transition noted" && (
                      <div className="mt-2">
                        <div className="text-xs font-medium text-white/80 mb-1">
                          Transition Note:
                        </div>
                        <div className="text-xs text-white/70 bg-black/20 p-2 rounded">
                          {reflection.transition_note}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Behavior Tracker */}
        {monthData.behavior_tracker.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white/90 mb-2 flex items-center">
              <Activity size={14} className="mr-1.5 text-blue-400" />
              Spending Behavior
            </h4>
            <div className="bg-black/20 rounded-md p-3 border border-white/10">
              {monthData.behavior_tracker.map((behavior, index) => (
                <div key={`behavior-${index}`} className="mb-3 last:mb-0">
                  <div className="bg-black/30 rounded-lg p-3">
                    {/* Display spending pattern */}
                    {behavior.spending_pattern && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-white/90 mb-2">
                          Spending Pattern
                        </h5>
                        <div className="bg-black/20 rounded p-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white/70">
                              Pattern
                            </span>
                            <span className="text-xs font-medium text-blue-400">
                              {behavior.spending_pattern
                                .replace(/-/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Display goal adherence */}
                    {behavior.goal_adherence && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-white/90 mb-2">
                          Goal Adherence
                        </h5>
                        <div className="bg-black/20 rounded p-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white/70">
                              Status
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                behavior.goal_adherence === "on-track"
                                  ? "text-green-400"
                                  : behavior.goal_adherence === "off-track"
                                  ? "text-red-400"
                                  : "text-yellow-400"
                              }`}
                            >
                              {behavior.goal_adherence
                                .replace(/-/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Display saving consistency */}
                    {behavior.saving_consistency && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-white/90 mb-2">
                          Saving Consistency
                        </h5>
                        <div className="bg-black/20 rounded p-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white/70">
                              Status
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                behavior.saving_consistency === "consistent"
                                  ? "text-green-400"
                                  : behavior.saving_consistency ===
                                    "inconsistent"
                                  ? "text-yellow-400"
                                  : "text-blue-400"
                              }`}
                            >
                              {behavior.saving_consistency
                                .replace(/-/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Display labels */}
                    {behavior.labels && behavior.labels.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-white/90 mb-2">
                          Behavior Labels
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {behavior.labels.map((label, labelIndex) => (
                            <span
                              key={`label-${index}-${labelIndex}`}
                              className="text-xs px-2 py-1 rounded-full bg-black/30 border border-white/10 text-white/80"
                            >
                              {label
                                .replace(/-/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Display budget limits if available */}
                    {behavior.budget_limits && (
                      <div>
                        <h5 className="text-sm font-medium text-white/90 mb-2">
                          Budget Limits
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Array.isArray(behavior.budget_limits) ? (
                            behavior.budget_limits.map(
                              (budgetItem, budgetIndex) => (
                                <div
                                  key={`budget-${index}-${budgetIndex}`}
                                  className="bg-black/20 rounded p-2"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-white/70">
                                      {typeof budgetItem.category === "string"
                                        ? budgetItem.category
                                        : "Category"}
                                    </span>
                                    <span className="text-xs font-medium text-blue-400">
                                      ₹
                                      {typeof budgetItem.limit === "number"
                                        ? budgetItem.limit
                                        : typeof budgetItem.limit === "object"
                                        ? JSON.stringify(budgetItem.limit)
                                        : 0}
                                    </span>
                                  </div>
                                </div>
                              )
                            )
                          ) : (
                            <div className="text-xs text-white/70">
                              No budget limits defined
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </div>
          )}
      </div>
    );
  };

  // Render financial simulation results
  const renderSimulationResults = () => {
    if (!simulationResults) return null;

    // Get available months
    const availableMonths = getAvailableMonths(simulationResults);

    // If no months available, show message
    if (availableMonths.length === 0) {
      return (
        <div className="bg-blue-900/20 rounded-lg p-4 my-4 border border-blue-500/30">
          <div className="text-center py-4 text-white/70">
            <p>No simulation results available yet.</p>
            <p className="text-sm mt-1">
              Try sending a message to the financial agent to generate results.
            </p>
          </div>
        </div>
      );
    }

      return (
      <>
        {isProcessingSimulation && (
          <div className="flex items-center justify-center mb-4 text-blue-400 animate-pulse text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
            Processing simulation... Please wait.
              </div>
            )}

        {isLoadingResults && (
          <div className="flex items-center justify-center mb-4 text-green-400 animate-pulse text-sm">
            <div className="animate-bounce flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-400 mx-0.5 animate-pulse" style={{ animationDelay: '0s' }}></span>
              <span className="w-2 h-2 rounded-full bg-green-400 mx-0.5 animate-pulse" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 rounded-full bg-green-400 mx-0.5 animate-pulse" style={{ animationDelay: '0.4s' }}></span>
              </div>
            Loading results...
            </div>
          )}

        {availableMonths.map((month) => {
          const monthData = getMonthData(simulationResults, month);
          return renderMonthSections(monthData, month);
        })}

        {/* Fallback message if no data sections are available across ALL months */}
        {!availableMonths.some(
          (month) =>
            getMonthData(simulationResults, month).simulated_cashflow.length >
              0 ||
            getMonthData(simulationResults, month).discipline_report.length >
              0 ||
            getMonthData(simulationResults, month).goal_status.length > 0 ||
            getMonthData(simulationResults, month).financial_strategy.length >
              0 ||
            getMonthData(simulationResults, month).karmic_tracker.length > 0 ||
            getMonthData(simulationResults, month).persona_history.length > 0 ||
            getMonthData(simulationResults, month).behavior_tracker.length > 0 ||
            getMonthData(simulationResults, month).reflections.length > 0 ||
            getMonthData(simulationResults, month).reflection_month.length > 0
        ) && !isProcessingSimulation && !isLoadingResults && (
          <div className="text-center py-4 text-white/70">
            <p className="text-lg font-medium">Agent unavailable. No simulation results.</p>
            <p className="text-sm mt-2">Please try again or contact support if the issue persists.</p>
            </div>
        )}
      </>
    );
      };

      return (
    <GlassContainer
      className="flex flex-col h-full w-full max-w-7xl mx-auto rounded-lg shadow-xl overflow-hidden"
      ref={containerRef}
    >
      <div className="flex flex-col md:flex-row h-full">
        {/* Left Pane: Agent Selection and Financial Form */}
        <div className="w-full md:w-1/3 p-6 border-r border-white/10 flex flex-col bg-gradient-to-br from-gray-800/60 to-black/60 overflow-y-auto custom-scrollbar">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Agent Simulator
          </h2>

          {/* Agent Selector */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white/90 mb-3 flex items-center">
              <Cpu size={18} className="mr-2 text-blue-400" />
              Select an Agent
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`agent-card p-4 rounded-lg cursor-pointer transition-all duration-300 ease-in-out border ${
                    selectedAgent === agent.id
                      ? "bg-blue-700/30 border-blue-500 shadow-lg selected-agent"
                      : "bg-gray-700/30 border-gray-600 hover:bg-gray-600/40"
                  }`}
                  onClick={() => setSelectedAgent(agent.id)}
                >
                  <div className="flex items-center mb-2">
                <agent.icon
                      size={20}
                      className="mr-2"
                      style={{ color: agent.color }}
                    />
                    <h4 className="font-semibold text-white">
                      {agent.name}
                    </h4>
            </div>
                  <p className="text-sm text-white/70">
                    {agent.description}
                  </p>
                  <div className="mt-3 flex justify-between items-center">
              <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
              agent.status === "active"
                          ? "bg-green-500/30 text-green-300"
                          : "bg-gray-500/30 text-gray-300"
                      }`}
                    >
            {agent.status}
            </span>
                    <span className="text-xs text-white/50">
                      Confidence: {formatConfidence(agent.confidence)}
            </span>
          </div>
          </div>
              ))}
        </div>
      </div>

          {/* Financial Profile Form - Conditionally Rendered */}
                {selectedAgent &&
                  agents.find((a) => a.id === selectedAgent)?.type ===
              "financial" && (
              <div className="mb-6 bg-gray-700/40 rounded-lg p-5 border border-gray-600">
                <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center">
                        <DollarSign size={18} className="mr-2 text-blue-400" />
                  Financial Profile
                      </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendFinancialSimulationData();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-white/70 mb-1"
                    >
                            Your Name
                          </label>
                          <input
                            type="text"
                      id="name"
                            value={financialProfile.name}
                            onChange={(e) =>
                        handleFinancialProfileChange("name", e.target.value)
                            }
                      className="w-full p-2 rounded-md bg-black/20 text-white border border-white/10 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your name"
                      required
                          />
                        </div>
                        <div>
                    <label
                      htmlFor="monthlyIncome"
                      className="block text-sm font-medium text-white/70 mb-1"
                    >
                            Monthly Income (₹)
                          </label>
                          <input
                      type="number"
                      id="monthlyIncome"
                            value={financialProfile.monthlyIncome}
                            onChange={(e) =>
                              handleFinancialProfileChange(
                                "monthlyIncome",
                                e.target.value
                              )
                            }
                      className="w-full p-2 rounded-md bg-black/20 text-white border border-white/10 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 50000"
                      required
                          />
                        </div>
                  {/* Expenses */}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Expenses
                          </label>
                    <div className="space-y-2">
                      {financialProfile.expenses.map((expense) => (
                          <div
                            key={expense.id}
                          className="flex space-x-2 items-center"
                          >
                              <input
                                type="text"
                                value={expense.name}
                                onChange={(e) =>
                                  handleExpenseChange(
                                    expense.id,
                                    "name",
                                    e.target.value
                                  )
                                }
                            className="flex-1 p-2 rounded-md bg-black/20 text-white border border-white/10 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Expense Name (e.g., Rent)"
                          />
                              <input
                            type="number"
                                value={expense.amount}
                                onChange={(e) =>
                                  handleExpenseChange(
                                    expense.id,
                                    "amount",
                                    e.target.value
                                  )
                                }
                            className="w-28 p-2 rounded-md bg-black/20 text-white border border-white/10 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Amount (₹)"
                              />
                          {financialProfile.expenses.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeExpense(expense.id)}
                              className="p-2 rounded-md bg-red-600/40 text-white hover:bg-red-500/50 transition-colors"
                              >
                              <Minus size={16} />
                              </button>
                          )}
                          </div>
                        ))}
                      </div>
                    <button
                      type="button"
                      onClick={addExpense}
                      className="mt-3 w-full p-2 rounded-md bg-blue-600/40 text-white hover:bg-blue-500/50 transition-colors flex items-center justify-center"
                    >
                      <Plus size={16} className="mr-2" /> Add Expense
                    </button>
                  </div>
                        <div>
                    <label
                      htmlFor="financialGoal"
                      className="block text-sm font-medium text-white/70 mb-1"
                    >
                      Financial Goal
                          </label>
                          <input
                            type="text"
                      id="financialGoal"
                            value={financialProfile.financialGoal}
                            onChange={(e) =>
                              handleFinancialProfileChange(
                                "financialGoal",
                                e.target.value
                              )
                            }
                      className="w-full p-2 rounded-md bg-black/20 text-white border border-white/10 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Save for retirement, Buy a house"
                      required
                          />
                        </div>
                        <div>
                    <label
                      htmlFor="financialType"
                      className="block text-sm font-medium text-white/70 mb-1"
                    >
                      Financial Type
                          </label>
                          <select
                      id="financialType"
                            value={financialProfile.financialType}
                            onChange={(e) =>
                              handleFinancialProfileChange(
                                "financialType",
                                e.target.value
                              )
                            }
                      className="w-full p-2 rounded-md bg-black/20 text-white border border-white/10 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Conservative">Conservative</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Aggressive">Aggressive</option>
                          </select>
                        </div>
                        <div>
                    <label
                      htmlFor="riskLevel"
                      className="block text-sm font-medium text-white/70 mb-1"
                    >
                      Risk Level
                          </label>
                    <select
                      id="riskLevel"
                      value={financialProfile.riskLevel}
                      onChange={(e) =>
                        handleFinancialProfileChange("riskLevel", e.target.value)
                      }
                      className="w-full p-2 rounded-md bg-black/20 text-white border border-white/10 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                              </div>
                  <button
                    type="submit"
                    className="w-full p-3 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                  >
                    Run Financial Simulation
                  </button>
                </form>
                  </div>
                )}

          {/* Action Buttons */}
          <div className="mt-auto">
            <div className="flex space-x-2 mb-4">
                    {!isSimulating ? (
                      <button
                        onClick={startSimulation}
                  disabled={!selectedAgent || isProcessingSimulation}
                  className={`flex-1 p-3 rounded-md transition-all duration-300 ${
                    selectedAgent && !isProcessingSimulation
                      ? "bg-green-600/40 text-white hover:bg-green-500/50"
                      : "bg-gray-600/30 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Play size={18} className="inline mr-2" /> Start Simulation
                      </button>
                    ) : (
                      <button
                        onClick={stopSimulation}
                  className="flex-1 p-3 rounded-md bg-yellow-600/40 text-white hover:bg-yellow-500/50 transition-colors"
                      >
                  <Pause size={18} className="inline mr-2" /> Pause Simulation
                      </button>
                    )}

                    <button
                      onClick={resetSimulation}
                className="flex-1 p-3 rounded-md bg-red-600/40 text-white hover:bg-red-500/50 transition-colors"
                    >
                <RotateCcw size={18} className="inline mr-2" /> Reset
                Simulation
                    </button>
                </div>
              </div>
            </div>

        {/* Right Pane: Chat and Simulation Results */}
        <div className="flex-1 flex flex-col p-6 bg-gradient-to-bl from-gray-800/60 to-black/60 overflow-hidden relative">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Agent Chat
                    </h2>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 mb-6">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg shadow-md ${
                      message.sender === "user"
                        ? "bg-blue-600/60 text-white"
                        : message.sender === "learning-agent"
                        ? "bg-purple-600/60 text-white"
                        : message.agentType === "financial"
                        ? "bg-blue-500/60 text-white"
                        : "bg-gray-600/60 text-white"
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      {message.sender !== "user" && message.agentType && (
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${
                            message.agentType === "education"
                              ? "bg-green-400"
                              : message.agentType === "financial"
                              ? "bg-blue-400"
                              : message.agentType === "wellness"
                              ? "bg-orange-400"
                              : "bg-gray-400"
                          }`}
                        ></span>
                      )}
                      <span className="text-xs font-semibold text-white/90">
                        {
                          message.sender === "user"
                            ? "You"
                            : message.sender === "system"
                            ? "System"
                            : message.agentName ||
                              agents.find((a) => a.id === message.sender)?.name ||
                              "Agent"
                        }
                                </span>
                      {message.sender !== "user" && message.isLoading && (
                        <span className="ml-2 text-xs text-white/50 animate-pulse">
                          (Processing...)
                                </span>
                      )}
                              </div>
                    <p className="text-sm text-white/90 whitespace-pre-wrap">
                      {message.content}
                    </p>
                    {message.audioUrl && (
                      <div className="mt-2">
                              <button
                          onClick={() => toggleAudioPlay(message.audioUrl)}
                          className="text-blue-300 hover:text-blue-200 text-xs flex items-center"
                        >
                          {isPlaying && currentAudio === message.audioUrl ? (
                            <Pause size={14} className="mr-1" />
                          ) : (
                            <Play size={14} className="mr-1" />
                          )}
                          Play Audio
                              </button>
                  </div>
                    )}
                    <div className="text-right text-xs text-white/50 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}{" "}
                      {new Date(message.timestamp).toLocaleDateString()}
                </div>
                    </div>
                                  </div>
              ))}
                      <div ref={messagesEndRef} />
                    </div>
                </div>

          {/* PDF Upload Section */}
          <div className="mb-6 bg-gray-700/40 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white/90 flex items-center">
                <FileText size={18} className="mr-2 text-blue-400" />
                Chat Documents
              </h3>
              <label
                htmlFor="pdf-upload"
                className="cursor-pointer bg-blue-600/40 text-white px-3 py-1.5 rounded-md hover:bg-blue-500/50 transition-colors text-sm font-medium"
              >
                <Plus size={14} className="inline mr-1" /> Upload PDF
                <input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
              </label>
            </div>
            {selectedPdfs.length > 0 ? (
              <div className="space-y-2 max-h-28 overflow-y-auto custom-scrollbar pr-2">
                        {selectedPdfs.map((pdf) => (
                          <div
                            key={pdf.id}
                    className={`flex items-center justify-between p-2 rounded-md border text-sm ${
                              activePdfId === pdf.id
                        ? "bg-blue-700/30 border-blue-500 text-blue-100"
                        : "bg-black/20 border-white/10 text-white/80"
                    }`}
                  >
                    <div className="flex items-center overflow-hidden">
                      <Pin size={14} className="mr-2 flex-shrink-0" />
                      <span className="truncate">{pdf.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {activePdfId !== pdf.id && (
                        <button
                            onClick={() => setActivePdfId(pdf.id)}
                          className="text-white/70 hover:text-white transition-colors text-xs"
                        >
                          (Set Active)
                        </button>
                      )}
                            <button
                        onClick={() => handleRemovePdf(pdf.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X size={16} />
                            </button>
                    </div>
                          </div>
                        ))}
                      </div>
            ) : (
              <p className="text-sm text-white/60 text-center py-2">
                No PDF documents uploaded.
              </p>
            )}
          </div>

          {/* User Input */}
          <form onSubmit={handleSubmit} className="flex mt-auto space-x-3">
                        <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1 p-3 rounded-md bg-black/20 text-white border border-white/10 focus:ring-blue-500 focus:border-blue-500 placeholder-white/50"
              placeholder="Type your message..."
              disabled={isProcessingSimulation}
                        />
                        <button
              type="submit"
              className={`p-3 rounded-md transition-colors ${
                userInput.trim() && !isProcessingSimulation
                  ? "bg-blue-600/40 text-white hover:bg-blue-500/50"
                  : "bg-gray-600/30 text-gray-400 cursor-not-allowed"
              }`}
              disabled={!userInput.trim() || isProcessingSimulation}
            >
              <ArrowRight size={20} />
                        </button>
          </form>
                    </div>

        {/* Financial Simulation Results Panel */}
        {selectedAgent &&
          agents.find((a) => a.id === selectedAgent)?.type === "financial" && (
            <div
              className={
                isTimelineOpen
                  ? "w-full md:w-1/3 p-6 border-l border-white/10 flex flex-col bg-gradient-to-br from-gray-800/60 to-black/60 overflow-y-auto custom-scrollbar"
                  : "hidden"
              }
            >
                <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Financial Overview
                    </h2>
                <button
                  onClick={() => setIsTimelineOpen(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                        </div>

              <div className="flex justify-end mb-4">
                <button
                  onClick={() => simulationTaskId && fetchSimulationResultsByTaskId(simulationTaskId, true)}
                  disabled={isProcessingSimulation || isLoadingResults || !simulationTaskId}
                  className={`px-4 py-2 rounded-md transition-colors text-sm font-medium flex items-center ${isProcessingSimulation || isLoadingResults || !simulationTaskId ? "bg-gray-600/30 text-gray-400 cursor-not-allowed" : "bg-blue-600/40 text-white hover:bg-blue-500/50"}`}
                >
                  <RotateCcw size={16} className="mr-2" /> Refresh Results
                </button>
                      </div>

              {simulationResults ? (
                renderSimulationResults()
              ) : (
                <div className="text-center py-8 text-white/70">
                  {isProcessingSimulation ? (
                    <>
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400 mx-auto mb-3"></div>
                      <p className="text-lg font-medium mb-1">
                        Running Financial Simulation...
                      </p>
                      <p className="text-sm">
                        This may take a few moments. Results will appear here
                        automatically.
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle
                        size={32}
                        className="text-yellow-400 mx-auto mb-3"
                      />
                      <p className="text-lg font-medium mb-1">
                        No Simulation Results
                      </p>
                      <p className="text-sm">
                        Start a financial simulation to see detailed reports.
                      </p>
                    </>
                  )}
                      </div>
              )}
                        </div>
          )}
        </div>
      </GlassContainer>
  );
}