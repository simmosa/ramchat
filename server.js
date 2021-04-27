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

// let registeredClients = []

let rooms = []

io.on('connection', (sock) => {

    // sock.emit('welcome', 'Welcome. Start a chat or join a chat')

    sock.on('sendmessage', (txt, roomName) => {
        let foundRoom = rooms.filter(room => room.name === roomName)
          
        // verify the sock.id of client sending the message to make sure they are registered to that room. 
        let verifiedClient = foundRoom[0].clients.filter(client => {
            if (client.sock.id == sock.id) {
                return client
            } else {
                return null
            }
        })
        if (verifiedClient.length == 1) {
            // send the message to all clients in the room
            foundRoom[0].clients.forEach(client => {               
                client.sock.emit('message', { message: txt, alias: verifiedClient[0].alias })               
            })
        }

    }) 

    sock.on('startRoom', (roomName) => {
        let roomMatch = rooms.filter(room => room.name === roomName) // get all clients with the same code. There should be no match if the code is not already used.

        if (roomMatch.length === 0) {
            let room = { 
                name: roomName,
                clients: [{sock, alias: 'host', leftRoom: false}]
            }
            rooms.push(room)
            sock.emit('successfulRegistration', {message: `Invite guests to join room: ${roomName}`, alias: '', announcement: true}) 
        }        
    })


    sock.on('joinRoom', (roomName) => {
        let foundRoom = rooms.filter(room => room.name === roomName)
        
        if (foundRoom.length == 1) {
            let aliasName = `guest ${foundRoom[0].clients.length}`
            let joiningClient = {sock, alias: aliasName, leftRoom: false}
            
            foundRoom[0].clients.push(joiningClient)

            sock.emit('successfulJoin', { message: `Welcome, ${aliasName}. You are now connected.`, alias: '' }) // send only to the joining client
            
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

        console.log("recieved newAlias, " + newAlias)
        console.log("recieved roomName, " + roomName)

        let foundRoom = rooms.filter(room => room.name === roomName)

        console.log(foundRoom)
        console.log(foundRoom[0].name)

        let verifiedClient = foundRoom[0].clients.filter(client => {
            if (client.sock.id == sock.id) {
                return client
            } else {
                return null
            }
        })
        if (verifiedClient.length == 1) {
            let oldAlias = verifiedClient[0].alias
            console.log("old alias, " + oldAlias)
            verifiedClient[0].alias = newAlias
            // send the message to all clients in the room
            foundRoom[0].clients.forEach(client => {               
                client.sock.emit('message', { message: `${oldAlias} has changed their name to, ${newAlias}`, alias: 'announcement' })               
            })
        }

    })

    sock.on('disconnect', () => {
        console.log("user disconnected")
    })

    


})