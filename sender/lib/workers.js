var path = require('path');
var fs = require('fs');
var config = require('./config');
var _data = require('./data');
var helpers = require('./helpers');
var sqlite3 = require('sqlite3').verbose();
var request = require('request');
var util = require('util');
var debug = util.debuglog('workers');
var workers = {};
workers.performFileSync = function(){
  _data.list(config.dataDirectory,function(err, filestosync){
    if(!err && filestosync && filestosync.length > 0){
      let sqlitedb = _data.sqliteconnect;
      filestosync.forEach(function(filetosync){
        let syncfilename = filetosync+config.defaultFileExtension;
        sqlitedb.get("SELECT COUNT(*) AS foundrows FROM synclog WHERE filename = ?", [syncfilename], (err, rows) => {
          if (err) throw err;
          if(rows){
            if(rows.foundrows == 0){
              var formData = {
                filetosync: fs.createReadStream(_data.baseDir+syncfilename)
              };
              request.post({url:config.endPointURL+'/dataservices/uploadFile', formData: formData}, function optionalCallback(err, httpResponse, body) {
                if (err) {
                  return console.error('Sinkronisasi gagal:', err);
                }
                var response = helpers.parseJsonToObject(body);
                sqlitedb.run("INSERT INTO synclog(filename,dt_sync) VALUES(?,?)", [response.filename, Date.now()]);
                console.log('Upload berhasil. File terkirim:', response.filename);
              });
            } else {
              console.log('\x1b[35m%s\x1b[0m','Proses @'+Date.now()+' - Tidak menemukan file untuk sinkronisasi.');
              return false;
            }
          } else {
            console.log('\x1b[35m%s\x1b[0m','Proses @'+Date.now()+' - Tidak menemukan file untuk sinkronisasi.');
            return false;
          }
        });
      });
    } else {
      console.log('\x1b[36m%s\x1b[0m',''+err+' - Tidak menemukan file untuk sinkronisasi.');
      return false;
    }
  });
};
workers.loop = function(){
  setInterval(function(){
    workers.performFileSync();
  }, 1000 * 60 * 1);
};
workers.init = function(){
  console.log('\x1b[33m%s\x1b[0m','Proses sinkronisasi file: aktif.');
  workers.performFileSync();
  workers.loop();
};
module.exports = workers;