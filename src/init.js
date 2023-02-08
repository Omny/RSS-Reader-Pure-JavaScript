import * as bootstrap from 'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';
import render from './view';

const validateUrl = (url, urlsList) => {
  const urlSchema = yup.string().url().nullable().notOneOf(urlsList, 'URL is duplicate');
  return urlSchema.validate(url, { abortEarly: false })
    .then(() => null)
    .catch((e) => e.message);
};

const app = () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    fields: {
      url: document.getElementById('url-input'),
    },
    feedbackElement: document.querySelector('p.feedback'),
    submitButton: document.querySelector('button[type="submit"]'),
  };

  const initialState = {
    feeds: [],
    posts: [], // feedId - ссылка на фид у каждого поста
    form: {
      processState: 'filling',
      processError: null,
      error: null,
    },
  };

  const state = onChange(initialState, render(elements, initialState));

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.form.processState = 'sending';
    state.form.processError = null;

    const formData = new FormData(e.target);
    const url = formData.get('url');

    validateUrl(url, state.feeds)
      .then((error) => {
        state.form.error = error;
        if (error) {
          state.form.processState = 'error';
          return;
        }
        state.form.processState = 'sent';
        state.feeds.push(url);
      })
      .then(() => console.log(state));
  });
};

export default app;
