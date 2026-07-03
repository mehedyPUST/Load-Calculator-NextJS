export default function FeederTable({
    tableData,
    amps,
    calculateMW,
    onAmpChange,
    onAmpBlur,
    handleWheel,
    handleKeyDown
}) {
    return (
        <div className="px-3 pb-2 flex-1 overflow-hidden">
            <table className="w-full text-xs">
                <thead>
                    <tr className="bg-emerald-50">
                        <th className="py-2 text-left pl-3 font-medium text-emerald-700">AMPS (A)</th>
                        <th className="py-2 text-center font-medium text-emerald-700">FEEDER</th>
                        <th className="py-2 text-right pr-3 font-medium text-emerald-700">MW</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {tableData.map((item, index) => {
                        const mw = calculateMW(item.id);
                        const ampValue = amps[item.id] || "";
                        return (
                            <tr key={item.id} className={`text-xs ${index % 2 === 0 ? 'bg-white' : 'bg-emerald-50/50'}`}>
                                <td className="pl-3 py-2">
                                    <input
                                        type="text"
                                        value={ampValue}
                                        onChange={(e) => onAmpChange(item.id, e.target.value)}
                                        onBlur={() => onAmpBlur(item.id)}
                                        onWheel={handleWheel}
                                        onKeyDown={handleKeyDown}
                                        className="w-16 text-center border border-slate-300 rounded-lg py-1 px-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </td>
                                <td className="text-center font-medium text-slate-700">{item.name}</td>
                                <td className="text-right pr-3 font-semibold text-emerald-700">
                                    {mw !== null ? mw.toFixed(2) : "0.0"} MW
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}