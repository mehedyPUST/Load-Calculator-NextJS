// src/components/Calculator.jsx
"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

// ---------- DATA ----------
const tableData = [
    { id: 1, name: "BRB", bus: 2 },
    { id: 2, name: "MRS", bus: 1 },
    { id: 3, name: "Mozompur", bus: 2 },
    { id: 4, name: "Housing", bus: 1 },
    { id: 5, name: "Rajbari", bus: 1 },
    { id: 6, name: "Campus", bus: 2 },
    { id: 7, name: "Koburhat", bus: 2 },
    { id: 8, name: "H-3", bus: 1 },
    { id: 9, name: "T-3", bus: 2 },
];

export default function Calculator() {
    const [busVoltages, setBusVoltages] = useState({ bus1: "", bus2: "" });
    const [amps, setAmps] = useState(() => {
        const initial = {};
        tableData.forEach(item => initial[item.id] = "0");
        return initial;
    });
    const [calculate, setCalculate] = useState(false);
    const [currentTime, setCurrentTime] = useState("");

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
            const dateStr = now.toLocaleDateString('en-US', options);
            const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setCurrentTime(`${dateStr} ${timeStr}`);
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleBusVoltageChange = (bus, value) => {
        setBusVoltages(prev => ({ ...prev, [bus]: value }));
        setCalculate(false);
    };

    const handleAmpChange = (id, value) => {
        setAmps(prev => ({ ...prev, [id]: value }));
        setCalculate(false);
    };

    const handleAmpBlur = (id) => {
        if (!amps[id] || amps[id].trim() === "") {
            setAmps(prev => ({ ...prev, [id]: "0" }));
        }
    };

    const handleCalculate = () => {
        if (!busVoltages.bus1.trim() || !busVoltages.bus2.trim()) {
            toast.error("Please enter voltages for both BUS-1 and BUS-2.", {
                style: { fontWeight: 'bold' }
            });
            return;
        }
        setCalculate(true);
        toast.success("Load calculated successfully!");
    };

    const handleWheel = (e) => {
        e.preventDefault();
        e.target.blur();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
    };

    const calculateMW = (id) => {
        if (!calculate) return null;
        const item = tableData.find(i => i.id === id);
        const amp = parseFloat(amps[id]) || 0;
        if (amp <= 0) return null;
        const voltage = item.bus === 1 ? parseFloat(busVoltages.bus1) : parseFloat(busVoltages.bus2);
        if (!voltage || voltage <= 0) return null;
        return (Math.sqrt(3) * voltage * 0.95 * amp) / 1000;
    };

    const totalMW = tableData.reduce((sum, item) => sum + (calculateMW(item.id) || 0), 0);
    const bottail11kV = (calculateMW(8) || 0) + (calculateMW(9) || 0);

    const handleCopyTotal = () => {
        const mwValue = calculate ? Math.round(totalMW) : 0;
        const textToCopy = `Bottail : ${mwValue} MW`;
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                toast.success(`Copied: ${textToCopy}`, {
                    icon: '📋',
                    style: { fontWeight: 'bold' }
                });
            })
            .catch(err => {
                console.error("Failed to copy: ", err);
                toast.error("Failed to copy text.");
            });
    };

    return (
        <div className="h-[100dvh] md:min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-zinc-950 flex items-center justify-center p-0 md:p-4 antialiased overflow-hidden">
            <Toaster position="top-center" reverseOrder={false} />

            {/* Main Container: justify-between পরিবর্তন করে justify-start করা হয়েছে */}
            <div className="w-full h-full md:h-auto max-w-xl bg-white rounded-none md:rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col justify-start border-0 md:border border-slate-200">

                {/* Top Section Group (Header + Clock + Inputs) */}
                <div className="flex flex-col flex-shrink-0">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-3 md:px-6 py-2 md:py-4 flex flex-row items-center justify-center gap-3 md:gap-4 shadow-md">
                        <img
                            src="https://i.ibb.co.com/sL3vSkg/Logo.png"
                            alt="WZPDCL Logo"
                            className="w-9 h-9 md:w-14 md:h-14 object-contain bg-white rounded-full p-0.5 shadow-md border border-emerald-600 flex-shrink-0"
                        />
                        <div className="text-left">
                            <h1 className="text-xs md:text-lg font-black tracking-wide uppercase leading-tight">WZPDCL - Bottail-Kushtia</h1>
                            <p className="text-[10px] md:text-sm text-emerald-100 font-semibold opacity-95">33/11 KV Power Substation</p>
                            <p className="text-[8px] md:text-xs mt-0.5 font-bold tracking-widest text-teal-300 uppercase">Load Calculator Dashboard</p>
                        </div>
                    </div>

                    {/* Digital Monospace Clock */}
                    <div className="bg-zinc-900 text-emerald-400 text-center py-1.5 md:py-4 text-[11px] md:text-base font-extrabold tracking-widest font-mono border-b border-zinc-950 uppercase border-t border-zinc-800">
                        <span className="bg-zinc-950/60 px-2 md:px-4 py-0.5 md:py-1.5 rounded md:rounded-md border border-zinc-800/80 shadow-sm inline-block">
                            ⏰ {currentTime}
                        </span>
                    </div>

                    {/* Bus Voltages Inputs */}
                    <div className="p-2 md:p-4 grid grid-cols-2 gap-2 md:gap-4 bg-slate-50 border-b border-slate-200">
                        <div className="relative flex items-center justify-between bg-white px-2 md:px-4 py-1 md:py-2 rounded-xl shadow-sm border border-slate-200 hover:border-emerald-500 transition-colors group">
                            <label className="text-[10px] md:text-sm font-bold text-slate-600 tracking-wide mr-1 group-hover:text-emerald-700">
                                BUS-2 (kV)
                            </label>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={busVoltages.bus2}
                                onChange={(e) => handleBusVoltageChange("bus2", e.target.value)}
                                placeholder="0.00"
                                onWheel={handleWheel}
                                onKeyDown={handleKeyDown}
                                className="w-14 md:w-24 h-6.5 md:h-9 bg-slate-50 border border-slate-200 rounded-md md:rounded-lg text-center text-xs md:text-base font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all font-mono"
                            />
                        </div>
                        <div className="relative flex items-center justify-between bg-white px-2 md:px-4 py-1 md:py-2 rounded-xl shadow-sm border border-slate-200 hover:border-emerald-500 transition-colors group">
                            <label className="text-[10px] md:text-sm font-bold text-slate-600 tracking-wide mr-1 group-hover:text-emerald-700">
                                BUS-1 (kV)
                            </label>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={busVoltages.bus1}
                                onChange={(e) => handleBusVoltageChange("bus1", e.target.value)}
                                placeholder="0.00"
                                onWheel={handleWheel}
                                onKeyDown={handleKeyDown}
                                className="w-14 md:w-24 h-6.5 md:h-9 bg-slate-50 border border-slate-200 rounded-md md:rounded-lg text-center text-xs md:text-base font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* Middle Section: Table Content (flex-grow-0 সেট করা হয়েছে যেন অতিরিক্ত স্পেস তৈরি না করে) */}
                <div className="px-2 md:p-4 flex-grow-0 overflow-y-auto bg-white flex flex-col justify-start">
                    <div className="border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full table-fixed border-collapse">
                            <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm">
                                <tr className="border-b border-slate-200">
                                    <th className="w-[33%] py-1 md:py-2 text-center font-bold text-slate-700 text-[10px] md:text-sm tracking-wider uppercase">LOAD (AMPS)</th>
                                    <th className="w-[34%] py-1 md:py-2 text-center font-bold text-slate-700 text-[10px] md:text-sm tracking-wider uppercase border-x border-slate-200">FEEDER</th>
                                    <th className="w-[33%] py-1 md:py-2 text-center font-bold text-slate-700 text-[10px] md:text-sm tracking-wider uppercase">LOAD (MW)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {tableData.map((item, index) => {
                                    const mw = calculateMW(item.id);
                                    return (
                                        <tr key={item.id} className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-emerald-50/20 transition-colors`}>
                                            <td className="p-0 border-r border-slate-200">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    pattern="[0-9]*"
                                                    value={amps[item.id]}
                                                    onChange={(e) => handleAmpChange(item.id, e.target.value)}
                                                    onBlur={() => handleAmpBlur(item.id)}
                                                    onWheel={handleWheel}
                                                    onKeyDown={handleKeyDown}
                                                    className="w-full h-7 md:h-9 bg-transparent text-center text-xs md:text-base font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 font-mono transition-all"
                                                />
                                            </td>
                                            <td className="text-center font-bold text-slate-700 py-0.5 md:py-1.5 truncate px-1 md:px-3 border-r border-slate-200 text-xs md:text-base">
                                                {item.name}
                                            </td>
                                            <td className="text-center font-black text-emerald-700 py-0.5 md:py-1.5 font-mono text-xs md:text-base">
                                                {mw !== null ? mw.toFixed(2) : "0.00"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom Section Group: mt-2 দিয়ে টেবিলের সাথে ক্লোজ রাখা হয়েছে, এবং ফুটারকে নিচে পুশ করতে md:mt-auto ব্যবহার করা হয়েছে */}
                <div className="flex flex-col flex-shrink-0 bg-white mt-2 md:mt-auto">
                    {/* Calculated Output Display Blocks */}
                    <div className="px-2 md:px-4 pb-2 grid grid-cols-2 gap-2 md:gap-4">
                        <div className="bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-xl h-9 md:h-14 flex items-center justify-between px-2 md:px-4 shadow-md border border-slate-600/50">
                            <span className="text-[9px] md:text-xs font-bold tracking-wide uppercase opacity-90">Bottail 11kV: </span>
                            <span className="text-xs md:text-xl font-black font-mono tracking-tight text-emerald-400">
                                {calculate ? bottail11kV.toFixed(2) : "0.00"} MW
                            </span>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-700 to-emerald-800 text-white rounded-xl h-9 md:h-14 flex items-center justify-between px-2 md:px-4 shadow-md border border-emerald-600/50">
                            <span className="text-[9px] md:text-xs font-bold tracking-wide uppercase opacity-90">Total : </span>
                            <span className="text-xs md:text-xl font-black font-mono tracking-tight text-teal-300">
                                {calculate ? totalMW.toFixed(2) : "0.00"} MW
                            </span>
                        </div>
                    </div>

                    {/* Primary Function Buttons */}
                    <div className="px-2 md:px-4 pb-2 grid grid-cols-2 gap-2 md:gap-4">
                        <button
                            onClick={handleCalculate}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8.5 md:h-12 rounded-xl font-extrabold text-xs md:text-sm tracking-wide shadow-md active:scale-[0.98] transition-all border border-emerald-600 uppercase"
                        >
                            ⚡ Calculate
                        </button>
                        <button
                            onClick={handleCopyTotal}
                            className="bg-slate-800 hover:bg-slate-900 text-white h-8.5 md:h-12 rounded-xl font-extrabold text-xs md:text-sm tracking-wide shadow-md active:scale-[0.98] transition-all border border-slate-700 uppercase"
                        >
                            📋 Copy Total
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-100 text-slate-500 text-center py-1.5 md:py-3 text-[8px] md:text-[11px] font-bold tracking-wider border-t border-slate-200 uppercase mt-auto">
                        © All Rights Reserved || (SBA-Bottail), WZPDCL
                    </div>
                </div>

            </div>
        </div>
    );
}