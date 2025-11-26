import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight, CheckCircle, Shield, Clock, HardDrive, Cpu, Usb, Database,
    Sparkles, Globe, Music, Heart, Search, FileText, ShieldCheck, Wand2, HelpCircle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
    const [activeHero, setActiveHero] = useState(0); // 0 = Data Recovery, 1 = Lyric Studio

    // Auto-rotate hero sections
    useEffect(() => {
        const durations = [10000, 5000];
        const timeout = setTimeout(() => {
            setActiveHero((prev) => (prev + 1) % 2);
        }, durations[activeHero]);
        return () => clearTimeout(timeout);
    }, [activeHero]);

    return (
        <main className="min-h-screen bg-white relative overflow-hidden font-sans text-gray-900">
            {/* Hero Section */}
            <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-12 max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight leading-none">
                            <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                                Data Recovery & AI Solutions
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
                            Industry-leading data recovery services and revolutionary AI-powered lyric creation — all under one roof.
                        </p>
                        
                        {/* Trust Indicators */}
                        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-12">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                <Shield className="w-5 h-5 text-green-500" /> ISO Certified
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                <CheckCircle className="w-5 h-5 text-blue-500" /> 98% Success Rate
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                <Clock className="w-5 h-5 text-red-500" /> 24/7 Support
                            </div>
                        </div>
                    </div>

                    {/* Rotating Hero Cards */}
                    <div className="max-w-6xl mx-auto relative h-[600px] md:h-[500px]">
                         {/* Data Recovery Hero */}
                        <div className={`absolute inset-0 transition-all duration-700 ${activeHero === 0 ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 -translate-x-10 z-0 pointer-events-none'}`}>
                            <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-full">
                                <div className="p-8 md:p-12 flex-1 flex flex-col justify-center bg-gradient-to-br from-white to-red-50">
                                    <div className="inline-flex items-center gap-2 text-red-600 font-bold text-sm uppercase tracking-wide mb-4">
                                        <HardDrive className="w-4 h-4" /> Professional Services
                                    </div>
                                    <h2 className="text-4xl font-black mb-4">Data Recovery Experts</h2>
                                    <p className="text-gray-600 text-lg mb-8">
                                        Military-grade security meets advanced recovery algorithms. We restore data from HDD, SSD, RAID, and all storage devices.
                                    </p>
                                    <div className="flex gap-4">
                                        <a href="#contact" className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">
                                            Get Free Quote
                                        </a>
                                        <a href="#services" className="px-6 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                                            Learn More
                                        </a>
                                    </div>
                                </div>
                                <div className="flex-1 bg-gradient-to-br from-red-500 to-orange-600 p-8 flex items-center justify-center text-white">
                                    <div className="grid grid-cols-2 gap-6 max-w-sm">
                                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center">
                                            <HardDrive className="w-8 h-8 mx-auto mb-2" />
                                            <div className="font-bold">HDD/SSD</div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center">
                                            <Database className="w-8 h-8 mx-auto mb-2" />
                                            <div className="font-bold">RAID</div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center">
                                            <ShieldCheck className="w-8 h-8 mx-auto mb-2" />
                                            <div className="font-bold">Secure</div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center">
                                            <Clock className="w-8 h-8 mx-auto mb-2" />
                                            <div className="font-bold">Fast</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lyric Studio Hero */}
                        <div className={`absolute inset-0 transition-all duration-700 ${activeHero === 1 ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-10 z-0 pointer-events-none'}`}>
                            <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-full">
                                <div className="p-8 md:p-12 flex-1 flex flex-col justify-center bg-gradient-to-br from-white to-purple-50">
                                    <div className="inline-flex items-center gap-2 text-purple-600 font-bold text-sm uppercase tracking-wide mb-4">
                                        <Sparkles className="w-4 h-4" /> AI Innovation
                                    </div>
                                    <h2 className="text-4xl font-black mb-4">SWAZ Lyrics Studio</h2>
                                    <p className="text-gray-600 text-lg mb-8">
                                        Transform emotions into cinematic poetry. AI-powered lyric creation for Indian Cinema, Global Pop, and Fusion genres.
                                    </p>
                                    <div className="flex gap-4">
                                        <Link to="/studio" className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30 flex items-center gap-2">
                                            <Music className="w-4 h-4" /> Launch Studio
                                        </Link>
                                    </div>
                                </div>
                                <div className="flex-1 bg-gradient-to-br from-purple-600 to-pink-600 p-8 flex items-center justify-center text-white">
                                    <div className="grid grid-cols-2 gap-6 max-w-sm">
                                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center">
                                            <Globe className="w-8 h-8 mx-auto mb-2" />
                                            <div className="font-bold">Multi-Lingual</div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center">
                                            <Heart className="w-8 h-8 mx-auto mb-2" />
                                            <div className="font-bold">Emotion AI</div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center">
                                            <FileText className="w-8 h-8 mx-auto mb-2" />
                                            <div className="font-bold">Native Script</div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center">
                                            <Wand2 className="w-8 h-8 mx-auto mb-2" />
                                            <div className="font-bold">Magic Rhymes</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Carousel Indicators */}
                    <div className="flex justify-center gap-3 mt-6">
                         <button onClick={() => setActiveHero(0)} className={`h-2 rounded-full transition-all ${activeHero === 0 ? 'w-8 bg-red-600' : 'w-2 bg-gray-300'}`} />
                         <button onClick={() => setActiveHero(1)} className={`h-2 rounded-full transition-all ${activeHero === 1 ? 'w-8 bg-purple-600' : 'w-2 bg-gray-300'}`} />
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black mb-4">Expert Data Recovery</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">We recover data from all types of storage devices with industry-leading success rates.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: <HardDrive className="w-8 h-8 text-red-500" />, title: "Hard Drive Recovery", desc: "Physical damage, clicking drives, and logical failures." },
                            { icon: <Cpu className="w-8 h-8 text-blue-500" />, title: "SSD Recovery", desc: "Advanced algorithms for NVMe and SATA SSDs." },
                            { icon: <Database className="w-8 h-8 text-green-500" />, title: "RAID Recovery", desc: "Enterprise RAID 0, 1, 5, 6, 10 configurations." },
                            { icon: <Usb className="w-8 h-8 text-purple-500" />, title: "Flash Media", desc: "USB drives, SD cards, and memory sticks." }
                        ].map((s, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100">
                                <div className="mb-4 p-3 bg-gray-50 rounded-xl w-fit">{s.icon}</div>
                                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                                <p className="text-gray-600 text-sm">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI Lyric Studio Teaser */}
            <section id="lyric-studio" className="py-20 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-slate-900 z-0"></div>
                <div className="container mx-auto px-4 relative z-10 text-white">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1">
                            <div className="inline-block px-4 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-bold mb-6">
                                New Feature
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black mb-6">SWAZ Lyrics Studio</h2>
                            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                                A specialized AI agent architecture for musicians and lyricists. Context-aware composition that respects cultural nuances, rhyme schemes, and musical meter.
                            </p>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3"><CheckCircle className="text-purple-400" /> <span>Native Script Generation (Telugu, Hindi, etc.)</span></li>
                                <li className="flex items-center gap-3"><CheckCircle className="text-purple-400" /> <span>Context-Aware "Samskara" Engine</span></li>
                                <li className="flex items-center gap-3"><CheckCircle className="text-purple-400" /> <span>Export to Suno.com format</span></li>
                            </ul>
                            <Link to="/studio" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-900 rounded-xl font-bold hover:bg-purple-50 transition-colors">
                                Open Studio <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="flex-1 relative">
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-2xl">
                                <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
                                    <Music className="w-6 h-6 text-purple-400" />
                                    <span className="font-bold">Generated Output</span>
                                </div>
                                <div className="space-y-2 font-mono text-sm text-purple-200">
                                    <p>[Chorus]</p>
                                    <p className="text-white">గుండెలోన వాన జల్లు (Rain in the heart)</p>
                                    <p className="text-white">ప్రేమ అనే కొత్త పిలుపు (Call of new love)</p>
                                    <p className="opacity-50">...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section id="stats" className="py-20 bg-white border-t border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-black text-gray-900 mb-2">98%</div>
                            <div className="text-gray-500 font-medium">Success Rate</div>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-gray-900 mb-2">15k+</div>
                            <div className="text-gray-500 font-medium">Recovered Drives</div>
                        </div>
                         <div>
                            <div className="text-4xl font-black text-gray-900 mb-2">10k+</div>
                            <div className="text-gray-500 font-medium">Songs Composed</div>
                        </div>
                         <div>
                            <div className="text-4xl font-black text-gray-900 mb-2">24/7</div>
                            <div className="text-gray-500 font-medium">Support</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact/CTA */}
            <section id="contact" className="py-20 bg-gray-900 text-white text-center">
                 <div className="container mx-auto px-4 max-w-3xl">
                     <h2 className="text-3xl md:text-4xl font-black mb-6">Ready to get started?</h2>
                     <p className="text-gray-400 mb-10 text-lg">
                         Whether you need to recover lost data or write your next hit song, SWAZ Solutions has the expert tools you need.
                     </p>
                     <div className="flex flex-col sm:flex-row gap-4 justify-center">
                         <button onClick={() => alert("Contact support at support@swaz.com")} className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition-colors">
                             Contact Data Recovery
                         </button>
                         <Link to="/studio" className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-bold transition-colors">
                             Go to Lyrics Studio
                         </Link>
                     </div>
                 </div>
            </section>

            {/* Footer */}
            <footer className="py-8 bg-black text-gray-500 text-sm text-center border-t border-gray-800">
                <p>© 2025 SWAZ Solutions. All rights reserved.</p>
            </footer>
        </main>
    );
};