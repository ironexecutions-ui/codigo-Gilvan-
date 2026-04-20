import { createContext, useContext, useState } from "react";
import LoadingLayout from "./loadinglayout";
import React from "react";

const LoadingContext = createContext();

export function LoadingProvider({ children }) {
    const [loading, setLoading] = useState(false);

    return (
        <LoadingContext.Provider value={{ loading, setLoading }}>
            {children}
            {loading && <LoadingLayout />}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    return useContext(LoadingContext);
}
