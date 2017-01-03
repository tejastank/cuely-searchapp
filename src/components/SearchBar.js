import React, {Component} from 'react';
import ReactDOM from 'react-dom';

export default class SearchBar extends Component {
  constructor(props){
    super();
    this.setFocus = ::this.setFocus;
    this.resizable = ::this.resizable;
  }

  componentDidMount() {
    const input = ReactDOM.findDOMNode(this.refs.input);
    input.focus();

    this.resizable(input, 11);
  }

  resizable (el, factor) {
    var int = Number(factor) || 7.7;
    function resize() {el.style.width = ((el.value.length+1) * int) + 'px'}
    var e = 'keyup,keypress,focus,blur,change'.split(',');
    for (var i in e) el.addEventListener(e[i],resize,false);
    resize();
  }

  componentDidUpdate() {
    const input = ReactDOM.findDOMNode(this.refs.input);
    if (this.props.selectedIndex < 0) {
      input.focus();
    }
    if (this.props.clearInput) {
      input.value = ''
    }
  }

  setFocus() {
    ReactDOM.findDOMNode(this.refs.input).focus();
  }

  setText(text) {
    const input = ReactDOM.findDOMNode(this.refs.input);
    input.value = text;
    input.dispatchEvent(new Event('input', {
      'bubbles': true,
      'cancelable': true
    }));
  }

  render() {
    return (
      <div className={this.props.className} id={this.props.id} onMouseUp={this.props.onDragEnd}>
        <span className="search_bar_icon"/>
          <input
            type="text"
            placeholder="Search your company items"
            className="search_bar_input"
            onKeyUp={this.props.onKeyUp}
            onKeyDown={this.props.onKeyDown}
            onInput={this.props.onInput}
            ref='input' />
      </div>
    );
  }
}
