"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#1d2856] text-white overflow-hidden">
            {/* Hero Section */}
            <div className="relative pt-32 pb-20 px-6">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px]"></div>
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10 animate-fade-in-up">
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
                        Revolutionizing <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                            Prize Savings
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-100/80 leading-relaxed max-w-2xl mx-auto">
                        Armina is building the future of lossless lotteries on Base. Save money, earn yield, and win life-changing prizes without risking a penny.
                    </p>
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-white/5 border-y border-white/10 backdrop-blur-sm py-12 px-6">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                        <p className="text-4xl md:text-5xl font-bold text-white mb-2">$45K+</p>
                        <p className="text-blue-200 font-medium">Total Value Locked</p>
                    </div>
                    <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                        <p className="text-4xl md:text-5xl font-bold text-white mb-2">1,892</p>
                        <p className="text-blue-200 font-medium">Happy Savers</p>
                    </div>
                    <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                        <p className="text-4xl md:text-5xl font-bold text-white mb-2">$1,240</p>
                        <p className="text-blue-200 font-medium">Prizes Awarded</p>
                    </div>
                    <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                        <p className="text-4xl md:text-5xl font-bold text-white mb-2">0%</p>
                        <p className="text-blue-200 font-medium">Loss Risk</p>
                    </div>
                </div>
            </div>

            {/* Mission Section */}
            <div className="py-24 px-6 bg-white text-[#1d2856]">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="order-2 md:order-1 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl transform rotate-3 scale-105 opacity-20"></div>
                        <div className="relative bg-slate-100 rounded-3xl p-8 h-[400px] flex items-center justify-center border border-slate-200 overflow-hidden">
                            <div className="text-slate-300 text-9xl">🎯</div>
                        </div>
                    </div>

                    <div className="order-1 md:order-2">
                        <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
                        <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                            We believe that saving money should be fun, rewarding, and accessible to everyone. Traditional lotteries are predatory, taking money from those who can least afford it.
                        </p>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Armina flips the script. By leveraging DeFi protocols on the Base network, we generate yield from pooled deposits and distribute it as prizes. Your principal is never touched, meaning you never lose money.
                        </p>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex gap-3">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">No Loss</h4>
                                    <p className="text-slate-500">Keep your deposit forever.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">High Yield</h4>
                                    <p className="text-slate-500">Powered by Aave & Compound.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Section */}
            <div className="py-24 px-6 relative">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Meet the Team</h2>
                        <p className="text-blue-200 text-lg">The builders behind Armina.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center hover:-translate-y-2 transition-transform duration-300">
                                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mb-6 border-4 border-white/10 overflow-hidden relative">
                                    <div className="absolute inset-0 flex items-center justify-center text-4xl text-white/50 font-bold">
                                        #{i}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold mb-1">Team Member {i}</h3>
                                <p className="text-blue-300 mb-4">Co-Founder & Dev</p>
                                <div className="flex justify-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer transition-colors">
                                        <span className="text-xs">𝕏</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer transition-colors">
                                        <span className="text-xs">in</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-20 px-6 bg-gradient-to-br from-blue-600 to-purple-700 text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to start saving?</h2>
                <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                    Join thousands of others who are saving money and winning prizes on Armina.
                </p>
                <Link href="/pool">
                    <button className="px-10 py-5 bg-white text-blue-600 rounded-full font-bold text-xl hover:bg-blue-50 hover:scale-105 transition-all shadow-xl">
                        Launch App
                    </button>
                </Link>
            </div>
        </div>
    );
}
