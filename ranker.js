export class Ranker {
  constructor() {
    this.items = [];
    this.comparisons = 0;
    this.estimatedComparisons = 0;
    
    // UI Elements
    this.modal = document.getElementById('ranker-modal');
    this.setupView = document.getElementById('ranker-setup');
    this.voteView = document.getElementById('ranker-vote');
    this.resultView = document.getElementById('ranker-result');
    this.inputArea = document.getElementById('ranker-input');
    this.optionA = document.getElementById('option-a');
    this.optionB = document.getElementById('option-b');
    this.progress = document.getElementById('ranker-progress');
    this.rankingList = document.getElementById('ranking-list');
    
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('ranker-card').addEventListener('click', () => this.open());
    document.querySelector('.close-modal').addEventListener('click', () => this.close());
    window.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    document.getElementById('start-ranking-btn').addEventListener('click', () => this.startRanking());
    document.getElementById('copy-ranking-btn').addEventListener('click', () => this.copyToClipboard());
    document.getElementById('reset-ranking-btn').addEventListener('click', () => this.reset());
  }

  open() {
    this.modal.classList.remove('hidden');
    this.reset();
  }

  close() {
    this.modal.classList.add('hidden');
  }

  reset() {
    this.setupView.classList.remove('hidden');
    this.voteView.classList.add('hidden');
    this.resultView.classList.add('hidden');
    this.inputArea.value = '';
    this.items = [];
    this.comparisons = 0;
  }

  async startRanking() {
    const text = this.inputArea.value.trim();
    if (!text) return;

    this.items = text.split('\n').map(line => line.trim()).filter(line => line);
    if (this.items.length < 2) {
      alert("Please enter at least 2 items to rank.");
      return;
    }

    this.setupView.classList.add('hidden');
    this.voteView.classList.remove('hidden');

    // N log N approximation
    this.estimatedComparisons = Math.floor(this.items.length * Math.log2(this.items.length));
    this.comparisons = 0;
    this.updateProgress();

    // Start sorting
    try {
      // Create a copy to sort so we don't mutate state unexpectedly if cancelled,
      // though here we are mutating this.items in place.
      await this.quicksort(this.items, 0, this.items.length - 1);
      this.showResults();
    } catch (e) {
      console.log("Ranking cancelled or error:", e);
    }
  }

  async quicksort(arr, low, high) {
    if (low < high) {
      const pi = await this.partition(arr, low, high);
      await this.quicksort(arr, low, pi - 1);
      await this.quicksort(arr, pi + 1, high);
    }
  }

  async partition(arr, low, high) {
    const pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      // Ask user: Is arr[j] > pivot? (or better/preferred?)
      // We want to sort from Best (index 0) to Worst, or vice versa?
      // Usually "Ranker" implies 1st is best.
      // So if User picks A over B, A should come before B.
      // If we want Descending order (Best -> Worst), then if A > B, A swaps to front.
      // Standard partition puts smaller elements to left. 
      // Let's assume we want Best first.
      // So "Less than" means "Worse than". "Greater than" means "Better than".
      // If User picks Button A (arr[j]) as better than Button B (pivot), then arr[j] > pivot.
      
      const isBetter = await this.askUser(arr[j], pivot);
      
      // If arr[j] is Better than pivot, we swap it to the "left" (beginning of array)
      // Wait, standard partition with `arr[j] < pivot` puts smaller items to left.
      // We want Best items at index 0. So we want "Better" items to left.
      // So if isBetter is true, we treat it as "less than" in sorting logic context of "0 is smallest index".
      // Let's stick thereto: "Better" -> Move to front (lower index).
      
      if (isBetter) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    return i + 1;
  }

  askUser(itemA, itemB) {
    return new Promise((resolve) => {
      this.optionA.textContent = itemA;
      this.optionB.textContent = itemB;
      
      // Remove old listeners to avoid duplicates
      // A cleaner way is using `once: true`
      
      const handleA = () => {
        cleanup();
        resolve(true); // A is better
      };

      const handleB = () => {
        cleanup();
        resolve(false); // B is better (or A is worse)
      };

      const cleanup = () => {
        this.optionA.removeEventListener('click', handleA);
        this.optionB.removeEventListener('click', handleB);
      };

      this.optionA.addEventListener('click', handleA, { once: true });
      this.optionB.addEventListener('click', handleB, { once: true });
      
      this.comparisons++;
      this.updateProgress();
    });
  }

  updateProgress() {
    const progress = Math.min((this.comparisons / this.estimatedComparisons) * 100, 100);
    this.progress.style.width = `${progress}%`;
    document.getElementById('question-count').textContent = `Comparison #${this.comparisons + 1}`;
  }

  showResults() {
    this.voteView.classList.add('hidden');
    this.resultView.classList.remove('hidden');
    
    // Generate Markdown List
    // We sorted so that "Better" items are at lower indices (0, 1, 2...)
    let html = '<ol>';
    let markdown = '';
    this.items.forEach((item, index) => {
      html += `<li>${item}</li>`;
      markdown += `${index + 1}. ${item}\n`;
    });
    html += '</ol>';
    
    this.rankingList.innerHTML = html;
    this.rankingList.dataset.markdown = markdown;
  }

  copyToClipboard() {
    const markdown = this.rankingList.dataset.markdown;
    navigator.clipboard.writeText(markdown).then(() => {
      const btn = document.getElementById('copy-ranking-btn');
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = originalText, 2000);
    });
  }
}

// Initialize
new Ranker();
