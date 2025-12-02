import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Sparkles, Music, Database, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './auth/AuthModal';

export const Header: React.FC = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const location = useLocation();

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close auth modal when user becomes authenticated
    React.useEffect(() => {
        if (isAuthenticated && isAuthModalOpen) {
            setIsAuthModalOpen(false);
        }
    }, [isAuthenticated, isAuthModalOpen]);

    const isActive = (path: string) => location.pathname === path;

    const scrollToSection = (sectionId: string) => {
        if (location.pathname !== '/') {
            window.location.href = `/#${sectionId}`;
        } else {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    return (
        <header className={`sticky top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
            ? 'backdrop-blur-2xl bg-white/80 border-b border-gray-200/60 shadow-lg shadow-gray-200/50'
            : 'bg-white/95 backdrop-blur-sm border-b border-gray-100'
            }`}>
            {/* Decorative gradient line */}
            <div className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent transition-opacity duration-500 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}></div>

            <div className="container mx-auto">
                <div className="flex items-center justify-between h-20 px-4 lg:px-6">
                    {/* Logo Section */}
                    <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 group flex-shrink-0 relative">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg relative z-10">S</div>
                        </div>
                        <div className="block">
                            <h1 className="text-base sm:text-lg lg:text-xl font-black text-gray-900 group-hover:bg-gradient-to-r group-hover:from-red-600 group-hover:to-orange-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                                Swaz Solutions
                            </h1>
                            <p className="hidden lg:block text-xs text-gray-500 font-medium">Professional Data & AI Solutions</p>
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex items-center gap-1 backdrop-blur-xl bg-gray-50/80 rounded-2xl px-2 py-2 border border-gray-200/60 hidden md:flex">
                        <Link
                            to="/"
                            className={`group relative px-3 md:px-4 py-2 rounded-xl transition-all duration-300 font-semibold text-sm ${isActive('/')
                                ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-md'
                                }`}
                            title="Home"
                        >
                            <Home className="w-4 h-4 md:inline md:mr-1.5" />
                            <span className="hidden md:!inline-block">Home</span>
                        </Link>

                        <button
                            onClick={() => scrollToSection('services')}
                            className="group relative px-3 md:px-4 py-2 rounded-xl transition-all duration-300 font-semibold text-sm text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-md"
                            title="Data Recovery"
                        >
                            <Database className="w-4 h-4 md:inline md:mr-1.5" />
                            <span className="hidden md:!inline-block">Data Recovery</span>
                        </button>

                        <button
                            onClick={() => scrollToSection('lyric-studio')}
                            className="group relative px-3 md:px-4 py-2 rounded-xl transition-all duration-300 font-semibold text-sm text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-md"
                            title="Song Writer"
                        >
                            <Music className="w-4 h-4 md:inline md:mr-1.5" />
                            <span className="hidden md:!inline-block">Song Writer</span>
                        </button>

                        <button
                            onClick={() => scrollToSection('stats')}
                            className="group relative px-3 md:px-4 py-2 rounded-xl transition-all duration-300 font-semibold text-sm text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-md"
                            title="About"
                        >
                            <span className="hidden md:!inline-block">About</span>
                        </button>
                    </nav>

                    {/* CTA Button & Auth */}
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                <div className="hidden md:flex flex-col items-end mr-2">
                                    <span className="text-sm font-semibold text-gray-900">{user?.displayName}</span>
                                    <span className="text-xs text-gray-500">{user?.email}</span>
                                </div>
                                <button
                                    onClick={() => logout()}
                                    className="p-2 text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="hidden md:block px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Sign In
                            </button>
                        )}

                        <Link
                            to={isAuthenticated ? "/studio" : "#"}
                            onClick={(e) => {
                                if (!isAuthenticated) {
                                    e.preventDefault();
                                    setIsAuthModalOpen(true);
                                }
                            }}
                            className="group relative px-5 md:px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 overflow-hidden shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
                            title="Lyric Studio"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                            <Sparkles className="w-4 h-4 relative z-10 text-white" />
                            <span className="hidden md:!inline-block relative z-10 text-white">Lyrics Studio</span>
                            <span className="md:hidden relative z-10 text-white">Start</span>
                        </Link>
                    </div>
                </div>
            </div>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />
        </header>
    );
};