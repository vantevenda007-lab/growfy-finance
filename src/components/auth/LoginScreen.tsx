import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';

interface LoginScreenProps {
  onAuthenticated: (email: string) => void;
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [email, setEmail] = useState('demo@growfy.io');
  const [password, setPassword] = useState('growfy2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError(null);

    if (!email.includes('@') || password.length < 4) {
      setError('Credenciais inválidas. Verifique e tente novamente.');
      return;
    }

    setLoading(true);
    window.setTimeout(() => {
      onAuthenticated(email);
    }, 800);
  }

  return (
    <div className="fixed inset-0 z-[200] overflow-auto bg-[#08080b] text-foreground flex items-center justify-center p-6">
      {/* Solid black-out to override body gradient */}
      <div aria-hidden="true" className="absolute inset-0 z-0 bg-[#08080b]" />

      {/* Cinematic spotlight from above */}
      <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgba(255,255,255,0.08),transparent_70%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[260px] h-[480px] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,transparent_100%)] blur-3xl" />
      </div>

      {/* Subtle grain */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22240%22 height=%22240%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>")',
        }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div
          className="relative rounded-[20px] border border-white/[0.08] px-9 py-11 sm:px-11 sm:py-14 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.85)]"
          style={{
            backgroundColor: 'rgba(18, 18, 22, 0.72)',
            backgroundImage:
              'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.005) 100%)',
            backdropFilter: 'blur(24px) saturate(140%)',
            WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          }}
        >
          {/* Wordmark */}
          <div className="flex justify-center mb-9">
            <div className="flex items-baseline">
              <span className="font-brand text-[36px] leading-none tracking-[-0.02em] text-white">
                growfy
              </span>
              <span className="font-brand text-[36px] leading-none text-white">.</span>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center mb-9">
            <h1 className="font-brand text-[32px] leading-[1.1] tracking-[-0.02em] text-white">
              Bem-vindo<span className="italic font-normal text-white/85"> de volta</span>
            </h1>
            <p className="text-[13.5px] leading-relaxed text-white/45 mt-3 max-w-[280px] mx-auto">
              Entre com seus dados para continuar a operação.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="Email"
              autoComplete="email"
            />

            <div className="space-y-2">
              <Field
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Senha"
                autoComplete="current-password"
              />
              <div className="flex justify-end pr-1">
                <button
                  type="button"
                  className="text-[11.5px] tracking-[0.01em] text-white/45 hover:text-white transition-colors underline-offset-[3px] hover:underline decoration-white/40"
                >
                  Esqueci a senha
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 w-full h-12 rounded-xl bg-white text-[#0a0a0c] font-medium text-[13.5px] tracking-[0.005em] hover:bg-white/95 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_8px_24px_-8px_rgba(255,255,255,0.25)]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    className="h-3.5 w-3.5 rounded-full border-2 border-[#0a0a0c] border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  Acessando…
                </span>
              ) : (
                'Entrar no painel'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-7 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-white/30">
            <span className="h-px flex-1 bg-white/10" />
            <span className="font-medium">ou</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          {/* Google */}
          <button
            type="button"
            className="flex items-center justify-center gap-2.5 w-full h-12 rounded-xl border border-white/10 bg-white/[0.02] text-[13.5px] tracking-[0.005em] text-white/85 hover:border-white/25 hover:bg-white/[0.05] hover:text-white transition-colors"
          >
            <GoogleIcon />
            Continuar com Google
          </button>

          {/* Footer */}
          <p className="text-center text-[12.5px] text-white/40 mt-8">
            Não tem conta?{' '}
            <button
              type="button"
              className="text-white/85 hover:text-white underline-offset-[3px] hover:underline decoration-white/40 transition-colors"
            >
              Criar acesso
            </button>
          </p>
        </div>

        {/* Demo creds */}
        <p className="text-center text-[11px] tracking-[0.02em] text-white/30 mt-6">
          Demo ·{' '}
          <span className="font-mono text-white/55">demo@growfy.io</span>
          {' / '}
          <span className="font-mono text-white/55">growfy2026</span>
        </p>
      </motion.div>
    </div>
  );
}

interface FieldProps {
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete?: string;
}

function Field({ type, value, onChange, placeholder, autoComplete }: FieldProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required
      className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/[0.025] text-[14px] tracking-[0.005em] text-white placeholder:text-white/35 transition-all focus:outline-none focus:border-white/30 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(255,255,255,0.03)]"
    />
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.96h5.52c-.24 1.44-1.68 4.2-5.52 4.2-3.36 0-6.12-2.76-6.12-6.36S8.64 5.64 12 5.64c1.92 0 3.24.84 3.96 1.56l2.76-2.64C16.92 2.94 14.64 2 12 2 6.48 2 2.04 6.48 2.04 12S6.48 22 12 22c5.76 0 9.6-4.08 9.6-9.84 0-.66-.06-1.2-.18-1.96H12z"
      />
      <path
        fill="#4285F4"
        d="M12 10.2v3.96h5.52c-.24 1.44-1.68 4.2-5.52 4.2v3.6c5.76 0 9.6-4.08 9.6-9.84 0-.66-.06-1.2-.18-1.96H12z"
      />
      <path
        fill="#FBBC05"
        d="M5.88 14.16l-3 2.28C4.32 19.92 7.92 22 12 22v-3.6c-3 0-5.4-2.04-6.12-4.24z"
      />
      <path
        fill="#34A853"
        d="M12 5.64c1.92 0 3.24.84 3.96 1.56l2.76-2.64C16.92 2.94 14.64 2 12 2 7.92 2 4.32 4.08 2.88 7.56l3 2.28C6.6 7.62 9 5.64 12 5.64z"
      />
    </svg>
  );
}
