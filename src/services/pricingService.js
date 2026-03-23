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

function applyFinalRounding(amount, country) {
  const normalizedCountry = String(country || "").toUpperCase();

  if (normalizedCountry === "IN") {
    return roundTo2(roundForIndia(amount));
  }
  if (normalizedCountry === "US") {
    return roundTo2(roundForUs(amount));
  }
  return roundToPsych99(amount);
}

function optimizePrice({ basePrice, country, source }) {
  const countryMultiplier = getCountryMultiplier(country);
  const sourceMultiplier = getSourceMultiplier(source);

  const afterCountry = basePrice * countryMultiplier;
  const afterSource = afterCountry * sourceMultiplier;
  const finalPrice = applyFinalRounding(afterSource, country);

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
