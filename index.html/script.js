document.addEventListener("DOMContentLoaded", () => {
  const POLYGON_API_KEY = "KJgcLne4dvI_wNG_UU2Tn0LsuyaJbJLo"; // Your Polygon key
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
    fetchPolygonData(symbol);
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

  async function fetchPolygonData(symbol) {
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // last 7 days
      const fromStr = from.toISOString().split("T")[0];
      const toStr = now.toISOString().split("T")[0];

      const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/15/minute/${fromStr}/${toStr}?adjusted=true&sort=asc&apiKey=${POLYGON_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data.results) throw new Error("No candle data returned");

      const candles = data.results.map(c => ({
        time: Math.floor(c.t / 1000),
        open: c.o,
        high: c.h,
        low: c.l,
        close: c.c
      }));

      // Update current price (latest candle close)
      const currentPrice = candles[candles.length - 1].close;
      const priceElem = document.getElementById(`price-${symbol}`);
      priceElem.textContent = `$${currentPrice.toFixed(2)}`;

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

        candleSeries.setData(candles);
        chartObjects[symbol] = { candleSeries };
      } else {
        chartObjects[symbol].candleSeries.setData(candles);
      }
    } catch (err) {
      console.error("Error fetching data for", symbol, err);
      const priceElem = document.getElementById(`price-${symbol}`);
      if (priceElem) priceElem.textContent = "Error";
    }
  }

  // Auto-refresh every 60 seconds
  setInterval(() => {
    trackedStocks.forEach(symbol => fetchPolygonData(symbol));
  }, 60000);
});
