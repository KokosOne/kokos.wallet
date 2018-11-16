var http = require("http")
, path = require("path")
, methods = require("methods")
, express = require("express")
, bodyParser = require("body-parser")
, session = require("express-session")
, cors = require("cors")
, passport = require("passport")
, errorhandler = require("errorhandler");


function productionErrorHandling(err, req, res, next){

    res.status(err.status || 500);
    res.json({errors: {message: err.message,
                       error: {}}});
}
function developmentErrorHandling(err, req, res, next){

    console.log(err.stack);
    res.status(err.status || 500);
    res.json({errors: {message: err.message,
                       error: err}});
    
}
/*
  params
  options - object
     port: port to listen to
     start: true/false - default false 
            on true: starts http server and returns server
            on false: returns express app.
     path.view: path to templates
     path.static: path to static
     routes: routes
     afterServerStart: function to be called on server start ( works with .start )

returns
    Express app or http server.
*/

function pathLogger(request, response, next){
    console.log(request.path);
    next();
}

function Create(options){
    var app = express();
    app.use(cors());
    console.log("__" + __dirname);
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());
    app.set("views", options.path.views);
   // app.engine("html", mustacheExpress());
    app.set("view engine", "html");
    app.use(pathLogger);
    app.use(express.static(options.path.static));
    app.use(options.routes);
    app.use(function(req, res, next){

        var err = new Error("Not Found");
        err.status = 404;
        next(err);
    });
   
    if(!process.env.production){
        app.use(developmentErrorHandling);
    }else{
        app.use(productionErrorHandling);
    }
    if( typeof(options.start) != "undefined"
        && options.start){
        var server = null;
    
        server = app.listen(options.port,
                        function(){
                            console.log("Started server on port "+ server.address().port);
                            if(options.afterServerStart){
                                options.afterServerStart();
                            }
                        });
        return server;
    }else{

        return app;
    }
}


module.exports = Create;
