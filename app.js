const express = require("express");
var exphbs = require("express-handlebars");
const http = require('http')
const socketio = require('socket.io')
// const mongoose = require("mongoose");
const app = express();
const port = 3000;
const path= require('path')
const server=http.createServer(app)
const io = socketio(server)
const formatMessage = require('./utils/messages')
const {userJoin,getCurrentUser,userLeave,getRoomUsers} = require('./utils/user')



// express-handlebars
app.engine(
  "handlebars",
  exphbs({
    defaulLayout: "main",
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,

      allowProtoMethodsByDefault: true,
    },
    layoutsDir: "views/layouts",
  })
);
app.set("view engine", "handlebars");

// Bodyparser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname,"views")))

const botName = 'MyChat Bot'

// Run when client connects

io.on('connection',socket=>{
    socket.on('joinRoom',({username,room})=>{

        const user = userJoin(socket.id,username,room)
        socket.join(user.room)


      // Welcome current user (visible only for him)
      socket.emit('message',formatMessage(botName,'Welcome to MyChat!!'))
      
      // Broadcast when a user connects to everyone except connecting client 
       socket.broadcast.to(user.room).emit('message',formatMessage(botName,`${user.username} has joined the chat`));

      // Send users and room info
      io.to(user.room).emit('roomUsers',{
          room:user.room,
          users:getRoomUsers(user.room)
      })


    })


    // console.log('New WebSocket Connection');

    
    
    //Listen for chatMessage
    socket.on('chatMessage',msg=>{
      const user = getCurrentUser(socket.id)
      io.to(user.room).emit('message',formatMessage(user.username,msg))
      
    })
    //  Runs when client disconnects
    socket.on('disconnect',()=>{
      const user = userLeave(socket.id);
      if (user) {
        io.to(user.room).emit(
          "message",
          formatMessage(botName, `${user.username} has left the chat`)
        );
       
        // Send users and room info
        io.to(user.room).emit("roomUsers", {
          room: server.room,
          users: getRoomUsers(user.room),
        });
      }
    })
    

})







app.get('/',(req,res)=>{
    res.render('index')
})
app.get('/chat',(req,res)=>{
    res.render('chat')
})





server.listen(port, () => {
  console.log(`Server runnin' on http://localhost:${port}`);
});