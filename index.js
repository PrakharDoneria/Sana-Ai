const { Telegraf } = require("telegraf");
const axios = require("axios");
const { mdEscape } = require("markdown-escape");
const fs = require("fs");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const PORT = process.env.PORT || 3000; // Use the port provided by Render or default to 3000

bot.telegram.setWebhook(`https://prakhardoneria-sana-ai-bot-for-telegram.onrender.com/bot${process.env.TELEGRAM_BOT_TOKEN}`);



bot.command("yt", async (ctx) => {
  try {
    const apiKey = "AIzaSyARIp8blKZ4aecnymh4XsC_dmbSw5S-1_I";
    const query = ctx.message.text.split(" ").slice(1).join(" ");

    if (!query) {
      ctx.reply("Please provide a search query for YouTube.");
      return;
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query,
    )}&type=video&key=${apiKey}`;
    const response = await axios.get(url);

    const video = response.data.items[0];

    if (video) {
      const videoTitle = video.snippet.title;
      const videoURL = `https://www.youtube.com/watch?v=${video.id.videoId}`;

      ctx.reply(`Top Result:\nTitle: ${videoTitle}\nURL: ${videoURL}`);
    } else {
      ctx.reply("No results found for the given query.");
    }
  } catch (error) {
    console.error(
      "Error processing YouTube command:",
      error.response?.data || error.message,
    );
    ctx.reply("Error processing the YouTube command. Please try again later.");
  }
});

const githubToken = process.env.GITHUB_ACCESS_TOKEN;

bot.command("github", async (ctx) => {
  try {
    const commandArguments = ctx.message.text.split(" ").slice(1);

    if (commandArguments.length < 2) {
      ctx.reply(
        "Please provide both a search query and a programming language.",
      );
      return;
    }

    const query = commandArguments.slice(0, -1).join(" ");
    const language = commandArguments[commandArguments.length - 1];

    const githubResponse = await searchGitHub(query, language);

    if (githubResponse.items.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * githubResponse.items.length,
      );
      const randomRepo = githubResponse.items[randomIndex];

      const repoName = randomRepo.full_name;
      const resultMessage = `Repository: ${repoName}\nDescription: ${randomRepo.description}\nLink: ${randomRepo.html_url}\n\n`;
      ctx.reply(resultMessage);
    } else {
      ctx.reply(
        `No GitHub repositories found for the query "${query}" with programming language "${language}".`,
      );
    }
  } catch (error) {
    console.error("Error processing github command:", error);
    ctx.reply("Error processing the github command. Please try again later.");
  }
});

async function searchGitHub(query, language) {
  const apiUrl = "https://api.github.com/search/repositories";

  try {
    const response = await axios.get(
      `${apiUrl}?q=${query}+language:${language}&sort=stars&order=desc`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
        },
      },
    );

    if (!response.data) {
      throw new Error(
        `GitHub API request failed with status ${response.status}`,
      );
    }

    return response.data;
  } catch (error) {
    console.error("Error in GitHub API request:", error);
    throw new Error("Failed to retrieve data from GitHub API.");
  }
}

const RAPID_API_KEYS = [
  "6f6bcba81dmsh7bc212731f98f93p1d61ecjsne89a310b4830",
  "ee6c8218aamsh448dfb6a5470e5fp1c9736jsnf52f17230c5b",
  "54fb139661mshb7ee757010901c9p177c1ajsn4a5b60261d0d",
];

function getRandomApiKey() {
  const randomIndex = Math.floor(Math.random() * RAPID_API_KEYS.length);
  return RAPID_API_KEYS[randomIndex];
}


bot.on("text", async (ctx) => {
  try {
    if (ctx.message.reply_to_message) {
      const originalText = ctx.message.reply_to_message.text;
      const languageCode = ctx.message.text.split(" ")[1];

      if (!languageCode) {
        ctx.telegram.sendMessage(
          ctx.message.chat.id,
          "Please include the language code along with /translate.",
        );
        return;
      }

      const apiKey = getRandomApiKey();

      const encodedParams = new URLSearchParams();
      encodedParams.set("q", originalText);
      encodedParams.set("target", languageCode);

      const options = {
        method: "POST",
        url: "https://google-translate1.p.rapidapi.com/language/translate/v2",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "Accept-Encoding": "application/gzip",
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "google-translate1.p.rapidapi.com",
        },
        data: encodedParams,
      };

      const response = await axios.request(options);
      const translatedText = response.data.data.translations[0].translatedText;

      ctx.telegram.sendMessage(
        ctx.message.chat.id,
        `Translation to ${languageCode.toUpperCase()}: ${translatedText}`,
      );
    }
  } catch (error) {
    console.error(
      "Error processing translation:",
      error.response?.data || error.message,
    );
    ctx.telegram.sendMessage(
      ctx.message.chat.id,
      "Error processing the translation. Please try again later.",
    );
  }
});

(async () => {
  try {
    await bot.launch();
    console.log("Bot is running!");
  } catch (error) {
    console.error("Error starting the bot:", error.message);
  }
})();
