import React, { useState } from 'react';
import LoadingAnimation from '@/components/common/LoadingAnimation';

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
    const [infoMessage, setInfoMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (forgotMode) {
            if (!email) { setError('Please enter your email'); return; }
            setLoading(true);
            try {
                await onForgotPassword(email);
                setSuccessMessage('Reset link sent! Check your inbox.');
                setForgotMode(false);
            } catch (err: any) {
                setError(err.message || 'Failed to send reset email');
            } finally {
                setLoading(false);
            }
            return;
        }

        if (!email || !password) { setError('Please fill in all fields'); return; }
        if (mode === 'signup' && password !== confirmPassword) { setError('Passwords do not match'); return; }
        if (mode === 'signup' && password.length < 6) { setError('Password must be at least 6 characters'); return; }

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

    const handleGoogleLogin = () => {
        setInfoMessage('Google sign-in coming soon! Use email for now.');
        setTimeout(() => setInfoMessage(''), 3000);
    };

    const inputStyle = {
        background: 'rgba(255,255,255,0.08)',
        border: '1.5px solid rgba(255,255,255,0.13)',
        color: 'white',
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ height: '100dvh' }}>
            {/* Full screen bg */}
            <div className="absolute inset-0">
                <div
                    className="absolute inset-0 bg-cover bg-center scale-105"
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1200&q=80')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/95" />
            </div>

            {/* Top branding */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center pt-16 pb-8 px-6 text-center">
                <img
                    src="/logo.png"
                    alt="Let Em Cook"
                    className="w-96 max-w-md object-contain"
                    style={{ filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.6)) drop-shadow(0 4px 16px rgba(0,0,0,0.4))' }}
                />
            </div>

            {/* Bottom sheet */}
            <div
                className="relative z-10 w-full rounded-t-[32px] px-6 pt-7 pb-10 overflow-y-auto"
                style={{
                    background: 'rgba(18, 18, 20, 0.96)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    maxHeight: '85dvh',
                }}
            >
                {/* Pull handle */}
                <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-6" />

                {/* Title */}
                <div className="mb-6">
                    <h2 className="text-white text-[22px] font-bold">
                        {forgotMode ? 'Reset Password' : mode === 'login' ? 'Welcome back' : 'Create account'}
                    </h2>
                    <p className="text-white/40 text-sm mt-1">
                        {forgotMode
                            ? "We'll send a reset link to your email"
                            : mode === 'login'
                            ? 'Sign in to continue your journey'
                            : 'Join thousands of home cooks'}
                    </p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-4 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-sm"
                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                        <span className="material-symbols-outlined text-red-400 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                        <span className="text-red-300 font-medium">{error}</span>
                    </div>
                )}
                {successMessage && (
                    <div className="mb-4 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-sm"
                        style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                        <span className="material-symbols-outlined text-green-400 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span className="text-green-300 font-medium">{successMessage}</span>
                    </div>
                )}
                {infoMessage && (
                    <div className="mb-4 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-sm"
                        style={{ background: 'rgba(99,179,237,0.12)', border: '1px solid rgba(99,179,237,0.25)' }}>
                        <span className="material-symbols-outlined text-blue-300 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                        <span className="text-blue-200 font-medium">{infoMessage}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Email */}
                    <div
                        className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                        style={inputStyle}
                    >
                        <span className="material-symbols-outlined text-white/30 text-[20px]">mail</span>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Email address"
                            className="flex-1 bg-transparent outline-none text-white text-[15px] placeholder:text-white/25 no-focus-ring"
                            autoComplete="email"
                        />
                    </div>

                    {/* Password */}
                    {!forgotMode && (
                        <div
                            className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                            style={inputStyle}
                        >
                            <span className="material-symbols-outlined text-white/30 text-[20px]">lock</span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Password"
                                className="flex-1 bg-transparent outline-none text-white text-[15px] placeholder:text-white/25 no-focus-ring"
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="flex items-center justify-center text-white/25 hover:text-white/60 transition-colors">
                                <span className="material-symbols-outlined text-[20px] leading-none">{showPassword ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                    )}

                    {/* Confirm password */}
                    {mode === 'signup' && !forgotMode && (
                        <div
                            className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                            style={inputStyle}
                        >
                            <span className="material-symbols-outlined text-white/30 text-[20px]">lock_reset</span>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Confirm password"
                                className="flex-1 bg-transparent outline-none text-white text-[15px] placeholder:text-white/25 no-focus-ring"
                                autoComplete="new-password"
                            />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="flex items-center justify-center text-white/25 hover:text-white/60 transition-colors">
                                <span className="material-symbols-outlined text-[20px] leading-none">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                    )}

                    {/* Forgot password link */}
                    {mode === 'login' && !forgotMode && (
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => { setForgotMode(true); setError(''); }}
                                className="text-xs text-white/40 hover:text-white/70 transition-colors font-medium py-1"
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}

                    {/* Submit */}
                    <div className="pt-1">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            style={{
                                background: '#f4e225',
                                color: '#1a1a0a',
                                boxShadow: '0 4px 24px rgba(244,226,37,0.3)',
                            }}
                        >
                            {loading ? (
                                <LoadingAnimation size={22} />
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
                            className="w-full text-sm text-white/35 hover:text-white/60 font-medium transition-colors py-1"
                        >
                            ← Back to sign in
                        </button>
                    )}
                </form>

                {/* Divider + Social */}
                {!forgotMode && (
                    <>
                        <div className="flex items-center gap-3 my-5">
                            <div className="flex-1 h-px bg-white/8" />
                            <span className="text-white/25 text-xs font-medium tracking-widest uppercase">or</span>
                            <div className="flex-1 h-px bg-white/8" />
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1.5px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span className="text-white/70 text-[14px] font-semibold">Continue with Google</span>
                        </button>
                    </>
                )}

                {/* Toggle mode + skip */}
                <div className="mt-6 flex flex-col items-center gap-3">
                    <p className="text-white/35 text-sm">
                        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                        {' '}
                        <button
                            onClick={() => { onToggleMode(); setError(''); setSuccessMessage(''); setForgotMode(false); }}
                            className="font-bold text-primary hover:underline"
                        >
                            {mode === 'login' ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                    <button
                        onClick={onSkip}
                        className="text-white/20 text-xs hover:text-white/40 transition-colors font-medium"
                    >
                        Continue as guest
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;
