/**
 * Normalizes a URL, Origin, or Referer into a clean domain name.
 * Example: 'https://www.example.com/path' -> 'example.com'
 */
function normalizeDomain(input) {
  if (!input || typeof input !== "string") return null;

  try {
    let clean = input.trim().toLowerCase();
    
    // 1. Remove protocols
    clean = clean.replace(/^(https?:\/\/)/, "");
    
    // 2. Remove paths, query strings, and PORTS
    // split(':') handles 'example.com:8080' -> 'example.com'
    clean = clean.split("/")[0].split("?")[0].split("#")[0].split(":")[0];
    
    // 3. Remove 'www.' and trailing dots
    if (clean.startsWith("www.")) {
      clean = clean.substring(4);
    }
    clean = clean.replace(/\.+$/, ""); // Remove trailing dots
    
    // 4. Basic validation
    if (!clean.includes(".") || clean.includes(" ") || clean.length < 3) {
      return null;
    }
    
    return clean;
  } catch (err) {
    return null;
  }
}

module.exports = { normalizeDomain };
