import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectToDatabase } from "./lib/mongoose.js";

dotenv.config();

const app = createApp();
const port = Number(process.env.PORT ?? 4000);

async function startServer() {
  console.log("Connecting to MongoDB...");

  try {
    await connectToDatabase();
    console.log("MongoDB connected.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("MongoDB connection failed:", message);
    console.error("Tip: Check MongoDB Atlas Network Access allowlist for your current IP.");
    throw error;
  }

  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start backend process.", error);
  process.exit(1);
});
