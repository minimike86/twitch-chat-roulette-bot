const tmi = require('tmi.js');

const client = new tmi.Client({
  options: { debug: false },
  identity: {
    username: 'username',
    password: 'oauth:password'
  },
  channels: [ 'msec' ] // Change to the channel running the roulette module
});

const USERNAME = 'MSec'; // Change to your username
let GOLD = 0;
let STAKE = 1;
let LOSS_COUNT = 0;
let MAX_LOSS_STRATEGY = 6; // Change to match how many roulette losses you're willing to encounter in a row.
                           // Higher values will result in betting a higher stake.

function getMaxStakeForMaxLossStrategy() {
  let strategy = 10;
  let stake = 1;
  while (strategy >= MAX_LOSS_STRATEGY) {
    strategy = Math.floor(Math.log(GOLD / stake) / Math.log(2));
    if (strategy >= MAX_LOSS_STRATEGY) {
      stake++;
    }
  }
  console.log(`* Max stake with ${GOLD} and max loses of ${MAX_LOSS_STRATEGY} is ${stake}`);
  return stake;
}

client.connect();

client.on('connected', (addr, port) => {
  // console.log(`* Connected to ${addr}:${port}`);
});

client.on('join', (channel, username, state) => {
  // console.log(`* ${username} has joined ${channel}`);
  if (username.toLowerCase() === USERNAME.toLowerCase()) {
    client.say(channel, '!gold');

    setInterval(() => {
      if (GOLD > 0) {
        if (LOSS_COUNT === 0) {
          STAKE = getMaxStakeForMaxLossStrategy();
        }
        const bet = STAKE * Math.pow(2, LOSS_COUNT);
        client.say(channel, `!roulette ${bet}`);
      }
    }, 61 * 1000);

  }
});

client.on('message', (channel, tags, message, self) => {
  console.log(`${tags['display-name']}: ${message}`);
  if(self) return;

  // update gold count
  if(tags['display-name'] === 'StreamElements'
      && message.toLowerCase().includes(USERNAME.toLowerCase())
      && message.match(/(?<=has )\d+(?= gold$)/g) !== null) {
    GOLD = parseInt(message.match(/(?<=has )\d+(?= gold$)/g)[0]);
    console.log(`* ${USERNAME} has ${GOLD} gold`);
  }

  // win event
  if(tags['display-name'] === 'StreamElements'
      && message.toLowerCase().includes(USERNAME.toLowerCase())
      && message.match(/(?<=gold in roulette and now has )\d+(?= gold! FeelsGoodMan)/g) !== null) {
    GOLD = parseInt(message.match(/(?<=gold in roulette and now has )\d+(?= gold! FeelsGoodMan)/g)[0]);
    LOSS_COUNT = 0;
    console.log(`* ${USERNAME} has ${GOLD} gold`);
  }

  // loss event
  if(tags['display-name'] === 'StreamElements'
      && message.toLowerCase().includes(USERNAME.toLowerCase())
      && message.match(/(?<=gold in roulette and now has )\d+(?= gold! FeelsBadMan)/g) !== null) {
    GOLD = parseInt(message.match(/(?<=gold in roulette and now has )\d+(?= gold! FeelsBadMan)/g)[0]);
    LOSS_COUNT++;
    console.log(`* ${USERNAME} has ${GOLD} gold`);
  }

});