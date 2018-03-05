var PORT = process.env.PORT || 5000;
var fs = require('fs')
    , http = require('http')
    , socketio = require('socket.io');
var server = http.createServer(function(req, res) {
    res.writeHead(200, { "Access-Control-Allow-Origin": "*"});
    res.writeHead(200, { "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"});
    res.end();
}).listen(PORT, function() {
    
});

var v4path  = "ip2locationdb/IP2LOCATION-LITE-DB3.BIN";
var v6path  = "ip2locationdb/IP2LOCATION-LITE-DB3.IPV6.BIN";
var ip2locV4     = require("ip2location-nodejs");
ip2locV4.IP2Location_init(v4path);

var visitorsData  = {};
var visitData     = {};
var ip2proxy = require("ip2proxy-nodejs");
var io = socketio.listen(server);
io.on("connection", function (clientSocket)
{
    var userIP = clientSocket.request._query.ip;
    
    if (ip2proxy.Open("ip2locationdb/IP2PROXY-LITE-PX3.BIN") == 0) 
    {
        if(ip2proxy.isProxy(userIP)=='1')
        {
           var countryShortCode = ip2proxy.getCountryShort(userIP);
           var regionName = ip2proxy.getRegion(userIP);
           
        }else
        {
            
            var geoData = ip2locV4.IP2Location_get_all(userIP); 
            var countryShortCode = geoData.country_short;
            var regionName = geoData.region;
        }
        
        if (countryShortCode == '-')
        {
            countryShortCode = 'Anonymous';
        }
        
        if (regionName == '-')
        {
            regionName = 'Anonymous';
        }
        
    }
    ip2proxy.Close();
    
    clientSocket.on('visitor-data', function(ctData)
    {
        ctData['ccode'] = countryShortCode;
        ctData['state'] = regionName;
        ctData['ip'] = userIP;
        visitorsData[clientSocket.id] = ctData;
        io.emit('doReceive',visitorsData);

    });

    clientSocket.on('disconnect', function ()
    {
        delete visitorsData[clientSocket.id];
        io.emit('doReceive',visitorsData);
    });
    
});


