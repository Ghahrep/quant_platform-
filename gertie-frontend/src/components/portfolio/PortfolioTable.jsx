// Temporary debug component - replace your current PortfolioTable temporarily
import React from "react";

const PortfolioDebugTable = ({ portfolio, loading = false, error = null }) => {
  console.log("=== PORTFOLIO DEBUG ===");
  console.log("Type of portfolio:", typeof portfolio);
  console.log("Portfolio value:", portfolio);
  console.log("Is array?", Array.isArray(portfolio));
  console.log("Portfolio keys:", portfolio ? Object.keys(portfolio) : "N/A");

  if (portfolio?.positions) {
    console.log("Positions found:", portfolio.positions);
    console.log("Positions type:", typeof portfolio.positions);
    console.log("Positions is array?", Array.isArray(portfolio.positions));
    console.log("Positions length:", portfolio.positions?.length);
  }

  // Show raw data for debugging
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#1a1a1a",
        color: "white",
        fontFamily: "monospace",
      }}
    >
      <h3>Portfolio Debug Information</h3>

      <div style={{ marginBottom: "20px" }}>
        <h4>Props Received:</h4>
        <p>
          <strong>Loading:</strong> {loading?.toString()}
        </p>
        <p>
          <strong>Error:</strong> {error?.toString() || "None"}
        </p>
        <p>
          <strong>Portfolio Type:</strong> {typeof portfolio}
        </p>
        <p>
          <strong>Is Array:</strong> {Array.isArray(portfolio)?.toString()}
        </p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h4>Portfolio Data Structure:</h4>
        <pre
          style={{
            backgroundColor: "#2a2a2a",
            padding: "10px",
            borderRadius: "5px",
            fontSize: "12px",
            maxHeight: "300px",
            overflow: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {portfolio ? JSON.stringify(portfolio, null, 2) : "No portfolio data"}
        </pre>
      </div>

      {portfolio?.positions && (
        <div style={{ marginBottom: "20px" }}>
          <h4>Positions Analysis:</h4>
          <p>
            <strong>Positions Type:</strong> {typeof portfolio.positions}
          </p>
          <p>
            <strong>Positions Is Array:</strong>{" "}
            {Array.isArray(portfolio.positions)?.toString()}
          </p>
          <p>
            <strong>Positions Length:</strong>{" "}
            {portfolio.positions?.length || "No length property"}
          </p>

          {Array.isArray(portfolio.positions) &&
            portfolio.positions.length > 0 && (
              <div>
                <h5>First Position:</h5>
                <pre
                  style={{
                    backgroundColor: "#2a2a2a",
                    padding: "10px",
                    borderRadius: "5px",
                    fontSize: "12px",
                  }}
                >
                  {JSON.stringify(portfolio.positions[0], null, 2)}
                </pre>
              </div>
            )}
        </div>
      )}

      {portfolio?.summary && (
        <div style={{ marginBottom: "20px" }}>
          <h4>Summary Information:</h4>
          <pre
            style={{
              backgroundColor: "#2a2a2a",
              padding: "10px",
              borderRadius: "5px",
              fontSize: "12px",
            }}
          >
            {JSON.stringify(portfolio.summary, null, 2)}
          </pre>
        </div>
      )}

      <div
        style={{
          backgroundColor: "#333",
          padding: "15px",
          borderRadius: "5px",
        }}
      >
        <h4>Quick Test:</h4>
        <p>
          Can we safely access positions length?
          <strong
            style={{
              color: portfolio?.positions?.length ? "#4CAF50" : "#f44336",
            }}
          >
            {portfolio?.positions?.length
              ? `YES (${portfolio.positions.length})`
              : "NO"}
          </strong>
        </p>

        {portfolio?.positions?.length > 0 && (
          <div>
            <h5>Sample Portfolio Table:</h5>
            <table
              style={{
                width: "100%",
                border: "1px solid #555",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#444" }}>
                  <th style={{ border: "1px solid #555", padding: "8px" }}>
                    Symbol
                  </th>
                  <th style={{ border: "1px solid #555", padding: "8px" }}>
                    Quantity
                  </th>
                  <th style={{ border: "1px solid #555", padding: "8px" }}>
                    Unit Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.slice(0, 3).map((pos, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #555", padding: "8px" }}>
                      {pos.symbol || "N/A"}
                    </td>
                    <td style={{ border: "1px solid #555", padding: "8px" }}>
                      {pos.quantity || "N/A"}
                    </td>
                    <td style={{ border: "1px solid #555", padding: "8px" }}>
                      {pos.unit_cost || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#0066cc",
          borderRadius: "5px",
        }}
      >
        <strong>Next Step:</strong> Once we see the exact data structure above,
        we can fix the PortfolioTable component to handle it properly.
      </div>
    </div>
  );
};

export default PortfolioDebugTable;
