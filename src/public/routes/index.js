var express = require("express");

function define(dbConn, upstreamConnection, config){
    var router = express.Router();
    router.use("/", require("./api")(dbConn, upstreamConnection, config));
    return router;
}
module.exports = define;

