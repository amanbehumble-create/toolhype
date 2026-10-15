// Resubmit all URLs from the live sitemap to IndexNow (Bing, Yandex, etc.). Usage: node scripts/indexnow.mjs
const HOST = 'toolhype.dev';
const KEY = '7c2824b792163d3239080ca91f147428';
const getLocs = async (u) => [...(await (await fetch(u)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
let urls = [], queue = ['https://' + HOST + '/sitemap.xml'];
while (queue.length) {
  const u = queue.shift();
  for (const loc of await getLocs(u)) (loc.endsWith('.xml') ? queue : urls).push(loc);
}
urls = [...new Set(urls)];
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: 'https://' + HOST + '/' + KEY + '.txt', urlList: urls }),
});
console.log('IndexNow HTTP', res.status, '| URLs submitted:', urls.length, await res.text());
