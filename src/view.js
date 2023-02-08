function has(obj, path) {
  return Object.prototype.hasOwnProperty.call(obj, path);
}

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
  const fieldName = 'url';
  const fieldElement = elements.fields[fieldName];

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

export default render;
