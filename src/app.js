import express from "express";
import { createServer } from "node:http";
import { connectToSocket } from "./controllers/socketmanager.js";
import mongoose from "mongoose";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create express app and HTTP server
const app = express();
const server = createServer(app);

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);


// Socket.io setup
const io = connectToSocket(server);

// Port setup
app.set("port", process.env.PORT || 8000);

// Simple route
app.get("/home", (req, res) => {
    return res.json({ message: "Hello World" });
});

// Start function with DB connection
async function start() {
    try {
        // 🧩 Replace username & password below with your MongoDB Atlas credentials
        const mongoUri = process.env.MONGO_URI || "mongodb+srv://abhijain7470_db_user:<db_password>@cluster0.dcib8e2.mongodb.net/?appName=Cluster0";

        const connectionDb = await mongoose.connect(mongoUri);

        console.log(`✅ MONGO CONNECTED DB HOST: ${connectionDb.connection.host}`);

        // Start server after DB connects
        server.listen(app.get("port"), () => {
            console.log(`🚀 Server running on port ${app.get("port")}`);
        });
    } catch (err) {
        console.error("❌ Failed to start server:", err);
        process.exit(1);
    }
}

start();
