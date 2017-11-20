/**
 * Created by Dimitri on 22/10/2017.
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import {Motion, spring} from 'react-motion'

import style from './style/transitionList.scss'

const springConfig = {stiffness: 300, damping: 50};

class TransitionList extends Component {

    constructor( props ) {

        super( props );
        this.handleOnScroll = this.handleOnScroll.bind(this);

        this.state = {
            items: props.items,
            range_array: getDisplayedItems( props.items, (props.height || 70) ),
            h: props.height || 70,
            containerHeight: `${props.items.length * (props.height || 70)}px`,
        }
    }

    componentDidMount() {
        window.addEventListener('scroll', this.handleOnScroll);
    };

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleOnScroll, false);
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

    render() {

        const { h, items, range_array, containerHeight } = this.state;
        const { component: Component, color, ...props } = this.props;
        const classes = ['tl', 'tl-container'];

        const range = items.slice( range_array[0], range_array[1] );

        if( color ) classes.push( color );

         return (
             <div className={classes.join(' ')} style={{minHeight:containerHeight}}>
                 {range.map( ( item, i ) =>{

                     let id = item._id || item.name;
                     let realIndex = i + range_array[0];
                     let classes = ['tl-item'];

                     const style = {
                             y: spring( realIndex * h, springConfig),
                             opacity: spring(1, springConfig),
                         };

                     return (
                         <Motion style={style}
                                 defaultStyle={{
                                     opacity: 0,
                                     y: realIndex * h,
                                 }}
                                 key={id}>
                             {({y, opacity}) => {

                                 return (
                                     <div className={classes.join(' ')}
                                          style={{
                                             opacity: `${opacity}`,
                                             transform: `translate3d(0, ${y}px, 0)`,
                                             WebkitTransform: `translate3d(0, ${y}px, 0)`,
                                             height:`${h}px`,
                                          }}>
                                         <Component item={item} index={realIndex} {...props} />
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


export default TransitionList