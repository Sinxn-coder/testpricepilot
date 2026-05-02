import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "@firebase/auth";
import { auth, googleProvider } from "./firebase";
import { storeAuthSession } from "./authToken";
import { appPath } from "./paths.js";
import "./auth.css";

const icon = (name, style = {}) => <i data-lucide={name} style={style} />;

async function storeCurrentUserToken() {
  if (!auth.currentUser) {
    throw new Error("Firebase did not return an authenticated user.");
  }

  const token = await auth.currentUser.getIdToken();
  storeAuthSession(auth.currentUser, token);
  return token;
}

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.lucide?.createIcons();

    return onAuthStateChanged(auth, async user => {
      if (!user) return;
      const token = await user.getIdToken();
      storeAuthSession(user, token);
    });
  }, []);

  useEffect(() => {
    window.lucide?.createIcons();
  }, [mode, loading]);

  const finishAuth = async destination => {
    await storeCurrentUserToken();
    setStatus("Signed in. Redirecting...");
    window.setTimeout(() => {
      window.location.href = appPath(destination);
    }, 450);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setError("");
    setStatus("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(result.user, { displayName: name.trim() });
        }
        await finishAuth("plans.html?new_user=true");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        await finishAuth("preview.html");
      }
    } catch (authError) {
      setError(authError.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setStatus("");
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      await finishAuth("preview.html");
    } catch (authError) {
      setError(authError.message || "Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <div>
          <a href={appPath()} className="logo-wrap auth-logo">
            {icon("compass", { color: "var(--accent)", width: 32, height: 32 })} PricePilot
          </a>
          <div className="metric-badge">
            {icon("trending-up", { color: "var(--green)", width: 20 })}
            <span className="metric-value">+18% Revenue Uplift</span>
          </div>
          <h1 className="auth-hero-title">Smarter pricing.<br />Automatic revenue.</h1>
          <p className="auth-hero-copy">The toolkit for businesses to scale global revenue with automated pricing intelligence.</p>
          <ul className="feature-list">
            <li className="feature-item">{icon("brain")} Psychology-Driven Price Optimization</li>
            <li className="feature-item">{icon("shield-check")} Margin-Safe Smart Adjustments</li>
            <li className="feature-item">{icon("zap")} Built for High Conversion Checkout</li>
          </ul>
        </div>
        <div className="aside-footer">
          <span>{icon("shield-check", { width: 14, color: "var(--green)" })} Enterprise-Ready</span>
          <span>(c) 2026 PricePilot</span>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-container">
          <div className="auth-header">
            <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>
            <p>{isSignup ? "Start optimizing your revenue today." : "Log in to manage your pricing."}</p>
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab ${!isSignup ? "active" : ""}`} type="button" onClick={() => setMode("login")}>Log In</button>
            <button className={`auth-tab ${isSignup ? "active" : ""}`} type="button" onClick={() => setMode("signup")}>Sign Up</button>
          </div>

          <form onSubmit={handleSubmit}>
            {isSignup && (
              <div className="form-group">
                <label htmlFor="input-name">Full Name</label>
                <input id="input-name" className="form-input" value={name} onChange={event => setName(event.target.value)} placeholder="e.g. John Doe" />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="input-email">Email Address</label>
              <input id="input-email" type="email" className="form-input" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@company.com" required />
            </div>
            <div className="form-group">
              <label htmlFor="input-password">Password</label>
              <input id="input-password" type="password" className="form-input" value={password} onChange={event => setPassword(event.target.value)} placeholder="Min. 8 characters" required />
            </div>

            {error && <div className="auth-message error">{error}</div>}
            {status && <div className="auth-message success">{status}</div>}

            <button type="submit" className={`btn ${isSignup ? "btn-glow" : "btn-primary"} auth-submit`} disabled={loading}>
              <span>{loading ? "Please wait..." : isSignup ? "Create Account" : "Log In"}</span>
              {icon("arrow-right", { width: 20, marginLeft: 8 })}
            </button>
          </form>

          <div className="auth-divider">
            <div />
            <span>Or with social</span>
            <div />
          </div>

          <button className="btn btn-outline google-button" type="button" onClick={handleGoogleLogin} disabled={loading}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          <div className="auth-footer">
            <p>
              {isSignup ? "Already have an account? " : "Don't have an account? "}
              <button type="button" onClick={() => setMode(isSignup ? "login" : "signup")}>{isSignup ? "Log In" : "Sign Up"}</button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
