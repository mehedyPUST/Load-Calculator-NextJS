"use client";

import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
    </AuthProvider>
  );
}
