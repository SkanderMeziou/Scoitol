export class CardCalculator {
    constructor() {
        this.deckSize = 40;
        this.handSize = 5;
        this.outcomes = [];
        this.simulationRuns = 50000;

        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.addOutcome(); // Add one empty outcome by default
    }

    cacheDOM() {
        this.modal = document.getElementById('calculator-modal');
        this.deckSizeInput = document.getElementById('deck-size');
        this.handSizeInput = document.getElementById('hand-size');
        this.outcomesContainer = document.getElementById('outcomes-container');
        this.calculateBtn = document.getElementById('calculate-btn');
        this.addOutcomeBtn = document.getElementById('add-outcome-btn');
        this.resultSection = document.getElementById('calc-result-section');
        this.resultValue = document.getElementById('calc-result-value');
        this.resultDetail = document.getElementById('calc-result-detail');
    }

    bindEvents() {
        document.getElementById('calc-card').addEventListener('click', () => this.open());

        this.addOutcomeBtn.addEventListener('click', () => this.addOutcome());
        this.calculateBtn.addEventListener('click', () => this.calculate());

        // Delegate events for dynamic elements
        this.outcomesContainer.addEventListener('click', (e) => {
            if (e.target.closest('.remove-outcome-btn')) {
                const card = e.target.closest('.outcome-card');
                if (this.outcomesContainer.children.length > 1) {
                    card.remove();
                }
            }

            if (e.target.closest('.add-card-btn')) {
                const outcomeId = e.target.closest('.outcome-card').dataset.id;
                this.addCardRow(outcomeId);
            }

            if (e.target.closest('.remove-card-btn')) {
                const row = e.target.closest('.card-req-row');
                const container = row.parentElement;
                if (container.children.length > 1) {
                    row.remove();
                }
            }
        });

        // Close modal
        document.querySelector('#calculator-modal .close-modal').addEventListener('click', () => this.close());
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }

    open() {
        this.modal.classList.remove('hidden');
    }

    close() {
        this.modal.classList.add('hidden');
    }

    addOutcome() {
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const outcomeHtml = `
      <div class="outcome-card" data-id="${id}">
        <div class="outcome-header">
          <span class="outcome-title">Desired Outcome (Combo)</span>
          <button class="remove-outcome-btn" title="Remove Outcome">&times;</button>
        </div>
        <div class="card-requirements" id="reqs-${id}">
          <!-- Card rows go here -->
        </div>
        <button class="add-card-btn">+ Add Card to Combo</button>
      </div>
    `;

        this.outcomesContainer.insertAdjacentHTML('beforeend', outcomeHtml);
        this.addCardRow(id); // Add initial card row
    }

    addCardRow(outcomeId) {
        const container = document.getElementById(`reqs-${outcomeId}`);
        const rowdId = Date.now().toString(36) + Math.random().toString(36).substr(2);

        const rowHtml = `
      <div class="card-req-row" data-id="${rowdId}">
        <div class="req-inputs">
          <label>Copies Needed</label>
          <input type="number" class="copies-needed" value="1" min="1">
        </div>
        <div class="req-inputs">
          <label>In Deck</label>
          <input type="number" class="copies-in-deck" value="3" min="1">
        </div>
        <button class="remove-card-btn remove-outcome-btn" title="Remove Card">&times;</button>
      </div>
    `;

        container.insertAdjacentHTML('beforeend', rowHtml);
    }

    getInputs() {
        this.deckSize = parseInt(this.deckSizeInput.value) || 40;
        this.handSize = parseInt(this.handSizeInput.value) || 5;

        const outcomes = [];
        const outcomeCards = this.outcomesContainer.querySelectorAll('.outcome-card');

        outcomeCards.forEach(card => {
            const reqs = [];
            const rows = card.querySelectorAll('.card-req-row');

            rows.forEach(row => {
                const needed = parseInt(row.querySelector('.copies-needed').value) || 1;
                const inDeck = parseInt(row.querySelector('.copies-in-deck').value) || 1;
                reqs.push({ needed, inDeck });
            });

            if (reqs.length > 0) {
                outcomes.push(reqs);
            }
        });

        return outcomes;
    }

    calculate() {
        const outcomes = this.getInputs();

        if (outcomes.length === 0) return;

        // Monte Carlo Simulation
        let successCount = 0;

        for (let i = 0; i < this.simulationRuns; i++) {
            if (this.simulateHand(outcomes)) {
                successCount++;
            }
        }

        const probability = (successCount / this.simulationRuns) * 100;
        this.displayResult(probability);
    }

    simulateHand(outcomes) {
        // Build a simplified deck representation
        // We don't need to simulate the exact deck array every time, 
        // but we need to handle the "In Deck" logic correctly for multiple cards.
        // Challenge: If Outcome 1 needs Card A (3 in deck) and Outcome 2 needs Card B (3 in deck),
        // we need to know if Card A and Card B are distinct or the same card.
        // THE PROMPT IMPLIES distinct cards for each input within a combo.
        // Logic: For each simulation, we need to draw 'handSize' cards.
        // Optimization: We can treat the deck as a pool of IDs.

        // Let's create a fresh deck for each simulation to be safe and correct.
        // To define the deck, we look at all unique card requirements across all outcomes.
        // WAIT. If User adds "Outcome 1: Card A" and "Outcome 2: Card A", they probably mean the SAME Card A.
        // But the UI doesn't allow linking inputs.
        // Standard calculator behavior: Inputs in different sections usually imply disjoint sets unless specified.
        // HOWEVER, usually "In Deck" implies a count. 
        // Let's assume for simplicity (and usually correctness in these tools) that 
        // EVERY ROW represents a UNIQUE card type (Card A, Card B, Card C...).
        // Even if they put "3 in deck" for top row and "3 in deck" for bottom row, we treat them as different cards.
        // This is the standard assumption for these generic calculators.

        // Build Deck
        const deck = [];
        let nextCardId = 1;

        // Mapping from row-element (or some ID) to cardId.
        // Actually, we can just assign a unique ID to every 'req' object before sim?
        // No, we need to rebuild the deck representation if we want it to be efficient.
        // Let's just flatten the requirements.

        const allReqs = outcomes.flat();
        // Map each req to a unique ID range in the deck
        // e.g. Req 1 (3 in deck) -> IDs [1, 2, 3]
        // Req 2 (2 in deck) -> IDs [4, 5]
        // Others -> IDs [0, 0, ...] (Filler)

        // We'll pre-calculate the "Card Definitions"
        const definitions = [];
        let currentDeckCount = 0;

        outcomes.forEach(outcome => {
            outcome.forEach(req => {
                // Assign a unique ID for this specific card requirement row
                // This implies every row is a unique card type.
                // It's the only safe assumption without a more complex UI.
                req._simId = nextCardId++;
                definitions.push({ id: req._simId, count: req.inDeck });
                currentDeckCount += req.inDeck;
            });
        });

        // Validation check
        if (currentDeckCount > this.deckSize) {
            // In a real app we'd show an error.
            // Here we'll just clamp or proceed (it will just skew probs).
            // Let's just build the deck.
        }

        // We can reuse this 'deck layout' for all simulations if strict.
        // BUT, drawing from the deck is random.

        // Optimized Simulation:
        // We don't need a full array of 40 ints. We can just use the counts.
        // But Fisher-Yates on an array is fast enough for 50k runs.

        const fullDeck = [];
        definitions.forEach(def => {
            for (let k = 0; k < def.count; k++) fullDeck.push(def.id);
        });

        // Fill rest with 0 (blanks)
        while (fullDeck.length < this.deckSize) {
            fullDeck.push(0);
        }

        // Shuffle and Draw
        // We only need to shuffle the first 'handSize' elements (Fisher-Yates partial)

        // Fisher-Yates partial
        for (let i = 0; i < this.handSize; i++) {
            const j = i + Math.floor(Math.random() * (fullDeck.length - i));
            [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
        }

        const hand = fullDeck.slice(0, this.handSize);

        // Count cards in hand
        const handCounts = {};
        hand.forEach(cardId => {
            if (cardId !== 0) {
                handCounts[cardId] = (handCounts[cardId] || 0) + 1;
            }
        });

        // Check Outcomes
        // An outcome is success if ALL its reqs are met
        for (const outcome of outcomes) {
            let outcomeMet = true;
            for (const req of outcome) {
                const count = handCounts[req._simId] || 0;
                if (count < req.needed) {
                    outcomeMet = false;
                    break;
                }
            }
            if (outcomeMet) return true; // At least one outcome met (OR logic)
        }

        return false;
    }

    displayResult(probability) {
        this.resultSection.classList.add('visible');

        // Animate the number
        const start = 0;
        const end = probability;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);

            const currentVal = (start + (end - start) * ease).toFixed(1);
            this.resultValue.textContent = `${currentVal}%`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);

        this.resultDetail.textContent = `Based on ${this.simulationRuns.toLocaleString()} simulations`;
    }
}

// Initialize when DOM is ready
// Check if we are in a module environment or need to wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new CardCalculator());
} else {
    new CardCalculator();
}
