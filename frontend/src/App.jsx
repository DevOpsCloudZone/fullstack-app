import { useEffect, useState } from "react";
import "./App.css";

import AIPage from "./pages/AI";
import ProductsPage, { products } from "./pages/Products";
import EntertainmentPage, { movies } from "./pages/Entertainment";
import LibraryPage from "./pages/Library";

const categories = [
  { name: "Artificial Intelligence", description: "AI, agents and innovation", icon: "✦" },
  { name: "Mobiles & Laptops", description: "Devices, reviews and comparisons", icon: "⌘" },
  { name: "Business & Markets", description: "Business news and market trends", icon: "↗" },
  { name: "Entertainment", description: "Stories, movies and culture", icon: "▶" },
  { name: "Gold & Silver", description: "Precious metals and market updates", icon: "◇" },
  { name: "Technology", description: "Gadgets, software and new ideas", icon: "⌘" },
];

function App() {
  const [apiConnected, setApiConnected] = useState(false);
  const [activeScreen, setActiveScreen] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [savedItems, setSavedItems] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  async function loadLibrary() {
    if (!currentUser) {
      setSavedItems([]);
      return;
    }

    setLibraryLoading(true);

    try {
      const response = await fetch("/api/library", {
        credentials: "same-origin",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setCurrentUser(null);
          setSavedItems([]);
        }
        return;
      }

      const result = await response.json();

      setSavedItems(
        result.items
          .map((saved) => {
            const catalog =
              saved.item_type === "product" ? products : movies;

            return catalog.find((item) => item.id === saved.item_id);
          })
          .filter(Boolean)
      );
    } catch {
      setSavedItems([]);
    } finally {
      setLibraryLoading(false);
    }
  }

  useEffect(() => {
    loadLibrary();
  }, [currentUser]);

  async function toggleSavedItem(item) {
    const itemType = item.type;

    const alreadySaved = savedItems.some(
      (saved) => saved.id === item.id
    );

    try {
      if (alreadySaved) {
        const response = await fetch(
          `/api/library/${encodeURIComponent(itemType)}/${encodeURIComponent(item.id)}`,
          {
            method: "DELETE",
            credentials: "same-origin",
          }
        );

        if (!response.ok) {
          return;
        }

        setSavedItems((items) =>
          items.filter((saved) => saved.id !== item.id)
        );
      } else {
        const response = await fetch("/api/library", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            item_id: item.id,
            item_type: itemType,
          }),
        });

        if (!response.ok) {
          return;
        }

        setSavedItems((items) => [...items, item]);
      }
    } catch {
      // Keep the current UI state if the request fails.
    }
  }

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [registrationNotice, setRegistrationNotice] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkApi() {
      try {
        const response = await fetch("/api/health");
        if (!response.ok) throw new Error("API unavailable");
        if (mounted) setApiConnected(true);
      } catch {
        if (mounted) setApiConnected(false);
      }
    }

    checkApi();
    const interval = window.setInterval(checkApi, 15000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "same-origin",
        });

        if (!response.ok) {
          if (mounted) setCurrentUser(null);
          return;
        }

        const result = await response.json();

        if (mounted) {
          const user = result.user || result;
          setCurrentUser(user);
        }
      } catch {
        if (mounted) setCurrentUser(null);
      } finally {
        if (mounted) setCheckingSession(false);
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  function goTo(screen) {
    const requiresLogin =
      screen === "explore" ||
      screen === "stories" ||
      screen === "ai" ||
      screen === "products" ||
      screen === "entertainment" ||
      screen === "library";

    if (requiresLogin && !currentUser) {
      setActiveScreen("signin");
    } else {
      setActiveScreen(screen);
    }

    setMenuOpen(false);
    setFormError("");
  }

  function getErrorMessage(result, fallback) {
    if (typeof result.detail === "string") {
      return result.detail;
    }

    if (Array.isArray(result.detail)) {
      return result.detail
        .map((item) => item.msg)
        .filter(Boolean)
        .join(", ");
    }

    return fallback;
  }

  async function handleRegister(event) {
    event.preventDefault();
    setFormError("");
    setRegistrationNotice("");

    if (password.length < 8) {
      setFormError("Password must contain at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setFormError(
          getErrorMessage(result, "Registration failed. Please check your details.")
        );
        return;
      }

      setCurrentUser(null);
      setRegistrationNotice(
        "Account created successfully! Please sign in to explore TechCircle."
      );

      setFullName("");
      setEmail("");
      setPassword("");
      setActiveScreen("home");
      setMenuOpen(false);
    } catch {
      setFormError("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setFormError(
          getErrorMessage(
            result,
            "Sign-in failed. Please check your email and password."
          )
        );
        return;
      }

      const user = result.user || result;

      setCurrentUser({
        id: user.id ?? user.user_id,
        full_name: user.full_name,
        email: user.email || email.trim(),
      });

      setEmail("");
      setPassword("");
      setRegistrationNotice("");
      setActiveScreen("home");
      setMenuOpen(false);
    } catch {
      setFormError("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      setCurrentUser(null);
      setActiveScreen("home");
      setMenuOpen(false);
      setFormError("");
      setRegistrationNotice(
        "You have signed out. Please sign in to explore TechCircle."
      );
    }
  }

  const userName = currentUser?.full_name || "";
  const isAIPage = activeScreen.startsWith("ai");

  function openAITopic(topic) {
    if (!currentUser) {
      goTo("signin");
      return;
    }

    setActiveScreen(`ai:${topic.screen}`);
    setFormError("");
  }

  return (
    <main className="tc-app">
      <header className="tc-header">
        <button
          className="tc-brand"
          type="button"
          onClick={() => goTo("home")}
          aria-label="TechCircle home"
        >
          <span className="tc-brand-mark">T</span>
          <span className="tc-brand-name">TechCircle</span>
        </button>

        <button
          className="tc-menu-toggle"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`tc-nav ${menuOpen ? "tc-nav-open" : ""}`}>
          <button className="tc-nav-link" onClick={() => goTo("home")}>
            Home
          </button>
          <button className="tc-nav-link" onClick={() => goTo("explore")}>
            Explore
          </button>
          <button className="tc-nav-link" onClick={() => goTo("stories")}>
            Latest stories
          </button>
          {currentUser && (
            <button className="tc-nav-link" onClick={() => goTo("library")}>
              My Library ({savedItems.length})
            </button>
          )}
        </nav>

        <div className="tc-header-actions">
          <span
            className={`tc-api-status ${
              apiConnected ? "tc-api-online" : "tc-api-offline"
            }`}
          >
            <span className="tc-status-dot" />
            API: {apiConnected ? "Connected" : "Connecting..."}
          </span>

          {currentUser ? (
            <button className="tc-signin-link" onClick={handleLogout}>
              Sign out
            </button>
          ) : (
            <>
              <button
                className="tc-signin-link"
                onClick={() => goTo("signin")}
              >
                Sign in
              </button>
              <button
                className="tc-button tc-button-primary tc-header-cta"
                onClick={() => goTo("register")}
              >
                Get started <span aria-hidden="true">→</span>
              </button>
            </>
          )}
        </div>
      </header>

      {activeScreen === "home" ? (
        <section className="tc-hero" id="home">
          <div className="tc-hero-copy">
            {registrationNotice && !currentUser && (
              <div className="tc-login-note" role="status">
                {registrationNotice}
              </div>
            )}

            {currentUser && (
              <div
                className="tc-login-note"
                role="status"
                style={{ fontSize: "clamp(1.2rem, 2vw, 1.65rem)" }}
              >
                Welcome to TechCircle,{" "}
                <strong>{userName.toUpperCase()}!</strong>
              </div>
            )}

            <p className="tc-eyebrow">YOUR WORLD. YOUR CURIOSITY.</p>

            <h1
              style={{
                fontSize: "clamp(2.5rem, 4.2vw, 3.8rem)",
                lineHeight: 1.12,
              }}
            >
              Everything
              <br />
              happening in the
              <br />
              <span>tech world.</span>
            </h1>

            <p className="tc-hero-description">
              Discover the ideas, innovations, and stories shaping tomorrow.
              Your circle for technology, AI, business, entertainment, and more.
            </p>

            <div className="tc-hero-actions">
              <button
                className="tc-button tc-button-primary"
                onClick={() => goTo(currentUser ? "explore" : "signin")}
              >
                {currentUser ? "Explore categories" : "Explore TechCircle"}
                <span aria-hidden="true"> →</span>
              </button>

              {!currentUser && (
                <button
                  className="tc-button tc-button-secondary"
                  onClick={() => goTo("register")}
                >
                  Create an account
                </button>
              )}
            </div>

            <div className="tc-highlights">
              <span><i /> Explore emerging ideas</span>
              <span><i /> Discover what's next</span>
            </div>

            {!currentUser && !registrationNotice && (
              <p className="tc-login-note">
                <span className="tc-lock-icon" aria-hidden="true">◇</span>
                Sign in to explore stories and discover all categories.
              </p>
            )}
          </div>

          <div className="tc-visual" aria-label="TechCircle category previews">
            <div className="tc-orbit tc-orbit-one" />
            <div className="tc-orbit tc-orbit-two" />
            <div className="tc-orbit tc-orbit-three" />
            <div className="tc-orbit tc-orbit-four" />
            <div className="tc-center-glow" />

            <div className="tc-center-brand">
              <span className="tc-center-logo">T</span>
              <strong>TechCircle</strong>
              <span className="tc-center-subtitle">Explore what matters</span>
            </div>

            <div className="tc-float-card tc-card-ai">
              <span className="tc-card-icon">✦</span>
              <span className="tc-card-copy">
                <strong>Artificial Intelligence</strong>
                <span>AI, agents and innovation</span>
              </span>
            </div>

            <div className="tc-float-card tc-card-technology">
              <span className="tc-card-icon">⌘</span>
              <span className="tc-card-copy">
                <strong>Technology</strong>
                <span>Gadgets and new ideas</span>
              </span>
            </div>

            <div className="tc-float-card tc-card-business">
              <span className="tc-card-icon">↗</span>
              <span className="tc-card-copy">
                <strong>Business</strong>
                <span>Markets and trends</span>
              </span>
            </div>

            <div className="tc-float-card tc-card-entertainment">
              <span className="tc-card-icon">▶</span>
              <span className="tc-card-copy">
                <strong>Entertainment</strong>
                <span>Stories and culture</span>
              </span>
            </div>
          </div>
        </section>
      ) : isAIPage ? (
        currentUser ? (
          <AIPage
            topicKey={
              activeScreen.startsWith("ai:")
                ? activeScreen.slice(3)
                : null
            }
            onBack={() => goTo("explore")}
            onOpenTopic={openAITopic}
            onBackToAI={() => setActiveScreen("ai")}
          />
        ) : (
          <section className="tc-auth-section">
            <div className="tc-auth-card">
              <h2>Sign in to TechCircle</h2>
              <p className="tc-auth-description">
                Please sign in to explore Artificial Intelligence.
              </p>
              <button
                className="tc-button tc-button-primary"
                onClick={() => goTo("signin")}
              >
                Sign in
              </button>
            </div>
          </section>
        )
      ) : activeScreen === "products" ? (
        currentUser ? (
          <ProductsPage
            savedItems={savedItems}
            onToggleSaved={toggleSavedItem}
            onBack={() => goTo("explore")}
          />
        ) : (
          <section className="tc-auth-section"><div className="tc-auth-card">
            <h2>Sign in to TechCircle</h2><p className="tc-auth-description">Sign in to explore devices and product details.</p>
            <button className="tc-button tc-button-primary" onClick={() => goTo("signin")}>Sign in</button>
          </div></section>
        )
      ) : activeScreen === "entertainment" ? (
        currentUser ? (
          <EntertainmentPage
            savedItems={savedItems}
            onToggleSaved={toggleSavedItem}
            onBack={() => goTo("explore")}
          />
        ) : (
          <section className="tc-auth-section"><div className="tc-auth-card">
            <h2>Sign in to TechCircle</h2><p className="tc-auth-description">Sign in to explore movies and entertainment.</p>
            <button className="tc-button tc-button-primary" onClick={() => goTo("signin")}>Sign in</button>
          </div></section>
        )
      ) : activeScreen === "library" ? (
        currentUser ? (
          <LibraryPage savedItems={savedItems} onToggleSaved={toggleSavedItem} onBack={() => goTo("explore")} />
        ) : (
          <section className="tc-auth-section"><div className="tc-auth-card">
            <h2>Sign in to TechCircle</h2><p className="tc-auth-description">Sign in to view your saved library.</p>
            <button className="tc-button tc-button-primary" onClick={() => goTo("signin")}>Sign in</button>
          </div></section>
        )
      ) : activeScreen === "explore" || activeScreen === "stories" ? (
        <section className="tc-explore-section">
          <div className="tc-explore-card">
            <button className="tc-back-link" onClick={() => goTo("home")}>
              <span aria-hidden="true">←</span> Back to home
            </button>

            <p className="tc-eyebrow">YOUR TECHCIRCLE</p>
            <h2>
              {activeScreen === "stories" ? "Latest stories" : "Explore categories"}
            </h2>

            <p className="tc-auth-description">
              Welcome, {userName}. Choose a category to explore.
            </p>

            <div className="tc-category-list">
              {categories.map((category) => (
                <button
                  className="tc-category-card"
                  key={category.name}
                  type="button"
                  onClick={() => {
                    if (category.name === "Artificial Intelligence") {
                      goTo("ai");
                    } else if (category.name === "Mobiles & Laptops") {
                      goTo("products");
                    } else if (category.name === "Entertainment") {
                      goTo("entertainment");
                    }
                  }}
                  style={{
                    cursor:
                      ["Artificial Intelligence", "Mobiles & Laptops", "Entertainment"].includes(category.name)
                        ? "pointer"
                        : "default",
                    font: "inherit",
                    color: "inherit",
                    textAlign: "left",
                  }}
                >
                  <span className="tc-card-icon">{category.icon}</span>
                  <span className="tc-card-copy">
                    <strong>{category.name}</strong>
                    <span>{category.description}</span>
                  </span>
                </button>
              ))}
            </div>

            <p className="tc-auth-description">
              More category pages and content will be added next.
            </p>
          </div>
        </section>
      ) : (
        <section className="tc-auth-section">
          <div className="tc-auth-card">
            <button className="tc-back-link" onClick={() => goTo("home")}>
              <span aria-hidden="true">←</span> Back to home
            </button>

            <div className="tc-auth-mark">T</div>

            <p className="tc-eyebrow">
              {activeScreen === "register" ? "JOIN THE CIRCLE" : "WELCOME BACK"}
            </p>

            <h2>
              {activeScreen === "register"
                ? "Create your account"
                : "Sign in to TechCircle"}
            </h2>

            <p className="tc-auth-description">
              {activeScreen === "register"
                ? "Create an account, then sign in to explore TechCircle."
                : "Sign in with the email address and password you registered with."}
            </p>

            <form
              className="tc-auth-form"
              onSubmit={
                activeScreen === "register" ? handleRegister : handleLogin
              }
            >
              {activeScreen === "register" && (
                <>
                  <label htmlFor="fullName">Full name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    autoComplete="name"
                    minLength={2}
                    maxLength={100}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                  />
                </>
              )}

              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder={
                  activeScreen === "register"
                    ? "At least 8 characters"
                    : "Enter your password"
                }
                autoComplete={
                  activeScreen === "register" ? "new-password" : "current-password"
                }
                minLength={activeScreen === "register" ? 8 : undefined}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              {formError && (
                <div className="tc-form-message tc-form-error" role="alert">
                  {formError}
                </div>
              )}

              <button
                className="tc-button tc-button-primary tc-auth-button"
                type="submit"
                disabled={submitting || checkingSession}
              >
                {submitting
                  ? activeScreen === "register"
                    ? "Creating account..."
                    : "Signing in..."
                  : activeScreen === "register"
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>

            <button
              className="tc-auth-switch"
              onClick={() => {
                setFormError("");
                setEmail("");
                setPassword("");
                setActiveScreen(
                  activeScreen === "register" ? "signin" : "register"
                );
              }}
            >
              {activeScreen === "register"
                ? "Already have an account? Sign in"
                : "New to TechCircle? Create an account"}
            </button>
          </div>
        </section>
      )}

      <footer className="tc-footer">
        <span>© {new Date().getFullYear()} TechCircle</span>
        <span>Ideas connect here.</span>
      </footer>
    </main>
  );
}

export default App;

