const { getSupabaseClient } = require("../config/supabase");

async function getAnalyticsHandler(req, res, next) {
  try {
    const userId = req.authUser.id;
    const supabase = getSupabaseClient();
    const days = parseInt(req.query.days) || 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startIso = startDate.toISOString();

    // 1. Get total requests (fast count)
    const { count: totalRequests, error: usageErr } = await supabase
      .from("usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (usageErr) throw usageErr;

    // 2. Get aggregated pricing stats using SQL
    // Note: We use rpc or raw query if possible, but with Supabase JS we can do standard filters.
    // For MVP, we'll fetch the summary data.
    const { data: pricingData, error: pricingErr } = await supabase
      .from("pricing_logs")
      .select("base_price, final_price, optimized_final_price, converted, created_at")
      .eq("user_id", userId)
      .gte("created_at", startIso)
      .order("created_at", { ascending: false });

    if (pricingErr) throw pricingErr;

    // 3. Simple SQL-like aggregation in Node (still better than the nested filter)
    let totalConversions = 0;
    let totalRevenueOptimized = 0;
    let totalBaseRevenue = 0;
    const dailyMap = {};

    pricingData.forEach(log => {
      const dateStr = new Date(log.created_at).toISOString().split("T")[0];
      if (!dailyMap[dateStr]) dailyMap[dateStr] = { requests: 0, conversions: 0 };
      
      dailyMap[dateStr].requests++;
      if (log.converted) {
        totalConversions++;
        dailyMap[dateStr].conversions++;
      }
      
      totalBaseRevenue += Number(log.base_price || 0);
      totalRevenueOptimized += Number(log.optimized_final_price || log.final_price || 0);
    });

    const conversionRate = pricingData.length > 0 
      ? ((totalConversions / pricingData.length) * 100).toFixed(1) 
      : 0;

    const lift = totalBaseRevenue > 0 
      ? (((totalRevenueOptimized - totalBaseRevenue) / totalBaseRevenue) * 100).toFixed(1)
      : 0;

    // 4. Build Time Series from Map (O(days))
    const timeSeries = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const stats = dailyMap[dateStr] || { requests: 0, conversions: 0 };
      
      timeSeries.push({
        date: dateStr,
        label: d.toLocaleDateString([], { weekday: 'short', day: 'numeric' }),
        requests: stats.requests,
        conversions: stats.conversions
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
