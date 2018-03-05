import React, { Component } from 'react'
import { Label } from 'semantic-ui-react'

class MetaNameNextTracks extends Component {
  shouldComponentUpdate (nextProps) {
    const { onPlayIndex, pl } = nextProps;
    return (pl !== this.props.pl || onPlayIndex !== this.props.onPlayIndex);
  }

  render () {
    const { onPlayIndex, pl } = this.props;
    const name = (pl && pl.tracks[onPlayIndex + 1]) ? pl.tracks[onPlayIndex + 1].publicName : null;

    return (
      name && <span><Label color='teal' pointing='right'>Next</Label>{`${name}`}</span>
    );
  };
}

class MetaNamePrevTracks extends Component {
  shouldComponentUpdate (nextProps) {
    const { onPlayIndex, pl } = nextProps;
    return (pl !== this.props.pl || onPlayIndex !== this.props.onPlayIndex);
  }

  render () {
    const { onPlayIndex, pl } = this.props;
    const name = (pl && pl.tracks[onPlayIndex - 1]) ? pl.tracks[onPlayIndex - 1].publicName : null;

    return (
      name && <span>{`${name}`}<Label color='teal' pointing='left'>Prev</Label></span>
    );
  };
}

export {
  MetaNameNextTracks,
  MetaNamePrevTracks
}
