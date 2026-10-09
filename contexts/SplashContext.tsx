"use client";

import { createContext, useContext } from "react";

export const SplashContext = createContext(false);
export const useSplashDone = () => useContext(SplashContext);
