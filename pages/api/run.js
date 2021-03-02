
const handler = async (req, res) => {
  const {
    method,
    body
  } = req;
  if (method !== 'POST') {
    res.status(405).json({ error: `${method} not supported`});
    return
  }
  if (!body.url) {
    res.status(400).json({ error: 'Url is missing'});
    return
  }
  try {
    const targetUrl = new URL(body.url);
    const url = new URL(process.env.PAGESPEED_API_URL)
    url.searchParams.set('key', process.env.API_KEY);
    url.searchParams.set('url', targetUrl.toString());
    url.searchParams.set('strategy', 'MOBILE');
    url.searchParams.set('category', 'PERFORMANCE')
    const response = await fetch(url.toString());
    const json = await response.json();
    const lighthouse = json.lighthouseResult;
    const lighthouseMetrics = {
      FCP: lighthouse.audits['first-contentful-paint'].numericValue,
      SI:  lighthouse.audits['speed-index'].numericValue,
      TTI: lighthouse.audits['interactive'].numericValue,
      LCP: lighthouse.audits['largest-contentful-paint'].numericValue,
      CLS: lighthouse.audits['cumulative-layout-shift'].numericValue,
      TBT: lighthouse.audits['total-blocking-time'].numericValue,
      SCORE: lighthouse.categories.performance.score*100
    };
    res.status(200).json(lighthouseMetrics);
  } catch (error) {
    res.status(500).json({ error: JSON.parse(JSON.stringify(error)) });
  }
}

export default handler;
