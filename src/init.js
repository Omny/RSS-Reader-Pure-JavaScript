import 'bootstrap';
import i18n from 'i18next';
import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import resources from './locales/index.js';
import render from './view.js';

export const buildProxyUrl = (url) => {
  const proxy = 'https://allorigins.hexlet.app/get';
  const proxyURL = new URL(proxy);
  proxyURL.searchParams.set('url', url);
  proxyURL.searchParams.set('disableCache', 'true');
  return proxyURL.href;
};

const parseRSS = (xml) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, 'text/xml');

  const feed = {
    title: xmlDoc.querySelector('title').textContent,
    link: xmlDoc.querySelector('link').textContent,
    description: xmlDoc.querySelector('description').textContent,
  };

  const posts = [...xmlDoc.querySelectorAll('item')].map((post) => ({
    title: post.querySelector('title').textContent,
    link: post.querySelector('link').textContent,
    description: post.querySelector('description').textContent,
  }));

  return { feed, posts };
};

let uniqueId = 0;
const generateUniqueId = () => {
  uniqueId += 1;
  return `${uniqueId}`;
};

const addNewPosts = (posts, feedId, state) => {
  const newPosts = posts.map((post) => ({
    feedId,
    id: generateUniqueId(),
    ...post,
  }));
  const isDouble = (post1, post2) => post1.feedId === post2.feedId && post1.title === post2.title;
  const addPosts = newPosts.filter((post1) => !state.posts.some((post2) => isDouble(post1, post2)));
  state.posts.push(...addPosts);
};

const loadRss = (url, state) => {
  const proxyUrl = buildProxyUrl(url);
  axios.get(proxyUrl)
    .then((response) => {
      const { feed, posts } = parseRSS(response.data.contents);

      const feedId = generateUniqueId();
      state.feeds.push({ id: feedId, url, ...feed });
      addNewPosts(posts, feedId, state);

      state.form.error = null;
      state.form.processState = 'sent';
    })
    .catch((error) => {
      state.form.error = (error.code === 'ERR_NETWORK') ? 'networkError' : 'urlDownloadError';
      state.form.processState = 'error';
    });
};

const updateRss = (state) => {
  const handler = () => {
    const promises = state.feeds.map((feed) => {
      const { url } = feed;
      const proxyURL = buildProxyUrl(url);
      return axios.get(proxyURL);
    });
    Promise.all(promises)
      .then((responses) => {
        responses.forEach((response, index) => {
          const { posts } = parseRSS(response.data.contents);
          const feedId = state.feeds[index].id;
          addNewPosts(posts, feedId, state);
        });
      })
      .finally(() => {
        setTimeout(handler, 5000);
      });
  };
  return handler;
};

const validateUrl = (url, urlsList) => {
  const urlSchema = yup.string().url('invalidUrlFormat').required('urlIsRequired').notOneOf(urlsList, 'urlIsDuplicate');
  return urlSchema.validate(url, { abortEarly: false });
};

const app = async () => {
  const i18nInstance = i18n.createInstance();
  await i18nInstance.init({
    lng: 'ru',
    debug: false,
    resources,
  });

  const elements = {
    form: document.querySelector('.rss-form'),
    urlField: document.getElementById('url-input'),
    feedbackElement: document.querySelector('p.feedback'),
    submitButton: document.querySelector('button[type="submit"]'),
    postsContainer: document.querySelector('.posts'),
    feedsContainer: document.querySelector('.feeds'),
    modal: {
      modalTitle: document.querySelector('.modal-title'),
      modalBody: document.querySelector('.modal-body'),
      modalLink: document.querySelector('.modal-footer > .full-article'),
    },
  };

  const initialState = {
    feeds: [],
    posts: [],
    form: {
      error: null,
      processState: 'filling',
    },
    uiState: {
      clickedDataId: null,
      clickedIds: new Set(),
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
        loadRss(url, state);
      })
      .catch((error) => {
        state.form.error = error.message;
        state.form.processState = 'error';
      });
  });

  elements.postsContainer.addEventListener('click', (e) => {
    const clickedDataId = e.target.getAttribute('data-id');
    state.uiState.clickedDataId = clickedDataId;
    state.uiState.clickedIds.add(clickedDataId);
  });

  const updateRssHandler = updateRss(state);
  updateRssHandler();
};

export default app;
