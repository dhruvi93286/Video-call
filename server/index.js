
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.MEETING_PORT || 9000;

app.get("/", (req, res) => {
  res.send("Server is up!");
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

const connectedUsers = [];
const users = {};

io.on("connection", async (socket) => {
  socket.on("join-room", (roomID, name) => {
    socket.data.roomID = roomID;
    socket.data.name = name;
    socket.join(roomID);
    socket.join(name);
    console.log("roomID",roomID)
    if (connectedUsers.indexOf(name) === -1) {
      connectedUsers.push(name);
    }
    console.log("connectedUsers",connectedUsers)
    io.emit("connected-user", connectedUsers);
    socket.to(roomID).emit("user-connected", name, socket.id);
  });

  socket.on("callUser", (data) => {
    console.log(`Incoming call from ${data.userToCall}`);
    socket.to(data.userToCall).emit("callUser", {
      signal: data.signalData,
      from: data.from,
      userToCall: data.userToCall,
    });
  });

  socket.on("returning signal", ({ signal, callerID, userToCall }) => {
    io.to(callerID).emit("receiving returned signal", {
      signal,
      id: userToCall,
    });
  });

  socket.on("returning-share-signal", ({ signal, callerID, userToCall }) => {
    console.log("yeee",signal, callerID, userToCall);

    io.to(callerID).emit("receiving-share-returned-signal", {
      signal,
      id: userToCall,
    });
  });

  socket.on('share-screen', (data) => {
    console.log("d",data)
    socket.to(data.userToCall).emit("share-screen", {
      signal: data.signalData,
      from: data.from,
      userToCall: data.userToCall,
    });
  });
  socket.on('screen-sharedeee', (data) => {
    console.log(" data.signal", data)
    socket.to(data.to).emit('screen-shared', data.signal);
  });
  socket.on('stop-sharing', (data) => {
    socket.broadcast.emit('stop-sharing', data);
  });
  socket.on("leaving", (roomID,name) => {
    console.log("ggg",name)
    io.to(roomID).emit("leaving",name);
  });
  
  socket.on("leave-call", ({ name, roomID }) => {
    console.log("leave-call-------------->", name, roomID);
    socket.to(roomID).emit("leaving-call-success", name);
  });


  socket.on("message", ({ roomID, name, message, type }) => {
    io.to(roomID).emit('message', { name, message, type: type || 0 });
  });
  
  socket.on("disconnect", () => {
    const roomID = socket.data.roomID;
    const name = socket.data.name;
    const index = connectedUsers.indexOf(name);
    if (index > -1) {
      connectedUsers.splice(index, 1);
    }
  console.log("connectedUsers",connectedUsers)
    console.log("user disconnect", roomID);
    io.to(roomID).emit("user-leave", name);
  });
});

module.exports = app;
