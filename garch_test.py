import numpy as np
import json

# Generate random returns
returns = [round(x * 0.01, 4) for x in np.random.randn(100)]

# Define the JSON structure
data = {
    "returns": returns,
    "forecast_horizon": 30
}

# Print JSON output
print(json.dumps(data, indent=2))