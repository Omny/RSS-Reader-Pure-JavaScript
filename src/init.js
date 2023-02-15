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

  const posts = [...xmlDoc.querySelectorAll('item')].map((post) => ({
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
  axios.get(buildProxyUrl(url))
    .then((response) => {
      const { contents } = response.data;
      if (!contents) {
        throw new Error(`urlDownloadError: ${url}`);
      }
      const parsedContent = parseRSS(contents);
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

      const postsToAdd = posts.map((post) => ({
        feedId,
        id: _.uniqueId(),
        ...post,
      }));

      const mergedPosts = _.unionBy(state.posts, postsToAdd, (post) => `${post.feedId}-${post.title}-${post.link}`);
      if (!_.isEqual(state.posts, mergedPosts)) {
        state.posts = mergedPosts;
        console.log('добавление прошло');
      }

      state.form.error = null;
      state.form.processState = 'sent';
      console.log('axios прошел');
      // console.log(response);
    })
    .catch((error) => {
      // console.log('error: ', error.code);
      if (error.code === 'ERR_NETWORK') {
        state.form.error = 'networkError';
      } else {
        state.form.error = 'urlDownloadError';
      }
      state.form.processState = 'error';
      // console.log('ошибка axios');
    });
};

const updateRss = (state) => {
  const handler = () => {
    state.feeds.forEach((feed) => {
      if (state.form.processState === 'sending') {
        return;
      }
      const { url, id: feedId } = feed;
      axios.get(buildProxyUrl(url))
        .then((response) => {
          const { contents } = response.data;
          if (!contents) {
            throw new Error(`urlDownloadError: ${url}`);
          }
          const parsedContent = parseRSS(contents);
          const { posts } = parsedContent;

          const postsToAdd = posts.map((post) => ({
            feedId,
            id: _.uniqueId(),
            ...post,
          }));

          const mergedPosts = _.unionBy(state.posts, postsToAdd, (post) => `${post.feedId}-${post.title}-${post.link}`);
          if (!_.isEqual(state.posts, mergedPosts)) {
            state.posts = mergedPosts;
            console.log('обновление прошло');
          }
        });
    });

    setTimeout(handler, 5000);
  };
  return handler;
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

  const updateRssHandler = updateRss(state);
  updateRssHandler(); // запускаем, сама крутится и делает
};

export default app;
