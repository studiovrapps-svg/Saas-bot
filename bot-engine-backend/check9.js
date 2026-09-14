const fs = require('fs');
const content = fs.readFileSync('C:\\Antigravity\\Chatbots\\bot-engine-backend\\src\\controllers\\webhook.controller.js', 'utf8');
const match = content.match(/button: `(.*?)`/);
if (match) {
    console.log("Button text:", match[1]);
    console.log("Length:", match[1].length);
} else {
    console.log("Not found");
}
