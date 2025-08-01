import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import GlassContainer from "../components/GlassContainer";
import { FiFile } from "react-icons/fi";
import Twemoji from "react-twemoji";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../config";
import "../styles/chatbot.css";
import chatLogsService from "../services/chatLogsService";
import {
  useSendChatMessageMutation,
  useLazyFetchChatbotResponseQuery,
} from "../api/coreApiSlice";

export default function Chatbot() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: (
        <Twemoji options={{ className: "twemoji" }}>
          🙏🏽 {t("Namaste!")}{" "}
          {t(
            "I am UniGuru, your AI learning assistant. How can I help you learn today?"
          )}
        </Twemoji>
      ),
      model: "grok", // Default model
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [selectedModel, setSelectedModel] = useState("grok"); // Default to grok model
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // RTK Query hooks
  const [sendChatMessage] = useSendChatMessageMutation();
  const [fetchChatbotResponse] = useLazyFetchChatbotResponseQuery();

  // Function to navigate to Summarizer page
  const handleNavigateToLearn = () => {
    navigate("/learn");
  };

  // Load the selected model from localStorage if available
  useEffect(() => {
    const savedModel = localStorage.getItem("selectedAIModel");
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  // Get user ID on component mount
  useEffect(() => {
    const getUserId = async () => {
      try {
        console.log("DEBUG - Getting user ID...");

        // Get the current session
        const { data: sessionData } = await supabase.auth.getSession();
        console.log("DEBUG - Session data:", sessionData);

        // If we have a session with a user, use that ID
        if (sessionData?.session?.user?.id) {
          console.log(
            "DEBUG - Found user ID from session:",
            sessionData.session.user.id
          );
          setUserId(sessionData.session.user.id);
          return;
        }

        // Fallback to getUser if session doesn't have what we need
        const { data: userData } = await supabase.auth.getUser();
        console.log("DEBUG - User data:", userData);

        if (userData?.user?.id) {
          console.log("DEBUG - Found user ID from getUser:", userData.user.id);
          setUserId(userData.user.id);
        } else {
          console.log("DEBUG - No user ID found, using guest-user");
          // Use guest-user for anonymous users
          setUserId("guest-user");
        }
      } catch (error) {
        console.error("DEBUG - Error getting user ID:", error);
        console.log("DEBUG - Using guest-user due to error");
        setUserId("guest-user");
      }
    };

    getUserId();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`DEBUG - Auth state changed: ${event}`);

        if (session?.user?.id) {
          console.log(
            "DEBUG - Auth state changed, new user ID:",
            session.user.id
          );
          setUserId(session.user.id);
        } else {
          console.log("DEBUG - Auth state changed, no user ID found");
          // Use guest-user for anonymous users
          setUserId("guest-user");
        }
      }
    );

    return () => {
      // Clean up the subscription
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // In a flex-col-reverse layout, we don't need to scroll as new messages
    // automatically appear at the bottom and push older messages up
    // This is just to ensure smooth scrolling for a better UX
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentStreamingMessage]);

  // Focus input and initialize textarea height on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      // Initialize textarea height
      adjustTextareaHeight(inputRef.current);
    }
  }, []);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setCurrentStreamingMessage("");

    try {
      // Enhanced debugging for user ID and query
      console.log("DEBUG - Sending message with user ID:", userId);
      console.log("DEBUG - User ID type:", typeof userId);
      console.log(
        "DEBUG - User ID null check:",
        userId === null ? "is null" : "not null"
      );
      console.log(
        "DEBUG - User ID undefined check:",
        userId === undefined ? "is undefined" : "not undefined"
      );

      // Store the user's query
      const userQuery = input.trim();
      console.log("DEBUG - User query:", userQuery);
      console.log("DEBUG - Query length:", userQuery.length);

      try {
        // STEP 1: First send the user's query to the chatpost endpoint
        console.log("DEBUG - First sending user query to chatpost");
        console.log("DEBUG - API_BASE_URL:", API_BASE_URL);

        // Make sure userId is always defined
        const effectiveUserId = userId || "guest-user";
        console.log("DEBUG - Using effective user ID:", effectiveUserId);

        // Send the user's query to the chatpost endpoint with the selected model using RTK Query
        const chatpostResult = await sendChatMessage({
          aiMessage: null,
          userQuery,
          userId: effectiveUserId,
          llmModel: selectedModel,
        }).unwrap();
        console.log("DEBUG - Initial chatpost result:", chatpostResult);

        // STEP 2: Now fetch the response from the chatbot endpoint
        console.log("DEBUG - Now fetching response from chatbot endpoint");

        // Wait a moment to allow the backend to process the query
        // This is important because the backend needs time to store the query
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const response = await fetchChatbotResponse(effectiveUserId).unwrap();
        console.log(
          "DEBUG - After fetchChatbotResponse call - got response:",
          response
        );

        // Get the AI's response message - specifically handle the structure from the backend
        let aiMessage = "";
        console.log(
          "DEBUG - Response structure:",
          JSON.stringify(response, null, 2)
        );

        // The exact structure we're expecting from the backend:
        // {
        //   "_id": "681dc23f306866e387667328",
        //   "query": "hello nigga im white",
        //   "response": {
        //     "message": "Hey there! Thanks for...",
        //     "timestamp": "2025-05-09T08:52:32.575779Z",
        //     "type": "chat_response",
        //     "query_id": "681dc23f306866e387667328"
        //   }
        // }

        if (response && response.response && response.response.message) {
          // This is the expected structure from the backend
          aiMessage = response.response.message;
          console.log(
            "DEBUG - Found message in response.response.message:",
            aiMessage
          );
        } else if (response && response.message) {
          // Fallback: direct message property
          aiMessage = response.message;
          console.log("DEBUG - Found message directly:", aiMessage);
        } else if (response && typeof response === "string") {
          // Fallback: response is a string
          aiMessage = response;
          console.log("DEBUG - Response is a string:", aiMessage);
        } else if (response && typeof response === "object") {
          // Fallback: search for message-like properties
          console.log("DEBUG - Searching for message in response object");

          // First check if there's an error message
          if (response.error) {
            aiMessage = `Error: ${response.error}`;
            console.log("DEBUG - Found error message:", aiMessage);
          } else {
            // Try to find any message-like property
            const possibleMessageKeys = Object.keys(response).filter(
              (key) =>
                typeof response[key] === "string" &&
                (key.includes("message") ||
                  key.includes("text") ||
                  key.includes("content"))
            );

            if (possibleMessageKeys.length > 0) {
              aiMessage = response[possibleMessageKeys[0]];
              console.log(
                "DEBUG - Found message in key:",
                possibleMessageKeys[0],
                aiMessage
              );
            } else {
              // Last resort: stringify the whole response
              aiMessage = "Response received: " + JSON.stringify(response);
              console.log("DEBUG - Using stringified response as message");
            }
          }
        }

        // Check if this is the first query to the server
        if (response && response.isFirstQuery) {
          // Show a toast notification to inform the user
          toast(
            "This is your first query to the server. Future responses will be more personalized.",
            {
              duration: 5000,
              icon: "🔄",
            }
          );

          // Automatically retry the chatpost endpoint to initialize the chat history
          try {
            console.log(
              "DEBUG - Initializing chat history with effectiveUserId:",
              effectiveUserId
            );

            // Make sure we have both the AI message and user query
            if (!aiMessage || !userQuery) {
              console.log(
                "DEBUG - Missing aiMessage or userQuery for chat history initialization"
              );
              console.log("DEBUG - aiMessage:", aiMessage);
              console.log("DEBUG - userQuery:", userQuery);

              // Use default values if missing
              const defaultAiMessage =
                "Hello! I'm your AI assistant. How can I help you today?";
              const defaultUserQuery = userQuery || "Hello";

              await sendChatMessage({
                aiMessage: aiMessage || defaultAiMessage,
                userQuery: userQuery || defaultUserQuery,
                userId: effectiveUserId,
                llmModel: selectedModel,
              }).unwrap();
            } else {
              await sendChatMessage({
                aiMessage,
                userQuery,
                userId: effectiveUserId,
                llmModel: selectedModel,
              }).unwrap();
            }

            console.log("DEBUG - Chat history initialized successfully");
          } catch (err) {
            // Log error but continue - this is non-critical
            console.log("DEBUG - Failed to initialize chat history:", err);
          }
        }

        // Add the bot's response to messages
        if (aiMessage && aiMessage.trim() !== "") {
          // Get the model used for this response
          const modelUsed = response?.response?.llm || selectedModel;

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: aiMessage,
              model: modelUsed, // Store the model used for this response
            },
          ]);

          // Log the chat message to Supabase
          try {
            await chatLogsService.logChatMessage({
              userId: effectiveUserId,
              message: userQuery,
              model: modelUsed,
              responseLength: aiMessage.length,
            });
            console.log("Chat message logged successfully");
          } catch (logError) {
            console.error("Error logging chat message:", logError);
            // Continue even if logging fails
          }

          // We've already sent the user query and received the response
          // No need to do anything else here
          console.log("DEBUG - Chat message flow completed successfully");
        } else {
          throw new Error("Empty response from chatbot. Please try again.");
        }
      } catch (error) {
        // Check for specific error types
        let errorMessage = t(
          "I apologize, but I encountered an error. Please try again later."
        );

        let toastMessage =
          "Error connecting to chatbot server. Please try again.";

        if (
          error.message.includes("503") ||
          error.message.includes("unavailable")
        ) {
          errorMessage = t(
            "I apologize, but the server is temporarily unavailable. Please try again in a few minutes or check with support if the issue persists."
          );
          toastMessage = `Server ${API_BASE_URL} is temporarily unavailable`;
        } else if (
          error.message.includes("timeout") ||
          error.message.includes("not responding")
        ) {
          errorMessage = t(
            "I apologize, but the request timed out. Please check your internet connection and try again."
          );
          toastMessage = "Request timed out. Check your connection.";
        } else if (
          error.message.includes("network") ||
          error.message.includes("Failed to fetch")
        ) {
          errorMessage = t(
            "I apologize, but there seems to be a network issue. Please check your internet connection and try again."
          );
          toastMessage = "Network error. Check your connection.";
        } else if (error.message.includes("Empty response")) {
          errorMessage = t(
            "I apologize, but I received an empty response from the server. This might be due to a configuration issue."
          );
          toastMessage = `Empty response from ${API_BASE_URL}. Check server configuration.`;
        } else if (
          error.message.includes("No queries yet") ||
          error.message.includes("No queries found for this user")
        ) {
          errorMessage = t(
            "This appears to be your first query. The system is initializing your chat history."
          );
          toastMessage =
            "First-time setup. Please try sending your message again.";
        } else if (error.message.includes("Server error:")) {
          errorMessage = t(
            "I apologize, but the server returned an error. The developers have been notified."
          );
          toastMessage = error.message;
        }

        // Show toast notification with error
        toast.error(toastMessage, {
          duration: 5000,
          icon: "⚠️",
        });

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: errorMessage,
            model: selectedModel, // Include the model that was attempted
          },
        ]);
      }
    } catch (error) {
      console.error("Unexpected error in handleSendMessage:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t(
            "I apologize, but I encountered an unexpected error. Please try again later."
          ),
          model: selectedModel, // Include the model that was attempted
        },
      ]);
    } finally {
      setIsLoading(false);
      setCurrentStreamingMessage("");
      inputRef.current?.focus();
    }
  };

  // Handle Enter key press and auto-resize textarea
  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }

    // Auto-resize the textarea
    adjustTextareaHeight(e.target);
  };

  // Function to maintain fixed textarea height
  const adjustTextareaHeight = (element) => {
    if (!element) return;

    // Keep a fixed height of 46px
    element.style.height = "46px";
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setInput(e.target.value);
    adjustTextareaHeight(e.target);
  };

  return (
    <GlassContainer>
      <h2
        className="text-4xl md:text-5xl font-extrabold mb-6 drop-shadow-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-white hover:to-[#FF9933] hover:bg-clip-text hover:text-transparent"
        style={{ color: "#FFFFFF", fontFamily: "Tiro Devanagari Hindi, serif" }}
      >
        {t("AI Guru Chat")}
      </h2>

      {/* Chat Container */}
      <div
        className="flex-1 mb-4 flex flex-col"
        style={{
          height: "calc(100vh - 371px)",
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Messages container with proper scrolling */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden chat-scrollbar p-4 flex flex-col-reverse"
          style={{ maxWidth: "100%" }}
        >
          {/* Scroll anchor at the "bottom" (which is actually the top in flex-col-reverse) */}
          <div ref={messagesEndRef} className="h-0" />

          {/* Loading indicator */}
          {isLoading && !currentStreamingMessage && (
            <div className="mr-auto max-w-3xl mb-4">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <p className="mt-1 text-xs text-white/60">
                <span>
                  {t("Guru AI")}{" "}
                  <span
                    className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ml-1"
                    style={{
                      background:
                        selectedModel === "grok"
                          ? "linear-gradient(135deg, rgba(255, 153, 51, 0.3), rgba(255, 153, 51, 0.1))"
                          : selectedModel === "llama"
                          ? "linear-gradient(135deg, rgba(0, 128, 255, 0.3), rgba(0, 128, 255, 0.1))"
                          : selectedModel === "chatgpt"
                          ? "linear-gradient(135deg, rgba(16, 163, 127, 0.3), rgba(16, 163, 127, 0.1))"
                          : "linear-gradient(135deg, rgba(128, 0, 255, 0.3), rgba(128, 0, 255, 0.1))",
                      border:
                        selectedModel === "grok"
                          ? "1px solid rgba(255, 153, 51, 0.3)"
                          : selectedModel === "llama"
                          ? "1px solid rgba(0, 128, 255, 0.3)"
                          : selectedModel === "chatgpt"
                          ? "1px solid rgba(16, 163, 127, 0.3)"
                          : "1px solid rgba(128, 0, 255, 0.3)",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {selectedModel.charAt(0).toUpperCase() +
                      selectedModel.slice(1)}
                  </span>{" "}
                  {t("is thinking...")}
                </span>
              </p>
            </div>
          )}

          {/* Streaming message */}
          {currentStreamingMessage && (
            <div className="mr-auto max-w-3xl mb-4 message-animation">
              <div
                className="p-4 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/10"
                style={{
                  maxWidth: "100%",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                <p
                  className="text-white break-words"
                  style={{
                    fontFamily: "Inter, Poppins, sans-serif",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "pre-wrap",
                    maxWidth: "100%",
                  }}
                >
                  {currentStreamingMessage}
                </p>
              </div>
              <p className="mt-1 text-xs text-white/60 text-left">
                <span>
                  {t("Guru AI")}{" "}
                  <span
                    className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ml-1"
                    style={{
                      background:
                        selectedModel === "grok"
                          ? "linear-gradient(135deg, rgba(255, 153, 51, 0.3), rgba(255, 153, 51, 0.1))"
                          : selectedModel === "llama"
                          ? "linear-gradient(135deg, rgba(0, 128, 255, 0.3), rgba(0, 128, 255, 0.1))"
                          : selectedModel === "chatgpt"
                          ? "linear-gradient(135deg, rgba(16, 163, 127, 0.3), rgba(16, 163, 127, 0.1))"
                          : "linear-gradient(135deg, rgba(128, 0, 255, 0.3), rgba(128, 0, 255, 0.1))",
                      border:
                        selectedModel === "grok"
                          ? "1px solid rgba(255, 153, 51, 0.3)"
                          : selectedModel === "llama"
                          ? "1px solid rgba(0, 128, 255, 0.3)"
                          : selectedModel === "chatgpt"
                          ? "1px solid rgba(16, 163, 127, 0.3)"
                          : "1px solid rgba(128, 0, 255, 0.3)",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {selectedModel.charAt(0).toUpperCase() +
                      selectedModel.slice(1)}
                  </span>
                </span>
              </p>
            </div>
          )}

          {/* Messages in reverse order (newest at the bottom) */}
          {[...messages].reverse().map((message, index) => (
            <div
              key={`message-${messages.length - 1 - index}-${message.role}`}
              className={`mb-4 message-animation ${
                message.role === "user"
                  ? "ml-auto max-w-3xl"
                  : "mr-auto max-w-3xl"
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div
                className={`p-4 rounded-2xl overflow-hidden ${
                  message.role === "user"
                    ? "bg-[#FF9933]/20 backdrop-blur-sm border border-[#FF9933]/20 text-right"
                    : "bg-white/10 backdrop-blur-sm border border-white/10"
                }`}
                style={{
                  maxWidth: "100%",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                <p
                  className="text-white break-words"
                  style={{
                    fontFamily: "Inter, Poppins, sans-serif",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "pre-wrap",
                    maxWidth: "100%",
                  }}
                >
                  {message.content}
                </p>
              </div>
              <p
                className={`mt-1 text-xs text-white/60 ${
                  message.role === "user" ? "text-right" : "text-left"
                }`}
              >
                {message.role === "user" ? (
                  t("You")
                ) : (
                  <span>
                    {t("Guru AI")}{" "}
                    {message.model && (
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ml-1"
                        style={{
                          background:
                            message.model === "grok"
                              ? "linear-gradient(135deg, rgba(255, 153, 51, 0.3), rgba(255, 153, 51, 0.1))"
                              : message.model === "llama"
                              ? "linear-gradient(135deg, rgba(0, 128, 255, 0.3), rgba(0, 128, 255, 0.1))"
                              : message.model === "chatgpt"
                              ? "linear-gradient(135deg, rgba(16, 163, 127, 0.3), rgba(16, 163, 127, 0.1))"
                              : "linear-gradient(135deg, rgba(128, 0, 255, 0.3), rgba(128, 0, 255, 0.1))",
                          border:
                            message.model === "grok"
                              ? "1px solid rgba(255, 153, 51, 0.3)"
                              : message.model === "llama"
                              ? "1px solid rgba(0, 128, 255, 0.3)"
                              : message.model === "chatgpt"
                              ? "1px solid rgba(16, 163, 127, 0.3)"
                              : "1px solid rgba(128, 0, 255, 0.3)",
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        {message.model.charAt(0).toUpperCase() +
                          message.model.slice(1)}
                      </span>
                    )}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Input Area - Horizontal Layout with Fixed Height */}
      <div className="relative">
        <div
          className="flex items-center p-2 rounded-2xl"
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
          }}
        >
          {/* Pin/Paperclip icon */}
          <button
            type="button"
            onClick={handleNavigateToLearn}
            className="p-2 text-white/70 hover:text-white transition-colors duration-200 hover:bg-white/10 rounded-full flex-shrink-0"
            title={t("Go to Summarizer page")}
          >
            <FiFile className="w-5 h-5 paperclip-icon" />
          </button>

          {/* AI Model Selector */}
          <div className="flex-shrink-0 mx-2 relative group">
            <div className="absolute -top-6 left-0 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              {t("Select AI Model")}
            </div>
            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                // Save the selected model to localStorage for use in other components
                localStorage.setItem("selectedAIModel", e.target.value);
              }}
              className="appearance-none bg-gradient-to-r from-[#FF9933]/30 to-[#FF9933]/10 text-white border-2 border-[#FF9933]/30 rounded-lg px-3 py-2 text-sm font-medium outline-none cursor-pointer"
              style={{
                backdropFilter: "blur(10px)",
                boxShadow: "0 2px 10px rgba(255, 153, 51, 0.2)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                minWidth: "110px",
              }}
              disabled={isLoading}
            >
              <option value="grok" className="bg-[#1E1E28] text-white">
                Grok
              </option>
              <option value="llama" className="bg-[#1E1E28] text-white">
                Llama
              </option>
              <option value="chatgpt" className="bg-[#1E1E28] text-white">
                ChatGPT
              </option>
              <option value="uniguru" className="bg-[#1E1E28] text-white">
                UniGuru
              </option>
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg
                width="12"
                height="6"
                viewBox="0 0 12 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1L6 5L11 1"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Textarea with fixed height */}
          <div className="flex-grow mx-2 min-w-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t("Ask about ancient Indian wisdom...")}
              className="w-full bg-transparent text-white px-2 py-3 outline-none resize-none"
              style={{
                height: "46px", // Fixed height
                lineHeight: "1.5",
                overflowY: "auto",
                overflowX: "hidden",
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
              }}
              disabled={isLoading}
              rows="1"
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            type="button"
            className="px-6 py-3 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0"
            disabled={isLoading || !input.trim()}
            style={{
              background: "rgba(255, 153, 51, 0.7)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 4px 15px rgba(255, 153, 51, 0.3)",
              color: "white",
            }}
          >
            {t("Send")}
          </button>
        </div>
      </div>

      <div className="mt-3 text-white/60 text-xs text-center">
        <p className="mt-1 text-white/40 text-xs">
          {t("Tip: Use Shift+Enter for a new line")}
        </p>
      </div>
    </GlassContainer>
  );
}
