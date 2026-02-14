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
        this.addOutcome(); 
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
        this.addCardRow(id);
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
        const deck = [];
        let nextCardId = 1;


        const allReqs = outcomes.flat();
        const definitions = [];
        let currentDeckCount = 0;

        outcomes.forEach(outcome => {
            outcome.forEach(req => {
                req._simId = nextCardId++;
                definitions.push({ id: req._simId, count: req.inDeck });
                currentDeckCount += req.inDeck;
            });
        });

        // Validation check
        if (currentDeckCount > this.deckSize) {
        }


        const fullDeck = [];
        definitions.forEach(def => {
            for (let k = 0; k < def.count; k++) fullDeck.push(def.id);
        });

        // Fill rest with 0 (blanks)
        while (fullDeck.length < this.deckSize) {
            fullDeck.push(0);
        }

        for (let i = 0; i < this.handSize; i++) {
            const j = i + Math.floor(Math.random() * (fullDeck.length - i));
            [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
        }

        const hand = fullDeck.slice(0, this.handSize);

        const handCounts = {};
        hand.forEach(cardId => {
            if (cardId !== 0) {
                handCounts[cardId] = (handCounts[cardId] || 0) + 1;
            }
        });

        for (const outcome of outcomes) {
            let outcomeMet = true;
            for (const req of outcome) {
                const count = handCounts[req._simId] || 0;
                if (count < req.needed) {
                    outcomeMet = false;
                    break;
                }
            }
            if (outcomeMet) return true; 
        }

        return false;
    }

    displayResult(probability) {
        this.resultSection.classList.add('visible');

      
        const start = 0;
        const end = probability;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

          
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new CardCalculator());
} else {
    new CardCalculator();
}
