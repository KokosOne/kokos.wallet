const request = require( "request" );

module.exports = function(type, url, data, pubKey, dataJson){

    return new Promise(function(resolve, reject){
        var headers = {};
        if(typeof(pubKey) !== "undefined" && pubKey != null){
            headers["x-pub-key"] = pubKey;
        }

      //  url = location.protocol + "//" + location.host + url;
     //   url = window.location.protocol + "//" + window.location.host + "1"+url;//+".json";
      //  url = url+".json";
        if(!dataJson){
            request({url: url,
                     method: type,
                     timeout: 60*1000,
                     form: data,
                     headers: headers},
                    function(error, response, body){
                        // console.log(type+" "+url+" "+JSON.stringify(data)+" .. R: "+body);
                        
                        if(error){
                            return reject(error);
                        }
                        var info = null;
                        var isJson = true;
                        try{
                            info = JSON.parse(body);
                        }catch(e){ info = body;
                                   isJson = false; }
                        //console.log(url);
                        //console.log(info);
                        resolve(info, isJson);
                    });
        }else{
            headers["Content-Type"] = "application/json";
            request({url: url,
                     method: type,
                     timeout: 60*1000,
                     body: data,
                     json: true,
                     headers: headers},
                    function(error, response, body){
                        //console.log(type+" "+url+" "+JSON.stringify(data)+" .. R: "+JSON.stringify(body));
                        
                        if(error){
                            return reject(error);
                        }
                        var info = null;
                        var isJson = true;
                        try{
                            info = JSON.parse(body);
                        }catch(e){
                            info = body;
                            isJson = false;
                        }
                        resolve(info, isJson);
                    });
            
        }
    });
}
