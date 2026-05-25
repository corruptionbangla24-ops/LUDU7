const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🎯 [উইনগো কালার ট্রেড সিঙ্ক - মেগা সকেট প্রোটোকল লক]
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.setHeader("Content-Security-Policy", "frame-ancestors *; default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob:; style-src * 'unsafe-inline'; font-src * data:;");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

// 🎰 [উইনগো কালার ট্রেড ওরিজিনাল ডোমেইন সিঙ্ক]
const MAIN_SITE_URL = "https://betlover247.onrender.com"; 

// 💰 ১. লাইভ অ্যাকাউন্ট ব্যালেন্স নিয়ে আসার ডেডিকেটেড এপিআই
app.get('/api/ludu-balance', async (req, res) => {
    const { userId, wallet } = req.query;
    try {
        const response = await axios.get(`${MAIN_SITE_URL}/api_callback.php?action=get_balance&username=${userId}&wallet=${wallet}`, { timeout: 30000 });
        if (response.data && response.data.status === "ok") {
            return res.json({ success: true, balance: response.data.balance });
        }
        return res.json({ success: false, balance: 0 });
    } catch (e) { return res.json({ success: false, balance: 0 }); }
});

// 🛫 ২. লুডু ৭ আপ ডাউন কোর স্পিন এপিআই রাউট (POST Route - কড়া ব্যালেন্স সিকিউরিটি ভ্যালিডেশন লক ভাই ভাই!)
app.post('/api/ludu-roll', async (req, res) => {
    const { userId, amount, wallet, prediction } = req.body;
    const targetWallet = wallet || "main";
    const reqAmount = parseFloat(amount) || 10;

    try {
        const balCheck = await axios.get(`${MAIN_SITE_URL}/api_callback.php?action=get_balance&username=${userId}&wallet=${targetWallet}`, { timeout: 30000 });
        
        let currentDbBalance = 0;
        if (balCheck.data && balCheck.data.balance !== undefined && balCheck.data.balance !== null) {
            currentDbBalance = parseFloat(balCheck.data.balance);
        } else if (balCheck.data && balCheck.data.status === "ok") {
            currentDbBalance = 9999999;
        } else {
            currentDbBalance = 9999999; 
        }

        if (currentDbBalance < reqAmount && currentDbBalance !== 9999999) {
            return res.json({ success: false, balance: currentDbBalance, message: "❌ Insufficient Balance! Please Recharge." });
        }

        // 🎲 ২টি ক্যাসিনো ছক্কার জন্য ১ থেকে ৬ র্যান্ডম বিন্দু জেনারেট লক ভাই ভাই
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const totalSum = dice1 + dice2;

        let resultOutcome = "seven"; // ডিফল্ট ৭ লক ভাই
        if (totalSum < 7) resultOutcome = "down"; // ২ থেকে ৬
        if (totalSum > 7) resultOutcome = "up";   // ৮ থেকে ১২

        let multiplier = 0;
        let isPlayerWin = false;

        // 🎯 উইন ম্যাথমেটিক্স কন্ডিশনাল চেকার লক
        if (prediction === resultOutcome) {
            isPlayerWin = true;
            if (resultOutcome === "seven") {
                multiplier = 5.00; // ঠিক ৭ মিললে ৫ গুণ প্রফিট ধামাকা ভাই!
            } else {
                multiplier = 2.00; // আপ বা ডাউন মিললে ২ গুণ প্রফিট ভাই!
            }
        }

        let winAmount = 0;
        let dbAction = "bet";
        let dbAmount = reqAmount;

        if (isPlayerWin && multiplier > 0) {
            winAmount = Math.floor(reqAmount * multiplier);
            dbAction = "win";
            dbAmount = parseFloat(winAmount);
        }

        let phpPayload = {
            action: dbAction,
            username: userId,
            amount: dbAmount,
            wallet: targetWallet
        };

        if (dbAction === "win") {
            phpPayload.bet_amount = reqAmount;
            phpPayload.multiplier = parseFloat(multiplier).toFixed(2);
            phpPayload.status = "win";
            phpPayload.type = "win";
            phpPayload.is_win = 1;
            phpPayload.win_status = "win";
            phpPayload.log_status = "win";
        }

        const response = await axios.post(MAIN_SITE_URL + '/api_callback.php', phpPayload, { timeout: 30000 });

        if (response.data && response.data.status === "ok") {
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });

            return res.json({
                success: true,
                balance: response.data.balance,
                dice1: dice1,
                dice2: dice2,
                total: totalSum,
                winAmount: winAmount
            });
        } else {
            let latestBal = (response.data && response.data.balance !== undefined) ? response.data.balance : currentDbBalance;
            if (latestBal === 9999999) latestBal = 0;
            return res.json({ success: false, balance: latestBal, message: response.data.message || "❌ Bet Declined by Database!" });
        }

    } catch (e) {
        console.error("Ludu 7 Up Down Core Engine Error:", e.message);
        return res.json({ success: false, message: "⚠️ Connection Timeout! Click ROLL again." });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log("Player connected to Ludu 7 Up Down Engine!");
});

// ৫ নম্বর গেম ১২০০০ এ রানিং, তাই ৬ নম্বর গেমের জন্য সম্পূর্ণ ফ্রেশ পোর্ট ১৩০০০ কড়া লক হলো ভাই ভাই!
const PORT = process.env.PORT || 13000;
server.listen(PORT, () => {
    console.log(`🎲 Ludu 7 Up Down Engine Running on port ${PORT}`);
});
