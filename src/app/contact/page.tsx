"use client";

import { useLanguage } from "@/components/providers";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
    const { t } = useLanguage();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate form submission
        alert("Message sent! (This is a demo)");
    };

    return (
        <div className="min-h-screen bg-[#1d2856] text-white pt-24 pb-12 px-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-0 left-[-100px] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-16 animate-fade-in-up">
                    <span className="inline-block py-1 px-3 rounded-full bg-blue-500/10 text-blue-300 text-sm font-medium mb-4 border border-blue-500/20">
                        Support & Inquiries
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
                        Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Touch</span>
                    </h1>
                    <p className="text-blue-100/80 text-lg max-w-2xl mx-auto leading-relaxed">
                        Have questions about Armina? Want to partner with us? Or just want to say hi? We'd love to hear from you.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Contact Info & Socials */}
                    <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </span>
                                Email Us
                            </h3>
                            <p className="text-blue-100/70 mb-2">For general inquiries and support:</p>
                            <a href="mailto:hello@armina.finance" className="text-xl font-semibold text-white hover:text-blue-300 transition-colors">
                                hello@armina.finance
                            </a>
                        </div>

                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </span>
                                Visit Us
                            </h3>
                            <p className="text-blue-100/70 mb-2">Our headquarters (Dummy Address):</p>
                            <p className="text-lg font-medium text-white">
                                123 Blockchain Boulevard,<br />
                                Crypto Valley, CV 42069
                            </p>
                        </div>

                        <div className="flex gap-4">
                            {['Twitter', 'Discord', 'Telegram', 'GitHub'].map((social) => (
                                <a
                                    key={social}
                                    href="#"
                                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-center font-semibold transition-all hover:-translate-y-1 block"
                                >
                                    {social}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white rounded-[2rem] p-8 md:p-10 text-slate-800 shadow-2xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                        <h3 className="text-3xl font-bold mb-2">Send a Message</h3>
                        <p className="text-slate-500 mb-8">We usually respond within 24 hours.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                                <select
                                    id="subject"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                >
                                    <option>General Inquiry</option>
                                    <option>Support Request</option>
                                    <option>Partnership</option>
                                    <option>Feedback</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                                <textarea
                                    id="message"
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none"
                                    placeholder="How can we help you?"
                                    required
                                ></textarea>
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-4 text-lg font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                            >
                                Send Message
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
