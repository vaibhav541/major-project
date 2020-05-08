var express = require('express');
// To install dependencies, run: npm install
const xmlbuilder = require('xmlbuilder');
// request-promise has a dependency on request
const rp = require('request-promise');
const fs = require('fs');
const readline = require('readline-sync');
var router = express.Router();
var Sound = require('node-aplay');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/', function (req, res) {
    console.log(req.body.voicetype);
    console.log(req.body.description);
    converttts(req.body.description,req.body.voicetype);
    
    //res.send('Post page');
    res.redirect('back');
});

module.exports = router;
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
function textToSpeech(accessToken, text,voicen) {
    // Create the SSML request.
    //var male=["en-GB-George-Apollo","en-IE-Sean","en-IN-Ravi-Apollo","en-US-BenjaminRUS","en-US-Guy24kRUS"]
    var male=["en-GB-George-Apollo","en-IE-Sean","en-IN-Ravi-Apollo"];
    //var female=["en-AU-Catherine","en-AU-HayleyRUS","en-CA-Linda","en-GB-Susan-Apollo","en-IN-Heera-Apollo","en-IN-PriyaRUS","en-US-AriaRUS"];
    var female=["en-IN-Heera-Apollo","en-US-AriaRUS","en-AU-Catherine"];
    
    var voice=2;
    
    if(voicen<5){
    voice=male[voicen-2];
    }
    else{
    voice=female[voicen-5]
    }
    
    
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
                request.pipe(fs.createWriteStream('TTSOutput.wav'));
                console.log('\nYour file is ready.\n')
            }
        });
    

// fire and forget: 
	
    return request;

};
function customtextToSpeech(accessToken, text,voicen) {
   
  
    
    
    let xml_body = xmlbuilder.create('speak')
        .att('version', '1.0')
        .att('xmlns', 'http://www.w3.org/2001/10/synthesis')
        .att('xmlns:mstts','http://www.w3.org/2001/mstts')
        .att('xml:lang', 'en-us')
        .ele('voice')
        .att('name', "modi") // Short name for 'Microsoft Server Speech Text to Speech Voice (en-US, Guy24KRUS)'
        .txt(text)
        .end();
    // Convert the XML into a string to send in the TTS request.
    let body = xml_body.toString();
    console.log(body);

    let options = {
        method: 'POST',
        baseUrl: 'https://eastus.voice.speech.microsoft.com/',
        url: 'cognitiveservices/v1?deploymentId=4588eeb1-3218-42a2-af93-37d56cfcf534',
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
                request.pipe(fs.createWriteStream('TTSOutput.wav'));
                console.log('\nYour file is ready.\n')
            }
        });
    

// fire and forget: 
	
    return request;

};

async function converttts(text,voice) {
    // Reads subscription key from env variable.
    // You can replace this with a string containing your subscription key. If
    // you prefer not to read from an env variable.
    // e.g. const subscriptionKey = "your_key_here";
    const subscriptionKey = "f8b1357f19db44b19ec88ef5961b5695";
    if (!subscriptionKey) {
        throw new Error('Environment variable for your subscription key is not set.')
    };
    // Prompts the user to input text.
	//const text =data.msg;
	//const voice=data.voice;
    console.log(voice);

    try {
        const accessToken = await getAccessToken(subscriptionKey);
        if(voice==1){
        await customtextToSpeech(accessToken, text,voice);}
        else{
        await textToSpeech(accessToken, text,voice);
        }
        new Sound('TTSOutput.wav').play();
        
    } catch (err) {
        console.log(`Something went wrong: ${err}`);
    }
};
