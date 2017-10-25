/**
 * Created by Dimitri on 22/10/2017.
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import {Motion, spring} from 'react-motion'
import { Icon } from 'semantic-ui-react'

import style from './style/draggableList.scss'

const springConfig = {stiffness: 300, damping: 50};

class DraggableList extends Component {

    constructor( props ) {

        super( props );

        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleOnScroll = this.handleOnScroll.bind(this);

        this.state = {
            items: props.items,
            range_array: [],
            h: 60,
            delta: 0,
            mouseY: 0,
            isPressed: false,
            originalPosOfLastPressed: 0,
            originalIdOfLastPressed: null,
            currentRow: 0,
            containerHeight: 0,
        }
    }

    componentDidMount() {

        window.addEventListener('scroll', this.handleOnScroll);
        window.addEventListener('touchmove', this.handleTouchMove);
        window.addEventListener('touchend', this.handleMouseUp);
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);
    };

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleOnScroll, false);
        window.removeEventListener('touchmove', this.handleTouchMove, false);
        window.removeEventListener('touchend', this.handleMouseUp, false);
        window.removeEventListener('mousemove', this.handleMouseMove, false);
        window.removeEventListener('mouseup', this.handleMouseUp, false);
    }

    componentWillReceiveProps(nextProps) {

        const { items } = nextProps;

        if ( items !== this.props.items ) {

            this.setState({
                items: items,
                range_array: getDisplayedItems( items, this.state.h ),
                containerHeight: `${items.length * this.state.h}px`
            });
        }
    }

    handleOnScroll(){
        const { h, items } = this.state;
        this.setState({
            range_array: getDisplayedItems( items, h ),
        });
    }

    handleTouchStart(key, id, pressLocation, e){
        this.handleMouseDown(key, id, pressLocation, e.touches[0]);
    };

    handleTouchMove(e){
        e.preventDefault();
        this.handleMouseMove(e.touches[0]);
    };

    handleMouseUp() {

        const { currentRow, originalPosOfLastPressed, items, isPressed } = this.state;

        // Avoid firing on all mouse click.
        if ( !isPressed ) return;

        const { callbackMouseUp } = this.props;
        let newItems = items;

        if (currentRow !== originalPosOfLastPressed){
            newItems = reinsert(newItems, originalPosOfLastPressed, currentRow);
            callbackMouseUp( newItems, originalPosOfLastPressed, currentRow )
                .then( (data) => {
                    if(data.success) {
                        this.setState({
                            items: newItems,
                        });
                    }
                });
        }

        this.setState({
            isPressed: false,
            delta: 0,
            currentRow: 0,
            originalPosOfLastPressed: 0,
            originalIdOfLastPressed: null,
        });
    }

    handleMouseMove({pageY}) {

        const {h, isPressed, delta, items} = this.state;
        const itemsCount = items.length;

        if (isPressed) {
            const mouseY = pageY - delta;
            const currentRow = clamp(Math.round(mouseY / h), 0, itemsCount - 1 );
            this.setState({mouseY: mouseY, currentRow: currentRow});
        }
    }


    handleMouseDown(pos, id, pressY, {pageY}){
        this.setState({
            delta: pageY - pressY,
            mouseY: pressY,
            isPressed: true,
            currentRow: pos,
            originalPosOfLastPressed: pos,
            originalIdOfLastPressed: id,
        });
    };

    render() {

        const { h, mouseY, isPressed, originalIdOfLastPressed, items, range_array, containerHeight } = this.state;
        const { component: Component, dragActive, ...props } = this.props;
        const classes = ['dl', 'dl-container'];

        const range = items.slice( range_array[0], range_array[1] );

        if( dragActive ) classes.push('dl-drag-active');

         return (
             <div className={classes.join(' ')} style={{minHeight:containerHeight}}>
                 {range.map( ( item, i ) =>{

                     let id = item._id;
                     let isDragged = isPressed && originalIdOfLastPressed === id;
                     let realIndex = i + range_array[0];
                     let classes = ['dl-item', 'dl-item'];

                     const style = isDragged
                         ? {
                             scale: spring(1.1, springConfig),
                             shadow: spring(16, springConfig),
                             y: mouseY,
                             opacity: 1,
                         }
                         : {
                             scale: spring(1, springConfig),
                             shadow: spring(1, springConfig),
                             y: spring( realIndex * h, springConfig),
                             opacity: spring(1, springConfig),
                         };

                     return (
                         <Motion style={style}
                                 defaultStyle={{
                                     opacity: 0,
                                     scale: 1,
                                     shadow: 1,
                                     y: realIndex * h,
                                     zIndex: realIndex,
                                 }}
                                 key={id}>
                             {({scale, shadow, y, opacity}) => {

                                 if ( scale > 1 ) classes.push('dl-dragged');

                                 return (
                                     <div className={classes.join(' ')}
                                          style={{
                                             opacity: `${opacity}`,
                                             boxShadow: `rgba(0, 0, 0, 0.2) 0px ${shadow}px ${2 * shadow}px 0px`,
                                             transform: `translate3d(0, ${y}px, 0) scale(${scale})`,
                                             WebkitTransform: `translate3d(0, ${y}px, 0) scale(${scale})`,
                                             zIndex: scale !== 1 ? 1000 : realIndex,
                                          }}>
                                         <Component item={item} index={realIndex} {...props} />
                                         {dragActive &&
                                             <div className='dl-hand-right'
                                                  onMouseDown={this.handleMouseDown.bind(this, realIndex, id, y)}
                                                  onTouchStart={this.handleTouchStart.bind(this, realIndex, id, y)}>
                                                 <Icon className='pli-move' name='move' color='grey'/>
                                             </div>
                                         }
                                     </div>
                                 )}
                             }
                         </Motion>
                     )
                 })
             }
             </div>
         );
    }
}

const mapStateToProps = state => {
    return {
    }
};

const mapDispatchToProps = dispatch => {
    return {
    }
};

const DraggableListContainer = connect(
    null,
    null
)(DraggableList);


//HELPER
function reinsert(arr, from, to) {
    const _arr = arr.slice(0);
    const val = _arr[from];
    _arr.splice(from, 1);
    _arr.splice(to, 0, val);
    return _arr;
}

function clamp(n, min, max) {
    return Math.max(Math.min(n, max), min);
}

function getDisplayedItems( arr, h ) {

    const y = window.scrollY;
    const w = window.innerHeight;

    const indexStart = clamp(Math.round( (y-200) / h), 0, arr.length);
    const indexEnd = clamp(Math.round((y+w-100) / h), 0, arr.length);

    return [ indexStart, indexEnd ];
}


export default DraggableListContainer