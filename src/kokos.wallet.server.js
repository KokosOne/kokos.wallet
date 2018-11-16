const ServerFn = require("./server/http.js");
const config = require("../config/config.json");
var server = null;

server = ServerFn({path: {views: __dirname + "/../template/",
                          static: __dirname + "/../static/"},
                   start: true,
                   port: 3000,
                   routes: require(__dirname + "/./public/routes")(config, __dirname),
                       afterServerStart: function(){
                           console.log("afterServerStart");
                       }});

