const app = require("express")();
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));
app.listen(9091, () => console.log("listening on http port 9091"));

const { response } = require("express");
const http = require("http");
const httpServer = http.createServer();
const websocketServer = require("websocket").server;

//tcp connection
httpServer.listen(9090, () => console.log("listening on ws port 9090"));

//hashmap
const clients = {};
const games = {};

//websocket connection and send http server as JSON
const wsServer = new websocketServer({
  httpServer: httpServer,
});

//capture client's connection
wsServer.on("request", (request) => {
  //null = accept any kind of websocket protocol
  //null could be my own protocol
  const connection = request.accept(null, request.origin);

  //listen open and close event
  connection.on("open", () => console.log("opened"));
  connection.on("close", () => console.log("closed"));

  //space for all the message from the client
  connection.on("message", (message) => {
    //the data that a sever received from client
    //make string data to JSON
    const result = JSON.parse(message.utf8Data);

    //verify what message client sent
    if (result.method === "create") {
      //who is a client?
      const clientId = result.clientId;

      //a game client want to do
      const gameId = guid();
      games[gameId] = {
        id: gameId,
        balls: 20,
        clients: [],
      };

      const payLoad = {
        method: "create",
        game: games[gameId],
      };

      //send response to a client
      const con = clients[clientId].connection;
      con.send(JSON.stringify(payLoad));
    }

    if (result.method === "join") {
      const clientId = result.clientId;
      const gameId = result.gameId;
      console.log(clientId + " " + gameId);
      const game = games[gameId];

      if (game.clients.length >= 4) {
        //sorry max player reached
        console.log("sorry max player reached");
        return;
      }

      const color = { 0: "Red", 1: "Green", 2: "Blue", 3: "Yellow" }[
        game.clients.length
      ];

      game.clients.push({
        clientId: clientId,
        color: color,
      });

      const payLoad = {
        method: "join",
        game: "game",
      };
      //loop through all clients and tell them that people has joined
      game.clients.forEach((c) => {
        clients[c.clientId].connection.send(JSON.stringify(payLoad));
      });
    }
  });
  //generate a new clientId from guid()
  const clientId = guid();

  //can find specific client's connection
  clients[clientId] = {
    connection: connection,
  };

  //the message to send called method:'connect'
  const payLoad = {
    method: "connect",
    clientId: clientId,
  };

  //respond to client with JSON changed to string
  connection.send(JSON.stringify(payLoad));
});

//guid generator
const guid = () => {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};
