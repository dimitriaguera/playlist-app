import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { get, post } from 'core/client/services/core.api.services'
import ReactAudioPlayer from 'react-audio-player'
import socketServices from 'core/client/services/core.socket.services'
import { playOnPlaylist, playItem, pauseState, playState, updatePlaylistToPlay } from 'music/client/redux/actions'
import PlayList from './playlist.client.components'
import PlayHistory from './playHistory.client.components'
import { Menu, Icon, Popup, Button, Sidebar } from 'semantic-ui-react'
import noUiSlider from 'nouislider'

import style from './style/nouislider.min.css'
import style2 from './style/audio.scss'

class AudioBar extends Component {

    constructor( props ) {

        super( props );

        this.socket = socketServices.getPublicSocket();

        this.onEndedHandler = this.onEndedHandler.bind(this);
        this.onPauseHandler = this.onPauseHandler.bind(this);
        this.onPlayHandler = this.onPlayHandler.bind(this);
        this.onCanPlayHandler = this.onCanPlayHandler.bind(this);
        this.onListen = this.onListen.bind(this);
        this.onNextHandler = this.onNextHandler.bind(this);
        this.onPrevHandler = this.onPrevHandler.bind(this);
        this.onChangeHandler = this.onChangeHandler.bind(this);
        this.onStartSlideHandler = this.onStartSlideHandler.bind(this);
        this.onEndSlideHandler = this.onEndSlideHandler.bind(this);

        this.toggleVisible = this.toggleVisible.bind(this);

        this.state = {
            currentSlideTime: null,
            currentTime: null,
            duration: null,
            visible: false,
        };
    }

    componentWillMount() {
        const _self = this;

        this.socket.on('save:playlist', (data) => {

            const { playingList, updatePlayingList } = _self.props;

            if ( playingList.pl && playingList.pl.title === data.title ) {
                updatePlayingList({
                    pl: data,
                    onPlayIndex: playingList.onPlayIndex
                });
            }
        });
    }

    componentWillUnmount() {
        this.socket.disconnect();
        console.log("Disconnecting Socket as component will unmount");
    }

    toggleVisible() {
        this.setState({ visible: !this.state.visible });
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

    onPlayHandler(e) {
        this.props.play();
    };

    onPauseHandler(e) {
        this.props.pause();
    }

    onCanPlayHandler(e) {
        this.setState({
            currentTime: this.rap.audioEl.currentTime,
            duration: this.rap.audioEl.duration,
        });
    }

    onListen(e) {
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
        const { duration } = this.state;
        const time = ( duration * value )/100 ;

        this.rap.audioEl.currentTime = time;

        this.setState({
            currentTime: time,
        });
    }

    onStartSlideHandler() {
        if ( !this.rap ) return;
        this.rap.audioEl.pause();
    }

    onEndSlideHandler() {
        if ( !this.rap ) return;
        this.rap.audioEl.play();
    }

    render(){

        const { duration, currentTime, visible } = this.state;
        const { onPlay, isPaused, playingList } = this.props;
        const { onPlayIndex, pl } = playingList;

        if ( this.rap ) {
            isPaused ? this.rap.audioEl.pause() : this.rap.audioEl.play();
        }

        const classes = ['audioBar'];
        if ( this.state.visible ) { classes.push('show'); }

        return (
            !!onPlay.src &&
                <div style={{width:'100%', position: 'fixed', bottom: '0'}} className={classes.join(' ')}>
                    <ReactAudioPlayer preload="auto" autoPlay listenInterval={1000}
                                      onEnded={this.onEndedHandler}
                                      onCanPlay={this.onCanPlayHandler}
                                      onListen={this.onListen}
                                      ref={(element) => { this.rap = element; }}
                                      src={ `/api/music/read?path=${onPlay.src}` }
                    />
                    <Menu className='audioBarMenu' color='black' secondary={false} inverted={true} attached='top' size="small">
                        <PlayingControls onPauseHandler={this.onPauseHandler}
                                         onPlayHandler={this.onPlayHandler}
                                         onPrevHandler={this.onPrevHandler}
                                         onNextHandler={this.onNextHandler}
                                         onPlayIndex={onPlayIndex}
                                         isPaused={isPaused}
                                         onPlay={onPlay}
                                         pl={pl}
                        />

                        <Menu.Item>
                            <Button inverted onClick={this.toggleVisible}>Hist</Button>
                        </Menu.Item>

                        <MetaTimeTracks duration={duration} currentSlideTime={currentTime}/>
                        <RangeSlider duration={duration}
                                     currentTime={currentTime}
                                     onChange={this.onChangeHandler}
                                     onStartSlide={this.onStartSlideHandler}
                                     onEndSlide={this.onEndSlideHandler}
                        />
                        <MetaNameTracks onPlay={onPlay} />
                        <MetaInfoPlaylist pl={pl} onPlayIndex={onPlayIndex} />
                    </Menu>
                    <AudioBarBottom show={visible}/>
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
        updatePlayingList: ( item ) => dispatch(
            updatePlaylistToPlay( item )
        ),
    }
};

const AudioBarContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(AudioBar);



class RangeSlider extends Component {

    componentDidMount() {

        const _self = this;
        const elmt = this.elmt;
        const { onChange, onSlide, onStartSlide, onEndSlide } = this.props;

        noUiSlider.create(elmt, {
            start: 0,
            connect: [true, false],
            range: {
                'min': [ 0 ],
                'max': [ 100 ],
            }
        });

        elmt.noUiSlider.on('change', (value, handle) => {
            onChange(value);
        });

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
            <Menu.Menu>
                <Menu.Item>
                    <div className='playerRange'
                        ref={(elmt) => { this.elmt = elmt; }}
                    ></div>
                </Menu.Item>
            </Menu.Menu>
        );
    }
}

class AudioBarBottom extends Component {

    render(){

        const classes = ['audioBarBottom'];
        if ( this.props.show ) { classes.push('show'); }

        return (
            <div className={classes.join(' ')}>
                <PlayHistory/>
            </div>
        )
    };
}

class PlayingControls extends Component {

    shouldComponentUpdate(nextProps) {
        const { isPaused, pl, onPlay } = nextProps;
        return ( isPaused !== this.props.isPaused || pl !== this.props.pl || onPlay !== this.props.onPlay );
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
                {leftBtn()}
                {playPauseBtn()}
                {rightBtn()}
            </Menu.Menu>
        );
    }
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
        const cst = getFormatedTime(currentSlideTime);
        const dur = getFormatedTime(duration);

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
        const { pl, onPlayIndex } = nextProps;
        return ( pl !== this.props.pl || onPlayIndex !== this.props.onPlayIndex );
    }

    render() {
        const { pl, onPlayIndex } = this.props;
        if (pl) {
            return (
                <Menu.Menu position='right'>
                    <Menu.Item as={Link} to={`/playlist/${pl.title}`}>
                        {`Playlist : ${pl.title}`}
                        {`${onPlayIndex + 1}/${pl.tracks.length}`}
                    </Menu.Item>
                    <Menu.Item>
                        <Popup
                            trigger={<Button>List</Button>}
                            flowing
                            on='click'
                        >
                            <PlayList match={{params:{title:pl.title}}} />
                        </Popup>
                    </Menu.Item>
                </Menu.Menu>
            );
        }
        return null;
    };
}


// HELPER
function getFormatedTime( time ) {

    let s = parseInt(time % 60);
    let m = parseInt((time / 60) % 60);

    s = (s >= 10) ? s : "0" + s;
    m = (m >= 10) ? m : "0" + m;

    return m + ':' + s ;
}

export default AudioBarContainer