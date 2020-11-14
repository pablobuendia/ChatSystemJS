// broker.js (Intento 1) Pablo Buendia
const zmq = require('zeromq');
const subSocket = zmq.socket('xsub');
const pubSocket = zmq.socket('xpub');

var direccion = 'tcp://127.0.0.1:';

var listaTopicos = [];

const readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('Ingrese los puertos a utilizar el broker:');
rl.on('line', (puerto) => {
    let dir = direccion.concat(puerto);
    console.log('Direccion final: ', dir);
    subSocket.bindSync(dir);
    puerto =(eval(puerto )+1).toString();
    console.log (puerto);
    dir ='';
    dir = direccion.concat(puerto);
    console.log('Direccion final: ', dir);
    pubSocket.bindSync(dir);
    rl.close();
});
/*
O bien podemos pedirle al usuario que ingrese los dos puerto manualmente o pedirle uno solo y que el otro sea el siguiente 
Ej: 3000 (se ingresa) y el siguiente usado es 3001
La desventaja es que si otra persona que no sea nosotros lo corre no va a saber que el 3001 está en uso y puede llevar
a un error.

Elegimos que el puerto de pubSocket se ingrese solo porque no pudimos hacer que se ingrese manualmente ambos. 
*/

// redirige todos los mensajes que recibimos
subSocket.on('message', function (topic, message) {
    console.log('LLego un mensaje para publicar en:', topic);
    pubSocket.send([topic, message]);
});

// cuando el pubSocket recibe un tópico, subSocket debe subscribirse a él; para eso se utiliza el método send
//El broker que maneja "message/all" no tiene que mandar el mensaje al cliente que lo publico
pubSocket.on('message', function (topic) {
	subSocket.send(topic)
});
