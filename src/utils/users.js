/*Funzioni per tenere traccia degli utenti connessi*/

const users = []

//Inserisce un utente nell'array degli utenti
const addUser = ({ id, username, room }) => {
    //Pulizia dei dati in ingresso
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    //Validazione dei dati in ingresso
    if (!username || !room) {
        return {
            error: 'Username and room are required.'
        }
    }

    //Controlla se un utente con lo stesso username è già presente in una specifica room (find sull'array users)
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    //Validazione del nome utente
    if (existingUser) {
        return {
            error: 'Username already in use.'
        }
    }

    //Memorizzazione dell'utente
    const user = { id, username, room }
    users.push(user)
    return { user }
}

//Rimuove un utente dall'array degli utenti
const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)

    if (index !== -1) {
        //.splice rimuove l'elemento di indice 'index' dall'array 'users' e ritorna un array con tutti gli elementi rimossi (in questo caso uno). E' quindi necessario specificare [0] per accedere al primo elemento dell'array ritornato (ossia l'elemento rimosso da 'users')
        return users.splice(index, 1)[0]
    }
}

//Recupera il profilo di un utente
const getUser = (id) => {

    // const userProfile = users.find((user) => {
    //     return user.id === id
    // })

    // return userProfile

    return users.find((user) => user.id === id)
}

//Recupera tutti i profili degli utenti in una room
const getUsersInRoom = (room) => {
    return users.filter((user) => user.room === room)
}


/*----------------------------------------------------------------------------------------------------------------------------*/


module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}