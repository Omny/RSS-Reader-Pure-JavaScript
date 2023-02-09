const handleProcessState = (elements, processState, initialState) => {
  const { form } = elements;
  const urlField = elements.fields.url;
  const { submitButton } = elements;
  const { feedbackElement } = elements;

  switch (processState) {
    case 'sent':
      submitButton.disabled = false;
      form.reset();
      urlField.classList.remove('is-invalid');
      urlField.focus();
      feedbackElement.classList.remove('text-danger');
      feedbackElement.classList.add('text-success');
      feedbackElement.textContent = 'done';
      break;

    case 'error':
      submitButton.disabled = false;
      urlField.classList.add('is-invalid');
      feedbackElement.classList.remove('text-success');
      feedbackElement.classList.add('text-danger');
      feedbackElement.textContent = initialState.form.error; // replace with language variable
      break;

    case 'sending':
      submitButton.disabled = true;
      break;

    case 'filling':
      submitButton.disabled = false;
      break;

    default:
      throw new Error(`Unknown process state: ${processState}`);
  }
};

const renderPosts = (elements, value) => {
  // container.innerHTML = '';
  // const buttons = state.posts.map();

  // container.append(...buttons);
};

const render = (elements, initialState, i18nInstance) => (path, value, prevValue) => {
  // console.log(i18nInstance.t('ru'));
  switch (path) {
    case 'form.processState':
      handleProcessState(elements, value, initialState);
      break;

    case 'posts':
      renderPosts(elements, value);
      break;

    default:
      break;
  }
};

export default render;
