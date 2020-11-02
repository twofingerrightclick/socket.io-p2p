var ecstatic = require('ecstatic')
var hat = require('hat')
var server = require('http').createServer(
  ecstatic({ root: __dirname, handleError: false })
)
var p2pserver = require('socket.io-p2p-server').Server
var socketIO = require('socket.io')
var io = socketIO(server)

server.listen(3030, function () {
  console.log('Listening on 3030')
})

io.use(p2pserver)

var publicRooms = []
var privateRooms = []
var usedRoomNames = new Set(); 
var clients = {}

io.on('connection', function (socket) {
  clients[socket.id] = socket

  console.log("new client %s", socket.id)

  socket.on('private-game-room-request', function () {
    
    var room = createRoom(true)
    socket.leaveAll()
    socket.join(room.name)
    room.playerCount++
    room.players.push(socket)
    socket.currrentRoom=room
    //p2pserver(socket, null, room)
    socket.emit('game-room-request-complete', {gameRoomName: room.name})
  })

  socket.on('join-private-game-room', function (data) {
    
    var room = findPrivateRoom(data.roomName)
    if (room){
    //socket.leaveAll()
    socket.join(room.name)
  
    room.playerCount++
    room.players.push(socket)
    socket.currrentRoom=room
    //p2pserver(socket, null, room)

    if (room.playerCount>1 ){
   

    var players = socket.currrentRoom.players
    players.forEach(function (player) {
      player.emit('private-game-ready-to-play', {roomName: room.name})
    })

    }
  }
  else socket.emit('unable-to-find-room', 'data')
  })


  socket.on('peer-msg', function (data) {
    console.log('Message from peer: %s', data)
    //socket.rooms.emit('peer-msg', data)
    
    var players = socket.currrentRoom.players.filter(function (player) {
      return player !== socket
    })
    players.forEach(function (player) {
      player.emit('peer-msg', data)
    })

  })



  socket.on('go-private', function (data) {
    socket.broadcast.emit('go-private', data)
  })

  socket.on('disconnect', function (data) {
    //remove room and room name from set.
    if (typeof socket.currrentRoom !== 'undefined'){
    room.players.splice(room.players.indexOf(socket), 1)
    room.playerCount--
    removeRoom(room)
    io.to(room.name).emit('disconnected-player')
    }
  })


})

function createRoom (private) {
    var name ='';
  do {
   name =  generateRoomName()
  } while (usedRoomNames.has(name))
  usedRoomNames.add(name);

    var room = {players: [], playerCount: 0, name: name, private: private}
    addRoom(room)
  
  return room;
}

function generateRoomName (){
  var length = 5;
  var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var result = '';
  for ( var i = 0; i < length; i++ ) {
      result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  return result;
}

function findPublicRoom () {
  return publicRooms.filter(function(room) { return room.playerCount === 1 })[0];
}

function findPrivateRoom (roomName) {
  return privateRooms.filter(function(room) { return room.name === roomName })[0];
}

function removeRoom (room) {
  room.playerCount--
  if (room.private ===true ) {

  if (room.playerCount === 0){ 
    privateRooms.splice(privateRooms.indexOf(room), 1)
    usedRoomNames.delete(room.name)
  }
 
  }

  else if (room.private === false){
  if (room.playerCount === 0) publicRooms.splice(publicRooms.indexOf(room), 1)
  }

  else console.error(" removeRoom() Room wasn't removed as its private property wasn't set");
}

function addRoom (room) {
  if (room.private === true){
    return privateRooms[privateRooms.push(room) - 1]
  }
  else if (room.private===false){
    return publicRooms[publicRooms.push(room) - 1]
  }
  
}

