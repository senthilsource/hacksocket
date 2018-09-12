var http = require('http'),
WebSocket = require('ws');
var {spawn} = require("child_process");

var port = process.env.PORT || 3002;

var server = http.createServer( function(request, response) {

	var params = request.url.substr(1).split('/');

	response.connection.setTimeout(0);
	console.log(
		'Stream Connected: ' + 
		request.socket.remoteAddress + ':' +
		request.socket.remotePort
	);
	request.on('data', function(data){
		socketServer.broadcast(data);
		console.log(data);
		if (request.socket.recording) {
			request.socket.recording.write(data);
		}
	});
	request.on('end',function(){
		console.log('close');
		if (request.socket.recording) {
			request.socket.recording.close();
		}
	});

	// Record the stream to a local file?
	if (RECORD_STREAM) {
		var path = 'recordings/' + Date.now() + '.ts';
		request.socket.recording = fs.createWriteStream(path);
	}
}).listen(port, () => {
	     console.log(`App started in port ${port}`);
	   });


var RECORD_STREAM = false;
	var i=0;
// Websocket Server


var socketServer = new WebSocket.Server({ server: server,
    autoAcceptConnections: false}); 
//console.log(socketServer);
socketServer.connectionCount = 0;
socketServer.on('connection', function(socket, upgradeReq) {
	socketServer.connectionCount++;
	

	console.log(
		'New WebSocket Connection: ', 
		(upgradeReq || socket.upgradeReq).socket.remoteAddress,
		(upgradeReq || socket.upgradeReq).headers['user-agent'],
		'('+socketServer.connectionCount+' total)'
	);
	socket.on('close', function(code, message){
		socketServer.connectionCount--;
		console.log(
			'Disconnected WebSocket ('+socketServer.connectionCount+' total)'
		);
	});
});
socketServer.broadcast = function(data) {
	
//childProcess
	socketServer.clients.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(data);
		}
	});
};



var pythonProcess = spawn('python',["./python/camera.py"]);
console.log(pythonProcess.pid);