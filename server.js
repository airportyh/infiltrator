var request = require('request')
var mkdirp = require('mkdirp')
var http = require('http')
var https = require('https')
var fs = require('fs')
var path = require('path')

var baseDir = 'data'

function filePathForReq(req){
    var host = req.headers.host
    var method = req.method
    var url = req.url
    var uri = url.match(/^http\:\/\/[^\/]+(\/[^?]*)/)[1]
    var pathname = path.join(baseDir, host, uri)
    if (pathIsDir(pathname)){
        pathname += 'index.html'
    }
    return pathname
}

function pathIsDir(pathname){
    return pathname[pathname.length - 1] === '/'
}

function proxyRequest(req, resp){
    console.log(req.method + ' ' + req.url + ' [net]')
    var proxyReq = request({
        url: req.url
    }, function(err, mesg, body){
        debugger
        var pathname = filePathForReq(req)
        var dir = path.dirname(pathname)
        mkdirp(dir, function(err){
            if (err){
                console.error('Failed to create dir: ' + dir)
                return
            }
            fs.writeFile(pathname, body, function(err){
                if (err){
                    console.error('Failed to write file ' + pathname)
                }
                resp.end(body)
            })
        })
    })
}

function serveFromFs(req, resp){
    var pathname = filePathForReq(req)
    
    console.log(req.method + ' ' + req.url + ' [fs]')
    fs.readFile(pathname, function(err, data){
        if (err){
            proxyRequest(req, resp)
            return
        }
        resp.end(data)
    })
}

function isEditable(req){

}

function server(req, resp) {
    var pathname = filePathForReq(req)
    var ext = path.extname(pathname)
    if (['.js', '.html', '.css'].indexOf(ext) !== -1){
        fs.stat(pathname, function(err, stat){
            if (err){
                proxyRequest(req, resp)
            }else{
                serveFromFs(req, resp)
            }
        })
    }else{
        req.pipe(request(req.url)).pipe(resp)
    }
}

http.createServer(server).listen(8081)
https.createServer(server).listen(8081)


console.log('Server listening on 8081')