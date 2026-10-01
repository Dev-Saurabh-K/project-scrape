import express from "express";
const app = express();
import { bank_info } from "./service/scrape.js";
import { configDotenv } from "dotenv";

configDotenv();

app.get("/",(req,res)=>{
    res.send("api working")
})

app.get("/gov/bank",async (req,res)=>{
    try {
        const info = await bank_info();
        res.json({ banks: info });
    } catch (error) {
        console.error("Failed to fetch bank information:", error);
        res.status(500).json({ error: "Failed to fetch bank information" });
    }
})

app.listen(process.env.PORT, ()=>{
    console.log(`server listening at ${process.env.PORT}`);
})