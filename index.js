var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var  mysql =require('mysql');
var session = require('express-session');




var MongoClient= require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url,function(err,db){
    if(err) throw err;
   var dbo= db.db('mydb');
   db.close();
   });

var app = express();

app.use(express.static('public'));
app.set('view engine','ejs');

app.listen(8081);
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({secret:"secret"}))




function isProductInCart(cart,id){
    for(let i=0;i<cart.length;i++){
        if(cart[i].id == id){
            return true;

        }

    }
    return false;

}




function calculateTotal(cart,req){
    total = 0;
    for(let i=0; i<cart.length; i++){
        // if we are offering a discounted price
        if(cart[i].sale_price){
            total=total + (cart[i].sale_price*cart[i].quantity);
            // total=total + (cart[i].sale_price*2);
        }else{
            total = total + (cart[i].price*cart[i].quantity);
            // total = total + (cart[i].price*3);
        }

    }
    req.session.total = total;
    return total;

}






app.get('/',function(req,res){
    // res.send("Hello")
    var MongoClient= require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";
    
    MongoClient.connect(url,function(err,db){
        if(err) throw err;
       var dbo= db.db('mydb');
       dbo.collection('product').find({}).toArray(function(err,result){
        if(err) throw err;
         res.render('pages/index',{result:result});
        // console.log(result)
        db.close();
       });
    });
    




});


app.post('/add_to_cart',function(req,res){
    var id = req.body.id;
    var name = req.body.name;
    var price = req.body.price;
    var sale_price = req.body.sale_price;
    var quantity = req.body.quantity;
    var image = req.body.image;
    var product= {id:id,name:name,price:price,sale_price:sale_price,quantity:quantity,image:image};

    if(req.session.cart){
        var cart= req.session.cart;

        if(!isProductInCart(cart,id)){

            cart.push(product);

        }
    }else{
        req.session.cart = [product];
        var cart = req.session.cart;


    }


    // calculate total
    calculateTotal(cart,req);

    //return to cart page
    res.redirect('/cart');

});





app.get('/cart',function(req,res){
    var cart = req.session.cart;
    var total = req.session.total;

    res.render('pages/cart',{cart:cart,total:total});

});

app.post('/remove_product',function(req,res){
    var id =req.body.id;
    var cart =req.session.cart;

    for(let i=0;i<cart.length;i++){
        if(cart[i].id==id){
            // remove a product
            cart.splice(cart.indexOf(i),1);

        }

    }

    // recalculate total
    calculateTotal(cart,req);
    res.redirect('/cart');

});

app.post('/edit_product_quantity',function(req,res){
    //get values from inputs
    var id= req.body.id;
    var quantity = req.body.quantity;
    var increase_btn = req.body.increase_product_quantity_btn; 
    var decrease_btn = req.body.decrease_product_quantity_btn; 



    var cart = req.session.cart; 

    if(increase_btn){

        for(let i=0; i<cart.length; i++){
            if(cart[i].id == id){
                if(cart[i].quantity > 0){
                    cart[i].quantity = parseInt(cart[i].quantity)+1;

                }

            }

        }

    }




    if(decrease_btn){

        for(let i=0; i<cart.length; i++){
            if(cart[i].id == id){
                if(cart[i].quantity > 1){
                    cart[i].quantity = parseInt(cart[i].quantity)-1;

                }

            }

        }

    }

    calculateTotal(cart,req);
    res.redirect('/cart');




})


app.get('/checkout',function(req,res){
    var total = req.session.total;
    res.render('pages/checkout',{total:total});

})
// vendor page
app.get('/vendor',function(req,res){
    var total = req.session.total;
    res.render('pages/vendor',{total:total});

})

app.post('/place_order',function(req,res){
    var name = req.body.name;
    var email = req.body.email;
    var phone = req.body.phone;
    var city = req.body.city;
    var address = req.body.address;
    var cost = req.session.total;
    var status = "not paid";
    var date = new Date();
    var products_ids = ""; 
    var id = Date.now();
    req.session.order_id = id;




    var cart = req.session.cart;
    for(let i=0; i<cart.length; i++){
        products_ids = products_ids + "," +cart[i].id;

    }

    var MongoClient= require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/"; 

    MongoClient.connect(url,function(err,db){
    if(err) throw err;
    var dbo=db.db("mydb");
    var myobj=[
     {id:id,cost:cost,name:name,email:email,status:status,city:city,address:address,phone:phone,date:date,products_ids:products_ids}
    ];
    dbo.collection("order").insertMany(myobj,function(err,result){
        for( let i=0;i<cart.length;i++){

            var myobj=[
                {order_id:id,product_id:cart[i].id,product_name:cart[i].name,product_price:cart[i].price,product_image:cart[i].image,product_quantity:cart[i].quantity,order_date:new Date()}
               ];
               dbo.collection("order_items").insertMany(myobj,function(err,result){

     if(err) throw err;
               

     res.redirect('/payment')
               });
            }
 });
});








    


    //     }

    // })
    


});





//<------ for vendor in products---->


app.post('/vendor',function(req,res){

    var name = req.body.name;
    var description = req.body.description;
    var price = req.body.price;
    var sale_price = req.body.sale_price;
    var quantity = req.body.quantity;
    var image = req.body.image;
    var cost = req.session.total;
    var date = new Date();
    var category = req.body.category;
    var type = req.body.type;



  


 var MongoClient= require('mongodb').MongoClient;
       var url = "mongodb://localhost:27017/"; 

       MongoClient.connect(url,function(err,db){
       if(err) throw err;
       var dbo=db.db("mydb");
       var myobj=[
        {name:name,description:description,price:price,sale_price:sale_price,quantity:quantity,image:image,category:category,type:type}
       ];
       dbo.collection("product").insertMany(myobj,function(err,result){
        if(err) throw err;

        res.redirect('/payment')
        db.close();
    });
 });


})


app.get('/payment',function(req,res){
    var total = req.session.total;
    res.render('pages/payment',{total:total})

})

app.get('/verify_payment',function(req,res){
    var transaction_id = req.query.transaction_id;
    var order_id =req.session.order_id;

 



        var MongoClient= require('mongodb').MongoClient;
       var url = "mongodb://localhost:27017/"; 

       MongoClient.connect(url,function(err,db){
       if(err) throw err;
       var dbo=db.db("mydb");
       var myobj=[
        {order_id:order_id,transaction_id:transaction_id,date:new Date()}
       ];
       dbo.collection("payments").insertMany(myobj,function(err,res){
        if(err) throw err;
        // con.query("UPDATE orders SET status='paid' WHERE id='"+order_id+"'",(err,result)=>{}) // // // 

        var myquery={_id:'"order_id"'};
       var newvalues= {$set:{status:"paid"} };
       dbo.collection('orders').updateOne(myquery,newvalues,function(err,result){})

        res.redirect('/thank_you')
        db.close();
    });
 });



})



app.get("/thank_you",function(req,res){
    var order_id = req.session.order_id;
    res.render("pages/thank_you",{order_id:order_id})
    

})


app.get('/single_product',function(req,res){

var id1 = req.query._id;


//

var MongoClient= require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url,function(err,db){
    if(err) throw err;
   var dbo= db.db('mydb');
//    var query = { _id:id1};
   dbo.collection('product').find({ _id:id1}).toArray(function(err,result){
    if(err) throw err;
     res.render('pages/single_product',{result:result});
    // console.log(result)
    db.close();
   });
});



});


app.get('/products',function(req,res){
 

    var MongoClient= require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";
    
    MongoClient.connect(url,function(err,db){
        if(err) throw err;
       var dbo= db.db('mydb');
       dbo.collection('product').find({}).toArray(function(err,result){
        if(err) throw err;
         res.render('pages/products',{result:result});
        // console.log(result)
        db.close();
       });
    });
    

});

app.get('/about',function(req,res){
    res.render('pages/about');

});
