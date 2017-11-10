import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import config from 'env/config.client'
import { get, post } from 'core/client/services/core.api.services'
import ReactAudioPlayer from 'react-audio-player'
import socketServices from 'core/client/services/core.socket.services'
import { playOnPlaylist, playOnAlbum, playItem, pauseState, playState, updatePlaylistToPlay } from 'music/client/redux/actions'
import ps from 'folder/client/services/path.client.services'
import PlayHistory from './playHistory.client.components'
import { Label, Icon, Popup, Button, Grid } from 'semantic-ui-react'

import style from './style/audio.scss'

class AudioBar extends Component {

    constructor( props ) {

        super( props );

        this.socket = socketServices.getPublicSocket();

        this.onEndedHandler = this.onEndedHandler.bind(this);
        this.onPauseHandler = this.onPauseHandler.bind(this);
        this.onPlayHandler = this.onPlayHandler.bind(this);
        this.onCanPlayHandler = this.onCanPlayHandler.bind(this);
        this.onNextHandler = this.onNextHandler.bind(this);
        this.onPrevHandler = this.onPrevHandler.bind(this);
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

            // If playlist is playing, check if we need to move item played.
            if ( playingList.pl && playingList.pl.title === data.title ) {

                const oldTracks = playingList.pl.tracks;
                const newTracks = data.tracks;
                let newIndex = playingList.onPlayIndex;

                // If item playing moved, get his index.
                if( oldTracks[newIndex]._id !== newTracks[newIndex]._id ) {
                    newIndex = getTrackIndexById( oldTracks[newIndex]._id, newTracks );
                }

                // Update playing playlist and playIndex.
                updatePlayingList({
                    pl: data,
                    onPlayIndex: newIndex
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

        const { nextTracks, playingList, albumList } = this.props;
        const { onPlayIndex, pl, mode } = getActiveMode(playingList, albumList);

        const callback = (mode === 'Playlist') ? playOnPlaylist : playOnAlbum;

        // Test if playlist or album context.
        if ( pl !== null ) {

            // Test if not the last track.
            if ( onPlayIndex + 1 === pl.tracks.length ) return;
            nextTracks({
                onPlayIndex: onPlayIndex + 1,
                pl: pl,
            }, callback);
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

    onNextHandler(e) {
        const { nextTracks, playingList, albumList } = this.props;
        const { onPlayIndex, pl, mode } = getActiveMode(playingList, albumList);
        const callback = (mode === 'Album') ? playOnAlbum : playOnPlaylist;

        nextTracks({
            onPlayIndex: onPlayIndex + 1,
            pl: pl,
        }, callback);
    }

    onPrevHandler(e) {
        const { nextTracks, playingList, albumList } = this.props;
        const { onPlayIndex, pl, mode } = getActiveMode(playingList, albumList);
        const callback = (mode === 'Album') ? playOnAlbum : playOnPlaylist;

        nextTracks({
            onPlayIndex: onPlayIndex - 1,
            pl: pl,
        }, callback);
    }

    render(){

        const { duration, currentTime, visible } = this.state;
        const { onPlay, isPaused, playingList, albumList } = this.props;
        const { onPlayIndex, pl, mode } = getActiveMode(playingList, albumList);

        let audioEl = null;

        if( this.rap && this.rap.audioEl ) {
            audioEl = this.rap.audioEl;
            isPaused ? audioEl.pause() : audioEl.play();
        }

        const classes = ['audioBar'];
        if ( this.state.visible ) { classes.push('show'); }

        return (
            !!onPlay.src &&
                <div style={{width:'100%', position: 'fixed', bottom: '0'}} className={classes.join(' ')}>

                    <ReactAudioPlayer preload="auto" autoPlay
                                      onEnded={this.onEndedHandler}
                                      onCanPlay={this.onCanPlayHandler}
                                      ref={(element) => { this.rap = element; }}
                                      src={ `/api/music/read?path=${ps.urlEncode(onPlay.src)}` }
                    />

                    <Grid className='audioBarMenu' verticalAlign='middle' padded='horizontally'>

                        <Grid.Row>
                            <Grid.Column only='mobile' mobile='4' textAlign='left'>

                            </Grid.Column>
                            <Grid.Column only='computer tablet' computer='6' textAlign='right'>
                                <MetaNamePrevTracks pl={pl} onPlayIndex={onPlayIndex}/>
                            </Grid.Column>
                            <Grid.Column mobile='8' tablet='4' computer='4' textAlign='center'>
                                <PlayingControls onPauseHandler={this.onPauseHandler}
                                                 onPlayHandler={this.onPlayHandler}
                                                 onPrevHandler={this.onPrevHandler}
                                                 onNextHandler={this.onNextHandler}
                                                 onPlayIndex={onPlayIndex}
                                                 isPaused={isPaused}
                                                 onPlay={onPlay}
                                                 pl={pl}
                                />
                            </Grid.Column>
                            <Grid.Column only='computer tablet' computer='6' textAlign='left'>
                                <MetaNameNextTracks pl={pl} onPlayIndex={onPlayIndex}/>
                            </Grid.Column>
                            <Grid.Column only='mobile' mobile='4' textAlign='left'>
                                <MetaInfoPlaylistMini pl={pl} onPlayIndex={onPlayIndex} mode={mode}/>
                            </Grid.Column>
                        </Grid.Row>

                        <Grid.Row className='audioBar-range-row'>
                            <Grid.Column computer='4' verticalAlign='bottom' textAlign='left'>
                                <Label onClick={this.toggleVisible} size='large' color='teal'>
                                    Recent play
                                </Label>
                            </Grid.Column>

                            <Grid.Column computer='8'>
                                <MetaNameTracks onPlay={onPlay} />
                                <RangeSlider audioEl={audioEl} />
                                <MetaTimeTracksCurrent currentSlideTime={currentTime}/>
                                <MetaTimeTracksEnd duration={duration}/>
                            </Grid.Column>

                            <Grid.Column computer='4' textAlign='right'>
                                <MetaInfoPlaylist pl={pl} onPlayIndex={onPlayIndex} mode={mode}/>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>

                    <AudioBarBottom show={visible}/>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        onPlay: state.playlistStore.onPlay,
        playingList: state.playlistStore.playingList,
        albumList: state.playlistStore.albumList,
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
        nextTracks: ( item, callback ) => dispatch(
            callback( item )
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

    constructor() {
        super();

        this.progressHandler = this.progressHandler.bind(this);
        this.bufferHandler = this.bufferHandler.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);

        this.state = {
            buffer: 0,
            position: 0,
            elementX: 0,
            elementW: 0,
            isPressed: false,
        };
    }

    componentWillReceiveProps(nextProps) {

        const { audioEl } = nextProps;

        // Applying handlers on audio element.
        if( !this.props.audioEl && audioEl) {

            this.setProgressInterval();
            this.setBufferInterval();

            audioEl.addEventListener('play', () => {
                this.setProgressInterval();
            });

            audioEl.addEventListener('pause', () => {
                this.clearProgressInterval();
            });
        }
    }

    /**
     * Set an interval to call progressHandler.
     */
     setProgressInterval() {
        if (!this.progressInterval) {
            this.progressInterval = setInterval(() => {
                this.progressHandler();
            }, 500);
        }
    }

    /**
     * Clear the progress interval
     */
    clearProgressInterval() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    /**
     * Set an interval to call bufferHandler.
     */
    setBufferInterval() {
        if (!this.bufferInterval) {
            this.bufferInterval = setInterval(() => {
                this.bufferHandler();
            }, 1000);
        }
    }

    /**
     * Clear the buffer interval
     */
    clearBufferInterval() {
        if (this.bufferInterval) {
            clearInterval(this.bufferInterval);
            this.bufferInterval = null;
        }
    }

    bufferHandler() {

        const audio = this.props.audioEl;
        const duration = audio.duration;

        if (duration > 0) {
            for (let i = 0; i < audio.buffered.length; i++) {
                if (audio.buffered.start(audio.buffered.length - 1 - i) < audio.currentTime) {
                    const time = (audio.buffered.end(audio.buffered.length - 1 - i) / duration) * 100;
                    this.setState({
                        buffer: time,
                    });
                    break;
                }
            }
        }
    }

    progressHandler() {

        if( !this.state.isPressed ){

            const audio = this.props.audioEl;
            const time = (audio.currentTime / audio.duration) * 100;

            this.setState({
                position: time,
            });
        }
    }

    handleTouchStart(e){
        this.handleMouseDown(e.touches[0]);
    };

    handleTouchMove(e){
        e.preventDefault();
        this.handleMouseMove(e.touches[0]);
    };

    handleMouseDown({ pageX }) {

        const box = this.bar.getBoundingClientRect();

        this.setState({
            elementX: box.x,
            elementW: box.width,
            position: ((pageX - box.x) / box.width) * 100,
            isPressed: true,
        });
    }

    handleMouseMove({ pageX }) {

        if( this.state.isPressed ){

            const { elementX, elementW } = this.state;

            this.setState({
                position: ((pageX - elementX) / elementW) * 100,
            });
        }
    }

    handleMouseUp() {

        if( this.state.isPressed ) {
            const { position } = this.state;
            const audio = this.props.audioEl;

            audio.currentTime = ( position / 100 ) * audio.duration;

            this.setState({
                isPressed: false,
            });
        }
    }

    render() {

        console.log('RENDER RANGE');

        const { position, buffer } = this.state;

        return (
            <div className='pr-control-bar'
                 onMouseDown={this.handleMouseDown}
                 onMouseUp={this.handleMouseUp}
                 onMouseMove={this.handleMouseMove}
                 onTouchStart={this.handleTouchStart}
                 ref={(bar) => { this.bar = bar; }}
            >
                <div className='pr-bar pr-bar-line'></div>
                <div className='pr-bar pr-bar-buffed' style={{width:`${buffer}%`}}></div>
                <div className='pr-bar pr-bar-played' style={{width:`${position}%`}}></div>
                <div className='pr-bar-handler' style={{left:`${position}%`}}></div>
            </div>
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
                <Button circular inverted size='massive' icon='pause' onClick={onPauseHandler} />
            );
            // Else display Play button.
            else return (
                <Button circular inverted size='massive' icon='play' onClick={onPlayHandler} />
            );
        };

        const leftBtn = () => {
            if (pl) {
                const disabled = ( onPlayIndex === 0 );
                return (
                    <Button circular inverted icon='left chevron' disabled={disabled} onClick={onPrevHandler} />
                );
            }
            return null;
        };

        const rightBtn = () => {
            if (pl) {
                const disabled = ( onPlayIndex + 1 === pl.tracks.length );
                return (
                    <Button circular inverted icon='right chevron' disabled={disabled} onClick={onNextHandler} />
                );
            }
            return null;
        };

        return (
            <span className='playingControl'>
                {leftBtn()}
                {playPauseBtn()}
                {rightBtn()}
            </span>
        );
    }
}

class MetaNameTracks extends Component {

    shouldComponentUpdate(nextProps) {
        const { onPlay } = nextProps;
        return ( onPlay !== this.props.onPlay );
    }

    splitStr(str, handler) {

        const regex = /(\/([^\/]*))/ig;

        let path = '';
        let result = [];
        let m;

        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            path += m[0];

            result.push({
                content: m[2],
                path: path,
            });
        }

        result[result.length - 1].path = null;

        return result;
    }

    render() {
            const { onPlay } = this.props;
            const items = this.splitStr(onPlay.src);

            const bread = items.map( ( item, i ) => {

                const l = items.length;
                const width = `${(100 - 65) / (l - 1)}%`;

                if ( item.path ) {
                    return (
                    <Popup
                        key={i}
                        trigger={<span className='metaOnPlayInfo-link'><Link to={`/music${item.path}`} style={{maxWidth:width}}>{item.content}</Link><Icon name='angle right'/></span>}
                        content={item.content}
                        inverted
                    />
                    );
                }

                const name = item.content.replace(config.fileSystem.fileAudioTypes, '');

                return (
                    <Popup
                        key={i}
                        trigger={<span style={{maxWidth:'65%'}} className='metaOnPlayInfo-play'>{name}</span>}
                        content={name}
                        inverted
                    />
                );
            });

            return (
                <span className='metaOnPlayInfo' style={{textAlign:'left'}}>
                    {bread}
                </span>
            );
        };
    }

class MetaNameNextTracks extends Component {

    shouldComponentUpdate(nextProps) {
        const { onPlayIndex, pl } = nextProps;
        return ( pl !== this.props.pl || onPlayIndex !== this.props.onPlayIndex );
    }

    render() {
        const { onPlayIndex, pl } = this.props;
        const name = (pl && pl.tracks[onPlayIndex + 1]) ? pl.tracks[onPlayIndex + 1].name : null;

        return (
            name && <span><Label color='teal' pointing='right'>Next</Label>{`${name}`}</span>
        );
    };
}

class MetaNamePrevTracks extends Component {

    shouldComponentUpdate(nextProps) {
        const { onPlayIndex, pl } = nextProps;
        return ( pl !== this.props.pl || onPlayIndex !== this.props.onPlayIndex );
    }

    render() {
        const { onPlayIndex, pl } = this.props;
        const name = (pl && pl.tracks[onPlayIndex - 1]) ? pl.tracks[onPlayIndex - 1].name : null;

        return (
            name && <span>{`${name}`}<Label color='teal' pointing='left'>Prev</Label></span>
        );
    };
}

class MetaTimeTracksCurrent extends Component {

    shouldComponentUpdate(nextProps) {
        const { currentSlideTime } = nextProps;
        return ( currentSlideTime !== this.props.currentSlideTime );
    }

    render() {

        const { currentSlideTime } = this.props;
        const cst = getFormatedTime(currentSlideTime);

        return (
            <span>
                {`${cst}`}
            </span>
        );
    };
}

class MetaTimeTracksEnd extends Component {

    shouldComponentUpdate(nextProps) {
        const { duration } = nextProps;
        return ( duration !== this.props.duration );
    }

    render() {

        const { duration } = this.props;
        const dur = getFormatedTime(duration);

        return (
            <span style={{float:'right'}}>
                {`${dur}`}
            </span>
        );
    };
}

class MetaInfoPlaylist extends Component {

    shouldComponentUpdate(nextProps) {
        const { onPlayIndex, pl } = nextProps;
        return ( pl !== this.props.pl || onPlayIndex !== this.props.onPlayIndex );
    }

    render() {
        const { pl, onPlayIndex, mode } = this.props;

        if (pl) {

            let title = pl.title;
            let path = `/${mode.toLowerCase()}`;

            // If pl is album, use folder path to construct link path.
            if ( pl.path ) {
                path += pl.path;
            }

            // Else if pl is Queue.
            else if (pl.defaultPlaylist) {
                title = title.replace('__def', '');
                path = '/queue';
            }

            // Else, pl is playlist, just construct link path with title.
            else {
                path += `/${title}`;
            }

            return (
                <div>
                    <Link as='span' to={path}>
                        <span className='audioBar-info-playlist-name'>{title}</span><br/>
                        <Label size='large' color='teal'>
                            {mode}
                            <Label.Detail>{`${onPlayIndex + 1}/${pl.tracks.length}`}</Label.Detail>
                        </Label>
                    </Link>
                </div>
            );
        }
        return null;
    };
}

class MetaInfoPlaylistMini extends Component {

    shouldComponentUpdate(nextProps) {
        const { onPlayIndex, pl } = nextProps;
        return ( pl !== this.props.pl || onPlayIndex !== this.props.onPlayIndex );
    }

    render() {
        const { pl, onPlayIndex, mode } = this.props;

        if (pl) {
            return (
                    <Link as='span'  to={`/${mode.toLowerCase()}/${pl.title}`}>
                        <Label color='teal'>
                            {`${mode}`}
                            <Label.Detail>{`${onPlayIndex + 1}/${pl.tracks.length}`}</Label.Detail>
                        </Label>
                    </Link>
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

function getActiveMode( playingList, albumList ) {

    if ( playingList && playingList.pl !== null ) {
        const { onPlayIndex, pl } = playingList;

        return {
            pl: pl,
            onPlayIndex: onPlayIndex,
            mode: pl.defaultPlaylist ? 'Queue' : 'Playlist'
        }
    }

    if ( albumList && albumList.pl !== null ) {
        const { onPlayIndex, pl } = albumList;
        return {
            pl: pl,
            onPlayIndex: onPlayIndex,
            mode: 'Album'
        }
    }

    return {
        pl: null,
        onPlayIndex: 0,
        mode: 'Free',
    }
}

function getTrackIndexById( id, array ) {
    let l = array.length;
    for( let i=0; i < l; i++ ) {
        if( array[i]._id == id ) return i;
    }
    return null;
}

export default AudioBarContainer