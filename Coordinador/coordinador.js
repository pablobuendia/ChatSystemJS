const zmq = require('zeromq');
const net = require('net');
const fs = require('fs');
const nroBroker = 3;
const ACCION_NUEVO_TOPICO = 3;

var listaBrokers = []; 
var totalTopicos = 0;

var responder = zmq.socket('rep');
responder.bind('tcp://127.0.0.1:5555');
requesters=[];


for(let i=0;i<nroBroker;i++)
{
    requesters[i]=zmq.socket('req');
}

fs.readFile('configuracion.txt', 'utf8', (err, data) => {
    let file = data.split(',');
    let i = 0;
    while(i<file.length){
        let objeto = {
            id_broker: file[i], 
            ip: file[i+1],
            portRR: file[i+4],
            portSUB: file[i+2],
            portPUB: file[i+3],
            topicos: []
        };
        updateListaBrokers(objeto);
        i = i+5;
    }
    let dir;
    for(let j =0; j<nroBroker; j++){
        dir = 'tcp://' +listaBrokers[j].ip + ':' + listaBrokers[j].portRR;
        console.log('dir: ', dir);
        requesters[j].connect(dir);
    }
});


function updateListaBrokers (obj) {
    if (listaBrokers.length < 3){
        listaBrokers.push(obj);
    }
}

function verificaExistenciaTopico (topico){
    let encontro = false, i = 0;
    while ((i <= (listaBrokers.length-1)) && encontro == false){
        if (listaBrokers[i].topicos.includes(topico)){
            encontro = true;
        }
        else{
            i++;
        };
    };
    if (i != listaBrokers.length){
        return i;
    }
    else{
        return -1;
    }
};

function eleccionDeBroker (req){
    totalTopicos++;
    let index = (totalTopicos % nroBroker);
    listaBrokers[index].topicos.push(req.topico);
    console.log('El broker elegido fue: ', index, '\n lista Brokers nueva: ', listaBrokers[index]);
    console.log('i ', index);
    notificarBroker(index, req);
    return index;
}

function notificarBroker (index, request){
    request = JSON.stringify(request);
    requesters[index].send(request);
}


function consultar_broker (request, callback){
    let respuesta;
    let i;
    let topico = request.topico;
    i = verificaExistenciaTopico(topico);
    if ( i == -1){ //cambiar la accion a 3: nuevo topico, es una nueva request
        //No hay ningun broker que maneje ese topico, se le asigna a un broker el manejo del topico 
        let req = {
            idPeticion: request.idPeticion,
            accion: ACCION_NUEVO_TOPICO,
            topico: request.topico
        };
        console.log('request mandada al broker por un nuevo topico: ', req);
        i = eleccionDeBroker(req);
        requesters.forEach((element) => {
            element.on('message', (response, err) =>{
                console.log('Se quedo esperando aca!');
                let res = response.toString();
                res = JSON.parse(res);
                if (res.exito == true){
                    respuesta = {
                        exito: res.exito,
                        datosBroker: new Object()
                    };
                    respuesta.datosBroker.topico = topico;
                    respuesta.datosBroker.ip = listaBrokers[i].ip;
                    if (request.accion == 1) {
                        respuesta.datosBroker.puerto = listaBrokers[i].portSUB
                    }
                    else{
                        respuesta.datosBroker.puerto = listaBrokers[i].portPUB
                    }
                }
                else {
                    respuesta = {
                        exito: res.exito,
                        error: {      
                            codigo: res.codigo,
                            mensaje: res.mensaje
                        } 
                    };
                }
                callback(respuesta);
            });
        })
    }                               
    else { //ya existe un broker que maneje ese topico, le avisa al broker que un nuevo suscriptor llega
        /*let req = {
            accion: accion,
            topico: topico
        }
        console.log('request mandada ya sabiendo el broker: ', req);
        notificarBroker(i, req);
        console.log("Sigue");*/
        respuesta = {
            exito: true,
            datosBroker: new Object()
        };
        respuesta.datosBroker.topico = topico;
        respuesta.datosBroker.ip = listaBrokers[i].ip;
        if (request.accion == 1) {
            respuesta.datosBroker.puerto = listaBrokers[i].portSUB
        }
        else{
            respuesta.datosBroker.puerto = listaBrokers[i].portPUB
        }
        console.log("LINEA 151 respuesta: ", respuesta);
        callback(respuesta);
    }
}

function callBroker (req, callback){
    consultar_broker(req, (consulta) => {
        callback (consulta);
    });
};

function callAllBroker (req, callback){
    let contador = 0;
    let responses = [];
    for (let i=0; i<3; i++){
        switch (i){
            case 1:
                req.topico = 'message/all';
                console.log('REALIZO EL CAMBIO A ALL\n');
                break;
            case 2:
                req.topico = 'heartbeat';
                console.log('REALIZO EL CAMBIO A HEARTBEAT\n');
                break;
        }
        callBroker(req, (response) => {
            contador++;
            responses.push(response);
            if (contador == 3){
                callback(responses);
            }
        });
    }
    
}

responder.on('message', (request) => {
  let req = request.toString();
  req = JSON.parse(req);
  console.log(req);
  //let respuesta;
  switch (req.accion) {
        case 1: //publicacion
            consultar_broker(req, (consulta) => {
                respuesta = new Object();
                respuesta.exito = consulta.exito;
                respuesta.accion = req.accion;
                respuesta.idPeticion = req.idPeticion;
                if (consulta.exito == true){
                    respuesta.resultados = {datosBroker:[]};
                    respuesta.resultados.datosBroker.push(consulta.datosBroker);
                }
                else{
                    respuesta.error = {
                        codigo: consulta.error.codigo,
                        mensaje: consulta.error.mensaje
                    };
                }      
                respuesta = JSON.stringify(respuesta);
                console.log('Respuesta enviada: ', respuesta);
                responder.send(respuesta);
            });
            break;
        case 2:
            //Cliente le pide al coordinador el puerto e ip de un broker con el topico para PUBLICAR
            let enviar = 0; 
            let i = 1;
            let topico;
            respuesta = new Object();
            respuesta.accion = req.accion;
            respuesta.idPeticion = req.idPeticion;
            callAllBroker(req, (responses) =>{
                const AllExito = (currentValue) => currentValue.exito == true;
                respuesta.exito = responses.every(AllExito);
                console.log('respuestas del broker: ', responses.map((currentValue) => currentValue.exito));
                console.log('Exito: ', respuesta.exito);
                if (respuesta.exito){
                    const datosBroker = (currentValue) => currentValue.datosBroker;
                    respuesta.resultados = {
                        datosBroker: responses.map(datosBroker)
                    };
                }
                else{
                    respuesta.error = responses.find(element => element.error != null).error;
                }
                console.log(respuesta);
                responder.send(JSON.stringify(respuesta));
            })
            break;
        case 7:
            let index = verificaExistenciaTopico(req.topico);
            respuesta = new Object();
            respuesta.accion = req.accion;
            respuesta.idPeticion = req.idPeticion;
            if (index != -1){
                respuesta.exito = true;
                respuesta.resultados = {
                    datosBroker: [{
                        topico: req.topico,
                        ip: listaBrokers[index].ip,
                        puerto: listaBrokers[index].portRR
                    }]
                };
                console.log('respuesta por el puerto RR: ', respuesta);
                responder.send(JSON.stringify(respuesta));
            }
            else{
                respuesta.exito = false,
                respuesta.error = {
                    codigo: 1,
                    mensaje: "Topico inexistente"
                }
                console.log('respuesta como error de puerto RR: ', respuesta);
                responder.send(JSON.stringify(respuesta));
            }
  }
});

