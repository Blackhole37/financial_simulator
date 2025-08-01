import { apiSlice } from "./apiSlice";

export const financialApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Start financial simulation
    startFinancialSimulation: builder.mutation({
      query: (simulationData) => ({
        url: "/start-simulation",
        method: "POST",
        body: simulationData,
      }),
    }),

    // Check simulation status
    getSimulationStatus: builder.query({
      query: (taskId) => `/simulation-status/${taskId}`,
    }),

    // Get simulation results by task ID
    getSimulationResultsByTaskId: builder.query({
      query: (taskId) => `/simulation-results/${taskId}`,
    }),

    // Get all user simulation results
    getFinancialSimulationResults: builder.query({
      query: (userId) => `/get-simulation-result/${userId}`,
      providesTags: (result, error, userId) => [
        { type: "FinancialSimulation", id: `user-${userId}` },
      ],
    }),

    // Get real-time simulation updates
    getSimulationRealTimeUpdates: builder.query({
      query: (taskId) => `/simulation-results/${taskId}`,
      providesTags: (result, error, taskId) => [
        { type: "FinancialSimulation", id: `updates-${taskId}` },
      ],
    }),

    // Run direct simulation (synchronous)
    runDirectSimulation: builder.mutation({
      query: (userData) => ({
        url: "/run-direct-simulation",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["FinancialSimulation"],
    }),
  }),
});

export const {
  useStartFinancialSimulationMutation,
  useGetSimulationStatusQuery,
  useLazyGetSimulationStatusQuery,
  useGetSimulationResultsByTaskIdQuery,
  useLazyGetSimulationResultsByTaskIdQuery,
  useGetFinancialSimulationResultsQuery,
  useLazyGetFinancialSimulationResultsQuery,
  useGetSimulationRealTimeUpdatesQuery,
  useLazyGetSimulationRealTimeUpdatesQuery,
  useRunDirectSimulationMutation,
} = financialApiSlice;
