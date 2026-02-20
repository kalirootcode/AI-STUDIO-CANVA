const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:7890');

ws.on('open', function open() {
    console.log('✅ Connected to Cyber-Canvas (ws://localhost:7890)');

    // Simulate TREND_DATA
    const trendData = {
        type: 'TREND_DATA',
        hashtag: 'cybersecurity',
        sound: 'Blade Runner 2049 Synth',
        viralHook: 'Stop using passwords now.',
        niche: 'InfoSec'
    };

    ws.send(JSON.stringify(trendData));
    console.log('📡 Sent TREND_DATA:', trendData);

    // Wait and close
    setTimeout(() => {
        console.log('👋 Closing connection');
        ws.close();
        process.exit(0);
    }, 2000);
});

ws.on('error', (err) => {
    console.error('❌ WebSocket Error:', err.message);
    process.exit(1);
});
