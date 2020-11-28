const readline = require('readline');
var puertoNTP=4444;
var  delay;
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
 const net =require('net');
            subSocket = zmq.socket('sub'),
            pubSocket = zmq.socket('pub'),
            requester = zmq.socket('req');

// Connects REQ socket to tcp://localhost:5555
// Sends "Hello" to server.

// socket to talk to server
requester.connect("tcp://127.0.0.1:5555");
console.log("Connecting to hello world server...");

requester.on("message", function(reply) {
  console.log("Received reply : [", reply.toString(), ']');
});

requester.send("Hello");


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
    if (mensaje.id_cliente != id_cliente){
        console.log('Recibio topico: ', topic.toString(), ' con mensaje: ', mensaje.mensaje);
    }
});


r1.on('line', (mensaje) => {
    let arrayMensaje = mensaje.split(':');
    let aux= new Date().now();
    let fecha = new Date(aux+delay);
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
var clienteNTP =net.createConnection(puertoNTP , "127.0.0.1",function(){
var intervalo = 120;
setInterval(() => {

 var T1 = (new Date()).toISOString();
      client.write(JSON.stringify(T1));
    
}, intervalo *1000);
});


clienteNTP.on('data', function (data) {
    var T4 = (new Date()).getTime();
  
    // obtenemos hora del servidor
    var times = data.toString().split(",");
    var T1 = parseInt(times[0]);
    var T2 = parseInt(times[1]);
    var T3 = parseInt(times[2]);
  
    // calculamos delay de la red
    delay = ((T2 - T1) + (T4 - T3)) / 2;
});