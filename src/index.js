const app = require("./app");
const env = require("./config/env");

app.listen(env.port, () => {
  console.log(`PricePilot API listening on port ${env.port}`);
});
