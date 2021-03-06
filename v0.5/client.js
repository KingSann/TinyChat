// Generated by CoffeeScript 1.12.7
(function() {
  var Cmd, addimg, addmsg, addsys, args, col, colors, disable, fs, io, md5, readline, socket, url, usepip;

  io = require("socket.io-client");

  fs = require("fs");

  md5 = require("md5");

  readline = require("readline");

  colors = require("colors");

  disable = {
    notice: false
  };

  col = ["#e21400", "#91580f", "#f8a700", "#f78b00", "#58dc00", "#287b00", "#a8f07a", "#4ae8c4", "#3b88eb", "#3824aa", "#a700ff", "#d300e7"];

  addmsg = function(username, msg, time, ishist) {
    if (usepip) {
      return console.log("<div class=\"msg\">\n    <span class=\"username\" color=\"" + col[parseInt(md5(username), 16) % col.length] + "\">" + (ishist ? "(leave) " : "") + username + "</span>\n    <span class=\"time\" style=\"display: none;\">" + time + "</span>\n    <span class=\"say\">" + msg + "</span>\n</div>");
    } else {
      console.log("" + (ishist ? "(leave) " : "") + username.red + " " + time.blue + ": " + msg);
      if (!disable.notice) {
        return process.stdout.write("\x07");
      }
    }
  };

  addsys = function(msg, time) {
    if (usepip) {
      return console.log("        <div class=\"msg\">\n		    <span class=\"time\" style=\"display: none;\">" + time + "</span>\n		    <span class=\"sys\">" + msg + "</span>\n</div>");
    } else {
      console.log("sys".gray + " " + time.blue + ": " + msg.gray);
      if (!disable.notice) {
        return process.stdout.write("\x07");
      }
    }
  };

  addimg = function(username, msg, time, ishist) {
    if (usepip) {
      return console.log("        <div class=\"msg\">\n		    <span class=\"username\" color=\"" + col[parseInt(md5(username), 16) % col.length] + "\">" + (ishist ? "(leave) " : "") + username + "</span>\n		    <span class=\"time\" style=\"display: none;\">" + time + "</span>\n		    <img class=\"img\" src=\"" + msg + "\"></img>\n</div>");
    } else {
      console.log("# " + (ishist ? "(leave) " : "") + username.red + " " + time.blue + ": [img]");
      if (!disable.notice) {
        return process.stdout.write("\x07");
      }
    }
  };

  Cmd = (function() {
    function Cmd() {}

    Cmd.cache = {};

    Cmd.info = {};

    Cmd.set = function(key, info, val) {
      this.info[key] = info;
      return this.cache[key] = val;
    };

    Cmd.feed = function(str) {
      var key, ref, val;
      ref = this.cache;
      for (key in ref) {
        val = ref[key];
        if ((str.slice(0, +(key.length - 1) + 1 || 9e9) === key && str[key.length] === " ") || (str === key)) {
          val(str.slice(key.length + 1));
          return true;
        }
      }
      return false;
    };

    return Cmd;

  })();

  Cmd.set("/login", "如果需要登录, 使用: /login 用户名 密码", function(data) {
    var password, ref, roomname, roompassword, username;
    ref = data.split(" "), username = ref[0], password = ref[1], roomname = ref[2], roompassword = ref[3];
    socket.emit("login", {
      username: username,
      password: password
    });
    if (roomname) {
      return socket.emit("join", {
        roomname: roomname,
        roompassword: roompassword
      });
    }
  });

  Cmd.set("/join", "如果需要加入房间, 使用: /join 房间名 房间密码", function(data) {
    var ref, roomname, roompassword;
    ref = data.split(" "), roomname = ref[0], roompassword = ref[1];
    return socket.emit("join", {
      roomname: roomname,
      roompassword: roompassword
    });
  });

  Cmd.set("/logout", "如果需要登出, 使用: /logout", function() {
    return socket.emit("logout");
  });

  Cmd.set("/eraseHist", "如果需要清空留言, 使用: /eraseHist", function() {
    return socket.emit("eraseHist");
  });

  Cmd.set("/leave", "如果需要离开房间, 使用: /leave", function() {
    return socket.emit("leave");
  });

  Cmd.set("/lvmsg", "如果需要留言, 使用: /lvmsg 文字", function(data) {
    return socket.emit("message", {
      type: "text",
      data: data,
      ishist: true
    });
  });

  Cmd.set("/help", "如果需要查看命令, 使用: /help", function(data) {
    if (Cmd.info[data]) {
      return addsys(Cmd.info[data], "");
    } else {
      return addsys("command not found: /help " + data, "");
    }
  });

  Cmd.set("/manual", "如果需要查看命令列表, 使用: /manual", function() {
    var key, ref, results, val;
    ref = Cmd.info;
    results = [];
    for (key in ref) {
      val = ref[key];
      results.push(addsys(val, ""));
    }
    return results;
  });

  Cmd.set("/info", "如果需要获取信息, 使用: /info [curuser | me | room | leftmsg]", function(data) {
    return socket.emit("info", {
      data: data
    });
  });

  Cmd.set("/switch", "如果需要修改开关, 使用: /switch [disable | enable] [notice]", function(data) {
    var obj, ref, type;
    ref = data.split(" "), type = ref[0], obj = ref[1];
    if (obj === "notice") {
      if (type === "disable") {
        return disable.notice = true;
      } else if (type === "enable") {
        return disable.notice = false;
      } else {
        return addsys("command not found: /switch " + data, "");
      }
    } else {
      return addsys("command not found: /switch " + data, "");
    }
  });

  args = process.argv.splice(2);

  if (args.length !== 2) {
    console.log("usage: node client.js http://{server url} {use pipe?}");
    process.exit(0);
  }

  url = args[0];

  usepip = (args[1] === "true" ? true : false);

  socket = io.connect(url);

  socket.on("sys", function(data) {
    return addsys(data.data, data.time);
  });

  socket.on("new message", function(data) {
    return addmsg(data.username, data.data, data.time, data.ishist);
  });

  socket.on("new image", function(data) {
    return addimg(data.username, data.data, data.time, data.ishist);
  });

  socket.on("disconnect", function(data) {
    return process.exit(0);
  });

  readline.createInterface({
    input: process.stdin,
    output: process.stdout
  }).on("line", function(line) {
    line = line.trim();
    if (line[0] === "/") {
      if (!Cmd.feed(line)) {
        return addsys("command not found: " + line, "");
      }
    } else {
      return socket.emit("message", {
        type: "text",
        data: line,
        ishist: false
      });
    }
  });

}).call(this);

//# sourceMappingURL=client.js.map
