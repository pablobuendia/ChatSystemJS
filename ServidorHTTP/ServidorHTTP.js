"use strict";
const http = require('http');
const url = require('url');
const zmq = require('zeromq');

const HOST = 'localhost';
const PORT = 8080;
const OK = 200;

var generadorIdPeticion = 0;

// Esta es la lista que va a almacenar las responses para responder a las request de los clientes
var listaResponses = [];

var listaRequesters = [];

// Crear los requesters y almacenarlos en la lista
for (let index = 1; index < 4; index++) {
    let requester = zmq.socket('req');
    requester.connect("tcp://localhost:" + (5554 + index));

    listaRequesters.push({
        id: 'broker' + index,
        socket: requester
    });
}

// Handler para el server
const responseHandler = (request, response) => {
    const urlParseada = url.parse(request.url, true);
    const pathname = urlParseada.pathname;
    switch (request.method) {
        case 'GET':
            let idPeticionNueva = handleGetAction(pathname);

            // Si la id es -1 entonces no se encontro el broker
            if (idPeticionNueva === -1) {
                response.writeHead(400);
                response.end(JSON.stringify({
                    error: "No se encontro un broker con el codigo apropiado"
                }));
            } else {
                listaResponses.push({
                    idPeticion: id,
                    respuesta: response
                })
            }
            case 'OPTIONS': // Esta request se envia automaticamente por Chrome antes de enviar el DELETE
                response.writeHead(200, getOptionsHeaders());
                response.end();
            case 'DELETE':

            default:
                response.writeHead(405);
                response.end(JSON.stringify({
                    error: "Method not allowed"
                }));
    }
}

// Conectarse al server
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
    let lastPath = paths[paths.length - 1];
    let idBroker = paths[2];

    // Encontrar el requester de acuerdo al codigo del broker
    let requesterIndex = listaRequesters.findIndex(requester => requester.id = idBroker);

    if (requesterIndex === -1) {
        console.log("No se encontro un broker con la id buscada, se rechaza la respuesta");
        return -1;
    } else {
        idPeticionNueva = generadorIdPeticion++;
        if (lastPath == "topics") {
            requester.send({
                idPeticion: idPeticionNueva,
                accion: "listaTopicos",
                topico: null
            })
        } else if (paths.includes("topics")) {
            let topic = lastPath;

            requester.send({
                idPeticion: idPeticionNueva,
                accion: "listaMensajes",
                topico: topic
            })
        }
        return idPeticionNueva;
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