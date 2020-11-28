var net = require('net');

var port = 4444;

var server = net.createServer(function (socket) {

  socket.on('data', function (data) {
    // tiempo de arribo del cliente
    var T2 = (new Date()).toISOString();

    // tiempo de envío del servidor
    var T3 = (new Date()).toISOString();
    socket.write(data.toString() + ',' + T2+ ',' + T3);
  });

});

server.listen(port);
