// handler.js

const aws = require('aws-sdk');
const ses = new aws.SES();
const myEmail = process.env.EMAIL;
const myDomain = process.env.DOMAIN;

function generateResponse (code, payload) {
  return {
    statusCode: code,
    headers: {
      'Access-Control-Allow-Origin': myDomain,
      'Access-Control-Allow-Headers': 'x-requested-with',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(payload)
  };
}

module.exports.generateResponse = generateResponse;

function generateError (code, err) {
  return {
    statusCode: code,
    headers: {
      'Access-Control-Allow-Origin': myDomain,
      'Access-Control-Allow-Headers': 'x-requested-with',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(err.message)
  };
}

module.exports.generateError = generateError;

function generateEmailParams (body) {
  const { email, name, message, phone } = JSON.parse(body);
  if (!(email && name && message)) {
    throw new Error('Missing parameters! Make sure to add \'email\', \'name\', \'message\' as parameters.');
  }

  return {
    Source: myEmail,
    Destination: { ToAddresses: [myEmail] },
    ReplyToAddresses: [email],
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `
          <\!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8">
            </head>
            <body>
              <div>Message sent from email <b>${email}</b> by <b>${name}</b></div>
              ${phone && `<div><b>Phone</b>: ${phone}</div>`}
              <br>
              <div><b>Message</b>: ${message}<div>
            </body>
          </html>
          `,
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: `New contact message from ${myDomain}!`,
      }
    }
  };
}

module.exports.generateEmailParams = generateEmailParams;

module.exports.send = async (event) => {
  try {
    const emailParams = generateEmailParams(event.body);
    const data = await ses.sendEmail(emailParams).promise();
    return generateResponse(200, data);
  } catch (err) {
    return generateError(500, err);
  }
};
