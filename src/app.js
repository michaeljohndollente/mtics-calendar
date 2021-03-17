const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser')
const { oauth2 } = require('googleapis/build/src/apis/oauth2')
const { healthcare } = require('googleapis/build/src/apis/healthcare')

var var_arr = ['Refresh the browser to see your events!']

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', __dirname + '/public/views')
app.set('view engine', 'html')
app.engine('html', require('ejs').renderFile)
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.render('index.html')
})

app.post('/', (req, res) => {
    const tkn = req.body.token
    const fs = require('fs');
    const readline = require('readline');
    const {google} = require('googleapis');

    // If modifying these scopes, delete token.json.
    const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
    // The file token.json stores the user's access and refresh tokens, and is
    // created automatically when the authorization flow completes for the first
    // time.
    const TOKEN_PATH = 'token.json';

    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Calendar API.
    authorize(JSON.parse(content), listEvents);
    });

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback for the authorized client.
     */
    function getAccessToken(oAuth2Client, callback) {
        oAuth2Client.getToken(tkn, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return console.error(err);
            console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
        });
    }

    /**
     * Lists the next 10 events on the user's primary calendar.
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
     */
    function listEvents(auth) {
        async function func(){
        const calendar = await google.calendar({version: 'v3', auth});
        calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const events = res.data.items;
            if (events.length) {
            console.log('Upcoming 10 events:', events);
            events.map((event, i) => {
                var_arr.push(event)
            });
            } else {
            console.log('No upcoming events found.');
            }
        });
    }
    func()
    }
    res.send(var_arr)
    res.render('index.html')
})

app.post('/events',(req,res)=>{
    const {google} = require('googleapis')
    const {OAuth2} = google.auth
    const oAuth2Client = new oauth2(calendar id, client secret)

    oAuth2Client.setCredentials({
        refresh_token: your refresh token;
    })

    const calendar = google.calendar({version: 'v3', auth: oAuth2Client})
    eventStartTime = new Date()
    eventStartTime.setDate(eventStartTime.getDay() + 2)

    const eventEndTime = new Date()
    eventEndTime.setDate(eventEndTime.getDay() + 2)
    eventEndTime.setMinutes(eventEndTime.getMinutes() + 60)

    const event = {
        summary: `${req.body.summary}`,
        description: `${req.body.description}`,
        colorId: 6,
        start: {
            dateTime:eventStartTime,
        },
        end: {
            dateTime: eventEndTime,
        },
    }

    calendar.freebusy.query({
        resource: {
            timeMin: eventStartTime,
            timeMax: eventEndTime,
            items: [{id: 'primary'}]
        },
    },
    (err,res) => {
        if(err) return console.log('Free Busy Query Error: ', err)

        const eventArr = res.data.calendars.primary.busy
        if(eventArr.length === 0){
            return calendar.events.insert({calendarId: 'primary', resource: event},
                err =>{
                    if(err) return console.log('Error creating Calendar Event:', err)

                    return console.log('Event Created Successfully!')
                }
            )
        }

        return console.log('Sorry my Schedule is busy at the moment.')
    })


    // using Twilio SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs
    // javascript
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    const msg = {
    to: req.body.to, // Change to your recipient
    from: 'shekinahgalicia@gmail.com', // Change to your verified sender
    subject: req.body.summary,
    text: req.body.description,
    html: req.body.description,
    }
    sgMail.send(msg).then(() => {
        console.log('Message sent')
    }).catch((error) => {
        console.log(error.response.body)
        // console.log(error.response.body.errors[0].message)
    })
    res.render('events.html')
})

app.listen(3000, () => {
    console.log('Server 