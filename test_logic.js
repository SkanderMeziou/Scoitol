
// Logic from calculator.js, adapted for Node.js test

function simulate(deckSize, handSize, outcomes, runs = 50000) {
    let successCount = 0;

    // Pre-calculate definitions
    const definitions = [];
    let nextCardId = 1;

    outcomes.forEach(outcome => {
        outcome.forEach(req => {
            req._simId = nextCardId++;
            definitions.push({ id: req._simId, count: req.inDeck });
        });
    });

    for (let r = 0; r < runs; r++) {
        // Build Deck
        const fullDeck = [];
        definitions.forEach(def => {
            for (let k = 0; k < def.count; k++) fullDeck.push(def.id);
        });

        // Fill rest with 0 (blanks)
        while (fullDeck.length < deckSize) {
            fullDeck.push(0);
        }

        // Fisher-Yates partial
        for (let i = 0; i < handSize; i++) {
            const j = i + Math.floor(Math.random() * (fullDeck.length - i));
            [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
        }

        const hand = fullDeck.slice(0, handSize);

        // Count cards in hand
        const handCounts = {};
        hand.forEach(cardId => {
            if (cardId !== 0) {
                handCounts[cardId] = (handCounts[cardId] || 0) + 1;
            }
        });

        // Check Outcomes
        let anyOutcomeMet = false;
        for (const outcome of outcomes) {
            let outcomeMet = true;
            for (const req of outcome) {
                const count = handCounts[req._simId] || 0;
                if (count < req.needed) {
                    outcomeMet = false;
                    break;
                }
            }
            if (outcomeMet) {
                anyOutcomeMet = true;
                break;
            }
        }

        if (anyOutcomeMet) successCount++;
    }

    return (successCount / runs);
}

// Tests
console.log("Running Tests...");

// Test 1: Simple Draw
// Deck 10, Hand 2, Want 1 of 'Target' (5 in deck).
// Prob = 1 - (5C2 / 10C2) = 1 - (10/45) = 35/45 = 7/9 ≈ 0.777...
const test1 = simulate(10, 2, [[{ needed: 1, inDeck: 5 }]]);
console.log(`Test 1 (Expected ~0.777): ${test1.toFixed(4)}`);

// Test 2: Two distinct cards
// Deck 10, Hand 2. Outcome: A(1) AND B(1). A=1 in deck, B=1 in deck.
// Prob = (1C1 * 1C1 * 8C0) / 10C2 = 1 / 45 ≈ 0.0222...
const test2 = simulate(10, 2, [[{ needed: 1, inDeck: 1 }, { needed: 1, inDeck: 1 }]]);
console.log(`Test 2 (Expected ~0.022): ${test2.toFixed(4)}`);

// Test 3: OR Condition
// Deck 10, Hand 1. Outcome A(1, 1 in deck) OR Outcome B(1, 1 in deck).
// Prob = 2/10 = 0.2
const test3 = simulate(10, 1, [
    [{ needed: 1, inDeck: 1 }],
    [{ needed: 1, inDeck: 1 }]
]);
console.log(`Test 3 (Expected ~0.200): ${test3.toFixed(4)}`);

