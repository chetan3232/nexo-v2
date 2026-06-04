const fs = require('fs');
const path = require('path');

const ALLOWANCE_FILE = path.resolve(__dirname, '../data/allowances.json');

const initAllowances = () => {
    const dir = path.dirname(ALLOWANCE_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(ALLOWANCE_FILE)) {
        fs.writeFileSync(ALLOWANCE_FILE, JSON.stringify({}));
    }
};

const getAllowances = () => {
    initAllowances();
    try {
        return JSON.parse(fs.readFileSync(ALLOWANCE_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
};

const saveAllowances = (data) => {
    initAllowances();
    fs.writeFileSync(ALLOWANCE_FILE, JSON.stringify(data, null, 2));
};

const checkAllowance = (userId, email = "") => {
    const allowances = getAllowances();
    const isAnonymous = !userId || userId === 'anonymous';
    const key = isAnonymous ? 'anonymous' : userId;
    
    const maxAllowance = isAnonymous ? 0.50 : 5.00;
    const resetIntervalMs = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

    let userRecord = allowances[key];
    const now = new Date();

    if (!userRecord) {
        userRecord = {
            userId: key,
            email: email,
            balance: maxAllowance,
            lastReset: now.toISOString()
        };
        allowances[key] = userRecord;
        saveAllowances(allowances);
    } else {
        const lastResetDate = new Date(userRecord.lastReset);
        if (now - lastResetDate >= resetIntervalMs) {
            userRecord.balance = maxAllowance;
            userRecord.lastReset = now.toISOString();
            userRecord.email = email || userRecord.email;
            allowances[key] = userRecord;
            saveAllowances(allowances);
            console.log(`[AllowanceManager] Allowance reset for user: ${key} to $${maxAllowance}`);
        }
    }

    return userRecord;
};

const deductAllowance = (userId, cost) => {
    if (cost <= 0) return;
    const allowances = getAllowances();
    const key = (!userId || userId === 'anonymous') ? 'anonymous' : userId;
    
    if (allowances[key]) {
        allowances[key].balance = Math.max(0, Number((allowances[key].balance - cost).toFixed(6)));
        saveAllowances(allowances);
        console.log(`[AllowanceManager] Deducted $${cost.toFixed(6)} from user ${key}. Remaining balance: $${allowances[key].balance}`);
    }
};

module.exports = {
    checkAllowance,
    deductAllowance
};
