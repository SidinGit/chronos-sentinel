const { MongoClient } = require('mongodb');

async function checkSessions() {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('chronos-sentinel');
        const sessions = await db.collection('sessions').find().sort({ end_time: -1 }).limit(5).toArray();
        
        console.log('--- LATEST SESSIONS ---');
        sessions.forEach(s => {
            console.log(`ID: ${s._id} | App: ${s.app_name} | Title: ${s.window_title} | IDLE: ${s.is_idle} | End: ${s.end_time}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

checkSessions();
