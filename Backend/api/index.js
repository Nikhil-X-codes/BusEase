// backend/api/index.js
import app from "../src/app.js";
import connectDB from "../src/Db/index.js";

export default async (req, res) => {
    try {
        // Ensure database is connected before handling the request
        await connectDB();
        
        // Pass the request/response to your existing Express app logic
        return app(req, res);
    } catch (error) {
        console.error("Vercel DB Connection Error:", error);
        res.status(500).json({ error: "Failed to connect to database" });
    }
};