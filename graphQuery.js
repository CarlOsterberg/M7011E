var http = require('http');

//takes the query to be performed and also a callback function, to ensure asynchronity
function APIquery(query, callback) {
    // An object of options to indicate where to post to
    var post_options = {
        host: '127.0.0.1',
        port: '4000',
        path: '/graphql',
        method: 'POST',
        headers: {
            'Content-Type': 'application/graphql',
            'Content-Length': Buffer.byteLength(query)
        }
    };
    let res
    // Set up the request
    var post_req = http.request(post_options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            let temp = chunk.split(":",1);
            callback(chunk);
        });
    });

    // post the data
    post_req.write(query);
    post_req.end();
}

setInterval(function(){
    APIquery( "{price\nwph}",function(q){
        let d = JSON.parse(q);
        for (x in d.data) {
            console.log(x + " : " + d.data[x])
        }
        //Update db with APIquery data.
    })
}, 3000);
