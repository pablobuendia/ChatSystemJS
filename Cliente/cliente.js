const readline = require('readline');
const zmq = require('zeromq');
const net = require('net');

const intervaloNTP = 120; // Intervalo de tiempo en el que sincronizar con el servidor NTP en segundos
const localhost = "127.0.0.1";
const puertoNTP = 4444;
const dateObject = new Date();
var delayServidorNTP = 0; // En ms. Al principio el delay es 0
var id_cliente; //----------------- IMPORTANTE 
var consola = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// subber.js
subSocket = zmq.socket('sub'),
    pubSocket = zmq.socket('pub'),
    requester = zmq.socket('req');

// Connects REQ socket to tcp://localhost:5555
// Sends "Hello" to server.

// socket to talk to server
requester.connect("tcp://127.0.0.1:5555");
console.log("Connecting to hello world server...");

consola.question("\nIngrese su id: ", (answer) => {
    id_cliente = answer;
});

consola.question("\nIngrese su id: ", (answer) => {
    id_cliente = answer;
});

requester.on("message", function (reply) {
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
    if (mensaje.id_cliente != id_cliente) {
        console.log('Recibido topico: ', topic.toString(), ' con mensaje: ', mensaje.mensaje);
    }
});


consola.on('line', (mensaje) => {
    let arrayMensaje = mensaje.split(':');
    let fechaSincronizada = (new Date(Date.now() + delayServidorNTP)).toISOString();
    let message = JSON.stringify({emisor : id_cliente, mensaje: arrayMensaje[1], fecha: fechaSincronizada});
    pubSocket.send([arrayMensaje[0], message]);
    consola.close();
}); //MEJORAR, solamente permite que envie 1 mensaje y hasta ahí llego. 
//Tener en cuenta que el cliente siempre esta esperando que le ingresen un mensaje para publicar si es que es publisher. 
/*
Se espera que el mensaje ingresado para ser enviado contenga el topico 
Ejemplo:
    All: hola
    id_cliente: hola
*/
var clienteNTP = net.createConnection(puertoNTP, localhost, function () {
    console.log("Conectandose al servidor NTP...");
    setInterval(() => {

        var T1 = (new Date()).getTime().toISOString();
        console.log("Escribiendo desde cliente " + id_cliente + "...")
        clienteNTP.write(JSON.stringify({
            t1: T1
        }));

    }, intervaloNTP * 1000);
});


clienteNTP.on('data', function (servidorNTPResponse) {
    console.log("Cliente " + id_cliente + " Se recibio respuesta de servidor NTP.")

    var T4 = (new Date()).getTime();

    // Obtenemos la hora del servidor
    var times = JSON.parse(servidorNTPResponse);
    var T1 = (new Date(times.t1)).getTime();
    var T2 = (new Date(times.t2)).getTime();
    var T3 = (new Date(times.t3)).getTime();

    // calculamos delay de la red
    delayServidorNTP = ((T2 - T1) + (T4 - T3)) / 2;

    console.log("Delay calculado para cliente " + id_cliente + ": " + delayServidorNTP);
});