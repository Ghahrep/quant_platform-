import React from 'react';

const Simulator: React.FC = () => {
  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-4">fBm Simulator</h1>
      <p className="text-gray-300 mb-6">Fractional Brownian Motion simulation and modeling</p>
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Simulation Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
          <div>
            <p><strong>Hurst Exponent:</strong> 0.5 (Random Walk)</p>
            <p><strong>Time Horizon:</strong> 252 days</p>
          </div>
          <div>
            <p><strong>Number of Paths:</strong> 1000</p>
            <p><strong>Initial Price:</strong> $100</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;