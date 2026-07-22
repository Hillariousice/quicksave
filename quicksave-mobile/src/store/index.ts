import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './slices/authSlice';
import walletReducer from './slices/walletSlice';
import groupReducer from './slices/groupSlice';
import notificationReducer from './slices/notificationSlice';
import contributionReducer from './slices/contributionSlice';
import networkReducer from './slices/networkSlice';
import offlineQueueReducer from './slices/offlineQueueSlice';
import chatReducer from './slices/chatSlice';
import socketReducer from './slices/socketSlice';
// 1. Combine all your slices into one root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  wallet: walletReducer,
  groups: groupReducer,
  notifications: notificationReducer,
  contributions: contributionReducer,
  network: networkReducer,
  offlineQueue: offlineQueueReducer,
  chat: chatReducer,
  socket: socketReducer,
});

// 2. Configure Redux Persist
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  // We only persist non-sensitive UI data.
  // Tokens stay in Expo SecureStore, but caching wallet/groups makes the app open instantly!
  whitelist: ['wallet', 'groups', 'auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// 3. Configure the Store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // We must ignore these specific action types so Redux Persist doesn't throw serializable errors
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: ['chat.messages', 'offlineQueue.pendingContributions'],
      },
    }),
});

export const persistor = persistStore(store);

// 4. Export Typed Hooks for the entire app!
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
