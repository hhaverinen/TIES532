var Dropbox = require('dropbox');
var request = require('request');
var xml2js = require('xml2js');
var md5 = require('md5');
var fs = require('fs');

var db_key = '3a30dgfp45ufpmh';
var db_secret = '2hy2qujs4vdnxr4';
var db_accesstoken = '8bL7cF9QDZAAAAAAAAAACchf4Ih1b_lcB_dVSnSUpcsZLmao1IU-FCXSjbK8bvi0'; //TODO: get this with OAUTH
var ss_key = 'LN5IKXSIF8';

var dbx = new Dropbox({ accessToken: db_accesstoken });


// gets all the files from dropbox recursively
var listFiles = function(dbx, cursor) {
    if (!cursor) {
        dbx.filesListFolder({ path: '', recursive: true })
            .then(function(response) {
                response.entries.forEach(function(item) {
                    console.log(item);                    
                });
                if (response.has_more) {
                    listFiles(dbx, response.cursor);
            }})
            .catch(function(error) {
                console.log(error);
            });
    } else {
        dbx.filesListFolderContinue({ cursor: cursor })
            .then(function(response) {
                response.entries.forEach(function(item) {
                    console.log(item);                    
                });
                if (response.has_more) {
                    listFiles(dbx, response.cursor);
            }})
            .catch(function(error) {
                console.log(error);
            });
    }
}

// gets sendspace sessionkey for current session
var getSendspaceSessionkey = function(handler) {
    var token;
    request('http://api.sendspace.com/rest/?method=auth.createtoken&api_key=LN5IKXSIF8&api_version=1.2', function(error, response, body) {
        var parser = new xml2js.Parser({explicitArray: false});
        parser.parseString(body, function(err, result) {
            token = result.result.token;
        });
        
        if (token) {
            var email = 'henrin.testailu@gmail.com';
            var pw = 'passwordHere';
            var tokened_pw = md5(token + md5(pw).toLowerCase()).toLowerCase();
            
            request('http://api.sendspace.com/rest/?method=auth.login&token='+token+'&user_name='+email+'&tokened_password='+tokened_pw, function(error, response, body) {
                parser.parseString(body, function(err, result) {
                    handler(result.result.session_key);
                });
            });
        }
    });
}

var getUploadUrl = function(session_key) {
    request('http://api.sendspace.com/rest/?method=upload.getinfo&session_key='+session_key, function(error, response, body) {
        var parser = new xml2js.Parser({explicitArray: false});
        parser.parseString(body, function(err, result) {
            var uploadObj = result.result.upload.$;
            console.log(uploadObj);
            
            var formData = {
                MAX_FILE_SIZE: uploadObj.max_file_size,
                UPLOAD_IDENTIFIER: uploadObj.upload_identifier,
                extra_info: uploadObj.extra_info,
                userfile: fs.createReadStream('testi.txt')
            };

            request.post({url:uploadObj.url, formData: formData}, function(error, response, body) {
                console.log(body);
            });
        });
    });
}

module.exports = function() {
    //listFiles(dbx);
    getSendspaceSessionkey(getUploadUrl);
    
    return "Terve mualima!";
}