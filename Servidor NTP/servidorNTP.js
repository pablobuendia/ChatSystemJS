var net = require('net');

var port = 4444;

var server = net.createServer(function (socket) {
  console.log("Se conecto alguien");

  socket.on('data', function (data) {
    console.log("Recibi solicitud de cliente");
    // tiempo de arribo del cliente
    var T2 = (new Date()).toISOString();

    // tiempo de envío del servidor
    var T3 = (new Date()).toISOString();
    console.log("Se envia tiempo al cliente...");
    socket.write(JSON.stringify({ t1: JSON.parse(data).t1, t2 : T2, t3: T3}));
  });

});

server.listen(port, () => {
  console.log("Servidor NTP escuchando")
});
