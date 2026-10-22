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

export default function HistoryDetail({ record, onClose }) {
  if (!record) return null;

  const { date, time } = splitDateTime(record.createdAt || record.calculatedAt);

  return (
    <aside className="w-full sm:w-[380px] xl:w-[420px] h-full flex flex-col bg-white border-l border-slate-200 shadow-xl shrink-0 overflow-hidden rounded-none md:rounded-2xl md:border md:border-slate-200">
      <div className={`flex items-center gap-2 px-3 py-3 text-white shrink-0 ${
        record.isOffline
          ? "bg-gradient-to-r from-amber-600 to-orange-700"
          : "bg-gradient-to-r from-slate-700 to-slate-800"
      }`}>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black tracking-wide uppercase">
            {record.isOffline ? "Offline (pending sync)" : "Calculation Detail"}
          </p>
          <p className="text-[11px] font-mono text-white/80 mt-0.5">
            {date} · {time}
            {record.isOffline ? " · not on server yet" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-lg font-bold w-8 h-8 rounded-lg hover:bg-white/20 active:scale-95 transition-all duration-150 leading-none"
          aria-label="Close detail"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-3 grid grid-cols-2 gap-2 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl shadow-sm border border-slate-200">
            <span className="text-xs font-bold text-slate-600">BUS-2 (kV)</span>
            <span className="text-sm font-black font-mono text-slate-800">
              {record.busVoltages?.bus2 != null
                ? Number(record.busVoltages.bus2).toFixed(2)
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl shadow-sm border border-slate-200">
            <span className="text-xs font-bold text-slate-600">BUS-1 (kV)</span>
            <span className="text-sm font-black font-mono text-slate-800">
              {record.busVoltages?.bus1 != null
                ? Number(record.busVoltages.bus1).toFixed(2)
                : "—"}
            </span>
          </div>
        </div>

        <div className="px-3 py-3">
          <div className="border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-slate-100">
                <tr className="border-b border-slate-200">
                  <th className="w-[33%] py-2 text-center font-bold text-slate-700 text-xs tracking-wider uppercase">
                    Load (A)
                  </th>
                  <th className="w-[34%] py-2 text-center font-bold text-slate-700 text-xs tracking-wider uppercase border-x border-slate-200">
                    Feeder
                  </th>
                  <th className="w-[33%] py-2 text-center font-bold text-slate-700 text-xs tracking-wider uppercase">
                    Load (MW)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(record.feeders || []).map((f, index) => (
                  <tr
                    key={f.id ?? index}
                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                  >
                    <td className="text-center py-2.5 font-bold font-mono text-sm text-slate-800 border-r border-slate-200">
                      {Number(f.amps || 0).toFixed(1)}
                    </td>
                    <td className="text-center font-bold text-slate-700 py-2.5 border-r border-slate-200 text-sm">
                      {f.name}
                      <span className="ml-1 text-[9px] font-semibold text-slate-400">
                        B{f.bus}
                      </span>
                      {f.ringActive && (
                        <span
                          className="ml-1 inline-block text-[8px] font-bold uppercase tracking-wide text-amber-800 bg-amber-100 border border-amber-300 rounded px-1"
                          title="33 kV ring line was active"
                        >
                          Ring
                        </span>
                      )}
                    </td>
                    <td className="text-center font-black text-emerald-700 py-2.5 font-mono text-sm">
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
          <div className="mx-3 mb-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold">
            33 kV ring line was active on one or more feeders for this reading.
          </div>
        )}

        <div className="px-3 pb-4 grid grid-cols-2 gap-2">
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-xl h-12 flex items-center justify-between px-3 shadow-md border border-slate-600/50">
            <span className="text-[10px] font-bold tracking-wide uppercase opacity-90">
              H3+T3
            </span>
            <span className="text-sm font-black font-mono text-emerald-400">
              {(Math.round((Number(record.bottail11kV || 0) + Number.EPSILON) * 10) / 10).toFixed(1)}{" "}
              <span className="text-[10px] font-bold opacity-80">MW</span>
            </span>
          </div>
          <div className="bg-gradient-to-br from-emerald-700 to-emerald-800 text-white rounded-xl h-12 flex items-center justify-between px-3 shadow-md border border-emerald-600/50">
            <span className="text-[10px] font-bold tracking-wide uppercase opacity-90">
              Total
            </span>
            <span className="text-sm font-black font-mono text-teal-300">
              {(Math.round((Number(record.totalMW || 0) + Number.EPSILON) * 10) / 10).toFixed(1)}{" "}
              <span className="text-[10px] font-bold opacity-80">MW</span>
            </span>
          </div>
        </div>

        {!record.isOffline && record._id && !String(record._id).startsWith("offline-") && (
          <div className="px-3 pb-4">
            <a
              href={`/manual?edit=${encodeURIComponent(record._id)}`}
              className="w-full inline-flex items-center justify-center h-10 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold uppercase tracking-wide shadow-md active:scale-[0.98] transition-all"
            >
              Edit this record
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
