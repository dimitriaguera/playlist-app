/**
 * Created by Dimitri on 22/10/2017.
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import {Motion, spring} from 'react-motion'
import _ from 'lodash'

import style from './style/draggableList.scss'

const springConfig = {stiffness: 300, damping: 50};

class DraggableList extends Component {

    constructor( props ) {

        super( props );

        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);

        this.state = {
            order: _.range(props.items.length),
            h: 60,
            delta: 0,
            mouseY: 0,
            isPressed: false,
            originalPosOfLastPressed: 0,
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
            console.log('NEW ORDER');
            this.setState({
                order: _.range(items.length),
            });
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        console.log('shouldUpdate : ', ( !this.props.items.length || this.state.isPressed || (nextProps.items.title !== this.props.items.title) ));
        return ( !this.props.items.length || this.state.isPressed || (nextProps.items.title !== this.props.items.title) );
    }

    handleTouchStart(key, pressLocation, e){
        this.handleMouseDown(key, pressLocation, e.touches[0]);
    };

    handleTouchMove(e){
        e.preventDefault();
        this.handleMouseMove(e.touches[0]);
    };

    handleMouseUp() {

        const { currentRow, originalPosOfLastPressed } = this.state;
        const { callbackMouseUp, items } = this.props;

        let newItems = items;

        if (currentRow !== originalPosOfLastPressed){

            newItems = reinsert(newItems, originalPosOfLastPressed, currentRow);

            callbackMouseUp( newItems );

            // this.setState({
            //     items: newItems,
            // });
        }

        this.setState({
            isPressed: false,
            delta: 0,
            currentRow: 0,
        });
    }

    handleMouseMove({pageY}) {

        const {h, isPressed, delta, order, originalPosOfLastPressed} = this.state;
        const orderCount = order.length;

        if (isPressed) {
            const mouseY = pageY - delta;
            const currentRow = clamp(Math.round(mouseY / h), 0, orderCount );

            let newOrder = order;

            const lastRow = order.indexOf(originalPosOfLastPressed);

            if (currentRow !== lastRow){
                newOrder = reinsert(order, lastRow, currentRow);
            }

            this.setState({mouseY: mouseY, order: newOrder, currentRow: currentRow});
        }
    }


    handleMouseDown(pos, pressY, {pageY}){
        this.setState({
            delta: pageY - pressY,
            mouseY: pressY,
            isPressed: true,
            originalPosOfLastPressed: pos,
        });
    };

    render() {

        const { h, order, mouseY, isPressed, originalPosOfLastPressed } = this.state;
        const { items } = this.props;

         return (
             <div className='dl dl-container'>
                 {order.map( ( itemNumber, i ) =>{

                     const style = originalPosOfLastPressed === i && isPressed
                         ? {
                             scale: spring(1.1, springConfig),
                             shadow: spring(16, springConfig),
                             y: mouseY,
                             itemNumber: itemNumber,
                             itemIndex: i,
                         }
                         : {
                             scale: spring(1, springConfig),
                             shadow: spring(1, springConfig),
                             y: spring(order.indexOf(i) * h, springConfig),
                             itemNumber: itemNumber,
                             itemIndex: i,
                         };

                     return (

                         <Motion style={style} key={i}>
                             {({scale, shadow, y, itemIndex}) =>
                                 <div
                                     onMouseDown={this.handleMouseDown.bind(this, i, y)}
                                     onTouchStart={this.handleTouchStart.bind(this, i, y)}
                                     className="dl-item"
                                     style={{
                                         boxShadow: `rgba(0, 0, 0, 0.2) 0px ${shadow}px ${2 * shadow}px 0px`,
                                         transform: `translate3d(0, ${y}px, 0) scale(${scale})`,
                                         WebkitTransform: `translate3d(0, ${y}px, 0) scale(${scale})`,
                                         zIndex: i === originalPosOfLastPressed ? 99 : i,
                                     }}>
                                     {/*{item.name}*/}
                                     {items[itemIndex].name}
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