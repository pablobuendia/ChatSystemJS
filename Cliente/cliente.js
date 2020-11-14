const readline = require('readline');
var id_cliente; //----------------- IMPORTANTE 
var r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

r1.question('Ingrese su id: ', (answer) => {
    id_cliente = answer;
}); 

// subber.js
const zmq = require('zeromq'),
            subSocket = zmq.socket('sub'),
            pubSocket = zmq.socket('pub');
/*
La conexión siguiente se tiene que hacer a partir de la devolución del coordinador a donde se tiene que conectar
*/
subSocket.connect('tcp://127.0.0.1:3001');
pubSocket.connect('tcp://127.0.0.1:3000');
subSocket.subscribe('All');

/* 
PREGUNTA: por cada broker al que se quiere conectar debe tener un subSocket y un pubSocket? ---------------------------------- PREGUNTA
Porque se tiene que conectar a diferentes puertos para recibir mensaje de los distintos topicos
*/
subSocket.on('message', function(topic, message) {
    let mensaje = message.toString();
    mensaje = JSON.parse(mensaje);
    console.log('Recibio topico: ', topic.toString(), ' con mensaje: ', mensaje.mensaje);
});


r1.on('line', (mensaje) => {
    let arrayMensaje = mensaje.split(':');
    let fecha = new Date();
    fecha = fecha.toISOString();
    let message = '{"emisor":"'+id_cliente+'", "mensaje":"'+arrayMensaje[1]+'", "fecha":"'+fecha+'"}';
    pubSocket.send([arrayMensaje[0], message]);
    r1.close();
}); //MEJORAR, solamente permite que envie 1 mensaje y hasta ahí llego. 
//Tener en cuenta que el cliente siempre esta esperando que le ingresen un mensaje para publicar si es que es publisher. 
/*
Se espera que el mensaje ingresado para ser enviado contenga el topico 
Ejemplo:
    All: hola
    id_cliente: hola
*/


