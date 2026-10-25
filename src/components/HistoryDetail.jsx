"use client";

function splitDateTime(iso) {
  if (!iso) return { date: "—", time: "—" };
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return { date, time };
}

export default function HistoryDetail({ record, onClose, onEdit }) {
  if (!record) return null;

  const { date, time } = splitDateTime(record.createdAt || record.calculatedAt);

  return (
    <aside className="w-full h-full flex flex-col bg-slate-900/70 border border-white/10 shadow-xl overflow-hidden rounded-none md:rounded-xl">
      <div
        className={`flex items-center gap-2 px-3.5 py-2.5 text-slate-100 shrink-0 ${
          record.isOffline
            ? "bg-amber-950/80 border-b border-amber-500/30"
            : "bg-slate-950/90 border-b border-white/10"
        }`}
      >
        <div className="flex-1 min-w-0">
          <p
            className={`text-xs font-semibold tracking-tight ${
              record.isOffline ? "text-amber-300" : "text-slate-100"
            }`}
          >
            {record.isOffline ? "Offline (pending sync)" : "Calculation Detail"}
          </p>
          <p className="text-[11px] font-mono tabular-nums text-slate-400 mt-0.5">
            {date} · {time}
            {record.isOffline ? " · not on server yet" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-lg font-bold w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-150 leading-none"
          aria-label="Close detail"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-3 grid grid-cols-2 gap-2 bg-slate-950/50 border-b border-white/10">
          <div className="flex items-center justify-between bg-purple-950/25 px-3 py-2.5 rounded-xl border border-purple-500/25">
            <span className="text-xs font-semibold text-purple-300">BUS-2 (kV)</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">
              {record.busVoltages?.bus2 != null
                ? Number(record.busVoltages.bus2).toFixed(2)
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between bg-sky-950/25 px-3 py-2.5 rounded-xl border border-sky-500/25">
            <span className="text-xs font-semibold text-sky-300">BUS-1 (kV)</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white">
              {record.busVoltages?.bus1 != null
                ? Number(record.busVoltages.bus1).toFixed(2)
                : "—"}
            </span>
          </div>
        </div>

        <div className="px-3 py-3">
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0b1220]">
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-slate-950">
                <tr className="border-b border-slate-800">
                  <th className="w-[33%] py-2 text-center font-semibold text-slate-400 text-xs">
                    Load (A)
                  </th>
                  <th className="w-[34%] py-2 text-center font-semibold text-slate-400 text-xs border-x border-slate-800">
                    Feeder
                  </th>
                  <th className="w-[33%] py-2 text-center font-semibold text-slate-400 text-xs">
                    Load (MW)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {(record.feeders || []).map((f, index) => (
                  <tr
                    key={f.id ?? index}
                    className={index % 2 === 0 ? "bg-[#0b1220]" : "bg-slate-900/60"}
                  >
                    <td className="text-center py-2.5 font-semibold font-mono tabular-nums text-sm text-slate-200 border-r border-slate-800">
                      {Number(f.amps || 0).toFixed(1)}
                    </td>
                    <td className="text-center font-semibold text-slate-100 py-2.5 border-r border-slate-800 text-sm">
                      {f.name}
                      <span
                        className={`ml-1 text-[10px] font-semibold ${
                          Number(f.bus) === 2 ? "text-purple-400" : "text-sky-400"
                        }`}
                      >
                        B{f.bus}
                      </span>
                      {f.ringActive && (
                        <span
                          className="ml-1 text-[10px] font-semibold text-amber-400"
                          title="33 kV ring line was active"
                        >
                          · Ring
                        </span>
                      )}
                    </td>
                    <td className="text-center font-bold text-emerald-400 py-2.5 font-mono tabular-nums text-sm">
                      {(Math.round((Number(f.mw || 0) + Number.EPSILON) * 10) / 10).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {(record.hasActiveRing ||
          (record.feeders || []).some((f) => f.ringActive)) && (
          <div className="mx-3 mb-2.5 px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px] font-medium">
            33 kV ring line was active on one or more feeders for this reading.
          </div>
        )}

        <div className="px-3 pb-4 grid grid-cols-2 gap-2">
          <div className="bg-slate-950/80 text-white rounded-xl h-12 flex items-center justify-between px-3 border border-teal-500/30">
            <span className="text-xs font-semibold text-slate-300">
              H3+T3
            </span>
            <span className="text-sm font-bold font-mono tabular-nums text-teal-400">
              {(Math.round((Number(record.bottail11kV || 0) + Number.EPSILON) * 10) / 10).toFixed(1)}{" "}
              <span className="text-[10px] font-medium text-slate-400">MW</span>
            </span>
          </div>
          <div className="bg-emerald-950/45 text-white rounded-xl h-12 flex items-center justify-between px-3 border border-emerald-500/35">
            <span className="text-xs font-semibold text-emerald-200">
              Total
            </span>
            <span className="text-sm font-bold font-mono tabular-nums text-emerald-400">
              {(Math.round((Number(record.totalMW || 0) + Number.EPSILON) * 10) / 10).toFixed(1)}{" "}
              <span className="text-[10px] font-medium text-emerald-300/80">MW</span>
            </span>
          </div>
        </div>

        {!record.isOffline && record._id && !String(record._id).startsWith("offline-") && (
          <div className="px-3 pb-4">
            {typeof onEdit === "function" ? (
              <button
                type="button"
                onClick={() => onEdit(record)}
                className="w-full inline-flex items-center justify-center h-10 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold tracking-wide shadow-md active:scale-[0.98] transition-all"
              >
                Edit this record
              </button>
            ) : (
              <a
                href={`/manual?edit=${encodeURIComponent(record._id)}`}
                className="w-full inline-flex items-center justify-center h-10 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold tracking-wide shadow-md active:scale-[0.98] transition-all"
              >
                Edit this record
              </a>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
