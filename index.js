class View {
  constructor() {
    this.app = document.querySelector('.app');
    this.searchInput = this.createElement('input', 'search-text');
    this.searchInput.placeholder = 'Type to search';
    this.app.prepend(this.searchInput);
    this.repList = this.app.querySelector('.rep-list');
    this.cards = this.createElement('div', 'cards');
    this.cardList = this.createElement('ul', 'card-list');
    this.cards.append(this.cardList);
    document.body.append(this.cards);
  }

  createElement(elemTag, elemClass) {
    const elem = document.createElement(elemTag);
    if (elemClass) {
      elem.classList.add(elemClass);
    }
    return elem;
  }
}

class Search {
  constructor(view) {
    this.view = view;
    this.view.searchInput.addEventListener(
      'keyup',
      this.debounce(this.loadRepo.bind(this), 500)
    );
  }

  async loadRepo() {
    this.searchValue = this.view.searchInput.value.trim();
    this.count = 0;

    if (this.searchValue) {
      this.showError(null, true)
      await fetch(`https://api.github.com/search/repositories?q=${this.searchValue}`)
        .then((responce) => {
          if (responce.ok) {
            responce.json().then((responce) => {
              this.checkTotalCount(responce);
              this.showRepList(responce)
              document.body.addEventListener('click', this.createCard.bind(this));
            });
            
          } else if (!responce.ok)
            throw new Error(
              `Connection was failed ${responce.status}: ${responce.statusText}`
            );
        })
        .catch((err) => {
          this.showError(err, false)
        });
    } else {
      if (this.view.searchInput.value.match(/^\s+/gi)) return;
      this.clearData(this.view);
    }
  }

  checkTotalCount(data) {
    if (!data.total_count) {
      this.clearData(this.view, false);
      this.showError("this repository does'nt exist", false) 
    }
  }

  showRepList(data) {
    this.receiveRep = data.items
      .filter((item) =>
        item.name.toLowerCase().startsWith(this.searchValue.toLowerCase())
      )
      .slice(0, 5);
    this.getRep = this.receiveRep.map((data) => {
      this.count++;
      return `<li id=${this.count}>${data.name}</li>`;
    });
    this.view.repList.innerHTML = '';
    this.view.repList.classList.remove('active');
    this.view.repList.insertAdjacentHTML('beforeend', this.getRep.join(''));
    this.view.repList.classList.add('active');
  }

  showError (err, current) {
    const error = document.querySelector('.error')
    error.textContent = err
    error.hidden = current
  }
  
  createCard (e) {
    if (e.target.closest('.rep-list')) {
      const button = this.view.createElement('button', 'btn');
      const img = this.view.createElement('img');
      img.src = './assets/img/icons8-close.svg';
      button.append(img);

      const currentUser = this.receiveRep[e.target.id - 1];
      const card = this.view.createElement('li', 'card');

      const cardBlock = this.view.createElement('ul', 'card-block');
      cardBlock.insertAdjacentHTML(
        'beforeend',
        `<li>Name: ${currentUser.name}</li>
       <li>Owner: ${currentUser.owner.login}</li>
       <li>Stars: ${currentUser.stargazers_count}</li>`
      );
      card.append(cardBlock);
      cardBlock.append(button);
      this.view.cardList.append(card);
      this.clearData(this.view, true);
    }

    if (e.target.closest('.card-block')) {
      e.target.closest('.card').remove();
    }
  }

  clearData(data, searchInput) {
    if (searchInput) {
      data.searchInput.value = '';
    }
    data.repList.innerHTML = '';
    data.repList.classList.remove('active');
    this.showError (null, true)
  }

  debounce(fn, debounceTime) {
    let timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, arguments), debounceTime);
    };
  }
}

new Search(new View());