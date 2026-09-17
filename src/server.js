// Local development server. On Vercel the app is served by api/index.js instead.
import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`CloudMart API running on http://localhost:${PORT}/api`);
});
