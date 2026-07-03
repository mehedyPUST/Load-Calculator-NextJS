export default function Results({ bottail11kV, totalMW, calculate }) {
    return (
        <div className="px-3 pb-2 grid grid-cols-2 gap-3 flex-shrink-0">
            <div className="bg-emerald-600 text-white rounded-2xl px-4 py-2 flex items-center justify-center gap-2">
                <span className="text-xs opacity-90">Bottail 11kV</span>
                <span className="font-bold text-lg">
                    {calculate ? bottail11kV.toFixed(2) : "0.0"} MW
                </span>
            </div>

            <div className="bg-blue-600 text-white rounded-2xl px-4 py-2 flex items-center justify-center gap-2">
                <span className="text-xs opacity-90">Total</span>
                <span className="font-bold text-lg">
                    {calculate ? totalMW.toFixed(2) : "0.0"} MW
                </span>
            </div>
        </div>
    );
}