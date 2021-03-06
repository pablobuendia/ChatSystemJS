"use strict";
const fs = require('fs');
const zmq = require('zeromq');
const readline = require('readline');
const subSocket = zmq.socket('xsub');
const pubSocket = zmq.socket('xpub');
const responder = zmq.socket('rep');
const MOSTRAR_TOPICOS = '4';
const MOSTRAR_MENSAJES = '5';
const BORRAR_MENSAJES = '6';
const NUEVO_SUSCRIPTOR = 7;
const MESSAGE = 'message/';
const net =require('net');

const intervaloNTP = 120; // 120 segundos
const puertoNTP = 4444
const hostNTP = 'localhost' //'127.0.0.1'; // 
const direccionTCP = 'tcp://127.0.0.1:';

// Parametros para las cola de mensajes
var colasMensajes = [];
var maxAgeColaMensajes;
var cantMaxColaMensajes;

var id_broker;
var portRR;
var portSUB;
var portPUB;
var listaTopicos = new Set();
var intervalo = 120; // 120 segundos
var delay =0;


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
        file = data.split(',');

        let i = file.indexOf('broker/'+idB);
        portSUB = direccionTCP.concat(file[i+1]);
        subSocket.bindSync(portSUB);
        portPUB = direccionTCP.concat(file[i+2]);
        pubSocket.bindSync(portPUB);
        portRR = direccionTCP.concat(file[i+3]);
        responder.bind(portRR);
    });
}


// Redirige todos los mensajes que recibimos
subSocket.on('message', function (topic, message) {
        
    if (listaTopicos.has(topic.toString())){
        pubSocket.send([topic, message]);

        if (!(topic.toString().startsWith(MESSAGE+'g_'))){
            let index = colasMensajes.findIndex(colaMensajes => colaMensajes.topico == topic.toString());

            let colaMensajes;
            if (index == -1) {
                colaMensajes = {topico : topic.toString(), mensajes : []}
                colasMensajes.push(colaMensajes);
            } else {
                colaMensajes = colasMensajes[index];
            }
            
            if (colaMensajes != undefined) {
                colaMensajes.mensajes.push({
                    mensaje : message.toString(),
                    timestamp: (new Date(Date.now()+delay)).getTime() + maxAgeColaMensajes * 1000
                });
            }
            if (colaMensajes.mensajes.length > cantMaxColaMensajes) {
                colaMensajes.mensajes.shift(); // Si hay mas elementos que el maximo permitido entonces sacar el ultimo (el mas viejo) y descartarlo
            };
        }
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
    let index;
    let jsonRespuesta;
    switch (request.accion) {
        case MOSTRAR_TOPICOS:
            responder.send(JSON.stringify(createResponse(request.accion, request.idPeticion, {listaTopicos: Array.from(listaTopicos)})));
            break;
        case MOSTRAR_MENSAJES:
            index = colasMensajes.findIndex(colaMensajes => colaMensajes.topico.includes(request.topico))
            if (index === -1) { // Si no encuentra el index entonces el topico no está en la lista del broker
                let error = {
                    codigo: 1,
                    mensajes: "Tópico inexistente"
                }
                responder.send(JSON.stringify(createResponse(request.accion, request.idPeticion, null, error)));
            } else {
                responder.send(JSON.stringify(createResponse(request.accion, request.idPeticion, {mensajes: colasMensajes[index]})));
            }
            break;
        case BORRAR_MENSAJES:
            index = colasMensajes.findIndex(colaMensajes => colaMensajes.topico.includes(request.topico))
            if (index === -1) { // Si no encuentra el index entonces el topico no está en la lista del broker
                let error = {
                    codigo: 1,
                    mensajes: "Tópico inexistente"
                }
                responder.send(JSON.stringify(createResponse(request.accion, request.idPeticion, null, error)));
            } else {
                colasMensajes = colasMensajes.filter(colaMensajes => !colaMensajes.topico.includes(request.topico)); // Filtra la cola a borrar, efectvamente borrandola
                responder.send(JSON.stringify(createResponse(request.accion, request.idPeticion, {})));
            }
            break;
        case NUEVO_SUSCRIPTOR: //me avisa que hay un nuevo suscriptor a quien mandarle la cola de mensajes
            jsonRespuesta;
            index =colasMensajes.findIndex((value) => value.topico == request.topico);
            if (index != -1){
                jsonRespuesta = {
                    exito: true,
                    accion: request.accion,
                    idPeticion: request.idPeticion,
                    resultados: {colaMensajes: []}, //cola de mensajes
                    topico:request.topico
                };
                colasMensajes[index].mensajes.forEach((element) => {
                    jsonRespuesta.resultados.colaMensajes.push(element.mensaje.toString());
                });
            }
            else{
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


/**
 * Funcion que recorre periodicamente las colas de mensajes para comprobar que no hayan vencido. Si es asi los remueve de la cola
 */
setInterval(() => {
    colasMensajes.forEach(colaMensajes => {
        colaMensajes.mensajes.forEach((mensaje, indice) => {
            if (mensaje.timestamp < (Date.now())+delay) {
                colaMensajes.mensajes.splice(indice, 1);
            }
        });
    })
}, 1000);


// --------------------- COMIENZO MODULO NTP -------------------------
var clienteNTP = net.createConnection(puertoNTP, "127.0.0.1", function () {
    setInterval(() => {

        var T1 = (new Date()).toISOString();
        //console.log("Enviando sincronizacion desde broker.")
        clienteNTP.write(JSON.stringify({
            t1: T1
        }));

    }, intervalo * 1000);
});


clienteNTP.on('data', function (data) {
    //console.log("Broker recibio respuesta de servidor NTP")
    var T4 = (new Date()).getTime();


    // Obtenemos la hora del servidor
    var times = JSON.parse(data);
    var T1 = (new Date(times.t1)).getTime();
    var T2 = (new Date(times.t2)).getTime();
    var T3 = (new Date(times.t3)).getTime();

    // calculamos delay de la red
    delay = ((T2 - T1) + (T3 - T4)) / 2;
    console.log("Delay calculado para broker: " + delay);
});
// --------------------- FIN MODULO NTP -------------------------