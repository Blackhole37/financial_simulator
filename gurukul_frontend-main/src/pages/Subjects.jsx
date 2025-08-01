import React, { useState, useEffect } from "react";
import GlassContainer from "../components/GlassContainer";
import CenteredLoader from "../components/CenteredLoader";
import GlassInput from "../components/GlassInput";
import GlassButton from "../components/GlassButton";
import {
  useLazyGetLessonDataQuery,
  useCreateLessonMutation,
} from "../api/subjectsApiSlice";
import { Book, BookOpen, Search, AlertCircle } from "lucide-react";
import { useSelector } from "react-redux";
import { selectUserId } from "../store/authSlice";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../config";
import TTSButton from "../components/TTSButton";
import { useGenerateTTSMutation } from "../api/ttsApiSlice";
import { ttsUtils } from "../api/ttsApiSlice";
import { Volume2 } from "lucide-react";

export default function Subjects() {
  // API hooks for lesson data
  const [
    getLessonData,
    {
      data: existingLessonData,
      isLoading: isLoadingExisting,
      isError: isErrorExisting,
    },
  ] = useLazyGetLessonDataQuery();

  const [
    createLesson,
    { data: newLessonData, isLoading: isLoadingNew, isError: isErrorNew },
  ] = useCreateLessonMutation();

  // TTS hook for complete lesson
  const [generateTTS, { isLoading: isGeneratingTTS }] = useGenerateTTSMutation();

  // Component state
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [lessonData, setLessonData] = useState(null);
  const [includeWikipedia, setIncludeWikipedia] = useState(true);
  const [useKnowledgeStore, setUseKnowledgeStore] = useState(true);

  const userId = useSelector(selectUserId) || "guest-user";

  // Computed values for loading and error states
  const isLoadingData = isLoadingExisting || isLoadingNew;
  const isErrorData = isErrorExisting || isErrorNew;
  const subjectData = lessonData;

  // Reset results when subject or topic changes
  useEffect(() => {
    setShowResults(false);
    setLessonData(null);
  }, [selectedSubject, topic]);

  // Ensure isSubmitting is properly reset when API request completes
  useEffect(() => {
    if (!isLoadingData && isSubmitting) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsSubmitting(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoadingData, isSubmitting]);

  // Helper function to check if both fields are valid (non-empty after trimming)
  const isFormValid = () => {
    return selectedSubject.trim().length > 0 && topic.trim().length > 0;
  };

  // Helper function to determine if button should be disabled
  const isButtonDisabled = () => {
    return isSubmitting || isLoadingData;
  };

  // Helper function to determine button visual state
  const getButtonVisualState = () => {
    if (isButtonDisabled()) {
      return "disabled"; // Fully disabled during submission/loading
    }
    if (!isFormValid()) {
      return "invalid"; // Visually dimmed but clickable when form is invalid
    }
    return "valid"; // Normal state when form is valid and not submitting
  };

  // Helper function to reset form and return to search
  const handleNewSearch = () => {
    setShowResults(false);
    setSelectedSubject("");
    setTopic("");
    setLessonData(null);
    setIncludeWikipedia(true);
    setUseKnowledgeStore(true);
  };

  // Handle complete lesson TTS
  const handleCompleteLessonTTS = async () => {
    if (!subjectData) return;

    try {
      toast.loading("🎵 Generating complete lesson audio...", {
        id: "complete-lesson-tts",
        duration: 5000,
      });

      const result = await ttsUtils.generateCompleteLessonTTS(generateTTS, subjectData);

      toast.dismiss("complete-lesson-tts");
      toast.success("🎵 Complete lesson audio ready! Playing...", {
        duration: 3000,
      });

      // Play the complete lesson audio
      await ttsUtils.playAudio(result.full_audio_url);

    } catch (error) {
      console.error("Complete lesson TTS error:", error);
      toast.dismiss("complete-lesson-tts");
      toast.error("❌ Failed to generate complete lesson audio", {
        duration: 3000,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent submission if already processing
    if (isButtonDisabled()) {
      return;
    }

    // Validate form fields and show toast notification if invalid
    if (!isFormValid()) {
      toast.error(
        "Please fill in both Subject and Topic fields before exploring.",
        {
          icon: "⚠️",
          duration: 3000,
        }
      );
      return;
    }

    // Set submitting state immediately to prevent double-submission
    setIsSubmitting(true);
    setShowResults(false);
    setLessonData(null);

    // Show initial toast to inform user about expected wait time
    toast.loading(
      "🤖 Generating lesson with AI...\n⏱️ This may take 1-2 minutes. Please be patient!",
      {
        id: "lesson-generation", // Use ID to update this toast later
        duration: 4000, // Show for 4 seconds
        style: {
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          fontSize: '14px',
          maxWidth: '400px',
        },
      }
    );

    try {
      // Use trimmed values for the API call
      const trimmedSubject = selectedSubject.trim();
      const trimmedTopic = topic.trim();

      // Step 1: Create lesson with POST request
      console.log("Step 1: Creating lesson...");
      console.log("POST URL:", `http://192.168.0.70:8000/lessons`);
      console.log("POST Body:", {
        subject: trimmedSubject,
        topic: trimmedTopic,
        user_id: userId,
        include_wikipedia: includeWikipedia,
        force_regenerate: true,
      });

      const createResponse = await createLesson({
        subject: trimmedSubject,
        topic: trimmedTopic,
        user_id: userId,
        include_wikipedia: includeWikipedia,
        force_regenerate: true,
      });

      console.log("POST Response:", createResponse);

      if (createResponse.error) {
        throw (
          createResponse.error ||
          new Error("Failed to initiate lesson creation")
        );
      }

      // Step 2: Get task_id from the response and poll for completion
      const taskId = createResponse.data?.task_id;
      if (!taskId) {
        throw new Error("No task ID received from lesson creation");
      }

      console.log("Step 2: Polling for lesson completion using task ID:", taskId);
      const maxAttempts = 60; // 60 attempts with 2 second intervals = 2 minutes timeout
      let attempts = 0;
      let lessonFound = false;

      while (attempts < maxAttempts && !lessonFound) {
        attempts++;
        console.log(`Polling attempt ${attempts}/${maxAttempts} for task ${taskId}...`);

        // Wait 2 seconds between attempts (lesson generation takes time)
        if (attempts > 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        try {
          // Check task status using the status endpoint
          const statusResponse = await fetch(`${API_BASE_URL}/lessons/status/${taskId}`);
          const statusData = await statusResponse.json();

          console.log(`Status Response (attempt ${attempts}):`, statusData);

          if (statusData.status === 'completed' && statusData.lesson_data) {
            // Successfully retrieved lesson data
            console.log("Lesson generation completed:", statusData.lesson_data);
            setLessonData(statusData.lesson_data);
            setShowResults(true);
            lessonFound = true;

            // Dismiss the loading toast and show success
            toast.dismiss("lesson-generation");
            toast.success(
              `✨ Lesson generated successfully!\n📚 ${trimmedSubject}: ${trimmedTopic}`,
              {
                duration: 4000,
                style: {
                  background: 'rgba(34, 197, 94, 0.9)',
                  color: '#fff',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  maxWidth: '400px',
                },
              }
            );
          } else if (statusData.status === 'failed') {
            throw new Error(statusData.error_message || "Lesson generation failed");
          } else if (statusData.status === 'in_progress') {
            console.log("Lesson generation in progress...");
            // Update toast with progress info every 10 attempts (20 seconds)
            if (attempts % 10 === 0) {
              toast.loading(
                `🤖 AI is generating your lesson...\n⏱️ ${Math.floor(attempts * 2 / 60)}:${String(attempts * 2 % 60).padStart(2, '0')} elapsed`,
                {
                  id: "lesson-generation",
                  style: {
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    maxWidth: '400px',
                  },
                }
              );
            }
            // Continue polling
          } else if (statusData.status === 'pending') {
            console.log("Lesson generation pending...");
            // Continue polling
          }
        } catch (pollError) {
          console.log(`Polling attempt ${attempts} failed:`, pollError);
          // Continue polling unless it's the last attempt
          if (attempts === maxAttempts) {
            throw pollError;
          }
        }
      }

      if (!lessonFound) {
        // Show timeout warning
        toast.dismiss("lesson-generation");
        throw new Error("Lesson generation timed out after 2 minutes");
      }
    } catch (err) {
      console.error("Error in lesson generation process:", err);

      // Dismiss the loading toast first
      toast.dismiss("lesson-generation");

      // Show appropriate error toast
      if (
        err.status === "TIMEOUT_ERROR" ||
        err.message?.includes("timed out")
      ) {
        toast.error(
          "⏱️ Lesson generation is taking longer than expected.\n🔄 Please try again later.",
          {
            duration: 5000,
            style: {
              background: 'rgba(239, 68, 68, 0.9)',
              color: '#fff',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              fontSize: '14px',
              maxWidth: '400px',
            },
          }
        );
      } else {
        toast.error(
          "⚠️ Sorry, the AI service is currently unavailable.\n🔄 Please try again later.",
          {
            duration: 4000,
            style: {
              background: 'rgba(239, 68, 68, 0.9)',
              color: '#fff',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              fontSize: '14px',
              maxWidth: '400px',
            },
          }
        );
      }

      // Show results to display error message
      setShowResults(true);
    } finally {
      // Always reset submitting state in finally block
      // This ensures the button is re-enabled even if there's an unexpected error
      setIsSubmitting(false);
    }
  };

  return (
    <GlassContainer>
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Show input form only when no results are displayed */}
        {!showResults && (
          <>
            <h2
              className="text-5xl md:text-6xl font-extrabold mb-8 drop-shadow-xl transition-all duration-300 bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent text-center"
              style={{
                fontFamily: "Tiro Devanagari Hindi, serif",
              }}
            >
              Subject Explorer
            </h2>
            <p
              className="text-xl md:text-2xl font-medium mb-10 text-center text-white/90"
              style={{
                fontFamily: "Inter, Poppins, sans-serif",
              }}
            >
              Select a subject and enter a topic to begin your learning journey
            </p>
            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-8 max-w-3xl mx-auto bg-white/10 p-8 rounded-xl backdrop-blur-md border border-white/20 shadow-lg"
            >
              <div className="relative group">
                <label className="text-white/90 block mb-3 font-medium text-lg">
                  Subject:
                </label>
                <div className="relative">
                  <GlassInput
                    type="text"
                    placeholder="Type any subject (e.g. Mathematics, Physics, History)"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    icon={Book}
                    autoComplete="off"
                    className="text-lg py-3"
                    disabled={isButtonDisabled()}
                  />
                </div>
              </div>

              <div>
                <label className="text-white/90 block mb-3 font-medium text-lg">
                  Topic:
                </label>
                <GlassInput
                  type="text"
                  placeholder="Enter a topic to explore"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  icon={BookOpen}
                  className="text-lg py-3"
                  disabled={isButtonDisabled()}
                />
              </div>

              {/* Toggle Switches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Include Wikipedia Toggle */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/20">
                  <div>
                    <label className="text-white/90 font-medium text-lg block">
                      Include Wikipedia
                    </label>
                    <p className="text-white/60 text-sm mt-1">
                      Use Wikipedia data for enhanced content
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIncludeWikipedia(!includeWikipedia)}
                    disabled={isButtonDisabled()}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                      includeWikipedia ? "bg-amber-500" : "bg-gray-600"
                    } ${
                      isButtonDisabled()
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                        includeWikipedia ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Use Knowledge Store Toggle */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/20">
                  <div>
                    <label className="text-white/90 font-medium text-lg block">
                      Use Knowledge Store
                    </label>
                    <p className="text-white/60 text-sm mt-1">
                      Access curated knowledge database
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseKnowledgeStore(!useKnowledgeStore)}
                    disabled={isButtonDisabled()}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                      useKnowledgeStore ? "bg-amber-500" : "bg-gray-600"
                    } ${
                      isButtonDisabled()
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                        useKnowledgeStore ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-center mt-10 relative">
                <div
                  className="relative"
                  onMouseEnter={() => setIsButtonHovered(true)}
                  onMouseLeave={() => setIsButtonHovered(false)}
                >
                  <GlassButton
                    type="submit"
                    icon={
                      isButtonHovered && !isFormValid() && !isButtonDisabled()
                        ? AlertCircle
                        : Search
                    }
                    variant="primary"
                    className={`px-10 py-4 text-lg font-medium transition-all duration-300 ${
                      getButtonVisualState() === "invalid" ? "opacity-75" : ""
                    } ${
                      getButtonVisualState() === "disabled"
                        ? "cursor-not-allowed"
                        : ""
                    }`}
                    disabled={isButtonDisabled()}
                    aria-label={
                      isButtonDisabled()
                        ? "Processing request, please wait..."
                        : !isFormValid()
                        ? "Please fill in both Subject and Topic fields to explore"
                        : "Explore the selected topic"
                    }
                  >
                    {isButtonDisabled() ? "Searching..." : "Explore Topic"}
                  </GlassButton>
                </div>
              </div>
            </form>
          </>
        )}

        {/* Results Section */}
        {showResults && (
          <div className="bg-white/20 rounded-xl p-8 backdrop-blur-md border border-white/30 shadow-xl">
            {isLoadingData || isSubmitting ? (
              <div className="flex flex-col items-center justify-center my-12">
                <CenteredLoader />
                <p className="mt-6 text-white/80 text-center text-lg">
                  {isSubmitting
                    ? `Generating lesson content with Ollama for "${selectedSubject.trim()}: ${topic.trim()}"...`
                    : `Generating lesson content for "${selectedSubject.trim()}: ${topic.trim()}"...`
                  }
                  <br />
                  <span className="text-amber-300 text-base">
                    Using AI model to create authentic content. This may take up to 2 minutes...
                  </span>
                </p>
              </div>
            ) : isErrorData ? (
              <div className="text-red-400 text-center my-8 p-6 bg-white/5 rounded-xl border border-red-500/20">
                <p className="font-semibold mb-4 text-xl">
                  Sorry, the service is currently unavailable. Please try again
                  later.
                </p>
                <div className="mt-8">
                  <GlassButton
                    onClick={handleNewSearch}
                    variant="secondary"
                    className="px-6 py-3 text-lg"
                  >
                    Try Again
                  </GlassButton>
                </div>
              </div>
            ) : subjectData ? (
              <div className="space-y-8">
                {/* Structured lesson content */}
                <div className="space-y-10">
                  {/* Title */}
                  {subjectData?.title && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-amber-200">
                          {subjectData.title}
                        </h2>
                        <TTSButton
                          text={subjectData.title}
                          section="title"
                          variant="accent"
                          size="lg"
                        />
                      </div>
                      <div className="mt-3 flex justify-center">
                        <div className="bg-gradient-to-r from-amber-500/30 to-amber-600/30 text-amber-200 px-4 py-1.5 rounded-full text-base font-medium border border-amber-500/30 shadow-lg">
                          {selectedSubject.trim()}: {topic.trim()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shloka and Translation */}
                  {subjectData?.shloka && (
                    <div className="bg-amber-900/20 p-8 rounded-xl border border-amber-500/40 shadow-lg mx-auto max-w-4xl">
                      <div className="flex items-start justify-between mb-5">
                        <p className="italic text-amber-200 font-medium text-center text-xl leading-relaxed flex-1">
                          {subjectData.shloka}
                        </p>
                        <TTSButton
                          text={subjectData.shloka}
                          section="shloka"
                          variant="accent"
                          className="ml-4 flex-shrink-0"
                        />
                      </div>
                      {subjectData?.translation && (
                        <div className="bg-white/10 p-4 rounded-lg">
                          <div className="flex items-start justify-between">
                            <p className="text-white/90 text-base text-center flex-1">
                              <span className="text-amber-300 font-medium">
                                Translation:
                              </span>{" "}
                              {subjectData.translation}
                            </p>
                            <TTSButton
                              text={`Translation: ${subjectData.translation}`}
                              section="translation"
                              variant="secondary"
                              size="sm"
                              className="ml-4 flex-shrink-0"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation */}
                  {subjectData?.explanation && (
                    <div className="bg-white/10 p-6 rounded-xl shadow-lg border-l-4 border-amber-500">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-semibold text-white flex items-center">
                          <span className="bg-gradient-to-br from-amber-500 to-amber-600 w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white font-bold shadow-md">
                            1
                          </span>
                          Explanation
                        </h3>
                        <TTSButton
                          text={subjectData.explanation}
                          section="explanation"
                          variant="primary"
                        />
                      </div>
                      <p className="text-white/90 leading-relaxed text-lg">
                        {subjectData.explanation}
                      </p>
                    </div>
                  )}

                  {/* Activity */}
                  {subjectData?.activity && (
                    <div className="bg-indigo-900/30 p-6 rounded-xl shadow-lg border-l-4 border-indigo-500">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-semibold text-white flex items-center">
                          <span className="bg-gradient-to-br from-indigo-500 to-indigo-600 w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white font-bold shadow-md">
                            2
                          </span>
                          Activity
                        </h3>
                        <TTSButton
                          text={subjectData.activity}
                          section="activity"
                          variant="primary"
                        />
                      </div>
                      <p className="text-white/90 leading-relaxed text-lg">
                        {subjectData.activity}
                      </p>
                    </div>
                  )}

                  {/* Question */}
                  {subjectData?.question && (
                    <div className="bg-amber-900/30 p-6 rounded-xl shadow-lg border-l-4 border-amber-500">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-semibold text-white flex items-center">
                          <span className="bg-gradient-to-br from-amber-500 to-amber-600 w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white font-bold shadow-md">
                            3
                          </span>
                          Question to Consider
                        </h3>
                        <TTSButton
                          text={subjectData.question}
                          section="question"
                          variant="accent"
                        />
                      </div>
                      <p className="text-white/90 leading-relaxed text-lg">
                        {subjectData.question}
                      </p>
                    </div>
                  )}

                  {/* Fallback for legacy content format */}
                  {(subjectData?.lesson || subjectData?.content) &&
                    !subjectData?.title && (
                      <div
                        className="bg-white/10 p-6 rounded-xl shadow-lg border border-white/30"
                        dangerouslySetInnerHTML={{
                          __html: subjectData?.lesson || subjectData?.content,
                        }}
                      />
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex justify-center items-center gap-6 mt-12">
                  {/* Complete Lesson TTS Button */}
                  <GlassButton
                    onClick={handleCompleteLessonTTS}
                    disabled={isGeneratingTTS}
                    icon={Volume2}
                    variant="primary"
                    className="px-6 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    {isGeneratingTTS ? "Generating Audio..." : "🎵 Play Complete Lesson"}
                  </GlassButton>

                  {/* New Search Button */}
                  <GlassButton
                    onClick={handleNewSearch}
                    variant="secondary"
                    className="px-6 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    New Search
                  </GlassButton>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 bg-white/5 rounded-xl border border-white/20">
                <p className="text-white/80 mb-6 text-lg">
                  No data available. Please try a different topic.
                </p>
                <GlassButton
                  onClick={handleNewSearch}
                  variant="secondary"
                  className="px-6 py-3 text-lg font-medium shadow-lg"
                >
                  Try Again
                </GlassButton>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassContainer>
  );
}


