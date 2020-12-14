"use strict";
const http = require('http');
const url = require('url');
const zmq = require('zeromq');
const fs = require('fs');

const HOST = 'localhost';
const PORT = 8080;
const OK = 200;
const nroBroker = 3;

var generadorIdPeticion = 0;
var listaBrokers = [];
var requesters=[];

// Esta es la lista que va a almacenar las responses para responder a las request de los clientes
var listaResponses = [];

for (let i = 0; i < nroBroker; i++) {
    requesters[i] = zmq.socket('req');
}

fs.readFile('configuracion.txt', 'utf8', (err, data) => {
    let file = data.split(',');
    let i = 0;
    while(i<file.length){
        let objeto = {
            id_broker: file[i], 
            ip: file[i+1],
            portRR: file[i+2]
        };
        updateListaBrokers(objeto);
        i = i+3;
    }
    let dir;
    for(let j = 0; j < nroBroker; j++){
        dir = 'tcp://' +listaBrokers[j].ip + ':' + listaBrokers[j].portRR;
        //console.log('dir: ', dir);
        requesters[j].connect(dir);
    }
    prepareRequesters();
});

function updateListaBrokers (obj) {
    if (listaBrokers.length < 3){
        listaBrokers.push(obj);
    }
}

// Handler para el server
const responseHandler = (request, response) => {
    const urlParseada = url.parse(request.url, true);
    const pathname = urlParseada.pathname;
    let idPeticionNueva;
    switch (request.method) {
        case 'GET':
            idPeticionNueva = handleGetAction(pathname, request.method);

            // Si la id es -1 entonces no se encontro el broker
            if (idPeticionNueva === -1) {
                response.writeHead(400, getOptionsHeaders());
                response.end(JSON.stringify({
                    error: "No se encontro un broker con el codigo apropiado"
                }));
            } else {
                listaResponses.push({
                    idPeticion: idPeticionNueva,
                    respuesta: response
                })
            }
            break;
        case 'OPTIONS': // Esta request se envia automaticamente por Chrome antes de enviar el DELETE
            response.writeHead(200, getOptionsHeaders());
            response.end();
            break;
        case 'DELETE':
            idPeticionNueva = handleGetAction(pathname, request.method);

            // Si la id es -1 entonces no se encontro el broker
            if (idPeticionNueva === -1) {
                response.writeHead(400, getOptionsHeaders());
                response.end(JSON.stringify({
                    error: "No se encontro un broker con el codigo apropiado"
                }));
            } else {
                listaResponses.push({
                    idPeticion: idPeticionNueva,
                    respuesta: response
                })
            }
            break;
        default:
            response.writeHead(405, getOptionsHeaders());
            response.end(JSON.stringify({
                error: "Method not allowed"
            }));
            break;
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

function handleGetAction(paths, method) {
    let splittedPath = paths.split('/');
    let lastPath = splittedPath[splittedPath.length - 1];
    let idBroker = splittedPath[2];
    let idPeticionNueva;
    // Encontrar el requester de acuerdo al codigo del broker
    let brokerIndex = listaBrokers.findIndex(broker => broker.id_broker.split('/')[1] == idBroker);

    if (brokerIndex == -1) {
        console.log("No se encontro un broker con la id buscada, se rechaza la respuesta");
        return -1;
    } else {
        idPeticionNueva = generadorIdPeticion++;
        if (lastPath == 'topics') {
            console.log("requester", requesters[brokerIndex]);
            requesters[brokerIndex].send(JSON.stringify({
                idPeticion: idPeticionNueva,
                accion: '4',
                topico: null
            }))
        } else if (splittedPath.includes("topics") && method == "GET") {
            let topic = lastPath;
            requesters[brokerIndex].send(JSON.stringify({
                idPeticion: idPeticionNueva,
                accion: '5',
                topico: topic
            }))
        } else if (splittedPath.includes("topics") && method == "DELETE") {
            let topic = lastPath;
            requesters[brokerIndex].send(JSON.stringify({
                idPeticion: idPeticionNueva,
                accion: '6',
                topico: topic
            }))
        }
        return idPeticionNueva;
    }
}


function prepareRequesters() {
    requesters.forEach((element) => {
        element.on("message", function (bufferReply) {
            // Se recibio una respuesta del broker
            console.log("Received reply : [", bufferReply.toString(), ']');
        
            let reply = JSON.parse(bufferReply.toString());
            if (reply.exito) {
                let responseIndex = listaResponses.findIndex(response => response.idPeticion === reply.idPeticion);
        
                if (responseIndex === -1) {
                    console.log("No se encontro la respuesta");
                } else {
                    let response = listaResponses[responseIndex];
                    response.respuesta.writeHead(200, getOptionsHeaders());
                    response.respuesta.end(JSON.stringify(reply));
                }
            } else {
                console.log("Hubo un error en la operacion");
            }
        });
    });
}