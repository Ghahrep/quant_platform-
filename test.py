import numpy as np
import json

returns = [round(x * 0.01, 4) for x in np.random.randn(101)]

payload = {
    "portfolio_returns": returns,
    "confidence_level": 0.95
}

print(json.dumps(payload, indent=2))