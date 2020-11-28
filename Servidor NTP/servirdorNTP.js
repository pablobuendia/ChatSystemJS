var net = require('net');

var port = 4444;

var server = net.createServer(function (socket) {

  socket.on('data', function (data) {
    // tiempo de arribo del cliente
    var T2 = (new Date()).getTime().toISOString();

    // tiempo de envío del servidor
    var T3 = (new Date()).getTime().toISOString();
    socket.write(data.toString() + ',' + T2.toString() + ',' + T3.toString());
  });

});

server.listen(port);
