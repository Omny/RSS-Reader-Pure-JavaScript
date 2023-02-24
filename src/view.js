const handleFormState = (elements, formState, initialState, i18nInstance) => {
  const { urlField, submitButton, feedbackElement } = elements;

  submitButton.disabled = (formState === 'sending');
  switch (formState) {
    case 'sent':
      urlField.value = '';
      urlField.classList.remove('is-invalid');
      urlField.focus();
      feedbackElement.classList.remove('text-danger');
      feedbackElement.classList.add('text-success');
      feedbackElement.textContent = i18nInstance.t('urlLoadedSuccessfully');
      break;

    case 'error':
      urlField.classList.add('is-invalid');
      feedbackElement.classList.remove('text-success');
      feedbackElement.classList.add('text-danger');
      feedbackElement.textContent = i18nInstance.t(initialState.error);
      break;

    case 'filling':
    case 'sending':
      break;

    default:
      throw new Error(`Unknown form state: ${formState}`);
  }
};

const renderPosts = (elements, initialState, i18nInstance) => {
  const { postsContainer } = elements;
  postsContainer.innerHTML = '';
  const cardPosts = document.createElement('div');
  cardPosts.classList.add('card', 'border-0');
  postsContainer.append(cardPosts);

  const cardPostsBody = document.createElement('div');
  cardPostsBody.classList.add('card-body');
  cardPosts.append(cardPostsBody);

  const cardPostsTitle = document.createElement('h2');
  cardPostsTitle.classList.add('card-title', 'h4');
  cardPostsTitle.textContent = i18nInstance.t('posts');
  cardPostsBody.append(cardPostsTitle);

  const ulPosts = document.createElement('ul');
  ulPosts.classList.add('list-group', 'border-0', 'rounded-0');
  cardPosts.append(ulPosts);

  const liPosts = [];
  initialState.posts.forEach((post) => {
    const liPost = document.createElement('li');
    liPost.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    const aPost = document.createElement('a');
    const postClasses = (initialState.uiState.clickedIds.has(post.id)) ? ['fw-normal', 'link-secondary'] : ['fw-bold'];
    aPost.classList.add(...postClasses);
    aPost.setAttribute('href', post.link);
    aPost.setAttribute('data-id', post.id);
    aPost.setAttribute('rel', 'noopener noreferrer');
    aPost.setAttribute('target', '_blank');
    aPost.textContent = post.title;
    liPost.append(aPost);
    const buttonPost = document.createElement('button');
    buttonPost.setAttribute('type', 'button');
    buttonPost.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    buttonPost.setAttribute('data-id', post.id);
    buttonPost.setAttribute('data-bs-toggle', 'modal');
    buttonPost.setAttribute('data-bs-target', '#modal');
    buttonPost.textContent = i18nInstance.t('view');
    liPost.append(buttonPost);
    liPosts.push(liPost);
  });
  ulPosts.append(...liPosts);
};

const renderFeeds = (elements, initialState, i18nInstance) => {
  const { feedsContainer } = elements;
  feedsContainer.innerHTML = '';
  const cardFeeds = document.createElement('div');
  cardFeeds.classList.add('card', 'border-0');
  feedsContainer.append(cardFeeds);

  const cardFeedsBody = document.createElement('div');
  cardFeedsBody.classList.add('card-body');
  cardFeeds.append(cardFeedsBody);

  const cardFeedsTitle = document.createElement('h2');
  cardFeedsTitle.classList.add('card-title', 'h4');
  cardFeedsTitle.textContent = i18nInstance.t('feeds');
  cardFeedsBody.append(cardFeedsTitle);

  const ulFeeds = document.createElement('ul');
  ulFeeds.classList.add('list-group', 'border-0', 'rounded-0');
  cardFeeds.append(ulFeeds);

  const liFeeds = [];
  initialState.feeds.forEach((feed) => {
    const liFeed = document.createElement('li');
    liFeed.classList.add('list-group-item', 'border-0', 'border-end-0');
    const h3Feed = document.createElement('h3');
    h3Feed.classList.add('h6', 'm-0');
    h3Feed.textContent = feed.title;
    liFeed.append(h3Feed);
    const pFeed = document.createElement('p');
    pFeed.classList.add('m-0', 'small', 'text-black-50');
    pFeed.textContent = feed.description;
    liFeed.append(pFeed);
    liFeeds.push(liFeed);
  });
  ulFeeds.append(...liFeeds);
};

const renderModal = (elements, initialState) => {
  const { clickedDataId } = initialState.uiState;
  const { modalTitle, modalBody, modalLink } = elements.modal;
  const { posts } = initialState;
  const clickedPost = posts.find((post) => post.id === clickedDataId);
  modalTitle.textContent = clickedPost.title;
  modalBody.textContent = clickedPost.description;
  modalLink.href = clickedPost.link;
};

const render = (elements, initialState, i18nInstance) => (path, value) => {
  switch (path) {
    case 'formState':
      handleFormState(elements, value, initialState, i18nInstance);
      break;

    case 'feeds':
      renderFeeds(elements, initialState, i18nInstance);
      break;

    case 'posts':
    case 'uiState.clickedIds':
      renderPosts(elements, initialState, i18nInstance);
      break;

    case 'uiState.clickedDataId':
      renderModal(elements, initialState);
      break;

    default:
      break;
  }
};

export default render;
