import http from 'http';
import pactum from 'pactum';

let configured = false;
let mockServerStarted = false;

async function isBackendAlive(port = 8000): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/backend/share-lot/sheets`, (res) => {
      resolve(res.statusCode !== undefined);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function registerMockInteractions() {
  const mock = pactum.mock;

  // 1. Auth failure: unauthorized / invalid API key
  mock.addInteraction({
    strict: false,
    request: {
      method: 'GET',
      path: '/api/backend/share-lot/sheets',
      headers: {
        'x-api-key': '',
      },
    },
    response: {
      status: 401,
      body: { detail: 'Invalid or missing API Key' },
    },
  });

  mock.addInteraction({
    strict: false,
    request: {
      method: 'GET',
      path: '/api/backend/price/exchange-rate',
      headers: {
        'x-api-key': 'invalid-key-xyz',
      },
    },
    response: {
      status: 401,
      body: { detail: 'Invalid or missing API Key' },
    },
  });

  // 2. Price exchange rate (valid key)
  mock.addInteraction({
    strict: false,
    request: {
      method: 'GET',
      path: '/api/backend/price/exchange-rate',
      headers: {
        'x-api-key': 'dev_secret_key_change_in_prod',
      },
    },
    response: {
      status: 200,
      body: { rate: 35.5 },
    },
  });

  // 3. Batch prices
  mock.addInteraction({
    strict: false,
    request: {
      method: 'POST',
      path: '/api/backend/price/fetch-prices',
    },
    response: {
      status: 200,
      body: {
        prices: {
          AAPL: { price: 224.5, currency: 'USD' },
          'PTT.BK': { price: 34.0, currency: 'THB' },
        },
      },
    },
  });

  // 4. Portfolio holdings
  mock.addInteraction({
    strict: false,
    request: {
      method: 'GET',
      path: '/api/backend/portfolio/holdings',
    },
    response: {
      status: 200,
      body: { holdings: [], summaries: [] },
    },
  });

  // 5. Portfolio performance
  mock.addInteraction({
    strict: false,
    request: {
      method: 'GET',
      path: '/api/backend/portfolio/performance',
    },
    response: {
      status: 200,
      body: { metrics: {}, timeframes: {} },
    },
  });

  // 6. Portfolio dividend
  mock.addInteraction({
    strict: false,
    request: {
      method: 'GET',
      path: '/api/backend/portfolio/dividend',
    },
    response: {
      status: 200,
      body: { dividends: [], yieldOnCost: 4.2 },
    },
  });

  // 7. Tools TVM
  mock.addInteraction({
    strict: false,
    request: {
      method: 'POST',
      path: '/api/backend/portfolio/tools/tvm',
    },
    response: {
      status: 200,
      body: {
        mode: 'FV',
        future_value: 200000,
        total_contributions: 160000,
        total_interest: 40000,
      },
    },
  });

  // 8. Tools simulate
  mock.addInteraction({
    strict: false,
    request: {
      method: 'POST',
      path: '/api/backend/portfolio/tools/simulate',
    },
    response: {
      status: 200,
      body: {
        new_shares: 15,
        new_avg_cost: 160.0,
      },
    },
  });
}

export async function setupPactum() {
  if (configured) return;
  let targetUrl = 'http://127.0.0.1:8000/api/backend';
  const backendRunning = await isBackendAlive(8000);

  if (!backendRunning) {
    try {
      await pactum.mock.start(8000);
      mockServerStarted = true;
      registerMockInteractions();
    } catch {
      // In case port 8000 is in use, start on 8001
      await pactum.mock.start(8001);
      mockServerStarted = true;
      registerMockInteractions();
      targetUrl = 'http://127.0.0.1:8001/api/backend';
    }
  }

  pactum.request.setBaseUrl(targetUrl);
  pactum.request.setDefaultHeaders({
    'X-API-Key': 'dev_secret_key_change_in_prod',
    'Content-Type': 'application/json',
  });
  pactum.request.setDefaultTimeout(8000);
  configured = true;
}

export async function teardownPactum() {
  if (mockServerStarted) {
    await pactum.mock.stop();
    mockServerStarted = false;
  }
}
