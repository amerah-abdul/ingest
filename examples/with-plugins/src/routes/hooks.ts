import type { Config } from '../config';
import { Exception } from '@stackpress/ingest';
import { router } from '@stackpress/ingest/http';
import Error from '../error';

const route = router<Config>();

/**
 * Error handlers
 */
route.get('/catch', function ErrorResponse(req, res) {
  try {
    throw Exception.for('Not implemented');
  } catch (e) {
    const error = e as Exception;
    res.setError({ 
      code: error.code, 
      error: error.message,
      stack: error.trace()
    });
  }
});

/**
 * Error handlers
 */
route.get('/error', function ErrorResponse(req, res) {
  Error('Not implemented');
});

/**
 * 404 handler
 */
route.get('/**', function NotFound(req, res) {
  if (!res.code && !res.status && !res.sent) {
    //send the response
    res.setHTML('Not Found');
  }
});

route.on('error', function Error(req, res) {
  const html = [ `<h1>${res.error}</h1>` ];
  const stack = res.stack?.map((log, i) => {
    const { line, char } = log;
    const method = log.method.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const file = log.file.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `#${i + 1} ${method} - ${file}:${line}:${char}`;
  }) || [];
  html.push(`<pre>${stack.join('<br><br>')}</pre>`);

  res.setHTML(html.join('<br>'));
});

export default route;