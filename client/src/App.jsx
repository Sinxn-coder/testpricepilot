import { useEffect, useState } from "react";
import AuthPage from "./AuthPage.jsx";

const icon = (name, style = {}) => <i data-lucide={name} style={style} />;

const pricingPlans = [
  {
    name: "Free Plan",
    price: "Free",
    text: "Perfect for testing the waters.",
    cta: "Get Started Free",
    href: "/auth",
    features: ["10,000 requests / month", "Basic optimization", "Limited dashboard", "Branding included"],
  },
  {
    name: "Starter Plan",
    price: "$49",
    suffix: "/mo",
    text: "Perfect for growing projects.",
    cta: "Go Starter",
    href: "/auth",
    features: ["150,000 requests / month", "Fast API access", "Remove branding", "Basic analytics", "Email support"],
  },
  {
    name: "Growth Plan",
    price: "$149",
    suffix: "/mo",
    text: "The main revenue engine for businesses.",
    cta: "Choose Growth",
    href: "/preview.html",
    popular: true,
    features: ["500,000 requests / month", "Advanced analytics", "Bulk optimization", "Multi-region optimization", "Basic A/B testing"],
  },
  {
    name: "Pro Plan",
    price: "$299",
    suffix: "/mo",
    text: "Scale globally with zero limits.",
    cta: "Get Pro",
    href: "/auth",
    features: ["Unlimited requests*", "Custom pricing rules", "Advanced A/B testing", "Region-based control", "Priority support & SLA"],
  },
];

const currencyCards = [
  ["card-usd", "$", "USD · USA", "$29.99"],
  ["card-eur", "EUR", "EUR · Europe", "EUR 27.99"],
  ["card-gbp", "GBP", "GBP · UK", "GBP 24.99"],
  ["card-jpy", "JPY", "JPY · Japan", "JPY 3,299"],
  ["card-inr", "INR", "INR · India", "INR 2,499"],
  ["card-aud", "$", "AUD · Australia", "$44.99"],
  ["card-cad", "$", "CAD · Canada", "$39.99"],
  ["card-brl", "R$", "BRL · Brazil", "R$149.00"],
];

const mobileLinks = [
  ["About Us", "/about.html"],
  ["Contact Us", "/contact.html"],
  ["Features", "#features"],
  ["My Account", "/auth"],
  ["Get Started for Free", "/auth"],
];

function useLandingEffects() {
  useEffect(() => {
    const refreshIcons = () => window.lucide?.createIcons();
    refreshIcons();

    const onScroll = () => {
      document.getElementById("header")?.classList.toggle("scrolled", window.scrollY > 50);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

    const globeScript = document.createElement("script");
    globeScript.src = "/globe.js";
    globeScript.async = true;
    document.body.appendChild(globeScript);

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      globeScript.remove();
    };
  }, []);
}

function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("no-scroll", open);
    window.lucide?.createIcons();
    return () => document.body.classList.remove("no-scroll");
  }, [open]);

  return (
    <>
      <header id="header">
        <div className="container header-container">
          <a href="/" className="logo-wrap">
            {icon("compass", { color: "var(--accent)" })} PricePilot
          </a>
          <nav className="nav-desktop">
            <a href="#features" className="nav-link">Features</a>
            <a href="/auth" className="nav-link" style={{ fontSize: "0.9rem" }}>My Account</a>
            <a href="/auth" className="btn btn-outline" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>Get Started for Free</a>
          </nav>
          <button className="menu-btn" id="menu-btn" onClick={() => setOpen(value => !value)} aria-label="Toggle menu">
            {icon(open ? "x" : "menu")}
          </button>
        </div>
      </header>
      <div className={`mobile-nav ${open ? "open" : ""}`} id="mobile-nav">
        {mobileLinks.map(([label, href]) => (
          <a
            key={label}
            href={href}
            className="mobile-link"
            onClick={() => setOpen(false)}
          >
            {label}
          </a>
        ))}
        <a href="mailto:infoopricepilot@gmail.com" className="mobile-link" onClick={() => setOpen(false)}>Support</a>
      </div>
    </>
  );
}

function Hero() {
  return (
    <section className="hero reveal">
      <div className="container">
        <h1 className="gradient-text">Global Pricing,<br />Optimized in Real Time</h1>
        <p>Automatically optimize how your prices appear to customers in each region using proven pricing patterns that increase conversions.</p>
        <div className="hero-btns" style={{ marginBottom: 24, display: "flex", justifyContent: "center", gap: 16 }}>
          <a href="/auth" className="btn btn-primary">Start Increasing Conversions {icon("arrow-right", { width: 16, marginLeft: 8 })}</a>
          <a href="#how-it-works" className="btn btn-outline" style={{ border: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(10px)" }}>How it Works</a>
        </div>
        <div className="trust-line" style={{ color: "var(--text-muted)", fontSize: "0.9rem", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
          {icon("trending-up", { width: 16, color: "var(--green)" })}
          <span>+12-18% average conversion uplift</span>
        </div>
      </div>
    </section>
  );
}

function GlobeSection() {
  return (
    <section id="how-it-works" style={{ paddingTop: 0, paddingBottom: 60 }}>
      <div className="container">
        <h2 style={{ textAlign: "center", marginBottom: 12 }}>Why Better Pricing Increases Revenue</h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)", maxWidth: 600, margin: "0 auto" }}>You do not need more traffic to grow. Small improvements in how prices are shown can lead to more purchases from the same visitors.</p>
      </div>
      <div className="globe-section reveal">
        <div className="globe-wrapper">
          <canvas id="globe-canvas" />
          {currencyCards.map(([id, symbol, label, price]) => (
            <div className="currency-card" id={id} key={id}>
              <span className="cc-symbol">{symbol}</span>
              <div className="cc-info"><span className="cc-label">{label}</span><span className="cc-price">{price}</span></div>
            </div>
          ))}
        </div>
      </div>
      <div className="container">
        <div className="steps-grid">
          {[
            ["users", "Same traffic", "Your store already gets visitors. The goal is to convert more of them."],
            ["tag", "Better price perception", "Cleaner, more familiar prices feel easier to trust and easier to buy."],
            ["trending-up", "More revenue", "Even a small lift in conversion can increase total revenue without increasing ad spend."],
          ].map(([name, title, text]) => (
            <div className="card reveal" key={title}>
              <div className="feature-icon" style={{ marginBottom: 16 }}>{icon(name)}</div>
              <h3>{title}</h3>
              <p style={{ color: "var(--text-muted)", marginTop: 12 }}>{text}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 48 }} className="reveal">
          <p style={{ fontWeight: 700, fontSize: "1.25rem", color: "var(--accent)" }}>Same product. Same traffic. Better pricing. More revenue.</p>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" style={{ background: "var(--surface)" }}>
      <div className="container" style={{ maxWidth: 1600, padding: "0 20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: 12 }}>Simple, Transparent Pricing</h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)", maxWidth: 600, margin: "0 auto 64px" }}>Boost your ROI from day one. Scale as you grow with our flexible plans.</p>
        <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, alignItems: "stretch" }}>
          {pricingPlans.map(plan => (
            <div
              className="card"
              key={plan.name}
              style={{
                border: plan.popular ? "2px solid var(--accent)" : "1px solid var(--border)",
                background: plan.popular ? "var(--surface)" : "var(--surface2)",
                padding: 32,
                transform: plan.popular ? "scale(1.05)" : undefined,
                position: "relative",
                boxShadow: plan.popular ? "0 10px 40px rgba(108, 99, 255, 0.2)" : undefined,
              }}
            >
              {plan.popular && (
                <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "#fff", padding: "6px 16px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                  {icon("sparkles", { width: 14, height: 14 })} Most Popular
                </div>
              )}
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: plan.popular ? "var(--accent)" : "var(--text-muted)", textTransform: "uppercase", marginBottom: 16 }}>{plan.name}</div>
              <h3 style={{ fontSize: "2rem", marginBottom: 12 }}>{plan.price}{plan.suffix && <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>{plan.suffix}</span>}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 24 }}>{plan.text}</p>
              <ul style={{ listStyle: "none", marginBottom: 32, fontSize: "0.85rem" }}>
                {plan.features.map(feature => (
                  <li key={feature} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>{icon(feature.includes("Branding") ? "info" : "check", { color: feature.includes("Branding") ? "var(--accent)" : "var(--green)", width: 14 })} {feature}</li>
                ))}
              </ul>
              <a href={plan.href} className={`btn ${plan.popular ? "btn-primary" : "btn-outline"}`} style={{ width: "100%", justifyContent: "center" }}>{plan.cta}</a>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Need custom requirements? <a href="mailto:infoopricepilot@gmail.com" style={{ color: "var(--accent)", fontWeight: 600 }}>Contact us for Enterprise</a></p>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features">
      <div className="container">
        <h2 style={{ textAlign: "center", marginBottom: 12 }}>Pricing infrastructure for global growth</h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)", maxWidth: 640, margin: "0 auto 56px" }}>PricePilot helps teams localize, optimize, and measure pricing without building a custom pricing engine.</p>
        <div className="steps-grid">
          {[
            ["globe-2", "Local price presentation", "Show familiar prices by country, region, and currency."],
            ["bar-chart-3", "Analytics built in", "Track requests, plan usage, and conversion signals from one dashboard."],
            ["shield-check", "API-first control", "Use secure keys, rate limits, and predictable REST endpoints."],
          ].map(([name, title, text]) => (
            <div className="card reveal" key={title}>
              <div className="feature-icon" style={{ marginBottom: 16 }}>{icon(name)}</div>
              <h3>{title}</h3>
              <p style={{ color: "var(--text-muted)", marginTop: 12 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Demo() {
  const [expanded, setExpanded] = useState(false);
  const [initialLeaving, setInitialLeaving] = useState(false);
  const lineOverlap = 8;

  useEffect(() => {
    window.lucide?.createIcons();
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return undefined;

    let cancelled = false;
    const timers = [];
    const wait = ms => new Promise(resolve => {
      const timer = window.setTimeout(resolve, ms);
      timers.push(timer);
    });

    const schedule = (callback, ms) => {
      const timer = window.setTimeout(() => {
        if (!cancelled) callback();
      }, ms);
      timers.push(timer);
      return timer;
    };

    const createLine = (svg, x1, y1, x2, y2, isActive) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const cp1x = x1 + (x2 - x1) / 2;
      const cp2x = x1 + (x2 - x1) / 2;
      const d = `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;

      path.setAttribute("d", d);
      path.setAttribute("class", `flow-line ${isActive ? "active" : ""}`);
      path.style.strokeDasharray = "2000";
      path.style.strokeDashoffset = "2000";

      svg.appendChild(path);
      return path;
    };

    const animateLines = lines => Promise.all(lines.map(line => new Promise(resolve => {
      schedule(() => {
        const length = line.getTotalLength() || 1000;
        line.style.strokeDasharray = length;
        line.style.strokeDashoffset = length;

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled) return;
            line.style.transition = "stroke-dashoffset 1500ms ease-in-out";
            line.style.strokeDashoffset = "0";
            schedule(() => {
              line.classList.add("marching");
              resolve();
            }, 1500);
          });
        });
      }, 10);
    })));

    const runSequencedAnimation = async () => {
      const sourceCard = document.getElementById("source-price");
      const markets = [1, 2, 3, 4, 5].map(i => document.getElementById(`market-${i}`));
      const opts = [1, 2, 3, 4, 5].map(i => document.getElementById(`opt-${i}`));
      const svg = document.getElementById("flow-svg");

      if (!sourceCard || !svg || markets.some(item => !item) || opts.some(item => !item)) return;

      sourceCard.style.opacity = "0";
      sourceCard.style.transform = "scale(1)";
      markets.forEach(m => {
        m.style.opacity = "0";
        m.style.transform = "translateX(0)";
      });
      opts.forEach(o => {
        o.style.opacity = "0";
        o.style.transform = "translateX(0)";
      });

      await new Promise(resolve => requestAnimationFrame(resolve));
      if (cancelled) return;

      const svgRect = svg.getBoundingClientRect();
      const sourceRect = sourceCard.getBoundingClientRect();
      const marketRects = markets.map(m => m.getBoundingClientRect());
      const optRects = opts.map(o => o.getBoundingClientRect());

      svg.innerHTML = "";
      sourceCard.style.transform = "scale(0.8)";
      markets.forEach(m => {
        m.style.transform = "translateX(-20px)";
      });
      opts.forEach(o => {
        o.style.transform = "translateX(-20px)";
      });

      await wait(100);
      if (cancelled) return;

      sourceCard.style.transition = "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)";
      sourceCard.style.opacity = "1";
      sourceCard.style.transform = "scale(1)";

      await wait(800);
      if (cancelled) return;

      const startX = sourceRect.right - svgRect.left - lineOverlap;
      const startY = sourceRect.top + sourceRect.height / 2 - svgRect.top;
      const firstLines = markets.map((_, index) => {
        const marketRect = marketRects[index];
        return createLine(
          svg,
          startX,
          startY,
          marketRect.left - svgRect.left + lineOverlap,
          marketRect.top + marketRect.height / 2 - svgRect.top,
          false
        );
      });

      await animateLines(firstLines);
      if (cancelled) return;

      markets.forEach((market, index) => {
        schedule(() => {
          market.style.transition = "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
          market.style.opacity = "1";
          market.style.transform = "translateX(0)";
        }, index * 50);
      });

      await wait(800);
      if (cancelled) return;

      const secondLines = markets.map((_, index) => {
        const marketRect = marketRects[index];
        const optRect = optRects[index];
        return createLine(
          svg,
          marketRect.right - svgRect.left - lineOverlap,
          marketRect.top + marketRect.height / 2 - svgRect.top,
          optRect.left - svgRect.left + lineOverlap,
          optRect.top + optRect.height / 2 - svgRect.top,
          true
        );
      });

      await animateLines(secondLines);
      if (cancelled) return;

      opts.forEach((opt, index) => {
        schedule(() => {
          opt.style.transition = "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
          opt.style.opacity = "1";
          opt.style.transform = "translateX(0)";

          schedule(() => {
            opt.style.boxShadow = "0 0 20px var(--green-glow)";
            schedule(() => {
              opt.style.boxShadow = "";
            }, 1000);
          }, 600);
        }, index * 50);
      });
    };

    const onResize = () => {
      runSequencedAnimation();
    };

    runSequencedAnimation();
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      timers.forEach(timer => window.clearTimeout(timer));
      window.removeEventListener("resize", onResize);
    };
  }, [expanded]);

  const showExpandedDemo = () => {
    setInitialLeaving(true);
    window.setTimeout(() => {
      setExpanded(true);
      setInitialLeaving(false);
    }, 500);
  };

  return (
    <section id="regional-demo" className="reveal" style={{ background: "var(--surface)", position: "relative", overflow: "hidden" }}>
      <div
        className={`container ${expanded ? "hidden" : ""}`}
        id="demo-initial"
        style={{
          minHeight: 650,
          opacity: initialLeaving ? 0 : 1,
          transform: initialLeaving ? "translateY(-20px)" : "translateY(0)",
          transition: "all 0.5s ease",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 48 }}>Regional Price Perception</h2>
        {!expanded ? (
          <>
            <div className="demo-card">
              <div className="demo-side">
                <span className="price-label">What your customers see today</span>
                <div
                  className="price-value"
                  style={{ color: "var(--text-muted)", fontSize: "2.2rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 15 }}
                >
                  <span className="stat-count">$10.78</span>
                  <span style={{ fontSize: "0.7rem", color: "#ff5555", border: "1px solid rgba(255, 85, 85, 0.3)", padding: "4px 8px", borderRadius: 4, textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>
                    Low conversion
                  </span>
                </div>
                <p style={{ marginTop: 24, fontSize: "0.9rem", color: "var(--text-muted)" }}>Feels awkward. Reduces trust and conversions</p>
              </div>
              <div className="demo-side" style={{ background: "rgba(108, 99, 255, 0.05)", borderLeft: "1px solid var(--border)" }}>
                <span className="price-label">With PricePilot</span>
                <div
                  className="price-value price-optimized"
                  style={{ fontSize: "2.5rem", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 15 }}
                >
                  <span className="stat-count">$10.99</span>
                  <span style={{ fontSize: "0.7rem", background: "var(--green)", color: "#000", padding: "4px 8px", borderRadius: 4, textTransform: "uppercase", fontWeight: 800, letterSpacing: 1, boxShadow: "0 4px 12px rgba(34, 211, 165, 0.3)" }}>
                    Optimized
                  </span>
                </div>
                <p style={{ marginTop: 24, fontSize: "0.9rem", color: "var(--text-muted)" }}>Clean. Familiar. Built to convert.</p>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <p style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: "1.1rem", maxWidth: 600, margin: "0 auto 32px" }}>
                Increase conversions without changing your product or traffic.
              </p>
              <button
                id="btn-see-more"
                className="btn btn-primary"
                style={{ padding: "18px 40px", fontSize: "1.1rem", boxShadow: "0 0 40px var(--accent-glow)" }}
                onClick={showExpandedDemo}
              >
                See what Price Pilot do
              </button>
            </div>
          </>
        ) : (
          null
        )}
      </div>
      {expanded && (
        <div className="container" id="demo-expanded" style={{ opacity: 1, transform: "translateY(0)", transition: "all 0.6s ease", minHeight: 650 }}>
          <h2 style={{ textAlign: "center", marginBottom: 64 }}>Global Price Engine in Action</h2>
          <div className="flow-viz-wrapper">
            <svg className="flow-svg" id="flow-svg" />
            <div className="flow-column source-col">
              <div className="flow-card main-source" id="source-price">
                <span className="flow-card-label">Your Global Price</span>
                <span className="flow-card-val">$49.00</span>
                <span className="flow-card-tag">Base Price</span>
              </div>
            </div>
            <div className="flow-column market-col">
              {[
                ["https://flagcdn.com/gb.svg", "UK", "GBP 38.42"],
                ["https://flagcdn.com/in.svg", "IN", "INR 4,082"],
                ["https://flagcdn.com/br.svg", "BR", "R$243.12"],
                ["https://flagcdn.com/jp.svg", "JP", "JPY 7,342"],
                ["https://flagcdn.com/de.svg", "DE", "EUR 45.18"],
              ].map(([src, alt, price], index) => (
                <div className="flow-card market-card" id={`market-${index + 1}`} key={alt}>
                  <img src={src} width="20" alt={alt} />
                  <span>{price}</span>
                </div>
              ))}
            </div>
            <div className="flow-column optimized-col">
              {["GBP 39.99", "INR 4,199", "R$249.00", "JPY 7,500", "EUR 45.99"].map((price, index) => (
                <div className="flow-card opt-card" id={`opt-${index + 1}`} key={price}>
                  <span className="opt-price">{price}</span>
                  <span className="opt-tag">Optimized</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 64 }}>
            <button id="btn-demo-back" className="btn btn-outline" style={{ fontSize: "0.9rem" }} onClick={() => setExpanded(false)}>
              {icon("arrow-left", { width: 16, marginRight: 8 })} Go Back
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function DeveloperHub() {
  return (
    <section style={{ background: "linear-gradient(to bottom, var(--bg), var(--surface))", borderTop: "1px solid var(--border)" }}>
      <div className="container dev-hub-grid">
        <div>
          <h2 style={{ marginBottom: 24 }}>Developer-Friendly. Business-Focused.</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>Built for developers, designed to drive real business results.</p>
          <ul style={{ listStyle: "none", color: "var(--text)" }}>
            {["Simple REST API", "Secure authentication", "Fast response times", "Works with any stack"].map(item => (
              <li key={item} style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>{icon("check-circle", { color: "var(--green)", width: 18 })} {item}</li>
            ))}
          </ul>
        </div>
        <div className="code-block rotated">
          <p style={{ marginBottom: 12, fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>// Start optimizing prices with just a few lines of code.</p>
          <pre>{`async function getOptimizedPrice(base, country) {
  const res = await fetch('/calculate-price', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_FIREBASE_ID_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ base_price: base, country })
  });

  return await res.json();
}`}</pre>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="/" className="logo-wrap">{icon("compass", { color: "var(--accent)" })} PricePilot</a>
            <div className="social-links">
              {["twitter", "youtube", "instagram", "facebook"].map(name => <a href="#" className="social-icon" aria-label={name} key={name}>{icon(name)}</a>)}
            </div>
          </div>
          <div className="footer-col">
            <h4>Use Cases</h4>
            <ul className="footer-links">
              <li><a href="#how-it-works">SaaS Platforms</a></li>
              <li><a href="#features">E-commerce Stores</a></li>
              <li><a href="#features">Global Expansion</a></li>
              <li><a href="/preview.html">A/B Testing <span className="badge badge-beta">Beta</span></a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul className="footer-links">
              <li><a href="/about.html">About Us</a></li>
              <li><a href="/contact.html">Contact</a></li>
              <li><a href="/privacy.html">Privacy Policy</a></li>
              <li><a href="/terms.html">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="copyright">&copy; 2026 PricePilot API. All rights reserved.</p>
          <div className="footer-bottom-links"><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="#">Cookie Settings</a></div>
        </div>
      </div>
    </footer>
  );
}

function HomePage() {
  useLandingEffects();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <GlobeSection />
        <Pricing />
        <Features />
        <Demo />
        <DeveloperHub />
        <section className="reveal" style={{ padding: "120px 0", background: "linear-gradient(to bottom, var(--bg), var(--surface))" }}>
          <div className="container" style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", marginBottom: 24 }}>Stop losing conversions to ugly pricing</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1.2rem", maxWidth: 600, margin: "0 auto 48px" }}>Your customers notice pricing more than you think.<br />Fix it automatically with PricePilot.</p>
            <a href="/auth" className="btn btn-primary" style={{ padding: "18px 40px", fontSize: "1.1rem" }}>Get Started for Free</a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  const path = window.location.pathname;

  if (path === "/auth" || path === "/auth.html") {
    return <AuthPage />;
  }

  return <HomePage />;
}
