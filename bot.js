const TelegramBot = require('telegram-bot-api');
const cheerio = require('cheerio');
const etherscan = require('etherscan-api');
const bscscan = require('bscscan-api');

const BOT_TOKEN = '6385420793:AAEZefei9NQfrvoothDDnJ3J9hUwQhA3cjc';

const bot = new TelegramBot(BOT_TOKEN);

bot.startPolling();


const ETHERSCAN_API_KEY = 'AZNAMI4V3Z9MQEJN5UN6UX5HM4P2474BI6';
const BSCSCAN_API_KEY = '8MA6QH3UYVZNGE6VVPSBB5S4NA17TBFD3P';

async function scrapeTwitter(twitterHandle) {
  const response = await fetch(`https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=${twitterHandle}&count=1`);
  const json = await response.json();

  const $ = cheerio.load(json[0].text);

  const smartContractAddress = $(`.twitter-tweet-text`).text().match(/0x[a-zA-Z0-9]*/)[0];

  return smartContractAddress;
}

async function checkIfSmartContractIsOnEthOrBsc(smartContractAddress) {
  // Check if the smart contract is on Ethereum.
  if (smartContractAddress.startsWith('0x')) {
    // Use the Etherscan API to check if the smart contract exists on Ethereum.
    const etherscanClient = new etherscan.Client(ETHERSCAN_API_KEY);
    const contractExists = await etherscanClient.contract.getContractExists(smartContractAddress);

    if (contractExists) {
      return 'ETH';
    }
  } else {
    // Use the BscScan API to check if the smart contract exists on BSC.
    const bscscanClient = new bscscan.Client(BSCSCAN_API_KEY);
    const contractExists = await bscscanClient.contract.getContractExists(smartContractAddress);

    if (contractExists) {
      return 'BSC';
    }
  }

  return null;
}

async function sendMessageToTelegram(chatId, message) {
  await bot.sendMessage(chatId, message);
}

async function checkForNewSmartContracts() {
  const smartContractAddress = await scrapeTwitter('@Og_kingdev');

  if (smartContractAddress) {
    const chain = await checkIfSmartContractIsOnEthOrBsc(smartContractAddress);

    if (chain) {
      const message = `
New Contract detected on ${chain}
X account: x.com/YOUR_TWITTER_HANDLE
Ca: ${smartContractAddress}
`;

      await sendMessageToTelegram('-1001925255391', message);
    }
  }
}

setInterval(checkForNewSmartContracts, 60 * 1000); // Check for new smart contracts every 60 seconds.

