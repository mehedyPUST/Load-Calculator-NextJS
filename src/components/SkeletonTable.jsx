"use client";

export default function SkeletonTable({ rows = 9 }) {
    return (
        <div className="border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-pulse">
            <table className="w-full table-fixed border-collapse">
                <thead className="bg-slate-100">
                    <tr className="border-b border-slate-200">
                        <th className="w-[33%] py-1.5 md:py-2 text-center">
                            <div className="h-4 bg-slate-300 rounded mx-4"></div>
                        </th>
                        <th className="w-[34%] py-1.5 md:py-2 text-center border-x border-slate-200">
                            <div className="h-4 bg-slate-300 rounded mx-4"></div>
                        </th>
                        <th className="w-[33%] py-1.5 md:py-2 text-center">
                            <div className="h-4 bg-slate-300 rounded mx-4"></div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {Array.from({ length: rows }).map((_, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                            <td className="p-0 border-r border-slate-200">
                                <div className="h-8 md:h-9 bg-slate-200 rounded mx-2 my-1"></div>
                            </td>
                            <td className="py-1 border-r border-slate-200">
                                <div className="h-5 bg-slate-200 rounded mx-4"></div>
                            </td>
                            <td className="py-1">
                                <div className="h-5 bg-slate-200 rounded mx-4"></div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}