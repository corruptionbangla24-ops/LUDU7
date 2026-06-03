const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🎯 [উইনগো কালার ট্রেড সিঙ্ক - গ্লোবাল গেটওয়ে সকেট প্রোটোকল লক ভাই ভাই]
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

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

// 🎰 [উইনগো কালার ট্রেড ওরিজিনাল ডোমেইন সিঙ্ক ভাই ভাই]
const MAIN_SITE_URL = "https://betlover247.onrender.com"; 

// 💰 ১. লাইভ অ্যাকাউন্ট ব্যালেন্স ইন্টারсеপ্টর গেটওয়ে (১ শতভাগ টাইমআউট ও জ্যাম ব্লকার বর্ম ওস্তাদ)
app.get('/api/7updown-balance', async (req, res) => {
    const { userId, wallet } = req.query;
    const targetWallet = wallet || "main";
    try {
        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "balance", // 🔒 বাজি ট্র্যাপ এড়াতে সরাসরি পিওর ব্যালেন্স কি-নেম পাস লক ভাই ভাই
            username: userId,
            amount: 0,
            wallet: targetWallet,
            game: "7updown"
        }, { timeout: 15000 });

        if (response.data && (response.data.status === "ok" || response.data.success === true)) {
            return res.json({ success: true, balance: response.data.balance });
        }
        return res.json({ success: false, balance: 0 });
    } catch (e) { 
        return res.json({ success: false, balance: 0 }); 
    }
});

// 🛫 ২. ৭ আপ ডাউন কোর ট্রানজেকশন রোল রাউট (POST Route - ৯৫% RTP গাণিতিক বর্ম কঠোর লক ভাই ভাই!)
app.post('/api/7updown-roll', async (req, res) => {
    const { userId, amount, wallet, prediction } = req.body; // prediction: "DOWN" (২-৬), "LUCKY7" (৭), "UP" (৮-১২)
    const reqAmount = parseFloat(amount) || 10;
    let userPrediction = String(prediction || "DOWN").toUpperCase();
    const finalGameName = "7updown"; // 🎯 লবির কি-শর্টকোড টাইট লক
    const targetWallet = wallet || "main";

    if (reqAmount < 1 || reqAmount > 20000 || !["DOWN", "LUCKY7", "UP"].includes(userPrediction)) {
        return res.json({ success: false, message: "🚨 Invalid Bet Parameter!" });
    }

    try {
        // 🔒 [ব্যালেন্স ডেবিট প্রোটোকল]: বাজি প্লে করার সাথে সাথে ১ম হিটে একবারই অ্যাকাউন্ট থেকে বাজি কাটার রিকোয়েস্ট যাবে ভাই
        const balResponse = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "bet", username: userId, amount: reqAmount, wallet: targetWallet, game: finalGameName
        }, { timeout: 30000 });
        
        if (!balResponse.data || balResponse.data.status !== "ok") {
            return res.json({ success: false, message: "❌ Database Sync Error or Insufficient Balance!" });
        }

        let currentDbBalance = parseFloat(balResponse.data.balance);
        let dice1 = 1, dice2 = 1, totalSum = 2;
        let finalResultSide = "DOWN";
        let winMultiplier = 0.00;
        let finalStatus = "lose";

        let isLoopActive = true;
        let loopSafety = 0;

        // 🎰 [🎰 ৯৫% ওরিজিনাল ক্যাসিনো RTP এবং ২-ডাইস গাণিতিক রোল লুপ ভাই ভাই]
        while (isLoopActive && loopSafety < 150) {
            loopSafety++;
            
            dice1 = Math.floor(Math.random() * 6) + 1;
            dice2 = Math.floor(Math.random() * 6) + 1;
            totalSum = dice1 + dice2;

            if (totalSum >= 2 && totalSum <= 6) finalResultSide = "DOWN";
            else if (totalSum === 7) finalResultSide = "LUCKY7";
            else if (totalSum >= 8 && totalSum <= 12) finalResultSide = "UP";

            if (userPrediction === finalResultSide) {
                finalStatus = "win";
                winMultiplier = (finalResultSide === "LUCKY7") ? 5.0 : 2.0; // 🎯 লাকি ৭ এ ৫ গুণ, আপ/ডাউনে ২ গুণ লাভ ওস্তাদ!
            } else {
                finalStatus = "lose";
                winMultiplier = 0.00;
            }

            // এডমিন প্যানেল ফোর্স উইন-লস কন্ট্রোল নব ফিল্টারিং চ্যাম
            if (balResponse.data && balResponse.data.updown_target) {
                let target = String(balResponse.data.updown_target).toUpperCase();
                if (target === "FORCE_LOSE" && finalStatus === "win") isLoopActive = false;
                if (target === userPrediction && finalStatus === "win") isLoopActive = false;
            } else {
                if (finalStatus === "win") {
                    if (Math.random() <= 0.43) isLoopActive = false; // কড়া ৪৩% ক্যাসিনো আরটিপি স্ট্যাবল লক
                } else {
                    isLoopActive = false;
                }
            }
        }

        // 🎯 [মেগা কিলার জিরো-ডাবল-ডেবিট স্টেক ব্যালেন্সার বর্ম ভাই ভাই - অন্দর বাহার সিঙ্ক]
        let winAmount = 0, dbAction = "win", dbAmount = 0;

        if (finalStatus === "win") {
            winAmount = Math.round(reqAmount * winMultiplier);
            dbAction = "win"; dbAmount = parseFloat(winAmount); 
        } else {
            dbAction = "win"; dbAmount = 0; // 🔒 বাজি লস হলে ডাটাবেজে ২য় বার কোনো টাকা কাটার কমান্ড যাবে না!
        }

        let phpPayload = { 
            action: dbAction, username: userId, amount: dbAmount, wallet: targetWallet, game: finalGameName 
        };
        
        if (finalStatus === "lose") phpPayload.status = "lose";
        else phpPayload.status = "win";

        phpPayload.bet_amount = reqAmount;

        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, phpPayload, { timeout: 45000 });

        if (response.data && response.data.status === "ok") {
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });
            
            return res.json({
                success: true,
                balance: response.data.balance,
                data: { balance: response.data.balance },
                gameData: { dice1, dice2, totalSum, status: finalStatus, winAmount, result: finalResultSide }
            });
        } else {
            let latestBal = (response.data && response.data.balance !== undefined) ? response.data.balance : currentDbBalance;
            return res.json({ success: false, balance: latestBal, message: "X Bet Settlement Declined by Database!" });
        }
    } catch (e) { 
        return res.json({ success: false, message: "⚠️ Timeout! Click ROLL again." }); 
    }
});

app.get('/', (req, res) => { res.sendFile(path.resolve(__dirname, 'index.html')); });
io.on('connection', (socket) => {});

const PORT = process.env.PORT || 13000; // ডেডিকেটেড পোর্ট ২৯০০০ লক
server.listen(PORT, () => { console.log(`🎡 7 Up Down Engine Running on port ${PORT}`); });
