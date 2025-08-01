import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import languageReducer from "./languageSlice";
import uiReducer from "./uiSlice";
import authReducer from "./authSlice";
import settingsReducer from "./settingsSlice";
import { apiSlice } from "../api/apiSlice";
import { externalApiSlice } from "../api/externalApiSlice";
import { lessonApiSlice } from "../api/subjectsApiSlice";
import { ttsApiSlice } from "../api/ttsApiSlice";

export const store = configureStore({
  reducer: {
    language: languageReducer,
    ui: uiReducer,
    auth: authReducer,
    settings: settingsReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
    [externalApiSlice.reducerPath]: externalApiSlice.reducer,
    [lessonApiSlice.reducerPath]: lessonApiSlice.reducer,
    [ttsApiSlice.reducerPath]: ttsApiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(
      apiSlice.middleware,
      externalApiSlice.middleware,
      lessonApiSlice.middleware,
      ttsApiSlice.middleware
    ),
  devTools: process.env.NODE_ENV !== "production",
});

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

export default store;
