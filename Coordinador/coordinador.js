const zmq = require('zeromq');
const net = require('net');
const fs = require('fs');
const nroBrokers = 3;

var listaBrokers = []; 
var totalTopicos = 0;

var responder = zmq.socket('rep');
responder.bind('tcp://127.0.0.1:5555');

var listaRequesters = [zmq.socket('req'), zmq.socket('req'), zmq.socket('req')]

// Leer el archivo de configuracion y conectarse con los brokers
fs.readFile('../configuracion.txt', 'utf8', (err, data) => {
    if (err) {
        console.log(err);
    } else {
        let file = data.split(',');
        let i = 0;
        while (i < file.length) {
            let objetoBroker = {
                id_broker: file[i],
                ip: file[i + 1],
                portRR: file[i + 4],
                portSUB: file[i + 2],
                portPUB: file[i + 3],
                topicos: []
            };
            updateListaBrokers(objetoBroker);
            i = i + 5;
        }

        // Conectarse a cada requester usando la direccion correspondiente
        for (let index = 0; index < listaBrokers.length; index++) {
            let dir = 'tcp://' + listaBrokers[index].ip + ':' + listaBrokers[index].portRR;
            listaRequesters[index].connect(dir);
        }
    }
});

function updateListaBrokers(objetoBroker) {
    if (listaBrokers.length < 3) {
        listaBrokers.push(objetoBroker);
    }
}

/**
 * Verifica la existencia del topico. Si es así devuelve la posicion del elemento en donde se encuentra. Si no es así devuelve -1.
 * @param {String} topico 
 */
function obtenerPosicionTopico(topico) {
    return listaBrokers.findIndex(broker => broker.topicos.includes(topico))
};


/**
 * Asigna el nuevo topico al broker y notifica al broker correspondiente
 * @param {String} topico El topico a asignar
 */
function asignarBroker(topico) {
    // Actualizar la cantidad total de topicos
    totalTopicos++;

    let index = (totalTopicos % nroBrokers) - 1;
    listaBrokers[index].topicos.push(topico);

    console.log('El broker elegido fue: ', index, '\n Lista actualizada: ', listaBrokers[index]);
    console.log('i ', index);
    
    return index;
}

/**
 * Notifica al broker correspondiente que se le asigno un tópico nuevo
 * @param {String} index El numero de broker a notificar
 * @param {Object} request El objeto request
 */
function notificarBroker(index, request) {
    request = JSON.stringify(request);
    console.log('Peticion de topico enviado al broker ' + request);
    listaRequesters[index].send(request);
}


responder.on('message', (request) => {
  let req = request.toString();
  req = JSON.parse(req);
  console.log(req.accion);
  let respuesta;
  let i;
  let exit = false;
  switch (req.accion) {
        case 1:
            //Cliente le pide al coordinador el puerto e ip de un broker con el topico para PUBLICAR 
            i = obtenerPosicionTopico(req.topico);
            console.log('i:', i);
            if ( i == -1){ 
                //No hay ningun broker que maneje ese topico, se le asigna a un broker el manejo del topico 
                i = asignarBroker(req.topico);
                notificarBroker(i, req);
                console.log('i: ', i);
                requester1.on('message', (err, response) =>{
                    if (err){
                        respuesta = {
                            exito: true,
                            accion: 1,
                            idPeticion: req.idPeticion,
                            resultados: {
                                datosBroker: []
                            }
                        };
                        let datoTop = {
                            topico: req.topico,
                            ip: listaBrokers[i].ip,
                            puerto: listaBrokers[i].portSUB
                        };
                        respuesta.resultados.datosBroker.push(datoTop);
                    }
                    else {
                        respuesta = {
                            exito: false,
                            accion: 1,
                            idPeticion: req.idPeticion,
                            error: {      
                                codigo: 2,
                                mensaje: 'operacion inexistente'
                            } 
                        };
                    }
                    
                    respuesta = JSON.stringify(respuesta);
                    console.log('Respuesta enviada: ', respuesta);
            
                    responder.send(respuesta);
                });
            }
            else{
                respuesta = {
                    exito: exit,
                    accion: 1,
                    idPeticion: req.idPeticion,
                    resultados: {
                        datosBroker: []
                    }
                };
                let datoTop = {
                    topico: req.topico,
                    ip: listaBrokers[i].ip,
                    puerto: listaBrokers[i].portSUB
                };
                respuesta.resultados.datosBroker.push(datoTop);
                
                console.log('Respuesta enviada: ', respuesta);
                respuesta = JSON.stringify(respuesta);
                
                responder.send(respuesta);
            } //SE TIENE QUE ENVIAR AQUI POR EL ASINCRONISMO
            break;
        case '2':
            //Se pide el broker para SUSCRIBIRSE 

            break;
        case '3':
            break;
        case '4':
            break;
        case '5':
            break;
        case '6':
            break;
        case '7':
            break;
  }
  /*Recibe:
  { 
    “idPeticion”:  id,
    “accion”: “cod_op”, 
    “topico”: “nombreTopico”,
     
    } 
  */  
  //console.log("Received request: [", request.toString(), "]");
});

