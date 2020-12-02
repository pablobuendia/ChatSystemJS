const http = require('http');
const url = require('url');

const HOST = 'localhost';
const PORT = 8080;
const OK = 200;

const responseHandler = function(request, response) {
    const urlParseada = url.parse(request.url, true);
    const pathname = urlParseada.pathname;
    switch (request.method) {
        case 'GET':
            let responseJson = handleGetAction(pathname);
            if (responseJson != null) {
                response.writeHead(200);
                response.end(JSON.stringify(responseJson));
            } else {
                response.writeHead(404);
                response.end(JSON.stringify({error:"Resource not found"}));
            }
        case 'OPTIONS':
            response.writeHead(200, getOptionsHeaders());
            response.end();
        case 'DELETE':
            
        default:
            response.writeHead(404);
            response.end(JSON.stringify({error:"Resource not found"}));
    }
}

const server = http.createServer(responseHandler);
server.listen(PORT, HOST);

function getOptionsHeaders() {
    var headers = {};
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "GET, DELETE, OPTIONS";
    headers["Access-Control-Allow-Credentials"] = false;
    headers["Access-Control-Max-Age"] = '86400'; // 24 hours
    headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
    return headers;
} 

function handleGetAction(pathname) {
    let paths = pathname.split('/');
    let lastPath = paths[paths.length - 1];
    if (lastPath == "topics") {
        let idBroker = paths[2];
        // HACER LA LLAMADA POR ZEROMQ
        // devolver el json de la respuesta
    } else if (paths.includes("topics")){
        let idBroker = paths[2];
        let topic = lastPath;
        // HACER LA LLAMADA POR ZEROMQ
        // devolver el json de la respuesta
    } else {
        return null;
    }
}