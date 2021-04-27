
// let socket = io("ws://localhost:8000")
let socket = io()
let notSoSecretCode = ''

socket.on('successfulRegistration', onCodeRegistered)
socket.on('successfulJoin', onSuccessfulJoin)
socket.on('message', onMessage)

const welcomeDiv = document.querySelector(".welcome-div")
const chatBoxDiv = document.querySelector(".chat-box-div")

function onCodeRegistered(message) {
    welcomeDiv.classList.add("hide-element")
    chatBoxDiv.classList.remove("hide-element")
    onMessage(message)
}

function onSuccessfulJoin(message) {
    welcomeDiv.classList.add("hide-element")
    chatBoxDiv.classList.remove("hide-element")
    onMessage(message)
}

function onMessage(message) {
    let list = document.querySelector(".chat-ul")
    let item = document.createElement('li')
    // item.innerHTML = `<p>${message}</p>`
    item.textContent = message
    list.appendChild(item)

    // let item = document.createElement('li')
    // item.innerHTML = code
    // list.appendChild(item)
}

const chatBtn = document.querySelector(".chat-btn")
const chatInput = document.querySelector(".chat-input")

chatBtn.addEventListener('click', handleChatInput)

function handleChatInput() {
    let message = chatInput.value
    socket.emit('sendmessage', `${message}`, notSoSecretCode)
    chatInput.value = ''
}


const startCodeBtn = document.querySelector(".start-code-btn")
const startCodeInput = document.querySelector(".start-code-input")

startCodeBtn.addEventListener('click', handleStartCodeInput)

function handleStartCodeInput() {
    let code = startCodeInput.value
    socket.emit('codeStart', `${code}`)
    notSoSecretCode = code
    startCodeInput.value = ''
    console.log(code)
}

const joinCodeBtn = document.querySelector(".join-code-btn")
const joinCodeInput = document.querySelector(".join-code-input")

joinCodeBtn.addEventListener('click', handleJoinCodeInput)

function handleJoinCodeInput() {
    let code = joinCodeInput.value
    socket.emit('codeJoin', `${code}`)
    notSoSecretCode = code
    joinCodeInput.value = ''
    console.log(code)
}


