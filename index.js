var express = require('express');
var path = require('path');
var loopback = require('loopback');
var app = express();

// render the static html page
var staticPath = path.resolve(__dirname, '.');
app.use(express.static(staticPath));

app.listen(3000, function(){
  console.log('listening on 3000');
});

// create a datasource from the SOAP API
var ds = loopback.createDataSource('soap',
{
  connector: require('./loopback/index.js'),
  wsdl: 'http://demo.pravams.com/api/v2_soap?wsdl=1' // The url to WSDL
});

ds.once('connected', function(){
  var magentoSoap = ds.createModel('magentoSoap', {});
  var args = {username: 'demosoapuser', apiKey: 'demosoapuser'};
  magentoSoap.login(args, function(err, response){
    var sessionId = response.loginReturn.$value;
    console.log(sessionId);
    
    // get products assigned to category 12
    var argscp = { sessionId: sessionId, categoryId : 27 };
    magentoSoap.catalogCategoryAssignedProducts(argscp, function(err, response){
      var productIds = {};
      function ProductInfo (id) {
        this.id;
        this.data;
      }
      
      function getProductData(j, loopCounter){
        var product = new ProductInfo(j);
        product.id = response.result.item[j].product_id.$value;
        productIds[j] = product;
        
        /* get the products data */
        var argsproduct = { sessionId: sessionId, productId: product.id };
        magentoSoap.catalogProductInfo(argsproduct, function(err, resultproduct){
          productIds[j].data = resultproduct;
          
          console.log('loading product'+product.id);
          if(j < loopCounter) {
            getProductData(j+1, loopCounter);
          }
          
          /* when the loop is complete for all the products */
          if(j == loopCounter) {
            console.log(productIds);
            
            /* get the product images */
            function getProductImages(k, productIds, loopCounter) {
              var argsproductimage = {sessionId: sessionId, product: productIds[k].id };
              magentoSoap.catalogProductAttributeMediaList(argsproductimage, function(err, resultproductimage){
                debugger;
                productIds[k].image = resultproductimage;
                if(k < loopCounter){
                  getProductImages(k+1, productIds, loopCounter)
                } else if (k == loopCounter) {
                  console.log('All products loaded');
                  /* all products are finished loading */
                  app.get('/listProducts', function(req,res, next){
                    res.send(JSON.stringify(productIds));
                  });
                }
              });
            }
            var k = 0;
            getProductImages(k, productIds, loopCounter);
          }
        });
      }
      
      var j = 0;
      var loopCounter = response.result.item.length;
      // decrement the counter as the loop is starting from 0
      loopCounter = loopCounter - 1;
      getProductData(j, loopCounter);
      
      app.get('/listCategories', function(req,res,next){
        console.log('Categories loaded');
        res.send(JSON.stringify(response));
      });
    });
  });
});
