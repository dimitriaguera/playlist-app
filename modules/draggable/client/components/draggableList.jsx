/**
 * Created by Dimitri on 22/10/2017.
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Motion, spring} from 'react-motion'

const springConfig = {stiffness: 300, damping: 50};

class DraggableList extends Component {
  constructor (props) {
    super(props);

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleOnScroll = this.handleOnScroll.bind(this);

    this.state = {
      items: props.items,
      range_array: getDisplayedItems(null, props.items, (props.height || 70)),
      h: props.height || 70,
      delta: 0,
      mouseY: 0,
      isPressed: false,
      originalPosOfLastPressed: 0,
      originalIdOfLastPressed: null,
      currentRow: 0,
      containerHeight: `${props.items.length * (props.height || 70)}px`
    };

    this.scrollContainerName = this.props.scrollContainerName || 'window';
  }



  componentDidMount () {

    // Event handlers.
    if (this.scrollContainerName === 'window'){
      this.scrollContainer = window;
    } else {
      this.scrollContainer = document.getElementById(this.scrollContainerName);
    }

    this.scrollContainer.addEventListener('scroll', this.handleOnScroll);
    this.scrollContainer.addEventListener('touchmove', this.handleTouchMove);
    this.scrollContainer.addEventListener('touchend', this.handleMouseUp);
    this.scrollContainer.addEventListener('mousemove', this.handleMouseMove);
    this.scrollContainer.addEventListener('mouseup', this.handleMouseUp);
  };

  componentWillUnmount () {
    this.scrollContainer.removeEventListener('scroll', this.handleOnScroll, false);
    this.scrollContainer.removeEventListener('touchmove', this.handleTouchMove, false);
    this.scrollContainer.removeEventListener('touchend', this.handleMouseUp, false);
    this.scrollContainer.removeEventListener('mousemove', this.handleMouseMove, false);
    this.scrollContainer.removeEventListener('mouseup', this.handleMouseUp, false);
  }

  componentWillReceiveProps (nextProps) {
    const { items } = nextProps;

    if (items !== this.props.items) {
      this.setState({
        items: items,
        range_array: getDisplayedItems(this.scrollContainer, items, this.state.h),
        containerHeight: `${items.length * this.state.h}px`
      });
    }
  }

  handleOnScroll () {
    const { h, items } = this.state;
    this.setState({
      range_array: getDisplayedItems(this.scrollContainer, items, h)
    });
  }

  handleTouchStart (key, id, pressLocation, e) {
    this.handleMouseDown(key, id, pressLocation, e.touches[0]);
  }

  handleTouchMove (e) {
    e.preventDefault();
    this.handleMouseMove(e.touches[0]);
  }

  handleMouseUp () {
    const _self = this;
    const { currentRow, originalPosOfLastPressed, items, isPressed } = this.state;

    // Avoid firing on all mouse click.
    if (!isPressed) return;

    const { callbackMouseUp } = this.props;
    let newItems = items;

    if (currentRow !== originalPosOfLastPressed) {
      newItems = reinsert(newItems, originalPosOfLastPressed, currentRow);

      this.setState({
        items: newItems
      });

      callbackMouseUp(items, newItems, _self);
    }

    this.setState({
      isPressed: false,
      delta: 0,
      currentRow: 0,
      originalPosOfLastPressed: 0,
      originalIdOfLastPressed: null
    });
  }

  handleMouseMove ({pageY}) {
    const {h, isPressed, delta, items} = this.state;
    const itemsCount = items.length;

    if (isPressed) {
      const mouseY = pageY - delta;
      const currentRow = clamp(Math.round(mouseY / h), 0, itemsCount - 1);
      this.setState({mouseY: mouseY, currentRow: currentRow});
    }
  }


  handleMouseDown (pos, id, pressY, {pageY}) {
    this.setState({
      delta: pageY - pressY,
      mouseY: pressY,
      isPressed: true,
      currentRow: pos,
      originalPosOfLastPressed: pos,
      originalIdOfLastPressed: id
    });
  };

  render () {
    const { h, mouseY, isPressed, originalIdOfLastPressed, range_array, containerHeight } = this.state;
    const { component: Component, dragActive = true, color, items, ...props } = this.props;
    const classes = ['unstyled','dl', 'dl-container'];

    const range = items.slice(range_array[0], range_array[1]);

    if (dragActive) classes.push('dl-drag-active');
    if (color) classes.push(color);

    return (
      <ul className={classes.join(' ')} style={{minHeight: containerHeight}}>
        {range.map((item, i) => {
          //let id = item._id ? item._id : item.path;
          let id = i + range_array[0];
          let isDragged = isPressed && originalIdOfLastPressed === id;
          let realIndex = i + range_array[0];
          let classes = ['dl-item'];

          const style = isDragged
            ? {
              scale: spring(1.1, springConfig),
              y: mouseY,
              opacity: 1
            }
            : {
              scale: spring(1, springConfig),
              y: spring(realIndex * h, springConfig),
              opacity: spring(1, springConfig)
            };

          return (
            <Motion style={style}
              defaultStyle={{
                opacity: 0,
                scale: 1,
                y: realIndex * h,
                zIndex: realIndex
              }}
              key={id}>
              {({scale, y, opacity}) => {

                if (scale > 1 && classes.indexOf('dl-dragged') === -1) {
                  classes.push('dl-dragged');
                }

                return (
                  <li className={classes.join(' ')}
                    style={{
                      opacity: `${opacity}`,
                      transform: `translate3d(0, ${y}px, 0) scale(${scale})`,
                      WebkitTransform: `translate3d(0, ${y}px, 0) scale(${scale})`,
                      zIndex: scale !== 1 ? 1000 : realIndex,
                      height: `${h}px`
                    }}>
                    <Component item={item} index={realIndex} {...props} />
                    {dragActive &&
                    <div className='dl-hand-right'
                      onMouseDown={this.handleMouseDown.bind(this, realIndex, id, y)}
                      onTouchStart={this.handleTouchStart.bind(this, realIndex, id, y)}>
                      <i aria-hidden="true" className='icon icon-move'/>
                    </div>
                    }
                  </li>
                ) }
              }
            </Motion>
          )
        })
        }
      </ul>
    );
  }
}

// HELPER
function reinsert (arr, from, to) {
  const _arr = arr.slice(0);
  const val = _arr[from];
  _arr.splice(from, 1);
  _arr.splice(to, 0, val);
  return _arr;
}

function clamp (n, min, max) {
  return Math.max(Math.min(n, max), min);
}

function getDisplayedItems (scrollContainer, arr, h) {

  let y;
  if (scrollContainer && typeof scrollContainer.scrollTop === 'number') {
    y = scrollContainer.scrollTop;
  } else {
    y = window.scrollY;
  }

  const w = window.innerHeight;

  const indexStart = clamp(Math.round((y - 200) / h), 0, arr.length);
  const indexEnd = clamp(Math.round((y + w - 100) / h), 0, arr.length);

  return [ indexStart, indexEnd ];
}


export default DraggableList
