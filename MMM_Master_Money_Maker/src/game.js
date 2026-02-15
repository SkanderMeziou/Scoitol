import { Item, Market, Economy } from './engine.js';


const DEBUG_MODE = false;

if (typeof window !== 'undefined') {
    window.DEBUG_MMM = DEBUG_MODE;
}

function log(...args) {
    if (DEBUG_MODE) {
        console.log('[MMM]', ...args);
    }
}

class Game {
    constructor() {
        this.money = 100000;
        this.turn = 1;
        this.baseRent = 1000;
        this.currentRent = 1000;
        this.inventory = [];
        this.market = new Market();
        this.portfolioHistory = [];

        log('Game initialized', { money: this.money, rent: this.currentRent });
        this.init();
    }

    init() {
        this.market.refreshMarket();

        // Initialize portfolio history with starting values
        const totalAssets = 0;
        this.portfolioHistory.push({
            turn: this.turn,
            cash: this.money,
            assets: totalAssets
        });
        log('Portfolio history initialized', this.portfolioHistory[0]);

        this.updateUI();
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('next-turn-btn').addEventListener('click', () => this.nextTurn());
        document.getElementById('restart-btn').addEventListener('click', () => location.reload());
    }

    nextTurn() {
        if (this.money < this.currentRent) {
            log('Game Over - Not enough money for rent', { money: this.money, rent: this.currentRent });
            this.gameOver();
            return;
        }
        this.money -= this.currentRent;
        this.turn++;
        log('Turn advanced', { turn: this.turn, moneyAfterRent: this.money });

        this.inventory.forEach(item => {
            const oldValue = item.value;
            item.update();
            log(`Item updated: ${item.name}`, {
                oldValue: oldValue.toFixed(2),
                newValue: item.value.toFixed(2),
                reputation: item.reputation.toFixed(2),
                owners: item.owners
            });
        });
        this.market.refreshMarket();

        if (this.turn % 5 === 0) {
            const oldRent = this.currentRent;
            this.currentRent = Math.floor(this.currentRent * 1.01);
            log('Rent increased', { oldRent, newRent: this.currentRent });
        }

        // Track portfolio value
        const totalAssets = this.inventory.reduce((sum, item) => sum + (item.value * item.quantity), 0);
        this.portfolioHistory.push({
            turn: this.turn,
            cash: this.money,
            assets: totalAssets
        });
        if (this.portfolioHistory.length > 50) this.portfolioHistory.shift();
        log('Portfolio updated', {
            turn: this.turn,
            cash: this.money,
            assets: totalAssets,
            total: this.money + totalAssets,
            historyLength: this.portfolioHistory.length
        });

        this.updateUI();
    }

    buyItem(marketIndex, quantity = 1) {
        const item = this.market.availableItems[marketIndex];
        const totalCost = item.value * quantity;

        log('Attempting to buy', { item: item.name, quantity, totalCost, currentMoney: this.money });

        if (this.money >= totalCost) {
            const existing = this.inventory.find(inv => inv.name === item.name);

            if (existing) {
                existing.quantity += quantity;
                log('Added to existing stack', { item: item.name, newQuantity: existing.quantity });
            } else {
                item.quantity = quantity;
                this.inventory.push(item);
                log('Added new item to inventory', { item: item.name, quantity });
            }

            this.money -= totalCost;
            this.market.availableItems.splice(marketIndex, 1);
            this.updateUI();
        } else {
            log('Purchase failed - not enough money', { needed: totalCost, have: this.money });
            alert("Not enough money!");
        }
    }

    sellItem(inventoryIndex, quantity = 1) {
        const item = this.inventory[inventoryIndex];
        const sellValue = item.value * quantity;

        this.money += sellValue;
        item.quantity -= quantity;

        if (item.quantity <= 0) {
            this.inventory.splice(inventoryIndex, 1);
        }

        this.updateUI();
    }

    updateUI() {
        document.getElementById('money-display').textContent = Math.floor(this.money).toLocaleString();
        document.getElementById('rent-display').textContent = Math.floor(this.currentRent).toLocaleString();
        document.getElementById('turn-display').textContent = this.turn;

        // Rent warning
        const rentDisplay = document.getElementById('rent-display');
        if (this.currentRent > this.money) {
            rentDisplay.style.animation = 'pulse 1s infinite';
            rentDisplay.parentElement.style.background = 'rgba(255, 82, 82, 0.2)';
        } else {
            rentDisplay.style.animation = '';
            rentDisplay.parentElement.style.background = '';
        }

        // Inventory
        const inventoryList = document.getElementById('inventory-list');
        inventoryList.innerHTML = '';
        this.inventory.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'inventory-item';

            const lastVal = item.history[item.history.length - 2] || item.value;
            const change = ((item.value - lastVal) / lastVal) * 100;
            const trendColor = change >= 0 ? '#00e676' : '#ff5252';
            const trendSymbol = change >= 0 ? '▲' : '▼';

            div.innerHTML = `
                <div class="item-name">
                    ${item.name}
                    <span class="quantity-badge">×${item.quantity}</span>
                </div>
                <div class="item-value" style="color: ${trendColor}">
                    ${Math.floor(item.value).toLocaleString()} (${trendSymbol} ${Math.abs(change).toFixed(2)}%)
                </div>
                <div class="item-reputation" style="color: ${item.reputation >= 0 ? '#00e676' : '#ff5252'}">
                    ${item.reputation.toFixed(1)}
                </div>
                <div class="item-trend">
                    <canvas id="chart-${item.id}" width="100" height="40"></canvas>
                </div>
                <div class="item-actions">
                    <button class="sell-btn" data-index="${index}" data-qty="1">SELL 1</button>
                    ${item.quantity > 1 ? `<button class="sell-all-btn" data-index="${index}" data-qty="${item.quantity}">SELL ALL</button>` : ''}
                </div>
            `;
            inventoryList.appendChild(div);

            this.drawSparkline(`chart-${item.id}`, item.history, trendColor);
        });

        // Market
        const marketList = document.getElementById('market-list');
        marketList.innerHTML = '';
        this.market.availableItems.forEach((item, index) => {
            const forecast = item.generateForecast(30);
            const div = document.createElement('div');
            div.className = 'market-item';
            div.innerHTML = `
                <div class="market-item-header">
                    <span>${item.name}</span>
                    <span style="color: #ffd700">${Math.floor(item.value).toLocaleString()}</span>
                </div>
                <div class="market-forecast">
                    <canvas id="forecast-${item.id}" width="200" height="60"></canvas>
                </div>
                <div class="market-stats">
                    <span>Rep: ${item.reputation.toFixed(1)}</span>
                </div>
                <div class="buy-controls">
                    <div class="percentage-buttons">
                        <button class="pct-btn" data-index="${index}" data-pct="10">10%</button>
                        <button class="pct-btn" data-index="${index}" data-pct="25">25%</button>
                        <button class="pct-btn" data-index="${index}" data-pct="50">50%</button>
                        <button class="pct-btn" data-index="${index}" data-pct="75">75%</button>
                        <button class="pct-btn" data-index="${index}" data-pct="100">MAX</button>
                    </div>
                    <div class="buy-input-row">
                        <input type="number" class="qty-input" id="qty-${index}" value="1" min="1" max="1000000000000000000"> 
                        <button class="buy-btn" data-index="${index}">BUY</button><br>
                        <span class="cost-preview" id="cost-${index}">Cost: ${Math.floor(item.value).toLocaleString()}</span>
                        
                    </div>
                </div>
            `;
            marketList.appendChild(div);

            this.drawSparkline(`forecast-${item.id}`, forecast, '#00bcd4', 200, 60);
        });

        // Total Asset Value
        const totalAssets = this.inventory.reduce((sum, item) => sum + (item.value * item.quantity), 0);
        const totalValue = this.money + totalAssets;

        const existingTotal = document.getElementById('total-value');
        if (existingTotal) {
            existingTotal.textContent = `Total: ${Math.floor(totalValue).toLocaleString()} (Assets: ${Math.floor(totalAssets).toLocaleString()})`;
        } else {
            const totalDiv = document.createElement('div');
            totalDiv.id = 'total-value';
            totalDiv.className = 'total-value';
            totalDiv.textContent = `Total: ${Math.floor(totalValue).toLocaleString()} (Assets: ${Math.floor(totalAssets).toLocaleString()})`;
            document.getElementById('inventory-section').appendChild(totalDiv);
        }

        // Draw Portfolio Chart
        this.drawPortfolioChart();

        // Event Listeners
        document.querySelectorAll('.sell-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const qty = parseInt(e.target.dataset.qty) || 1;
                this.sellItem(e.target.dataset.index, qty);
            });
        });
        document.querySelectorAll('.sell-all-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const qty = parseInt(e.target.dataset.qty);
                this.sellItem(e.target.dataset.index, qty);
            });
        });
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                const qtyInput = document.getElementById(`qty-${index}`);
                const qty = parseInt(qtyInput.value) || 1;
                this.buyItem(index, qty);
            });
        });

        // Percentage buttons
        document.querySelectorAll('.pct-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                const pct = parseInt(e.target.dataset.pct);
                const item = this.market.availableItems[index];

                if (item) {
                    const moneyToSpend = (this.money * pct) / 100;
                    const quantity = Math.floor(moneyToSpend / item.value);
                    const finalQty = Math.min(Math.max(quantity, 1), 100000000000000000000000);

                    const qtyInput = document.getElementById(`qty-${index}`);
                    qtyInput.value = finalQty;

                    const costPreview = document.getElementById(`cost-${index}`);
                    const totalCost = item.value * finalQty;
                    costPreview.textContent = `Cost: ${Math.floor(totalCost).toLocaleString()}`;
                    costPreview.style.color = totalCost > this.money ? '#ff5252' : '#00e676';

                    log(`Percentage button clicked: ${pct}%`, {
                        moneyToSpend,
                        itemPrice: item.value,
                        quantity: finalQty
                    });
                }
            });
        });

        // Update cost preview on quantity change
        document.querySelectorAll('.qty-input').forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const qty = parseInt(e.target.value) || 1;
                const item = this.market.availableItems[index];
                if (item) {
                    const costPreview = document.getElementById(`cost-${index}`);
                    const totalCost = item.value * qty;
                    costPreview.textContent = `Cost: ${Math.floor(totalCost).toLocaleString()}`;
                    costPreview.style.color = totalCost > this.money ? '#ff5252' : '#00e676';
                }
            });
        });
    }

    drawSparkline(canvasId, data, color, width = 100, height = 40) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;

        data.forEach((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    drawPortfolioChart() {
        const canvas = document.getElementById('portfolio-chart');

        log('drawPortfolioChart called', {
            canvasFound: !!canvas,
            historyLength: this.portfolioHistory.length
        });

        if (!canvas) {
            log('ERROR: Portfolio chart canvas not found in DOM');
            return;
        }

        if (this.portfolioHistory.length === 0) {
            log('WARNING: Portfolio history is empty');
            return;
        }

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        log('Drawing portfolio chart', { width, height, dataPoints: this.portfolioHistory.length });

        ctx.clearRect(0, 0, width, height);

        // Calculate max value for scaling
        const maxValue = Math.max(...this.portfolioHistory.map(h => h.cash + h.assets));
        const minValue = 0;
        const range = maxValue - minValue || 1;

        log('Chart scale', { maxValue, minValue, range });

        // Draw stacked area chart
        const points = this.portfolioHistory.length;

        // Draw assets area (top layer)
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 188, 212, 0.3)'; // Cyan for assets

        this.portfolioHistory.forEach((data, i) => {
            const x = (i / (points - 1)) * width;
            const totalY = height - ((data.cash + data.assets - minValue) / range) * height;
            if (i === 0) ctx.moveTo(x, totalY);
            else ctx.lineTo(x, totalY);
        });

        // Complete the area by going back along cash line
        for (let i = points - 1; i >= 0; i--) {
            const data = this.portfolioHistory[i];
            const x = (i / (points - 1)) * width;
            const cashY = height - ((data.cash - minValue) / range) * height;
            ctx.lineTo(x, cashY);
        }
        ctx.closePath();
        ctx.fill();

        // Draw cash area (bottom layer)
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 230, 118, 0.5)'; // Green for cash

        this.portfolioHistory.forEach((data, i) => {
            const x = (i / (points - 1)) * width;
            const y = height - ((data.cash - minValue) / range) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();

        // Draw border lines
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 2;
        ctx.beginPath();
        this.portfolioHistory.forEach((data, i) => {
            const x = (i / (points - 1)) * width;
            const y = height - ((data.cash - minValue) / range) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        ctx.strokeStyle = '#00bcd4';
        ctx.beginPath();
        this.portfolioHistory.forEach((data, i) => {
            const x = (i / (points - 1)) * width;
            const y = height - ((data.cash + data.assets - minValue) / range) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        log('Portfolio chart drawn successfully');
    }

    gameOver() {
        document.getElementById('game-over-modal').classList.remove('hidden');
    }
}

new Game();
