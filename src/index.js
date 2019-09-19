/* SERVER */

const path = require ('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages.js')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users.js')

//Creazione applicazione express
const app = express()
//Creazione manuale di un nuovo web server
const server = http.createServer(app)
//Creazione di un'istanza di Socket.io che lavora con il web server
const io = socketio(server)

//Definizione della porta
const port = process.env.PORT || 3000

//Definizione del path da servire
const publicDirectoryPath = path.join(__dirname, '../public')

//Passaggio del path da servire alla app express
app.use(express.static(publicDirectoryPath))

/*
Modalità principali per l'emissione di un evento:

socket.emit -----------------> Emette l'evento solo al client corrente
io.emit ---------------------> Emette l'evento a tutti i client connessi
socket.broadcast.emit -------> Emette l'evento a tutti i client connessi ad eccezione del client corrente
io.to.emit ------------------> Emette l'evento a tutti i client in una specifica room
socket.broadcast.to.emit ----> Emette l'evento a tutti i client in una specifica room ad eccezione del client corrente
*/

//Controlla quando un nuovo client si connette ('connection' è un evento prestabilito di Socket.io). Per funzionare richiede il caricamento della libreria Socket.io nel client in front-end
io.on('connection', (socket) => {
    console.log('New WebSocket connection.')

    socket.on('join', ({ username, room }, callback) => {
        //Inserisce l'utente nell'array degli utenti per la validazione
        const { error, user } = addUser({ id: socket.id, username, room })
        //Se la validazione fallisce viene inviato un errore al socket del client tramite callback
        if (error) {
            return callback(error)
        }

        //Metodo che permette di connettersi ad una specifica chat room
        socket.join(user.room)

        //Invia un messaggio di benvenuto al nuovo client connesso
        socket.emit('message', generateMessage(`ADMIN@${user.room}`, `Welcome to ${user.room}`))
        //Avvisa i client già connessi che un nuovo client si è connesso
        socket.broadcast.to(user.room).emit('message', generateMessage(`ADMIN@${user.room}`, `${user.username} has joined.`))
        //Invia ai client i dati necessari per aggiornare la lista degli utenti in una room quando si connette un nuovo utente
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    //Si mette in ascolto dell'evento 'sendMessage' inviato dal client
    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()
        const user = getUser(socket.id)

        if (filter.isProfane(message)) {
            //Callback per l'acknowledge
            return callback('Profanity is not allowed.')
        }

        //Invia il messaggio passato dal client a tutti i client connessi
        io.to(user.room).emit('message', generateMessage(user.username, message))
        //Callback per l'acknowledge
        callback()
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        //Rimuove l'utente dall'array degli utenti
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage(`ADMIN@${user.room}`, `${user.username} has left.`))
            //Invia ai client i dati necessari per aggiornare la lista degli utenti in una room quando un utente lascia la room
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

//Inizializzazione del web server
server.listen(port, () => {
    console.log(`Server is up on port ${port}.`)
})