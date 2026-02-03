const http = require('http');
const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.end('Hello World');
});
server.listen(3002, '127.0.0.1', () => {
    console.log('Server running at http://127.0.0.1:3002/');
});
