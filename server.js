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
                client.sock.emit('message', { message: txt, alias: verifiedClient.alias })               
            })
        }


        // if (code != '') { // probably overkill
        //     registeredClients.forEach((client) => {
        //         if (client[1] == code) {
        //             // send messages between clients with the same code.
        //             // could place a counter in here to make sure only 2 are connected if needed?
        //             client[0].emit('message', txt)
        //             console.log("message is " + txt)
        //         }   
        //     })
        // }
    }) 

    sock.on('startRoom', (roomName) => {
        let roomMatch = rooms.filter(room => room.name === roomName) // get all clients with the same code. There should be no match if the code is not already used.
        console.log(roomMatch)

        if (roomMatch.length === 0) {
            let room = { 
                name: roomName,
                clients: [{sock, alias: 'host', leftRoom: false}]
            }
            rooms.push(room)
            sock.emit('successfulRegistration', {message: `Invite a guest to join room: ${roomName}`, announcement: true}) 
        }

        // let client = {
        //     sock: sock,
        //     alias: 'host',
        //     leftRoom: false
        // }
 
        // let room = {
        //     name: 'somename',
        //     clients: []
        // }

        // if ( code && clients.length < 1 ) {
        //     // make sure code is not blank and it isn't already in use
        //     registeredClients.push([sock, code])
        //     sock.emit('successfulRegistration', `Invite a guest to room: ${code}`) 
        // }
        // if ( code === '' || clients.length > 0 ) { 
        //     // if the code is already in use or it's blank.
        //     // sock.emit('message', 'Invalid code. Try again')
        //     console.log("code already in use or blank input")
        // } else {
        //     registeredClients.push([sock, code])
        //     sock.emit('successfulRegistration', `Invite a guest by using code: ${code}`) 
        // }           
    })


    sock.on('joinRoom', (roomName) => {
        console.log("looking for room, " + roomName)
        console.log(rooms)

        let foundRoom = rooms.filter(room => room.name === roomName)
        // let foundRoom = rooms.filter(room => {
        //     console.log("looping rooms " + room.name)
        //     room.name === roomName
        // })

        // console.log(foundRoom)
        console.log(foundRoom)

        // console.log("found room array length " + roomMatch.length)

        
        // console.log(aliasName)
        if (foundRoom.length == 1) {
            let aliasName = `guest ${foundRoom[0].clients.length}`
            let joiningClient = {sock, alias: aliasName, leftRoom: false}
            
            foundRoom[0].clients.push(joiningClient)

            sock.emit('successfulJoin', { message: 'Welcome. You are now connected.', alias: aliasName }) // send only to the joining client
            
            foundRoom[0].clients.forEach(client => {
                // send the new number of participants.
                client.sock.emit('participants', (foundRoom[0].clients.length))

                if ( client.sock.id != sock.id) { // send this message to everyone else but the client who just joined.
                    client.sock.emit('message', { message: `${aliasName}, has now joined the room`, announcement: true })
                }
            })
        }

        // if ( code != '' && clients.length > 0 ) {
        //     registeredClients.push([sock, code])
        //     registeredClients.forEach((client) => {
        //         if (client[1] == code) {
        //             client[0].emit('successfulJoin', 'Welcome. You are now connected.')
        //         }
        //     })
        // }
    })

        // if (code === '') {
        //     sock.emit('registerFail','fail')
        //     console.log("bad code") // send return message to correct code. But should probably prevent this on the client side.
        // } else {
        //     // could check to make sure the code does not already exist.
        //     clientsConnected.push([sock, code])
        //     sock.emit('codeRegistered', `Invite to join the chat using code: ${code}`) 
        // }

    sock.on('disconnect', () => {
        console.log("user disconnected")
    })

    


})