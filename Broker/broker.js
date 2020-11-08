// broker.js (Intento 1) Pablo Buendia
const zmq = require('zeromq');
const readline = require('readline');

var r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var brokers = [];

r1.question('Escriba el numero de brokers: ', function(cant) {
    for (let index = 0; index < cant; index++) {
        r1.question('Escriba el id del broker ' + index + ':', function(nombre) {
            // definimos 2 sockets: el que escucha todos los mensajes entrantes (subSocket), y el que va a enviar los mensajes a destino (pubSocket)
            // ACA HABRIA QUE PUSHEAR UN NUEVO BROKER AL ARRAY, EL TEMA SERIA COMO HACER PARA CREAR EL OBJETO
            // Y TODO ESO QUE TODAVIA NO TENGO TAN CLARO
            //brokers.push(new broker());
        });
    }
})

brokers.forEach(broker => {
    // ambos sockets van a ser modo servidor, ya que los publicadores y suscriptores de nuestro sistema, los clientes, se conectaran al broker (y no al revés)
    broker.subSocket.bindSync('tcp://127.0.0.1:3000');
    broker.pubSocket.bindSync('tcp://127.0.0.1:3001');
});


// redirige todos los mensajes que recibimos
subSocket.on('message', function (topic, message) {
  pubSocket.send([topic, message])
});

// cuando el pubSocket recibe un tópico, subSocket debe subscribirse a él; para eso se utiliza el método send
pubSocket.on('message', function (topic) {
	subSocket.send(topic)
});