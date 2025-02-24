if (typeof window === 'undefined') {
  const nodeFetch = require('node-fetch');
  (global as any).self = {
    fetch: nodeFetch,
    Request: nodeFetch.Request,
    Response: nodeFetch.Response,
    Headers: nodeFetch.Headers
  };
}
