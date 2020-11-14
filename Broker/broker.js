
const zmq = require('zeromq');
const subSocket = zmq.socket('xsub');
const pubSocket = zmq.socket('xpub');
const responder = zmq.socket('rep');
const net = require('net');

var id_broker;
var direccion = 'tcp://127.0.0.1:';
var port;

var listaTopicos = [];

const readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Ingrese el puerto a utilizar por el broker, IMPORTANTE: a partir del puerto ingresado los siguientes 2 puertos serán utilizados por este broker', (puerto) => {
    port = puerto;
    assignPort(puerto);
});

function assignPort (puerto){
    let dir = direccion.concat(puerto);
    subSocket.bindSync(dir);
    puerto =(eval(puerto)+1).toString();
    let dir2 = direccion.concat(puerto);
    pubSocket.bindSync(dir2);
    puerto =(eval(puerto)+1).toString();
    let dirRR = direccion.concat(puerto);
    responder.bind(dirRR);
}

var client = net.createConnection(6000, '127.0.0.1', () => {
    console.log('\n Ingresa ademas el id del broker, gracias de antemano');
    rl.on('line', (answer) => {
        let puerto = parseInt(port);
        let obj = {idBroker:answer, portSUB:puerto, portPUB: puerto+1, portRR:puerto+2};
        obj = JSON.stringify(obj);
        client.write(obj);
        rl.close();
    }); 
});

// redirige todos los mensajes que recibimos
subSocket.on('message', function (topic, message) {
    if (listaTopicos.includes(topic)){
        pubSocket.send([topic, message]);
    }
    else{
        console.log('llego un topico que no se maneja con este broker');
    }
});

// cuando el pubSocket recibe un tópico, subSocket debe subscribirse a él; para eso se utiliza el método send
pubSocket.on('message', function (topic) {
	subSocket.send(topic)
});

responder.on('message', (request) => {
    //Tiene que incluir dentro de su lista el nuevo topico que le envió el coordinador. 
    let req = request.toString();
    req = JSON.parse(req);
    listaTopicos.push(req.topico);
    responder.send('Fue agregado el topico');
})