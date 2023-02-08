import * as bootstrap from 'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';
import render from './view';

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

const keyBy = (array, key) => array.reduce((acc, curr) => {
  acc[curr[key]] = curr;
  return acc;
}, {});

const schema = yup.object().shape({
  url: yup.string().url().nullable(),
});

const validate = (fields) => {
  try {
    schema.validateSync(fields, { abortEarly: false });
    return {};
  } catch (e) {
    return keyBy(e.inner, 'path');
  }
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
    form: {
      valid: true,
      processState: 'filling',
      processError: null,
      errors: {},
      fields: {
        url: '',
      },
      fieldsUi: {
        touched: {
          url: false,
        },
      },
    },
  };

  const state = onChange(initialState, render(elements, initialState));

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.form.processState = 'sending';
    state.form.processError = null;

    const formData = new FormData(e.target);
    const value = formData.get('url');
    state.form.fields.url = value;
    state.form.fieldsUi.touched.url = true;

    const errors = validate(state.form.fields);
    state.form.errors = errors;
    state.form.valid = isEmpty(errors);

    state.form.processState = 'sent';
    console.log(state);
  });
};

export default app;
