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
  // Disabling regional discounts as requested
  return 1;
}


function getSourceMultiplier(source) {
  // Disabling source discounts as requested
  return 1;
}


function roundToPsych(value, style = 0.99) {
  const ceil = Math.ceil(value);
  return roundTo2(Math.max(style, ceil - (1 - style)));
}

function applyFinalRounding(amount, country, plan = "free") {
  const normalizedPlan = String(plan || "").toLowerCase();
  const PAID_PLANS = ["starter", "growth", "pro", "enterprise"];

  // 1. PAID PLANS (Starter/Growth/Pro): .50 / .99 split threshold
  if (PAID_PLANS.includes(normalizedPlan)) {
    const floor = Math.floor(amount);
    const decimal = amount - floor;

    // Rule: Above .50 -> .99, At or Below .50 -> .50
    if (decimal > 0.50) {
      return roundTo2(floor + 0.99);
    } else {
      return roundTo2(floor + 0.50);
    }
  }

  // 2. DEFAULT / FREE PLAN: Always round UP to the next .99 threshold
  // This is the fallback for un-paid/free/missing tiers.
  const ceil = Math.ceil(amount);
  return roundTo2(Math.max(0.99, ceil - 0.01));
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
