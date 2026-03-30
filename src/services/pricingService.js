function roundTo2(value) {
  return Number(value.toFixed(2));
}

function roundToPsych99(value) {
  const ceil = Math.ceil(value);
  return roundTo2(Math.max(0.99, ceil - 0.01));
}

function roundForIndia(value) {
  if (value < 1000) {
    return Math.round(value / 100) * 100 - 1;
  }
  return Math.round(value / 500) * 500 - 1;
}

function roundForUs(value) {
  const floor = Math.floor(value);
  const cents = floor % 2 === 0 ? 0.99 : 0.95;
  return roundTo2(Math.max(0.99, floor + cents));
}

function getCountryMultiplier(countryCode) {
  const country = String(countryCode || "").toUpperCase();
  const map = {
    IN: 0.9,
    US: 1,
    GB: 1.05,
    CA: 1.03
  };
  return map[country] ?? 1;
}

function getSourceMultiplier(source) {
  const normalized = String(source || "").toLowerCase();
  if (normalized.includes("facebook")) {
    return 0.95;
  }
  if (normalized.includes("google")) {
    return 1.01;
  }
  return 1;
}

function roundToPsych(value, style = 0.99) {
  const ceil = Math.ceil(value);
  return roundTo2(Math.max(style, ceil - (1 - style)));
}

function applyFinalRounding(amount, country, plan = "free") {
  const normalizedCountry = String(country || "").toUpperCase();
  const normalizedPlan = String(plan || "").toLowerCase();

  // 1. FREE PLAN: Strictly .99 psychological rounding only
  if (normalizedPlan === "free") {
    const ceil = Math.ceil(amount);
    return roundTo2(Math.max(0.99, ceil - 0.01));
  }

  // 2. STARTER PLAN: .50 / .99 split threshold
  if (normalizedPlan === "starter") {
    const floor = Math.floor(amount);
    const decimal = amount - floor;
    if (decimal > 0.50) {
      return roundTo2(floor + 0.99);
    } else {
      return roundTo2(floor + 0.50);
    }
  }

  // 3. GROWTH & PRO PLANS: Full Psychological Engine + Regional Logic
  if (normalizedCountry === "IN") {
    return roundTo2(roundForIndia(amount));
  }
  if (normalizedCountry === "US") {
    return roundTo2(roundForUs(amount));
  }
  
  // Default to advanced psychological rounding for other regions in premium tiers
  return roundToPsych99(amount);
}


function optimizePrice({ basePrice, country, source, plan }) {
  const countryMultiplier = getCountryMultiplier(country);
  const sourceMultiplier = getSourceMultiplier(source);

  const afterCountry = basePrice * countryMultiplier;
  const afterSource = afterCountry * sourceMultiplier;
  const finalPrice = applyFinalRounding(afterSource, country, plan);

  return {
    finalPrice,
    originalPrice: roundTo2(basePrice),
    adjustments: {
      country_adjustment: roundTo2(afterCountry - basePrice),
      source_adjustment: roundTo2(afterSource - afterCountry)
    }
  };
}

module.exports = {
  optimizePrice
};
