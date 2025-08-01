import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { TTS_SERVICE_URL } from "../config";

// TTS Service Configuration
const TTS_BASE_URL = TTS_SERVICE_URL;

// Create TTS API slice
export const ttsApiSlice = createApi({
  reducerPath: "ttsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: TTS_BASE_URL,
    timeout: 30000, // 30 second timeout for TTS generation
  }),
  tagTypes: ["TTS"],
  endpoints: (builder) => ({
    // Generate TTS audio from text
    generateTTS: builder.mutation({
      query: (text) => {
        // Create FormData for the POST request
        const formData = new FormData();
        formData.append('text', text);

        return {
          url: "/api/generate",
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response) => {
        // Transform the response to include full audio URL
        return {
          ...response,
          full_audio_url: `${TTS_BASE_URL}${response.audio_url}`,
        };
      },
    }),

    // Get audio file
    getAudioFile: builder.query({
      query: (filename) => ({
        url: `/api/audio/${filename}`,
        method: "GET",
        responseHandler: (response) => response.blob(), // Return as blob for audio
      }),
      providesTags: (result, error, filename) => [
        { type: "TTS", id: filename },
      ],
    }),

    // List all audio files
    listAudioFiles: builder.query({
      query: () => "/api/list-audio-files",
      providesTags: ["TTS"],
    }),

    // Check TTS service health
    checkTTSHealth: builder.query({
      query: () => "/",
      transformResponse: (response) => ({
        ...response,
        service_url: TTS_BASE_URL,
        status: "online",
      }),
    }),
  }),
});

// Export hooks
export const {
  useGenerateTTSMutation,
  useGetAudioFileQuery,
  useLazyGetAudioFileQuery,
  useListAudioFilesQuery,
  useCheckTTSHealthQuery,
  useLazyCheckTTSHealthQuery,
} = ttsApiSlice;

// Export TTS utility functions
export const ttsUtils = {
  // Generate TTS for lesson content
  generateLessonTTS: async (generateTTS, content, section = "lesson") => {
    try {
      console.log(`Generating TTS for ${section}:`, content.substring(0, 100) + "...");

      const result = await generateTTS(content).unwrap();

      console.log(`TTS generated successfully for ${section}:`, result);
      return result;
    } catch (error) {
      console.error(`Error generating TTS for ${section}:`, error);
      throw error;
    }
  },

  // Create audio element and play
  playAudio: (audioUrl) => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);

      audio.onloadeddata = () => {
        console.log("Audio loaded successfully");
      };

      audio.onplay = () => {
        console.log("Audio playback started");
      };

      audio.onended = () => {
        console.log("Audio playback completed");
        resolve();
      };

      audio.onerror = (error) => {
        console.error("Audio playback error:", error);
        reject(error);
      };

      audio.play().catch(reject);
    });
  },

  // Format text for better TTS pronunciation
  formatTextForTTS: (text, type = "general") => {
    if (!text) return "";

    let formattedText = text;

    // Add pauses for better pronunciation
    if (type === "shloka") {
      // Add longer pauses for Sanskrit text
      formattedText = formattedText.replace(/।/g, "... ");
      formattedText = formattedText.replace(/॥/g, "... ... ");
    }

    if (type === "explanation" || type === "activity") {
      // Add pauses after sentences
      formattedText = formattedText.replace(/\./g, ". ");
      formattedText = formattedText.replace(/\?/g, "? ");
      formattedText = formattedText.replace(/!/g, "! ");
    }

    // Clean up extra spaces
    formattedText = formattedText.replace(/\s+/g, " ").trim();

    return formattedText;
  },

  // Generate TTS for complete lesson
  generateCompleteLessonTTS: async (generateTTS, lessonData) => {
    try {
      let completeText = "";

      if (lessonData.title) {
        completeText += `Title: ${lessonData.title}. `;
      }

      if (lessonData.shloka) {
        completeText += `Sanskrit Shloka: ${lessonData.shloka}. `;
      }

      if (lessonData.translation) {
        completeText += `Translation: ${lessonData.translation}. `;
      }

      if (lessonData.explanation) {
        completeText += `Explanation: ${lessonData.explanation}. `;
      }

      if (lessonData.activity) {
        completeText += `Activity: ${lessonData.activity}. `;
      }

      if (lessonData.question) {
        completeText += `Question to consider: ${lessonData.question}`;
      }

      const formattedText = ttsUtils.formatTextForTTS(completeText, "complete");

      return await ttsUtils.generateLessonTTS(generateTTS, formattedText, "complete-lesson");
    } catch (error) {
      console.error("Error generating complete lesson TTS:", error);
      throw error;
    }
  },
};

export default ttsApiSlice;
