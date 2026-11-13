export default async function handler(req, res) {
  const backendOrigin = (process.env.BACKEND_ORIGIN_URL || 'https://api-sgsk-wealth.vercel.app').replace(/\/+$/, '');
  const apiKey = process.env.BACKEND_API_KEY || '';

  // Extract path and query params from rewrite: /api/backend/:path* -> /api/proxy?__path=:path*
  const { __path = '', ...queryParams } = req.query;
  const subPath = Array.isArray(__path) ? __path.join('/') : __path;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, v));
    } else if (value !== undefined) {
      searchParams.append(key, value);
    }
  }
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const targetUrl = `${backendOrigin}/${subPath}${queryString}`;

  const forwardHeaders = {
    'X-API-Key': apiKey,
    'X-App-Source': 'SGSK-Wealth',
    'X-Requested-With': 'SGSK-Wealth-Client',
    'X-Forwarded-Host': req.headers['host'] || 'sgsk-wealth.vercel.app',
    'Accept': req.headers['accept'] || 'application/json',
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
    const cacheControl = upstreamResponse.headers.get('cache-control');

    res.status(upstreamResponse.status);
    if (cacheControl) {
      res.setHeader('Cache-Control', cacheControl);
    }

    if (upstreamResponse.status === 204 || upstreamResponse.status === 304) {
      return res.end();
    }

    if (contentType.includes('application/json')) {
      const data = await upstreamResponse.json();
      return res.json(data);
    }

    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    const buffer = Buffer.from(await upstreamResponse.arrayBuffer());
    return res.send(buffer);
  } catch (error) {
    return res.status(502).json({
      detail: 'Bad Gateway: Proxy failed to reach backend origin',
      error: error && error.message ? error.message : String(error),
    });
  }
}
