const zmq = require('zeromq');
const net = require('net');
const fs = require('fs');
const localhost = 'tcp://127.0.0.1:';

var listaBrokers = []; 

var responder = zmq.socket('rep');
responder.bind('tcp://127.0.0.1:5555');

var requester1 = zmq.socket('req');
var requester2 = zmq.socket('req');
var requester3 = zmq.socket('req');


fs.readFile('configuracion.txt', 'utf8', (err, data) => {
    console.log('archivo: \n', data);
    let file = data.split(',');
    let i = 0;
    while(i<file.length){
        let objeto = {
            id_broker: file[i],
            portRR: file[i+3],
            portSUB: file[i+1],
            portPUB: file[i+2],
            topicos: []
        };
        console.log('file lenght: ', file.length);
        updateListaBrokers(objeto);
        i = i+4;
    }
    let dir = localhost.concat(listaBrokers[0].portRR);
    requester1.connect(dir);
    let dir2 = localhost.concat(listaBrokers[1].portRR);
    requester2.connect(dir2);
    let dir3 = localhost.concat(listaBrokers[2].portRR);
    requester3.connect(dir3);
});

requester1.on('message', (reply) => {
    console.log('Respuesta: ', reply.toString());
})


function updateListaBrokers (obj) {
    if (listaBrokers.length < 3){
        listaBrokers.push(obj);
    }
}


function verificaExistenciaTopico (topico){
    let encontro, i = 0;
    while (i < (listaBrokers.length-1) && encontro == false){
        if (listaBrokers[i].topicos.includes(req.topicos)){
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

responder.on('message', (request) => {
  let req = request.toString();
  req = JSON.parse(req);
  let respuesta;
  switch (req.accion) {
        case '1':
            if (verificaExistenciaTopico(req.topico) != -1){
                
            }
            console.log('peticion cliente-coordinador publicacion');
            respuesta = '{"exito": "true",'+
            '“accion”:”1”,' +
            '“idPeticion”: "'+ req.idPeticion +'",' +
            '“resultados”: {' + 
                            '“datosBroker”: [ '+
                                   /*'{“topico”: “' + nombreTopico + '”,'+
                                    '“ip”: “ '+ ip + '” ,' +   
                                    '“puerto”: xx}'+*/
                            ']' + 
                          '},' +
             '“error”: {' + 
                    '“codigo”: cod,' +
                    '“mensaje”: “description”' +
                    '}' +
            '}';  
            break;
        case '2':
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
  responder.send(respuesta);
});

