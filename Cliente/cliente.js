const readline = require('readline');
var ip_coordinador;
var puerto_coordinador;
const fs = require('fs');
const intervalo = 120; // Intervalo de tiempo en el que sincronizar con el servidor NTP en segundos
const puertoNTP = 4444;
const zmq = require('zeromq');
var contactos = [];
//const net = require('net');

//var delay;
var id_cliente; //----------------- IMPORTANTE 
var r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

r1.question('Ingrese su id: ', (answer) => {
    id_cliente = answer;
    fs.readFile("configuracion.txt",'utf8' , function(err,data){
        if (err)
        console.log(err);
        else
        {
            let aux=data.split(",");
            ip_coordinador= aux[1];
            puerto_coordinador=aux[3];
            console.log(puerto_coordinador);
            console.log(ip_coordinador);
            requester.connect("tcp://"+ip_coordinador+":"+puerto_coordinador); 
        }
});


})
// subber.js
//var subSocket = zmq.socket('sub'),
//var pubSocket = zmq.socket('pub'),
var requester= zmq.socket('req'); 
// Conexion con el Coordinador

requester.on("message", function (reply) {
    console.log("Received reply : [", reply.toString(), ']');
});

let peticion = {
    idPeticion: 1, 
    accion: 1, 
    topico: 'All'
}
peticion = JSON.stringify(peticion);
requester.send(peticion);

/*
La conexión siguiente se tiene que hacer a partir de la devolución del coordinador a donde se tiene que conectar

subSocket.connect('tcp://127.0.0.1:3001');
pubSocket.connect('tcp://127.0.0.1:3000');
subSocket.subscribe('All');


PREGUNTA: por cada broker al que se quiere conectar debe tener un subSocket y un pubSocket? ---------------------------------- PREGUNTA
Porque se tiene que conectar a diferentes puertos para recibir mensaje de los distintos topicos

subSocket.on('message', function (topic, message) {
    let mensaje = message.toString();
    mensaje = JSON.parse(mensaje);
    if (mensaje.id_cliente != id_cliente) {
        console.log('Recibio topico: ', topic.toString(), ' con mensaje: ', mensaje.mensaje);
    }
});


r1.on('line', (mensaje) => {
    let arrayMensaje = mensaje.split(':');
    let aux = new Date().now();
    let fecha = new Date(aux + delay);
    fecha = fecha.toISOString();
    let message = '{"emisor":"' + id_cliente + '", "mensaje":"' + arrayMensaje[1] + '", "fecha":"' + fecha + '"}';
    pubSocket.send([arrayMensaje[0], message]);
    r1.close();
}); //MEJORAR, solamente permite que envie 1 mensaje y hasta ahí llego. 
//Tener en cuenta que el cliente siempre esta esperando que le ingresen un mensaje para publicar si es que es publisher. 

Se espera que el mensaje ingresado para ser enviado contenga el topico 
Ejemplo:
    All: hola
    id_cliente: hola
*//*
var clienteNTP = net.createConnection(puertoNTP, "127.0.0.1", function () {
    setInterval(() => {

        var T1 = (new Date()).getTime().toISOString();
        console.log("Escribiendo desde cliente " + id_cliente + "...")
        clienteNTP.write(JSON.stringify({
            t1: T1
        }));

    }, intervalo * 1000);
});


clienteNTP.on('data', function (data) {
    console.log("Cliente " + id_cliente + " Se recibio respuesta de servidor NTP.")

    var T4 = (new Date()).getTime();

    // Obtenemos la hora del servidor
    var times = JSON.parse(data);
    var T1 = (new Date(times.t1)).getTime();
    var T2 = (new Date(times.t2)).getTime();
    var T3 = (new Date(times.t3)).getTime();

    // calculamos delay de la red
    delay = ((T2 - T1) + (T4 - T3)) / 2;

    console.log("Delay calculado para cliente " + id_cliente + ": " + delay);
});*/