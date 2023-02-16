import 'bootstrap';
import i18n from 'i18next';
import * as yup from 'yup';
import onChange from 'on-change';
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

  const posts = [...xmlDoc.querySelectorAll('item')].map((post) => ({
    title: post.querySelector('title').textContent,
    link: post.querySelector('link').textContent,
    description: post.querySelector('description').textContent,
  }));

  return {
    title: xmlDoc.querySelector('title').textContent,
    link: xmlDoc.querySelector('link'),
    description: xmlDoc.querySelector('description').textContent,
    posts,
  };
}

let uniqueId = 0;
function generateUniqueId() {
  uniqueId += 1;
  return `${uniqueId}`;
}

const mergePosts = (posts1, posts2) => {
  const filterDuplicates = (acc, post) => {
    const isEqual = acc.some((p) => p.feedId === post.feedId && p.title === post.title);
    if (!isEqual) {
      acc.push(post);
    }
    return acc;
  };
  return [...posts1, ...posts2].reduce(filterDuplicates, []);
};

const isEqualPosts = (posts1, posts2) => JSON.stringify(posts1) === JSON.stringify(posts2);

const loadRss = (url, state) => {
  const proxyUrl = buildProxyUrl(url);
  axios.get(proxyUrl)
    .then((response) => {
      const { contents } = response.data;
      if (!contents || response.data.status.http_code !== 200) {
        throw new Error(`urlDownloadError: ${proxyUrl}`);
      }
      const parsedContent = parseRSS(contents);
      const {
        title,
        link,
        description,
        posts,
      } = parsedContent;

      const feedId = generateUniqueId();
      state.feeds.push({
        id: feedId,
        url,
        title,
        link,
        description,
      });

      const postsToAdd = posts.map((post) => ({
        feedId,
        id: generateUniqueId(),
        ...post,
      }));

      const mergedPosts = mergePosts(state.posts, postsToAdd);
      if (!isEqualPosts(state.posts, mergedPosts)) {
        state.posts = mergedPosts;
      }

      state.form.error = null;
      state.form.processState = 'sent';
    })
    .catch((error) => {
      if (error.code === 'ERR_NETWORK') {
        state.form.error = 'networkError';
      } else {
        state.form.error = 'urlDownloadError';
      }
      state.form.processState = 'error';
    });
};

const updateRss = (state) => {
  const handler = () => {
    state.feeds.forEach((feed) => {
      if (state.form.processState === 'sending') {
        return;
      }
      const { url, id: feedId } = feed;
      const proxyUrl = buildProxyUrl(url);
      axios.get(proxyUrl)
        .then((response) => {
          const { contents } = response.data;
          if (!contents || response.data.status.http_code !== 200) {
            throw new Error(`urlDownloadError: ${proxyUrl}`);
          }
          const parsedContent = parseRSS(contents);
          const { posts } = parsedContent;

          const postsToAdd = posts.map((post) => ({
            feedId,
            id: generateUniqueId(),
            ...post,
          }));

          const mergedPosts = mergePosts(state.posts, postsToAdd);
          if (!isEqualPosts(state.posts, mergedPosts)) {
            state.posts = mergedPosts;
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
