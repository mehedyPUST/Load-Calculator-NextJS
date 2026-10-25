"use client";

import { motion } from "motion/react";

/**
 * Universal professional skeleton component with subtle shimmer animation
 */
export function SkeletonShimmer({ className = "" }) {
  return (
    <div
      className={`relative overflow-hidden bg-slate-800/60 rounded-md ${className}`}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          repeat: Infinity,
          duration: 1.6,
          ease: "linear",
        }}
      />
    </div>
  );
}

export function SkeletonLine({ className = "h-4 w-full", rounded = "rounded-md" }) {
  return <SkeletonShimmer className={`${className} ${rounded}`} />;
}

export function SkeletonStatCard({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3"
        >
          <div className="flex items-center justify-between">
            <SkeletonLine className="h-3 w-24" />
            <SkeletonLine className="h-4 w-4 rounded-full" />
          </div>
          <SkeletonLine className="h-7 w-32" />
          <SkeletonLine className="h-3 w-40" />
        </div>
      ))}
    </div>
  );
}

export default function SkeletonTable({
  rows = 9,
  columns = 5,
  dark = true,
  showHeader = true,
}) {
  return (
    <div
      className={`w-full overflow-hidden rounded-xl border ${
        dark
          ? "border-slate-800/80 bg-slate-900/40"
          : "border-slate-200 bg-white"
      } shadow-sm backdrop-blur-sm`}
    >
      <table className="w-full table-fixed border-collapse">
        {showHeader && (
          <thead
            className={
              dark
                ? "bg-slate-800/60 border-b border-slate-800 text-slate-400"
                : "bg-slate-100 border-b border-slate-200 text-slate-600"
            }
          >
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="py-2.5 px-3 text-center">
                  <SkeletonShimmer
                    className={`h-3.5 mx-auto rounded ${
                      i === 0 ? "w-8" : i === 1 ? "w-28" : "w-16"
                    } ${dark ? "bg-slate-700/60" : "bg-slate-300"}`}
                  />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className={dark ? "divide-y divide-slate-800/60" : "divide-y divide-slate-200"}>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className={
                dark
                  ? rowIndex % 2 === 0
                    ? "bg-slate-900/20"
                    : "bg-slate-900/50"
                  : rowIndex % 2 === 0
                  ? "bg-white"
                  : "bg-slate-50/70"
              }
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="py-2.5 px-3 text-center">
                  <SkeletonShimmer
                    className={`h-4 mx-auto rounded ${
                      colIndex === 0
                        ? "w-6"
                        : colIndex === 1
                        ? "w-24"
                        : colIndex === columns - 1
                        ? "w-20"
                        : "w-14"
                    } ${dark ? "bg-slate-800/70" : "bg-slate-200"}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}