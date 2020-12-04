const http = require('http');
const url = require('url');
const zmq = require('zeromq');
const requester = zmq.socket('req');

const HOST = 'localhost';
const PORT = 8080;
const OK = 200;

var idPeticionSuma = 0;
requester.bind(5555);

var listaResponses = [];

const responseHandler = function (request, response) {
    const urlParseada = url.parse(request.url, true);
    const pathname = urlParseada.pathname;
    switch (request.method) {
        case 'GET':
            let id = handleGetAction(pathname);

            listaResponses.push({idPeticion : id, respuesta : response})
            case 'OPTIONS':
                response.writeHead(200, getOptionsHeaders());
                response.end();
            case 'DELETE':

            default:
                response.writeHead(404);
                response.end(JSON.stringify({
                    error: "Resource not found"
                }));
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

        // Aca estoy mandando la request a un solo broker, faltaria unir el redirigir la 
        requester.send({
            idPeticion: idPeticionSuma++,
            accion: "listaTopicos",
            topico: null
        })

        return idPeticion;
    } else if (paths.includes("topics")) {
        let idBroker = paths[2];
        let topic = lastPath;

        requester.send({
            idPeticion: idPeticionSuma++,
            accion: "listaMensajes",
            topico: topic
        })

        return idPeticion;
    }
}

/*
"exito": boolean,
“accion”:”cod_op”,
“idPeticion”:  id,
           “resultados”: {},
           “error”: {
                         “codigo”: cod,
                         “mensaje”: “description”
                         }
}
*/
requester.on("message", function (jsonReply) {
    // Se recibio una respuesta del broker
    console.log("Received reply : [", reply.toString(), ']');

    let reply = JSON.parse(jsonReply);

    if (reply.exito) {
        let responseIndex = listaResponses.findIndex(response => response.idPeticion === reply.idPeticion);

        if (responseIndex === -1) {
            console.log("No se encontro la respuesta");
        } else {
            let response = listaResponses[responseIndex];
            
            response.writeHead(200);
            response.end(JSON.stringify(jsonReply));
        }
    } else {
        console.log("Hubo un error en la operacion");
    }
});