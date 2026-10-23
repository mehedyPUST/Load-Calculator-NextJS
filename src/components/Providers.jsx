"use client";

import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

const baseToast = {
  duration: 3200,
  className: "app-toast",
  style: {
    background: "#0f172a",
    color: "#f8fafc",
    fontSize: "13px",
    fontWeight: 500,
    letterSpacing: "0.01em",
    lineHeight: 1.45,
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(148, 163, 184, 0.22)",
    boxShadow:
      "0 10px 40px -12px rgba(15, 23, 42, 0.45), 0 0 0 1px rgba(15, 23, 42, 0.06)",
    maxWidth: "min(420px, calc(100vw - 24px))",
  },
};

export default function Providers({ children }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={10}
        containerClassName="app-toast-container"
        containerStyle={{
          top: 16,
          zIndex: 99999,
        }}
        toastOptions={{
          ...baseToast,
          success: {
            duration: 2800,
            iconTheme: {
              primary: "#10b981",
              secondary: "#ecfdf5",
            },
            style: {
              ...baseToast.style,
              background: "#052e1c",
              color: "#ecfdf5",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              boxShadow:
                "0 12px 40px -14px rgba(5, 46, 28, 0.55), 0 0 0 1px rgba(16, 185, 129, 0.12)",
            },
          },
          error: {
            duration: 4200,
            iconTheme: {
              primary: "#f43f5e",
              secondary: "#fff1f2",
            },
            style: {
              ...baseToast.style,
              background: "#4c0519",
              color: "#ffe4e6",
              border: "1px solid rgba(244, 63, 94, 0.4)",
              boxShadow:
                "0 12px 40px -14px rgba(76, 5, 25, 0.55), 0 0 0 1px rgba(244, 63, 94, 0.12)",
            },
          },
          loading: {
            duration: Infinity,
            iconTheme: {
              primary: "#38bdf8",
              secondary: "#0c4a6e",
            },
            style: {
              ...baseToast.style,
              background: "#0c1a2e",
              color: "#e0f2fe",
              border: "1px solid rgba(56, 189, 248, 0.3)",
            },
          },
          blank: {
            style: {
              ...baseToast.style,
            },
          },
        }}
      />
    </AuthProvider>
  );
}
