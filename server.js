const { createSocket, Socket } = require('dgram');
const express = require('express')
const app = express()

const httpServer = require("http").createServer(app)
const io = require("socket.io")(httpServer);

// app.get('/testAPI', (req, res) => {
//     res.json({ message: "you are connected to express api"})
// })

app.use(express.static('client'))

const port = process.env.PORT || 8080;

httpServer.listen(port, () => {
    console.log(`listening on port ${port}`)
})

let rooms = []

io.on('connection', (sock) => {

    sock.on('sendmessage', (txt, roomName) => {
        let foundRoom = rooms.filter(room => room.name === roomName)
        
        if (foundRoom.length == 1) { // if the room exists
            // verify the sock.id of client sending the message to make sure they are registered to that room. 
            let verifiedClient = foundRoom[0].clients.filter(client => {
                if (client.sock.id == sock.id) {
                    return client
                } else {
                    return null
                }
            })
            if (verifiedClient.length == 1) {
                // if client is verified, send the message to all clients in the room
                foundRoom[0].clients.forEach(client => {               
                    client.sock.emit('message', { message: txt, alias: verifiedClient[0].alias })       
                })
            }
        }   
    }) 

    sock.on('startRoom', (roomName) => {
        let roomMatch = rooms.filter(room => room.name === roomName) // check to make sure roomName is not already in use
        if (roomMatch.length === 0) {
            let room = { 
                name: roomName,
                clients: [{sock, alias: 'Host', leftRoom: false}]
            }
            rooms.push(room)
            sock.emit('successfulRegistration', {message: `Invite guests to join room: ${roomName}`, alias: '', announcement: true}) 
        }        
    })


    sock.on('joinRoom', (roomName) => {
        let foundRoom = rooms.filter(room => room.name === roomName)
        
        if (foundRoom.length == 1) {
            let aliasName = `Guest ${foundRoom[0].clients.length}`
            let joiningClient = {sock, alias: aliasName, leftRoom: false}
            
            foundRoom[0].clients.push(joiningClient)

            sock.emit('successfulJoin', { message: `Welcome, ${aliasName}. You are now connected.`, aliasName, alias: '' }) // send only to the joining client
            
            foundRoom[0].clients.forEach(client => {
                // send the new number of participants.
                client.sock.emit('participants', (foundRoom[0].clients.length))

                if ( client.sock.id != sock.id) { // send this message to everyone else but the client who just joined.
                    client.sock.emit('message', { message: `${aliasName}, has now joined the room`, alias: 'announcement', announcement: true })
                }
            })
        }
    })

    sock.on('changeAlias', (newAlias, roomName) => {
        let foundRoom = rooms.filter(room => room.name === roomName)
            // find the room and verify the client is in that room
        if (foundRoom.length == 1) {
            let verifiedClient = foundRoom[0].clients.filter(client => {
                if (client.sock.id == sock.id) {
                    return client
                } else {
                    return null
                }
            })
            if (verifiedClient.length == 1) {
                let oldAlias = verifiedClient[0].alias
                verifiedClient[0].alias = newAlias
                // send the message to all clients in the room
                foundRoom[0].clients.forEach(client => {               
                    client.sock.emit('message', { message: `${oldAlias}, has changed their name to, ${newAlias}`, alias: 'announcement' })               
                })
            }
        }
    })

    sock.on('disconnect', (message) => {
        // remove the user from the room
        rooms.forEach((room, roomIndex) => { // check all rooms
            for (let i = 0; i < room.clients.length; i++) { // clients array 
                if (sock.id === room.clients[i].sock.id) {
                    let alias = room.clients[i].alias
                    room.clients = room.clients.filter((client,index) => index != i)
                    notifyRoomOfExit(room, alias)
                }
            }
            if (room.clients.length === 0) { // if all participants have left. Destroy the room
                rooms = rooms.filter((room, index) => index != roomIndex)
            }
        })
        // let foundRoom = rooms.filter(room => room.name === roomName)
        // if (foundRoom.length == 1) {
        //     console.log("closing connection. Room found")
        //     foundRoom[0].clients = foundRoom[0].clients.filter(client => {
        //         if (client.sock.id == sock.id) {           
        //             console.log("closing connection. user found. Removed from array")
        //             return null
        //         } else {}
        //             return client
        //         }
        //     })
        // } else {
        //     console.log("connection closed. User was not in a room")
        // }
        // rooms = rooms.filter(room => {
        //     room.clients.filter(client => client.sock.id != sock.id)
        // })
    })
})

notifyRoomOfExit = (room, alias) => {
    room.clients.forEach(client => {               
        client.sock.emit('message', { message: `${alias} has left the room`, alias: 'announcement' })
        client.sock.emit('participants', (room.clients.length))        
    })
} 
