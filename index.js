import express from "express";
import { configDotenv } from "dotenv";
import { bank_info } from "./service/scrape.js";

configDotenv();

const app = express();

app.get("/", (req, res) => {
    res.send("API working");
});

app.get("/gov/bank", async (req, res) => {
    try {
        const info = await bank_info();

        res.json({
            banks: info
        });
    } catch (error) {
        console.error("Failed to fetch bank information:", error);

        res.status(500).json({
            error: "Failed to fetch bank information"
        });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server listening at ${process.env.PORT}`);
});