import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { get, post } from 'core/client/services/core.api.services'
import ReactAudioPlayer from 'react-audio-player'
import { playOnPlaylist, playItem, pauseState, playState } from 'music/client/redux/actions'
import { Menu, Icon } from 'semantic-ui-react'
import noUiSlider from 'nouislider'

import style from './nouislider.min.css'

class Audio extends Component {

    constructor( props ) {

        super( props );

        this.onEndedHandler = this.onEndedHandler.bind(this);
        this.onPauseHandler = this.onPauseHandler.bind(this);
        this.onPlayHandler = this.onPlayHandler.bind(this);
        this.onCanPlayHandler = this.onCanPlayHandler.bind(this);
        this.onListen = this.onListen.bind(this);
        this.onNextHandler = this.onNextHandler.bind(this);
        this.onPrevHandler = this.onPrevHandler.bind(this);
        this.onChangeHandler = this.onChangeHandler.bind(this);
        // this.onSlideHandler = this.onSlideHandler.bind(this);
        this.onStartSlideHandler = this.onStartSlideHandler.bind(this);
        this.onEndSlideHandler = this.onEndSlideHandler.bind(this);

        this.state = {
            currentSlideTime: null,
            currentTime: null,
            duration: null,
        };
    }

    /**
     * Switch to next Track on current playing track ends.
     * @param e
     */
    onEndedHandler(e) {

        const { playingList, nextTracks } = this.props;

        // Test if playlist context.
        if ( playingList && playingList.pl !== null ) {

            const { onPlayIndex, pl } = playingList;

            // Test if not the last track.
            if ( onPlayIndex + 1 === pl.tracks.length ) return;
            nextTracks({
                onPlayIndex: onPlayIndex + 1,
                pl: pl,
            });
        }
    }


    // MENU HERITAGE

    onPlayHandler(e) {
        this.rap.audioEl.play();
        this.props.play();

    };

    onPauseHandler(e) {
        this.rap.audioEl.pause();
        this.props.pause();

    }

    onCanPlayHandler(e) {
        this.setState({
            currentTime: this.rap.audioEl.currentTime,
            duration: this.rap.audioEl.duration,
        });
    }

    onListen(e) {
        console.log(this.rap.audioEl.currentTime);
        console.log(this.rap.audioEl.duration);

        this.setState({
            currentTime: this.rap.audioEl.currentTime
        });
    }

    onNextHandler(e) {
        const { nextTracks, playingList } = this.props;
        const { onPlayIndex, pl } = playingList;

        nextTracks({
            onPlayIndex: onPlayIndex + 1,
            pl: pl,
        });
    }

    onPrevHandler(e) {
        const { nextTracks, playingList } = this.props;
        const { onPlayIndex, pl } = playingList;

        nextTracks({
            onPlayIndex: onPlayIndex - 1,
            pl: pl,
        });
    }

    onChangeHandler( value ) {

        console.log('time update value: ' + value);

        const { duration } = this.state;
        const time = ( duration * value )/100 ;

        console.log('time update value after process: ' + time);

        this.rap.audioEl.currentTime = time;

        this.setState({
            currentTime: time,
        });
    }

    // onSlideHandler( value ) {
    //
    //     const { duration } = this.state;
    //     const time = ( duration * value )/100 ;
    //
    //     this.setState({
    //         currentSlideTime: time
    //     });
    // }

    onStartSlideHandler() {
        if ( !this.rap ) return;
        this.rap.audioEl.pause();
    }

    onEndSlideHandler() {
        if ( !this.rap ) return;
        this.rap.audioEl.play();
    }

    render(){

        const { duration, currentTime, currentSlideTime } = this.state;
        const { onPlay, isPaused, playingList } = this.props;
        const { onPlayIndex, pl } = playingList;

        const status = isPaused ? 'Pause' : 'Play';

        console.log('RENDER MENUPLAY');

        return (
            !!onPlay.src &&
            <div style={{width:'100%', position: 'fixed', bottom: '0', lineHeight: '0'}}>

                <ReactAudioPlayer
                    preload="auto"
                    autoPlay
                    listenInterval={1000}
                    onEnded={this.onEndedHandler}
                    onCanPlay={this.onCanPlayHandler}
                    onListen={this.onListen}
                    ref={(element) => { this.rap = element; }}
                    src={`/api/music/read?path=${onPlay.src}`}
                />

                <Menu color='black' secondary={false} inverted={true} attached='top' size="small">

                    <PlayingControls
                        onPauseHandler={this.onPauseHandler}
                        onPlayHandler={this.onPlayHandler}
                        onPrevHandler={this.onPrevHandler}
                        onNextHandler={this.onNextHandler}
                        onPlayIndex={onPlayIndex}
                        isPaused={isPaused}
                        pl={pl}
                    />


                    <Menu.Menu>
                        <Menu.Item>
                            <RangeSlider
                                duration={duration}
                                currentTime={currentTime}
                                onChange={this.onChangeHandler}
                                // onSlide={this.onSlideHandler}
                                onStartSlide={this.onStartSlideHandler}
                                onEndSlide={this.onEndSlideHandler}
                            />
                        </Menu.Item>
                    </Menu.Menu>

                    <MetaTimeTracks duration={duration} currentSlideTime={currentTime}/>
                    <MetaNumTracks pl={pl} onPlayIndex={onPlayIndex} />
                    <MetaNameTracks onPlay={onPlay} />
                    <MetaStatusTracks status={status} />
                    <MetaInfoPlaylist pl={pl} />
                </Menu>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        onPlay: state.playlistStore.onPlay,
        playingList: state.playlistStore.playingList,
        activePlaylist: state.playlistStore.activePlaylist,
        isPaused: state.playlistStore.pause,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        pause: () => dispatch(
            pauseState()
        ),
        play: () => dispatch(
            playState()
        ),
        nextTracks: ( item ) => dispatch(
            playOnPlaylist( item )
        ),
    }
};

const AudioContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(Audio);



class RangeSlider extends Component {

    componentDidMount() {

        const _self = this;
        const elmt = this.elmt;
        const { onChange, onSlide, onStartSlide, onEndSlide } = this.props;

        noUiSlider.create(elmt, {
            start: [ 0 ],
            range: {
                'min': [ 0 ],
                'max': [ 100 ]
            }
        });

        elmt.noUiSlider.on('change', (value, handle) => {
            onChange(value);
        });

        // elmt.noUiSlider.on('slide', (value, handle) => {
        //     onSlide(value);
        // });

        elmt.noUiSlider.on('start', () => {
            onStartSlide();
        });

        elmt.noUiSlider.on('end', () => {
            onEndSlide();
        });
    }

    componentWillReceiveProps(nextProps) {

        const elmt = this.elmt;
        const { currentTime, duration } = nextProps;
        const time = parseInt(((currentTime / duration) * 100), 10);

        elmt.noUiSlider.set(time);
    }

    shouldComponentUpdate(nextProps) {
        const { currentTime } = nextProps;
        return ( currentTime === this.props.currentTime );
    }

    render() {

        console.log('RENDER RANGE');
        const { duration } = this.props;

        return (
            <div>
                <div
                    ref={(elmt) => { this.elmt = elmt; }}
                    style={{ width: '100px' }}
                ></div>
            </div>
        );
    }
}

class PlayingControls extends Component {

    shouldComponentUpdate(nextProps) {
        const { isPaused } = nextProps;
        return ( isPaused !== this.props.isPaused );
    }

    render() {

        console.log('RENDER PLAYING CONTROLS');

        const { onPauseHandler, onPlayHandler, onPrevHandler, onNextHandler, onPlayIndex, pl, isPaused} = this.props;

        const playPauseBtn = () => {
            // If active playlist and on play, display Pause button.
            if (!isPaused) return (
                <Menu.Item onClick={onPauseHandler}>
                    <Icon name='pause'/>
                </Menu.Item>
            );
            // Else display Play button.
            else return (
                <Menu.Item onClick={onPlayHandler}>
                    <Icon name='play'/>
                </Menu.Item>
            );
        };

        const leftBtn = () => {
            if (pl) {
                const disabled = ( onPlayIndex === 0 );
                return (
                    <Menu.Item disabled={disabled} onClick={onPrevHandler}>
                        <Icon disabled={disabled} name='left chevron'/>
                    </Menu.Item>
                );
            }
            return null;
        };

        const rightBtn = () => {
            if (pl) {
                const disabled = ( onPlayIndex + 1 === pl.tracks.length );
                return (
                    <Menu.Item disabled={disabled} onClick={onNextHandler}>
                        <Icon disabled={disabled} name='right chevron'/>
                    </Menu.Item>
                );
            }
            return null;
        };

        return (
            <Menu.Menu>
                {playPauseBtn()}
                {leftBtn()}
                {rightBtn()}
            </Menu.Menu>
        );
    }
}

class MetaNumTracks extends Component {

    shouldComponentUpdate(nextProps) {
        const { pl, onPlayIndex } = nextProps;
        return ( pl !== this.props.pl || onPlayIndex !== this.props.onPlayIndex );
    }

    render() {
        const { pl, onPlayIndex } = this.props;
        if (pl) {
            return (
                <Menu.Menu>
                    <Menu.Item>
                        {`${onPlayIndex + 1}/${pl.tracks.length}`}
                    </Menu.Item>
                </Menu.Menu>
            );
        }
        return null;
    };
}

class MetaStatusTracks extends Component {

    shouldComponentUpdate(nextProps) {
        const { status } = nextProps;
        return ( status !== this.props.status );
    }

    render() {
        const { status } = this.props;
        return (
            <Menu.Menu position='right'>
                <Menu.Item>
                    {`...on${status}`}
                </Menu.Item>
            </Menu.Menu>
        );
    };
}

class MetaNameTracks extends Component {

    shouldComponentUpdate(nextProps) {
        const { onPlay } = nextProps;
        return ( onPlay !== this.props.onPlay );
    }

    render() {
        const { onPlay } = this.props;
        return (
            <Menu.Menu>
                <Menu.Item>
                    {`${onPlay.name}`}
                </Menu.Item>
            </Menu.Menu>
        );
    };
}

class MetaTimeTracks extends Component {

    shouldComponentUpdate(nextProps) {
        const { currentSlideTime } = nextProps;
        return ( currentSlideTime !== this.props.currentSlideTime );
    }

    render() {

        const { currentSlideTime, duration } = this.props;

        let s = parseInt(currentSlideTime % 60);
        let m = parseInt((currentSlideTime / 60) % 60);

        s = (s >= 10) ? s : "0" + s;
        m = (m >= 10) ? m : "0" + m;
        const cst = m + ':' + s ;

        s = parseInt(duration % 60);
        m = parseInt((duration / 60) % 60);

        s = (s >= 10) ? s : "0" + s;
        m = (m >= 10) ? m : "0" + m;

        const dur = m + ':' + s ;

        return (
            <Menu.Menu>
                <Menu.Item>
                    {`${cst} / ${dur}`}
                </Menu.Item>
            </Menu.Menu>
        );
    };
}

class MetaInfoPlaylist extends Component {

    shouldComponentUpdate(nextProps) {
        const { pl } = nextProps;
        return ( pl !== this.props.pl );
    }

    render() {
        const { pl } = this.props;
        if (pl) {
            return (
                <Menu.Menu position='right'>
                    <Menu.Item as={Link} to={`/playlist/${pl.title}`}>
                        {`Playlist : ${pl.title}`}
                    </Menu.Item>
                </Menu.Menu>
            );
        }
        return null;
    };
}

export default AudioContainer