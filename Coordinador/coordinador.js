const zmq = require('zeromq');
const net = require('net');
const fs = require('fs');
const nroBroker = 3;

var listaBrokers = []; 
var totalTopicos = 0;

var responder = zmq.socket('rep');
responder.bind('tcp://127.0.0.1:5555');

var requester1 = zmq.socket('req');
var requester2 = zmq.socket('req');  //HABRIA QUE INTENTAR CAMBIARLO A UN ARREGLO, POR AHORA ES ASI
var requester3 = zmq.socket('req');


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
    let dir = 'tcp://' +listaBrokers[0].ip + ':' + listaBrokers[0].portRR;
    requester1.connect(dir);
    let dir2 = 'tcp://' +listaBrokers[1].ip + ':' + listaBrokers[1].portRR;
    requester2.connect(dir2);
    let dir3 = 'tcp://' +listaBrokers[2].ip + ':' + listaBrokers[2].portRR;
    requester3.connect(dir3);
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

function eleccionDeBroker (topico, index, req){
    totalTopicos++;
    index = (totalTopicos % nroBroker) - 1;
    listaBrokers[index].topicos.push(topico);
    console.log('El broker elegido fue: ', index, '\n lista Brokers nueva: ', listaBrokers[index]);
    console.log('i ', index);
    notificarBroker(req.topico, index, req);
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
}

function armarRespuesta (){

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
            i = verificaExistenciaTopico(req.topico);
            console.log('i:', i);
            if ( i == -1){ 
                //No hay ningun broker que maneje ese topico, se le asigna a un broker el manejo del topico 
                eleccionDeBroker(req.topico, i, req);
                
                requester1.on('message', (response, err) =>{
                    if (err )
                    exit = true;
                    console.log('El broker ha recibido el nuevo topico');
                });
                requester1.on('')
            }
            else {

            }
            console.log('peticion cliente-coordinador publicacion');
            if (exit == true){
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
            }
            else{
                respuesta = {
                    exito: exit,
                    accion: 1,
                    idPeticion: req.idPeticion,
                    error: {      
                        codigo: 2,
                        mensaje: 'operacion inexistente'
                    } 
                };
            };
            console.log('Respuesta enviada: ', respuesta);
            respuesta = JSON.stringify(respuesta);
            
            responder.send(respuesta); //SE TIENE QUE ENVIAR AQUI POR EL ASINCRONISMO
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

