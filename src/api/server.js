var express = require('express'),
    bodyparser = require('body-parser'),
     mongodb = require('mongodb'),
     objectId = require('mongodb').ObjectId,
     multiparty = require('connect-multiparty'),
     fs = require('fs');

var app = express();

app.use(bodyparser.urlencoded({ extended: true } ));

app.use(bodyparser.json());

app.use(multiparty());

app.use(function(req,resp,next){

    resp.setHeader("Access-Control-Allow-Origin","*");
    resp.setHeader("Access-Control-Allow-Methods","*");
    resp.setHeader("Access-Control-Allow-Headers","content-type");
    resp.setHeader("Access-Control-Allow-Credentials",true);
    

    next();
});

var port = 8004;

app.listen(port);

var db = new mongodb.Db(
    'instagram',
    new mongodb.Server('localhost',27017,{}),
    {}
);

console.log('Servidor HTTP está escutando na porta: ' +port );

app.get('/',funcaoOla);

app.post('/api',apiPost);

app.get('/api',apiGet);

app.get('/api/:id',apiGetById);

app.put('/api/:id',apiPutById);

app.delete('/api/:id',apiDelete);


app.get('/imagens/:imagem',getImagens);



 function getImagens (req, resp) {
        var img = req.params.imagem;
        fs.readFile('./uploads/' + img, function (err, content) {
            if (err) {
                resp.status(400).json(err);
                return;
            }
            resp.writeHead(200, { 'content-type': 'image/png' });
            resp.end(content);
        });
    };


function  apiDelete(req,resp){
    
    db.open(function(error,mongoclient){

        mongoclient.collection('postagens',function(err,collection){

            collection.update(
                {  },
                {$pull: {
                            comentarios: { id_comentario: objectId(req.params.id) } 
                        } 
                },
                { multi:true },
                function(err,results){
                
                    if(err){
                        resp.json(err);
                    }else{
                        resp.json(results);
                    }

            });
            mongoclient.close();
        } );

    });
}


function  apiPutById(req,resp){

    
    db.open(function(error,mongoclient){

        mongoclient.collection('postagens',function(err,collection){

            collection.update(
                {_id: objectId(req.params.id) },
                {$push: {
                            comentarios: {
                                id_comentario: new objectId() ,
                                comentario: req.body.comentario
                            }
                        } 
                },
                {},
                function(err,results){
                    
                    if(err){
                        resp.json(err);
                    }else{
                        resp.json(results);
                    }


                });

                mongoclient.close();
        } );

    });
}


function  apiGetById(req,resp){

    db.open(function(error,mongoclient){

        mongoclient.collection('postagens',function(err,collection){

           collection.find(objectId(req.params.id) ).toArray(function(err,results){
                
                if(err){
                    resp.json(err);
                }else{
                    resp.status(200).json(results);
                }

                mongoclient.close();
           });

        } );

    });
}

function  apiGet(req,resp){

    

    db.open(function(error,mongoclient){

        mongoclient.collection('postagens',function(err,collection){
            
           collection.find().toArray(function(err,results){
                
            if(err){
                resp.json(err);
            }else{
                resp.json(results);
            }
                
                mongoclient.close();
           });

        } );

    });
}

function  apiPost(req,resp){

    

    var time_stmp = new Date().getTime();

    var url_imagem = time_stmp + '_' + req.files.arquivo.originalFilename;
    
    var path_origem = req.files.arquivo.path;

    var path_destino = './uploads/'+ url_imagem;

    fs.rename(path_origem,path_destino,callBackRenameImage());

    var dados  = {

        url_imagem: url_imagem ,
        titulo: req.body.titulo
    }
    
    db.open(function(error,mongoclient){

        mongoclient.collection('postagens',function(err,collection){
            
            collection.insert(dados,function(err,records){

                if(err){
                    resp.json({'status': 'erro'});
                }else{
                    resp.json({'status': 'inclusao realizada com sucesso'});
                }
                
            });

            mongoclient.close();
        } );

    });

    function callBackRenameImage() {
        return function (error) {
            if (error) {
                resp.status(500).json({ error: error });
                return;
            }
        };
    }
}



function funcaoOla(req,resp){
    resp.send( {msg: "A API está online" });
}