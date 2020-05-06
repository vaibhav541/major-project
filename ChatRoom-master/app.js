var express = require('express');			// express module
var app = express();						// initiating express app
var http = require('http');					// http module
http.globalAgent.maxSockets = 100;			// limiting socket connections to 100
var bodyParser = require('body-parser');	// body-parser module for reading request body
var fs = require('fs');						// fs module for handling file operations
var server = http.createServer(app);		// creating server
var io = require('socket.io');				// using sockets
var ios = io.listen(server);				// listening sockets
var formidable = require('formidable');		// file upload module
var util = require('util');
var Sound = require('node-aplay');
// To install dependencies, run: npm install
const xmlbuilder = require('xmlbuilder');
// request-promise has a dependency on request
const rp = require('request-promise');

const readline = require('readline-sync');

// Initializing Variables
var nickname = [];
var i = [];
var x = [];
var online_member = [];
var temp1;
var socket_id;
var socket_data;
var files_array  = [];
var expiryTime = 8;
var routineTime = 1;



// Use async and await to get the token before attempting
// to convert text to speech.

server.listen(8282);		// server starting on port '8282'

// cofiguring body-parser
app.use(bodyParser.json({	// setting json limit 	
    limit: 1024 * 10000
}));
app.use(bodyParser.text({ 	// setting text limit
    limit: 1024 * 10000
}));
app.use(bodyParser.raw({ 	// setting raw limit
    limit: 1024 * 10000
}));
app.use(bodyParser.urlencoded({		// setting url encoding
        extended: true
}));
//static file configuration
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public/app/upload/images'));
app.use(express.static(__dirname + '/public/app/upload/music'));
app.use(express.static(__dirname + '/public/app/upload/doc'));

// CORS Issue Fix
app.use(function(req, res, next) {														
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//sockets handling
ios.on('connection', function(socket){	

	// creating new user if nickname doesn't exists
	socket.on('new user', function(data, callback){
		if(nickname[data.username])
			{
				callback({success:false});
			}else{
				callback({success:true});
				socket.username = data.username;
				socket.userAvatar = data.userAvatar;
				socket.voice=data.voice;
				nickname[data.username] = socket;
			}
	});

	// sending online members list
	socket.on('get-online-members', function(data){
		var online_member = [];
		i = Object.keys(nickname);
		for(var j=0;j<i.length;j++ )
		{
			socket_id = i[j];
			socket_data = nickname[socket_id];
			temp1 = {"username": socket_data.username, "userAvatar":socket_data.userAvatar,"voice":socket_data.voice};
			online_member.push(temp1);
		}
		ios.sockets.emit('online-members', online_member);		
	});

	// sending new message
	socket.on('send-message', function(data, callback){
	converttts(data);
		if (nickname[data.username]) {
			
			if(data.hasMsg){
				
				ios.sockets.emit('new message', data);
				callback({success:true});	
			}else if(data.hasFile){
				if(data.istype == "image"){
					socket.emit('new message image', data);
					callback({success:true});
				} else if(data.istype == "music"){
					socket.emit('new message music', data);
					callback({success:true});
				} else if(data.istype == "PDF"){
					socket.emit('new message PDF', data);
					callback({success:true});
				}
			}else{
				callback({ success:false});
			}
		}		
	});
	
	// disconnect user handling 
	socket.on('disconnect', function () {	
		delete nickname[socket.username];
		online_member = [];
		x = Object.keys(nickname);
		for(var k=0;k<x.length;k++ )
    	{
        	socket_id = x[k];
        	socket_data = nickname[socket_id];
        	temp1 = {"username": socket_data.username, "userAvatar":socket_data.userAvatar,"voice":socket_data.voice};
            online_member.push(temp1);
    	}
		ios.sockets.emit('online-members', online_member);            	
   	});
});

// route for uploading images asynchronously
app.post('/v1/uploadImage',function (req, res){
	var imgdatetimenow = Date.now();
	var form = new formidable.IncomingForm({
      	uploadDir: __dirname + '/public/app/upload/images',
      	keepExtensions: true
      });

	form.on('end', function() {
      res.end();
    });
    
    form.parse(req,function(err,fields,files){
		var data = { 
				username : fields.username, 
				userAvatar : fields.userAvatar, 
				repeatMsg : true, 
				hasFile : fields.hasFile, 
				isImageFile : fields.isImageFile, 
				istype : fields.istype, 
				showme : fields.showme, 
				dwimgsrc : fields.dwimgsrc, 
				dwid : fields.dwid,
				serverfilename : baseName(files.file.path), 
				msgTime : fields.msgTime,
				filename : files.file.name,
				size : bytesToSize(files.file.size),
				voice :fields.voice
		};
	    var image_file = { 
		        dwid : fields.dwid,
		        filename : files.file.name,
		        filetype : fields.istype,
		        serverfilename : baseName(files.file.path),
		        serverfilepath : files.file.path,
		        expirytime : imgdatetimenow + (3600000 * expiryTime)           
	    };
	    files_array.push(image_file);
		ios.sockets.emit('new message image', data);
    });
});

// route for uploading audio asynchronously
app.post('/v1/uploadAudio',function (req, res){
	var userName, useravatar, hasfile, ismusicfile, isType, showMe, DWimgsrc, DWid, msgtime,voice,voice;
	var imgdatetimenow = Date.now();
	var form = new formidable.IncomingForm({
      	uploadDir: __dirname + '/public/app/upload/music',
      	keepExtensions: true
      });


	form.on('end', function() {
      res.end();
    });
    form.parse(req,function(err,fields,files){
		console.log("files : ",files);
		console.log("fields : ", fields);
		var data = { 
				username : fields.username, 
				userAvatar : fields.userAvatar, 
				repeatMsg : true, 
				hasFile : fields.hasFile, 
				isMusicFile : fields.isMusicFile, 
				istype : fields.istype, 
				showme : fields.showme, 
				dwimgsrc : fields.dwimgsrc, 
				dwid : fields.dwid,
				serverfilename : baseName(files.file.path), 
				msgTime : fields.msgTime,
				filename : files.file.name,
				size : bytesToSize(files.file.size),
				voice :fields.voice
		};
	    var audio_file = { 
		        dwid : fields.dwid,
		        filename : files.file.name,
		        filetype : fields.istype,
		        serverfilename : baseName(files.file.path),
		        serverfilepath : files.file.path,
		        expirytime : imgdatetimenow + (3600000 * expiryTime)           
	    };
	    files_array.push(audio_file);
		ios.sockets.emit('new message music', data);
    });
});

// route for uploading document asynchronously
app.post('/v1/uploadPDF',function (req, res){
	var imgdatetimenow = Date.now();
	var form = new formidable.IncomingForm({
      	uploadDir: __dirname + '/public/app/upload/doc',
      	keepExtensions: true
      });

	form.on('end', function() {
      res.end();
    });
    form.parse(req,function(err,fields,files){
		var data = { 
				username : fields.username, 
				userAvatar : fields.userAvatar, 
				repeatMsg : true, 
				hasFile : fields.hasFile, 
				isPDFFile : fields.isPDFFile, 
				istype : fields.istype, 
				showme : fields.showme, 
				dwimgsrc : fields.dwimgsrc, 
				dwid : fields.dwid,
				serverfilename : baseName(files.file.path), 
				msgTime : fields.msgTime,
				filename : files.file.name,
				size : bytesToSize(files.file.size),
				voice :fields.voice
		};
	    var pdf_file = { 
		        dwid : fields.dwid,
		        filename : files.file.name,
		        filetype : fields.istype,
		        serverfilename : baseName(files.file.path),
		        serverfilepath : files.file.path,
		        expirytime : imgdatetimenow + (3600000 * expiryTime)           
	    };
	    files_array.push(pdf_file);
		ios.sockets.emit('new message PDF', data);
    });
});

// route for checking requested file , does exist on server or not
app.post('/v1/getfile', function(req, res){
    var data = req.body.dwid;
    var filenm = req.body.filename;
    var dwidexist = false;
    var req_file_data;
    
    for(var i = 0; i<files_array.length; i++)
    {
        if(files_array[i].dwid == data)
        {
            dwidexist = true;
            req_file_data = files_array[i];
        }
    }

    // CASE 1 : File Exists
    if(dwidexist == true)
    {
    	//CASE 2 : File Expired and Deleted
        if(req_file_data.expirytime < Date.now())
        {
	        var deletedfileinfo = { 
                isExpired : true,
	            expmsg : "File has beed removed."
	        	};
	            fs.unlink(req_file_data.serverfilepath, function(err){
	               	if (err) {
	                   	return console.error(err);
	                }
	    				res.send(deletedfileinfo);           
	            });
               var index = files_array.indexOf(req_file_data);
               files_array.splice(index,1);           
        }else{
        	// CASE 3 : File Exist and returned serverfilename in response
            var fileinfo = {
            	isExpired : false, 
            	filename : req_file_data.filename,            
            	serverfilename : req_file_data.serverfilename };
            res.send(fileinfo);
        }
    }else{  
    		// CASE 4 : File Doesn't Exists.       
	    	var deletedfileinfo = { 
	                isExpired : true,
	                expmsg : "File has beed removed."
	        };
	        res.send(deletedfileinfo);       
        }
});

// Routine Clean up call
setInterval(function() {routine_cleanup();}, (3600000 * routineTime));

// Size Conversion
function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return 'n/a';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    if (i == 0) return bytes + ' ' + sizes[i]; 
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};
//get file name from server file path
function baseName(str)
{
   var base = new String(str).substring(str.lastIndexOf('/') + 1);     
   return base;
}

// Routine cleanup function (files delete after specific interval)
function routine_cleanup()
{
    for(var i=0; i<files_array.length; i++)
    {
            if(Date.now() > files_array[i].expirytime)
            {
                fs.unlink(files_array[i].serverfilepath, function(err) 
                          {
                   if (err) {
                       return console.error(err);
                            }
                            });
                   files_array.splice(i,1);
            }
    }
};
function getAccessToken(subscriptionKey) {
    let options = {
        method: 'POST',
        uri: 'https://eastus.api.cognitive.microsoft.com/sts/v1.0/issuetoken',
        headers: {
            'Ocp-Apim-Subscription-Key': subscriptionKey
        }
    }
    return rp(options);
}

// Converts text to speech using the input from readline.
function textToSpeech(accessToken, text,voice) {
    // Create the SSML request.
    //var male=["en-GB-George-Apollo","en-IE-Sean","en-IN-Ravi-Apollo","en-US-BenjaminRUS","en-US-Guy24kRUS"]
    //var female=["en-AU-Catherine","en-AU-HayleyRUS","en-CA-Linda","en-GB-Susan-Apollo","en-IN-Heera-Apollo","en-IN-PriyaRUS","en-US-AriaRUS"];
    
    //var voice=female[Math.floor(Math.random() * 7)];
    
    
    let xml_body = xmlbuilder.create('speak')
        .att('version', '1.0')
        .att('xml:lang', 'en-us')
        .ele('voice')
        .att('xml:lang', 'en-us')
        .att('name', voice) // Short name for 'Microsoft Server Speech Text to Speech Voice (en-US, Guy24KRUS)'
        .txt(text)
        .end();
    // Convert the XML into a string to send in the TTS request.
    let body = xml_body.toString();

    let options = {
        method: 'POST',
        baseUrl: 'https://eastus.tts.speech.microsoft.com/',
        url: 'cognitiveservices/v1',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'cache-control': 'no-cache',
            'User-Agent': 'modiji',
            'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
            'Content-Type': 'application/ssml+xml'
        },
        body: body
    }

    let request = rp(options)
        .on('response', (response) => {
            if (response.statusCode === 200) {
                request.pipe(fs.createWriteStream('public/app/TTSOutput.wav'));
                console.log('\nYour file is ready.\n')
            }
        });
    

// fire and forget: 
	
    return request;

};

async function converttts(data) {
    // Reads subscription key from env variable.
    // You can replace this with a string containing your subscription key. If
    // you prefer not to read from an env variable.
    // e.g. const subscriptionKey = "your_key_here";
    const subscriptionKey = "f8b1357f19db44b19ec88ef5961b5695";
    if (!subscriptionKey) {
        throw new Error('Environment variable for your subscription key is not set.')
    };
    // Prompts the user to input text.
	const text =data.msg;
	const voice=data.voice;
    console.log(text);

    try {
        const accessToken = await getAccessToken(subscriptionKey);
        await textToSpeech(accessToken, text,voice);
        new Sound('public/app/TTSOutput.wav').play();
        
    } catch (err) {
        console.log(`Something went wrong: ${err}`);
    }
};
