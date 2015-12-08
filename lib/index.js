(function() {
  var EventEmitter, MongooseWrangler, fs, main, mongoose, path,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  fs = require('fs');

  path = require('path');

  EventEmitter = require('events').EventEmitter;

  mongoose = require('mongoose');

  MongooseWrangler = (function(superClass) {
    extend(MongooseWrangler, superClass);

    MongooseWrangler.mongoose = mongoose;

    MongooseWrangler.Long = mongoose.mongo.Long;

    //MongooseWrangler.additional = [];
    MongooseWrangler.additional = {};

    MongooseWrangler.Grid = require('gridfs-stream');

    MongooseWrangler.gridfs = void 0;

    function MongooseWrangler(options1) {
      var base, base1, base2, base3, base4, base5;
      this.options = options1 != null ? options1 : {};
      this.hasConnected = false;
      this.keepConnected = true;
      if ((base = this.options).debug == null) {
        base.debug = false;
      }
      if ((base1 = this.options).address == null) {
        base1.address = "127.0.0.1";
      }
      if ((base2 = this.options).db == null) {
        base2.db = "test";
      }
      if ((base3 = this.options).datatable == null) {
        base3.datatable = false;
      }
      if ((base4 = this.options).gridfs == null) {
        base4.gridfs = false;
      }
      if ((base5 = this.options).modelPath == null) {
        base5.modelPath = "./models";
      }
      this.configureMongoose();
    }

    MongooseWrangler.prototype.configureMongoose = function() {
      if (this.options.datatable) {
        this.useDataTable();
      }
      this.connect();
      if (this.options.gridfs) {
        mongoose.connection.once('open', (function(_this) {
          return function() {
            return _this.useGridFs();
          };
        })(this));
      }
      mongoose.connection.on('connected', (function(_this) {
        return function() {
          console.log("mongoose-wrangler: Connected to mongoDB");
          _this.hasConnected = true;
          return _this.emit('connected');
        };
      })(this));
      mongoose.connection.on('error', (function(_this) {
        return function(err) {
          return console.log("mongoose-wrangler: mongoDB error: " + err);
        };
      })(this));
      mongoose.connection.on('disconnected', (function(_this) {
        return function() {
          _this.emit('disconnected');
          if (!_this.hasConnected && _this.keepConnected) {
            console.log("mongoose-wrangler: Reconnecting to mongoDB");
            return setTimeout(function() {
              return _this.connect();
            }, 1000);
          }
        };
      })(this));
      return this.loadModels(this.options.modelPath, undefined, this.options.settings);
    };

    MongooseWrangler.prototype.loadModels = function(modelPath, conn, settings) {
      if (fs.existsSync(modelPath)) {
        return fs.readdirSync(modelPath).forEach((function(_this) {
          return function(file) {
            var m;
            if (file.match(/\.js|coffee$/)) {
              if (_this.options.debug) {
                console.log("Loading mongoose model: " + file);
              }
              m = require(path.join(process.cwd(), modelPath, file));
              if (m.model) {
                if (conn) {
                  return m.model(conn, settings);
                } else {
                  return m.model(mongoose, settings);
                }
              } else if (conn) {
                return console.log("WARNING: Connection was specified, but Model does not export model(connection) function");
              }
            }
          };
        })(this));
      } else {
        if (this.options.debug) {
          return console.log("No mongoose models found in " + modelPath);
        }
      }
    };

    MongooseWrangler.prototype.useDataTable = function() {
      var DataTable;
      if (this.options.debug) {
        console.log("Registering mongoose-datatable plugin");
      }
      DataTable = require('mongoose-datatable');
      DataTable.configure({
        verbose: false,
        debug: false
      });
      return mongoose.plugin(DataTable.init);
    };

    MongooseWrangler.prototype.useGridFs = function() {
      if (this.options.debug) {
        console.log("Registering gridfs-stream plugin");
      }
      MongooseWrangler.Grid.mongo = mongoose.mongo;
      return MongooseWrangler.gridfs = MongooseWrangler.Grid(mongoose.connection.db);
    };

    MongooseWrangler.prototype.connect = function() {
      var a, c, i, len, options, ref, results, uri;
      this.keepConnected = true;
      uri = "mongodb://" + this.options.address + "/" + this.options.db;
      if (this.options.debug) {
        console.log("Connecting to mongoDB at " + uri);
      }
      options = {
        server: {
          auto_reconnect: true,
          socketOptions: {
            autoReconnect: true,
            keepAlive: 1
          }
        }
      };
      mongoose.connect(uri, options);
      if (this.options.additional) {
        ref = this.options.additional;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          a = ref[i];
          uri = "mongodb://" + a.address + "/" + a.db;
          c = mongoose.createConnection(uri, options);
          c.on('connected', function() {
            return console.log('connected to additional');
          });
          c.on('error', function(err) {
            return console.log("mongoose-wrangler: additional mongoDB error: " + err);
          });
          if (a.modelPath) {
            this.loadModels(a.modelPath, c, this.options.settings);
          }
          //results.push(MongooseWrangler.additional.push(c));
          if(MongooseWrangler.additional[a.name]) {
            throw new Error('mongoose-wrangler: Connections with same name: ' + a.name);
          }

          MongooseWrangler.additional[a.name] = c;
          results.push(Object.keys(MongooseWrangler.additional).length);
        }
        return results;
      }
    };

    MongooseWrangler.prototype.disconnect = function() {
      this.keepConnected = false;
      console.log("mongoose-wrangler: Disconnecting from mongoDB");
      return mongoose.disconnect();
    };

    return MongooseWrangler;

  })(EventEmitter);

  module.exports = MongooseWrangler;

  main = function() {
    var x;
    return x = new MongooseWrangler({
      debug: true
    });
  };

  if (require.main === module) {
    main();
  }

}).call(this);
