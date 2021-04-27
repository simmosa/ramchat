// const e = require('express');
const express = require('express')
const app = express()

const httpServer = require("http").createServer(app)
const io = require("socket.io")(httpServer);

// const cors = require("cors")
// app.use(cors())

app.get('/testAPI', (req, res) => {
    res.json({ message: "you are connected to express api"})
})

app.use(express.static('client'))

const port = process.env.PORT || 8080;

httpServer.listen(port, () => {
    console.log(`listening on port ${port}`)
})

let registeredClients = []

io.on('connection', (sock) => {

    // sock.emit('welcome', 'Welcome. Start a chat or join a chat')

    sock.on('sendmessage', (txt, code) => {
        if (code != '') { // probably overkill
            registeredClients.forEach((client) => {
                if (client[1] == code) {
                    // send messages between clients with the same code.
                    // could place a counter in here to make sure only 2 are connected if needed?
                    client[0].emit('message', txt)
                    console.log("message is " + txt)
                }   
            })
        }
    }) 

    sock.on('codeStart', (code) => {
        let clients = registeredClients.filter(client => client[1] == code) // get all clients with the same code. There should be no match if the code is not already used.

        if ( code && clients.length < 1 ) {
            // make sure code is not blank and it isn't already in use
            registeredClients.push([sock, code])
            sock.emit('successfulRegistration', `Invite a guest to room: ${code}`) 
        }
        // if ( code === '' || clients.length > 0 ) { 
        //     // if the code is already in use or it's blank.
        //     // sock.emit('message', 'Invalid code. Try again')
        //     console.log("code already in use or blank input")
        // } else {
        //     registeredClients.push([sock, code])
        //     sock.emit('successfulRegistration', `Invite a guest by using code: ${code}`) 
        // }           
    })


    sock.on('codeJoin', (code) => {
        let clients = registeredClients.filter(client => client[1] == code)
        if ( code != '' && clients.length > 0 ) {
            registeredClients.push([sock, code])
            registeredClients.forEach((client) => {
                if (client[1] == code) {
                    client[0].emit('successfulJoin', 'Welcome. You are now connected.')
                }
            })
        }
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