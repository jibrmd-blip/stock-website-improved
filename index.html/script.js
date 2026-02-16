document.addEventListener("DOMContentLoaded", () => {
  const API_KEY = "IV50W0WMXPIW3V2R"; // Your new Alpha Vantage key
  const trackBtn = document.getElementById("trackBtn");
  const symbolInput = document.getElementById("symbol");
  const trackedList = document.getElementById("trackedList");
  const chartsContainer = document.getElementById("chartsContainer");

  let trackedStocks = [];

  // Add stock
  trackBtn.addEventListener("click", () => {
    const symbol = symbolInput.value.trim().toUpperCase();
    if (!symbol) return;
    if (trackedStocks.includes(symbol)) return alert("Already tracking!");
    if (trackedStocks.length >= 5) return alert("Max 5 stocks");

    trackedStocks.push(symbol);
    symbolInput.value = "";
    updateTrackedList();
    createStockCard(symbol);
    fetchStockPrice(symbol);
  });

  function updateTrackedList() {
    trackedList.innerHTML = "";
    trackedStocks.forEach(sym => {
      const li = document.createElement("li");
      li.textContent = sym;
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "❌";
      removeBtn.onclick = () => removeStock(sym);
      li.appendChild(removeBtn);
      trackedList.appendChild(li);
    });
  }

  function removeStock(symbol) {
    trackedStocks = trackedStocks.filter(s => s !== symbol);
    updateTrackedList();
    const card = document.getElementById(`card-${symbol}`);
    if (card) card.remove();
  }

  function createStockCard(symbol) {
    const card = document.createElement("div");
    card.classList.add("chart-card");
    card.id = `card-${symbol}`;
    card.innerHTML = `
      <div class="chart-header">
        <h3>${symbol}</h3>
        <span id="price-${symbol}" class="current-price">Loading…</span>
      </div>
    `;
    chartsContainer.appendChild(card);
  }

  // Fetch current stock price from Alpha Vantage
  async function fetchStockPrice(symbol) {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      const quote = data["Global Quote"];
      if (!quote || !quote["05. price"]) throw new Error("No data");

      const price = parseFloat(quote["05. price"]);
      const priceElem = document.getElementById(`price-${symbol}`);
      priceElem.textContent = `$${price.toFixed(2)}`;
    } catch (err) {
      console.error("Error fetching price for", symbol, err);
      const priceElem = document.getElementById(`price-${symbol}`);
      if (priceElem) priceElem.textContent = "Error";
    }
  }

  // Auto-refresh every 60 seconds
  setInterval(() => {
    trackedStocks.forEach(symbol => fetchStockPrice(symbol));
  }, 60000);
});

