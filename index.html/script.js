document.addEventListener("DOMContentLoaded", () => {
  const FINNHUB_API_KEY = "d69m7k1r01qhe6mo0p7gd69m7k1r01qhe6mo0p80";
  const trackBtn = document.getElementById("trackBtn");
  const symbolInput = document.getElementById("symbol");
  const trackedList = document.getElementById("trackedList");
  const chartsContainer = document.getElementById("chartsContainer");

  let trackedStocks = [];
  let chartObjects = {};

  trackBtn.addEventListener("click", () => {
    const symbol = symbolInput.value.trim().toUpperCase();
    if (!symbol) return;
    if (trackedStocks.includes(symbol)) return alert("Already tracking!");
    if (trackedStocks.length >= 5) return alert("Max 5 stocks");

    trackedStocks.push(symbol);
    symbolInput.value = "";
    updateTrackedList();
    createChartCard(symbol);
    fetchFinnhubData(symbol);
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
    delete chartObjects[symbol];
    updateTrackedList();
    chartsContainer.innerHTML = "";
    trackedStocks.forEach(sym => createChartCard(sym));
  }

  function createChartCard(symbol) {
    const card = document.createElement("div");
    card.classList.add("chart-card");
    card.innerHTML = `
      <div class="chart-header">
        <h3>${symbol}</h3>
        <span id="price-${symbol}" class="current-price">Loading…</span>
      </div>
      <div id="chart-${symbol}" style="height: 300px;"></div>
    `;
    chartsContainer.appendChild(card);
  }

  async function fetchFinnhubData(symbol) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const from = now - 60 * 60 * 24 * 7; // last 7 days
      const candlesURL = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=15&from=${from}&to=${now}&token=${FINNHUB_API_KEY}`;
      const candleResp = await fetch(candlesURL);
      const candleData = await candleResp.json();

      if (!candleData || candleData.s !== "ok") throw new Error("No data returned");

      const candleArray = candleData.t.map((time, i) => ({
        time: time,
        open: candleData.o[i],
        high: candleData.h[i],
        low: candleData.l[i],
        close: candleData.c[i]
      }));

      // Current price
      const quoteURL = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
      const quoteResp = await fetch(quoteURL);
      const quoteData = await quoteResp.json();
      const currentPrice = quoteData.c;
      const priceElem = document.getElementById(`price-${symbol}`);
      priceElem.textContent = `$${currentPrice.toFixed(2)}`;

      // Chart
      if (!chartObjects[symbol]) {
        const chartDiv = document.getElementById(`chart-${symbol}`);
        const chart = LightweightCharts.createChart(chartDiv, {
          layout: { backgroundColor: "#1e293b", textColor: "#e5e7eb" },
          grid: { vertLines: { color: "#2b2f3a" }, horzLines: { color: "#2b2f3a" } }
        });

        const candleSeries = chart.addCandlestickSeries({
          upColor: "#22c55e",
          borderUpColor: "#22c55e",
          wickUpColor: "#22c55e",
          downColor: "#ef4444",
          borderDownColor: "#ef4444",
          wickDownColor: "#ef4444"
        });

        candleSeries.setData(candleArray);
        chartObjects[symbol] = { candleSeries };
      } else {
        chartObjects[symbol].candleSeries.setData(candleArray);
      }
    } catch (err) {
      console.error("Error loading data for", symbol, err);
      const priceElem = document.getElementById(`price-${symbol}`);
      if (priceElem) priceElem.textContent = "Error";
    }
  }

  // Auto refresh every 60s
  setInterval(() => {
    trackedStocks.forEach(symbol => fetchFinnhubData(symbol));
  }, 60000);
});
