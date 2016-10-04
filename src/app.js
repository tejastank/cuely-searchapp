import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import { ipcRenderer, shell } from 'electron';

import { Scrollbars } from 'react-custom-scrollbars';
import SearchBar from './components/SearchBar';
import CuelyLogo from './logos/cuely-logo.svg';
import GoogleLogo from './logos/google-logo.png';

export default class App extends Component {
  constructor(props){
    super();
    this.handleInput = ::this.handleInput;
    this.handleInputClick = ::this.handleInputClick;
    this.handleKeyUp = ::this.handleKeyUp;
    this.renderItem = ::this.renderItem;
    this.renderSelectedItemContent = ::this.renderSelectedItemContent;
    this.resetState = ::this.resetState;
    this.state = {
      searchResults: [],
      selectedIndex: -1,
      clearInput: false
    }
  }

  resetState() {
    this.setState({ searchResults: [], selectedIndex: -1, clearInput: true });
  }

  componentDidMount() {
    ipcRenderer.on('searchResult', (event, arg) => {
      this.setState({ searchResults: arg, clearInput: false });
    });
    ipcRenderer.on('clear', () => {
      this.resetState();
    });
  }

  componentDidUpdate() {
    const listHeight = Math.max(200, this.getElementHeight("searchSuggestionsList") + 1);

    const content = document.getElementById("searchSuggestionsContent");
    if (content) {
      // adjust the content height (for <pre> element)
      content.style.height = listHeight + 'px';
      // scroll the content to first highlight result (or to beginning if there's no highlighted result)
      const elms = document.getElementsByClassName("algolia_highlight");
      if (elms && elms.length > 0) {
        const elm = elms[0];
        content.scrollTop = elm.offsetTop - 100;
      } else {
        content.scrollTop = 0;
      }
    }

    // adjust the window height to the height of the list
    const h = listHeight + this.getElementHeight("searchBar");
    ipcRenderer.send('search_rendered', { height: h });

    // focus selected item
    if (this.state.selectedIndex > -1) {
      const node = ReactDOM.findDOMNode(this.refs[`searchItem${this.state.selectedIndex}`]);
      if (node && node.children) {
        node.children[0].focus();
      }
    }
  }

  getElementHeight(id) {
    const el = document.getElementById(id);
    if (!el) {
      return 0;
    }
    const styleHeight = window.getComputedStyle(el).getPropertyValue("height").slice(0, -2);
    return parseInt(styleHeight);
  }


  handleKeyUp(e) {
    if (e.key === 'Escape') {
      if (e.target.value || this.state.selectedIndex > -1) {
        e.target.value = '';
        this.resetState();
      } else {
        ipcRenderer.send('hide-search');
      }
    } else if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) {
      e.preventDefault();
      let index = this.state.selectedIndex;
      index = (index >= this.state.searchResults.length - 1) ? index : index + 1;
      this.setState({ selectedIndex: index });
    } else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) {
      e.preventDefault();
      let index = this.state.selectedIndex;
      index = (index < 0) ? index : index - 1;
      this.setState({ selectedIndex: index });
    }
  }

  handleInput(e) {
    if (e.target.value) {
      ipcRenderer.send('search', e.target.value);
    } else {
      this.resetState();
    }
  }

  handleInputClick(e) {
    this.setState({ selectedIndex: -1 });
    this.refs.scrollbars.scrollToTop();
  }

  handleClick(e) {
    e.preventDefault();
    shell.openExternal(e.target.href);
    ipcRenderer.send('hide-search');
  }

  renderItem(item, i) {
    const liClass = (i === this.state.selectedIndex) ? 'search_suggestions_card_highlight' : 'search_suggestions_card';
    const icon = item.displayIcon ? item.displayIcon : (item.type === 'intra' ? CuelyLogo : GoogleLogo);
    const title = item.title.length > 50 ? item.title.substring(0, 49) + '...' : item.title;

    return (
      <li key={i} className={liClass} ref={`searchItem${i}`}>
        <a href={item.webLink} onClick={this.handleClick} className="search_suggestion_card_link">
          <img src={icon} className="search_suggestions_logo" />
          <div className="search_suggestions_data">
            <div className="title" dangerouslySetInnerHTML={{ __html: title }} />
            <div className="body">
              <div><span className="attribute_label">Edit:&nbsp;</span><span>{item.metaInfo.time}</span></div>
              {item.metaInfo.users.map(user => (<div className="user"><span className="attribute_label">{user.type}:&nbsp;</span><span className="user_name" dangerouslySetInnerHTML={{ __html: user.name }} ></span></div>))}
            </div>
          </div>
        </a>
      </li>
    )
  }

  renderSelectedItemContent(i) {
    if (i < 0) {
      return null;
    }
    const item = this.state.searchResults[i];
    return (
      <pre id="searchSuggestionsContentPre" dangerouslySetInnerHTML={{ __html: item.content }} />
    )
  }

  renderSearchResults() {
    return (
      <div className="search_suggestions" id="searchSuggestions" onKeyUp={this.handleKeyUp}>
        <div className="search_suggestions_list">
          <Scrollbars autoHeight autoHeightMin={0} autoHeightMax={400} style={{ border: 'none' }} ref="scrollbars">
            <ul id="searchSuggestionsList">
              {this.state.searchResults.map(this.renderItem)}
            </ul>
          </Scrollbars>
        </div>
        <div className="search_suggestions_content" id="searchSuggestionsContent">
          {this.renderSelectedItemContent(this.state.selectedIndex)}
        </div>
      </div>
    );
  }

  render() {
    const open = this.state.searchResults.length > 0;
    return (
      <div className="search_root">
        <SearchBar
          onKeyUp={this.handleKeyUp}
          onInput={this.handleInput}
          onClick={this.handleInputClick}
          className={open ? "search_bar_open" : "search_bar"}
          id="searchBar"
          selectedIndex={this.state.selectedIndex}
          clearInput={this.state.clearInput}
        />
        {open ? this.renderSearchResults() : null}
      </div>
    );
  }
}
