var request = require('request')
var mkdirp = require('mkdirp')
var http = require('http')
var fs = require('fs')
var path = require('path')

var baseDir = 'data'

function filePathForReq(req){
    var host = req.headers.host
    var method = req.method
    var url = req.url
    var uri = url.match(/^http\:\/\/[^\/]+(\/[^?]*)/)[1]
    return path.join(baseDir, host, uri)
}

function pathIsDir(pathname){
    return pathname[pathname.length - 1] === '/'
}

function proxyRequest(req, resp){
    console.log(req.method + ' ' + req.url + ' [net]')
    var proxyReq = request({
        url: req.url
    }, function(err, mesg, body){
        var pathname = filePathForReq(req)
        if (pathIsDir(pathname)){
            pathname += 'index.html'
        }
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
    if (pathIsDir(pathname)){
        pathname += 'index.html'
    }
    console.log(req.method + ' ' + req.url + ' [fs]')
    fs.readFile(pathname, function(err, data){
        if (err){
            proxyRequest(req, resp)
            return
        }
        resp.end(data)
    })
}

http.createServer(function (req, resp) {
    var pathname = filePathForReq(req)
    fs.stat(pathname, function(err, stat){
        if (err){
            proxyRequest(req, resp)
            return
        }else{
            serveFromFs(req, resp)
        }
    })
    //req.pipe(proxyReq).pipe(resp)
}).listen(8081)

console.log('Server listening on 8081')