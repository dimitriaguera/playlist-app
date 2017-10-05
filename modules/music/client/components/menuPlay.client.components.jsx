import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { get, post } from 'core/client/services/core.api.services'
import { playOnPlaylist, playItem, pauseState, playState } from 'music/client/redux/actions'
import { Menu, Icon } from 'semantic-ui-react'

class MenuPlay extends Component {

    onPlay() {

        const _self = this;
        const pl = _self.props.playlist;

        return (e) => {

            if ( _self.props.playingList.pl === pl ) {
                _self.props.play();
            }
            else {
                _self.props.onPlay({
                    pl: pl,
                    onPlayIndex: 0,
                });
            }
        }
    };

    onPause() {
        const _self = this;
        return (e) => {
            _self.props.onPause();
        }
    }

    onNext() {
        const _self = this;
        const { nextTracks, playingList } = _self.props;
        const { onPlayIndex, pl } = playingList;

        return (e) => {
            nextTracks({
                onPlayIndex: onPlayIndex + 1,
                pl: pl,
            });
        }
    }

    onPrev() {
        const _self = this;
        const { nextTracks, playingList } = _self.props;
        const { onPlayIndex, pl } = playingList;

        return (e) => {
            nextTracks({
                onPlayIndex: onPlayIndex - 1,
                pl: pl,
            });
        }
    }

    onShuffle(e) {

    }

    render(){

        const { playingList, playlist, isPaused, attached, isMini, color = 'blue' } = this.props;
        const { onPlayIndex, pl } = playingList;

        // Test if menu linked with active playlist.
        const isActive = playingList.pl && (playingList.pl.title === playlist.title);
        const disable = ( !playlist.tracks.length );
        const status = isPaused ? 'Pause' : 'Play';

        const playPauseBtn = () => {
            // If active playlist and on play, display Pause button.
            if ( isActive && !isPaused ) return (
                <Menu.Item onClick={this.onPause()}>
                    <Icon name='pause' />
                </Menu.Item>
            );
            // Else display Play button.
            else return (
            <Menu.Item disabled={disable} onClick={this.onPlay()}>
                <Icon disabled={disable} name='play' />
            </Menu.Item>
            );
        };

        const leftBtn = () => {
            if ( isActive ) {
                const disabled = ( onPlayIndex === 0 );
                return (
                    <Menu.Item disabled={disabled} onClick={this.onPrev()}>
                        <Icon disabled={disabled} name='left chevron' />
                    </Menu.Item>
                );
            }
            return null;
        };

        const rightBtn = () => {
            if ( isActive ) {
                const disabled = ( onPlayIndex + 1 === pl.tracks.length );
                return (
                    <Menu.Item disabled={disabled} onClick={this.onNext()}>
                        <Icon disabled={disabled} name='right chevron' />
                    </Menu.Item>
                );
            }
            return null;
        };

        const metaNumTracks = () => {
            if ( isActive ) {
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

        const metaStatusTracks = () => {
            if ( isActive ) {
                return (
                    <Menu.Menu position='right'>
                        <Menu.Item>
                            {`...on${status}`}
                        </Menu.Item>
                    </Menu.Menu>
                );
            }
            return null;
        };

        const metaNameTracks = () => {
            if ( !isMini && isActive ) {
                return (
                    <Menu.Menu>
                        <Menu.Item>
                            {`${pl.tracks[onPlayIndex].name}`}
                        </Menu.Item>
                    </Menu.Menu>
                );
            }
            return null;
        };

        const metaInfoPlaylist = () => {
            if ( !isMini && isActive ) {
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

        return (
            <Menu color={color} secondary={isMini} inverted={isActive} attached={attached} size="small">
                {leftBtn()}
                {playPauseBtn()}
                {rightBtn()}
                {metaNumTracks()}
                {metaNameTracks()}
                {metaStatusTracks()}
                {metaInfoPlaylist()}
            </Menu>
        );
    }
}

const mapStateToProps = state => {
    return {
        playingList: state.playlistStore.playingList,
        isPaused: state.playlistStore.pause,
    }
};

const mapDispatchToProps = dispatch => {
    return {
        onPlay: ( item ) => dispatch(playOnPlaylist(item)),
        onPause: ( item ) => dispatch(pauseState()),
        play: () => dispatch(playState()),
        nextTracks: ( item ) => dispatch(
            playOnPlaylist( item )
        ),
    }
};

const MenuPlayContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(MenuPlay);

export default MenuPlayContainer