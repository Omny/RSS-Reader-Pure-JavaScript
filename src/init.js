/* eslint-disable no-param-reassign */
import 'bootstrap';
import i18n from 'i18next';
import * as yup from 'yup';
import onChange from 'on-change';
import _ from 'lodash';

import axios from 'axios';
import resources from './locales/index.js';
import render from './view.js';

const buildProxyUrl = (url) => {
  const proxy = 'https://allorigins.hexlet.app/get?disableCache=true&url=';
  const encodedUrl = encodeURIComponent(url);
  return `${proxy}${encodedUrl}`;
};

function parseRSS(xml) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, 'text/xml');

  const title = xmlDoc.querySelector('title').textContent;
  const description = xmlDoc.querySelector('description').textContent;
  const link = xmlDoc.querySelector('link').textContent;

  const posts = Array.from(xmlDoc.querySelectorAll('item')).map((post) => ({
    title: post.querySelector('title').textContent,
    link: post.querySelector('link').textContent,
    description: post.querySelector('description').textContent,
  }));

  return {
    title,
    description,
    link,
    posts,
  };
}

const loadRss = (url, state) => {
  const proxyUrl = buildProxyUrl(url);
  axios.get(proxyUrl)
    .then((response) => {
      if (!response.data.contents) {
        throw new Error('urlDownloadError');
      }
      const parsedContent = parseRSS(response.data.contents);
      const {
        description,
        title,
        link,
        posts,
      } = parsedContent;

      const feedId = _.uniqueId();
      state.feeds.push({
        id: feedId,
        url,
        description,
        title,
        link,
      });

      const newPosts = [];
      posts.forEach((post) => {
        const id = _.uniqueId();
        newPosts.push({
          feedId,
          id,
          ...post,
        });
      });
      // const isPostLinkDuplicate = (post, othPost) => post.link === othPost.link;
      const mergedPosts = _.unionBy(state.posts, newPosts, 'link');
      state.posts = mergedPosts;

      state.form.error = null;
      state.form.processState = 'sent';
      console.log('axios прошел');
      // console.log(response);
    })
    .catch((error) => {
      console.log('error: ', error.code);
      if (error.code === 'ERR_NETWORK') {
        state.form.error = 'networkError';
      } else {
        state.form.error = 'urlDownloadError';
      }
      state.form.processState = 'error';
      console.log('ошибка axios');
    });
};

const updateRss = (state) => {
  // обновление фидов и запрос новых постов раз в 5 секунд
  // используй finaly
  // подумай над promiseAll
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
    feeds: [],
    posts: [],
    form: {
      error: null,
      processState: 'filling',
    },
  };

  const state = onChange(initialState, render(elements, initialState, i18nInstance));

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.form.error = null;
    state.form.processState = 'sending';
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

  // elements.postsContainer.addEventListener('click', (e) => {
  // e.preventDefault();
  // dom api - перехват и всплытие объясняет почему отрабатывает когда кликаем по ссылкам
  // нужно условие, если кликнули по ссылке, то меняется состояние
  // становится серая
  // если по пустому месту, то ничего происходить не должно
  // });

  updateRss(state); // запускаем, сама крутится и делает
};

export default app;
