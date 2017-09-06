// 京价宝
async function getNowPrice(sku) {
  var data = ''
  try {
    let resp = await fetch('https://item.m.jd.com/product/' + sku + '.html')
    data = await resp.text()
  } catch (e) {
    var request = new XMLHttpRequest();
    request.open('GET', 'https://item.m.jd.com/product/' + sku + '.html', false); 
    request.send(null);
    if (request.status === 200) {
      data = request.responseText
    } else {
      throw new  Error('GET Error')
    }
  }

  var product_name = $(data).find('.prod-title .title-text').text()
  var normal_price = $(data).find('#js-normalPrice .plus-price-row .plus-jd-price-text').text()
  var price = $(data).find('#jdPrice-copy').text()

  console.log(product_name + '最新价格', Number(normal_price.trim()), 'or', Number(price.trim()))

  if (normal_price) {
    return Number(normal_price.trim())
  } else {
    return Number(price.trim())
  }
}

async function dealProduct(product, order_info) {
  console.log('dealProduct', product)
  var product_name = product.find('.dc-txt').text()
  var order_price = Number(product.find('.dc-price').text().trim().substring(1))
  var order_sku = product.find('.dc-info .dc-btn').attr('id').split('_')
  var order_quantity =  Number(product.find('.dc-num').text().trim())
  console.log('发现有效的订单', product_name, order_price)
  var new_price = await getNowPrice(order_sku[2])
  console.log(product_name + '进行价格对比:', new_price, ' Vs ', order_price)
  order_info.goods.push({
    name: product_name,
    order_price: order_price,
    new_price: new_price,
    quantity: order_quantity
  })
  if ( new_price > 0 && new_price < order_price ) {
    $(product).find('.dc-info .dc-btn').trigger( "click" )
    chrome.runtime.sendMessage({
      text: "notice",
      title: '报告老板，发现价格保护计划！',
      content: product_name + '购买价：'+ order_price + ' 现价：' + new_price + '，已经自动提交价保申请'
    }, function(response) {
      console.log("Response: ", response);
    });
  }
}


async function dealOrder(order, orders) {
  var dealgoods = []
  var order_time = new Date(order.find('.detail-num p:last').text().trim().split('：')[1])
  console.log('订单时间', order_time)
  // 如果订单时间在15天以内
  if ( new Date().getTime() - order_time.getTime() < 15*24*3600*1000) {
    var order_info = {
      time: order_time,
      goods: []
    }
    console.log(order.find('.detail-in'))

    order.find('.detail-in').each(function() {
      dealgoods.push(dealProduct($(this), order_info))
    })

    await Promise.all(dealgoods)
    console.log('order_info', order_info)
    orders.push(order_info)
  }
}

async function getAllOrders() {
  console.log('京价宝开始自动检查订单')
  let orders = []
  let dealorders = []
  $( "#datas .search-detail" ).each(function() {
    dealorders.push(dealOrder($(this), orders))
  });
  await Promise.all(dealorders)
  chrome.runtime.sendMessage({
    text: "orders",
    content: JSON.stringify(orders)
  }, function(response) {
    console.log("Response: ", response);
  });
  localStorage.setItem('jjb_last_check', new Date().getTime());
}

var auto_login_html = "<p class='auto_login'><input type='checkbox' id='jjbAutoLogin'><label for='jjbAL'>记住密码，并为我自动登录（京价宝提供）</label></p>";


// 上次运行检查的时间已经过去一天了
$( document ).ready(function() {
  console.log('京价宝注入页面成功')


  // 是否登录
  if ( $(".us-line .us-name") && $(".us-line .us-name").text().length > 0 ) {
    chrome.runtime.sendMessage({
      text: "isLogin",
    }, function(response) {
      console.log("Response: ", response);
    });
  }

  // 记住密码
  if ( $(".loginPage").length > 0 ) {
    // 打开了登录页面
    chrome.runtime.sendMessage({
      text: "notLogin",
    }, function(response) {
      console.log("Response: ", response);
    });

    var jjb_username = localStorage.getItem('jjb_username')
    var jjb_password = localStorage.getItem('jjb_password')

    if (jjb_username && jjb_password) {
      var loginBtn = $("#loginBtn")
      $("#username").val(jjb_username)
      $("#password").val(jjb_password)
      $("#loginBtn").addClass("btn-active")
      setTimeout( function(){
        document.getElementById("loginBtn").click();
        document.getElementById("loginBtn").onclick();
      }, 500)
    } else {
      $(auto_login_html).insertAfter( ".loginPage .notice" )
      $("#loginBtn").on("click", function () {
        if ($("#jjbAutoLogin").is(":checked")) {
          var username = $("#username").val()
          var password = $("#password").val()
          localStorage.setItem('jjb_username', username)
          localStorage.setItem('jjb_password', password)
        }
      })
    }
  }

  // 签到
  if ( $(".btn-checkin").length > 0 && !$(".btn-checkin").hasClass('disabled')) {
    $(".btn-checkin").trigger( "click" )
    chrome.runtime.sendMessage({
      text: "notice",
      title: "京价宝自动为您签到领京豆",
      content: "具体领到多少就不清楚了，大概是5个"
    }, function(response) {
      console.log("Response: ", response);
    });
  }


  // 京东金融签到
  if ( $("#qyy-appSign").length > 0 && $("#appSign-btn").text() == "快抢钢镚") {
    $("#appSign-btn").trigger( "click" )
    chrome.runtime.sendMessage({
      text: "notice",
      title: "京价宝自动为您签到抢钢镚",
      content: "应该是领到了0.1个钢镚"
    }, function(response) {
      console.log("Response: ", response);
    });
  }

  // 领取 PLUS 券
  if ( $(".coupon-floor .coupon-item").length > 0 ) {
    var time = 5000;
    console.log('开始领取 PLUS 券')
    $(".coupon-floor .coupon-item").each(function() {
      var that = $(this)
      if ($(this).find('.get-btn').text() == '立即领取' ) {
        var coupon_name = that.find('.pin-lmt').text()
        var coupon_price = '面值：' + that.find('.cp-val').text() + '元 (' + that.find('.cp-lmt').text() + ')'
        setTimeout( function(){
          $(that).find('.get-btn').trigger( "click" )
          chrome.runtime.sendMessage({
            text: "coupon",
            title: "京价宝自动领到一张 PLUS 优惠券",
            content: coupon_price + coupon_name
          }, function(response) {
            console.log("Response: ", response);
          });
        }, time)
        time += 5000;
      }
    })
  }

  // 白赚
  if ( $(".dakaLightBox .dakaBtn").length > 0 && $(".dakaLightBox .dakaBtn:visible").length > 0) {
    $(".dakaLightBox .dakaBtn").trigger( "click" )
    chrome.runtime.sendMessage({
      text: "notice",
      title: "京价宝自动为您签到领钢镚",
      content: "连续签到7天可以领到一个钢镚"
    }, function(response) {
      console.log("Response: ", response);
    });
  }

  // 领取白条券
  if ( $(".coupon-list .js_coupon").length > 0 ) {
    var time = 5000;
    console.log('开始领取白条券')
    $(".coupon-list .js_coupon").each(function() {
      var that = $(this)
      if ($(this).find('.js_getCoupon').text() == '点击领取' ) {
        var coupon_name = that.find('.coupon_lineclamp').text()
        var coupon_price = '面值：' + that.find('.sc-money').text() + ' (' + that.find('.sc-message').text() + ')'
        setTimeout( function(){
          $(that).find('.get-btn').trigger( "click" )
          chrome.runtime.sendMessage({
            text: "coupon",
            title: "京价宝自动领到一张白条优惠券",
            content: coupon_price + coupon_name
          }, function(response) {
            console.log("Response: ", response);
          });
        }, time)
        time += 5000;
      }
    })
  }

  // 领取精选券
  if ( $("#couponListUl").length > 0 ) {
    var time = 5000;
    $("#couponListUl a.coupon-a").each(function() {
      var that = $(this)
      var coupon_name = that.find('.pro-info').text()
      var coupon_id = that.find("input[class=id]").val()
      var coupon_batch = that.find("input[class=batchId]").val()
      var coupon_price = '面值：' + that.find('.pro-price .big-price').text() + '元 (' + that.find('.pro-price .price-info').text() + ')'
      if ($(this).find('.coupon-btn').text() == '立即领取' ) {
        setTimeout( function(){
          $(that).find('.coupon-btn').trigger( "click" )
          chrome.runtime.sendMessage({
            text: "coupon",
            title: "京价宝自动领到一张新的优惠券",
            content: JSON.stringify({
              id: coupon_id,
              batch: coupon_batch,
              price: coupon_price,
              name: coupon_name
            })
          }, function(response) {
            console.log("Response: ", response);
          });
        }, time)
        time += 5000;
      }
    })
  }

  if ( $( "#datas ").length > 0 && $("#keyWords").attr("placeholder") == "请输入商品名称、商品编号、订单编号") {
    $('body').append('<div class="weui-mask weui-mask--visible"><h1>已经开始自动检查价格变化，您可以关闭窗口了</h1></div>')
    if ( $( "#datas .search-detail").length > 0) {
      chrome.runtime.sendMessage({
        text: "isLogin",
      }, function(response) {
        console.log("Response: ", response);
      });
      console.log('成功获取价格保护商品列表', new Date())
      var last_check = localStorage.getItem('jjb_last_check')
      if (!last_check || last_check < (new Date().getTime() - 2*3600*1000 )) {
        getAllOrders()
      } else {
        console.log('最近两小时已经检查过了..', new Date())
      }
    } else {
      console.log('好尴尬，最近没有买东西..', new Date())
    }
  }

});