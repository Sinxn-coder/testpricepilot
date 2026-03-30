const { getSupabaseClient } = require("../config/supabase");

async function getAnalyticsHandler(req, res, next) {
  try {
    const userId = req.authUser.id;
    const supabase = getSupabaseClient();

    // 1. Get total usage counts (Filtering by CORE pricing optimization endpoints only)
    const { count: totalRequests, error: usageErr } = await supabase
      .from("usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .ilike("endpoint", "%calculate-price%");


    if (usageErr) throw usageErr;

    // 2. Get pricing stats (Conversion Rate & ROI)
    const { data: pricingData, error: pricingErr } = await supabase
      .from("pricing_logs")
      .select("base_price, final_price, optimized_final_price, converted, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (pricingErr) throw pricingErr;

    // 3. Aggregate stats
    let totalConversions = 0;
    let totalRevenueOptimized = 0;
    let totalBaseRevenue = 0;

    pricingData.forEach(log => {
      if (log.converted) totalConversions++;
      totalBaseRevenue += Number(log.base_price || 0);
      totalRevenueOptimized += Number(log.optimized_final_price || log.final_price || 0);
    });

    const conversionRate = pricingData.length > 0 
      ? ((totalConversions / pricingData.length) * 100).toFixed(1) 
      : 0;

    const lift = totalBaseRevenue > 0 
      ? (((totalRevenueOptimized - totalBaseRevenue) / totalBaseRevenue) * 100).toFixed(1)
      : 0;

    // 4. Generate Time Series (Last 7 Days)
    const timeSeries = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      
      const dayRequests = pricingData.filter(log => {
        const logDate = new Date(log.created_at).toISOString().split("T")[0];
        return logDate === dateStr;
      }).length;

      const dayConversions = pricingData.filter(log => {
        const logDate = new Date(log.created_at).toISOString().split("T")[0];
        return logDate === dateStr && log.converted;
      }).length;
      
      timeSeries.push({
        date: dateStr,
        label: d.toLocaleDateString([], { weekday: 'short', day: 'numeric' }),
        requests: dayRequests,
        conversions: dayConversions
      });
    }

    return res.status(200).json({
      summary: {
        total_requests: totalRequests || 0,
        conversion_rate: `${conversionRate}%`,
        revenue_lift: `${lift}%`,
        total_logs: pricingData.length
      },
      time_series: timeSeries,
      recent_activity: pricingData.slice(0, 10)
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getAnalyticsHandler };
