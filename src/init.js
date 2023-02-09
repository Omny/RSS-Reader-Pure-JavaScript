import * as bootstrap from 'bootstrap';
import i18n from 'i18next';
import * as yup from 'yup';
import onChange from 'on-change';
import uniqueId from 'lodash.uniqueid';
import resources from './locales/index.js';
import render from './view.js';

const validateUrl = (url, urlsList) => {
  const urlSchema = yup.string().url().nullable().notOneOf(urlsList, 'URL is duplicate');
  return urlSchema.validate(url, { abortEarly: false })
    .then(() => null)
    .catch((e) => e.message);
};

const app = async () => {
  const defaultLanguage = 'ru';
  const i18nInstance = i18n.createInstance();
  await i18nInstance.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  });

  const elements = {
    form: document.querySelector('.rss-form'),
    fields: {
      url: document.getElementById('url-input'),
    },
    feedbackElement: document.querySelector('p.feedback'),
    submitButton: document.querySelector('button[type="submit"]'),
  };

  const initialState = {
    feeds: [], // массив объектов, у каждого свой ID
    posts: [], // feedId - ссылка на фид у каждого поста
    form: {
      processState: 'filling',
      processError: null,
      error: null,
    },
  };

  const state = onChange(initialState, render(elements, initialState, i18nInstance));

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.form.processState = 'sending';
    state.form.processError = null;

    const formData = new FormData(e.target);
    const url = formData.get('url');

    const urlsList = state.feeds.map((feed) => feed.url);
    validateUrl(url, urlsList)
      .then((error) => {
        state.form.error = error;
        if (error) {
          state.form.processState = 'error';
          return;
        }
        state.form.processState = 'sent';
        state.feeds.push({
          id: uniqueId(),
          url,
        });
      })
      .then(() => console.log(state));
  });
};

export default app;
