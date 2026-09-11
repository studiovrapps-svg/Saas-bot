const ngrok = require('ngrok');

(async function() {
  try {
    const url = await ngrok.connect({
      addr: 3000,
      authtoken: '3JB0i4RGSqzgo50sRxLorrn3A0k_5NFmQ5qsCyNA8tuAbkCAD'
    });
    console.log("Ngrok tunnel is active at:", url);
  } catch (error) {
    console.error("Error starting ngrok:", error);
  }
})();
