import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import dashboardReducer from "./slices/dashboardSlice";
import balanceReducer from "./slices/balanceSlice";
import transactionReducer from "./slices/transactionSlice";
import requestReducer from "./slices/requestSlice";
import ledgerReducer from "./slices/ledgerSlice";
import reportReducer from "./slices/reportSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    dashboard: dashboardReducer,
    balance: balanceReducer,
    transactions: transactionReducer,
    requests: requestReducer,
    ledger: ledgerReducer,
    reports: reportReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
