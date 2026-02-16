const API_KEY = "YOUR_API_KEY_HERE";

function getStock() {
  const symbol = document.getElementById("symbol").value.toUpperCase();
  const result = document.getElementById("result");

  if (!symbol) {
    result.textContent = "Enter a stock symbol.";
    return;
  }

  fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      const stock = data["Global Quote"];
      if (!stock) {
        result.textContent = "Stock not found.";
        return;
      }

      result.innerHTML = `
        <h3>${symbol}</h3>
        <p>💲 Price: ${stock["05. price"]}</p>
        <p>📈 Change: ${stock["09. change"]}</p>
        <p>📊 % Change: ${stock["10. change percent"]}</p>
      `;
    })
    .catch(() => {
      result.textContent = "Error fetching data.";
    });
}
