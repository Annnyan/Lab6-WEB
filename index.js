const { Telegraf, session, Scenes } = require('telegraf');
const { message } = require('telegraf/filters');

require('dotenv').config();

const API_URL = 'https://nlp-translation.p.rapidapi.com/v1/translate';

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());

const question = new Scenes.BaseScene("langQuestion");

question.enter(ctx => ctx.reply("Оберіть мову. Наприклад: en, uk, de, es, ja"));
question.on(message("text"), async ctx => {
  ctx.session.targetLang = ctx.message.text;
  await ctx.reply(`Ви обрали мову ${ctx.message.text}`);
  return ctx.scene.leave();
});

const stage = new Scenes.Stage([question]);
bot.use(stage.middleware());

bot.start((ctx) => {
  ctx.session.targetLang = 'en';
  ctx.reply("Напишіть текст, який хочете перевести. За замовчуванням вибрана англійська. Для зміни мови нажміть /change_lang");
});

bot.command('change_lang', ctx => ctx.scene.enter("langQuestion"));

bot.on(message('text'), async (ctx) => {
  const result = await translate(ctx.message.text, ctx.session.targetLang);

  ctx.reply(result);
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

async function translate(message, targetLanguageCode) {
  const preparedURL = new URL(API_URL);
  preparedURL.searchParams.set('text', message);
  preparedURL.searchParams.set('to', targetLanguageCode);

  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': '49a526d4damsh60cdc9b721fe75fp1227fcjsne9ce2ea84f32',
      'X-RapidAPI-Host': 'nlp-translation.p.rapidapi.com'
    }
  };

  try {
    const result = await fetch(preparedURL.href, options).then(res => res.json());
    if (!result?.translated_text?.[targetLanguageCode]) {
      throw new Error('Неіснуюча мова');
    }
    return result.translated_text[targetLanguageCode];
  } catch (error) {
    return error.message;
  }
}
