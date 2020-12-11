const zmq = require('zeromq');
const net = require('net');
const fs = require('fs');
const nroBroker = 3;

var listaBrokers = []; 
var totalTopicos = 0;

var responder = zmq.socket('rep');
responder.bind('tcp://127.0.0.1:5555');
requesters=[];

/*
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
    requesters[j].connect(dir);}
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

function eleccionDeBroker (topico, req){
    totalTopicos++;
    let index = (totalTopicos % nroBroker) - 1;
    listaBrokers[index].topicos.push(topico);
    console.log('El broker elegido fue: ', index, '\n lista Brokers nueva: ', listaBrokers[index]);
    console.log('i ', index);
    notificarBroker(req.topico, index, req);
    return index;
}

function notificarBroker (topico, index, request){
    request = JSON.stringify(request);
    switch (index){
        case 0:
            console.log('peticion de topico enviado al broker 1');
            requester1.send(request);
            break; 
        case 1:
            requester2.send(request);
            break;
        case 2:
            requester3.send(request);
            break;
    }
}*/


responder.on('message', (request) => {
  let req = request.toString();
  req = JSON.parse(req);
  console.log(req);
  let respuesta;
  let i;
  let exit = false;
  switch (req.accion) {
        case 1:
            
            //Cliente le pide al coordinador el puerto e ip de un broker con el topico para PUBLICAR 
            /*i = verificaExistenciaTopico(req.topico);
            console.log('i:', i);
            if ( i == -1){ 
                //No hay ningun broker que maneje ese topico, se le asigna a un broker el manejo del topico 
                i = eleccionDeBroker(req.topico, req);
                console.log('i: ', i);
                requester1.on('message', (err, response) =>{
                    let res = response.toString();
                    res = JSON.parse(res);
                    if (res.exito == true){
                        respuesta = {
                            exito: res.exito,
                            accion: 1,
                            idPeticion: res.idPeticion,
                            resultados: {
                                datosBroker: []
                            }
                        };
                        let datoTop = {
                            topico: req.topico,
                            ip: listaBrokers[i].ip,
                            puerto: listaBrokers[i].portPUB
                        };
                        respuesta.resultados.datosBroker.push(datoTop);
                    }
                    else {
                        respuesta = {
                            exito: res.exito,
                            accion: 1,
                            idPeticion: res.idPeticion,
                            error: {      
                                codigo: res.codigo,
                                mensaje: res.mensaje
                            } 
                        };
                    }
                    
                    respuesta = JSON.stringify(respuesta);
                    console.log('Respuesta enviada: ', respuesta);
            
                    responder.send(respuesta);
                });
            }
            else{*/
                respuesta = {
                    exito: true,
                    accion: 1,
                    idPeticion: req.idPeticion,
                    resultados: {
                        datosBroker: [{topico:'heartbeat',ip:'127.0.0.1',puerto:'3011'}]
                    }
                };
                /*let datoTop = {
                    topico: req.topico,
                    ip: listaBrokers[i].ip,
                    puerto: listaBrokers[i].portSUB
                };
                respuesta.resultados.datosBroker.push(datoTop);*/
                
                console.log('Respuesta enviada: ', respuesta);
                respuesta = JSON.stringify(respuesta);
                
                responder.send(respuesta);
            //} //SE TIENE QUE ENVIAR AQUI POR EL ASINCRONISMO
            break;
        case 2:
            respuesta = {
                exito: true,
                accion: 2,
                idPeticion: req.idPeticion,
                resultados: {
                    datosBroker: [
                        {
                            topico:'All',
                            ip:'127.0.0.1',
                            puerto:'3000'
                        },
                        {
                            topico:'heartbeat',
                            ip:'127.0.0.1',
                            puerto:'3010'
                        },
                        {
                            topico:'1',
                            ip:'127.0.0.1',
                            puerto:'3100'
                        }
                    ]
                }
            };
            respuesta = JSON.stringify(respuesta);
            console.log('respuesta enviada: ', respuesta);
            responder.send(respuesta);
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

