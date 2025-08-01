import { apiSlice } from "./apiSlice";

export const coreApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get subjects
    getSubjects: builder.query({
      query: () => "/subjects_dummy",
      providesTags: ["Subjects"],
    }),

    // Get lectures
    getLectures: builder.query({
      query: () => "/lecture_dummy",
      providesTags: ["Lectures"],
    }),

    // Get tests
    getTests: builder.query({
      query: () => "/test_dummy",
      providesTags: ["Tests"],
    }),

    // Send chat message
    sendChatMessage: builder.mutation({
      query: ({ aiMessage, userQuery, userId, llmModel = "grok" }) => ({
        url: `/chatpost?user_id=${userId || "guest-user"}`,
        method: "POST",
        body: {
          message: userQuery,
          llm: llmModel,
          type: "chat_message",
        },
      }),
      invalidatesTags: ["ChatHistory"],
    }),

    // Fetch chatbot response
    fetchChatbotResponse: builder.query({
      query: (userId) => `/chatbot?user_id=${userId || "guest-user"}`,
      providesTags: ["ChatHistory"],
    }),

    // Convert text to speech
    convertTextToSpeech: builder.mutation({
      query: ({ text }) => ({
        url: "/text-to-speech",
        method: "POST",
        body: { text },
      }),
      transformResponse: (response) => response, // Returns blob
    }),

    // Get agent outputs
    getAgentOutputs: builder.query({
      query: () => "/get_agent_output",
      providesTags: ["AgentOutput"],
      keepUnusedDataFor: 30,
    }),

    // Get agent logs
    getAgentLogs: builder.query({
      query: () => "/agent_logs",
      providesTags: ["AgentLogs"],
      keepUnusedDataFor: 30,
    }),

    // Check simulation status
    checkSimulationStatus: builder.query({
      query: ({ taskId, userId }) => `/simulation-status/${taskId}?user_id=${userId || "guest-user"}`,
      providesTags: (result, error, { taskId }) => [
        { type: "FinancialSimulation", id: `status-${taskId}` },
      ],
    }),

    // Check learning task status
    checkLearningTaskStatus: builder.query({
      query: ({ taskId, userId }) => `/user/learning/${taskId}?user_id=${userId || "guest-user"}`,
      providesTags: (result, error, { taskId }) => [
        { type: "LearningTask", id: `status-${taskId}` },
      ],
    }),

    // Send user learning data
    sendUserLearningData: builder.mutation({
      query: ({ message, userId, documentId, wait = false }) => ({
        url: `/user/learning?wait=${wait}`,
        method: "POST",
        body: {
          user_id: userId || "guest-user",
          query: message,
          ...(documentId && { pdf_id: documentId }),
        },
      }),
      invalidatesTags: ["LearningTask"],
    }),

    // Upload PDF for chat
    uploadPdfForChatLegacy: builder.mutation({
      query: ({ file, userId }) => {
        const formData = new FormData();
        formData.append("user_id", userId || "guest-user");
        formData.append("pdf_file", file);
        
        return {
          url: "/pdf/chat",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["PdfChat"],
    }),
  }),
});

export const {
  useGetSubjectsQuery,
  useGetLecturesQuery,
  useGetTestsQuery,
  useSendChatMessageMutation,
  useLazyFetchChatbotResponseQuery,
  useConvertTextToSpeechMutation,
  useGetAgentOutputsQuery,
  useGetAgentLogsQuery,
  useLazyCheckSimulationStatusQuery,
  useLazyCheckLearningTaskStatusQuery,
  useSendUserLearningDataMutation,
  useUploadPdfForChatLegacyMutation,
} = coreApiSlice;
