// 京价宝
async function getNowPrice(sku) {
  let resp = await fetch('https://item.m.jd.com/product/' + sku + '.html')
  let data = await resp.text()
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
  var order_sku = product.find('.dc-info .dc-btn').attr('id').split('_')[2]
  var order_quantity =  Number(product.find('.dc-num').text().trim())
  console.log('发现有效的订单', product_name, order_price)
  var new_price = await getNowPrice(order_sku)
  console.log(product_name + '进行价格对比:', new_price, ' Vs ', order_price)
  order_info.goods.push({
    name: product_name,
    order_price: order_price,
    new_price: new_price,
    quantity: order_quantity
  })
  if ( new_price > 0 && new_price < order_price ) {
    product.find('.dc-info .dc-btn').trigger( "click" )
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


// 上次运行检查的时间已经过去一天了
$( document ).ready(function() {
  console.log('京价宝注入页面成功')
  if ( $( "#datas ").length > 0 && $("#keyWords").attr("placeholder") == "请输入商品名称、商品编号、订单编号") {
    $('body').append('<div class="weui-mask weui-mask--visible"><h1>已经开始自动检查价格变化，您可以关闭窗口了</h1></div>')
    if ( $( "#datas .search-detail").length > 0) {
      console.log('成功获取价格保护商品列表')
      var last_check = localStorage.getItem('jjb_last_check')
      if (!last_check || last_check < (new Date().getTime() - 24*3600*1000 )) {
        getAllOrders()
      } else {
        console.log('今天已经检查过了..')
      }
    }
  } else {
    if ($( window ).width() > 800 && $( ".txt-quickReg").text() == '手机快速注册') {
      console.log('还未登录，打开登录窗口')
      chrome.runtime.sendMessage({text: "needLogin"}, function(response) {
        console.log("Response: ", response);
      });
    }
  }
});