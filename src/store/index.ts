import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice";

import superAdminAuthReducer from "./slices/superAdminAuthSlice";

import superAdminWalletReducer from "./slices/superAdminWalletSlice";

import superAdminReducer from "./slices/superAdminSlice";

import adminModuleReducer from "./slices/adminModuleSlice";

import userReducer from "./slices/userSlice";

import dashboardReducer from "./slices/dashboardSlice";

import transactionReducer from "./slices/transactionSlice";

import requestReducer from "./slices/requestSlice";

import ledgerReducer from "./slices/ledgerSlice";

import reportReducer from "./slices/reportSlice";



export const store = configureStore({

  reducer: {

    auth: authReducer,

    superAdminAuth: superAdminAuthReducer,

    superAdminWallet: superAdminWalletReducer,

    superAdmin: superAdminReducer,

    adminModule: adminModuleReducer,

    users: userReducer,

    dashboard: dashboardReducer,

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

