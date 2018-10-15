'use strict'
var express = require("express");
var path = require("path");
var template = require("art-template");
var session = require("express-session");
var bodyparser = require("body-parser");
var mongoose = require("mongoose");
var multer = require("multer");
var fs = require("fs");
var app = express();
// 下面三行设置渲染的引擎模板

mongoose.connect("mongodb://localhost/zsdr");

mongoose.connection.on("error", function () {
  console.log("连接数据库失败");
});
mongoose.connection.once("open", function () {
  console.log("连接数据库成功");
});
// Schema 数据库模型，一种以文件形式存储数据库的模型骨架／／
var Schema = mongoose.Schema;

// 创建用户信息模型，参数一表示模型的内容，参数二表示模型的名字
var productSchema = Schema({
  id: String,
  title: String, // 标题
  imgSrc: String, //图片
  remark: String, //介绍
  href: String, //跳转地址
  content: String,
  contents: String,
  type: String,
  types: String,
  imgList: Array,
  otherList: Array,
  subTitle: String
}, {
  collection: "Products"
});
var slideshowSchema = Schema({
  link: String
}, {
  collection: "Slideshows"
});
// 根据创建的用户数据库模型创建用户模型
// User 由schema生成的模型，具有抽象属性和行为的数据库操作对。
var Product = mongoose.model("Product", productSchema);
var Slideshow = mongoose.model("Slideshow", slideshowSchema);

// app.use(express.static(path.join(__dirname, "views")))
app.use(express.static(path.join(__dirname, "public")));

app.engine("html", require("express-art-template"));
app.set("view engine", "html");

app.use(bodyparser.json()); // 使用bodyparder中间件，
app.use(
  bodyparser.urlencoded({
    extended: true
  })
);
// 使用 session 中间件
app.use(
  session({
    secret: "secret", // 对session id 相关的cookie 进行签名
    resave: true,
    saveUninitialized: false, // 是否保存未初始化的会话
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 // 设置 session 的有效时间，单位毫秒
    }
  })
);

let uploadMulti = multer({
  dest: "public/upload/"
});

// 主页 轮播图渲染
app.get("/", (req, res) => {
  Slideshow.find(function (err, data) {
    if (err) {
      console.log(err);
    } else {
      res.render("index", {
        list: data.map(function (item) {
          var slideshow = item.toObject();
          slideshow.id = slideshow._id.toString();
          delete slideshow._id;
          return slideshow;
        })
      });
    }
  });
});
// 获取登录页面
app.get("/login", function (req, res) {
  res.sendFile(__dirname + "/login.html");
});
// 用户登录
app.post("/login", function (req, res) {
  function send(code, message) {
    res.status(200).json({
      code,
      message
    });
  }
  if (req.body.username == "admin" && req.body.password == "admin123") {
    req.session.userName = req.body.username; // 登录成功，设置 session
    send("success", "登录成功");
  } else {
    send("error", "用户名或密码错误");
    // 若登录失败，重定向到登录页面
  }
});
// 获取首页产品数据
app.get("/api/v1/productlist", function (req, res) {
  Product.find(function (err, data) {
    if (err) {
      console.log(err);
    } else {
      // console.log(data)
      res.json({
        list: data.map(function (item) {
          var product = item.toObject();
          delete product._id;
          delete product.__v;
          return product;
        })
      });
    }
  }).limit(6)
});
// product_detail.html产品详细信息页面获取数据
app.get("/api/v2/productlist", function (req, res) {
  if (req.query.type == 'yjcp') {
    Product.find({
      'type': req.query.type
    }, function (err, data) {
      if (err) {
        res.json({
          code: "error",
          message: "查询失败"
        });
      } else {
        // console.log(data)
        res.json({
          list: data
        });
      }
    }).limit(8)
  } else if (req.query.type == "yyrj") {
    Product.find({
      'type': req.query.type
    }, function (err, data) {
      if (err) {
        res.json({
          code: "error",
          message: "查询失败"
        });
      } else {
        // console.log(data)
        res.json({
          list: data
        });
      }
    }).limit(8)
  } else {
    Product.find({
      'type': req.query.type
    }, function (err, data) {
      if (err) {
        res.json({
          code: "error",
          message: "查询失败"
        });
      } else {
        // console.log(data)
        res.json({
          list: data
        });
      }
    }).limit(8)
  }

});
// home.html管理界面 轮播图管理
app.get("/home", function (req, res) {
  function getPages(currentPage, pageCount) {
    var pages = [currentPage];
    var left = currentPage - 1;
    var right = currentPage + 1;
    while (pages.length < 15 && (left >= 1 || right <= pageCount)) {
      if (left > 0) {
        pages.unshift(left--)
      }
      if (right <= pageCount) {
        pages.push(right++)
      }
    }
    return pages
  }
  if (req.session.userName) {
    //判断session 状态，如果有效，则返回主页，否则转到登录页面
    Slideshow.find(function (err, data) {
      if (err) {
        console.log(err);
      } else {
        var currentPage = 1
        var pageSize = 3
        Product.count({}, function (err, count) {
          if (err) {
            console.log(err)
          } else {
            var pageCount = Math.ceil(count / pageSize)
            Product.find(function (err1, data1) {
              if (err1) {
                console.log(err1);
              } else {
                var pages = getPages(currentPage, pageCount);
                res.render("home", {
                  list: data.map(function (item) {
                    var slideshow = item.toObject();
                    slideshow.id = slideshow._id.toString();
                    delete slideshow._id;
                    return slideshow;
                  }),
                  product: data1.map(function (item) {
                    var product = item.toObject()
                    return product
                  }),
                  page: currentPage,
                  pageCount: pageCount,
                  pages: pages
                });
              }
            }).limit(pageSize).skip((currentPage - 1) * pageSize);
          }
        })

      }
    });
  } else {
    res.redirect("login");
  }
});
// 后台列表查询
app.get('/list/:page', function (req, res) {
  function getPages(currentPage, pageCount) {
    var pages = [currentPage];
    var left = currentPage - 1;
    var right = currentPage + 1;
    while (pages.length < 15 && (left >= 1 || right <= pageCount)) {
      if (left > 0) {
        pages.unshift(left--)
      }
      if (right <= pageCount) {
        pages.push(right++)
      }
    }
    return pages
  }
  if (req.session.userName) {
  if (req.query.type == 'all') {
    var currentPage = 1
    if (req.params.page) {
      currentPage = req.params.page * 1
    }
    var pageSize = 3
    Product.count({}, function (err, count) {
      if (err) {
        console.log(err)
      } else {
        var pageCount = Math.ceil(count / pageSize)
        Product.find(function (err1, data1) {
          if (err1) {
            console.log(err1);
          } else {
            var pages = getPages(currentPage, pageCount);
            var type = req.query.type
            res.render("list", {
              product: data1.map(function (item) {
                var product = item.toObject()
                return product
              }),
              page: currentPage,
              pageCount: pageCount,
              pages: pages,
              type: type
            });
          }
        }).limit(pageSize).skip((currentPage - 1) * pageSize);
      }
    })
  } else if (req.query.type == 'yjcp') {
    var currentPage = 1
    if (req.params.page) {
      currentPage = req.params.page * 1
    }
    var pageSize = 3
    Product.count({
      'type': req.query.type
    }, function (err, count) {
      if (err) {
        console.log(err)
      } else {
        var pageCount = Math.ceil(count / pageSize)
        Product.find({
          'type': req.query.type
        }, function (err1, data1) {
          if (err1) {
            console.log(err1);
          } else {
            var pages = getPages(currentPage, pageCount);
            var type = req.query.type
            res.render("list", {
              product: data1.map(function (item) {
                var product = item.toObject()
                return product
              }),
              page: currentPage,
              pageCount: pageCount,
              pages: pages,
              type: type
            });
          }
        }).limit(pageSize).skip((currentPage - 1) * pageSize);
      }
    })
  } else if (req.query.type == 'yyrj') {
    var currentPage = 1
    if (req.params.page) {
      currentPage = req.params.page * 1
    }
    var pageSize = 3
    Product.count({
      'type': req.query.type
    }, function (err, count) {
      if (err) {
        console.log(err)
      } else {
        var pageCount = Math.ceil(count / pageSize)
        Product.find({
          'type': req.query.type
        }, function (err1, data1) {
          if (err1) {
            console.log(err1);
          } else {
            var pages = getPages(currentPage, pageCount);
            var type = req.query.type
            res.render("list", {
              product: data1.map(function (item) {
                var product = item.toObject()
                return product
              }),
              page: currentPage,
              pageCount: pageCount,
              pages: pages,
              type: type
            });
          }
        }).limit(pageSize).skip((currentPage - 1) * pageSize);
      }
    })
  } else {
    var currentPage = 1
    if (req.params.page) {
      currentPage = req.params.page * 1
    }
    var pageSize = 3
    Product.count({
      'type': req.query.type
    }, function (err, count) {
      if (err) {
        console.log(err)
      } else {
        var pageCount = Math.ceil(count / pageSize)
        Product.find({
          'type': req.query.type
        }, function (err1, data1) {
          if (err1) {
            console.log(err1);
          } else {
            var pages = getPages(currentPage, pageCount);
            var type = req.query.type
            res.render("list", {
              product: data1.map(function (item) {
                var product = item.toObject()
                return product
              }),
              page: currentPage,
              pageCount: pageCount,
              pages: pages,
              type: type
            });
          }
        }).limit(pageSize).skip((currentPage - 1) * pageSize);
      }
    })
  }

} else {
  res.redirect("/login");
}
})
// add.html产品添加
app.post(
  "/admin/product/add",
  uploadMulti.array("img", 3),
  (req, res, next) => {
    if (req.session.userName) {
    var product = Product(req.body);
    var id = product.toObject()._id.toString();
    var files = req.files;
    var fileInfos = [];
    var otherList = [];
    var types = ''
    fs.exists(`public/upload/product/${req.body.title}`, function (exists) {
      if (exists) {
        for (let i in files) {
          var file = files[i];
          fs.rename(file.path, "public/upload/product/" + req.body.title + "/" + file.originalname, function (err) {
            if (err) {
              throw err;
            }
          });
        }
      } else {
        fs.mkdir(`public/upload/product/${req.body.title}`, function (err) {
          if (err) {
            console.log(err)
          } else {
            for (let i in files) {
              var file = files[i];
              fs.rename(file.path, "public/upload/product/" + req.body.title + "/" + file.originalname, function (err) {
                if (err) {
                  throw err;
                }
              });
            }
          }
        })
      }
    })
    for (let i in files) {
      var file = files[i];
      var fileInfo = {};
      var style = {};
      style.backgroundImage = "url(/upload/product/" + req.body.title + "/" + file.originalname + ")";
      style.backgroundSize = "100%";
      style.backgroundRepeat = "no-repeat";
      style.backgroundPosition = "center";
      fileInfo.style = style;
      fileInfos.push(fileInfo);
    }
    if (req.body.type == "yjcp") {
      types = '硬件产品'
      otherList = [{
          label: "应用软件",
          link: 'product_detail.html?id=' + id + "&type=yyrj"
        },
        {
          label: "周边产品",
          link: 'product_detail.html?id=' + id + "&type=zbcp"
        }
      ];
    } else if (req.body.type == "yyrj") {
      types = '应用软件'
      otherList = [{
          label: "硬件产品",
          link: 'product_detail.html?id=' + id + "&type=yjcp"
        },
        {
          label: "周边产品",
          link: 'product_detail.html?id=' + id + "&type=zbcp"
        }
      ];
    } else {
      types = '周边产品'
      otherList = [{
          label: "硬件产品",
          link: 'product_detail.html?id=' + id + "&type=yjcp"
        },
        {
          label: "应用软件",
          link: 'product_detail.html?id=' + id + "&type=yyrj"
        }
      ];
    }
    var contentss = []
    contentss = req.body.content.split('。');
    var content = [];
    for (let i in contentss) {
      var str = `<p>${contentss[i]}。</p>`;
      content.push(str);
    }

    product.id = id;
    product.imgSrc = "upload/product/" + req.body.title + "/" + files[0].originalname;
    product.href = "product_detail.html?id=" + id + "&" + "type=" + req.body.type;
    product.imgList = fileInfos;
    product.otherList = otherList;
    product.types = types
    product.content = content.join("")
    product.contents = req.body.content
    product.save(function (err) {
      if (err) {
        res.json({
          code: "error",
          message: "添加失败"
        });
      } else {
        res.redirect("/home");
      }
    });
  } else {
    res.redirect("/login");
  }
  }
);
// product.html按照分类查询数据的条数
app.get('/api/v1/pagecount', function (req, res) {
  if (req.query.type == "all") {
    Product.find(function (err, data) {
      if (err) {
        res.json({
          code: "error",
          message: "查询失败"
        });
      } else {
        res.json({
          list: data
        });
      }
    })
  } else {
    Product.find({
      'type': req.query.type
    }, function (err, data) {
      if (err) {
        res.json({
          code: "error",
          message: "查询失败"
        });
      } else {
        res.json({
          list: data
        });
      }
    })
  }

})
// product.html按照分类查询数据
app.get("/api/v1/productData", function (req, res, next) {
  if (req.query.type == "all") {
    var currentpage = req.query.page
    var pageSize = 6
    Product.find(function (err, data) {
      if (err) {
        res.json({
          code: "error",
          message: "查询失败"
        });
      } else {
        res.json({
          list: data
        });
      }
    }).limit(pageSize).skip((currentpage - 1) * pageSize)
  } else {
    var currentpage = req.query.page
    var pageSize = 6
    Product.find({
      'type': req.query.type
    }, function (err, data) {
      if (err) {
        res.json({
          code: "error",
          message: "查询失败"
        });
      } else {
        res.json({
          list: data
        });
      }
    }).limit(pageSize).skip((currentpage - 1) * pageSize)
  }

})
// 根据id获取产品数据
app.get("/api/v1/productorData", function (req, res, next) {
  Product.findById(req.query.id, function (err, data) {
    if (err) {
      res.json({
        code: "error",
        message: "查询失败"
      });
    } else {
      res.json({
        list: data
      });
    }
  });
});
// 轮播图添加
app.post("/add", uploadMulti.single("slideshow"), (req, res, next) => {
  
  var file = req.file;
  var filename;
  fs.rename(file.path, "public/upload/slideshow/" + file.originalname, function (err) {
    if (err) {
      throw err;
    }
  });
  filename = file.originalname;
  var slideshow = Slideshow();
  slideshow.link = filename;
  slideshow.save(function (error) {
    if (error) {
      res.json({
        code: "error",
        message: "添加失败"
      });
    } else {
      res.redirect("/home");
    }
  });
});
// 轮播图删除
app.post("/delete/:id", function (req, res) {
  Slideshow.findByIdAndRemove(req.params.id, function (err) {
    if (err) {
      res.json({
        code: "error",
        message: "删除数据失败"
      });
    } else {
      res.json({
        code: "success",
        message: "删除数据成功"
      });
    }
  });
});
// 删除产品
app.post("/delete/product/:id", function (req, res) {
  // 删除文件夹
  function delFile(url) {
    var data = fs.readdirSync(url);
    for (var i = 0; i < data.length; i++) {
      var path = url + "/" + data[i];
      var stat = fs.statSync(path);
      if (stat.isFile()) {
        fs.unlinkSync(path);
      } else {
        delFile(path);
      }
    }
    fs.rmdirSync(url);
  }
  Product.findById(req.params.id, function (err, data) {
    if (err) {
      console.log(err)
    } else {
      fs.exists(`public/upload/product/${data.title}`,function(exists){
        if(exists){
          delFile(`public/upload/product/${data.title}`); //删除文件夹
        }
      })

    }
  })
  Product.findByIdAndRemove(req.params.id, function (err) {
    if (err) {
      res.json({
        code: "error",
        message: "删除数据失败"
      });
    } else {
      res.json({
        code: "success",
        message: "删除数据成功"
      });
    }
  });
});
// 获取修改页面
app.get('/edit/:id', function (req, res) {
  Product.findById(req.params.id, function (error, data) {
    if (error) {
      res.send('产品不存在')
    } else {
      var product = data.toObject();
      res.render('update', {
        product: product
      })
    }
  })
})
// 上传修改内容
app.post('/api/v1/edit/:id', uploadMulti.array('img', 3), function (req, res) {
  if (req.session.userName) {
  var data = req.body
  var files = req.files
  var fileInfos = [];
  var otherList = [];
  var types = ''
  fs.exists(`public/upload/product/${req.body.title}`, function (exists) {
    if (exists) {
      for (let i in files) {
        var file = files[i];
        fs.rename(file.path, "public/upload/product/" + req.body.title + "/" + file.originalname, function (err) {
          if (err) {
            throw err;
          }
        });
      }
    } else {
      fs.mkdir(`public/upload/product/${req.body.title}`, function (err) {
        if (err) {
          console.log(err)
        } else {
          for (let i in files) {
            var file = files[i];
            fs.rename(file.path, "public/upload/product/" + req.body.title + "/" + file.originalname, function (err) {
              if (err) {
                throw err;
              }
            });
          }
        }
      })
    }
  })
  for (let i in files) {
    var file = files[i];
    var fileInfo = {};
    var style = {};
    style.backgroundImage = "url(/upload/product/" + req.body.title + "/" + file.originalname + ")";
    style.backgroundSize = "100%";
    style.backgroundRepeat = "no-repeat";
    style.backgroundPosition = "center";
    fileInfo.style = style;
    fileInfos.push(fileInfo);
  }
  if (req.body.type == "yjcp") {
    types = '硬件产品'
    otherList = [{
        label: "应用软件",
        link: 'product_detail.html?id=' + req.params.id + "&type=yyrj"
      },
      {
        label: "周边产品",
        link: 'product_detail.html?id=' + req.params.id + "&type=zbcp"
      }
    ];
  } else if (req.body.type == "yyrj") {
    types = '应用软件'
    otherList = [{
        label: "硬件产品",
        link: 'product_detail.html?id=' + req.params.id + "&type=yjcp"
      },
      {
        label: "周边产品",
        link: 'product_detail.html?id=' + req.params.id + "&type=zbcp"
      }
    ];
  } else {
    types = '周边产品'
    otherList = [{
        label: "硬件产品",
        link: 'product_detail.html?id=' + req.params.id + "&type=yjcp"
      },
      {
        label: "应用软件",
        link: 'product_detail.html?id=' + req.params.id + "&type=yyrj"
      }
    ];
  }
  var contentss = req.body.content.split('。');
  var content = [];
  for (let i in contentss) {
    var str = `<p>${contentss[i]}。</p>`;
    content.push(str);
  }
  data.imgSrc = "upload/product/" + req.body.title + "/" + files[0].originalname;
  data.href = "product_detail.html?id=" + req.params.id + "&" + "type=" + req.body.type;
  data.imgList = fileInfos;
  data.otherList = otherList;
  data.types = types
  data.contents = req.body.content
  data.content = content.join("");
  Product.findByIdAndUpdate(req.params.id, data, function (error) {
    if (error) {
      res.json({
        code: 'error',
        message: '修改失败'
      })
    } else {
      res.redirect("/home");

    }
  })
} else {
  res.redirect("/login");
}
})
// 退出
app.get("/logout", function (req, res) {
  req.session.userName = null; // 删除session
  res.redirect("/");
});
app.listen(3000, function () {
  console.log("http://localhost:3000");
});