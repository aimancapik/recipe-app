import React, { useState } from 'react';
import LoadingAnimation from '@/components/LoadingAnimation';


interface AuthScreenProps {
    mode: 'login' | 'signup';
    onToggleMode: () => void;
    onSignIn: (email: string, password: string) => Promise<void>;
    onSignUp: (email: string, password: string) => Promise<void>;
    onGoogleSignIn: () => Promise<void>;
    onFacebookSignIn: () => Promise<void>;
    onForgotPassword: (email: string) => Promise<void>;
    onSkip: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({
    mode,
    onToggleMode,
    onSignIn,
    onSignUp,
    onGoogleSignIn,
    onForgotPassword,
    onSkip,
}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [forgotMode, setForgotMode] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (forgotMode) {
            if (!email) { setError('Please enter your email'); return; }
            setLoading(true);
            try {
                await onForgotPassword(email);
                setSuccessMessage('Password reset email sent! Check your inbox.');
                setForgotMode(false);
            } catch (err: any) {
                setError(err.message || 'Failed to send reset email');
            } finally {
                setLoading(false);
            }
            return;
        }

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        if (mode === 'signup' && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (mode === 'signup' && password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            if (mode === 'login') {
                await onSignIn(email, password);
            } else {
                await onSignUp(email, password);
                setSuccessMessage('Account created! Check your email to verify.');
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            await onGoogleSignIn();
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Background image */}
            <div className="absolute inset-0">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=1200&q=80')`,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />
            </div>

            {/* Main content */}
            <div className="relative z-10 w-full max-w-[440px]">
                {/* Glass card */}
                <div
                    className="rounded-xl p-8 md:p-10 shadow-2xl"
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-6"
                            style={{ boxShadow: '0 0 15px rgba(244, 226, 37, 0.4)' }}>
                            <span className="material-symbols-outlined text-3xl font-bold" style={{ color: '#222110' }}>
                                restaurant_menu
                            </span>
                        </div>
                        <h1 className="text-white text-3xl md:text-4xl font-bold tracking-tight mb-2">
                            {forgotMode
                                ? 'Reset Password'
                                : mode === 'login'
                                    ? 'Welcome Back'
                                    : 'Join the Kitchen'
                            }
                        </h1>
                        <p className="text-white/70 text-base font-light">
                            {forgotMode
                                ? 'Enter your email and we\'ll send a reset link'
                                : mode === 'login'
                                    ? 'Your culinary journey continues here'
                                    : 'Start your cooking adventure today'
                            }
                        </p>
                    </div>

                    {/* Error / Success */}
                    {error && (
                        <div className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2"
                            style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            <span className="material-symbols-outlined text-red-400 text-lg">error</span>
                            <span className="text-red-300">{error}</span>
                        </div>
                    )}
                    {successMessage && (
                        <div className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2"
                            style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                            <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>
                            <span className="text-green-300">{successMessage}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-white/90 text-sm font-medium mb-2 ml-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="chef@example.com"
                                className="w-full rounded-lg py-3.5 px-4 text-white text-base outline-none transition-all"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                }}
                                onFocus={(e) => {
                                    e.target.style.boxShadow = '0 0 0 2px rgba(244, 226, 37, 0.5)';
                                    e.target.style.borderColor = '#f4e225';
                                }}
                                onBlur={(e) => {
                                    e.target.style.boxShadow = 'none';
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                }}
                            />
                        </div>

                        {/* Password */}
                        {!forgotMode && (
                            <div>
                                <div className="flex justify-between items-center mb-2 ml-1">
                                    <label className="block text-white/90 text-sm font-medium">Password</label>
                                    {mode === 'login' && (
                                        <button
                                            type="button"
                                            onClick={() => { setForgotMode(true); setError(''); }}
                                            className="text-primary text-xs font-medium hover:underline"
                                        >
                                            Forgot Password?
                                        </button>
                                    )}
                                </div>
                                <div className="relative flex items-center">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full rounded-lg py-3.5 px-4 pr-12 text-white text-base outline-none transition-all"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.boxShadow = '0 0 0 2px rgba(244, 226, 37, 0.5)';
                                            e.target.style.borderColor = '#f4e225';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.boxShadow = 'none';
                                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 text-white/50 hover:text-white"
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Confirm password (signup) */}
                        {mode === 'signup' && !forgotMode && (
                            <div>
                                <label className="block text-white/90 text-sm font-medium mb-2 ml-1">
                                    Confirm Password
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full rounded-lg py-3.5 px-4 pr-12 text-white text-base outline-none transition-all"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.boxShadow = '0 0 0 2px rgba(244, 226, 37, 0.5)';
                                            e.target.style.borderColor = '#f4e225';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.boxShadow = 'none';
                                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 text-white/50 hover:text-white"
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/90 font-bold py-4 rounded-lg transition-all active:scale-[0.98] text-base uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{
                                    color: '#222110',
                                    boxShadow: '0 0 15px rgba(244, 226, 37, 0.4)',
                                }}
                            >
                                {loading ? (
                                    <LoadingAnimation size={24} />
                                ) : forgotMode ? (
                                    'Send Reset Link'
                                ) : mode === 'login' ? (
                                    'Sign In'
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </div>

                        {forgotMode && (
                            <button
                                type="button"
                                onClick={() => { setForgotMode(false); setError(''); }}
                                className="w-full text-sm text-white/50 hover:text-white font-medium transition-colors"
                            >
                                ← Back to sign in
                            </button>
                        )}
                    </form>

                    {/* Social login */}
                    {!forgotMode && (
                        <>
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="px-2 text-white/40 tracking-widest" style={{ background: 'transparent' }}>
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    className="flex items-center justify-center gap-2 rounded-lg py-3 text-white transition-all"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" />
                                    </svg>
                                    <span className="text-sm font-medium">Google</span>
                                </button>
                                <button
                                    type="button"
                                    className="flex items-center justify-center gap-2 rounded-lg py-3 text-white transition-all"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path d="M17.05 20.28c-.96.95-2.04 1.83-3.12 1.83-1.05 0-1.33-.62-2.58-.62-1.25 0-1.58.62-2.58.62-1.03 0-2.18-.93-3.12-1.83-1.91-1.92-3.41-5.46-3.41-8.54 0-3.08 1.91-4.73 3.73-4.73 1 0 1.78.6 2.4.6.61 0 1.48-.6 2.4-.6 1.42 0 2.6.76 3.23 1.63-2.62 1.46-2.2 5.25.45 6.43-.59 1.46-1.45 3.12-2.4 4.61zM12.03 7.25c-.02-2.23 1.84-4.11 4.08-4.25.02 2.23-1.84 4.11-4.08 4.25z" fill="currentColor" />
                                    </svg>
                                    <span className="text-sm font-medium">Apple</span>
                                </button>
                            </div>
                        </>
                    )}

                    {/* Footer toggle */}
                    <div className="mt-8 text-center">
                        <p className="text-white/50 text-sm font-light">
                            {mode === 'login' ? 'New to the kitchen?' : 'Already have an account?'}
                            <button
                                onClick={() => { onToggleMode(); setError(''); setSuccessMessage(''); setForgotMode(false); }}
                                className="text-primary font-semibold ml-1 hover:underline"
                            >
                                {mode === 'login' ? 'Create Account' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Skip + bottom text */}
                <div className="mt-6 text-center space-y-4">
                    <button
                        onClick={onSkip}
                        className="text-white/40 text-sm hover:text-white/70 transition-colors font-medium flex items-center gap-1 mx-auto"
                    >
                        <span>Continue as guest</span>
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                    <p className="text-white/20 text-xs font-light tracking-widest uppercase">
                        Privacy Policy • Terms of Service
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;
