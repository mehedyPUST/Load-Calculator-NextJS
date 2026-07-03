// src/components/Calculator.jsx
"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast"; // toast এবং Toaster ইম্পোর্ট করা হয়েছে

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
            // alert এর জায়গায় toast.error ব্যবহার করা হয়েছে
            toast.error("Please enter voltages for both BUS-1 and BUS-2 before calculating.", {
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
                // alert এর জায়গায় toast.success ব্যবহার করা হয়েছে
                toast.success(`Copied to clipboard: ${textToCopy}`, {
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
        <div className="min-h-screen bg-linear-to-br from-slate-800 via-slate-900 to-zinc-950 flex items-center justify-center p-4 antialiased">
            {/* React Hot Toast Container */}
            <Toaster position="top-center" reverseOrder={false} />

            {/* Main Premium Card CONTAINER */}
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col justify-start border border-slate-200">

                {/* Header Section */}
                {/* Header Section */}
                <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-4 flex-shrink-0 shadow-md">
                    <img
                        src="https://i.ibb.co.com/sL3vSkg/Logo.png"
                        alt="WZPDCL Logo"
                        className="w-14 h-14 object-contain bg-white rounded-full p-0.5 shadow-md border border-emerald-600"
                    />
                    {/* text-left পরিবর্তন করে text-center এবং sm:text-left করা হয়েছে যেন দেখতে প্রফেশনাল লাগে */}
                    <div className="text-center sm:text-left">
                        <h1 className="text-lg font-black tracking-wide uppercase leading-tight">WZPDCL - Bottail-Kushtia</h1>
                        <p className="text-sm text-emerald-100 font-semibold opacity-95">33/11 KV Power Substation</p>
                        <p className="text-xs mt-0.5 font-bold tracking-widest text-teal-300 uppercase">Load Calculator Dashboard</p>
                    </div>
                </div>

                {/* Digital Monospace Clock */}
                <div className="bg-zinc-900 text-emerald-400 text-center py-4 text-sm md:text-base font-extrabold tracking-widest shrink-0 font-mono shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] border-b border-zinc-950 uppercase border-t border-zinc-800">
                    <span className="bg-zinc-950/60 px-4 py-1.5 rounded-md border border-zinc-800/80 shadow-sm inline-block">
                        ⏰ {currentTime}
                    </span>
                </div>

                {/* Bus Voltages Inputs */}
                <div className="p-4 grid grid-cols-2 gap-4 bg-slate-50 border-b border-slate-200">
                    <div className="relative flex items-center justify-between bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200/80 hover:border-emerald-500 transition-colors group">
                        <label className="text-sm font-bold text-slate-600 tracking-wide mr-2 shrink-0 group-hover:text-emerald-700 transition-colors">
                            BUS-2 (kV)
                        </label>
                        <input
                            type="number"
                            value={busVoltages.bus2}
                            onChange={(e) => handleBusVoltageChange("bus2", e.target.value)}
                            placeholder="0.00"
                            onWheel={handleWheel}
                            onKeyDown={handleKeyDown}
                            className="w-24 h-9 bg-slate-50 border border-slate-200 rounded-lg text-center text-base font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all font-mono"
                        />
                    </div>
                    <div className="relative flex items-center justify-between bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200/80 hover:border-emerald-500 transition-colors group">
                        <label className="text-sm font-bold text-slate-600 tracking-wide mr-2 shrink-0 group-hover:text-emerald-700 transition-colors">
                            BUS-1 (kV)
                        </label>
                        <input
                            type="number"
                            value={busVoltages.bus1}
                            onChange={(e) => handleBusVoltageChange("bus1", e.target.value)}
                            placeholder="0.00"
                            onWheel={handleWheel}
                            onKeyDown={handleKeyDown}
                            className="w-24 h-9 bg-slate-50 border border-slate-200 rounded-lg text-center text-base font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all font-mono"
                        />
                    </div>
                </div>

                {/* Premium Table Content */}
                <div className="px-4 py-4 flex flex-col bg-white">
                    <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm">
                        <table className="w-full table-fixed border-collapse">
                            <thead>
                                <tr className="bg-slate-100 border-b border-slate-200">
                                    <th className="w-[33%] py-2 text-center font-bold text-slate-700 text-sm tracking-wider uppercase">LOAD (AMPS)</th>
                                    <th className="w-[34%] py-2 text-center font-bold text-slate-700 text-sm tracking-wider uppercase border-x border-slate-200">FEEDER</th>
                                    <th className="w-[33%] py-2 text-center font-bold text-slate-700 text-sm tracking-wider uppercase">LOAD (MW)</th>
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
                                                    value={amps[item.id]}
                                                    onChange={(e) => handleAmpChange(item.id, e.target.value)}
                                                    onBlur={() => handleAmpBlur(item.id)}
                                                    onWheel={handleWheel}
                                                    onKeyDown={handleKeyDown}
                                                    className="w-full h-9 bg-transparent text-center text-base font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 font-mono transition-all"
                                                />
                                            </td>
                                            <td className="text-center font-bold text-slate-700 py-1.5 truncate px-3 border-r border-slate-200 text-base">
                                                {item.name}
                                            </td>
                                            <td className="text-center font-black text-emerald-700 py-1.5 font-mono text-base">
                                                {mw !== null ? mw.toFixed(2) : "0.00"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Calculated Output Display Blocks */}
                <div className="px-4 pb-3 grid grid-cols-2 gap-4 bg-white">
                    <div className="bg-linear-to-br from-slate-700 to-slate-800 text-white rounded-xl h-14 flex items-center justify-between px-4 shadow-md border border-slate-600/50">
                        <span className="text-xs font-bold tracking-wide uppercase opacity-90">Bottail 11kV: </span>
                        <span className="text-xl font-black font-mono tracking-tight text-emerald-400">
                            {calculate ? bottail11kV.toFixed(2) : "0.00"} MW
                        </span>
                    </div>

                    <div className="bg-linear-to-br from-emerald-700 to-emerald-800 text-white rounded-xl h-14 flex items-center justify-between px-4 shadow-md border border-emerald-600/50">
                        <span className="text-xs font-bold tracking-wide uppercase opacity-90">Total : </span>
                        <span className="text-xl font-black font-mono tracking-tight text-teal-300">
                            {calculate ? totalMW.toFixed(2) : "0.00"} MW
                        </span>
                    </div>
                </div>

                {/* Primary Function Buttons */}
                <div className="px-4 pb-4 grid grid-cols-2 gap-4 bg-white">
                    <button
                        onClick={handleCalculate}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl font-extrabold text-sm tracking-wide shadow-md active:scale-[0.98] transition-all border border-emerald-600 hover:shadow-lg uppercase"
                    >
                        ⚡ Calculate
                    </button>
                    <button
                        onClick={handleCopyTotal}
                        className="bg-slate-800 hover:bg-slate-900 text-white h-12 rounded-xl font-extrabold text-sm tracking-wide shadow-md active:scale-[0.98] transition-all border border-slate-700 hover:shadow-lg uppercase"
                    >
                        📋 Copy Total
                    </button>
                </div>

                {/* Professional Corporate Footer */}
                <div className="bg-slate-100 text-slate-500 text-center py-3 text-[11px] font-bold tracking-wider flex-shrink-0 border-t border-slate-200 uppercase">
                    © All Rights Reserved || (SBA-Bottail), WZPDCL
                </div>
            </div>
        </div>
    );
}