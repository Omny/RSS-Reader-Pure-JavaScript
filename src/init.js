import 'bootstrap';
import i18n from 'i18next';
import * as yup from 'yup';
import onChange from 'on-change';
import uniqueId from 'lodash.uniqueid';
import axios from 'axios';
import resources from './locales/index.js';
import render from './view.js';

// export const buildProxiedUrl = (url) => {
//   const proxy = 'https://allorigins.hexlet.app';
//   const proxyURL = new URL(`${proxy}/get?url=${encodeURIComponent(url)}`);
//   proxyURL.searchParams.append('disableCache', 'true');
//   return proxyURL.href;
// };

const loadRss = (url, state) => {
  // загрузка нового фида и запись в состояние
  // получить файл
  // const proxiedUrl = buildProxiedUrl(url);
  axios.get(url)
    .then((response) => {
      // handle success
      state.feeds.push({
        id: uniqueId(),
        url,
      });
      state.form.error = null;
      state.form.processState = 'sent';
      console.log('axios прошел');
      console.log(response);
    })
    .catch(() => {
      state.form.error = 'urlDownloadError';
      state.form.processState = 'error';
      console.log('ошибка axios');
    });
  // .finally(() => {
  //   // always executed
  // });
  // если не ок, то новая ошибка
  // распарсить фид
  // если не ок, то новая ошибка
  // получить название
  // получить описание
  // получить топики
  // присвоить топикам id, сохранить названия и ссылки
};

const updateRss = (state) => {
  // обновление фидов и запрос новых постов раз в 5 секунд
};

const validateUrl = (url, urlsList) => {
  const urlSchema = yup.string().url('invalidUrlFormat').required('urlIsRequired').notOneOf(urlsList, 'urlIsDuplicate');
  return urlSchema.validate(url, { abortEarly: false });
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
    postsContainer: document.querySelector('.posts'),
    feedsContainer: document.querySelector('.feeds'),
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
      .then(() => {
        console.log('валидация прошла');
        loadRss(url, state);
      })
      .catch((error) => {
        console.log('ошибка валидации');
        state.form.error = error.message;
        state.form.processState = 'error';
      })
      .then(() => console.log(state));
  });

  elements.postsContainer.addEventListener('click', (e) => {
    e.preventDefault();
    // dom api - перехват и всплытие объясняет почему отрабатывает когда кликаем по ссылкам
    // нужно условие, если кликнули по ссылке, то меняется состояние
    // становится серая
    // если по пустому месту, то ничего происходить не должно
  });

  updateRss(state); // запускаем, сама крутится и делает
};

export default app;
