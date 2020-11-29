const http = require('http');
const url = require('url');

const HOST = 'localhost';
const PORT = 8080;
const OK = 200;
const PATH_TOPICS_LIST = '/broker';
const PATH_DELETE_TOPIC = '/delete';

const responseHandler = function(request, response) {
    const urlParseada = url.parse(request.url, true);
    const pathname = urlParseada.pathname;
    if (pathname.startsWith(PATH_TOPICS_LIST)) {
        if (request.method === 'GET') {
            // PEGARLE AL BROKER PARA PEDIRLE LA LISTA DE TOPICOS
            let paths = pathname.split('/');
            let idBroker = paths[2];
        } else if (request.method == "DELETE") {

        }
    }
}

const server = http.createServer(responseHandler);
server.listen(PORT, HOST);