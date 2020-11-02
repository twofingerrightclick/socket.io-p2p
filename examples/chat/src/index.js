var Socketiop2p = require('../../../index')
var io = require('socket.io-client')

function init () {
  var socket = io()
  var opts = {peerOpts: {trickle: false}, autoUpgrade: false}
  var p2psocket = new Socketiop2p(socket, opts, function () {
    privateButton.disabled = false
    p2psocket.emit('peer-obj', 'Hello there. I am ' + p2psocket.peerId)
  })

  // Elements
  var privateButton = document.getElementById('private')
  var form = document.getElementById('msg-form')
  var box = document.getElementById('msg-box')
  var boxFile = document.getElementById('msg-file')
  var msgList = document.getElementById('msg-list')
  var upgradeMsg = document.getElementById('upgrade-msg')

  var gameCodeButton = document.getElementById('game-code-button')
  var gameCodeField = document.getElementById('game-code-field')

  var gameRoomNameInput = document.getElementById('game-room-name-input')
  var joinRoomButton = document.getElementById('join-room-button')
  

  p2psocket.on('peer-msg', function (data) {
    var li = document.createElement('li')
    li.appendChild(document.createTextNode(data.textVal))
    msgList.appendChild(li)
  })

  p2psocket.on('ready', function () {
    console.log('connected via P2P')

  })

  p2psocket.on('peer-file', function (data) {
    var li = document.createElement('li')
    var fileBytes = new Uint8Array(data.file)
    var blob = new window.Blob([fileBytes], {type: 'image/jpeg'})
    var urlCreator = window.URL || window.webkitURL
    var fileUrl = urlCreator.createObjectURL(blob)
    var a = document.createElement('a')
    var linkText = document.createTextNode('New file')
    a.href = fileUrl
    a.appendChild(linkText)
    li.appendChild(a)
    msgList.appendChild(li)
  })

  form.addEventListener('submit', function (e, d) {
    e.preventDefault()
    var li = document.createElement('li')
    li.appendChild(document.createTextNode(box.value))
    msgList.appendChild(li)
    if (boxFile.value !== '') {
      var reader = new window.FileReader()
      reader.onload = function (evnt) {
        p2psocket.emit('peer-file', {file: evnt.target.result})
      }
      reader.onerror = function (err) {
        console.error('Error while reading file', err)
      }
      reader.readAsArrayBuffer(boxFile.files[0])
    } else {
      p2psocket.emit('peer-msg', {textVal: box.value})
    }
    box.value = ''
    boxFile.value = ''
  })


// Game code 

  gameCodeButton.addEventListener('click', function () {
      p2psocket.emit('private-game-room-request')
  })

  p2psocket.on('game-room-request-complete', function (data) {
    gameCodeField.textContent = data.gameRoomName
  })


  //click join by name
  joinRoomButton.addEventListener('click', function () {
   p2psocket.emit('join-private-game-room', {roomName: gameRoomNameInput.value })     
  
})


p2psocket.on('private-game-ready-to-play', function () {
  //p2psocket.usePeerConnection = true
  form.style.visibility='visible';

})


p2psocket.on('disconnected-player', function () {
  p2psocket._peers = {}
})

p2psocket.on('reconnected-player', function () {
  //send game data back so they can contiunute playing
})







  privateButton.addEventListener('click', function (e) {
    goPrivate()
    p2psocket.emit('go-private', true)
  })

  p2psocket.on('go-private', function () {
    goPrivate()
  })

  function goPrivate () {
    p2psocket.useSockets = false
    upgradeMsg.innerHTML = 'WebRTC connection established!'
    privateButton.disabled = true
  }
}

document.addEventListener('DOMContentLoaded', init, false)
