const zmq = require('zeromq');
const net = require('net');
const fs = require('fs');
const nroBroker = 3;

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
    switch (index){
        case 0:
            requesters[0].send(request);
            break; 
        case 1:
            requesters[1].send(request);
            break;
        case 2:
            requesters[2].send(request);
            break;
    }
}

function consultar_broker (req, callback){
    let respuesta;
    let i;
    console.log('La request enviada es: ', req);
    i = verificaExistenciaTopico(req.topico);
    if ( i == -1){ 
        //No hay ningun broker que maneje ese topico, se le asigna a un broker el manejo del topico 
        i = eleccionDeBroker(req);
        console.log('La request enviada AHORA es: ', req);
        requesters.forEach((element) => {
            element.on('message', (response, err) =>{
                //console.log('ACA ERROR', err.toString());
                let res = response.toString();
                res = JSON.parse(res);
                console.log('Respuesta del broker: ', res);
                if (res.exito == true){
                    respuesta = {
                        exito: res.exito,
                        datosBroker: new Object()
                    };
                    console.log('ACA TENES EL TOPICO: ', req.topico);
                    respuesta.datosBroker.topico = req.topico;
                    respuesta.datosBroker.ip = listaBrokers[i].ip;
                    if (req.accion == 1) {
                        respuesta.datosBroker.puerto = listaBrokers[i].portPUB
                    }
                    else{
                        respuesta.datosBroker.puerto = listaBrokers[i].portSUB
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
    else{
        respuesta = {
            exito: true,
            datosBroker: new Object()
        };
        respuesta.datosBroker.topico = req.topico;
        respuesta.datosBroker.ip = listaBrokers[i].ip;
        if (req.accion == 1) {
            respuesta.datosBroker.puerto = listaBrokers[i].portPUB
        }
        else{
            respuesta.datosBroker.puerto = listaBrokers[i].portSUB
        }
        callback(respuesta);
    }
}

function callBroker (req, callback){
    consultar_broker(req, (consulta) => {
        //console.log('respuesta de consulta: ', consulta);
       /* if (consulta.exito != true){
            callback({
                codigo: cosulta.error.codigo,
                mensaje: consulta.error.mensaje
            });
            /*respuesta.resultados = {datosBroker:[]};
            respuesta.resultados.datosBroker.push(consulta.datosBroker);
        }
        else{*/
            callback (consulta);
        //}
    });
};

function callAllBroker (req, callback){
    let contador = 0;
    let responses = [];
    for (let i=0; i<3; i++){
        switch (i){
            case 1:
                req.topico = 'All';
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
  let consulta;
  switch (req.accion) {
        case 1:
            consultar_broker(req, (consulta) => {
                respuesta = new Object();
                respuesta.exito = consulta.exito;
                respuesta.accion = req.accion;
                respuesta.idPeticion = req.idPeticion;
                if (consulta.exito == 'true'){
                    respuesta.resultados = {datosBroker:[]};
                    respuesta.resultados.datosBroker.push(consulta.datosBroker);
                }
                else{
                    respuesta.error = {
                        codigo: cosulta.error.codigo,
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
                console.log('RESPUESTAAAAAAAAAAAAAAAAA: ', responses);
                const AllExito = (currentValue) => currentValue.exito == true;
                if (responses.every(AllExito)){
                    respuesta.exito = true;
                }
                else{
                    respuesta.exito = false;
                }
                responder.send(JSON.stringify(respuesta));
            })
            /*while ((respuesta.exito == true) && (i <= 3)){
                
                
                i++;
                if ((respuesta.exito == false) || (i == 3)){
                    enviar = 3;
                }
            }*/
            /*while (enviar < 4){ //El 3 representa: All, heartbeat y el mismo cliente que solicito
                if (enviar == 3){
                    respuesta = JSON.stringify(respuesta);
                    console.log('Respuesta enviada: ', respuesta);
                    responder.send(respuesta);
                    largo = 4;
                }
            }*/
            break;
            /*
            
            i = verificaExistenciaTopico(req.topico);
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
            else{
                respuesta = {
                    exito: true,
                    accion: 1,
                    idPeticion: req.idPeticion,
                    resultados: {
                        datosBroker: [{topico:'heartbeat',ip:'127.0.0.1',puerto:'3011'}]
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
            //} //SE TIENE QUE ENVIAR AQUI POR EL ASINCRONISMO*/
        /*case 2:
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
            break;*/
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

