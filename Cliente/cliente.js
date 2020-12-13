const readline = require('readline');
const fs = require('fs');
const intervalo = 120; // Intervalo de tiempo en el que sincronizar con el servidor NTP en segundos
const puertoNTP = 4444;
const zmq = require('zeromq');
//const net = require('net');
const cantidad_brokers=3;


//var delay;
var inicio = true;
var id_cliente;  
var ip_coordinador;
var port_coordinador;
var prueba = ()=>{};

var r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var conexiones_suscripcion=[]; //datos del broker a los topicos suscriptos (contiene obj.topico y obj.sub, socket)
var lista_clientes_vivos = []; // lista de cliente vivos para publicar (contiene obj.topico y obj.pub, socket)
var mensajes_pendientes = [];

var requester = zmq.socket('req');
var pub_heartbeat = zmq.socket('pub');

 
if(inicio){
    r1.question('Ingrese su id: ', (answer) =>
    {
        id_cliente = answer;
        fs.readFile('coordinador.txt','utf8', (err, data) => {
            if (err){
                console.log("Lamentablemente no es posible la conexion \n");
                console.log(err);
            }
            else{
                let file = data.split(',');
                ip_coordinador = file[0];
                port_coordinador = file[1];
                let dir = 'tcp://' + ip_coordinador + ':' + port_coordinador;
                requester.connect(dir);
                solicitud_Informacion_Coordinador(2, 'message/'+id_cliente, id_cliente);
            }
        });
        console.log("Espere por favor, conectando ... \n");
    });
};


function solicitud_Informacion_Coordinador (accion, topico, id_p){
    let peticion = new Object();
    peticion.accion = accion;
    peticion.idPeticion = id_p;
    peticion.topico = topico;
    peticion = JSON.stringify(peticion);
    requester.send(peticion);
};

requester.on("message", function (reply) { //deberia volver los ip y puertos de All, heartbeat y del cliente mismo
    let response = JSON.parse(reply);
    let datos_broker = response.resultados.datosBroker;
    if (response.accion == 2){ //Si es una respuesta al pedido de datos de los brokers para suscripcion
        datos_broker.forEach(element => {
            let asunto = new Object();
            asunto.topico = element.topico;
            console.log('Suscripto a: ', element.topico);
            asunto.sub = zmq.socket('sub');
            asunto.sub.connect('tcp://' + element.ip + ':' + element.puerto);
            asunto.sub.subscribe(element.topico.toString());
            conexiones_suscripcion.push(asunto);
        });
        //console.log(conexiones_suscripcion);
        solicitud_Informacion_Coordinador(1, 'heartbeat', id_cliente);
        conexiones_suscripcion.forEach((element) => { //que lo hace cuando recibe un mensaje de algun topico
            //console.log('Elemento llegado: ', element);
            element.sub.on('message', (topic, mensaje) => {
                topic = topic.toString();
                //console.log('ENTRO ACA');
                if (topic != 'heartbeat'){
                    console.log("LLEGO MENSAJEEEEEEEE");
                }
                mensaje = JSON.parse(mensaje);
                if ((topic != 'heartbeat') && (mensaje.emisor != id_cliente)){
                    console.log('Has recibido un mensaje:\n' + mensaje.emisor + ' : '+ mensaje.mensaje);
                }
                else if ((topic == 'heartbeat') && (mensaje.emisor != id_cliente)){
                    //debe actualizar la lista de clientes vivos. 
                    let index = lista_clientes_vivos.findIndex((currentValue) => currentValue.id == mensaje.emisor);
                    if (index != -1){
                        lista_clientes_vivos[index].fecha = mensaje.fecha;
                    }
                    else{
                        addClienteVivo(mensaje.emisor, mensaje.fecha);
                    }
                }
            });
        });
        console.log('Puede comenzar a escribir');
    }
    else { //Si es una respuesta al pedido de datos de un broker para publicacion
        if( datos_broker[0].topico == 'heartbeat'){
            pub_heartbeat.connect('tcp://' + datos_broker[0].ip + ':' + datos_broker[0].puerto);
        
            var interval = setInterval(() => {
                let mensaje = new Object();
                mensaje.emisor = id_cliente;
                mensaje.fecha = new Date().toISOString();
                mensaje = JSON.stringify(mensaje);
                pub_heartbeat.send(['heartbeat', mensaje]);
            }, 10000);
        }
        else{ 
            //cuando se pide datos de un topico para publicar que no se heartbeat
            //Asumimos que el topico por el cual se solicito informacion sobre el broker que lo maneja, ya existe en la lista_clientes_vivos
            //console.log('clientes vivos:', lista_clientes_vivos);
            console.log('datos broker: ', datos_broker[0]);
            let indice = lista_clientes_vivos.findIndex((currentValue) => 'message/'+currentValue.id == datos_broker[0].topico);
            console.log('el indice linea 121: ', indice);
            if (indice != -1){
                lista_clientes_vivos[indice].pub.connect('tcp://' + datos_broker[0].ip + ':' + datos_broker[0].puerto);
                lista_clientes_vivos[indice].conect = true;
                console.log("Aca me respondio el coordinador\n");
                prueba();
            }
        }
    }
});

setInterval(()=>{
    let active_clients = lista_clientes_vivos.filter((element) => {
        let currentDate = new Date().getTime();
        let elementDate = new Date (element.fecha).getTime();
        return currentDate - elementDate <= 30000;
    });
    lista_clientes_vivos = active_clients;
}, 30000);


function addClienteVivo (emisor, fecha){
    let nuevo_cliente = new Object();
    nuevo_cliente.id = emisor;
    nuevo_cliente.fecha = fecha;
    nuevo_cliente.pub = zmq.socket('pub');
    nuevo_cliente.conect = false;
    lista_clientes_vivos.push(nuevo_cliente);
}


function procesarMensaje (data){
    let array_mensaje = data.split(":");
    let index = lista_clientes_vivos.findIndex((currentValue) => currentValue.id==array_mensaje[0]);
    let mensaje = new Object();
    mensaje.emisor = id_cliente;
    mensaje.mensaje = array_mensaje[1];
    mensaje.fecha = new Date().toISOString();
    mensaje = JSON.stringify(mensaje);
    console.log('El indice es: ', index);
    console.log('lista clientes vivos: ', lista_clientes_vivos);
    if (index == -1){
        if (array_mensaje[0] == 'all'){
            addClienteVivo('all', null);
            solicitud_Informacion_Coordinador(1, 'message/all', id_cliente);
        }
        else{
            console.log('Ese topico no existe, por favor vuelva a intentar\n');
        }
    }
    else{
        if (lista_clientes_vivos[index].conect == false){
            solicitud_Informacion_Coordinador(1, 'message/'+array_mensaje[0], id_cliente);
        }
        else{
            lista_clientes_vivos[index].pub.send(['message/'+array_mensaje[0], mensaje]);
        }
    }
    prueba = function () {
        console.log("Acaa llegoo", mensaje); 
        index = lista_clientes_vivos.findIndex((currentValue) => currentValue.id==array_mensaje[0]);
        console.log('indice 182: ', index);
        console.log('array mensaje:', ['message/'+array_mensaje[0], mensaje]);
        lista_clientes_vivos[index].pub.send(['message/'+array_mensaje[0], mensaje]);
        prueba = null;
    };
}

r1.on('line',(data) => {
    console.log('Aca tomo como una linea: ', data);
    procesarMensaje(data.trim());
});



/*
La conexión siguiente se tiene que hacer a partir de la devolución del coordinador a donde se tiene que conectar


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