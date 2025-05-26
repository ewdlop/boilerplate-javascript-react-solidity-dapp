import { configureStore } from '@reduxjs/toolkit';
import { tokenApi } from './apiSlice';

export const store = configureStore({
  reducer: {
    [tokenApi.reducerPath]: tokenApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(tokenApi.middleware),
}); 