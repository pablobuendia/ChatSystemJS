const readline = require('readline');
var r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// subber.js
const zmq = require('zeromq'),
			subSocket = zmq.socket('sub');

subSocket.connect('tcp://127.0.0.1:3001')
subSocket.subscribe('miTopico1');

subSocket.on('message', function(topic, message) {
  console.log('Recibio topico:', topic.toString(), 'con mensaje:', message.toString())
});

// pubber.js
pubSocket = zmq.socket('pub');

pubSocket.connect('tcp://127.0.0.1:3000');

//Tener en cuenta que el cliente siempre esta esperando que le ingresen un mensaje para publicar si es que es publisher. 
 /*
let counter = 0;

setInterval(function() {
	console.log('Envia mensaje nº', counter)
    pubSocket.send(['miTopico1', 'Este es el mensaje ' + counter++])
}, 500);*/

