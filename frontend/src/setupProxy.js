const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ message: 'Proxy error occurred' });
      },
      pathRewrite: {
        '^/api': ''
      }
    })
  );
};