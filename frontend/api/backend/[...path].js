export default async function handler(req, res) {
  const backendBaseUrl = (process.env.BACKEND_ORIGIN_URL || 'https://api-sgsk-wealth.vercel.app').replace(/\/+$/, '');
  const apiKey = process.env.BACKEND_API_KEY || 'dev_secret_key_change_in_prod';

  // Extract path parameters
  const { path = [] } = req.query;
  const subPath = Array.isArray(path) ? path.join('/') : path;

  // Reconstruct query parameters excluding the catch-all 'path' key
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'path') {
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, v));
      } else if (value !== undefined) {
        queryParams.append(key, value);
      }
    }
  }
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const targetUrl = `${backendBaseUrl}/${subPath}${queryString}`;

  const forwardHeaders = {
    'X-API-Key': apiKey,
    'X-App-Source': 'SGSK-Wealth',
    'X-Requested-With': 'SGSK-Wealth-Client',
    'X-Forwarded-Host': req.headers.host || 'sgsk-wealth.vercel.app',
    'Accept': req.headers.accept || 'application/json',
  };

  if (req.headers['content-type']) {
    forwardHeaders['Content-Type'] = req.headers['content-type'];
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: forwardHeaders,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const upstreamResponse = await fetch(targetUrl, fetchOptions);
    const contentType = upstreamResponse.headers.get('content-type') || '';

    res.status(upstreamResponse.status);
    if (contentType.includes('application/json')) {
      const data = await upstreamResponse.json();
      return res.json(data);
    } else {
      const text = await upstreamResponse.text();
      res.setHeader('content-type', contentType);
      return res.send(text);
    }
  } catch (error) {
    return res.status(502).json({
      detail: 'Bad Gateway: Failed to proxy request to backend origin',
      error: error && error.message ? error.message : String(error),
    });
  }
}
