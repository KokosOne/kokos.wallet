var router = require("express").Router();

router.get("/:page",function(request, response, next){

 
    response.render("index", {});
});


module.exports = router;

