jQuery(document).ready(function(){
   jQuery.ajax({
        type: "GET",
        url: "http://localhost:3000/listProducts",
        dataType: "json"
    })
    .done(function( response ) {
        var len = Object.keys(response).length;
        for(var i = 0; i < len; i++ ){
            var eachProd = jQuery('.products-grid li.item').eq(i);
            j = i + 1;
            if(typeof response[j] != 'undefined'){
                var name = response[j].data.info.name.$value;
                eachProd.find('.product-name a').text(name);
                
                var price = response[j].data.info.price.$value;
                price = '$'+Math.round(price);
                eachProd.find('.price-box span span.price').text(price);
                
                if(response[j].image.result){
                    if(response[j].image.result.item[0]){
                        var imageurl = response[j].image.result.item[0].url.$value;
                    }else{
                        var imageurl = response[j].image.result.item.url.$value;
                    }
                }
                eachProd.find('.product-image img').attr('src', imageurl);
            }
        }
    });
});