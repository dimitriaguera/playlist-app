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

        this.state = {
            items: props.items,
            h: 60,
            delta: 0,
            mouseY: 0,
            isPressed: false,
            originalPosOfLastPressed: 0,
            originalIdOfLastPressed: null,
            currentRow: 0,
        }
    }

    componentDidMount() {
        window.addEventListener('touchmove', this.handleTouchMove);
        window.addEventListener('touchend', this.handleMouseUp);
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);
    };

    componentWillReceiveProps(nextProps) {

        const { items } = nextProps;

        if ( items !== this.props.items ) {
            this.setState({
                items: items,
            });
        }
    }

    // shouldComponentUpdate(nextProps, nextState) {
    //     console.log('shouldUpdate : ', ( !this.props.items.length || this.state.isPressed || (nextProps.items.title !== this.props.items.title) ));
    //     return ( !this.props.items.length || this.state.isPressed || (nextProps.items.title !== this.props.items.title) );
    // }

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
            callbackMouseUp( newItems, originalPosOfLastPressed, currentRow );
            this.setState({
                items: newItems,
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

        const { h, mouseY, isPressed, originalIdOfLastPressed, items } = this.state;
        const { component: Component, dragActive, ...props } = this.props;
        const classes = ['dl', 'dl-container'];

        if( dragActive ) classes.push('dl-drag-active');

         return (
             <div className={classes.join(' ')}>
                 {items.map( ( item, i ) =>{

                     let id = item._id;

                     const style = isPressed && originalIdOfLastPressed === id
                         ? {
                             scale: spring(1.1, springConfig),
                             shadow: spring(16, springConfig),
                             y: mouseY,
                         }
                         : {
                             scale: spring(1, springConfig),
                             shadow: spring(1, springConfig),
                             y: spring(i * h, springConfig),
                         };

                     return (
                         <Motion style={style} key={id}>
                             {({scale, shadow, y}) =>
                                 <div className='dl-item'
                                      style={{
                                         boxShadow: `rgba(0, 0, 0, 0.2) 0px ${shadow}px ${2 * shadow}px 0px`,
                                         transform: `translate3d(0, ${y}px, 0) scale(${scale})`,
                                         WebkitTransform: `translate3d(0, ${y}px, 0) scale(${scale})`,
                                         zIndex: scale !== 1 ? 1000 : i,
                                      }}>
                                     <Component item={item} index={i} {...props} />
                                     {dragActive &&
                                         <div className='dl-hand-right'
                                              onMouseDown={this.handleMouseDown.bind(this, i, id, y)}
                                              onTouchStart={this.handleTouchStart.bind(this, i, id, y)}>
                                             <Icon className='pli-move' name='move' color='grey'/>
                                         </div>
                                     }
                                 </div>
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


export default DraggableListContainer