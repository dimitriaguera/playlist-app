/**
 * Created by Dimitri on 22/10/2017.
 */
import React, { Component } from 'react';
import { Motion, spring } from 'react-motion';

const springConfig = { stiffness: 300, damping: 50 };

class TransitionList extends Component {
  constructor(props) {
    super(props);
    this.handleOnScroll = this.handleOnScroll.bind(this);

    this.state = {
      range_array: getDisplayedItems(props.items, props.height || 70),
      h: props.height || 70,
      containerHeight: `${props.items.length * (props.height || 70)}px`
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleOnScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleOnScroll, false);
  }

  componentWillReceiveProps(nextProps) {
    const { items } = nextProps;

    if (items !== this.props.items) {
      this.setState({
        range_array: getDisplayedItems(items, this.state.h),
        containerHeight: `${items.length * this.state.h}px`
      });
    }
  }

  handleOnScroll() {
    const { h } = this.state;
    const { items } = this.props;

    this.setState({
      range_array: getDisplayedItems(items, h)
    });
  }

  render() {
    const { h, range_array, containerHeight } = this.state;
    const { component: Component, color, items, ...props } = this.props;
    const classes = ['tl', 'tl-container'];

    const range = items.slice(range_array[0], range_array[1]);

    if (color) classes.push(color);

    return (
      <div className={classes.join(' ')} style={{ minHeight: containerHeight }}>
        {range.map((item, i) => {
          let realIndex = i + range_array[0];
          let id = item._id || `item.name${realIndex}`;
          let classes = ['tl-item'];

          const style = {
            y: spring(realIndex * h, springConfig),
            opacity: spring(1, springConfig)
          };

          return (
            <Motion
              style={style}
              defaultStyle={{
                opacity: 0,
                y: realIndex * h
              }}
              key={id}
            >
              {({ y, opacity }) => {
                return (
                  <div
                    className={classes.join(' ')}
                    style={{
                      opacity: `${opacity}`,
                      transform: `translate3d(0, ${y}px, 0)`,
                      WebkitTransform: `translate3d(0, ${y}px, 0)`,
                      height: `${h}px`
                    }}
                  >
                    <Component item={item} index={realIndex} {...props} />
                  </div>
                );
              }}
            </Motion>
          );
        })}
      </div>
    );
  }
}

// HELPER
function clamp(n, min, max) {
  return Math.max(Math.min(n, max), min);
}

function getDisplayedItems(arr, h) {
  const y = window.scrollY;
  const w = window.innerHeight;

  const delta = 300;

  const indexStart = clamp(Math.round((y - delta) / h), 0, arr.length);
  const indexEnd = clamp(Math.round((y + w + delta) / h), 0, arr.length);

  return [indexStart, indexEnd];
}

export default TransitionList;
