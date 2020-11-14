const zmq = require('zeromq');
const net = require('net');
var listaBrokers = []; 
var responder = zmq.socket('rep');
responder.bind('tcp://127.0.0.1:5555');
var requester = zmq.socket('req');
requester.bind('tcp://127.0.0.1:5500');

/*
data:{idBroker:id, puerto:port}
 */
var server = net.createServer(function(socket){
    socket.on('data', (data) => {
        let broker = data.toString();
        broker = JSON.parse(broker);
        let objeto = {
            id_broker: broker.idBroker,
            portRR: broker.portRR,
            portSUB: broker.portSUB,
            portPUB: broker.portPUB,
            topicos: []
        };
        updateListaBrokers(objeto);
        console.log('Llego el broker: ', broker);
        let dirBroker = '127.0.0.1' + objeto.portRR;
        requester.connect(dirBroker);
    });

    socket.on('error', ()=>{
        console.log('Gracias por conectarse, vuelva prontos:');
    });
});

function updateListaBrokers (obj) {
    if (listaBrokers.length < 3){
        listaBrokers.push(obj);
    }
}

server.listen(6000);


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

