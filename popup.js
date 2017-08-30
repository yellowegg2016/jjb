$( document ).ready(function() {
  var orders = JSON.parse(localStorage.getItem('jjb_orders'))
  var last_check = localStorage.getItem('jjb_last_check')
  orders = orders.map(function (order) {
    order.time = moment(order.time).locale('zh-cn').calendar()
    return order
  })
  if (last_check) {
    $('#last_check').text(moment(last_check).locale('zh-cn').calendar())
  }
  if (orders) {
    var orders_html = template('tpl-orders', {
      orders: orders
    });
    $('.orders').html(orders_html)
  }
})
