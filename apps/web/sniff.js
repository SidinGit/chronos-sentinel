const { MongoClient } = require('mongodb');
const { createClient } = require('redis');
const fs = require('fs');

// Native fallback to load .env since we don't have the 'dotenv' package installed
const envContent = fs.readFileSync('.env.local', 'utf-8');
envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) process.env[key.trim()] = values.join('=').trim();
});

async function sniff() {
    console.log("🔍 Tapping into the Sentinel Pipeline...");

    // 1. Check Redis for the Live Pulse
    const redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
    
    // Find any active device pulse
    const keys = await redis.keys('pulse:*');
    if (keys.length > 0) {
        const pulseData = await redis.get(keys[0]);
        console.log("\n🔥 LIVE PULSE DETECTED IN REDIS!");
        console.log(JSON.parse(pulseData));
    } else {
        console.log("\n📭 No live pulse in Redis right now. App might be minimized or idle.");
    }

    // 2. Check MongoDB for RAW Logs arriving straight from the Ingestor
    const mongo = new MongoClient(process.env.MONGO_URI);
    await mongo.connect();
    const db = mongo.db("chronos"); // or whatever db name your uri defaults to

    const rawLogs = await db.collection("activity_logs").find().sort({ start_time: -1 }).limit(1).toArray();
    
    if (rawLogs.length > 0) {
        console.log("\n✅ RAW DATA INGESTED SUCCESSFULLY! (Go Server is securely receiving data)");
        console.log(rawLogs[0]);
    } else {
        console.log("\n❌ No raw logs found yet. The Rust Agent is not successfully pushing to the server.");
    }
    
    // 3. Check MongoDB for Aggregated Sessions
    const sessions = await db.collection("sessions").find().sort({ start_time: -1 }).limit(1).toArray();
    
    if (sessions.length > 0) {
        console.log("\n📚 LATEST HISTORICAL SESSION COMPILED IN MONGO!");
        console.log(sessions[0]);
    } else {
        console.log("\n⌛ No sessions aggregated yet. (The Go Aggregator batches logs every 60 seconds!)");
    }

    process.exit(0);
}

sniff().catch(console.error);
