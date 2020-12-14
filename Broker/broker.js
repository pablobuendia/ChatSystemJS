"use strict";
const fs = require('fs');
const zmq = require('zeromq');
const subSocket = zmq.socket('xsub');
const pubSocket = zmq.socket('xpub');
const responder = zmq.socket('rep');
const readline = require('readline');
const MOSTRAR_TOPICOS = '4';
const MOSTRAR_MENSAJES = '5';
const BORRAR_MENSAJES = '6';
const NUEVO_SUSCRIPTOR = 7;
//const inquirer = require('inquirer');
const net =require('net');

const intervaloNTP = 120; // 120 segundos
const puertoNTP = 4444
const hostNTP = 'localhost' //'127.0.0.1'; // 
const direccionTCP = 'tcp://127.0.0.1:';

// Parametros para las cola de mensajes
const colasMensajes = [];
var maxAgeColaMensajes;
var cantMaxColaMensajes;

var id_broker;
var portRR;
var portSUB;
var portPUB;
var listaTopicos = new Set();
var intervalo = 120; // 120 segundos


// Crear interfaz para la consola
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('\n Ingresa el id del broker (puede ser 1, 2 o 3) \n', (idBroker) =>{
    assignPort(idBroker);
    rl.question('\n Ingrese cantidad maxima de mensajes en la cola de mensajes \n', (cantMaxMensajes) => {
        cantMaxColaMensajes = cantMaxMensajes;
        rl.question('\n Ingrese la cantidad de segundos maximos de permanencia en la cola de mensajes \n', (maxSegundos) => {
            maxAgeColaMensajes = maxSegundos;
            rl.close();
        });
    });
});

function assignPort (idB){
    
    let file;

    id_broker = 'broker/'+idB;
    fs.readFile('configuracionBroker.txt', 'utf8', function(err, data){
        if (err) {
            return console.log(err);
        }
        console.log(data);
        file = data.split(',');

        let i = file.indexOf('broker/'+idB);
        portSUB = direccionTCP.concat(file[i+1]);
        //subSocket.subscribe("".getBytes());
        subSocket.bindSync(portSUB);
        portPUB = direccionTCP.concat(file[i+2]);
        pubSocket.bindSync(portPUB);
        portRR = direccionTCP.concat(file[i+3]);
        responder.bind(portRR);
    });
}


// Redirige todos los mensajes que recibimos
/*
message = {
    emisor, mensaje, fecha
}
*/
subSocket.on('message', function (topic, message) {
        console.log(message.toString() + 'llegooooooo');
        pubSocket.send([topic, message]);

        // Meter mensaje en la cola

        let index = colasMensajes.findIndex(colaMensajes => colaMensajes.topico == topic.toString());

        let colaMensajes;
        console.log('INDICE: ', index, 'TOPCO: ', topic);
        if (index == -1) {
            colaMensajes = {topico : topic, mensajes : []}
            colasMensajes.push(colaMensajes);
        } else {
            colaMensajes = colasMensajes[index];
        }

        if (colaMensajes.length > cantMaxColaMensajes) {
            colaMensajes.shift(); // Si hay mas elementos que el maximo permitido entonces sacar el ultimo (el mas viejo) y descartarlo
        }
        if (colaMensajes != undefined) {
            colaMensajes.mensajes.push({
                mensaje : message,
                timestamp: (new Date()).getTime() + maxAgeColaMensajes * 1000
            });
        }
});

// Cuando el pubSocket recibe un tópico, subSocket debe subscribirse a él; para eso se utiliza el método send
pubSocket.on('message', function (topic) {
    if (!(listaTopicos.has(topic.toString()))){
        subSocket.send(topic.toString());
    };
});

responder.on('message', (bufferRequest) => {
    // Tiene que incluir dentro de su lista el nuevo topico que le envió el coordinador
    let request = JSON.parse(bufferRequest.toString());
    console.log('Llego un mensaje con: ', request);
    let index;
    let jsonRespuesta;
    switch (request.accion) {
        case MOSTRAR_TOPICOS:
            console.log('Lista de topicos a enviar: ', listaTopicos);
            responder.send(JSON.stringify(createResponse(request.accion, request.idPeticion, {listaTopicos: Array.from(listaTopicos)})));
            break;
        case MOSTRAR_MENSAJES:
            index = colasMensajes.findIndex(colaMensajes => colaMensajes.topico === request.topico);
            if (index === -1) { // Si no encuentra el index entonces el topico no está en la lista del broker
                let error = {
                    codigo: 1,
                    mensajes: "Tópico inexistente"
                }
                responder.send(JSON.stringify(createResponse(request.accion, request.idPeticion, null, error)));
            } else {
                responder.send(JSON.stringify(createResponse(request.accion, request.idPeticion, {mensajes: colasMensajes[i]})));
            }
            break;
        case BORRAR_MENSAJES:
            index = colasMensajes.findIndex(colaMensajes => colaMensajes.topico === request.topico);
            if (index === -1) { // Si no encuentra el index entonces el topico no está en la lista del broker
                let error = {
                    codigo: 1,
                    mensajes: "Tópico inexistente"
                }
                responder.send(JSON.stringify(createResponse(request.accion, request.idPeticion, null, error)));
            } else {
                colasMensajes = colasMensajes.filter(colaMensajes => colaMensajes.topico !== request.topico); // Filtra la cola a borrar, efectvamente borrandola
                responder.send(JSON.stringify(createResponse(request.accion, request.idPeticion, {})));
            }
            break;
        case NUEVO_SUSCRIPTOR: //me avisa que hay un nuevo suscriptor a quien mandarle la cola de mensajes
            console.log('Entro aca, broker linea: 164');
            jsonRespuesta;
            index =colasMensajes.findIndex((value) => value.topico == request.topico);
            if (index != -1){
                console.log('estoy aqui por RR, la cola de mensajes es: ', colasMensajes[index].mensajes[0].mensaje.toString());
                jsonRespuesta = {
                    exito: true,
                    accion: request.accion,
                    idPeticion: request.idPeticion,
                    resultados: {colaMensajes: []}, //cola de mensajes
                    topico:request.topico
                };
                colasMensajes[index].mensajes.forEach((element) => {
                    console.log('quiero escribir en la cola de mensajes: ',element.mensaje.toString());
                    jsonRespuesta.resultados.colaMensajes.push(element.mensaje.toString());
                });
                console.log('respuesta a enviar como RR: ', jsonRespuesta.resultados.colaMensajes.toString());
            }
            else{
                console.log('no se encontro mensajes en la cola de ese topico');
                jsonRespuesta = {
                    exito: false,
                    accion: request.accion,
                    idPeticion: request.idPeticion,
                    error: {
                        codigo: 1,
                        mensaje: 'Topico inexistente'
                    }
                }
            }
            responder.send(JSON.stringify(jsonRespuesta));
            break;
        default:
            if (!(listaTopicos.has(request.topico))){
                listaTopicos.add(request.topico); //que no agrege dos veces el mismo topico
            }
            
            console.log('LINEA: 180, lista de topicos: ', listaTopicos);
            jsonRespuesta = {
                exito: true,
                accion: request.accion,
                idPeticion: request.idPeticion,
                resultados: {},
                topico:request.topico
            };
            responder.send(JSON.stringify(jsonRespuesta));

            break;
    }
})

/**
 * Arma la response para devolver una respuesta a la request que llego al coordinador
 * @param {String} accion La acción solicitada en la request
 * @param {String} idPeticion El id de petición de la request
 * @param {Object} resultados El objeto de resultados
 * @param {Object} error El objeto con error. Si no es null entonces hubo un error
 */

function createResponse(accion, idPeticion, resultados, topico, error) {
    let respuesta;
    if (error) {
        // Si hubo algun error entonces devolver una respuesta con error pero sin campo resultados
        respuesta = {
            exito: false,
            accion: accion,
            idPeticion: idPeticion,
            error: error
        };
    } else {
        // Si no es asi crear una respuesta exitosa
        respuesta = {
            exito: true,
            accion: accion,
            idPeticion: idPeticion,
            resultados: resultados
        };
    }
    return respuesta;
}

/*
{
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

/**
 * Funcion que recorre periodicamente las colas de mensajes para comprobar que no hayan vencido. Si es asi los remueve de la cola
 
setInterval(() => {
    colasMensajes.forEach(colaMensajes => {
        colaMensajes.forEach((mensaje) => {
            if (mensaje.timestamp < Date.now()) {
                colaMensajes.shift();
            }
        });
    })

}, 1000);


// --------------------- COMIENZO MODULO NTP -------------------------
var clienteNTP = net.createConnection(puertoNTP, "127.0.0.1", function () {
    setInterval(() => {

        var T1 = (new Date()).getTime().toISOString();
        console.log("Enviando sincronizacion desde broker...")
        clienteNTP.write(JSON.stringify({
            t1: T1
        }));

    }, intervalo * 1000);
});


clienteNTP.on('data', function (data) {
    console.log("Broker recibio respuesta de servidor NTP")
    var T4 = (new Date()).getTime();


    // Obtenemos la hora del servidor
    var times = JSON.parse(data);
    var T1 = (new Date(times.t1)).getTime();
    var T2 = (new Date(times.t2)).getTime();
    var T3 = (new Date(times.t3)).getTime();

    // calculamos delay de la red
    delay = ((T2 - T1) + (T4 - T3)) / 2;
    console.log("Delay calculado para broker: " + delay);
});
*/
// --------------------- FIN MODULO NTP -------------------------