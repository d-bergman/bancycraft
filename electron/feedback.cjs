const config = require('./feedback-config.json');
function endpoint(value) {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'formspree.io' || !/^\/f\/[a-zA-Z0-9]+$/.test(url.pathname) || url.username || url.password || url.port || url.search || url.hash) throw Error('Invalid feedback delivery endpoint.');
  return url.href;
}
function validate(value, version) {
  if (!value || !['Bug report', 'Suggestion'].includes(value.kind)) throw Error('Choose a report type.');
  for (const [key, max] of [['subject', 120], ['message', 6000], ['email', 254], ['game', 60]]) {
    if (typeof value[key] !== 'string' || value[key].length > max) throw Error('Invalid ' + key + '.');
  }
  if (value.subject.trim().length < 3 || value.message.trim().length < 10) throw Error('Add a subject and at least 10 characters of detail.');
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) throw Error('Enter a valid reply email.');
  return { _subject: `[BancyCraft ${value.kind}] ${value.subject.trim()}`, message: value.message.trim(), email: value.email.trim(), game: value.game, appVersion: version, reportType: value.kind };
}
function createFeedback(version, fetcher = fetch, settings = config) {
  let sending = false, lastSent = 0;
  return {
    status: () => ({ configured: !!endpoint(settings.endpoint), recipient: 'bancywaypoint@gmail.com' }),
    async send(value) {
      const body = validate(value, version), url = endpoint(settings.endpoint);
      if (!url) throw Error('Report delivery is not configured yet. Your draft has been kept.');
      if (sending || Date.now() - lastSent < 30000) throw Error('Please wait before sending another report.');
      sending = true;
      try {
        const response = await fetcher(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body), redirect: 'error', signal: AbortSignal.timeout(20000) });
        const result = await response.json();
        if (!response.ok || result.ok !== true) throw Error('Delivery service did not accept the report. Please try again later.');
        lastSent = Date.now(); return { accepted: true };
      } catch (e) { throw Error(e.name === 'TimeoutError' ? 'Delivery timed out; acceptance could not be confirmed. Your draft has been kept.' : e.message); }
      finally { sending = false; }
    }
  };
}
module.exports = { createFeedback, validate, endpoint };
