import './styles.scss';
import * as bootstrap from 'bootstrap';
import * as yup from 'yup';
import onChange from 'on-change';

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

const keyBy = (array, key) => array.reduce((acc, curr) => {
  acc[curr[key]] = curr;
  return acc;
}, {});

function has(obj, path) {
  return Object.prototype.hasOwnProperty.call(obj, path);
}

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

const handleProcessState = (elements, processState) => {
  switch (processState) {
    case 'sent':
      elements.submitButton.disabled = false;
      break;

    case 'error':
      // elements.submitButton.disabled = false;
      break;

    case 'sending':
      elements.submitButton.disabled = true;
      break;

    case 'filling':
      elements.submitButton.disabled = false;
      break;

    default:
      throw new Error(`Unknown process state: ${processState}`);
  }
};

const renderErrors = (elements, errors, prevErrors, state) => {
  Object.entries(elements.fields).forEach(([fieldName, fieldElement]) => {
    const error = errors[fieldName];
    const fieldHadError = has(prevErrors, fieldName);
    const fieldHasError = has(errors, fieldName);
    if (!fieldHadError && !fieldHasError) {
      return;
    }

    if (fieldHadError && !fieldHasError) {
      fieldElement.classList.remove('is-invalid');
      elements.feedbackElement.textContent = '';
      return;
    }

    if (state.form.fieldsUi.touched[fieldName] && fieldHasError) {
      fieldElement.classList.add('is-invalid');
      elements.feedbackElement.textContent = error.message;
    }
  });
};

const render = (elements, initialState) => (path, value, prevValue) => {
  switch (path) {
    case 'form.processState':
      handleProcessState(elements, value);
      break;

    case 'form.valid':
      elements.submitButton.disabled = !value;
      break;

    case 'form.errors':
      renderErrors(elements, value, prevValue, initialState);
      break;

    default:
      break;
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

  // Object.entries(elements.fields).forEach(([fieldName, fieldElement]) => {
  //   fieldElement.addEventListener('input', (e) => {
  //     const { value } = e.target;
  //     state.form.fields[fieldName] = value;
  //     state.form.fieldsUi.touched[fieldName] = true;
  //     const errors = validate(state.form.fields);
  //     state.form.errors = errors;
  //     state.form.valid = isEmpty(errors);
  //     console.log(state);
  //   });
  // });

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

app();
